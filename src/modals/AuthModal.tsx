import React, { useRef, useState, useEffect } from "react";
import { useGoogleAuth, useEmailAuth, usePasskeyAuth } from "../hooks/useAuth";
import image from "../constant/image";
import { MdOutlineEmail } from "react-icons/md";
import ErrorDisplay from "../components/ErrorDisplay";
import LoadingSpinner from "../components/LoadingSpinner";
import NetworkTroubleshooting from "../components/NetworkTroubleshooting";
import { BiCheckCircle } from "react-icons/bi";
import { FiZap, FiShield, FiClock } from "react-icons/fi";
import { BsArrowLeft } from "react-icons/bs";

const AuthModal: React.FC = () => {
  const [authMethod, setAuthMethod] = useState<"select" | "email">("select");
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [codeDigits, setCodeDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [resendCooldown, setResendCooldown] = useState(0);
  const codeInputRefs = useRef<Array<HTMLInputElement | null>>([null, null, null, null, null, null]);

  const googleAuth = useGoogleAuth();
  const emailAuth = useEmailAuth();
  const passkeyAuth = usePasskeyAuth();

  // Use the first available error (priority: google > email > passkey)
  const currentError = googleAuth.error || emailAuth.error || passkeyAuth.error;
  const isLoading =
    googleAuth.isConnecting ||
    emailAuth.isConnecting ||
    passkeyAuth.isConnecting;

  const clearAllErrors = () => {
    googleAuth.clearError();
    emailAuth.clearError();
    passkeyAuth.clearError();
  };

  const handleEmailSubmit = async () => {
    if (!emailAuth.emailSent) {
      await emailAuth.sendEmailCode(email);
      // Start 1-minute cooldown for resend
      setResendCooldown(60);
    } else {
      await emailAuth.loginWithEmail(email, verificationCode);
    }
  };

  const resetEmailFlow = () => {
    setAuthMethod("select");
    setEmail("");
    setVerificationCode("");
    setCodeDigits(["", "", "", "", "", ""]);
    setResendCooldown(0);
    emailAuth.resetEmailFlow();
  };

  const handleCodeChange = (index: number, value: string) => {
    if (!/^[0-9]?$/.test(value)) return;
    const next = [...codeDigits];
    next[index] = value;
    setCodeDigits(next);
    const joined = next.join("");
    setVerificationCode(joined);
    if (value && index < codeInputRefs.current.length - 1) {
      codeInputRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !codeDigits[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  // Timer effect for resend cooldown
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleResendCode = async () => {
    if (resendCooldown === 0) {
      await emailAuth.sendEmailCode(email);
      setResendCooldown(60);
    }
  };

  if (googleAuth.account || emailAuth.account || passkeyAuth.account)
    return null;

  return (
    <div className="fixed inset-0 bg-accent/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface rounded-3xl shadow-2xl p-6 w-full max-w-md">
        {/* App logo, title & description - only show on select step */}
        {authMethod === "select" && (
          <div className="flex flex-col items-center justify-center mb-6">
            <img src={image.appLogo} alt="CirlePot Logo" className="w-20 h-20" />
            <h2 className="text-2xl font-bold mb-3 text-center text-text">
              Welcome to Circlepot
            </h2>
            <p className="text-sm text-center mb-3 text-text-light">
              Join thousands saving together with zero transaction fees
            </p>
          </div>
        )}

        {/* Error Display */}
        {currentError?.code === "NETWORK_ERROR" ? (
          <NetworkTroubleshooting
            onRetry={() => {
              clearAllErrors();
              // Retry the last attempted action
              if (authMethod === "email" && emailAuth.emailSent) {
                emailAuth.loginWithEmail(email, verificationCode);
              } else if (authMethod === "email") {
                emailAuth.sendEmailCode(email);
              }
            }}
            onDismiss={clearAllErrors}
          />
        ) : (
          <ErrorDisplay error={currentError} onDismiss={clearAllErrors} />
        )}

        {/* Buttons */}
        {authMethod === "select" ? (
          <div className="flex flex-col gap-3">
            <button
              onClick={googleAuth.loginWithGoogle}
              disabled={isLoading}
              className="cursor-pointer flex justify-center items-center rounded-xl py-3 font-semibold gap-3 group transition border-2 border-border hover:border-green-500 disabled:opacity-50"
            >
              <img src={image.chrome} alt="chrome logo" className="w-6 h-6" />
              {isLoading ? (
                <LoadingSpinner size="sm" text="Connecting..." />
              ) : (
                "Continue with Google"
              )}
            </button>

            <button
              onClick={passkeyAuth.loginWithPasskey}
              disabled={isLoading}
              className="cursor-pointer flex justify-center items-center rounded-xl py-3 font-semibold gap-3 group transition border-2 border-border hover:border-green-500 disabled:opacity-50"
            >
              <img src={image.passkey} alt="passkey logo" className="w-6 h-6" />
              {isLoading ? (
                <LoadingSpinner size="sm" text="Connecting..." />
              ) : (
                "Continue with Passkey"
              )}
            </button>

            {/* OR */}
            <div className="flex justify-center items-center gap-3">
              <div className="bg-border w-full h-0.5" />
              <p className="text-text-light">Or</p>
              <div className="bg-border w-full h-0.5" />
            </div>

            <button
              onClick={() => setAuthMethod("email")}
              disabled={isLoading}
              className="cursor-pointer bg-[#f0fdf4] text-primary flex justify-center items-center rounded-xl py-3 font-semibold gap-3 group transition border-2 border-primary hover:shadow-lg disabled:opacity-50"
            >
              <MdOutlineEmail size={24} /> Continue with Email
            </button>

            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <FiZap size={16} className="text-primary" />
                <span className="text-sm font-semibold text-text">
                  Secure & Simple
                </span>
              </div>
              <p className="text-xs text-text-light">
                Secure digital wallet • Zero transaction fees • Easy recovery
              </p>
            </div>

            {/* Benefits showcase */}
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-xs text-text-light">
                <BiCheckCircle size={14} className="text-primary" />
                <span>No complex setup needed</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-text-light">
                <BiCheckCircle size={14} className="text-primary" />
                <span>Recover account with email/passkey</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-text-light">
                <BiCheckCircle size={14} className="text-primary" />
                <span>All transactions are free</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <button
              onClick={resetEmailFlow}
              className="cursor-pointer mb-6 font-semibold flex items-center gap-2 text-text-light text-sm"
            >
              <BsArrowLeft size={16} />
              Back
            </button>

            {!emailAuth.emailSent ? (
              <>
                <h2 className="text-2xl font-bold text-center mb-3 text-text">Enter Your Email</h2>
                <p className="text-center mb-6 text-sm text-text-light">
                  We'll send you a verification code to sign in
                </p>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-text">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition bg-surface text-text"
                      style={{ borderColor: "var(--border)" }}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <button
                  onClick={handleEmailSubmit}
                  disabled={isLoading || !email}
                  className="cursor-pointer w-full py-3 text-white font-semibold rounded-xl transition shadow-lg hover:shadow-xl disabled:opacity-50"
                  style={{ background: "linear-gradient(90deg, #16a34a, #22c55e)" }}
                >
                  {isLoading ? <LoadingSpinner size="sm" text="Sending..." /> : "Send Verification Code"}
                </button>

                <div className="mt-4 p-3 bg-green-50 rounded-xl border border-green-200">
                  <div className="flex items-center gap-2 mb-1">
                    <FiShield size={14} className="text-primary" />
                    <span className="text-xs font-semibold text-text">What happens next?</span>
                  </div>
                  <p className="text-xs text-text-light">
                  We'll create your secure digital wallet automatically if you don't have it already. You'll have full control of your funds with easy recovery options.
                  </p>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-center mb-3 text-text">Verify Your Email</h2>
                <p className="text-center mb-6 text-sm text-text-light">
                  Enter the 6-digit code sent to <span className="font-medium text-text">{email}</span>
                </p>

                <div className="flex gap-3 mb-6">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <input
                      key={i}
                      ref={(el) => {
                        codeInputRefs.current[i] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={codeDigits[i]}
                      onChange={(e) => handleCodeChange(i, e.target.value)}
                      onKeyDown={(e) => handleCodeKeyDown(i, e)}
                      className="w-full h-12 text-center text-xl font-bold border-2 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition bg-surface text-text"
                      style={{ borderColor: "var(--border)" }}
                      disabled={isLoading}
                    />
                  ))}
                </div>

                <button
                  onClick={handleEmailSubmit}
                  disabled={isLoading || verificationCode.length !== 6}
                  className="cursor-pointer w-full py-3 text-white font-semibold rounded-xl transition shadow-lg hover:shadow-xl mb-4 disabled:opacity-50"
                  style={{ background: "linear-gradient(90deg, #16a34a, #22c55e)" }}
                >
                  {isLoading ? <LoadingSpinner size="sm" text="Verifying..." /> : "Verify & Create Account"}
                </button>

                <button
                  onClick={handleResendCode}
                  disabled={isLoading || resendCooldown > 0}
                  className="cursor-pointer w-full font-semibold text-sm hover:underline text-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resendCooldown > 0 ? `Resend Code (${resendCooldown}s)` : "Resend Code"}
                </button>

                <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-2 mb-1">
                    <FiClock size={14} className="text-primary" />
                  </div>
                  <p className="text-xs text-text-light">
                    Your digital wallet will be ready in seconds. No complex passwords to save - just use your email for recovery.
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
