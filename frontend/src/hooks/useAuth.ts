import { useState, useCallback } from 'react'
import { useActiveAccount, useConnect } from 'thirdweb/react'
import { inAppWallet, preAuthenticate } from 'thirdweb/wallets/in-app'
import { celo } from 'thirdweb/chains'
import { client } from '../thirdwebClient'

export interface AuthError {
  code: string
  message: string
  details?: any
}

export interface AuthState {
  isLoading: boolean
  error: AuthError | null
  isConnected: boolean
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isLoading: false,
    error: null,
    isConnected: false
  })

  const account = useActiveAccount()
  const { connect, isConnecting } = useConnect()

  const wallet = inAppWallet({
    auth: {
      options: ['google', 'email'],
    },
    executionMode: {
      mode: 'EIP7702',
      sponsorGas: true,
    },
  })

  const clearError = useCallback(() => {
    setAuthState(prev => ({ ...prev, error: null }))
  }, [])

  const setLoading = useCallback((loading: boolean) => {
    setAuthState(prev => ({ ...prev, isLoading: loading }))
  }, [])

  const setError = useCallback((error: AuthError) => {
    setAuthState(prev => ({ ...prev, error, isLoading: false }))
  }, [])

  const handleAuthSuccess = useCallback(() => {
    setAuthState(prev => ({ ...prev, isLoading: false, error: null, isConnected: true }))
  }, [])

  return {
    ...authState,
    account,
    wallet,
    connect,
    isConnecting: isConnecting || authState.isLoading,
    clearError,
    setLoading,
    setError,
    handleAuthSuccess
  }
}

export const useGoogleAuth = () => {
  const { isLoading, error, isConnected, account, wallet, connect, isConnecting, clearError, setLoading, setError, handleAuthSuccess } = useAuth()

  const loginWithGoogle = useCallback(async () => {
    try {
      setLoading(true)
      clearError()

      await connect(async () => {
        try {
          await wallet.connect({
            client,
            chain: celo,
            strategy: "google"
          })
          return wallet
        } catch (error: any) {
          // If the error is from the connect attempt, rethrow it to be caught in the outer catch
          if (error?.message?.includes('User rejected') || error?.message?.includes('User closed login window')) {
            throw new Error('USER_CANCELLED')
          } else if (error?.message?.includes('popup')) {
            throw new Error('POPUP_BLOCKED')
          }
          throw error
        }
      })

      handleAuthSuccess()
    } catch (error: any) {
      console.error('Google login failed:', error)
      
      let errorMessage = 'Failed to connect with Google'
      let errorCode = 'GOOGLE_AUTH_ERROR'

      if (error?.message === 'USER_CANCELLED') {
        errorMessage = 'Authentication was cancelled'
        errorCode = 'USER_CANCELLED'
      } else if (error?.message === 'POPUP_BLOCKED' || error?.message?.includes('popup')) {
        errorMessage = 'Popup was blocked. Please allow popups and try again'
        errorCode = 'POPUP_BLOCKED'
      } else if (error?.message?.includes('network') || 
                error?.message?.includes('Failed to fetch') || 
                error?.message?.includes('ERR_PROXY_CERTIFICATE_INVALID')) {
        errorMessage = 'Network error. Please check your internet connection and try again'
        errorCode = 'NETWORK_ERROR'
      } else if (error?.message?.includes('rate limit') || error?.message?.includes('too many requests')) {
        errorMessage = 'Too many attempts. Please wait a moment and try again'
        errorCode = 'RATE_LIMITED'
      }

      const authError: AuthError = {
        code: errorCode,
        message: errorMessage,
        details: error
      }
      
      setError(authError)
      
      // Re-throw the error so components can handle it if needed
      throw authError
    }
  }, [setLoading, clearError, connect, wallet, handleAuthSuccess, setError])

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
    loginWithGoogle
  }
}

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
  sendEmailCode: (email: string) => Promise<void>;
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
    handleAuthSuccess 
  } = useAuth()
  
  const [emailSent, setEmailSent] = useState(false)

  const resetEmailFlow = useCallback(() => {
    setEmailSent(false)
    clearError()
  }, [clearError, setEmailSent])

  const sendEmailCode = useCallback(async (email: string) => {
    try {
      setLoading(true)
      clearError()

      await preAuthenticate({
        client,
        strategy: "email",
        email: email,
      })
      
      setEmailSent(true)
      setLoading(false)
    } catch (error: any) {
      console.error('Failed to send email code:', error)
      
      let errorMessage = 'Failed to send verification code'
      let errorCode = 'EMAIL_SEND_ERROR'

      if (error?.message?.includes('invalid email')) {
        errorMessage = 'Please enter a valid email address'
        errorCode = 'INVALID_EMAIL'
      } else if (error?.message?.includes('rate limit')) {
        errorMessage = 'Too many requests. Please wait a moment and try again'
        errorCode = 'RATE_LIMITED'
      } else if (error?.message?.includes('Failed to fetch') || error?.message?.includes('ERR_PROXY_CERTIFICATE_INVALID') || error?.message?.includes('network')) {
        errorMessage = 'Network error. Please check your internet connection and try again'
        errorCode = 'NETWORK_ERROR'
      }

      setError({
        code: errorCode,
        message: errorMessage,
        details: error
      })
    }
  }, [setLoading, clearError, setError])

  const loginWithEmail = useCallback(async (email: string, verificationCode: string): Promise<boolean> => {
    try {
      setLoading(true)
      clearError()

      if (!verificationCode || verificationCode.length !== 6) {
        throw new Error('INVALID_CODE')
      }

      await connect(async () => {
        try {
          await wallet.connect({
            client,
            chain: celo,
            strategy: "email",
            email: email,
            verificationCode: verificationCode,
          })
          return wallet
        } catch (error: any) {
          // Transform specific errors to be caught in the outer catch
          if (error?.message?.includes('invalid code') || error?.message?.includes('invalid verification code')) {
            throw new Error('INVALID_CODE')
          } else if (error?.message?.includes('expired')) {
            throw new Error('CODE_EXPIRED')
          } else if (error?.message?.includes('rate limit') || error?.message?.includes('too many attempts')) {
            throw new Error('RATE_LIMITED')
          }
          throw error
        }
      })

      handleAuthSuccess()
      return true
    } catch (error: any) {
      console.error('Email login failed:', error)
      
      let errorMessage = 'Failed to verify email code'
      let errorCode = 'EMAIL_VERIFY_ERROR'

      if (error?.message === 'INVALID_CODE') {
        errorMessage = 'Invalid verification code. Please check and try again'
        errorCode = 'INVALID_CODE'
      } else if (error?.message === 'CODE_EXPIRED') {
        errorMessage = 'Verification code has expired. Please request a new one'
        errorCode = 'CODE_EXPIRED'
      } else if (error?.message?.includes('Failed to fetch') || 
                error?.message?.includes('ERR_PROXY_CERTIFICATE_INVALID') || 
                error?.message?.includes('network')) {
        errorMessage = 'Network error. Please check your internet connection and try again'
        errorCode = 'NETWORK_ERROR'
      } else if (error?.message === 'RATE_LIMITED' || error?.message?.includes('rate limit')) {
        errorMessage = 'Too many attempts. Please wait a moment and try again'
        errorCode = 'RATE_LIMITED'
      }

      setError({
        code: errorCode,
        message: errorMessage,
        details: error
      })
      return false
    }
  }, [setLoading, clearError, connect, wallet, handleAuthSuccess, setError])

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
    resetEmailFlow
  }
}