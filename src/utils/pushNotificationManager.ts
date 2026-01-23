import type { PushSubscriptionData } from "../types/notifications";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;
const NOTIFICATION_API_URL =
  import.meta.env.VITE_NOTIFICATION_API_URL ||
  "http://localhost:3001/api/notifications";

/**
 * Utility function to convert a base64 string to Uint8Array
 * Required for VAPID key format
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) {
    throw new Error("This browser does not support notifications");
  }

  if (!("serviceWorker" in navigator)) {
    throw new Error("This browser does not support service workers");
  }

  return await Notification.requestPermission();
}

/**
 * Check if push notifications are supported
 */
export function isPushNotificationSupported(): boolean {
  return (
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

/**
 * Subscribe user to push notifications
 * Returns the push subscription object to send to backend
 */
export async function subscribeToPushNotifications(
  userAddress: string,
  preferences: any,
): Promise<any> {
  if (!isPushNotificationSupported()) {
    return null;
  }

  if (!VAPID_PUBLIC_KEY) {
    throw new Error(
      "Push notifications are not configured. Please contact support.",
    );
  }

  try {
    // Request permission
    const permission = await requestNotificationPermission();
    if (permission === "denied") {
      throw new Error(
        "Notification permission denied. Please enable notifications in your browser settings.",
      );
    }
    if (permission !== "granted") {
      return null;
    }

    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;

    // Check for existing subscription
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      const convertedVapidKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey.buffer as ArrayBuffer,
      });
    }

    // Convert subscription to serializable format
    const subscriptionJSON = subscription.toJSON();

    const subscriptionData: PushSubscriptionData = {
      subscription: {
        endpoint: subscriptionJSON.endpoint!,
        keys: {
          p256dh: subscriptionJSON.keys!.p256dh!,
          auth: subscriptionJSON.keys!.auth!,
        },
      },
      userAddress,
      preferences,
    };

    // Send subscription to backend
    if (NOTIFICATION_API_URL) {
      const backendResponse = await sendSubscriptionToBackend(subscriptionData);
      return { ...subscriptionData, backendResponse };
    }

    return subscriptionData;
  } catch (error) {
    throw error;
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPushNotifications(
  userAddress: string,
): Promise<boolean> {
  if (!isPushNotificationSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      // Unsubscribe from push service
      await subscription.unsubscribe();

      // Notify backend
      if (NOTIFICATION_API_URL) {
        await fetch(`${NOTIFICATION_API_URL}/unsubscribe`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userAddress }),
        });
      }

      return true;
    }

    return false;
  } catch (error) {
    return false;
  }
}

/**
 * Update notification preferences on the backend
 */
export async function updateNotificationPreferences(
  userAddress: string,
  preferences: any,
): Promise<any> {
  if (!NOTIFICATION_API_URL) {
    return;
  }

  try {
    const response = await fetch(`${NOTIFICATION_API_URL}/preferences`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userAddress,
        preferences,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to update preferences");
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
}

/**
 * Send subscription data to backend
 */
async function sendSubscriptionToBackend(
  subscriptionData: PushSubscriptionData,
): Promise<any> {
  try {
    const response = await fetch(`${NOTIFICATION_API_URL}/subscribe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(subscriptionData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error ||
          `Failed to send subscription to backend: ${response.statusText}`,
      );
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
}

/**
 * Get current push subscription status
 */
export async function getPushSubscriptionStatus(): Promise<{
  isSubscribed: boolean;
  subscription: PushSubscription | null;
}> {
  if (!isPushNotificationSupported()) {
    return { isSubscribed: false, subscription: null };
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    return {
      isSubscribed: subscription !== null,
      subscription,
    };
  } catch (error) {
    return { isSubscribed: false, subscription: null };
  }
}

/**
 * Push Notification Reminder Modal State Management
 */

interface PushReminderState {
  lastShown: number | null; // Last time modal was shown
  snoozeUntil: number | null; // If "Maybe later" was clicked
  enabled: boolean; // If user enabled notifications through the modal
}

const REMINDER_STORAGE_KEY = "Circlepot_push_reminder_state";

/**
 * Get the current reminder state from localStorage
 */
export function getPushReminderState(): PushReminderState {
  try {
    const stored = localStorage.getItem(REMINDER_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    //console.error("Failed to load push reminder state:", error);
  }

  // Default state
  return {
    lastShown: null,
    snoozeUntil: null,
    enabled: false,
  };
}

/**
 * Check if the push notification reminder modal should be shown
 * Returns true if all conditions are met:
 * - Browser supports push notifications
 * - User is not already subscribed
 * - User hasn't enabled yet
 * - Snooze period has expired (if set)
 */
export async function shouldShowPushReminder(): Promise<boolean> {
  // Check if browser supports push notifications
  if (!isPushNotificationSupported()) {
    return false;
  }

  // Check if user is already subscribed
  const { isSubscribed } = await getPushSubscriptionStatus();
  if (isSubscribed) {
    return false;
  }

  // Check reminder state
  const state = getPushReminderState();

  // User already enabled (edge case where subscription failed but user tried)
  if (state.enabled) {
    return false;
  }

  // Check if snoozed
  if (state.snoozeUntil && Date.now() < state.snoozeUntil) {
    return false;
  }

  // All conditions met - show the reminder
  return true;
}
