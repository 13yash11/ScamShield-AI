import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LoadingState } from './LoadingState';
import { ShieldAlert } from 'lucide-react';
import { Button } from './Button';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = false,
}) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-6">
        <LoadingState
          title="Verifying Session Credentials"
          description="Checking authentication status with security server..."
        />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && user.role !== 'admin') {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white border border-border rounded-lg text-center">
        <div className="w-12 h-12 rounded-md bg-status-danger-bg text-status-danger border border-[#F3C4C8] mx-auto flex items-center justify-center mb-4">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-text-primary mb-2">
          Administrator Access Denied
        </h2>
        <p className="text-sm text-text-secondary mb-6 leading-relaxed">
          Your account ({user.email}) does not possess verified administrative privileges. Administrative operations require explicit backend role verification in the authentication database.
        </p>
        <div className="flex justify-center gap-3">
          <Button variant="secondary" onClick={() => window.history.back()}>
            Go Back
          </Button>
          <Button variant="primary" onClick={() => (window.location.href = '/dashboard')}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
