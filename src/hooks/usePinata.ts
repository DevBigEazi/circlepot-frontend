import { useState, useCallback } from 'react';

// Pinata credentials
const PINATA_JWT = import.meta.env.VITE_PINATA_JWT;
const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL || 'https://gateway.pinata.cloud';
// Ensure gateway URL has https:// protocol
const PINATA_GATEWAY = GATEWAY_URL.startsWith('http://') || GATEWAY_URL.startsWith('https://') 
  ? GATEWAY_URL 
  : `https://${GATEWAY_URL}`;

export interface PinataUploadResult {
  ipfsUrl: string;
  ipfsHash: string;
  size: number;
}

export interface PinataError {
  code: string;
  message: string;
  details?: any;
}

export const usePinata = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<PinataError | null>(null);
  const [lastUploadedUrl, setLastUploadedUrl] = useState<string | null>(null);

  /**
   * Upload a file to Pinata IPFS
   * @param file File to upload
   * @param metadata Optional metadata for the file
   * @returns Promise with the IPFS URL and hash
   */
  const uploadFile = useCallback(async (
    file: File,
    metadata?: {
      name?: string;
      keyvalues?: Record<string, any>;
    }
  ): Promise<PinataUploadResult> => {
    if (!PINATA_JWT) {
      throw new Error('Pinata JWT is not configured. Please add VITE_PINATA_JWT to your .env file');
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);
      setError(null);

      // Validate file
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        throw new Error('File size must be less than 10MB');
      }

      if (!file.type.startsWith('image/')) {
        throw new Error('Only image files are supported');
      }

      // Create FormData
      const formData = new FormData();
      formData.append('file', file);

      // Add metadata
      const pinataMetadata = {
        name: metadata?.name || `upload-${Date.now()}-${file.name}`,
        keyvalues: {
          uploadedAt: new Date().toISOString(),
          originalName: file.name,
          size: file.size,
          type: file.type,
          ...metadata?.keyvalues
        }
      };
      formData.append('pinataMetadata', JSON.stringify(pinataMetadata));

      setUploadProgress(30);

      // Upload to Pinata
      const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PINATA_JWT}`,
        },
        body: formData,
      });

      setUploadProgress(70);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        throw new Error(
          errorData.error?.details || 
          errorData.message || 
          `Upload failed: ${response.statusText}`
        );
      }

      const data = await response.json();
      const ipfsUrl = `${PINATA_GATEWAY}/ipfs/${data.IpfsHash}`;
      
      setUploadProgress(100);
      setLastUploadedUrl(ipfsUrl);

      
      return {
        ipfsUrl,
        ipfsHash: data.IpfsHash,
        size: data.PinSize
      };
    } catch (err: any) {
      console.error('❌ [Pinata] Upload error:', err);
      
      const pinataError: PinataError = {
        code: 'PINATA_UPLOAD_ERROR',
        message: err.message || 'Failed to upload to IPFS',
        details: err
      };

      if (err.message?.includes('JWT')) {
        pinataError.code = 'PINATA_AUTH_ERROR';
        pinataError.message = 'Invalid Pinata credentials. Please check your API key.';
      } else if (err.message?.includes('network') || err.message?.includes('fetch')) {
        pinataError.code = 'NETWORK_ERROR';
        pinataError.message = 'Network error. Please check your connection and try again.';
      }

      setError(pinataError);
      throw pinataError;
    } finally {
      setIsUploading(false);
    }
  }, []);

  /**
   * Upload image with preview generation
   * @param file Image file
   * @param metadata Optional metadata
   * @returns Promise with upload result and preview URL
   */
  const uploadImage = useCallback(async (
    file: File,
    metadata?: { name?: string; keyvalues?: Record<string, any> }
  ): Promise<PinataUploadResult & { preview: string }> => {
    // Generate preview
    const preview = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    // Upload to Pinata
    const result = await uploadFile(file, {
      name: metadata?.name || `image-${Date.now()}`,
      keyvalues: {
        type: 'image',
        ...metadata?.keyvalues
      }
    });

    return { ...result, preview };
  }, [uploadFile]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Reset all state
   */
  const reset = useCallback(() => {
    setIsUploading(false);
    setUploadProgress(0);
    setError(null);
    setLastUploadedUrl(null);
  }, []);

  return {
    uploadFile,
    uploadImage,
    isUploading,
    uploadProgress,
    error,
    lastUploadedUrl,
    clearError,
    reset
  };
};