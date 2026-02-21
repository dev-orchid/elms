import { supabase } from '../../lib/supabase.js';
import { AppError, NotFoundError, UnauthorizedError, ValidationError } from '../../lib/errors.js';
import type { RegisterInput, LoginInput, UpdateProfileInput } from './auth.validators.js';

export class AuthService {
  async register(input: RegisterInput) {
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

    // Update profile with names (trigger creates the row, we update it)
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        first_name: input.first_name,
        last_name: input.last_name,
      })
      .eq('id', authData.user.id);

    if (profileError) {
      console.error('Failed to update profile:', profileError.message);
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
