import { useState, useCallback } from 'react'
import { useActiveAccount, useConnect } from 'thirdweb/react'
import { inAppWallet, preAuthenticate, hasStoredPasskey } from 'thirdweb/wallets/in-app'
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
    executionMode: {
      mode: 'EIP7702',
      sponsorGas: true,
    }
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
  const auth = useAuth()

  const loginWithGoogle = useCallback(async () => {
    try {
      auth.setLoading(true)
      auth.clearError()

      await auth.connect(async () => {
        await auth.wallet.connect({
          client,
          chain: celo,
          strategy: "google"
        })
        return auth.wallet
      })

      auth.handleAuthSuccess()
    } catch (error: any) {
      console.error('Google login failed:', error)
      
      let errorMessage = 'Failed to connect with Google'
      let errorCode = 'GOOGLE_AUTH_ERROR'

      if (error?.message?.includes('User rejected') || error?.message?.includes('User closed login window')) {
        errorMessage = 'Authentication was cancelled'
        errorCode = 'USER_CANCELLED'
      } else if (error?.message?.includes('network') || error?.message?.includes('Failed to fetch') || error?.message?.includes('ERR_PROXY_CERTIFICATE_INVALID')) {
        errorMessage = 'Network error. Please check your internet connection and try again'
        errorCode = 'NETWORK_ERROR'
      } else if (error?.message?.includes('popup')) {
        errorMessage = 'Popup was blocked. Please allow popups and try again'
        errorCode = 'POPUP_BLOCKED'
      }

      auth.setError({
        code: errorCode,
        message: errorMessage,
        details: error
      })
    }
  }, [auth])

  return {
    ...auth,
    loginWithGoogle
  }
}

export const useEmailAuth = () => {
  const auth = useAuth()
  const [emailSent, setEmailSent] = useState(false)

  const sendEmailCode = useCallback(async (email: string) => {
    try {
      auth.setLoading(true)
      auth.clearError()

      await preAuthenticate({
        client,
        strategy: "email",
        email: email,
      })
      
      setEmailSent(true)
      auth.setLoading(false)
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

      auth.setError({
        code: errorCode,
        message: errorMessage,
        details: error
      })
    }
  }, [auth])

  const loginWithEmail = useCallback(async (email: string, verificationCode: string) => {
    try {
      auth.setLoading(true)
      auth.clearError()

      await auth.connect(async () => {
        await auth.wallet.connect({
          client,
          chain: celo,
          strategy: "email",
          email: email,
          verificationCode: verificationCode,
        })
        return auth.wallet
      })

      auth.handleAuthSuccess()
    } catch (error: any) {
      console.error('Email login failed:', error)
      
      let errorMessage = 'Failed to verify email code'
      let errorCode = 'EMAIL_VERIFY_ERROR'

      if (error?.message?.includes('invalid code')) {
        errorMessage = 'Invalid verification code. Please check and try again'
        errorCode = 'INVALID_CODE'
      } else if (error?.message?.includes('expired')) {
        errorMessage = 'Verification code has expired. Please request a new one'
        errorCode = 'CODE_EXPIRED'
      } else if (error?.message?.includes('Failed to fetch') || error?.message?.includes('ERR_PROXY_CERTIFICATE_INVALID') || error?.message?.includes('network')) {
        errorMessage = 'Network error. Please check your internet connection and try again'
        errorCode = 'NETWORK_ERROR'
      }

      auth.setError({
        code: errorCode,
        message: errorMessage,
        details: error
      })
    }
  }, [auth])

  const resetEmailFlow = useCallback(() => {
    setEmailSent(false)
    auth.clearError()
  }, [auth])

  return {
    ...auth,
    emailSent,
    sendEmailCode,
    loginWithEmail,
    resetEmailFlow
  }
}

export const usePasskeyAuth = () => {
  const auth = useAuth()

  const loginWithPasskey = useCallback(async () => {
    try {
      auth.setLoading(true)
      auth.clearError()

      const hasPasskey = await hasStoredPasskey(client)
      
      await auth.connect(async () => {
        await auth.wallet.connect({
          client,
          chain: celo,
          strategy: "passkey",
          type: hasPasskey ? "sign-in" : "sign-up",
        })
        return auth.wallet
      })

      auth.handleAuthSuccess()
    } catch (error: any) {
      console.error('Passkey login failed:', error)
      
      let errorMessage = 'Failed to authenticate with passkey'
      let errorCode = 'PASSKEY_AUTH_ERROR'

      if (error?.message?.includes('NotSupportedError')) {
        errorMessage = 'Passkey authentication is not supported on this device'
        errorCode = 'NOT_SUPPORTED'
      } else if (error?.message?.includes('NotAllowedError') || error?.message?.includes('User closed login window')) {
        errorMessage = 'Passkey authentication was cancelled'
        errorCode = 'USER_CANCELLED'
      } else if (error?.message?.includes('SecurityError')) {
        errorMessage = 'Security error. Please try again'
        errorCode = 'SECURITY_ERROR'
      } else if (error?.message?.includes('Failed to fetch') || error?.message?.includes('ERR_PROXY_CERTIFICATE_INVALID') || error?.message?.includes('network')) {
        errorMessage = 'Network error. Please check your internet connection and try again'
        errorCode = 'NETWORK_ERROR'
      }

      auth.setError({
        code: errorCode,
        message: errorMessage,
        details: error
      })
    }
  }, [auth])

  return {
    ...auth,
    loginWithPasskey
  }
}
