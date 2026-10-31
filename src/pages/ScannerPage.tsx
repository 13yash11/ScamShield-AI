import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Image, Globe, AlertCircle, Trash2, ArrowRight } from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { ScannerTabs } from '../components/scanner/ScannerTabs';
import { FileUpload } from '../components/scanner/FileUpload';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { FormError } from '../components/common/FormError';
import { LoadingState } from '../components/common/LoadingState';
import { ScanType, ScanResult } from '../types';
import { apiService } from '../services/api';

export const ScannerPage: React.FC = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<ScanType>('text');
  const [textInput, setTextInput] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [urlInput, setUrlInput] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const maxTextChars = 8000;

  const handleClearText = () => {
    setTextInput('');
    setError(null);
  };

  const handleClearUrl = () => {
    setUrlInput('');
    setError(null);
  };

  const validateUrl = (url: string): boolean => {
    try {
      const parsed = new URL(url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`);
      return Boolean(parsed.hostname && parsed.hostname.includes('.'));
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let result: ScanResult | null = null;

    try {
      if (activeTab === 'text') {
        if (!textInput.trim()) {
          setError('Please paste or type the suspicious message text before analyzing.');
          return;
        }
        if (textInput.trim().length < 10) {
          setError('Message text is too short. Please provide at least 10 characters for heuristic analysis.');
          return;
        }
        setIsLoading(true);
        result = await apiService.scanText(textInput.trim());
      } else if (activeTab === 'screenshot') {
        if (!selectedFile) {
          setError('Please upload a screenshot image file (PNG, JPEG, or WEBP).');
          return;
        }
        setIsLoading(true);
        result = await apiService.scanFile(selectedFile);
      } else if (activeTab === 'url') {
        if (!urlInput.trim()) {
          setError('Please provide a web address (URL) to inspect.');
          return;
        }
        if (!validateUrl(urlInput.trim())) {
          setError('Invalid URL format. Please provide a complete domain (e.g. https://example.com/login).');
          return;
        }
        setIsLoading(true);
        result = await apiService.scanUrl(urlInput.trim());
      }

      if (result) {
        // Save into sessionStorage for Results page access
        sessionStorage.setItem('scamshield_latest_result', JSON.stringify(result));
        navigate('/results', { state: { result } });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred while communicating with the scanning service.';
      setError(
        `${message} Note: Live scans require an active Python FastAPI backend with Gemini API credentials.`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageContainer
      title="Scam & Threat Scanner"
      subtitle="Analyze communications, screenshots, and links against fraud signatures and deceptive engineering heuristics."
      maxWidth="lg"
    >
      <div className="bg-white border border-border rounded-lg shadow-card">
        {/* Scanner Tabs */}
        <ScannerTabs activeTab={activeTab} onChange={(tab) => { setActiveTab(tab); setError(null); }} disabled={isLoading} />

        {/* Tab Panels */}
        <div className="p-5 sm:p-8">
          {error && <FormError message={error} className="mb-6" />}

          {isLoading ? (
            <LoadingState
              title={
                activeTab === 'text'
                  ? 'Analyzing Message Structure'
                  : activeTab === 'screenshot'
                  ? 'Processing Image & Extracting Text (OCR)'
                  : 'Inspecting Domain & Redirect Heuristics'
              }
              description="Evaluating syntax, authority pretexts, phishing domain cross-references, and threat probabilities..."
            />
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              {/* Tab 1: Text Scanner */}
              {activeTab === 'text' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label htmlFor="message-text-area" className="text-sm font-semibold text-text-primary flex items-center gap-2">
                      <FileText className="w-4 h-4 text-brand" />
                      <span>Suspicious Message Content</span>
                    </label>
                    <span className={`text-xs font-mono ${textInput.length > maxTextChars ? 'text-status-danger font-bold' : 'text-text-secondary'}`}>
                      {textInput.length} / {maxTextChars} characters
                    </span>
                  </div>

                  <div className="relative">
                    <textarea
                      id="message-text-area"
                      rows={8}
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="Paste suspicious SMS, email, WhatsApp, Telegram, or social media text here..."
                      className="w-full rounded-md border border-border p-3.5 text-sm text-text-primary placeholder:text-text-secondary/60 focus:border-brand focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand font-mono leading-relaxed"
                      maxLength={maxTextChars}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleClearText}
                      disabled={!textInput || isLoading}
                      leftIcon={<Trash2 className="w-4 h-4" />}
                    >
                      Clear Content
                    </Button>

                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      disabled={!textInput.trim() || isLoading}
                      rightIcon={<ArrowRight className="w-4 h-4" />}
                    >
                      Analyze Message
                    </Button>
                  </div>
                </div>
              )}

              {/* Tab 2: Screenshot Scanner */}
              {activeTab === 'screenshot' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-1">
                      <Image className="w-4 h-4 text-brand" />
                      <span>Upload Screenshot for Visual & OCR Analysis</span>
                    </h3>
                    <p className="text-xs text-text-secondary">
                      Upload chat screenshots, email snapshots, or deceptive banking interface dialogues.
                    </p>
                  </div>

                  <FileUpload
                    onFileSelect={(file) => setSelectedFile(file)}
                    selectedFile={selectedFile}
                    disabled={isLoading}
                  />

                  <div className="flex justify-end pt-2">
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      disabled={!selectedFile || isLoading}
                      rightIcon={<ArrowRight className="w-4 h-4" />}
                    >
                      Analyze Screenshot
                    </Button>
                  </div>
                </div>
              )}

              {/* Tab 3: URL Scanner */}
              {activeTab === 'url' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-1">
                      <Globe className="w-4 h-4 text-brand" />
                      <span>Target URL & Phishing Domain Check</span>
                    </h3>
                    <p className="text-xs text-text-secondary">
                      Check suspicious links received via SMS, email, or messaging applications.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Input
                      label="Web Address (URL)"
                      placeholder="https://secure-login-verify-account.example.com"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      leftIcon={<Globe className="w-4 h-4" />}
                      disabled={isLoading}
                    />

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleClearUrl}
                        disabled={!urlInput || isLoading}
                        leftIcon={<Trash2 className="w-4 h-4" />}
                      >
                        Clear URL
                      </Button>

                      <Button
                        type="submit"
                        variant="primary"
                        size="md"
                        disabled={!urlInput.trim() || isLoading}
                        rightIcon={<ArrowRight className="w-4 h-4" />}
                      >
                        Check URL
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </form>
          )}
        </div>

        {/* Integration notice */}
        <div className="p-4 bg-background-secondary/60 border-t border-border rounded-b-lg flex items-start gap-3 text-xs text-text-secondary">
          <AlertCircle className="w-4 h-4 text-brand shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Data submitted to the scanner is evaluated for malicious indicators and phishing heuristics. Submissions are processed without storing unencrypted identifiable personal credentials.
          </p>
        </div>
      </div>
    </PageContainer>
  );
};
