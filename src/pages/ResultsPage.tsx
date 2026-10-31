import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck, PlusCircle } from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { ResultCard } from '../components/results/ResultCard';
import { EmptyState } from '../components/common/EmptyState';
import { ScanResult } from '../types';

export const ResultsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [result, setResult] = useState<ScanResult | null>(null);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  useEffect(() => {
    // Check router state or session storage for an actual result
    const stateResult = (location.state as { result?: ScanResult })?.result;
    if (stateResult) {
      setResult(stateResult);
      return;
    }

    const stored = sessionStorage.getItem('scamshield_latest_result');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setResult(parsed);
      } catch {
        setResult(null);
      }
    }
  }, [location.state]);

  const handleSave = (res: ScanResult) => {
    // Save to local scan records
    try {
      const existing = localStorage.getItem('scamshield_saved_scans');
      const list: ScanResult[] = existing ? JSON.parse(existing) : [];
      if (!list.some((item) => item.id === res.id)) {
        list.unshift(res);
        localStorage.setItem('scamshield_saved_scans', JSON.stringify(list));
      }
      setIsSaved(true);
    } catch {
      // Storage error fallback
    }
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
        onSave={handleSave}
        isSaved={isSaved}
      />
    </PageContainer>
  );
};
