import React, { useState } from "react";
import { useNavigate } from "react-router";
import {
  Bell,
  Users,
  Target,
  DollarSign,
  AlertCircle,
  Info,
  Vote,
  Settings,
} from "lucide-react";
import { useThemeColors } from "../hooks/useThemeColors";
import { useNotifications } from "../contexts/NotificationsContext";
import NavBar from "../components/NavBar";

const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const colors = useThemeColors();
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications();
  const [activeTab, setActiveTab] = useState("all");

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "circle_invite":
      case "circle_joined":
      case "circle_started":
        return Users;
      case "circle_voting":
        return Vote;
      case "member_forfeited":
        return AlertCircle;
      case "goal_reminder":
      case "goal_completed":
        return Target;
      case "contribution_due":
      case "payment_received":
      case "circle_payout":
      case "circle_member_payout":
      case "circle_member_contributed":
      case "circle_contribution_self":
      case "collateral_returned":
        return DollarSign;
      case "circle_member_withdrew":
        return Users;
      case "payment_late":
        return AlertCircle;
      case "system_update":
        return Info;
      default:
        return Bell;
    }
  };

  const getNotificationColor = (type: string, priority: string) => {
    if (priority === "high") return "bg-green-100 text-green-700";
    if (priority === "medium") return "bg-yellow-50 text-yellow-700";
    if (priority === "low") return "bg-blue-50 text-blue-700";

    switch (type) {
      case "circle_invite":
      case "circle_joined":
      case "circle_member_joined":
      case "circle_member_withdrew":
        return "bg-blue-100 text-blue-600";
      case "goal_completed":
      case "payment_received":
      case "circle_payout":
      case "circle_member_payout":
      case "circle_member_contributed":
      case "circle_contribution_self":
      case "collateral_returned":
      case "referral_reward":
        return "bg-green-100 text-green-600";
      case "payment_late":
      case "member_forfeited":
        return "bg-red-100 text-red-600";
      case "contribution_due":
        return "bg-orange-100 text-orange-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const handleNotificationClick = (notification: any) => {
    //console.log("[Notifications] Notification Clicked:", notification);
    //console.log(
    //  "[Notifications] Navigating to:",
    //  notification.action?.action || "/",
    //);

    // Mark as read
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Navigate to action route if available
    if (notification.action?.action) {
      navigate(notification.action.action);
    }
  };

  const filteredNotifications = notifications.filter((notification) => {
    // console.log(`[Notifications] Filtering: type=${notification.type}, activeTab=${activeTab}`);
    if (activeTab === "all") return true;
    if (activeTab === "unread") return !notification.read;
    if (activeTab === "circles")
      return [
        "circle_invite",
        "circle_joined",
        "circle_started",
        "circle_payout",
        "circle_member_payout",
        "circle_voting",
        "circle_member_contributed",
        "circle_member_joined",
        "circle_member_withdrew",
        "member_forfeited",
        "circle_contribution_self",
        "payment_received",
        "payment_late",
        "contribution_due",
        "vote_required",
        "vote_executed",
        "collateral_returned",
      ].includes(notification.type);
    if (activeTab === "goals")
      return ["goal_reminder", "goal_completed"].includes(notification.type);
    if (activeTab === "payments")
      return ["referral_reward", "withdrawal_fee_applied"].includes(
        notification.type,
      );
    if (activeTab === "profile")
      return ["credit_score_changed"].includes(
        notification.type,
      );
    return true;
  });

  const tabs = [
    { id: "all", label: "All" },
    { id: "unread", label: "Unread" },
    { id: "circles", label: "Circles" },
    { id: "goals", label: "Goals" },
    { id: "payments", label: "Payments" },
    { id: "profile", label: "Profile" },
  ];

  return (
    <>
      <NavBar
        variant="tabs"
        onBack={() => navigate(-1)}
        title="Notifications"
        titleIcon={<Bell size={20} />}
        subtitle={
          unreadCount > 0
            ? `${unreadCount} unread notifications`
            : "All caught up!"
        }
        badge={unreadCount}
        colors={colors}
        actionButtonText={unreadCount > 0 ? "Mark All Read" : undefined}
        onActionClick={markAllAsRead}
        actions={
          <button
            onClick={() => navigate("/notifications/settings")}
            className="p-2 rounded-xl transition hover:opacity-80"
            style={{ color: colors.text }}
          >
            <Settings size={20} />
          </button>
        }
      />

      <div
        className="min-h-screen"
        style={{ backgroundColor: colors.background }}
      >
        <div className="max-w-4xl mx-auto px-4 py-4">
          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition ${
                  activeTab === tab.id ? "text-white" : ""
                }`}
                style={
                  activeTab === tab.id
                    ? { background: colors.primary }
                    : {
                        backgroundColor: colors.infoBg,
                        color: colors.textLight,
                      }
                }
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Notifications List */}
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: colors.surface }}
              >
                <Bell size={32} style={{ color: colors.textLight }} />
              </div>
              <h3 className="font-semibold mb-2" style={{ color: colors.text }}>
                No notifications
              </h3>
              <p className="text-sm" style={{ color: colors.textLight }}>
                {activeTab === "unread"
                  ? "All notifications have been read"
                  : "No notifications in this category"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNotifications.map((notification) => {
                const IconComponent = getNotificationIcon(notification.type);
                return (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`sm:p-4 p-2 rounded-xl border cursor-pointer transition-all hover:shadow-lg hover:scale-[1.01] ${
                      !notification.read ? "border-l-4" : ""
                    }`}
                    style={{
                      backgroundColor: colors.surface,
                      borderColor: notification.read
                        ? colors.border
                        : colors.primary,
                      borderLeftColor: !notification.read
                        ? colors.primary
                        : undefined,
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`sm:w-10 sm:h-10 w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${getNotificationColor(
                          notification.type,
                          notification.priority,
                        )}`}
                      >
                        <IconComponent className="sm:size-6 size-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between sm:mb-2 mb-0.5">
                          <h4
                            className="font-semibold sm:text-base text-sm"
                            style={{ color: colors.text }}
                          >
                            {notification.title}
                          </h4>
                          <div className="flex items-center gap-2">
                            <span
                              className="text-xs sm:text-sm"
                              style={{ color: colors.textLight }}
                            >
                              {notification.timeAgo}
                            </span>
                            {!notification.read && (
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: colors.primary }}
                              ></div>
                            )}
                          </div>
                        </div>
                        <p
                          className="text-sm sm:text-base"
                          style={{ color: colors.textLight }}
                        >
                          {notification.message}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Notifications;
