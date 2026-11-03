import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Input } from '../components/common/Input';
import { PasswordInput } from '../components/common/PasswordInput';
import { Button } from '../components/common/Button';
import { FormError } from '../components/common/FormError';
import { authService } from '../services/auth';

export const PasswordRecoveryPage: React.FC<{ reset?: boolean }> = ({ reset = false }) => {
  const location = useLocation();
  const [accessToken] = useState(() => new URLSearchParams(location.hash.slice(1)).get('access_token') || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Keep link tokens in memory only and remove them from the address bar.
    if (window.location.hash) window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null); setMessage(null);
    if (reset && (password.length < 12 || password !== confirmPassword)) {
      setError('Use at least 12 characters and ensure the passwords match.');
      return;
    }
    setIsLoading(true);
    try {
      const response = reset ? await authService.resetPassword(accessToken, password, confirmPassword) : await authService.forgotPassword(email);
      setMessage(response.message);
      setPassword(''); setConfirmPassword('');
    } catch (err) { setError(err instanceof Error ? err.message : 'The request could not be completed.'); }
    finally { setIsLoading(false); }
  };

  return (
    <div className="max-w-md w-full mx-auto my-12 p-6 sm:p-8 bg-white border border-border rounded-lg shadow-card">
      <h1 className="text-2xl font-bold text-text-primary mb-3">{reset ? 'Choose a New Password' : 'Reset Your Password'}</h1>
      <FormError message={error} className="mb-4" />
      {message && <p role="status" className="mb-4 text-sm text-status-success">{message}</p>}
      {reset && !accessToken ? (
        <p className="text-sm text-text-secondary mb-4">Open the reset link from your email. If it expired, request another link.</p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {reset ? <>
            <PasswordInput label="New Password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="new-password" showStrengthPolicy />
            <PasswordInput label="Confirm New Password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required autoComplete="new-password" />
          </> : <Input label="Email Address" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />}
          <Button type="submit" isLoading={isLoading} className="w-full">{reset ? 'Update Password' : 'Send Reset Link'}</Button>
        </form>
      )}
      <div className="flex gap-4 mt-6 text-sm text-brand">
        <Link to="/login" className="hover:underline">Back to Sign In</Link>
        {reset && <Link to="/forgot-password" className="hover:underline">Request a New Link</Link>}
      </div>
    </div>
  );
};
