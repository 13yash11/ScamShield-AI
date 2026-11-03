import React, { useEffect, useRef, useState } from 'react';
import { UploadCloud, FileImage, X, AlertCircle } from 'lucide-react';
import { Button } from '../common/Button';

interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
  maxSizeBytes?: number;
  acceptedFormats?: string[];
  disabled?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  selectedFile,
  maxSizeBytes = 3 * 1024 * 1024,
  acceptedFormats = ['image/png', 'image/jpeg', 'image/webp'],
  disabled = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  const validateAndSetFile = (file: File) => {
    setError(null);

    if (!acceptedFormats.includes(file.type)) {
      setError('Unsupported file type. Please upload a PNG, JPEG, or WEBP screenshot.');
      return;
    }

    if (file.size > maxSizeBytes) {
      setError(`File size exceeds ${(maxSizeBytes / (1024 * 1024)).toFixed(0)}MB limit.`);
      return;
    }

    onFileSelect(file);

    // Create preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleClear = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setError(null);
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full flex flex-col gap-3">
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats.join(',')}
        onChange={handleInputChange}
        disabled={disabled}
        className="hidden"
        id="screenshot-file-input"
        aria-label="Upload screenshot file"
      />

      {!selectedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragOver
              ? 'border-brand bg-brand-subtle/50'
              : 'border-border hover:border-brand/70 bg-background-secondary/50'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
        >
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="p-3 bg-white rounded-md border border-border text-brand">
              <UploadCloud className="w-6 h-6" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">
                Drag and drop screenshot here, or <span className="text-brand underline underline-offset-2">browse files</span>
              </p>
              <p className="text-xs text-text-secondary mt-1">
                Supports PNG, JPEG, WEBP up to {(maxSizeBytes / (1024 * 1024)).toFixed(0)}MB.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="border border-border rounded-lg p-4 bg-background-secondary/30 flex flex-col sm:flex-row items-center gap-4">
          {previewUrl && (
            <div className="relative w-28 h-28 shrink-0 bg-white border border-border rounded-md overflow-hidden flex items-center justify-center">
              <img
                src={previewUrl}
                alt="Selected screenshot preview"
                className="w-full h-full object-contain"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <FileImage className="w-4 h-4 text-brand shrink-0" aria-hidden="true" />
              <p className="text-sm font-medium text-text-primary truncate" title={selectedFile.name}>
                {selectedFile.name}
              </p>
            </div>
            <p className="text-xs text-text-secondary mt-1">
              {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type || 'Image'}
            </p>
            <p className="text-xs text-status-success font-medium mt-1">
              File selected; the server will validate its content
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
            >
              Replace
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={disabled}
              aria-label="Remove selected file"
            >
              <X className="w-4 h-4 text-text-secondary" />
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-xs text-status-danger font-medium p-2 bg-status-danger-bg rounded border border-[#F3C4C8]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
