import React from 'react';
import { ArrowLeft, Bookmark, ShieldAlert, CheckCircle2, Info, AlertOctagon } from 'lucide-react';
import { ScanResult } from '../../types';
import { RiskIndicator } from '../common/RiskIndicator';
import { Button } from '../common/Button';

interface ResultCardProps {
  result: ScanResult;
  onAnalyzeAgain: () => void;
  onSave?: (result: ScanResult) => void;
  isSaved?: boolean;
}

export const ResultCard: React.FC<ResultCardProps> = ({
  result,
  onAnalyzeAgain,
  onSave,
  isSaved = false,
}) => {
  return (
    <div className="bg-white border border-border rounded-lg shadow-card divide-y divide-border">
      {/* Header bar */}
      <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-text-secondary">
              Scan Type: {result.scanType}
            </span>
            <span className="text-text-secondary text-xs">•</span>
            <span className="text-xs text-text-secondary">
              Analyzed {new Date(result.createdAt).toLocaleString()}
            </span>
          </div>
          <h2 className="text-xl font-bold text-text-primary mt-1">
            Cyber Threat Assessment Report
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {onSave && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onSave(result)}
              leftIcon={<Bookmark className={`w-4 h-4 ${isSaved ? 'fill-brand text-brand' : ''}`} />}
            >
              {isSaved ? 'Saved' : 'Save Result'}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onAnalyzeAgain}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Analyze Again
          </Button>
        </div>
      </div>

      {/* Target inspection */}
      <div className="p-5 sm:p-6 bg-background-secondary/40">
        <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
          Inspected Target
        </h3>
        <div className="bg-white p-3 rounded border border-border font-mono text-xs text-text-primary break-all max-h-36 overflow-y-auto">
          {result.target}
        </div>
      </div>

      {/* Risk Badge / Indicator */}
      <div className="p-5 sm:p-6">
        <RiskIndicator level={result.riskLevel} score={result.riskScore} />
      </div>

      {/* Summary */}
      <div className="p-5 sm:p-6">
        <h3 className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
          <Info className="w-4 h-4 text-brand" />
          <span>Executive Summary</span>
        </h3>
        <p className="text-sm text-text-primary leading-relaxed bg-background-secondary p-3.5 rounded border border-border">
          {result.summary}
        </p>
      </div>

      {/* Highlighted suspicious phrases if available */}
      {result.suspiciousPhrases && result.suspiciousPhrases.length > 0 && (
        <div className="p-5 sm:p-6">
          <h3 className="text-sm font-semibold text-status-danger mb-2 flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-status-danger" />
            <span>Flagged Suspicious Phrases & Patterns</span>
          </h3>
          <div className="flex flex-wrap gap-2">
            {result.suspiciousPhrases.map((phrase, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 text-xs font-mono font-medium rounded bg-status-danger-bg text-status-danger border border-[#F3C4C8]"
              >
                "{phrase}"
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Warning signs */}
      <div className="p-5 sm:p-6">
        <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-status-warning" />
          <span>Observed Warning Signs ({result.warningSigns.length})</span>
        </h3>
        <ul className="space-y-2">
          {result.warningSigns.map((sign, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-sm text-text-primary">
              <span className="w-1.5 h-1.5 rounded-full bg-status-warning mt-2 shrink-0" />
              <span>{sign}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Technical Explanation */}
      <div className="p-5 sm:p-6">
        <h3 className="text-sm font-semibold text-text-primary mb-2">
          Detailed Explanation
        </h3>
        <p className="text-sm text-text-secondary leading-relaxed">
          {result.explanation}
        </p>
      </div>

      {/* Safety recommendations */}
      <div className="p-5 sm:p-6 bg-[#FAFDFB]">
        <h3 className="text-sm font-semibold text-status-success mb-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-status-success" />
          <span>Recommended Safety Actions</span>
        </h3>
        <ul className="space-y-2.5">
          {result.recommendations.map((rec, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-text-primary">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-status-success-bg text-status-success text-xs font-semibold shrink-0">
                {idx + 1}
              </span>
              <span className="leading-snug">{rec}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Detection method and limitations */}
      <div className="p-5 sm:p-6 bg-background-secondary/30 text-xs text-text-secondary">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold text-text-primary mb-1">Detection Methodology</h4>
            <p>{result.detectionMethod}</p>
          </div>
          <div>
            <h4 className="font-semibold text-text-primary mb-1">Limitations</h4>
            <p>{result.limitations}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
