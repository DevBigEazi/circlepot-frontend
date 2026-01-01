import { useState, useCallback } from "react";
import { upload, resolveScheme } from "thirdweb/storage";
import { ThirdwebClient } from "thirdweb";

export interface ThirdwebUploadResult {
    ipfsUrl: string;
    ipfsHash: string;
    size: number;
}

export interface ThirdwebStorageError {
    code: string;
    message: string;
    details?: any;
}

export const useThirdwebStorage = (client: ThirdwebClient) => {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState<ThirdwebStorageError | null>(null);
    const [lastUploadedUrl, setLastUploadedUrl] = useState<string | null>(null);

    /**
     * Upload a file to IPFS using Thirdweb Storage
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
        ): Promise<ThirdwebUploadResult> => {
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

                // Upload file to IPFS using Thirdweb
                const uploadResult = await upload({
                    client,
                    files: [file],
                });

                setUploadProgress(60);

                // The upload function returns a string when uploading a single file
                const ipfsUri = typeof uploadResult === 'string'
                    ? uploadResult
                    : uploadResult[0];

                if (!ipfsUri) {
                    throw new Error("Upload failed: No URI returned");
                }

                // Validate URI format
                if (!ipfsUri || typeof ipfsUri !== 'string') {
                    throw new Error(`Invalid URI returned from upload: ${ipfsUri}`);
                }

                // Extract CID from the IPFS URL (format: ipfs://CID)
                const ipfsHash = ipfsUri.replace("ipfs://", "");

                setUploadProgress(80);

                // Resolve to HTTP gateway URL using Thirdweb's gateway
                const ipfsUrl = resolveScheme({
                    client,
                    uri: ipfsUri,
                });

                setUploadProgress(100);
                setLastUploadedUrl(ipfsUrl);

                return {
                    ipfsUrl,
                    ipfsHash,
                    size: file.size,
                };
            } catch (err: any) {
                const storageError: ThirdwebStorageError = {
                    code: "THIRDWEB_UPLOAD_ERROR",
                    message: err.message || "Failed to upload to IPFS",
                    details: err,
                };

                if (err.message?.includes("client")) {
                    storageError.code = "THIRDWEB_CLIENT_ERROR";
                    storageError.message =
                        "Invalid Thirdweb client. Please check your configuration.";
                } else if (
                    err.message?.includes("network") ||
                    err.message?.includes("fetch")
                ) {
                    storageError.code = "NETWORK_ERROR";
                    storageError.message =
                        "Network error. Please check your connection and try again.";
                }

                setError(storageError);
                throw storageError;
            } finally {
                setIsUploading(false);
            }
        },
        [client]
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
        ): Promise<ThirdwebUploadResult & { preview: string }> => {
            // Generate preview
            const preview = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target?.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });

            // Upload to Thirdweb Storage
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
