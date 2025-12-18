import { useState, useCallback } from "react";
import { PinataSDK } from "pinata";

// Pinata credentials
const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL;
const SERVER_URL = import.meta.env.VITE_SERVER_URL;
const SERVER_BEARER = import.meta.env.VITE_SERVER_BEARER;

// Initialize Pinata SDK
const pinata = new PinataSDK({
  pinataGateway: GATEWAY_URL,
});

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
  const uploadFile = useCallback(
    async (
      file: File,
      _metadata?: {
        name?: string;
        keyvalues?: Record<string, any>;
      }
    ): Promise<PinataUploadResult> => {
      try {
        setIsUploading(true);
        setUploadProgress(0);
        setError(null);

        // Validate file
        if (file.size > 10 * 1024 * 1024) {
          // 10MB limit
          throw new Error("File size must be less than 10MB");
        }

        if (!file.type.startsWith("image/")) {
          throw new Error("Only image files are supported");
        }

        setUploadProgress(30);

        // Get presigned URL from server
        const urlResponse = await fetch(`${SERVER_URL}/presigned_url`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${SERVER_BEARER}`,
            "Content-Type": "application/json",
          },
        });

        if (!urlResponse.ok) {
          throw new Error("Failed to get presigned URL from server");
        }

        const urlData = await urlResponse.json();
        setUploadProgress(50);

        // Upload file to Pinata using presigned URL
        const upload = await pinata.upload.public.file(file).url(urlData.url);

        setUploadProgress(80);

        if (!upload.cid) {
          throw new Error("Upload failed: No CID returned");
        }

        // Convert CID to gateway URL
        const ipfsUrl = await pinata.gateways.public.convert(upload.cid);
        setUploadProgress(100);
        setLastUploadedUrl(ipfsUrl);

        return {
          ipfsUrl,
          ipfsHash: upload.cid,
          size: file.size,
        };
      } catch (err: any) {
        const pinataError: PinataError = {
          code: "PINATA_UPLOAD_ERROR",
          message: err.message || "Failed to upload to IPFS",
          details: err,
        };

        if (err.message?.includes("JWT")) {
          pinataError.code = "PINATA_AUTH_ERROR";
          pinataError.message =
            "Invalid Pinata credentials. Please check your API key.";
        } else if (
          err.message?.includes("network") ||
          err.message?.includes("fetch")
        ) {
          pinataError.code = "NETWORK_ERROR";
          pinataError.message =
            "Network error. Please check your connection and try again.";
        } else if (err.message?.includes("presigned")) {
          pinataError.code = "SERVER_ERROR";
          pinataError.message =
            "Failed to get upload URL from server. Please try again.";
        }

        setError(pinataError);
        throw pinataError;
      } finally {
        setIsUploading(false);
      }
    },
    []
  );

  /**
   * Upload image with preview generation
   * @param file Image file
   * @param metadata Optional metadata
   * @returns Promise with upload result and preview URL
   */
  const uploadImage = useCallback(
    async (
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
          type: "image",
          ...metadata?.keyvalues,
        },
      });

      return { ...result, preview };
    },
    [uploadFile]
  );

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
    reset,
  };
};
