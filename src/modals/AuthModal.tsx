import React, { useRef, useState, useEffect } from "react";
import { useGoogleAuth, useEmailAuth } from "../hooks/useAuth";
// import { usePhoneAuth } from "../hooks/useAuth"; // Phone auth requires Growth+ plan
import { useThemeColors } from "../hooks/useThemeColors";
import image from "../constants/image";
import { MdOutlineEmail } from "react-icons/md";
import { FiPhone } from "react-icons/fi"; // For phone auth (hidden for now)
import ErrorDisplay from "../components/ErrorDisplay";
import LoadingSpinner from "../components/LoadingSpinner";
import NetworkTroubleshooting from "../components/NetworkTroubleshooting";
import { BiCheckCircle } from "react-icons/bi";
import { FiZap, FiShield, FiClock } from "react-icons/fi";
import { BsArrowLeft } from "react-icons/bs";
import { getUserEmail } from "thirdweb/wallets/in-app";
import { client } from "../thirdwebClient";

const AuthModal: React.FC = () => {
  const colors = useThemeColors();
  const [authMethod, setAuthMethod] = useState<"select" | "email" | "phone">(
    "select"
  );
  const [email, setEmail] = useState("");
  // const [phoneNumber, setPhoneNumber] = useState(""); // For phone auth
  const [verificationCode, setVerificationCode] = useState("");
  const [codeDigits, setCodeDigits] = useState<string[]>([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  const [resendCooldown, setResendCooldown] = useState(0);
  const codeInputRefs = useRef<Array<HTMLInputElement | null>>([
    null,
    null,
    null,
    null,
    null,
    null,
  ]);

  const googleAuth = useGoogleAuth();
  const emailAuth = useEmailAuth();
  // const phoneAuth = usePhoneAuth(); // Phone auth requires Growth+ plan

  // the first available error (priority: google > email)
  const currentError = googleAuth.error || emailAuth.error;
  const isLoading = googleAuth.isConnecting || emailAuth.isConnecting;

  const clearAllErrors = () => {
    googleAuth.clearError();
    emailAuth.clearError();
    // phoneAuth.clearError(); // For phone auth
  };

  const handleGoogleLogin = async () => {
    try {
      await googleAuth.loginWithGoogle();
      // Get the user's email after successful authentication
      const email = await getUserEmail({ client });
      if (email) {
        setEmail(email);
      }
    } catch (error) {
      // Error is already handled in the useGoogleAuth
    }
  };

  const handleEmailSubmit = async () => {
    if (!emailAuth.emailSent) {
      await emailAuth.sendEmailCode(email);
      // Start 1-minute cooldown for resend
      setResendCooldown(60);
    } else {
      const success = await emailAuth.loginWithEmail(email, verificationCode);
      if (success) {
        setEmail(email);
      }
    }
  };

  // Phone auth functions - requires Growth+ plan
  // const handlePhoneSubmit = async () => {
  //   if (!phoneAuth.phoneSent) {
  //     const phoneRegex = /^\+[1-9]\d{1,14}$/;
  //     if (!phoneRegex.test(phoneNumber)) {
  //       const authError = {
  //         code: "INVALID_PHONE",
  //         message: "Please enter a valid phone number in international format (e.g., +1234567890)",
  //       };
  //       phoneAuth.setError(authError);
  //       return;
  //     }
  //     await phoneAuth.sendPhoneCode(phoneNumber);
  //     setResendCooldown(60);
  //     } else {
  //       const success = await phoneAuth.loginWithPhone(phoneNumber, verificationCode);
  //       if (success) {
  //         setPhoneNumber(phoneNumber);
  //       }
  //     }
  //   };
  //
  // const resetPhoneFlow = () => {
  //   setAuthMethod("select");
  //   setPhoneNumber("");
  //   setVerificationCode("");
  //   setCodeDigits(["", "", "", "", "", ""]);
  //   setResendCooldown(0);
  //   phoneAuth.resetPhoneFlow();
  // };

  const resetEmailFlow = () => {
    setAuthMethod("select");
    setEmail("");
    setVerificationCode("");
    setCodeDigits(["", "", "", "", "", ""]);
    setResendCooldown(0);
    emailAuth.resetEmailFlow();
  };

  // const resetPhoneFlow = () => {
  //   setAuthMethod("select");
  //   setPhoneNumber("");
  //   setVerificationCode("");
  //   setCodeDigits(["", "", "", "", "", ""]);
  //   setResendCooldown(0);
  //   phoneAuth.resetPhoneFlow();
  // };

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

  const handleCodeKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
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

  if (googleAuth.account || emailAuth.account) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div
        className="rounded-3xl shadow-2xl p-6 w-full max-w-md animate-in fade-in zoom-in-95 duration-300"
        style={{ backgroundColor: colors.surface }}
      >
        {/* App logo, title & description - only show on select step */}
        {authMethod === "select" && (
          <div className="flex flex-col items-center justify-center mb-6">
            <img
              src={image.fullLogo}
              alt="Circlepot Logo"
              className="w-32 sm:w-40 md:w-48 lg:w-56 h-auto"
            />
            <h2
              className="text-2xl font-bold mb-3 text-center"
              style={{ color: colors.text }}
            >
              Welcome to Circlepot
            </h2>
            <p
              className="text-sm text-center mb-3"
              style={{ color: colors.textLight }}
            >
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
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="cursor-pointer flex justify-center items-center rounded-xl py-3 font-semibold gap-3 group transition border-2 hover:border-b-lime-900 disabled:opacity-50"
              style={{ borderColor: colors.border, color: colors.text }}
            >
              <img src={image.google} alt="google logo" className="w-6 h-6" />
              {isLoading ? (
                <LoadingSpinner size="sm" text="Connecting..." />
              ) : (
                "Continue with Google"
              )}
            </button>

            {/* OR */}
            <div className="flex justify-center items-center gap-3">
              <div
                className="w-full h-0.5"
                style={{ backgroundColor: colors.border }}
              />
              <p style={{ color: colors.textLight }}>Or</p>
              <div
                className="w-full h-0.5"
                style={{ backgroundColor: colors.border }}
              />
            </div>

            <button
              onClick={() => setAuthMethod("email")}
              disabled={isLoading}
              className="cursor-pointer flex justify-center items-center rounded-xl py-3 font-semibold gap-3 group transition border-2 hover:shadow-lg disabled:opacity-50"
              style={{
                backgroundColor: colors.successBg,
                borderColor: colors.primary,
                color: colors.primary,
              }}
            >
              <MdOutlineEmail size={24} /> Continue with Email
            </button>

            {/* Phone auth - requires Growth+ plan, hidden for now */}
            <button
              onClick={() => setAuthMethod("phone")}
              disabled={isLoading}
              className="hidden"
              style={{
                backgroundColor: colors.accentBg,
                borderColor: colors.border,
                color: colors.text,
              }}
            >
              <FiPhone size={24} /> Continue with Phone
            </button>

            <div
              className="mt-6 p-4 rounded-xl border"
              style={{
                backgroundColor: colors.accentBg,
                borderColor: colors.accentBorder,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <FiZap size={16} style={{ color: colors.primary }} />
                <span
                  className="text-sm font-semibold"
                  style={{ color: colors.text }}
                >
                  Secure & Simple
                </span>
              </div>
              <p className="text-xs" style={{ color: colors.textLight }}>
                Secure digital wallet • Zero transaction fees • Easy recovery
              </p>
            </div>

            {/* Benefits showcase */}
            <div className="mt-4 space-y-2">
              <div
                className="flex items-center gap-2 text-xs"
                style={{ color: colors.textLight }}
              >
                <BiCheckCircle size={14} style={{ color: colors.primary }} />
                <span>No complex setup needed</span>
              </div>
              <div
                className="flex items-center gap-2 text-xs"
                style={{ color: colors.textLight }}
              >
                <BiCheckCircle size={14} style={{ color: colors.primary }} />
                <span>Recover account with email</span>
              </div>
              <div
                className="flex items-center gap-2 text-xs"
                style={{ color: colors.textLight }}
              >
                <BiCheckCircle size={14} style={{ color: colors.primary }} />
                <span>All transactions are free</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <button
              onClick={resetEmailFlow}
              className="cursor-pointer mb-6 font-semibold flex items-center gap-2 text-sm"
              style={{ color: colors.textLight }}
            >
              <BsArrowLeft size={16} />
              Back
            </button>

            {authMethod === "email" && !emailAuth.emailSent ? (
              <>
                <h2
                  className="text-2xl font-bold text-center mb-3"
                  style={{ color: colors.text }}
                >
                  Enter Your Email
                </h2>
                <p
                  className="text-center mb-6 text-sm"
                  style={{ color: colors.textLight }}
                >
                  We'll send you a verification code to sign in
                </p>

                <div className="space-y-4 mb-6">
                  <div>
                    <label
                      className="block text-sm font-semibold mb-2"
                      style={{ color: colors.text }}
                    >
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-lime-900 focus:border-transparent transition"
                      style={{
                        borderColor: colors.border,
                        backgroundColor: colors.surface,
                        color: colors.text,
                      }}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <button
                  onClick={handleEmailSubmit}
                  disabled={isLoading || !email}
                  className="cursor-pointer w-full py-3 text-white font-semibold rounded-xl transition shadow-lg hover:shadow-xl disabled:opacity-50"
                  style={{ background: colors.primary }}
                >
                  {isLoading ? (
                    <LoadingSpinner size="sm" text="Sending..." />
                  ) : (
                    "Send Verification Code"
                  )}
                </button>

                <div
                  className="mt-4 p-3 rounded-xl border"
                  style={{
                    backgroundColor: colors.successBg,
                    borderColor: colors.successBorder,
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <FiShield size={14} style={{ color: colors.primary }} />
                    <span
                      className="text-xs font-semibold"
                      style={{ color: colors.text }}
                    >
                      What happens next?
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: colors.textLight }}>
                    We'll create your secure digital wallet automatically if you
                    don't have it already. You'll have full control of your
                    funds with easy recovery options.
                  </p>
                </div>
              </>
            ) : !emailAuth.emailSent ? null : (
              <>
                <h2
                  className="text-2xl font-bold text-center mb-3"
                  style={{ color: colors.text }}
                >
                  Verify Your Email
                </h2>
                <p
                  className="text-center mb-6 text-sm"
                  style={{ color: colors.textLight }}
                >
                  Enter the 6-digit code sent to{" "}
                  <span className="font-medium" style={{ color: colors.text }}>
                    {email}
                  </span>
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
                      className="w-full h-12 text-center text-xl font-bold border-2 rounded-xl focus:ring-2 focus:ring-lime-900 focus:border-transparent transition"
                      style={{
                        borderColor: colors.border,
                        backgroundColor: colors.surface,
                        color: colors.text,
                      }}
                      disabled={isLoading}
                    />
                  ))}
                </div>

                <button
                  onClick={handleEmailSubmit}
                  disabled={isLoading || verificationCode.length !== 6}
                  className="cursor-pointer w-full py-3 text-white font-semibold rounded-xl transition shadow-lg hover:shadow-xl mb-4 disabled:opacity-50"
                  style={{ background: colors.primary }}
                >
                  {isLoading ? (
                    <LoadingSpinner size="sm" text="Verifying..." />
                  ) : (
                    "Verify"
                  )}
                </button>

                <button
                  onClick={handleResendCode}
                  disabled={isLoading || resendCooldown > 0}
                  className="cursor-pointer w-full font-semibold text-sm hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ color: colors.primary }}
                >
                  {resendCooldown > 0
                    ? `Resend Code (${resendCooldown}s)`
                    : "Resend Code"}
                </button>

                <div
                  className="mt-4 p-3 rounded-xl border"
                  style={{
                    backgroundColor: colors.accentBg,
                    borderColor: colors.accentBorder,
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <FiClock size={14} style={{ color: colors.primary }} />
                    <span
                      className="text-xs font-semibold"
                      style={{ color: colors.text }}
                    >
                      Account Confirmation
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: colors.textLight }}>
                    Your digital wallet will be ready in seconds. No complex
                    passwords to save - just use your email for recovery.
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
