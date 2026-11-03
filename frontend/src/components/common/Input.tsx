import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  id,
  className = '',
  required,
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  const errorId = inputId ? `${inputId}-error` : undefined;
  const helperId = inputId ? `${inputId}-helper` : undefined;

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-text-primary flex items-center justify-between">
          <span>
            {label}
            {required && <span className="text-status-danger ml-1" aria-hidden="true">*</span>}
          </span>
        </label>
      )}
      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-3 text-text-secondary pointer-events-none flex items-center">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          className={`w-full rounded-md border text-sm text-text-primary placeholder:text-text-secondary/60 bg-white transition-colors duration-150 py-2.5 ${
            leftIcon ? 'pl-9' : 'pl-3'
          } ${rightIcon ? 'pr-9' : 'pr-3'} ${
            error
              ? 'border-status-danger focus:border-status-danger focus-visible:ring-status-danger'
              : 'border-border focus:border-brand'
          } focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand disabled:bg-background-secondary disabled:cursor-not-allowed ${className}`}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 flex items-center">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p id={errorId} className="text-xs text-status-danger font-medium flex items-center gap-1">
          {error}
        </p>
      )}
      {!error && helperText && (
        <p id={helperId} className="text-xs text-text-secondary">
          {helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
