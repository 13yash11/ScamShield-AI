import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck, PlusCircle } from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { ResultCard } from '../components/results/ResultCard';
import { EmptyState } from '../components/common/EmptyState';
import { ScanResult } from '../types';
import { apiService } from '../services/api';
import { Button } from '../components/common/Button';
import { FormError } from '../components/common/FormError';

export const ResultsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [result, setResult] = useState<ScanResult | null>(null);
  const [description, setDescription] = useState('');
  const [reportMessage, setReportMessage] = useState<string | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);
  const [isReporting, setIsReporting] = useState(false);

  useEffect(() => {
    // Keep guest results in navigation memory only.
    const stateResult = (location.state as { result?: ScanResult })?.result;
    if (stateResult) {
      setResult(stateResult);
    } else {
      setResult(null);
    }
  }, [location.state]);

  const handleReport = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!result) return;
    setIsReporting(true);
    setReportError(null);
    try {
      const response = await apiService.reportScan(result.id, description);
      setReportMessage(response.message);
      setDescription('');
    } catch (err) { setReportError(err instanceof Error ? err.message : 'Report could not be submitted.'); }
    finally { setIsReporting(false); }
  };

  const handleAnalyzeAgain = () => {
    navigate('/scan');
  };

  if (!result) {
    return (
      <PageContainer
        title="Analysis Report"
        subtitle="Detailed threat breakdown and safety guidance."
        maxWidth="lg"
      >
        <EmptyState
          icon={<ShieldCheck className="w-8 h-8 text-brand" />}
          title="No Scan Results Available"
          description="You have not submitted any message, screenshot, or URL for analysis during this session. Begin a new scan to generate a security report."
          actionText="Start a New Scan"
          onAction={() => navigate('/scan')}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Threat Assessment Report"
      subtitle="Evaluation generated using pattern heuristics and deception recognition."
      maxWidth="lg"
      action={
        <button
          onClick={handleAnalyzeAgain}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Scan</span>
        </button>
      }
    >
      <ResultCard
        result={result}
        onAnalyzeAgain={handleAnalyzeAgain}
        onSave={result.saved ? () => navigate('/history') : undefined}
        isSaved={Boolean(result.saved)}
      />
      {result.persistenceError && <FormError message={result.persistenceError} className="mt-4" />}
      <p className="text-xs text-text-secondary mt-4">{result.saved ? 'This assessment is saved in your account history.' : 'This assessment was not saved. Sign in and enable scan history before scanning to keep a record.'}</p>
      {result.saved && (
        <form onSubmit={handleReport} className="mt-6 p-5 bg-white border border-border rounded-lg space-y-3">
          <label htmlFor="report-description" className="text-sm font-semibold text-text-primary block">Submit a scam report for review</label>
          <textarea id="report-description" value={description} onChange={(event) => setDescription(event.target.value)} minLength={10} maxLength={2000} required rows={3} className="w-full rounded-md border border-border p-3 text-sm" placeholder="Describe why this content needs review. Do not include passwords or personal details." />
          <FormError message={reportError} />
          {reportMessage && <p role="status" className="text-sm text-status-success">{reportMessage}</p>}
          <Button type="submit" size="sm" isLoading={isReporting}>Submit Report</Button>
        </form>
      )}
    </PageContainer>
  );
};
