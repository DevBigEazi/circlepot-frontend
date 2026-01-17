import React from "react";
import { useNavigate } from "react-router";
import {
  Bell,
  Users,
  Target,
  DollarSign,
  Shield,
  Smartphone,
  Layout,
  Star,
  AlertCircle,
} from "lucide-react";
import { useThemeColors } from "../hooks/useThemeColors";
import { useNotifications } from "../contexts/NotificationsContext";
import NavBar from "../components/NavBar";
import { NotificationPreferences } from "../types/notifications";

const NotificationSettings: React.FC = () => {
  const navigate = useNavigate();
  const colors = useThemeColors();
  const {
    preferences,
    updatePreferences,
    isPushSupported,
    isSubscribed,
    togglePushNotifications,
  } = useNotifications();
  const [isToggling, setIsToggling] = React.useState(false);

  const handlePushToggle = async () => {
    setIsToggling(true);
    try {
      await togglePushNotifications();
    } finally {
      setIsToggling(false);
    }
  };

  const handleToggle = (key: keyof NotificationPreferences) => {
    updatePreferences({ [key]: !preferences[key] });
  };

  const PreferenceItem = ({
    icon: Icon,
    title,
    description,
    prefKey,
    disabled = false,
  }: {
    icon: any;
    title: string;
    description: string;
    prefKey: keyof NotificationPreferences;
    disabled?: boolean;
  }) => (
    <div
      className={`flex items-center justify-between py-4 ${
        disabled ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className="p-2 rounded-xl"
          style={{ backgroundColor: colors.accentBg }}
        >
          <Icon size={18} style={{ color: colors.primary }} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-sm" style={{ color: colors.text }}>
            {title}
          </h4>
          <p className="text-xs" style={{ color: colors.textLight }}>
            {description}
          </p>
        </div>
      </div>
      <button
        onClick={() => !disabled && handleToggle(prefKey)}
        disabled={disabled}
        className={`w-12 h-6 rounded-full transition-colors relative ${
          preferences[prefKey] ? "bg-lime-600" : "bg-gray-300"
        }`}
      >
        <div
          className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
            preferences[prefKey] ? "right-1" : "left-1"
          }`}
        />
      </button>
    </div>
  );

  return (
    <>
      <NavBar
        variant="minimal"
        onBack={() => navigate(-1)}
        title="Notification Settings"
        colors={colors}
      />

      <div
        className="min-h-screen pb-20"
        style={{ backgroundColor: colors.background }}
      >
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
          {/* Main Toggles */}
          <div
            className="rounded-2xl p-4 sm:p-6 shadow-sm border space-y-1"
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border,
            }}
          >
            <div
              className="flex items-center justify-between py-4 border-b border-dashed"
              style={{ borderColor: colors.border }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-100">
                  <Smartphone size={18} className="text-blue-600" />
                </div>
                <div>
                  <h4
                    className="font-bold text-sm"
                    style={{ color: colors.text }}
                  >
                    Push Notifications
                  </h4>
                  <p className="text-xs" style={{ color: colors.textLight }}>
                    {isPushSupported
                      ? "Receive alerts on your device"
                      : "Not supported on this browser"}
                  </p>
                </div>
              </div>
              <button
                onClick={handlePushToggle}
                disabled={!isPushSupported || isToggling}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  isSubscribed ? "bg-lime-600" : "bg-gray-300"
                } ${!isPushSupported || isToggling ? "opacity-30" : ""}`}
              >
                {isToggling ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <div
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                      isSubscribed ? "right-1" : "left-1"
                    }`}
                  />
                )}
              </button>
            </div>

            <div className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-100">
                  <Layout size={18} className="text-purple-600" />
                </div>
                <div>
                  <h4
                    className="font-bold text-sm"
                    style={{ color: colors.text }}
                  >
                    In-App Notifications
                  </h4>
                  <p className="text-xs" style={{ color: colors.textLight }}>
                    Show notifications inside the app
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleToggle("inAppEnabled")}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  preferences.inAppEnabled ? "bg-lime-600" : "bg-gray-300"
                }`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                    preferences.inAppEnabled ? "right-1" : "left-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Circle Notifications */}
          <div
            className="rounded-2xl p-4 sm:p-6 shadow-sm border"
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border,
            }}
          >
            <h3
              className="font-bold text-base mb-4 flex items-center gap-2"
              style={{ color: colors.text }}
            >
              <Users size={18} className="text-indigo-500" />
              Circle Activity
            </h3>
            <div
              className="divide-y divide-dashed"
              style={{ borderColor: colors.border }}
            >
              <PreferenceItem
                icon={Bell}
                title="New Member Joins"
                description="When someone joins your circle"
                prefKey="circleMemberJoined"
              />
              <PreferenceItem
                icon={DollarSign}
                title="Member Payouts"
                description="Celebrate when a member receives funds"
                prefKey="circleMemberPayout"
              />
              <PreferenceItem
                icon={Star}
                title="Circle Started"
                description="Alert when your circle officially begins"
                prefKey="circleStarted"
              />
              <PreferenceItem
                icon={Shield}
                title="Voting & Governance"
                description="Vote confirmations and circle decisions"
                prefKey="circleVoting"
              />
              <PreferenceItem
                icon={AlertCircle}
                title="Deadlines & Reminders"
                description="Urgent 24h and 1h contribution alerts"
                prefKey="latePaymentWarning"
              />
            </div>
          </div>

          {/* Financial & Security */}
          <div
            className="rounded-2xl p-4 sm:p-6 shadow-sm border"
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border,
            }}
          >
            <h3
              className="font-bold text-base mb-4 flex items-center gap-2"
              style={{ color: colors.text }}
            >
              <Shield size={18} className="text-emerald-500" />
              Wealth & Credit Score
            </h3>
            <div
              className="divide-y divide-dashed"
              style={{ borderColor: colors.border }}
            >
              <PreferenceItem
                icon={DollarSign}
                title="Payments Received"
                description="Confirmation of payouts and rewards"
                prefKey="paymentReceived"
              />
              <PreferenceItem
                icon={Star}
                title="Credit Score Changes"
                description="Updates to your credit score and rank"
                prefKey="creditScoreChanged"
              />
              <PreferenceItem
                icon={Shield}
                title="Security Alerts"
                description="Critical account and wallet security"
                prefKey="securityAlert"
              />
            </div>
          </div>

          {/* Personal Goals */}
          <div
            className="rounded-2xl p-4 sm:p-6 shadow-sm border"
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border,
            }}
          >
            <h3
              className="font-bold text-base mb-4 flex items-center gap-2"
              style={{ color: colors.text }}
            >
              <Target size={18} className="text-orange-500" />
              Personal Goals
            </h3>
            <div
              className="divide-y divide-dashed"
              style={{ borderColor: colors.border }}
            >
              <PreferenceItem
                icon={Bell}
                title="Goal Deadlines"
                description="Warnings as your goal deadline approaches"
                prefKey="goalDeadline1Day"
              />
              <PreferenceItem
                icon={Star}
                title="Goal Milestones"
                description="Celebrate reaching 25%, 50%, and 75%"
                prefKey="goalMilestone"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotificationSettings;
