import React, { useState } from 'react'
import { useGoogleAuth, useEmailAuth, usePasskeyAuth } from '../hooks/useAuth'
import image from '../constant/image'
import { MdOutlineEmail } from "react-icons/md"
import ErrorDisplay from '../components/ErrorDisplay'
import LoadingSpinner from '../components/LoadingSpinner'
import NetworkTroubleshooting from '../components/NetworkTroubleshooting'

const AuthModal: React.FC = () => {
  const [authMethod, setAuthMethod] = useState<'select' | 'email'>('select')
  const [email, setEmail] = useState('')
  const [verificationCode, setVerificationCode] = useState('')

  const googleAuth = useGoogleAuth()
  const emailAuth = useEmailAuth()
  const passkeyAuth = usePasskeyAuth()

  // Use the first available error (priority: google > email > passkey)
  const currentError = googleAuth.error || emailAuth.error || passkeyAuth.error
  const isLoading = googleAuth.isConnecting || emailAuth.isConnecting || passkeyAuth.isConnecting

  const clearAllErrors = () => {
    googleAuth.clearError()
    emailAuth.clearError()
    passkeyAuth.clearError()
  }

  const handleEmailSubmit = async () => {
    if (!emailAuth.emailSent) {
      await emailAuth.sendEmailCode(email)
    } else {
      await emailAuth.loginWithEmail(email, verificationCode)
    }
  }

  const resetEmailFlow = () => {
    setAuthMethod('select')
    setEmail('')
    setVerificationCode('')
    emailAuth.resetEmailFlow()
  }

  if (googleAuth.account || emailAuth.account || passkeyAuth.account) return null

  return (
    <div className='fixed inset-0 bg-accent/80 backdrop-blur-sm z-50 flex items-center justify-center p-4'>
      <div className='bg-surface rounded-3xl shadow-2xl p-6 w-full max-w-md'>
        {/* App logo, title & description*/}
        <div className='flex flex-col items-center justify-center mb-6'>
          <img src={image.appLogo} alt="CirlePot Logo" className='w-20 h-20' />
          <h2 className='text-2xl font-bold mb-3 text-center text-text'>Welcome to Circlepot</h2>
          <p className='text-sm text-center mb-3 text-text-light'>Join thousands saving together with zero transaction fees</p>
        </div>

        {/* Error Display */}
        {currentError?.code === 'NETWORK_ERROR' ? (
          <NetworkTroubleshooting
            onRetry={() => {
              clearAllErrors()
              // Retry the last attempted action
              if (authMethod === 'email' && emailAuth.emailSent) {
                emailAuth.loginWithEmail(email, verificationCode)
              } else if (authMethod === 'email') {
                emailAuth.sendEmailCode(email)
              }
            }}
            onDismiss={clearAllErrors}
          />
        ) : (
          <ErrorDisplay error={currentError} onDismiss={clearAllErrors} />
        )}

        {/* Buttons */}
        {authMethod === 'select' ? (
          <div className='flex flex-col gap-3'>
            <button
              onClick={googleAuth.loginWithGoogle}
              disabled={isLoading}
              className='flex justify-center items-center rounded-xl py-3 font-semibold gap-3 group transition border-2 border-border hover:border-green-500 disabled:opacity-50'
            >
              <img src={image.chrome} alt="chrome logo" className='w-6 h-6' />
              {isLoading ? <LoadingSpinner size="sm" text="Connecting..." /> : 'Continue with Google'}
            </button>

            <button
              onClick={passkeyAuth.loginWithPasskey}
              disabled={isLoading}
              className='flex justify-center items-center rounded-xl py-3 font-semibold gap-3 group transition border-2 border-border hover:border-green-500 disabled:opacity-50'
            >
              <img src={image.passkey} alt="passkey logo" className='w-6 h-6' />
              {isLoading ? <LoadingSpinner size="sm" text="Connecting..." /> : 'Continue with Passkey'}
            </button>

            {/* OR */}
            <div className='flex justify-center items-center gap-3'>
              <div className='bg-border w-full h-0.5' />
              <p className="text-text-light">Or</p>
              <div className='bg-border w-full h-0.5' />
            </div>

            <button
              onClick={() => setAuthMethod('email')}
              disabled={isLoading}
              className='bg-[#f0fdf4] text-primary flex justify-center items-center rounded-xl py-3 font-semibold gap-3 group transition border-2 border-primary hover:shadow-lg disabled:opacity-50'
            >
              <MdOutlineEmail size={24} /> Continue with Email
            </button>
          </div>
        ) : (
          <div className='flex flex-col gap-3'>
            {!emailAuth.emailSent ? (
              <>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className='p-3 rounded-lg border border-border text-text bg-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'
                  disabled={isLoading}
                />
                <button
                  onClick={handleEmailSubmit}
                  disabled={isLoading || !email}
                  className='bg-primary text-white p-3 rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2'
                >
                  {isLoading ? <LoadingSpinner size="sm" text="Sending..." /> : 'Send Code'}
                </button>
              </>
            ) : (
              <>
                <div className="text-center mb-2">
                  <p className="text-sm text-text-light">
                    Verification code sent to <span className="font-medium text-text">{email}</span>
                  </p>
                </div>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Enter verification code"
                  className='p-3 rounded-lg border border-border text-text bg-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'
                  disabled={isLoading}
                />
                <button
                  onClick={handleEmailSubmit}
                  disabled={isLoading || !verificationCode}
                  className='bg-primary text-white p-3 rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2'
                >
                  {isLoading ? <LoadingSpinner size="sm" text="Verifying..." /> : 'Verify & Sign In'}
                </button>
              </>
            )}

            <button
              onClick={resetEmailFlow}
              className='text-sm text-text-light hover:text-text transition-colors'
              disabled={isLoading}
            >
              Back
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default AuthModal;