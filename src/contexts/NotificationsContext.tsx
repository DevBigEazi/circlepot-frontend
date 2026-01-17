import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { useActiveAccount } from "thirdweb/react";
import { toast } from "sonner";
import type {
  Notification,
  NotificationPreferences,
  NotificationType,
} from "../types/notifications";
import { DEFAULT_NOTIFICATION_PREFERENCES } from "../types/notifications";
import {
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  updateNotificationPreferences,
  isPushNotificationSupported,
  getPushSubscriptionStatus,
} from "../utils/pushNotificationManager";

interface NotificationsContextType {
  notifications: Notification[];
  notificationsEnabled: boolean;
  pushEnabled: boolean;
  isPushSupported: boolean;
  isSubscribed: boolean;
  preferences: NotificationPreferences;
  unreadCount: number;

  // Notification management
  addNotification: (
    notification: Omit<Notification, "id" | "timestamp" | "read" | "timeAgo">
  ) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  clearAllNotifications: () => void;

  // Settings management
  toggleNotifications: (enabled: boolean) => void;
  togglePushNotifications: () => Promise<void>;
  updatePreferences: (
    newPreferences: Partial<NotificationPreferences>
  ) => Promise<void>;
}

const NotificationsContext = createContext<
  NotificationsContextType | undefined
>(undefined);

const STORAGE_KEY = "Circlepot_notifications";
const PREFERENCES_KEY = "Circlepot_notification_preferences";

// Helper function to calculate time ago
const getTimeAgo = (timestamp: number): string => {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
};

export const NotificationsProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const account = useActiveAccount();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    DEFAULT_NOTIFICATION_PREFERENCES
  );
  const [isSubscribed, setIsSubscribed] = useState(false);
  const isPushSupported = isPushNotificationSupported();

  // Load notifications from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const loadedNotifications = JSON.parse(stored);
        const migratedNotifications = loadedNotifications.map(
          (n: Notification) => ({
            ...n,
            timeAgo: getTimeAgo(n.timestamp),
          })
        );
        setNotifications(migratedNotifications);
      } catch (error) {
        setNotifications([]);
      }
    }

    // Load preferences
    const storedPreferences = localStorage.getItem(PREFERENCES_KEY);
    if (storedPreferences) {
      try {
        const loadedPreferences = JSON.parse(storedPreferences);
        setPreferences({
          ...DEFAULT_NOTIFICATION_PREFERENCES,
          ...loadedPreferences,
        });
      } catch (error) {
        // Handle silently in production
      }
    }
  }, []);

  // Check push subscription status on mount and account change
  useEffect(() => {
    if (account?.address && isPushSupported) {
      getPushSubscriptionStatus().then(({ isSubscribed }) => {
        setIsSubscribed(isSubscribed);
      });
    }
  }, [account?.address, isPushSupported]);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    if (notifications.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    }
  }, [notifications]);

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
  }, [preferences]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const addNotification = useCallback(
    (
      notification: Omit<Notification, "id" | "timestamp" | "read" | "timeAgo">
    ) => {
      if (!preferences.inAppEnabled) return;

      // Check if this notification type is enabled
      const prefKey = getPrefKeyFromType(notification.type);
      if (prefKey && !preferences[prefKey]) {
        return; // User has disabled this notification type
      }

      const timestamp = Date.now();
      const newNotification: Notification = {
        ...notification,
        id: timestamp.toString(),
        timestamp,
        timeAgo: getTimeAgo(timestamp),
        read: false,
      };

      setNotifications((prev) => [newNotification, ...prev]);
    },
    [preferences]
  );

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const toggleNotifications = useCallback((enabled: boolean) => {
    setPreferences((prev) => ({ ...prev, inAppEnabled: enabled }));
  }, []);

  const clearNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const togglePushNotifications = useCallback(async () => {
    if (!account?.address) {
      return;
    }

    if (!isPushSupported) {
      return;
    }

    // Normalize address to lowercase for consistency with Subgraph
    const normalizedAddress = account.address.toLowerCase();

    try {
      if (isSubscribed) {
        // Unsubscribe
        const success = await unsubscribeFromPushNotifications(
          normalizedAddress
        );
        if (success) {
          setIsSubscribed(false);
          setPreferences((prev) => ({ ...prev, pushEnabled: false }));
          toast.success("Push notifications disabled");
        }
      } else {
        // Subscribe
        const result = await subscribeToPushNotifications(normalizedAddress, {
          ...preferences,
          pushEnabled: true,
        });
        if (result) {
          setIsSubscribed(true);
          setPreferences((prev) => ({ ...prev, pushEnabled: true }));

          // Show message from backend if available
          if (result.backendResponse?.message) {
            toast.success(result.backendResponse.message);
          } else {
            toast.success("Push notifications enabled!");
          }
        }
      }
    } catch (error: any) {
      console.error("Push notification error:", error);
      toast.error(error.message || "Failed to handle push notifications");
    }
  }, [account?.address, isSubscribed, isPushSupported, preferences]);

  const updatePreferences = useCallback(
    async (newPreferences: Partial<NotificationPreferences>) => {
      const updatedPreferences = { ...preferences, ...newPreferences };
      setPreferences(updatedPreferences);

      // Update backend if subscribed
      if (account?.address && isSubscribed) {
        try {
          const result = await updateNotificationPreferences(
            account.address.toLowerCase(),
            updatedPreferences
          );

          if (result?.message) {
            toast.success(result.message);
          }
        } catch (error: any) {
          console.error("Preference update error:", error);
          toast.error("Failed to sync preferences with server");
        }
      }
    },
    [account?.address, isSubscribed, preferences]
  );

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        notificationsEnabled: preferences.inAppEnabled,
        pushEnabled: preferences.pushEnabled,
        isPushSupported,
        isSubscribed,
        preferences,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        toggleNotifications,
        clearNotification,
        clearAllNotifications,
        togglePushNotifications,
        updatePreferences,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationsProvider"
    );
  }
  return context;
};

// Helper to map notification type to preference key
function getPrefKeyFromType(
  type: NotificationType
): keyof NotificationPreferences | null {
  const mapping: Record<NotificationType, keyof NotificationPreferences> = {
    circle_member_joined: "circleMemberJoined",
    circle_payout: "circleMemberPayout",
    circle_member_payout: "circleMemberPayout",
    circle_member_contributed: "circleMemberContributed",
    circle_member_withdrew: "circleMemberWithdrew",
    circle_started: "circleStarted",
    circle_completed: "circleCompleted",
    circle_dead: "circleDead",
    contribution_due: "contributionDue",
    vote_required: "circleVoting",
    vote_executed: "circleVoting",
    member_forfeited: "memberForfeited",
    late_payment_warning: "latePaymentWarning",
    position_assigned: "positionAssigned",
    goal_deadline_2days: "goalDeadline2Days",
    goal_deadline_1day: "goalDeadline1Day",
    goal_completed: "goalCompleted",
    goal_contribution_due: "goalContributionDue",
    goal_milestone: "goalMilestone",
    goal_reminder: "goalReminder",
    circle_invite: "circleInvite",
    invite_accepted: "inviteAccepted",
    payment_received: "paymentReceived",
    payment_late: "paymentLate",
    credit_score_changed: "creditScoreChanged",
    withdrawal_fee_applied: "withdrawalFeeApplied",
    collateral_returned: "collateralReturned",
    system_maintenance: "systemMaintenance",
    system_update: "systemUpdate",
    security_alert: "securityAlert",
    circle_joined: "circleJoined",
    circle_voting: "circleVoting",
  };

  return mapping[type] || null;
}
