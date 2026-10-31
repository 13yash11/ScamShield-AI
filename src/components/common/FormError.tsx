import React from 'react';
import { AlertCircle } from 'lucide-react';

interface FormErrorProps {
  message?: string | null;
  className?: string;
}

export const FormError: React.FC<FormErrorProps> = ({ message, className = '' }) => {
  if (!message) return null;

  return (
    <div
      role="alert"
      className={`p-3 rounded-md bg-status-danger-bg border border-[#F3C4C8] text-status-danger text-sm flex items-start gap-2.5 ${className}`}
    >
      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
      <span className="leading-snug">{message}</span>
    </div>
  );
};
