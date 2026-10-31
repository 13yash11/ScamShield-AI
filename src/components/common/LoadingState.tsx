import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  title?: string;
  description?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  title = 'Performing Security Analysis',
  description = 'Running threat model evaluation, deceptive pattern scanning, and domain verification...',
  className = '',
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center p-12 text-center bg-white border border-border rounded-lg ${className}`}
    >
      <div className="p-3 rounded-md bg-brand-subtle text-brand mb-4">
        <Loader2 className="w-7 h-7 animate-spin text-brand" />
      </div>
      <h3 className="text-base font-semibold text-text-primary mb-1">{title}</h3>
      <p className="text-sm text-text-secondary max-w-md leading-relaxed">{description}</p>
    </div>
  );
};
