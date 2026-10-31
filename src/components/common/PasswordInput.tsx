import { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input, InputProps } from './Input';

export interface PasswordInputProps extends Omit<InputProps, 'type' | 'rightIcon'> {
  showStrengthPolicy?: boolean;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(({
  showStrengthPolicy = false,
  value,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);

  const toggleVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const isMinLength = typeof value === 'string' && value.length >= 12;

  return (
    <div className="w-full">
      <Input
        ref={ref}
        type={showPassword ? 'text' : 'password'}
        value={value}
        rightIcon={
          <button
            type="button"
            onClick={toggleVisibility}
            className="text-text-secondary hover:text-text-primary focus:outline-none p-1 rounded"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        }
        {...props}
      />
      {showStrengthPolicy && (
        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-text-secondary">
          <span
            className={`w-2 h-2 rounded-full inline-block ${
              isMinLength ? 'bg-status-success' : 'bg-border'
            }`}
          />
          <span>Password policy: Minimum 12 characters required</span>
        </div>
      )}
    </div>
  );
});

PasswordInput.displayName = 'PasswordInput';
