import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-background-secondary border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & mission */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-brand flex items-center justify-center text-white">
                <Shield className="w-4 h-4 fill-white/20" />
              </div>
              <span className="font-bold text-base tracking-tight text-text-primary">
                ScamShield<span className="text-brand">AI</span>
              </span>
            </div>
            <p className="text-sm text-text-secondary max-w-sm leading-relaxed">
              Autonomous cybersecurity analysis tool designed to inspect deceptive communications, fraudulent domains, and phishing artifacts before they compromise user security.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white border border-border text-xs text-text-primary">
                <span className="w-2 h-2 rounded-full bg-status-success inline-block" />
                Detection Engine: Active
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white border border-border text-xs text-text-secondary">
                <Lock className="w-3 h-3 text-brand" />
                TLS 1.3 Encrypted
              </span>
            </div>
          </div>

          {/* Core Tools */}
          <div>
            <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-3">
              Detection Capabilities
            </h4>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li>
                <Link to="/scan" className="hover:text-brand transition-colors">
                  Message Text Analysis
                </Link>
              </li>
              <li>
                <Link to="/scan" className="hover:text-brand transition-colors">
                  Screenshot Heuristics
                </Link>
              </li>
              <li>
                <Link to="/scan" className="hover:text-brand transition-colors">
                  URL & Domain Inspection
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-brand transition-colors">
                  Scanning Methodology
                </Link>
              </li>
            </ul>
          </div>

          {/* Governance & Compliance */}
          <div>
            <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-3">
              Security & Privacy
            </h4>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li>
                <a href="#privacy" className="hover:text-brand transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#terms" className="hover:text-brand transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#disclosure" className="hover:text-brand transition-colors">
                  Responsible Disclosure
                </a>
              </li>
              <li>
                <Link to="/admin" className="hover:text-brand transition-colors">
                  Security Administration
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Disclaimer & Copyright */}
        <div className="mt-10 pt-6 border-t border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-text-secondary">
          <p className="max-w-2xl leading-relaxed">
            Notice: ScamShield AI provides automated heuristic assessments based on pattern recognition and threat intelligence. Automated assessments do not replace organizational security audits or legal advice.
          </p>
          <p className="shrink-0">
            &copy; {new Date().getFullYear()} ScamShield AI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
