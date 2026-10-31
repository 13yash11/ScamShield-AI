import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '../components/common/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[calc(100vh-4rem-120px)] flex items-center justify-center p-6 bg-background-secondary/30">
      <div className="max-w-md w-full bg-white border border-border rounded-lg p-8 text-center shadow-card">
        <div className="w-12 h-12 rounded-md bg-brand-subtle text-brand mx-auto flex items-center justify-center mb-4">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <span className="text-xs font-mono font-bold text-text-secondary uppercase tracking-widest">
          HTTP 404
        </span>
        <h1 className="text-2xl font-bold text-text-primary mt-1 mb-2">
          Page Not Found
        </h1>
        <p className="text-sm text-text-secondary mb-6 leading-relaxed">
          The requested security route does not exist or has been relocated to another endpoint.
        </p>
        <Link to="/">
          <Button variant="primary" size="md" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Return to Homepage
          </Button>
        </Link>
      </div>
    </div>
  );
};
