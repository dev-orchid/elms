import { supabase } from '../../lib/supabase.js';
import { AppError, NotFoundError, UnauthorizedError, ValidationError } from '../../lib/errors.js';
import type { RegisterInput, LoginInput, UpdateProfileInput, ChangePasswordInput } from './auth.validators.js';

export class AuthService {
  async register(input: RegisterInput) {
    // Create auth user (without relying on DB trigger for profile)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
      user_metadata: {
        first_name: input.first_name,
        last_name: input.last_name,
      },
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        throw new ValidationError('Email already registered');
      }
      throw new AppError(authError.message, 400);
    }

    // Create profile row directly (upsert in case trigger also fires)
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        email: input.email,
        first_name: input.first_name,
        last_name: input.last_name,
      }, { onConflict: 'id' });

    if (profileError) {
      console.error('Failed to create profile:', profileError.message);
    }

    // Fetch the full profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    return {
      user: profile,
      id: authData.user.id,
    };
  }

  async login(input: LoginInput) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });

    if (error) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profile && !profile.is_active) {
      throw new UnauthorizedError('Account is deactivated');
    }

    // Update last active
    await supabase
      .from('profiles')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', data.user.id);

    return {
      user: profile,
      token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    };
  }

  async refresh(refreshToken: string) {
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data.session) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    return {
      token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    };
  }

  async logout(token: string) {
    // Get user from token first, then sign out
    const { data: { user } } = await supabase.auth.getUser(token);
    if (user) {
      await supabase.auth.admin.signOut(user.id);
    }
  }

  async getProfile(userId: string) {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      throw new NotFoundError('Profile');
    }

    return profile;
  }

  async updateProfile(userId: string, input: UpdateProfileInput) {
    const { data: profile, error } = await supabase
      .from('profiles')
      .update(input)
      .eq('id', userId)
      .select('*')
      .single();

    if (error) {
      throw new AppError('Failed to update profile', 400);
    }

    return profile;
  }

  async uploadAvatar(userId: string, file: Express.Multer.File) {
    const ext = file.originalname.split('.').pop() || 'jpg';
    const path = `avatars/${userId}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('course-content')
      .upload(path, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (uploadError) {
      throw new AppError('Failed to upload avatar: ' + uploadError.message, 400);
    }

    const { data: urlData } = supabase.storage.from('course-content').getPublicUrl(path);
    const avatar_url = urlData.publicUrl;

    const { data: profile, error } = await supabase
      .from('profiles')
      .update({ avatar_url })
      .eq('id', userId)
      .select('*')
      .single();

    if (error) {
      throw new AppError('Failed to update avatar URL', 400);
    }

    return profile;
  }

  async uploadBanner(userId: string, file: Express.Multer.File) {
    const ext = file.originalname.split('.').pop() || 'jpg';
    const path = `banners/${userId}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('course-content')
      .upload(path, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (uploadError) {
      throw new AppError('Failed to upload banner: ' + uploadError.message, 400);
    }

    const { data: urlData } = supabase.storage.from('course-content').getPublicUrl(path);
    const banner_url = urlData.publicUrl;

    const { data: profile, error } = await supabase
      .from('profiles')
      .update({ banner_url })
      .eq('id', userId)
      .select('*')
      .single();

    if (error) {
      throw new AppError('Failed to update banner URL', 400);
    }

    return profile;
  }

  async changePassword(userId: string, email: string, input: ChangePasswordInput) {
    // Verify current password by attempting sign-in
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: input.current_password,
    });

    if (signInError) {
      throw new ValidationError('Current password is incorrect');
    }

    // Update password via admin API
    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      password: input.new_password,
    });

    if (updateError) {
      throw new AppError('Failed to update password', 400);
    }

    // Sign in again with the new password to get fresh tokens
    const { data: freshSession, error: freshError } = await supabase.auth.signInWithPassword({
      email,
      password: input.new_password,
    });

    if (freshError || !freshSession.session) {
      return { message: 'Password updated successfully' };
    }

    return {
      message: 'Password updated successfully',
      token: freshSession.session.access_token,
      refresh_token: freshSession.session.refresh_token,
    };
  }

  async forgotPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/reset-password`,
    });

    if (error) {
      // Don't reveal whether email exists
      console.error('Password reset error:', error.message);
    }

    // Always return success to prevent email enumeration
    return { message: 'If an account exists, a reset link has been sent' };
  }
}

export const authService = new AuthService();
