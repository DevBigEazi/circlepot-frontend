import React, { useState } from "react";
import { useThemeColors } from "../hooks/useThemeColors";
import { useNotifications } from "../contexts/NotificationsContext";
import { Bell, X, Zap, Clock, DollarSign, Target } from "lucide-react";
import { toast } from "sonner";

interface PushNotificationReminderModalProps {
  onClose: () => void;
}

const PushNotificationReminderModal: React.FC<
  PushNotificationReminderModalProps
> = ({ onClose }) => {
  const colors = useThemeColors();
  const { togglePushNotifications } = useNotifications();
  const [isEnabling, setIsEnabling] = useState(false);

  const handleEnableNotifications = async () => {
    setIsEnabling(true);
    try {
      await togglePushNotifications();
      // Mark as completed (user enabled notifications)
      localStorage.setItem(
        "Circlepot_push_reminder_state",
        JSON.stringify({
          lastShown: Date.now(),
          snoozeUntil: null,
          enabled: true,
        }),
      );
      onClose();
    } catch (error) {
      console.error("Failed to enable push notifications:", error);
      // Don't close modal if there was an error
    } finally {
      setIsEnabling(false);
    }
  };

  const handleMaybeLater = () => {
    // Snooze for 3 days - notifications are critical, we'll remind again
    const threeDaysFromNow = Date.now() + 3 * 24 * 60 * 60 * 1000;
    localStorage.setItem(
      "Circlepot_push_reminder_state",
      JSON.stringify({
        lastShown: Date.now(),
        snoozeUntil: threeDaysFromNow,
        enabled: false,
      }),
    );
    toast.info("We'll remind you in 3 days");
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
            <Bell
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
          Stay in the Loop!
        </h2>

        {/* Subtitle */}
        <p
          className="text-center mb-6 text-sm"
          style={{ color: colors.textLight }}
        >
          Enable push notifications to never miss important updates about your
          savings circles and goals.
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
                Instant Circle Updates
              </h4>
              <p className="text-xs" style={{ color: colors.textLight }}>
                Get notified when members join, contribute, or receive payouts
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
              <Clock size={18} style={{ color: "#ef4444" }} />
            </div>
            <div className="flex-1 min-w-0">
              <h4
                className="font-semibold text-sm mb-1"
                style={{ color: colors.text }}
              >
                Payment Deadlines
              </h4>
              <p className="text-xs" style={{ color: colors.textLight }}>
                Never miss a contribution deadline with timely reminders
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
              <DollarSign size={18} style={{ color: colors.primary }} />
            </div>
            <div className="flex-1 min-w-0">
              <h4
                className="font-semibold text-sm mb-1"
                style={{ color: colors.text }}
              >
                Payout Alerts
              </h4>
              <p className="text-xs" style={{ color: colors.textLight }}>
                Celebrate instantly when you receive your circle payout
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
              <Target size={18} style={{ color: "#f97316" }} />
            </div>
            <div className="flex-1 min-w-0">
              <h4
                className="font-semibold text-sm mb-1"
                style={{ color: colors.text }}
              >
                Goal Milestones
              </h4>
              <p className="text-xs" style={{ color: colors.textLight }}>
                Track your progress with milestone notifications
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleEnableNotifications}
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
              "Enable Notifications"
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
          You can change your notification preferences anytime in Settings
        </p>
      </div>
    </div>
  );
};

export default PushNotificationReminderModal;
