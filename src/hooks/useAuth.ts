import { useState, useCallback } from "react";
import { useActiveAccount, useConnect } from "thirdweb/react";
import { inAppWallet, preAuthenticate } from "thirdweb/wallets/in-app";
import { celo } from "thirdweb/chains";
import { client } from "../thirdwebClient";

export interface AuthError {
  code: string;
  message: string;
  details?: any;
}

export interface AuthState {
  isLoading: boolean;
  error: AuthError | null;
  isConnected: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isLoading: false,
    error: null,
    isConnected: false,
  });

  const account = useActiveAccount();
  const { connect, isConnecting } = useConnect();

  const wallet = inAppWallet({
    auth: {
      options: ["google", "email"],
    },
    executionMode: {
      mode: "EIP7702",
      sponsorGas: true,
    },
  });

  const clearError = useCallback(() => {
    setAuthState((prev) => ({ ...prev, error: null }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setAuthState((prev) => ({ ...prev, isLoading: loading }));
  }, []);

  const setError = useCallback((error: AuthError) => {
    setAuthState((prev) => ({ ...prev, error, isLoading: false }));
  }, []);

  const handleAuthSuccess = useCallback(() => {
    setAuthState((prev) => ({
      ...prev,
      isLoading: false,
      error: null,
      isConnected: true,
    }));
  }, []);

  return {
    ...authState,
    account,
    wallet,
    connect,
    isConnecting: isConnecting || authState.isLoading,
    clearError,
    setLoading,
    setError,
    handleAuthSuccess,
  };
};

export const useGoogleAuth = () => {
  const {
    isLoading,
    error,
    isConnected,
    account,
    wallet,
    connect,
    isConnecting,
    clearError,
    setLoading,
    setError,
    handleAuthSuccess,
  } = useAuth();

  const loginWithGoogle = useCallback(async () => {
    try {
      setLoading(true);
      clearError();

      let connectionSuccessful = false;

      try {
        await connect(async () => {
          try {
            await wallet.connect({
              client,
              chain: celo,
              strategy: "google",
            });
            connectionSuccessful = true;
            return wallet;
          } catch (connectError: any) {
            connectionSuccessful = false;
            throw connectError;
          }
        });
      } catch (connectError: any) {
        throw connectError;
      }

      if (!connectionSuccessful) {
        throw new Error("Google authentication was not successful");
      }

      handleAuthSuccess();
      setLoading(false);
    } catch (error: any) {
      let errorMessage = "Failed to connect with Google";
      let errorCode = "GOOGLE_AUTH_ERROR";

      const errorMsg = error?.message?.toLowerCase() || "";

      if (
        errorMsg.includes("user rejected") ||
        errorMsg.includes("user closed")
      ) {
        errorMessage = "Authentication was cancelled";
        errorCode = "USER_CANCELLED";
      } else if (errorMsg.includes("popup")) {
        errorMessage = "Popup was blocked. Please allow popups and try again";
        errorCode = "POPUP_BLOCKED";
      } else if (
        errorMsg.includes("network") ||
        errorMsg.includes("failed to fetch") ||
        errorMsg.includes("err_proxy_certificate_invalid")
      ) {
        errorMessage =
          "Network error. Please check your internet connection and try again";
        errorCode = "NETWORK_ERROR";
      } else if (
        errorMsg.includes("rate limit") ||
        errorMsg.includes("too many requests")
      ) {
        errorMessage = "Too many attempts. Please wait a moment and try again";
        errorCode = "RATE_LIMITED";
      }

      const authError: AuthError = {
        code: errorCode,
        message: errorMessage,
        details: error,
      };

      setError(authError);
      setLoading(false);
      throw authError;
    }
  }, [setLoading, clearError, connect, wallet, handleAuthSuccess, setError]);

  return {
    isLoading,
    error,
    isConnected,
    account,
    wallet,
    connect,
    isConnecting,
    clearError,
    setLoading,
    setError,
    handleAuthSuccess,
    loginWithGoogle,
  };
};

interface UseEmailAuthReturn {
  isLoading: boolean;
  error: AuthError | null;
  isConnected: boolean;
  account: any;
  wallet: any;
  connect: any;
  isConnecting: boolean;
  emailSent: boolean;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: AuthError) => void;
  handleAuthSuccess: () => void;
  loginWithEmail: (email: string, verificationCode: string) => Promise<boolean>;
  sendEmailCode: (email: string) => Promise<boolean>;
  resetEmailFlow: () => void;
}

export const useEmailAuth = (): UseEmailAuthReturn => {
  const {
    isLoading,
    error,
    isConnected,
    account,
    wallet,
    connect,
    isConnecting,
    clearError,
    setLoading,
    setError,
    handleAuthSuccess,
  } = useAuth();

  const [emailSent, setEmailSent] = useState(false);

  const resetEmailFlow = useCallback(() => {
    setEmailSent(false);
    clearError();
  }, [clearError]);

  const sendEmailCode = useCallback(
    async (email: string): Promise<boolean> => {
      try {
        setLoading(true);
        clearError();

        await preAuthenticate({
          client,
          strategy: "email",
          email: email,
        });

        setEmailSent(true);
        setLoading(false);
        return true;
      } catch (error: any) {

        let errorMessage = "Failed to send verification code";
        let errorCode = "EMAIL_SEND_ERROR";

        const errorMsg = error?.message?.toLowerCase() || "";

        if (errorMsg.includes("invalid email")) {
          errorMessage = "Please enter a valid email address";
          errorCode = "INVALID_EMAIL";
        } else if (errorMsg.includes("rate limit")) {
          errorMessage =
            "Too many requests. Please wait a moment and try again";
          errorCode = "RATE_LIMITED";
        } else if (
          errorMsg.includes("failed to fetch") ||
          errorMsg.includes("err_proxy_certificate_invalid") ||
          errorMsg.includes("network")
        ) {
          errorMessage =
            "Network error. Please check your internet connection and try again";
          errorCode = "NETWORK_ERROR";
        }

        const authError: AuthError = {
          code: errorCode,
          message: errorMessage,
          details: error,
        };

        setError(authError);
        setLoading(false);
        return false;
      }
    },
    [setLoading, clearError, setError]
  );

  const loginWithEmail = useCallback(
    async (email: string, verificationCode: string): Promise<boolean> => {
      try {
        setLoading(true);
        clearError();

        if (!verificationCode || verificationCode.length !== 6) {
          const authError: AuthError = {
            code: "INVALID_CODE", 
            message:
              "The verification code you entered is incorrect or has expired. Please try again.",
          };
          setError(authError);
          setLoading(false);
          return false;
        }

        let connectionSuccessful = false;

        try {
          await connect(async () => {
            try {
              await wallet.connect({
                client,
                chain: celo,
                strategy: "email",
                email: email,
                verificationCode: verificationCode,
              });
              connectionSuccessful = true;
              return wallet;
            } catch (connectError: any) {
              connectionSuccessful = false;
              throw connectError;
            }
          });
        } catch (connectError: any) {
          throw connectError;
        }

        if (!connectionSuccessful) {
          throw new Error("Email authentication was not successful");
        }

        handleAuthSuccess();
        setLoading(false);
        return true;
      } catch (error: any) {
        let errorMessage =
          "The verification code you entered is incorrect or has expired. Please try again.";
        let errorCode = "INVALID_CODE";

        const errorMsg = error?.message?.toLowerCase() || "";

        if (
          errorMsg.includes("failed to fetch") ||
          errorMsg.includes("err_proxy_certificate_invalid") ||
          errorMsg.includes("network")
        ) {
          errorMessage =
            "Network error. Please check your internet connection and try again";
          errorCode = "NETWORK_ERROR";
        } else if (
          errorMsg.includes("rate limit") ||
          errorMsg.includes("too many attempts")
        ) {
          errorMessage =
            "Too many attempts. Please wait a moment and try again";
          errorCode = "RATE_LIMITED";
        }

        const authError: AuthError = {
          code: errorCode,
          message: errorMessage,
          details: error,
        };

        setError(authError);
        setLoading(false);
        return false;
      }
    },
    [setLoading, clearError, connect, wallet, handleAuthSuccess, setError]
  );

  return {
    isLoading,
    error,
    isConnected,
    account,
    wallet,
    connect,
    isConnecting,
    clearError,
    setLoading,
    setError,
    handleAuthSuccess,
    emailSent,
    sendEmailCode,
    loginWithEmail,
    resetEmailFlow,
  };
};
