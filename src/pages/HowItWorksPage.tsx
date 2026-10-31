import React from 'react';
import { Link } from 'react-router-dom';
import { Send, Cpu, ShieldCheck, CheckCircle2, ArrowRight, AlertTriangle, Lock } from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { Button } from '../components/common/Button';

export const HowItWorksPage: React.FC = () => {
  const steps = [
    {
      step: 'Step 1',
      icon: Send,
      title: 'Submit suspicious content',
      description:
        'Copy and paste suspicious SMS or email text, upload an image screenshot of an unfamiliar conversation, or type in a questionable web link.',
      details: [
        'Works with text from any messaging application',
        'Optical Character Recognition (OCR) for screenshot text extraction',
        'Structural URL and domain syntax inspection',
      ],
    },
    {
      step: 'Step 2',
      icon: Cpu,
      title: 'The system analyzes warning signs',
      description:
        'The automated analysis engine searches for known deceptive psychological tactics, urgent pressure triggers, spoofed brand domains, and fraudulent banking pretexts.',
      details: [
        'Evaluates linguistic cues: urgency, fear, false authority, and unusual payment methods',
        'Cross-checks URLs for typo-squatting and misleading subdomains',
        'Flags deceptive formatting and impersonated sender patterns',
      ],
    },
    {
      step: 'Step 3',
      icon: ShieldCheck,
      title: 'Review the risk assessment',
      description:
        'Receive an objective risk indicator (Low, Medium, or High) along with a summary of identified threat characteristics.',
      details: [
        'Low Risk: No standard fraud signatures detected',
        'Medium Risk: Suspicious elements found; independent verification advised',
        'High Risk: Strong indicators of fraud, phishing, or financial deception',
      ],
    },
    {
      step: 'Step 4',
      icon: CheckCircle2,
      title: 'Read explanations and safety advice',
      description:
        'Inspect specific flagged phrases and follow concrete, practical security steps to protect your personal information, accounts, and finances.',
      details: [
        'Clear explanations without confusing technical jargon',
        'Direct guidance on how to safely verify the authentic sender',
        'Practical protective steps to take if you have already clicked or responded',
      ],
    },
  ];

  return (
    <PageContainer
      title="How ScamShield AI Works"
      subtitle="A clear, four-step approach to evaluating suspicious messages and avoiding fraud."
      maxWidth="lg"
    >
      <div className="space-y-12">
        {/* Step Cards */}
        <div className="space-y-6">
          {steps.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-white border border-border rounded-lg p-6 sm:p-8 shadow-card flex flex-col md:flex-row items-start gap-6"
              >
                <div className="w-12 h-12 rounded-lg bg-brand-subtle text-brand flex items-center justify-center shrink-0">
                  <Icon className="w-6 h-6" />
                </div>

                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-brand uppercase tracking-wider bg-background-secondary px-2.5 py-0.5 rounded border border-border">
                      {item.step}
                    </span>
                  </div>

                  <h2 className="text-xl font-bold text-text-primary">
                    {item.title}
                  </h2>

                  <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
                    {item.description}
                  </p>

                  <div className="pt-2 space-y-1.5">
                    {item.details.map((detail, dIdx) => (
                      <div key={dIdx} className="flex items-start gap-2 text-xs sm:text-sm text-text-primary">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand mt-2 shrink-0" />
                        <span>{detail}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Methodology & Safety Disclosures */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-background-secondary/60 border border-border rounded-lg p-6 space-y-3">
            <div className="flex items-center gap-2 text-text-primary font-bold">
              <Lock className="w-5 h-5 text-brand" />
              <h3>Privacy & Data Handling</h3>
            </div>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
              Submissions are analyzed in memory using encrypted communication channels. ScamShield AI does not sell user content, harvest contact lists, or index private data for third-party advertising.
            </p>
          </div>

          <div className="bg-background-secondary/60 border border-border rounded-lg p-6 space-y-3">
            <div className="flex items-center gap-2 text-text-primary font-bold">
              <AlertTriangle className="w-5 h-5 text-status-warning" />
              <h3>Assessment Scope & Limitations</h3>
            </div>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
              Automated heuristics evaluate known patterns, syntax structures, and threat databases. New or highly targeted spear-phishing campaigns may evolve beyond existing indicators. Always verify sensitive requests through known official phone numbers or websites.
            </p>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center p-8 bg-white border border-border rounded-lg shadow-card">
          <h3 className="text-xl font-bold text-text-primary mb-2">
            Ready to inspect a message?
          </h3>
          <p className="text-sm text-text-secondary max-w-md mx-auto mb-6">
            Paste suspicious content or upload a screenshot to receive an instant analysis.
          </p>
          <Link to="/scan">
            <Button size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Open Scam Scanner
            </Button>
          </Link>
        </div>
      </div>
    </PageContainer>
  );
};
