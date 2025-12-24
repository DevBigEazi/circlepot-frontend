import { useState, useCallback } from "react";

interface BiometricOptions {
  userId: string | undefined;
  userName: string;
  userEmail: string;
}

interface RegisterResponse {
  success: boolean;
  error?: string;
}

interface AuthenticateResponse {
  success: boolean;
  error?: string;
}

export const useBiometric = () => {
  const [isSupported] = useState<boolean>(
    typeof window !== "undefined" && !!window.PublicKeyCredential
  );
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Check if biometric is available on device
  const checkBiometricAvailable = useCallback(async (): Promise<boolean> => {
    try {
      if (!window.PublicKeyCredential) {
        setError("WebAuthn not supported on this device");
        return false;
      }

      const available =
        await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      return available;
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      return false;
    }
  }, []);

  // Register biometric
  const registerBiometric = useCallback(
    async (options: BiometricOptions): Promise<RegisterResponse> => {
      try {
        setError(null);

        const available = await checkBiometricAvailable();
        if (!available) {
          return {
            success: false,
            error: "Biometric authentication not available on this device",
          };
        }

        // Generate challenge (random bytes)
        const challenge = crypto.getRandomValues(new Uint8Array(32));
        const userId = new TextEncoder().encode(options.userId);

        const credentialCreationOptions: CredentialCreationOptions = {
          publicKey: {
            challenge: challenge,
            rp: {
              name: "Your App Name",
              id: window.location.hostname,
            },
            user: {
              id: userId,
              name: options.userEmail,
              displayName: options.userName,
            },
            pubKeyCredParams: [
              { alg: -7, type: "public-key" }, // ES256
              { alg: -257, type: "public-key" }, // RS256
            ],
            authenticatorSelection: {
              authenticatorAttachment: "platform",
              userVerification: "preferred",
              residentKey: "preferred",
            },
            timeout: 60000,
            attestation: "direct",
          },
        };

        const credential = await navigator.credentials.create(
          credentialCreationOptions
        );

        if (!credential) {
          return {
            success: false,
            error: "Biometric registration cancelled",
          };
        }

        // Store credential ID for later authentication
        const credentialId = btoa(
          String.fromCharCode.apply(
            null,
            Array.from(new Uint8Array((credential as any).rawId))
          )
        );

        // Store in localStorage (or your backend)
        localStorage.setItem(
          `biometric_${options.userId}`,
          JSON.stringify({
            credentialId,
            registered: new Date().toISOString(),
          })
        );

        setIsRegistered(true);
        return { success: true };
      } catch (err) {
        const error = err as Error;
        const errorMessage = error.message || "Failed to register biometric";
        setError(errorMessage);
        return {
          success: false,
          error: errorMessage,
        };
      }
    },
    [checkBiometricAvailable]
  );

  // Authenticate with biometric
  const authenticateWithBiometric = useCallback(
    async (userId: string): Promise<AuthenticateResponse> => {
      try {
        setError(null);
        setIsAuthenticating(true);

        const available = await checkBiometricAvailable();
        if (!available) {
          return {
            success: false,
            error: "Biometric authentication not available",
          };
        }

        // Retrieve stored credential ID
        const stored = localStorage.getItem(`biometric_${userId}`);
        if (!stored) {
          return {
            success: false,
            error: "Biometric not registered. Please set up biometric first.",
          };
        }

        const { credentialId } = JSON.parse(stored);
        const credentialIdArray = Uint8Array.from(atob(credentialId), (c) =>
          c.charCodeAt(0)
        );

        const challenge = crypto.getRandomValues(new Uint8Array(32));

        const credentialRequestOptions: CredentialRequestOptions = {
          publicKey: {
            challenge: challenge,
            allowCredentials: [
              {
                id: credentialIdArray,
                type: "public-key",
                transports: ["internal"],
              },
            ],
            userVerification: "preferred",
            timeout: 60000,
          },
        };

        const assertion = await navigator.credentials.get(
          credentialRequestOptions
        );

        if (!assertion) {
          return {
            success: false,
            error: "Biometric authentication cancelled",
          };
        }

        return { success: true };
      } catch (err) {
        const error = err as Error;
        const errorMessage = error.message || "Biometric authentication failed";
        setError(errorMessage);
        return {
          success: false,
          error: errorMessage,
        };
      } finally {
        setIsAuthenticating(false);
      }
    },
    [checkBiometricAvailable]
  );

  // Remove biometric registration
  const removeBiometric = useCallback((userId: string): void => {
    localStorage.removeItem(`biometric_${userId}`);
    setIsRegistered(false);
    setError(null);
  }, []);

  return {
    isSupported,
    isRegistered,
    isAuthenticating,
    error,
    checkBiometricAvailable,
    registerBiometric,
    authenticateWithBiometric,
    removeBiometric,
  };
};
