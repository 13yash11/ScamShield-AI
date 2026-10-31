import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react';
import { RiskLevel } from '../../types';

interface RiskIndicatorProps {
  level: RiskLevel;
  score?: number; // 0 to 100
  size?: 'sm' | 'md' | 'lg';
  showScore?: boolean;
}

export const RiskIndicator: React.FC<RiskIndicatorProps> = ({
  level,
  score,
  size = 'md',
  showScore = true,
}) => {
  const configs = {
    LOW: {
      label: 'Low Risk',
      color: '#237A57',
      bg: 'bg-status-success-bg',
      text: 'text-status-success',
      border: 'border-[#C2E3D4]',
      icon: ShieldCheck,
      description: 'No known scam signatures or deceptive tactics detected.',
    },
    MEDIUM: {
      label: 'Medium Risk (Caution)',
      color: '#B7791F',
      bg: 'bg-status-warning-bg',
      text: 'text-status-warning',
      border: 'border-[#F8E1BE]',
      icon: AlertTriangle,
      description: 'Suspicious elements identified. Exercise caution and verify independently.',
    },
    HIGH: {
      label: 'High Risk (Likely Scam)',
      color: '#B42332',
      bg: 'bg-status-danger-bg',
      text: 'text-status-danger',
      border: 'border-[#F4C5CA]',
      icon: ShieldAlert,
      description: 'Strong indicators of fraud, phishing, or impersonation detected.',
    },
  };

  const config = configs[level] || configs.LOW;
  const Icon = config.icon;

  if (size === 'sm') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded ${config.bg} ${config.text} border ${config.border}`}
      >
        <Icon className="w-3.5 h-3.5" aria-hidden="true" />
        <span>{config.label}</span>
      </span>
    );
  }

  return (
    <div className={`p-4 rounded-lg border ${config.bg} ${config.border} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4`}>
      <div className="flex items-start sm:items-center gap-3">
        <div className={`p-2.5 rounded-md bg-white border ${config.border} ${config.text} shrink-0`}>
          <Icon className="w-6 h-6" aria-hidden="true" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className={`text-base font-semibold ${config.text}`}>
              {config.label}
            </h3>
            {showScore && typeof score === 'number' && (
              <span className={`text-xs px-2 py-0.5 rounded font-mono font-medium bg-white border ${config.border} ${config.text}`}>
                Threat Score: {score}/100
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
            {config.description}
          </p>
        </div>
      </div>
    </div>
  );
};
