import React from "react";
import { X, Mail, Phone, Shield, ChevronRight } from "lucide-react";
import { useThemeColors } from "../hooks/useThemeColors";
import { useUserProfile } from "../hooks/useUserProfile";
import { client } from "../thirdwebClient";
import { toast } from "sonner";

interface LinkContactModalProps {
  onClose: () => void;
  onSkip: () => void;
}

const LinkContactModal: React.FC<LinkContactModalProps> = ({
  onClose,
  onSkip,
}) => {
  const colors = useThemeColors();
  const { profile } = useUserProfile(client);

  // Determine what needs to be linked
  const needsEmail = !profile?.email || profile.email.trim().length === 0;
  const needsPhone =
    !profile?.phoneNumber || profile.phoneNumber.trim().length === 0;

  // Determine what was original (permanent) - used in UI display
  const emailIsOriginal = profile?.emailIsOriginal || false;
  const phoneIsOriginal = profile?.phoneIsOriginal || false;

  const handleGoToSettings = () => {
    // Navigate to settings page where user can link contacts
    window.location.href = "/settings";
    onClose();
  };

  // For now, simplified version - direct user to Settings
  // TODO: Implement Thirdweb linkProfile flow here
  const handleLinkContact = async (_type: "email" | "phone") => {
    toast.info("Please link your contact info from Settings", {
      description: "We'll guide you through the secure linking process",
    });
    handleGoToSettings();
  };

  // If user doesn't need to link anything, close modal
  if (!needsEmail && !needsPhone) {
    onClose();
    return null;
  }

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
              <Shield className="text-white" size={24} />
            </div>
            <button
              onClick={onSkip}
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
            Secure Your Account
          </h2>
          <p className="text-sm" style={{ color: colors.textLight }}>
            Add a backup login method for account recovery
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Current permanent contact */}
          {(emailIsOriginal || phoneIsOriginal) && (
            <div
              className="rounded-xl p-4 border"
              style={{
                backgroundColor: colors.successBg,
                borderColor: colors.successBorder,
              }}
            >
              <div className="flex items-center gap-3">
                {emailIsOriginal ? (
                  <Mail size={20} style={{ color: colors.primary }} />
                ) : phoneIsOriginal ? (
                  <Phone size={20} style={{ color: colors.primary }} />
                ) : null}
                <div className="flex-1">
                  <p
                    className="text-sm font-medium"
                    style={{ color: colors.text }}
                  >
                    {emailIsOriginal
                      ? "Email (Primary)"
                      : phoneIsOriginal
                      ? "Phone (Primary)"
                      : ""}
                  </p>
                  <p className="text-xs" style={{ color: colors.textLight }}>
                    {emailIsOriginal
                      ? profile?.email
                      : phoneIsOriginal
                      ? profile?.phoneNumber
                      : ""}
                  </p>
                </div>
                <Shield size={16} style={{ color: colors.primary }} />
              </div>
            </div>
          )}

          {/* Link options */}
          <div className="space-y-3">
            {needsEmail && (
              <button
                onClick={() => handleLinkContact("email")}
                className="w-full p-4 rounded-xl border transition hover:opacity-90"
                style={{
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: colors.primary }}
                  >
                    <Mail className="text-white" size={20} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold" style={{ color: colors.text }}>
                      Link Email Address
                    </p>
                    <p className="text-xs" style={{ color: colors.textLight }}>
                      Add email for account recovery
                    </p>
                  </div>
                  <ChevronRight size={20} style={{ color: colors.textLight }} />
                </div>
              </button>
            )}

            {needsPhone && (
              <button
                onClick={() => handleLinkContact("phone")}
                className="w-full p-4 rounded-xl border transition hover:opacity-90"
                style={{
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: colors.primary }}
                  >
                    <Phone className="text-white" size={20} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold" style={{ color: colors.text }}>
                      Link Phone Number
                    </p>
                    <p className="text-xs" style={{ color: colors.textLight }}>
                      Add phone for account recovery
                    </p>
                  </div>
                  <ChevronRight size={20} style={{ color: colors.textLight }} />
                </div>
              </button>
            )}
          </div>

          {/* Info */}
          <div
            className="rounded-lg p-3 text-xs"
            style={{
              backgroundColor: `${colors.primary}10`,
              color: colors.textLight,
            }}
          >
            💡 Your{" "}
            {emailIsOriginal
              ? "email"
              : phoneIsOriginal
              ? "phone number"
              : "primary contact"}{" "}
            is your permanent login method. Adding a backup helps secure your
            account and enables recovery options.
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t" style={{ borderColor: colors.border }}>
          <button
            onClick={onSkip}
            className="w-full px-4 py-3 rounded-xl font-medium transition hover:opacity-80"
            style={{
              color: colors.textLight,
              backgroundColor: colors.background,
            }}
          >
            I'll do this later
          </button>
          <p
            className="text-xs text-center mt-3"
            style={{ color: colors.textLight }}
          >
            You can always add this from Settings
          </p>
        </div>
      </div>
    </div>
  );
};

export default LinkContactModal;
