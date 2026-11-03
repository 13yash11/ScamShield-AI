import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { History, Trash2, ExternalLink, Filter } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { RiskIndicator } from '../components/common/RiskIndicator';
import { ScanResult } from '../types';
import { apiService } from '../services/api';
import { LoadingState } from '../components/common/LoadingState';
import { FormError } from '../components/common/FormError';

export const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [historyItems, setHistoryItems] = useState<ScanResult[]>([]);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterRisk, setFilterRisk] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    apiService.getScanHistory().then((scans) => {
      if (active) { setHistoryItems(scans); setHasMore(scans.length === 50); }
    }).catch((err) => { if (active) setError(err instanceof Error ? err.message : 'Could not load scan history.'); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, []);

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    setError(null);
    try {
      await apiService.deleteScan(id);
      setHistoryItems((items) => items.filter((item) => item.id !== id));
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not delete this scan.'); }
    finally { setIsDeleting(false); }
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to delete all saved scan records? This action cannot be undone.')) {
      setIsDeleting(true);
      setError(null);
      try { await apiService.clearHistory(); setHistoryItems([]); setHasMore(false); }
      catch (err) { setError(err instanceof Error ? err.message : 'Could not clear history.'); }
      finally { setIsDeleting(false); }
    }
  };

  const loadMore = async () => {
    setIsLoadingMore(true);
    setError(null);
    try {
      const more = await apiService.getScanHistory(50, historyItems.length);
      setHistoryItems((items) => [...items, ...more.filter((scan) => !items.some((item) => item.id === scan.id))]);
      setHasMore(more.length === 50);
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not load more scans.'); }
    finally { setIsLoadingMore(false); }
  };

  const filteredItems = historyItems.filter((item) => {
    if (filterType !== 'ALL' && item.scanType !== filterType.toLowerCase()) {
      return false;
    }
    if (filterRisk !== 'ALL' && item.riskLevel !== filterRisk) {
      return false;
    }
    return true;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
          <div>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">
              Scan History
            </h1>
            <p className="text-sm text-text-secondary mt-1">
              Audit log of previously analyzed messages, screenshots, and URLs.
            </p>
          </div>

          {historyItems.length > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleClearAll}
              disabled={isDeleting}
              leftIcon={<Trash2 className="w-4 h-4 text-status-danger" />}
            >
              Clear All Records
            </Button>
          )}
        </div>

        {/* Filters */}
        {historyItems.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 p-3 bg-white border border-border rounded-lg text-xs">
            <span className="font-semibold text-text-secondary flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5" />
              Filter By:
            </span>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-2.5 py-1.5 rounded border border-border bg-white text-text-primary text-xs focus:outline-none focus:border-brand"
              aria-label="Filter by Scan Type"
            >
              <option value="ALL">All Scan Types</option>
              <option value="TEXT">Text Messages</option>
              <option value="SCREENSHOT">Screenshots</option>
              <option value="URL">URLs</option>
            </select>

            <select
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value)}
              className="px-2.5 py-1.5 rounded border border-border bg-white text-text-primary text-xs focus:outline-none focus:border-brand"
              aria-label="Filter by Risk Category"
            >
              <option value="ALL">All Risk Levels</option>
              <option value="LOW">Low Risk</option>
              <option value="MEDIUM">Medium Risk</option>
              <option value="HIGH">High Risk</option>
              <option value="CRITICAL">Critical Risk</option>
            </select>

            <span className="text-text-secondary ml-auto">
              Showing {filteredItems.length} of {historyItems.length} records
            </span>
          </div>
        )}

        {/* History Table or List */}
        {error && <FormError message={error} />}
        {isLoading ? <LoadingState title="Loading Scan History" description="Retrieving your saved analyses..." /> : error && historyItems.length === 0 ? (
          <Button variant="secondary" onClick={() => window.location.reload()}>Retry</Button>
        ) : historyItems.length === 0 ? (
          <EmptyState
            icon={<History className="w-8 h-8 text-text-secondary" />}
            title="Scan History Is Empty"
            description="You do not have any saved security scan records. Signed-in scans are saved when history is enabled in privacy settings."
            actionText="Launch Threat Scanner"
            onAction={() => navigate('/scan')}
          />
        ) : filteredItems.length === 0 ? (
          <div className="p-8 bg-white border border-border rounded-lg text-center text-sm text-text-secondary">
            No records matched the selected filter criteria.
          </div>
        ) : (
          <div className="bg-white border border-border rounded-lg shadow-subtle overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-background-secondary text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Scan Type</th>
                    <th className="py-3 px-4">Risk Category</th>
                    <th className="py-3 px-4">Summary</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm">
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-background-secondary/40 transition-colors">
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs text-text-secondary font-mono">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="text-xs uppercase font-semibold text-text-primary px-2 py-0.5 rounded bg-background-secondary border border-border">
                          {item.scanType}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <RiskIndicator level={item.riskLevel} size="sm" showScore={false} />
                      </td>
                      <td className="py-3.5 px-4 max-w-md">
                        <p className="text-xs text-text-primary line-clamp-1 font-medium">
                          {item.summary}
                        </p>
                        <p className="text-[11px] text-text-secondary truncate font-mono mt-0.5">
                          {item.target}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => navigate('/results', { state: { result: item } })}
                          leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
                        >
                          View
                        </Button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          disabled={isDeleting}
                          className="p-1.5 text-text-secondary hover:text-status-danger rounded transition-colors inline-flex items-center"
                          aria-label={`Delete record ${item.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {hasMore && <Button variant="secondary" onClick={loadMore} isLoading={isLoadingMore}>Load More Records</Button>}
      </div>
    </DashboardLayout>
  );
};
