import React, { useState } from "react";
import { useThemeColors } from "../hooks/useThemeColors";
import { useBiometricContext } from "../contexts/BiometricContext";
import {
  Fingerprint,
  ScanFace,
  X,
  Shield,
  Lock,
  Zap,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import {
  snoozeBiometricReminder,
  markBiometricEnabled,
  getDeviceType,
  getBiometricTypeName,
} from "../utils/biometricReminderManager";

interface BiometricReminderModalProps {
  onClose: () => void;
  userId: string;
}

const BiometricReminderModal: React.FC<BiometricReminderModalProps> = ({
  onClose,
}) => {
  const colors = useThemeColors();
  const { enableBiometric } = useBiometricContext();
  const [isEnabling, setIsEnabling] = useState(false);

  const deviceType = getDeviceType();
  const biometricName = getBiometricTypeName();

  // Select icon based on device type
  const BiometricIcon =
    deviceType === "ios" || deviceType === "mac" ? ScanFace : Fingerprint;

  const handleEnableBiometric = async () => {
    setIsEnabling(true);
    try {
      // Enable biometric in context
      enableBiometric();

      // Mark as enabled in reminder state
      markBiometricEnabled();

      toast.success("Biometric Security Enabled!", {
        description: `${biometricName} is now active for faster, secure access.`,
      });

      onClose();
    } catch (error) {
      //console.error("Failed to enable biometric:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsEnabling(false);
    }
  };

  const handleMaybeLater = () => {
    // Snooze for 5 days
    snoozeBiometricReminder(5);
    toast.info("We'll remind you in 5 days");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div
        className="rounded-3xl shadow-2xl p-6 w-full max-w-md relative animate-in zoom-in-95 duration-300"
        style={{ backgroundColor: colors.surface }}
      >
        {/* Close button */}
        <button
          onClick={handleMaybeLater}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          style={{ color: colors.textLight }}
        >
          <X size={20} />
        </button>

        {/* Icon with animation */}
        <div className="flex justify-center mb-4">
          <div
            className="relative p-4 rounded-full animate-pulse"
            style={{
              backgroundColor: colors.accentBg,
            }}
          >
            <div
              className="absolute inset-0 rounded-full animate-ping opacity-20"
              style={{ backgroundColor: colors.primary }}
            />
            <BiometricIcon
              size={40}
              className="relative z-10"
              style={{ color: colors.primary }}
            />
          </div>
        </div>

        {/* Title */}
        <h2
          className="text-2xl font-bold text-center mb-2"
          style={{ color: colors.text }}
        >
          Secure Your Account
        </h2>

        {/* Subtitle */}
        <p
          className="text-center mb-6 text-sm"
          style={{ color: colors.textLight }}
        >
          Enable {biometricName} for faster, more secure access to your savings
          and circles.
        </p>

        {/* Benefits */}
        <div className="space-y-3 mb-6">
          <div
            className="flex items-start gap-3 p-3 rounded-xl"
            style={{ backgroundColor: colors.accentBg }}
          >
            <div
              className="p-2 rounded-lg shrink-0"
              style={{ backgroundColor: colors.successBg }}
            >
              <Zap size={18} style={{ color: colors.primary }} />
            </div>
            <div className="flex-1 min-w-0">
              <h4
                className="font-semibold text-sm mb-1"
                style={{ color: colors.text }}
              >
                Quick & Convenient
              </h4>
              <p className="text-xs" style={{ color: colors.textLight }}>
                Access your account instantly without typing passwords
              </p>
            </div>
          </div>

          <div
            className="flex items-start gap-3 p-3 rounded-xl"
            style={{ backgroundColor: colors.accentBg }}
          >
            <div
              className="p-2 rounded-lg shrink-0"
              style={{ backgroundColor: colors.errorBg }}
            >
              <Shield size={18} style={{ color: "#10b981" }} />
            </div>
            <div className="flex-1 min-w-0">
              <h4
                className="font-semibold text-sm mb-1"
                style={{ color: colors.text }}
              >
                Enhanced Security
              </h4>
              <p className="text-xs" style={{ color: colors.textLight }}>
                Protect your savings with military-grade biometric encryption
              </p>
            </div>
          </div>

          <div
            className="flex items-start gap-3 p-3 rounded-xl"
            style={{ backgroundColor: colors.accentBg }}
          >
            <div
              className="p-2 rounded-lg shrink-0"
              style={{ backgroundColor: colors.accentBg }}
            >
              <Lock size={18} style={{ color: "#8b5cf6" }} />
            </div>
            <div className="flex-1 min-w-0">
              <h4
                className="font-semibold text-sm mb-1"
                style={{ color: colors.text }}
              >
                Privacy First
              </h4>
              <p className="text-xs" style={{ color: colors.textLight }}>
                Your biometric data stays on your device, never on our servers
              </p>
            </div>
          </div>

          <div
            className="flex items-start gap-3 p-3 rounded-xl"
            style={{ backgroundColor: colors.accentBg }}
          >
            <div
              className="p-2 rounded-lg shrink-0"
              style={{ backgroundColor: colors.successBg }}
            >
              <Clock size={18} style={{ color: "#f59e0b" }} />
            </div>
            <div className="flex-1 min-w-0">
              <h4
                className="font-semibold text-sm mb-1"
                style={{ color: colors.text }}
              >
                Auto-Lock Protection
              </h4>
              <p className="text-xs" style={{ color: colors.textLight }}>
                Your app locks automatically when minimized for added safety
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleEnableBiometric}
            disabled={isEnabling}
            className="w-full py-3 px-4 rounded-xl font-bold text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: colors.primary }}
          >
            {isEnabling ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Enabling...
              </span>
            ) : (
              `Enable ${biometricName}`
            )}
          </button>

          <button
            onClick={handleMaybeLater}
            className="w-full py-3 px-4 rounded-xl font-semibold transition-all border-2"
            style={{
              borderColor: colors.border,
              color: colors.text,
              backgroundColor: "transparent",
            }}
          >
            Maybe Later
          </button>
        </div>

        {/* Privacy note */}
        <p
          className="text-xs text-center mt-4 px-2"
          style={{ color: colors.textLight }}
        >
          You can change your biometric settings anytime in Settings
        </p>
      </div>
    </div>
  );
};

export default BiometricReminderModal;
