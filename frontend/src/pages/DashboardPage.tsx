import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, History, Shield, ArrowRight, ShieldCheck, FileText, Image, Globe } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { RiskIndicator } from '../components/common/RiskIndicator';
import { useAuth } from '../context/AuthContext';
import { ScanResult } from '../types';
import { apiService } from '../services/api';
import { LoadingState } from '../components/common/LoadingState';
import { FormError } from '../components/common/FormError';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [recentScans, setRecentScans] = useState<ScanResult[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(user));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!user) { setRecentScans([]); setIsLoading(false); return; }
    setIsLoading(true);
    setError(null);
    apiService.getScanHistory(5).then((scans) => { if (active) setRecentScans(scans); })
      .catch((err) => { if (active) setError(err instanceof Error ? err.message : 'Could not load recent scans.'); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [user?.id]);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="bg-white border border-border rounded-lg p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-subtle">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-brand-subtle text-brand text-xs font-semibold mb-2">
              <Shield className="w-3.5 h-3.5" />
              <span>Session Authenticated</span>
            </div>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">
              Welcome, {user?.fullName || 'Security Analyst'}
            </h1>
            <p className="text-sm text-text-secondary mt-1">
              {user?.email ? `Connected as ${user.email}.` : 'Workspace operational.'} Review flagged threats and run automated communications scans.
            </p>
          </div>

          <Link to="/scan" className="shrink-0">
            <Button size="md" leftIcon={<PlusCircle className="w-4 h-4" />}>
              New Scan
            </Button>
          </Link>
        </div>

        {/* Quick Launch Cards */}
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-3">
            Quick Analysis Modules
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              to="/scan"
              className="p-4 bg-white border border-border rounded-lg hover:border-brand/70 transition-colors flex items-start gap-3 shadow-subtle"
            >
              <div className="p-2 rounded bg-brand-subtle text-brand">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-primary">Text Scanner</h3>
                <p className="text-xs text-text-secondary mt-0.5">Check SMS, emails, or chat messages</p>
              </div>
            </Link>

            <Link
              to="/scan"
              className="p-4 bg-white border border-border rounded-lg hover:border-brand/70 transition-colors flex items-start gap-3 shadow-subtle"
            >
              <div className="p-2 rounded bg-brand-subtle text-brand">
                <Image className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-primary">Screenshot OCR</h3>
                <p className="text-xs text-text-secondary mt-0.5">Upload image snapshots for inspection</p>
              </div>
            </Link>

            <Link
              to="/scan"
              className="p-4 bg-white border border-border rounded-lg hover:border-brand/70 transition-colors flex items-start gap-3 shadow-subtle"
            >
              <div className="p-2 rounded bg-brand-subtle text-brand">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-primary">URL Checker</h3>
                <p className="text-xs text-text-secondary mt-0.5">Inspect suspicious domain links</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Scans Section */}
        <div className="bg-white border border-border rounded-lg shadow-card">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-brand" />
              <h2 className="text-base font-bold text-text-primary">
                Recent Scans
              </h2>
            </div>
            {recentScans.length > 0 && (
              <Link to="/history" className="text-xs font-semibold text-brand hover:underline flex items-center gap-1">
                <span>View Full History</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          <div className="p-5">
            {error ? <FormError message={error} /> : isLoading ? <LoadingState title="Loading Recent Scans" description="Retrieving your saved analyses..." /> : recentScans.length === 0 ? (
              <EmptyState
                icon={<ShieldCheck className="w-8 h-8 text-text-secondary" />}
                title="No Scan Records Found"
                description="You have not performed any scans yet. Content submitted to the scanner workspace will appear in your activity record."
                actionText="Perform First Scan"
                onAction={() => (window.location.href = '/scan')}
              />
            ) : (
              <div className="divide-y divide-border">
                {recentScans.map((scan) => (
                  <div key={scan.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold uppercase text-text-secondary">
                          {scan.scanType}
                        </span>
                        <span className="text-text-secondary text-xs">•</span>
                        <span className="text-xs text-text-secondary">
                          {new Date(scan.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-text-primary line-clamp-1 max-w-xl">
                        {scan.summary}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <RiskIndicator level={scan.riskLevel} size="sm" showScore={false} />
                      <Link to="/results" state={{ result: scan }}>
                        <Button variant="secondary" size="sm">
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
