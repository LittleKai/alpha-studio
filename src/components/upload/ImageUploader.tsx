import React, { useCallback, useState } from 'react';
import { useTranslation } from '../../i18n/context';
import { uploadToCloudinary, loadImageFromUrl } from '../../services/cloudinaryService';

interface ImageUploaderProps {
  onImageSelect: (file: File | null, dataUrl: string) => void;
  imageUrl: string | null;
  onClear: () => void;
  enableHostUpload?: boolean;
  onHostedUrlChange?: (url: string) => void;
}

type InputMode = 'upload' | 'url';

const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImageSelect,
  imageUrl,
  onClear,
  enableHostUpload = true,
  onHostedUrlChange
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [inputMode, setInputMode] = useState<InputMode>('upload');
  const [urlInput, setUrlInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hostedUrl, setHostedUrl] = useState<string | null>(null);
  const { t } = useTranslation();

  const handleFile = useCallback((file: File) => {
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      onImageSelect(file, e.target?.result as string);
      setHostedUrl(null);
    };
    reader.readAsDataURL(file);
  }, [onImageSelect]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.[0]) handleFile(event.target.files[0]);
  };

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    if (event.dataTransfer.files?.[0]) handleFile(event.dataTransfer.files[0]);
  }, [handleFile]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleUrlLoad = async () => {
    if (!urlInput.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const dataUrl = await loadImageFromUrl(urlInput.trim());
      onImageSelect(null, dataUrl);
      setHostedUrl(urlInput.trim());
      onHostedUrlChange?.(urlInput.trim());
    } catch (err) {
      setError('Could not load image from URL. Please check if the URL is correct and accessible.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadToHost = async () => {
    if (!imageUrl) return;

    setIsUploading(true);
    setError(null);

    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], 'image.png', { type: blob.type });

      const result = await uploadToCloudinary(file);

      if (result.success) {
        setHostedUrl(result.url);
        onHostedUrlChange?.(result.url);
      } else {
        setError(result.error || 'Upload failed');
      }
    } catch (err) {
      setError('Failed to upload image to host');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClear = () => {
    onClear();
    setHostedUrl(null);
    setUrlInput('');
    setError(null);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Mode tabs */}
      {!imageUrl && (
        <div className="flex gap-1 p-1 bg-[var(--bg-tertiary)] rounded-lg">
          <button
            onClick={() => setInputMode('upload')}
            className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              inputMode === 'upload'
                ? 'bg-[var(--accent-primary)] text-white'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Upload
          </button>
          <button
            onClick={() => setInputMode('url')}
            className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              inputMode === 'url'
                ? 'bg-[var(--accent-primary)] text-white'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            URL
          </button>
        </div>
      )}

      {/* URL Input Mode */}
      {!imageUrl && inputMode === 'url' && (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="flex-1 px-3 py-2 text-sm bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)]"
              onKeyDown={(e) => e.key === 'Enter' && handleUrlLoad()}
            />
            <button
              onClick={handleUrlLoad}
              disabled={isLoading || !urlInput.trim()}
              className="px-4 py-2 text-sm font-medium bg-[var(--accent-primary)] text-white rounded-lg hover:bg-[var(--accent-secondary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
              ) : 'Load'}
            </button>
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
      )}

      {/* Upload Mode - Drop zone */}
      {inputMode === 'upload' && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`relative w-full aspect-square bg-[var(--bg-secondary)] rounded-lg flex items-center justify-center transition-colors duration-200 select-none ${
            isDragging ? 'outline-dashed outline-2 outline-[var(--accent-primary)] bg-[rgba(249,115,22,0.1)]' : ''
          } ${imageUrl ? 'p-0' : 'p-4 border-2 border-dashed border-[var(--border-primary)]'}`}
        >
          {!imageUrl ? (
            <label htmlFor="file-upload" className="flex flex-col items-center justify-center text-[var(--text-tertiary)] cursor-pointer w-full h-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.158 0h.008v.008h-.008V8.25z" />
              </svg>
              <p className="mb-1 text-sm font-semibold text-[var(--text-secondary)]">{t('imageEditor.upload')}</p>
              <p className="text-xs">{t('imageEditor.dragAndDrop')}</p>
              <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
            </label>
          ) : (
            <>
              <img src={imageUrl} alt="Uploaded" className="w-full h-full object-contain rounded-lg" />
              <button
                onClick={handleClear}
                className="absolute top-2 right-2 z-10 p-1.5 bg-black/50 backdrop-blur-sm rounded-full text-white hover:bg-red-600 transition-colors"
                aria-label="Remove image"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </>
          )}
        </div>
      )}

      {/* URL mode with preview */}
      {inputMode === 'url' && imageUrl && (
        <div className="relative w-full aspect-square bg-[var(--bg-secondary)] rounded-lg">
          <img src={imageUrl} alt="From URL" className="w-full h-full object-contain rounded-lg" />
          <button
            onClick={handleClear}
            className="absolute top-2 right-2 z-10 p-1.5 bg-black/50 backdrop-blur-sm rounded-full text-white hover:bg-red-600 transition-colors"
            aria-label="Remove image"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      {/* Upload to host button & hosted URL display */}
      {imageUrl && enableHostUpload && (
        <div className="flex flex-col gap-2">
          {!hostedUrl ? (
            <button
              onClick={handleUploadToHost}
              disabled={isUploading}
              className="flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium bg-[var(--bg-tertiary)] text-[var(--text-secondary)] rounded-lg hover:bg-[var(--accent-primary)] hover:text-white transition-colors disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Uploading...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Upload to Cloud
                </>
              )}
            </button>
          ) : (
            <div className="flex items-center gap-2 p-2 bg-green-500/10 border border-green-500/30 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <input
                type="text"
                value={hostedUrl}
                readOnly
                className="flex-1 text-xs bg-transparent text-[var(--text-secondary)] outline-none"
              />
              <button
                onClick={() => copyToClipboard(hostedUrl)}
                className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                title="Copy URL"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          )}
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
