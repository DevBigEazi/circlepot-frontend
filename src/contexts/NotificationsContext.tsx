import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type:
    | "circle_invite"
    | "circle_joined"
    | "circle_started"
    | "circle_voting"
    | "goal_reminder"
    | "goal_completed"
    | "contribution_due"
    | "payment_received"
    | "circle_payout"
    | "payment_late"
    | "system_update";
  priority: "high" | "medium" | "low";
  read: boolean;
  timeAgo: string;
  timestamp: number;
  action?: {
    label?: string;
    action: string;
  };
}

interface NotificationsContextType {
  notifications: Notification[];
  notificationsEnabled: boolean;
  unreadCount: number;
  addNotification: (
    notification: Omit<Notification, "id" | "timestamp" | "read" | "timeAgo">
  ) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  toggleNotifications: (enabled: boolean) => void;
  clearNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

const NotificationsContext = createContext<
  NotificationsContextType | undefined
>(undefined);

const STORAGE_KEY = "circlepot_notifications";
const SETTINGS_KEY = "circlepot_notifications_enabled";

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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Load notifications from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const settingsStored = localStorage.getItem(SETTINGS_KEY);

    if (stored) {
      try {
        const loadedNotifications = JSON.parse(stored);

        // Migrate old notifications to add action routes
        const migratedNotifications = loadedNotifications.map(
          (n: Notification) => {
            // If notification already has an action, keep it
            if (n.action) {
              return {
                ...n,
                timeAgo: getTimeAgo(n.timestamp),
              };
            }

            // Add action based on notification type
            let action = undefined;

            switch (n.type) {
              case "circle_started":
              case "contribution_due":
                action = { label: "View Circle", action: "/browse" };
                break;
              case "circle_payout":
                action = {
                  label: "View History",
                  action: "/transactions-history",
                };
                break;
              case "goal_completed":
              case "goal_reminder":
                action = { label: "View Goals", action: "/goals" };
                break;
              case "payment_received":
              case "payment_late":
                action = {
                  label: "View Transaction",
                  action: "/transactions-history",
                };
                break;
            }

            return {
              ...n,
              timeAgo: getTimeAgo(n.timestamp),
              action,
            };
          }
        );

        setNotifications(migratedNotifications);
      } catch (error) {
        setNotifications([]);
      }
    } else {
      // Initialize with empty array if no stored data
      setNotifications([]);
    }

    if (settingsStored !== null) {
      setNotificationsEnabled(settingsStored === "true");
    }
  }, []);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    if (notifications.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    }
  }, [notifications]);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, String(notificationsEnabled));
  }, [notificationsEnabled]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const addNotification = (
    notification: Omit<Notification, "id" | "timestamp" | "read" | "timeAgo">
  ) => {
    if (!notificationsEnabled) return;

    const timestamp = Date.now();
    const newNotification: Notification = {
      ...notification,
      id: timestamp.toString(),
      timestamp,
      timeAgo: getTimeAgo(timestamp),
      read: false,
    };

    setNotifications((prev) => [newNotification, ...prev]);
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const toggleNotifications = (enabled: boolean) => {
    setNotificationsEnabled(enabled);
  };

  const clearNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        notificationsEnabled,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        toggleNotifications,
        clearNotification,
        clearAllNotifications,
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
