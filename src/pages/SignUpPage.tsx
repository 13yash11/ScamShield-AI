import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Check } from 'lucide-react';
import { Input } from '../components/common/Input';
import { PasswordInput } from '../components/common/PasswordInput';
import { Button } from '../components/common/Button';
import { FormError } from '../components/common/FormError';
import { useAuth } from '../context/AuthContext';
import { SignUpData } from '../types';

export const SignUpPage: React.FC = () => {
  const navigate = useNavigate();
  const { signUp, isLoading } = useAuth();

  const [formData, setFormData] = useState<SignUpData>({
    fullName: '',
    phoneNumber: '',
    email: '',
    password: '',
    rePassword: '',
  });

  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof SignUpData, string>>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Phone number formatter
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^\d+]/g, '');
    if (value.length > 15) {
      value = value.slice(0, 15);
    }
    setFormData((prev) => ({ ...prev, phoneNumber: value }));
    if (fieldErrors.phoneNumber) {
      setFieldErrors((prev) => ({ ...prev, phoneNumber: undefined }));
    }
  };

  const handleChange = (field: keyof SignUpData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (generalError) {
      setGeneralError(null);
    }
  };

  const validate = (): boolean => {
    const errors: Partial<Record<keyof SignUpData, string>> = {};

    if (!formData.fullName.trim()) {
      errors.fullName = 'Full Name is required.';
    } else if (formData.fullName.trim().length < 2) {
      errors.fullName = 'Full Name must be at least 2 characters.';
    }

    if (!formData.phoneNumber.trim()) {
      errors.phoneNumber = 'Phone Number is required.';
    } else if (formData.phoneNumber.trim().length < 8) {
      errors.phoneNumber = 'Please enter a valid phone number (at least 8 digits).';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email Address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please provide a valid email format (e.g., name@domain.com).';
    }

    if (!formData.password) {
      errors.password = 'Password is required.';
    } else if (formData.password.length < 12) {
      errors.password = 'Password must meet the 12-character minimum security policy.';
    }

    if (!formData.rePassword) {
      errors.rePassword = 'Re-entering your password is required.';
    } else if (formData.password !== formData.rePassword) {
      errors.rePassword = 'Passwords do not match.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    setSuccessNotice(null);

    if (!validate()) {
      return;
    }

    const result = await signUp(formData);

    if (result.success) {
      setSuccessNotice('Account created successfully. You may now proceed to sign in.');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } else {
      setGeneralError(
        result.error || 'Registration failed. The authentication service could not create the account.'
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
            Create Security Account
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Register to save threat analyses and monitor repeat scam indicators.
          </p>
        </div>

        {generalError && <FormError message={generalError} className="mb-5" />}

        {successNotice && (
          <div className="mb-5 p-3 rounded-md bg-status-success-bg border border-[#C2E3D4] text-status-success text-sm flex items-start gap-2">
            <Check className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successNotice}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* 1. Full Name */}
          <Input
            label="Full Name"
            type="text"
            required
            autoComplete="name"
            placeholder="Jane Doe"
            value={formData.fullName}
            onChange={(e) => handleChange('fullName', e.target.value)}
            error={fieldErrors.fullName}
            disabled={isLoading}
          />

          {/* 2. Phone Number */}
          <Input
            label="Phone Number"
            type="tel"
            required
            autoComplete="tel"
            placeholder="+1 (555) 012-3456"
            value={formData.phoneNumber}
            onChange={handlePhoneChange}
            error={fieldErrors.phoneNumber}
            helperText="Include country code where applicable."
            disabled={isLoading}
          />

          {/* 3. Email Address */}
          <Input
            label="Email Address"
            type="email"
            required
            autoComplete="email"
            placeholder="jane@company.com"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            error={fieldErrors.email}
            disabled={isLoading}
          />

          {/* 4. Password */}
          <PasswordInput
            label="Password"
            required
            autoComplete="new-password"
            placeholder="At least 12 characters"
            value={formData.password}
            onChange={(e) => handleChange('password', e.target.value)}
            error={fieldErrors.password}
            showStrengthPolicy
            disabled={isLoading}
          />

          {/* 5. Re-enter Password */}
          <PasswordInput
            label="Re-enter Password"
            required
            autoComplete="new-password"
            placeholder="Repeat exact password"
            value={formData.rePassword}
            onChange={(e) => handleChange('rePassword', e.target.value)}
            error={fieldErrors.rePassword}
            disabled={isLoading}
          />

          <div className="pt-2">
            <Button
              type="submit"
              className="w-full"
              size="md"
              isLoading={isLoading}
            >
              Create Account
            </Button>
          </div>
        </form>

        <div className="mt-6 pt-5 border-t border-border text-center text-xs text-text-secondary space-y-2">
          <p>
            Already registered?{' '}
            <Link to="/login" className="text-brand font-semibold hover:underline">
              Sign In
            </Link>
          </p>
          <p>
            By creating an account, you acknowledge our{' '}
            <a href="#terms" className="text-text-primary underline">Terms</a> and{' '}
            <a href="#privacy" className="text-text-primary underline">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
};
