import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Image, Globe, ArrowRight, CheckCircle, ShieldCheck } from 'lucide-react';
import { Button } from '../components/common/Button';

export const HomePage: React.FC = () => {
  const capabilities = [
    {
      icon: FileText,
      title: 'Suspicious Text Analysis',
      description:
        'Inspect SMS, email content, and chat messages for urgent demands, impersonation flags, banking pretexts, and credential harvesting patterns.',
      features: [
        'Heuristic phishing trigger detection',
        'Impersonation and false authority checks',
        'Keyword and urgency frequency breakdown',
      ],
      link: '/scan',
      linkText: 'Scan Message Text',
    },
    {
      icon: Image,
      title: 'Screenshot OCR Inspection',
      description:
        'Upload screenshots of banking alerts, verification dialogues, payment screens, or unfamiliar direct messages to extract and analyze visual threat cues.',
      features: [
        'Automated text extraction from images',
        'Detection of deceptive sender headers',
        'Visual tampering and mismatch evaluation',
      ],
      link: '/scan',
      linkText: 'Upload Screenshot',
    },
    {
      icon: Globe,
      title: 'URL & Domain Verification',
      description:
        'Evaluate suspicious web addresses against known deceptive patterns, typo-squatted brand names, obfuscated redirects, and malicious parameter structures.',
      features: [
        'Domain typo-squatting detection',
        'Protocol and subdomain structural analysis',
        'Known phishing signature cross-referencing',
      ],
      link: '/scan',
      linkText: 'Check URL',
    },
  ];

  const workflowSteps = [
    {
      num: '01',
      title: 'Submit suspicious content',
      desc: 'Paste a message, upload a screenshot, or input a suspicious link into the scanner workspace.',
    },
    {
      num: '02',
      title: 'Automated threat heuristics',
      desc: 'The analysis engine evaluates linguistic patterns, domain structures, and known fraud indicators.',
    },
    {
      num: '03',
      title: 'Objective risk assessment',
      desc: 'Receive a Low, Medium, or High threat rating accompanied by concrete warning signs and explanations.',
    },
    {
      num: '04',
      title: 'Actionable defense steps',
      desc: 'Review practical guidance to protect accounts, verify legitimate senders, and avoid credential exposure.',
    },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-white border-b border-border py-16 sm:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-background-secondary border border-border text-xs font-semibold text-text-secondary uppercase tracking-wider mb-6">
            <ShieldCheck className="w-4 h-4 text-brand" />
            <span>AI-Assisted Fraud & Phishing Defense</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-text-primary max-w-4xl mx-auto leading-tight">
            Check suspicious messages before you trust them.
          </h1>

          <p className="mt-6 text-base sm:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
            Analyze suspicious messages, links, and screenshots. Understand potential scam warning signs and get practical safety guidance.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/scan" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Analyze a Message
              </Button>
            </Link>
            <Link to="/how-it-works" className="w-full sm:w-auto">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                How It Works
              </Button>
            </Link>
          </div>

          <div className="mt-12 pt-8 border-t border-border/80 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-text-secondary">
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle className="w-4 h-4 text-brand" />
              Private & Encrypted Submissions
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle className="w-4 h-4 text-brand" />
              No Account Required for Basic Scans
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle className="w-4 h-4 text-brand" />
              Objective Threat Classification
            </span>
          </div>
        </div>
      </section>

      {/* Product Capabilities Section */}
      <section className="bg-background-secondary/50 py-16 sm:py-20 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-brand mb-2">
              Detection Modules
            </h2>
            <h3 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
              Comprehensive threat analysis across multiple communication vectors.
            </h3>
            <p className="mt-2 text-sm sm:text-base text-text-secondary">
              Modern fraud attacks blend social engineering with technical evasion. ScamShield AI inspects the specific mechanics of each format.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {capabilities.map((cap, idx) => {
              const Icon = cap.icon;
              return (
                <div
                  key={idx}
                  className="bg-white border border-border rounded-lg p-6 flex flex-col justify-between shadow-subtle"
                >
                  <div>
                    <div className="w-10 h-10 rounded-md bg-brand-subtle text-brand flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h4 className="text-lg font-bold text-text-primary mb-2">
                      {cap.title}
                    </h4>
                    <p className="text-sm text-text-secondary leading-relaxed mb-5">
                      {cap.description}
                    </p>
                    <div className="space-y-2 border-t border-border/70 pt-4 mb-6">
                      {cap.features.map((feature, fIdx) => (
                        <div key={fIdx} className="flex items-start gap-2 text-xs text-text-primary">
                          <span className="w-1 h-1 rounded-full bg-brand mt-1.5 shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Link to={cap.link}>
                    <Button variant="secondary" size="sm" className="w-full justify-between" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                      {cap.linkText}
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Scanning Workflow Section */}
      <section className="bg-white py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-brand mb-2">
              System Architecture
            </h2>
            <h3 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
              How the threat engine evaluates submissions
            </h3>
            <p className="mt-2 text-sm sm:text-base text-text-secondary">
              A transparent, rule-informed pipeline that explains why content is flagged.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {workflowSteps.map((step, idx) => (
              <div
                key={idx}
                className="p-5 rounded-lg border border-border bg-background-secondary/30 relative"
              >
                <div className="text-xs font-mono font-bold text-brand bg-white border border-border inline-block px-2 py-0.5 rounded mb-3">
                  {step.num}
                </div>
                <h4 className="text-base font-bold text-text-primary mb-1.5">
                  {step.title}
                </h4>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Quick scan CTA box */}
          <div className="mt-14 p-8 bg-background-secondary border border-border rounded-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h4 className="text-lg font-bold text-text-primary">
                Uncertain about a recent message or invoice?
              </h4>
              <p className="text-sm text-text-secondary mt-1 max-w-xl">
                Do not click embedded links or reply with personal details. Submit the text or screenshot for an immediate threat breakdown.
              </p>
            </div>
            <Link to="/scan" className="shrink-0">
              <Button size="md">
                Open Scanner Workspace
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
