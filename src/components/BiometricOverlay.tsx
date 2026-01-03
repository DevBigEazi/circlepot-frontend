import React, { useEffect, useState } from "react";
import { Fingerprint, AlertCircle, Loader } from "lucide-react";

interface BiometricOverlayProps {
  isOpen: boolean;
  onAuthenticate: () => Promise<{ success: boolean; error?: string }>;
  onCancel?: () => void;
  colors: any;
}

const BiometricOverlay: React.FC<BiometricOverlayProps> = ({
  isOpen,
  onAuthenticate,
  colors,
}) => {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (isOpen && attempts === 0) {
      // Auto-trigger biometric authentication when overlay opens
      handleAuthenticate();
    }
  }, [isOpen]);

  const handleAuthenticate = async () => {
    setIsAuthenticating(true);
    setError(null);

    try {
      const result = await onAuthenticate();

      if (!result.success) {
        setError(result.error || "Authentication failed");
        setAttempts((prev) => prev + 1);
      }
      // If successful, the overlay will be closed by parent component
    } catch (err) {
      const error = err as Error;
      setError(error.message || "Authentication failed");
      setAttempts((prev) => prev + 1);
    } finally {
      setIsAuthenticating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        backgroundColor: "rgba(0, 0, 0, 0.6)",
      }}
    >
      <div
        className="w-full max-w-md rounded-3xl p-8 shadow-2xl"
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.border,
          border: `1px solid ${colors.border}`,
        }}
      >
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div
            className="p-6 rounded-full"
            style={{
              background: colors.primary,
            }}
          >
            {isAuthenticating ? (
              <Loader className="w-12 h-12 text-white animate-spin" />
            ) : (
              <Fingerprint className="w-12 h-12 text-white" />
            )}
          </div>
        </div>

        {/* Title */}
        <h2
          className="text-2xl font-bold text-center mb-2"
          style={{ color: colors.text }}
        >
          Biometric Authentication
        </h2>

        {/* Subtitle */}
        <p className="text-center mb-8 text-sm" style={{ color: colors.text }}>
          {isAuthenticating
            ? "Authenticating..."
            : "Use your fingerprint or face to unlock"}
        </p>

        {/* Error Message */}
        {error && (
          <div
            className="mb-6 p-4 rounded-xl flex items-start gap-3"
            style={{
              backgroundColor: `${colors.error}15`,
              borderColor: colors.error,
              border: `1px solid ${colors.error}`,
            }}
          >
            <AlertCircle
              className="w-5 h-5 flex-shrink-0 mt-0.5"
              style={{ color: colors.error }}
            />
            <div>
              <p className="text-sm font-medium" style={{ color: colors.text }}>
                {error}
              </p>
              <p className="text-xs mt-1" style={{ color: colors.text }}>
                Attempt {attempts} of 3
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleAuthenticate}
            disabled={isAuthenticating || attempts >= 3}
            className="w-full py-4 rounded-xl font-semibold text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: colors.primary,
            }}
          >
            {isAuthenticating ? (
              <span className="flex items-center justify-center gap-2">
                <Loader className="w-5 h-5 animate-spin" />
                Authenticating...
              </span>
            ) : attempts >= 3 ? (
              "Too many failed attempts"
            ) : (
              "Try Again"
            )}
          </button>

          {attempts >= 3 && (
            <p
              className="text-center text-sm mt-4"
              style={{ color: colors.text }}
            >
              Please restart the app to try again
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BiometricOverlay;
