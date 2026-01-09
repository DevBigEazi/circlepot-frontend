import React, { useState, useRef } from "react";
import { X, Mail, Phone, Shield, AlertCircle } from "lucide-react";
import { useThemeColors } from "../hooks/useThemeColors";
import { useUserProfile } from "../hooks/useUserProfile";
import { client } from "../thirdwebClient";
import { toast } from "sonner";
import LoadingSpinner from "../components/LoadingSpinner";
import {
  linkProfile,
  getUserEmail,
  getUserPhoneNumber,
} from "thirdweb/wallets/in-app";

interface UpdateContactModalProps {
  onClose: () => void;
  contactType: "email" | "phone";
  currentValue?: string;
  isOriginal?: boolean;
}

const UpdateContactModal: React.FC<UpdateContactModalProps> = ({
  onClose,
  contactType,
  currentValue = "",
  isOriginal = false,
}) => {
  const colors = useThemeColors();
  const { updateContactInfo, canUpdateContact, daysUntilContactUpdate } =
    useUserProfile(client);

  const [step, setStep] = useState<"input" | "verify">("input");
  const [contactValue, setContactValue] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [codeDigits, setCodeDigits] = useState<string[]>([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const codeInputRefs = useRef<Array<HTMLInputElement | null>>([
    null,
    null,
    null,
    null,
    null,
    null,
  ]);

  const canUpdate = canUpdateContact();
  const daysRemaining = daysUntilContactUpdate();

  // Validate contact format
  const validateContact = (value: string): boolean => {
    if (contactType === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value);
    } else {
      const phoneRegex = /^\+[1-9]\d{1,14}$/;
      return phoneRegex.test(value);
    }
  };

  const handleSendCode = async () => {
    if (!validateContact(contactValue)) {
      toast.error(
        contactType === "email"
          ? "Please enter a valid email address"
          : "Please enter a valid phone number (e.g., +1234567890)"
      );
      return;
    }

    setIsLoading(true);
    try {
      // Link the new contact with Thirdweb (requires Growth+ plan)
      const linkArgs = (
        contactType === "email"
          ? { strategy: "email", email: contactValue, client }
          : { strategy: "phone", phoneNumber: contactValue, client }
      ) as any;

      await linkProfile(linkArgs);

      setStep("verify");
      toast.success(`Verification code sent to ${contactValue}`);
    } catch (error: any) {
      console.error("Error sending code:", error);
      toast.error(error.message || "Failed to send verification code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      toast.error("Please enter the 6-digit code");
      return;
    }

    setIsLoading(true);
    try {
      // Get the verified contact from Thirdweb
      const verifiedContact =
        contactType === "email"
          ? await getUserEmail({ client })
          : await getUserPhoneNumber({ client });

      if (!verifiedContact) {
        throw new Error("Failed to verify contact");
      }

      // Update the contact in the smart contract
      const currentEmail =
        contactType === "email" ? verifiedContact : currentValue || "";
      const currentPhone =
        contactType === "phone" ? verifiedContact : currentValue || "";

      await updateContactInfo(currentEmail, currentPhone);

      toast.success(
        `${
          contactType === "email" ? "Email" : "Phone number"
        } updated successfully!`
      );
      onClose();
    } catch (error: any) {
      console.error("Error verifying code:", error);

      let errorMessage = error.message || "Failed to verify code";
      if (errorMessage.includes("EmailAlreadyTaken")) {
        errorMessage = "This email is already in use by another account";
      } else if (errorMessage.includes("PhoneNumberAlreadyTaken")) {
        errorMessage = "This phone number is already in use by another account";
      } else if (errorMessage.includes("CannotUpdateContactYet")) {
        errorMessage = `You can update your contact info in ${daysRemaining} days`;
      }

      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    if (!/^[0-9]?$/.test(value)) return;
    const next = [...codeDigits];
    next[index] = value;
    setCodeDigits(next);
    setVerificationCode(next.join(""));

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

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        className="rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300"
        style={{ backgroundColor: colors.surface, borderColor: colors.border }}
      >
        {/* Header */}
        <div className="p-6 border-b" style={{ borderColor: colors.border }}>
          <div className="flex items-center justify-between mb-2">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: colors.primary }}
            >
              {contactType === "email" ? (
                <Mail className="text-white" size={24} />
              ) : (
                <Phone className="text-white" size={24} />
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition hover:opacity-70"
              style={{ color: colors.textLight }}
            >
              <X size={20} />
            </button>
          </div>
          <h2
            className="text-2xl font-bold mb-2"
            style={{ color: colors.text }}
          >
            {currentValue
              ? `Update ${contactType === "email" ? "Email" : "Phone Number"}`
              : `Add ${contactType === "email" ? "Email" : "Phone Number"}`}
          </h2>
          <p className="text-sm" style={{ color: colors.textLight }}>
            {isOriginal
              ? "This is your primary login method and cannot be changed"
              : currentValue
              ? "Update your backup contact information"
              : "Add a backup contact for account recovery"}
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Cooldown Warning */}
          {!canUpdate && !isOriginal && (
            <div
              className="rounded-xl p-4 mb-4 border"
              style={{
                backgroundColor: colors.errorBg,
                borderColor: colors.errorBorder,
              }}
            >
              <div className="flex items-start gap-3">
                <AlertCircle size={20} style={{ color: "#EF4444" }} />
                <div className="flex-1">
                  <p
                    className="font-semibold text-sm"
                    style={{ color: colors.text }}
                  >
                    Update cooldown active
                  </p>
                  <p
                    className="text-xs mt-1"
                    style={{ color: colors.textLight }}
                  >
                    You can update your contact info in {daysRemaining} days
                    (30-day cooldown)
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Original Contact Warning */}
          {isOriginal && (
            <div
              className="rounded-xl p-4 mb-4 border"
              style={{
                backgroundColor: colors.accentBg,
                borderColor: colors.accentBorder,
              }}
            >
              <div className="flex items-start gap-3">
                <Shield size={20} style={{ color: colors.primary }} />
                <div className="flex-1">
                  <p
                    className="font-semibold text-sm"
                    style={{ color: colors.text }}
                  >
                    Primary Login Method
                  </p>
                  <p
                    className="text-xs mt-1"
                    style={{ color: colors.textLight }}
                  >
                    This contact method is permanent and cannot be changed for
                    security reasons
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Input */}
          {step === "input" && !isOriginal && canUpdate && (
            <>
              <div className="mb-4">
                <label
                  className="block text-sm font-semibold mb-2"
                  style={{ color: colors.text }}
                >
                  {contactType === "email" ? "Email Address" : "Phone Number"}
                </label>
                <input
                  type={contactType === "email" ? "email" : "tel"}
                  value={contactValue}
                  onChange={(e) => setContactValue(e.target.value)}
                  placeholder={
                    contactType === "email" ? "you@example.com" : "+1234567890"
                  }
                  className="w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-lime-900 focus:border-transparent transition"
                  style={{
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                    color: colors.text,
                  }}
                  disabled={isLoading}
                />
                {contactType === "phone" && (
                  <p
                    className="text-xs mt-1"
                    style={{ color: colors.textLight }}
                  >
                    Must include country code (e.g., +1 for US, +234 for
                    Nigeria)
                  </p>
                )}
              </div>

              <button
                onClick={handleSendCode}
                disabled={isLoading || !contactValue}
                className="w-full py-3 text-white font-semibold rounded-xl transition shadow-lg hover:shadow-xl disabled:opacity-50"
                style={{ background: colors.primary }}
              >
                {isLoading ? (
                  <LoadingSpinner size="sm" text="Sending..." />
                ) : (
                  "Send Verification Code"
                )}
              </button>
            </>
          )}

          {/* Step 2: Verify */}
          {step === "verify" && (
            <>
              <p
                className="text-center mb-6 text-sm"
                style={{ color: colors.textLight }}
              >
                Enter the 6-digit code sent to{" "}
                <span className="font-medium" style={{ color: colors.text }}>
                  {contactValue}
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
                onClick={handleVerifyCode}
                disabled={isLoading || verificationCode.length !== 6}
                className="w-full py-3 text-white font-semibold rounded-xl transition shadow-lg hover:shadow-xl mb-4 disabled:opacity-50"
                style={{ background: colors.primary }}
              >
                {isLoading ? (
                  <LoadingSpinner size="sm" text="Verifying..." />
                ) : (
                  "Verify & Update"
                )}
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        {!isOriginal && (
          <div className="p-6 border-t" style={{ borderColor: colors.border }}>
            <p
              className="text-xs text-center"
              style={{ color: colors.textLight }}
            >
              {currentValue
                ? "After updating, you'll have a 30-day cooldown before the next update"
                : "This will be your backup login method"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpdateContactModal;
