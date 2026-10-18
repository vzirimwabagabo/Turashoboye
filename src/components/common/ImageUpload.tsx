import { useState, useRef } from 'react';
import type { DragEvent, ChangeEvent } from 'react';
import { Upload, X, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { uploadMediaFile, validateProductImage, validateComplianceDocument, getOptimizedImageUrl } from '../../lib/cloudinary';
import type { UploadResult } from '../../lib/cloudinary';

interface ImageUploadProps {
  value?: string;
  publicId?: string;
  onChange: (result: { url: string; publicId: string } | null) => void;
  label?: string;
  helperText?: string;
  folder?: 'products' | 'compliance';
  disabled?: boolean;
  className?: string;
}

export default function ImageUpload({
  value,
  publicId,
  onChange,
  label = 'Product Image',
  helperText = 'JPG, PNG, or WebP. Max 2MB. Automatically converted to optimized WebP.',
  folder = 'products',
  disabled = false,
  className = '',
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(value);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileProcess = async (file: File) => {
    setError(null);

    // Client-side validation
    const validation =
      folder === 'products'
        ? validateProductImage(file)
        : validateComplianceDocument(file);

    if (!validation.valid) {
      setError(validation.error || 'Invalid file.');
      return;
    }

    try {
      setUploading(true);
      const result: UploadResult = await uploadMediaFile(file, folder);
      setPreviewUrl(result.url);
      onChange({ url: result.url, publicId: result.publicId });
    } catch (err: any) {
      setError(err?.message || 'Failed to upload image. Please check your network or try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled || uploading) return;
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (disabled || uploading) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewUrl(undefined);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onChange(null);
  };

  const currentPreview = previewUrl || value;

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-gray-700">
          {label}
        </label>
      )}

      {currentPreview ? (
        <div className="relative group rounded-2xl border border-gray-200 bg-gray-50 overflow-hidden p-2 flex items-center gap-4">
          <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
            <img
              src={getOptimizedImageUrl(currentPreview, { width: 200, height: 200, crop: 'fill' })}
              alt="Uploaded preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                // If optimized url fails or is an object url, fallback to original
                (e.target as HTMLImageElement).src = currentPreview;
              }}
            />
            {uploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 pr-10">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#2E7D32]">
              <CheckCircle2 size={14} />
              <span>Image Ready</span>
            </div>
            <p className="text-xs text-gray-500 truncate mt-0.5">
              {publicId || 'Optimized Cloudinary WebP'}
            </p>
            <p className="text-[11px] text-gray-400 mt-1">
              Serving automatically via Cloudinary edge CDN with responsive WebP compression.
            </p>
          </div>

          {!disabled && !uploading && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/90 hover:bg-red-50 text-gray-400 hover:text-red-600 shadow-xs border border-gray-200 transition-colors"
              title="Remove image"
            >
              <X size={16} />
            </button>
          )}
        </div>
      ) : (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
            dragActive
              ? 'border-[#2E7D32] bg-emerald-50/50 scale-[0.99]'
              : 'border-gray-300 hover:border-[#2E7D32] bg-gray-50/70 hover:bg-emerald-50/20'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={folder === 'products' ? 'image/jpeg,image/png,image/webp' : 'application/pdf,image/jpeg,image/png,image/webp'}
            onChange={handleChange}
            disabled={disabled || uploading}
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#2E7D32] flex items-center justify-center">
              {uploading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <Upload className="w-6 h-6" />
              )}
            </div>

            <div className="space-y-1">
              <p className="text-xs font-semibold text-gray-800">
                {uploading
                  ? 'Optimizing and uploading to Cloudinary...'
                  : 'Click to select or drag and drop image'}
              </p>
              <p className="text-[11px] text-gray-500">
                {helperText}
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 border border-red-200 p-2.5 rounded-xl">
          <AlertTriangle size={14} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
