import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
}

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  title,
  subtitle,
  action,
  maxWidth = 'xl',
  className = '',
}) => {
  const maxWidths = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    full: 'max-w-full',
  };

  return (
    <main className={`w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 ${maxWidths[maxWidth]} ${className}`}>
      {(title || subtitle || action) && (
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-border">
          <div>
            {title && (
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="mt-1.5 text-sm sm:text-base text-text-secondary">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </main>
  );
};
