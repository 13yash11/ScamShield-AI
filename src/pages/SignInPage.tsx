import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { Input } from '../components/common/Input';
import { PasswordInput } from '../components/common/PasswordInput';
import { Button } from '../components/common/Button';
import { FormError } from '../components/common/FormError';
import { useAuth } from '../context/AuthContext';
import { AuthCredentials } from '../types';

export const SignInPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading } = useAuth();

  const [credentials, setCredentials] = useState<AuthCredentials>({
    identifier: '',
    password: '',
  });

  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof AuthCredentials, string>>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  const handleChange = (field: keyof AuthCredentials, value: string) => {
    setCredentials((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (generalError) {
      setGeneralError(null);
    }
  };

  const validate = (): boolean => {
    const errors: Partial<Record<keyof AuthCredentials, string>> = {};

    if (!credentials.identifier.trim()) {
      errors.identifier = 'Email address or phone number is required.';
    }

    if (!credentials.password) {
      errors.password = 'Password is required.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    if (!validate()) {
      return;
    }

    const result = await login(credentials);

    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setGeneralError(
        result.error || 'Authentication rejected. Please check your credentials or backend server availability.'
      );
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem-120px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background-secondary/30">
      <div className="w-full max-w-md bg-white border border-border rounded-lg shadow-card p-6 sm:p-8">
        <div className="text-center mb-6">
          <div className="w-10 h-10 rounded-md bg-brand text-white mx-auto flex items-center justify-center shadow-subtle mb-3">
            <Shield className="w-5 h-5 fill-white/20" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">
            Sign In to ScamShield
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Access your scan history, settings, and verified threat reports.
          </p>
        </div>

        {generalError && <FormError message={generalError} className="mb-5" />}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Input
            label="Email Address or Phone Number"
            type="text"
            required
            autoComplete="username"
            placeholder="name@domain.com or phone"
            value={credentials.identifier}
            onChange={(e) => handleChange('identifier', e.target.value)}
            error={fieldErrors.identifier}
            disabled={isLoading}
          />

          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="signin-password" className="text-sm font-medium text-text-primary">
                Password <span className="text-status-danger">*</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-xs text-brand hover:underline font-medium"
              >
                Forgot Password?
              </Link>
            </div>
            <PasswordInput
              id="signin-password"
              required
              autoComplete="current-password"
              placeholder="Enter your account password"
              value={credentials.password}
              onChange={(e) => handleChange('password', e.target.value)}
              error={fieldErrors.password}
              disabled={isLoading}
            />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              className="w-full"
              size="md"
              isLoading={isLoading}
            >
              Sign In
            </Button>
          </div>
        </form>

        <div className="mt-6 pt-5 border-t border-border text-center text-xs text-text-secondary">
          <p>
            Do not have an account?{' '}
            <Link to="/signup" className="text-brand font-semibold hover:underline">
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
