import React from 'react';
import { FileText, Image, Globe } from 'lucide-react';
import { ScanType } from '../../types';

interface ScannerTabsProps {
  activeTab: ScanType;
  onChange: (tab: ScanType) => void;
  disabled?: boolean;
}

export const ScannerTabs: React.FC<ScannerTabsProps> = ({
  activeTab,
  onChange,
  disabled = false,
}) => {
  const tabs: { id: ScanType; label: string; icon: React.ReactNode }[] = [
    {
      id: 'text',
      label: 'Text Scanner',
      icon: <FileText className="w-4 h-4" aria-hidden="true" />,
    },
    {
      id: 'screenshot',
      label: 'Screenshot Scanner',
      icon: <Image className="w-4 h-4" aria-hidden="true" />,
    },
    {
      id: 'url',
      label: 'URL Scanner',
      icon: <Globe className="w-4 h-4" aria-hidden="true" />,
    },
  ];

  return (
    <div
      role="tablist"
      aria-label="Scan Content Types"
      className="flex border-b border-border space-x-1 sm:space-x-2 bg-background-secondary p-1 rounded-t-lg"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={isActive}
            aria-controls={`scanner-panel-${tab.id}`}
            id={`tab-${tab.id}`}
            disabled={disabled}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-md transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
              isActive
                ? 'bg-white text-brand shadow-subtle border border-border border-b-transparent font-semibold'
                : 'text-text-secondary hover:text-text-primary hover:bg-white/60'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};
