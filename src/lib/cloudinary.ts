// src/lib/cloudinary.ts
/**
 * Cloudinary Media Management Utility for Turashoboye Feeds.
 *
 * Security & Performance Principles:
 * 1. Product images: Enforces <= 2MB max file size, compresses and serves as WebP / f_auto.
 * 2. Regulatory documents: Enforces <= 10MB max file size for PDFs, inspection certificates, RSB marks.
 * 3. Never exposes Cloudinary API Secret in browser client code.
 */

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'turashoboye';
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'turashoboye_products';

export interface UploadResult {
  url: string;
  publicId: string;
  format: string;
  bytes: number;
}

/**
 * Validate image file size and MIME type before uploading.
 */
export function validateProductImage(file: File): { valid: boolean; error?: string } {
  const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file format. Only JPG, PNG, and WebP product images are permitted.',
    };
  }

  if (file.size > MAX_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds the 2 MB maximum limit.`,
    };
  }

  return { valid: true };
}

/**
 * Validate regulatory document file size and type (PDF, JPG, PNG up to 10MB).
 */
export function validateComplianceDocument(file: File): { valid: boolean; error?: string } {
  const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
  ];

  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid document format. Only PDF, JPG, and PNG certificates are permitted.',
    };
  }

  if (file.size > MAX_SIZE_BYTES) {
    return {
      valid: false,
      error: `Document size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds the 10 MB maximum limit.`,
    };
  }

  return { valid: true };
}

/**
 * Generate an optimized, auto-formatted Cloudinary image URL.
 */
export function getOptimizedImageUrl(
  publicIdOrUrl: string,
  options?: { width?: number; height?: number; crop?: string }
): string {
  if (!publicIdOrUrl) return '';

  // If already a full URL and not Cloudinary, return as-is
  if (publicIdOrUrl.startsWith('http') && !publicIdOrUrl.includes('res.cloudinary.com')) {
    return publicIdOrUrl;
  }

  const { width = 800, height, crop = 'limit' } = options || {};
  const transformations = [
    'f_auto',
    'q_auto',
    `w_${width}`,
    height ? `h_${height}` : '',
    `c_${crop}`,
  ]
    .filter(Boolean)
    .join(',');

  if (publicIdOrUrl.includes('res.cloudinary.com')) {
    // Inject transformation parameters into Cloudinary URL
    return publicIdOrUrl.replace('/upload/', `/upload/${transformations}/`);
  }

  // Construct Cloudinary URL from publicId
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transformations}/${publicIdOrUrl}`;
}

/**
 * Upload a media file using signed upload or client preset.
 */
export async function uploadMediaFile(
  file: File,
  folder: 'products' | 'compliance' = 'products'
): Promise<UploadResult> {
  const validation =
    folder === 'products'
      ? validateProductImage(file)
      : validateComplianceDocument(file);

  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Fallback demo/offline mode if cloud name is demo placeholder
  if (CLOUD_NAME === 'turashoboye-demo') {
    // Generate an in-memory object URL for offline/demo operation
    const mockUrl = URL.createObjectURL(file);
    return {
      url: mockUrl,
      publicId: `local-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`,
      format: file.type.split('/')[1] || 'webp',
      bytes: file.size,
    };
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', `turashoboye/${folder}`);

  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;

  const response = await fetch(endpoint, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || `Cloudinary upload failed with HTTP status ${response.status}`
    );
  }

  const data = await response.json();
  return {
    url: data.secure_url || data.url,
    publicId: data.public_id,
    format: data.format,
    bytes: data.bytes,
  };
}
