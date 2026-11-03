import React, { useState, useEffect } from 'react';
import { ShieldAlert, Users, Database, FileCheck, AlertCircle, RefreshCw } from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingState } from '../components/common/LoadingState';
import { useAuth } from '../context/AuthContext';
import { AdminMetrics, ScamReport, User } from '../types';
import { apiService } from '../services/api';

export const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'metrics' | 'users' | 'reports'>('metrics');

  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [reports, setReports] = useState<ScamReport[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const fetchAdminData = async () => {
    setIsLoading(true);
    setAuthError(null);

    // Backend role verification check
    if (!user || user.role !== 'admin') {
      setAuthError(
        'Backend Role Verification Required: Access to administrative telemetries, user records, and scam reports requires an authenticated session with verified administrator claims.'
      );
      setIsLoading(false);
      return;
    }

    try {
      const [m, r, u] = await Promise.all([
        apiService.getAdminMetrics(),
        apiService.getScamReports(),
        apiService.getAdminUsers(),
      ]);
      setMetrics(m);
      setReports(r);
      setUsers(u);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Failed to load administration data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [user]);

  return (
    <PageContainer
      title="Security Administration Center"
      subtitle="Administrative oversight, telemetry metrics, and submitted scam report triaging."
      maxWidth="xl"
      action={
        <Button
          variant="secondary"
          size="sm"
          onClick={fetchAdminData}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Refresh Data
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Security Policy Alert Banner */}
        <div className="p-4 rounded-lg bg-background-secondary border border-border flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-brand shrink-0 mt-0.5" />
          <div className="text-xs text-text-secondary leading-relaxed">
            <span className="font-semibold text-text-primary block mb-0.5">
              Access Control Policy Notice
            </span>
            Administrative controls require strict server-side role validation. Frontend guards are implemented solely for interface routing and do not substitute for backend cryptographic authorization tokens.
          </div>
        </div>

        {authError ? (
          <div className="bg-white border border-border rounded-lg p-8 text-center max-w-2xl mx-auto">
            <div className="w-12 h-12 rounded-md bg-status-danger-bg text-status-danger border border-[#F3C4C8] mx-auto flex items-center justify-center mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-text-primary mb-2">
              {user?.role === 'admin' ? 'Administration Data Unavailable' : 'Administrator Authentication Required'}
            </h2>
            <p className="text-sm text-text-secondary mb-6 leading-relaxed">
              {authError}
            </p>
            <div className="flex justify-center gap-3">
              <Button variant="secondary" onClick={() => (window.location.href = '/dashboard')}>
                Return to Dashboard
              </Button>
              <Button variant="primary" onClick={() => (window.location.href = '/login')}>
                Sign In as Administrator
              </Button>
            </div>
          </div>
        ) : isLoading ? (
          <LoadingState
            title="Loading Administration Telemetry"
            description="Verifying backend roles and querying database records..."
          />
        ) : (
          <div className="bg-white border border-border rounded-lg shadow-card">
            {/* Tab navigation */}
            <div className="flex border-b border-border bg-background-secondary/50 p-1 rounded-t-lg">
              <button
                type="button"
                onClick={() => setActiveTab('metrics')}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-md transition-colors ${
                  activeTab === 'metrics'
                    ? 'bg-white text-brand shadow-subtle border border-border'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <Database className="w-4 h-4" />
                <span>System Statistics</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('users')}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-md transition-colors ${
                  activeTab === 'users'
                    ? 'bg-white text-brand shadow-subtle border border-border'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>User Directory</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('reports')}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-md transition-colors ${
                  activeTab === 'reports'
                    ? 'bg-white text-brand shadow-subtle border border-border'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <FileCheck className="w-4 h-4" />
                <span>Submitted Scam Reports</span>
              </button>
            </div>

            <div className="p-6">
              {/* Tab 1: System Metrics */}
              {activeTab === 'metrics' && (
                <div>
                  {!metrics ? (
                    <EmptyState
                      icon={<Database className="w-8 h-8 text-text-secondary" />}
                      title="No Telemetry Data Available"
                      description="No statistics could be loaded. Refresh to try again."
                    />
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="p-4 border border-border rounded-lg bg-background-secondary/30">
                        <span className="text-xs text-text-secondary font-semibold uppercase">Total Scans Conducted</span>
                        <p className="text-2xl font-bold font-mono text-text-primary mt-1">{metrics.totalScans}</p>
                      </div>
                      <div className="p-4 border border-border rounded-lg bg-background-secondary/30">
                        <span className="text-xs text-text-secondary font-semibold uppercase">Flagged Threats</span>
                        <p className="text-2xl font-bold font-mono text-status-danger mt-1">{metrics.flaggedThreats}</p>
                      </div>
                      <div className="p-4 border border-border rounded-lg bg-background-secondary/30">
                        <span className="text-xs text-text-secondary font-semibold uppercase">Registered Analysts</span>
                        <p className="text-2xl font-bold font-mono text-text-primary mt-1">{metrics.activeUsers}</p>
                      </div>
                      <div className="p-4 border border-border rounded-lg bg-background-secondary/30">
                        <span className="text-xs text-text-secondary font-semibold uppercase">Pending Scam Reports</span>
                        <p className="text-2xl font-bold font-mono text-status-warning mt-1">{metrics.reportedScamsCount}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: User Management */}
              {activeTab === 'users' && (
                <div>
                  {users.length === 0 ? (
                    <EmptyState
                      icon={<Users className="w-8 h-8 text-text-secondary" />}
                      title="No User Records Loaded"
                      description="No registered user profiles were returned."
                    />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-border bg-background-secondary text-xs uppercase text-text-secondary font-semibold">
                            <th className="py-2.5 px-4">User</th>
                            <th className="py-2.5 px-4">Role</th>
                            <th className="py-2.5 px-4">Created At</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map((u) => (
                            <tr key={u.id} className="border-b border-border">
                              <td className="py-3 px-4">{u.fullName} ({u.email})</td>
                              <td className="py-3 px-4 uppercase text-xs font-semibold">{u.role}</td>
                              <td className="py-3 px-4 font-mono text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Scam Reports */}
              {activeTab === 'reports' && (
                <div>
                  {reports.length === 0 ? (
                    <EmptyState
                      icon={<FileCheck className="w-8 h-8 text-text-secondary" />}
                      title="No Scam Reports Submitted"
                      description="There are currently no voluntarily submitted scam reports awaiting review. When users flag suspicious content for administrative investigation, reports will be cataloged here."
                    />
                  ) : (
                    <div className="divide-y divide-border">
                      {reports.map((r) => (
                        <div key={r.id} className="py-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase px-2 py-0.5 rounded bg-background-secondary border border-border">
                              {r.type}
                            </span>
                            <span className="text-xs text-text-secondary">
                              Submitted: {new Date(r.submittedAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm font-mono text-text-primary bg-background-secondary/50 p-2.5 rounded border border-border">
                            {r.content}
                          </p>
                          <label className="text-xs text-text-secondary flex items-center gap-2">
                            Review status
                            <select aria-label={`Review status for report ${r.id}`} value={r.status} onChange={async (event) => {
                              try { await apiService.reviewReport(r.id, event.target.value as ScamReport['status']); await fetchAdminData(); }
                              catch (err) { setAuthError(err instanceof Error ? err.message : 'Could not update report.'); }
                            }} className="p-2 rounded border border-border bg-white">
                              <option value="PENDING_REVIEW">Pending review</option>
                              <option value="CONFIRMED_SCAM">Confirmed scam</option>
                              <option value="BENIGN">Benign</option>
                            </select>
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
};
