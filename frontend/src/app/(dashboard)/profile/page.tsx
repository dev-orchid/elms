'use client';

import { useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v3';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  User, Lock, Save, Loader2, Mail, Shield,
  Star, Flame, Calendar, Trophy, Camera, ImageIcon,
} from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

// ─── Schemas ──────────────────────────────────────────

const profileSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(100),
  last_name: z.string().min(1, 'Last name is required').max(100),
  bio: z.string().max(500).optional(),
});

const passwordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z.string().min(8, 'New password must be at least 8 characters'),
  confirm_password: z.string().min(1, 'Please confirm your new password'),
}).refine((data) => data.new_password === data.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

const DEFAULT_BANNER = '/default-banner.svg';

// ─── Page ─────────────────────────────────────────────

export default function ProfilePage() {
  const { user, setAuth, token } = useAuthStore();
  const queryClient = useQueryClient();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data } = await api.get('/auth/me');
      return data.user;
    },
    enabled: !!user,
  });

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    values: profile ? {
      first_name: profile.first_name || '',
      last_name: profile.last_name || '',
      bio: profile.bio || '',
    } : undefined,
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { current_password: '', new_password: '', confirm_password: '' },
  });

  // Helper to sync auth store after any profile update
  const syncAuth = (updatedUser: any) => {
    if (token) {
      setAuth({
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        avatar_url: updatedUser.avatar_url,
      }, token);
    }
  };

  const updateProfile = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const res = await api.patch('/auth/profile', data);
      return res.data.user;
    },
    onSuccess: (u) => {
      toast.success('Profile updated successfully');
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      syncAuth(u);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    },
  });

  const uploadAvatar = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append('avatar', file);
      const res = await api.post('/auth/avatar', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data.user;
    },
    onSuccess: (u) => {
      toast.success('Profile picture updated');
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      syncAuth(u);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to upload picture');
    },
  });

  const uploadBanner = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append('banner', file);
      const res = await api.post('/auth/banner', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data.user;
    },
    onSuccess: () => {
      toast.success('Banner updated');
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to upload banner');
    },
  });

  const changePassword = useMutation({
    mutationFn: async (data: PasswordFormData) => {
      const res = await api.post('/auth/change-password', {
        current_password: data.current_password,
        new_password: data.new_password,
      });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success('Password changed successfully');
      passwordForm.reset();
      // Update token so the session stays valid after password change
      if (data.token && user) {
        setAuth(user, data.token);
      }
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to change password');
    },
  });

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    mutation: typeof uploadAvatar | typeof uploadBanner,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }
    mutation.mutate(file);
    e.target.value = '';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  const initials = profile
    ? `${profile.first_name?.[0] ?? ''}${profile.last_name?.[0] ?? ''}`.toUpperCase() || 'U'
    : 'U';

  const roleName = profile?.role
    ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1).replace('_', ' ')
    : 'Learner';

  const bannerUrl = profile?.banner_url || DEFAULT_BANNER;

  return (
    <div className="space-y-6">
      {/* ─── Profile Banner ──────────────────────────── */}
      <div className="relative rounded-2xl overflow-hidden">
        {/* Hidden file inputs */}
        <input
          ref={avatarInputRef}
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp"
          className="hidden"
          onChange={(e) => handleImageUpload(e, uploadAvatar)}
        />
        <input
          ref={bannerInputRef}
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp"
          className="hidden"
          onChange={(e) => handleImageUpload(e, uploadBanner)}
        />

        {/* Banner image */}
        <div className="relative h-48 group">
          <img
            src={bannerUrl}
            alt="Profile banner"
            className="w-full h-full object-cover"
          />
          {/* Dark overlay on hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300" />
          {/* Edit banner button */}
          <button
            onClick={() => bannerInputRef.current?.click()}
            disabled={uploadBanner.isPending}
            className="absolute top-4 right-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/50 backdrop-blur-sm text-white text-xs font-medium opacity-0 group-hover:opacity-100 hover:bg-black/70 transition-all duration-200 border border-white/10"
          >
            {uploadBanner.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ImageIcon className="h-3.5 w-3.5" />
            )}
            Edit Cover
          </button>
        </div>

        {/* Profile info card */}
        <div className="relative bg-white border-x border-b border-slate-200 rounded-b-2xl px-6 pb-6 pt-0">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12">
            {/* Avatar */}
            <div className="relative group/avatar shrink-0">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt=""
                  className="h-24 w-24 rounded-2xl object-cover border-4 border-white shadow-lg bg-white"
                />
              ) : (
                <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 border-4 border-white shadow-lg flex items-center justify-center text-2xl font-bold text-white">
                  {initials}
                </div>
              )}
              <button
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadAvatar.isPending}
                className="absolute inset-0 rounded-2xl bg-black/0 group-hover/avatar:bg-black/40 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-all duration-200 cursor-pointer"
              >
                {uploadAvatar.isPending ? (
                  <Loader2 className="h-6 w-6 text-white animate-spin" />
                ) : (
                  <Camera className="h-6 w-6 text-white" />
                )}
              </button>
              <div
                className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-white shadow-md flex items-center justify-center border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => avatarInputRef.current?.click()}
              >
                <Camera className="h-3.5 w-3.5 text-slate-600" />
              </div>
            </div>

            {/* Name + meta */}
            <div className="flex-1 pb-1 sm:pt-14">
              <h1 className="text-xl font-bold text-slate-900">
                {profile?.first_name} {profile?.last_name}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-1.5">
                <span className="flex items-center gap-1.5 text-sm text-slate-500">
                  <Mail className="h-3.5 w-3.5" />
                  {profile?.email}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-teal-50 text-teal-700 rounded-full px-2.5 py-1 border border-teal-200">
                  <Shield className="h-3 w-3" />
                  {roleName}
                </span>
                {profile?.is_active && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium bg-emerald-50 text-emerald-700 rounded-full px-2.5 py-1 border border-emerald-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Active
                  </span>
                )}
              </div>
            </div>

            {/* Stats inline (desktop) */}
            <div className="hidden lg:flex items-center gap-6 pb-1 sm:pt-14">
              <div className="text-center">
                <p className="text-lg font-bold text-slate-900">{profile?.level || 'Novice'}</p>
                <p className="text-xs text-slate-500">Level</p>
              </div>
              <div className="h-8 w-px bg-slate-200" />
              <div className="text-center">
                <p className="text-lg font-bold text-slate-900">{(profile?.points || 0).toLocaleString()}</p>
                <p className="text-xs text-slate-500">Points</p>
              </div>
              <div className="h-8 w-px bg-slate-200" />
              <div className="text-center">
                <p className="text-lg font-bold text-slate-900">{profile?.streak_days || 0}</p>
                <p className="text-xs text-slate-500">Day Streak</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Stats Row (mobile/tablet) ───────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:hidden">
        {[
          { icon: Trophy, label: 'Level', value: profile?.level || 'Novice', color: 'text-violet-600 bg-violet-50' },
          { icon: Star, label: 'Points', value: (profile?.points || 0).toLocaleString(), color: 'text-amber-600 bg-amber-50' },
          { icon: Flame, label: 'Streak', value: `${profile?.streak_days || 0} days`, color: 'text-teal-600 bg-teal-50' },
          { icon: Calendar, label: 'Member Since', value: profile ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '', color: 'text-blue-600 bg-blue-50' },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-slate-200">
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${s.color}`}>
              <s.icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wide font-medium">{s.label}</p>
              <p className="text-sm font-bold text-slate-900">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Two Column Layout ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — Personal Info */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200">
          <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100">
            <div className="h-9 w-9 rounded-lg bg-teal-50 flex items-center justify-center">
              <User className="h-[18px] w-[18px] text-teal-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Personal Information</h2>
              <p className="text-xs text-slate-500">Update your name and bio</p>
            </div>
          </div>

          <form
            onSubmit={profileForm.handleSubmit((data) => updateProfile.mutate(data))}
            className="p-6 space-y-5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">First Name</label>
                <input
                  {...profileForm.register('first_name')}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                />
                {profileForm.formState.errors.first_name && (
                  <p className="text-red-500 text-xs mt-1">{profileForm.formState.errors.first_name.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Last Name</label>
                <input
                  {...profileForm.register('last_name')}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                />
                {profileForm.formState.errors.last_name && (
                  <p className="text-red-500 text-xs mt-1">{profileForm.formState.errors.last_name.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  value={profile?.email || ''}
                  disabled
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3.5 py-2.5 text-sm text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Bio
                <span className="text-slate-400 font-normal ml-1">(optional)</span>
              </label>
              <textarea
                {...profileForm.register('bio')}
                rows={4}
                placeholder="Write a short bio about yourself..."
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none resize-none transition-all"
              />
              {profileForm.formState.errors.bio && (
                <p className="text-red-500 text-xs mt-1">{profileForm.formState.errors.bio.message}</p>
              )}
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={updateProfile.isPending || !profileForm.formState.isDirty}
                className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                {updateProfile.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Changes
              </button>
            </div>
          </form>
        </div>

        {/* Right — Password + Account */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200">
            <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100">
              <div className="h-9 w-9 rounded-lg bg-amber-50 flex items-center justify-center">
                <Lock className="h-[18px] w-[18px] text-amber-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">Password</h2>
                <p className="text-xs text-slate-500">Change your password</p>
              </div>
            </div>

            <form
              onSubmit={passwordForm.handleSubmit((data) => changePassword.mutate(data))}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Current Password</label>
                <input
                  type="password"
                  {...passwordForm.register('current_password')}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                  placeholder="Enter current password"
                />
                {passwordForm.formState.errors.current_password && (
                  <p className="text-red-500 text-xs mt-1">{passwordForm.formState.errors.current_password.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">New Password</label>
                <input
                  type="password"
                  {...passwordForm.register('new_password')}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                  placeholder="Min. 8 characters"
                />
                {passwordForm.formState.errors.new_password && (
                  <p className="text-red-500 text-xs mt-1">{passwordForm.formState.errors.new_password.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password</label>
                <input
                  type="password"
                  {...passwordForm.register('confirm_password')}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                  placeholder="Repeat new password"
                />
                {passwordForm.formState.errors.confirm_password && (
                  <p className="text-red-500 text-xs mt-1">{passwordForm.formState.errors.confirm_password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={changePassword.isPending}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                {changePassword.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Lock className="h-4 w-4" />
                )}
                Update Password
              </button>
            </form>
          </div>

          {/* Account Details */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-3">Account Details</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Role</span>
                <span className="text-xs font-semibold text-slate-700 bg-slate-100 rounded-full px-2.5 py-0.5">
                  {roleName}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Status</span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-full px-2.5 py-0.5">
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">2FA</span>
                <span className="text-xs font-semibold text-slate-500 bg-slate-100 rounded-full px-2.5 py-0.5">
                  {profile?.two_factor_enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Joined</span>
                <span className="text-xs font-semibold text-slate-700">
                  {profile ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : ''}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
