import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { User, Shield, Key, Save } from 'lucide-react';
import { updateProfile, changePassword } from '../../services/auth.service';
import { useAuthStore } from '../../store/auth.store';
import { Card, Badge } from '../ui/index';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { formatDate, getRoleColor } from '../../utils/helpers';
import { ROLES } from '../../utils/constants';
import toast from 'react-hot-toast';

export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const [profileForm, setProfileForm] = useState({
    name: user?.name ?? '',
    department: user?.department ?? '',
  });
  const [pwForm, setPwForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const profileMutation = useMutation({
    mutationFn: () => updateProfile({ name: profileForm.name, department: profileForm.department }),
    onSuccess: (res) => {
      updateUser(res.data as any);
      toast.success('Profile updated successfully');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Update failed'),
  });

  const passwordMutation = useMutation({
    mutationFn: () => changePassword(pwForm.oldPassword, pwForm.newPassword),
    onSuccess: () => {
      toast.success('Password changed successfully');
      setPwForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to change password'),
  });

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwForm.oldPassword || !pwForm.newPassword || !pwForm.confirmPassword) {
      toast.error('All password fields are required');
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (pwForm.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    passwordMutation.mutate();
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
        <p className="text-sm text-slate-500">Manage your account information and password</p>
      </div>

      {/* Avatar + Identity */}
      <Card>
        <div className="flex items-center gap-5">
          <div className="h-16 w-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-xl font-bold text-white flex-shrink-0">
            {user?.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-slate-900">{user?.name}</h2>
            <p className="text-sm text-slate-500">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={getRoleColor(user?.role ?? '')}>
                {ROLES[user?.role as keyof typeof ROLES]?.label ?? user?.role}
              </Badge>
              {user?.badgeNumber && (
                <Badge className="bg-slate-100 text-slate-600">Badge: {user.badgeNumber}</Badge>
              )}
              <Badge className={user?.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'} dot>
                {user?.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Edit Profile */}
      <Card
        header={
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-indigo-500" />
            <h3 className="text-sm font-semibold text-slate-800">Personal Information</h3>
          </div>
        }
      >
        <form
          onSubmit={(e) => { e.preventDefault(); profileMutation.mutate(); }}
          className="space-y-4"
        >
          <Input
            label="Full Name"
            value={profileForm.name}
            onChange={(e) => setProfileForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Your full name"
          />
          <Input
            label="Department"
            value={profileForm.department}
            onChange={(e) => setProfileForm(f => ({ ...f, department: e.target.value }))}
            placeholder="e.g. Cyber Crime, Homicide"
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500">Email</p>
              <p className="text-sm font-medium text-slate-700 mt-0.5">{user?.email}</p>
              <p className="text-xs text-slate-400 mt-0.5">Contact admin to change email</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Member Since</p>
              <p className="text-sm font-medium text-slate-700 mt-0.5">
                {user?.createdAt ? formatDate(user.createdAt) : '—'}
              </p>
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit" isLoading={profileMutation.isPending} className="flex items-center gap-2">
              <Save className="h-4 w-4" /> Save Changes
            </Button>
          </div>
        </form>
      </Card>

      {/* Change Password */}
      <Card
        header={
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-indigo-500" />
            <h3 className="text-sm font-semibold text-slate-800">Change Password</h3>
          </div>
        }
      >
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <Input
            label="Current Password"
            type="password"
            value={pwForm.oldPassword}
            onChange={(e) => setPwForm(f => ({ ...f, oldPassword: e.target.value }))}
            placeholder="Your current password"
          />
          <Input
            label="New Password"
            type="password"
            value={pwForm.newPassword}
            onChange={(e) => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
            placeholder="Min. 8 characters"
          />
          <Input
            label="Confirm New Password"
            type="password"
            value={pwForm.confirmPassword}
            onChange={(e) => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))}
            placeholder="Re-enter new password"
            error={pwForm.confirmPassword && pwForm.newPassword !== pwForm.confirmPassword ? 'Passwords do not match' : undefined}
          />
          <div className="flex justify-end">
            <Button type="submit" isLoading={passwordMutation.isPending} className="flex items-center gap-2">
              <Shield className="h-4 w-4" /> Update Password
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
