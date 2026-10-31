import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, LogOut, CheckCircle2, AlertCircle } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Input } from '../components/common/Input';
import { PasswordInput } from '../components/common/PasswordInput';
import { Button } from '../components/common/Button';
import { useAuth } from '../context/AuthContext';

export const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Profile Form state
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password Form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);

    if (!fullName.trim()) {
      setProfileMessage({ type: 'error', text: 'Full Name cannot be empty.' });
      return;
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setProfileMessage({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }

    setIsUpdatingProfile(true);
    try {
      // In a real environment, submit to /api/v1/user/profile with bearer token
      await new Promise((resolve) => setTimeout(resolve, 600));
      setProfileMessage({
        type: 'error',
        text: 'Account modifications require re-authentication with active backend server.',
      });
    } catch {
      setProfileMessage({ type: 'error', text: 'Failed to update account profile.' });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (!currentPassword) {
      setPasswordMessage({ type: 'error', text: 'Current password is required.' });
      return;
    }

    if (!newPassword || newPassword.length < 12) {
      setPasswordMessage({
        type: 'error',
        text: 'New password must satisfy the 12-character minimum security policy.',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      setPasswordMessage({
        type: 'error',
        text: 'Password changes require verified backend session authentication.',
      });
    } catch {
      setPasswordMessage({ type: 'error', text: 'Failed to update password.' });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-4xl">
        <div className="pb-4 border-b border-border">
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">
            Account Settings
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Manage your personal profile, credentials, and session authentication.
          </p>
        </div>

        {/* Profile Information */}
        <div className="bg-white border border-border rounded-lg shadow-card p-6">
          <div className="flex items-center gap-2 pb-4 mb-5 border-b border-border">
            <User className="w-5 h-5 text-brand" />
            <h2 className="text-base font-bold text-text-primary">
              Profile Information
            </h2>
          </div>

          {profileMessage && (
            <div
              className={`p-3 rounded-md text-sm mb-4 flex items-start gap-2 ${
                profileMessage.type === 'success'
                  ? 'bg-status-success-bg text-status-success border border-[#C2E3D4]'
                  : 'bg-status-danger-bg text-status-danger border border-[#F3C4C8]'
              }`}
            >
              {profileMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span>{profileMessage.text}</span>
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-4 max-w-xl">
            <Input
              label="Full Name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Full Name"
              required
            />

            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@domain.com"
              required
            />

            <Input
              label="Phone Number"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+1 555-0199"
              helperText="Used for security notices and account recovery."
            />

            <div className="pt-2">
              <Button type="submit" size="sm" isLoading={isUpdatingProfile}>
                Save Profile Changes
              </Button>
            </div>
          </form>
        </div>

        {/* Password Management */}
        <div className="bg-white border border-border rounded-lg shadow-card p-6">
          <div className="flex items-center gap-2 pb-4 mb-5 border-b border-border">
            <Lock className="w-5 h-5 text-brand" />
            <h2 className="text-base font-bold text-text-primary">
              Password & Security Policy
            </h2>
          </div>

          {passwordMessage && (
            <div
              className={`p-3 rounded-md text-sm mb-4 flex items-start gap-2 ${
                passwordMessage.type === 'success'
                  ? 'bg-status-success-bg text-status-success border border-[#C2E3D4]'
                  : 'bg-status-danger-bg text-status-danger border border-[#F3C4C8]'
              }`}
            >
              {passwordMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span>{passwordMessage.text}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-xl">
            <PasswordInput
              label="Current Password"
              placeholder="Enter current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />

            <PasswordInput
              label="New Password"
              placeholder="At least 12 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              showStrengthPolicy
              required
            />

            <PasswordInput
              label="Confirm New Password"
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <div className="pt-2">
              <Button type="submit" size="sm" isLoading={isUpdatingPassword}>
                Update Password
              </Button>
            </div>
          </form>
        </div>

        {/* Session Termination */}
        <div className="bg-white border border-border rounded-lg shadow-card p-6">
          <div className="flex items-center gap-2 pb-4 mb-3 border-b border-border text-status-danger">
            <LogOut className="w-5 h-5" />
            <h2 className="text-base font-bold">
              Session Termination
            </h2>
          </div>
          <p className="text-sm text-text-secondary mb-4 leading-relaxed">
            Logging out clears active authentication tokens from this browser. You will need to sign in again to access scan records.
          </p>
          <Button variant="danger" size="sm" onClick={handleLogout}>
            Terminate Session & Sign Out
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};
