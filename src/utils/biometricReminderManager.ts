/**
 * Biometric Reminder Modal State Management
 */

interface BiometricReminderState {
  lastShown: number | null; // Last time modal was shown
  snoozeUntil: number | null; // If "Maybe later" was clicked
  enabled: boolean; // If user enabled biometric through the modal
  accountCreated: number | null; // When the account was created
}

const REMINDER_STORAGE_KEY = "Circlepot_biometric_reminder_state";
const DAYS_BEFORE_SHOWING = 3; // Show reminder after 3 days
const SNOOZE_DAYS = 5; // Snooze for 5 days when "Maybe Later" is clicked

/**
 * Check if browser/device supports biometric authentication
 */
export function isBiometricSupported(): boolean {
  // Check for WebAuthn API support
  return (
    window.PublicKeyCredential !== undefined &&
    navigator.credentials !== undefined
  );
}

/**
 * Detect device type for appropriate icon selection
 */
export function getDeviceType(): "ios" | "mac" | "android" | "other" {
  const ua = navigator.userAgent;
  const platform = navigator.platform;

  if (/iPhone|iPad|iPod/i.test(ua)) {
    return "ios";
  }

  if (/Macintosh|MacIntel|MacPPC|Mac68K/i.test(platform)) {
    return "mac";
  }

  if (/Android/i.test(ua)) {
    return "android";
  }

  return "other";
}

/**
 * Get biometric type name based on device
 */
export function getBiometricTypeName(): string {
  const deviceType = getDeviceType();

  switch (deviceType) {
    case "ios":
      return "Face ID / Touch ID";
    case "mac":
      return "Touch ID";
    case "android":
      return "Fingerprint / Face Unlock";
    default:
      return "Biometric";
  }
}

/**
 * Get the current reminder state from localStorage
 */
export function getBiometricReminderState(): BiometricReminderState {
  try {
    const stored = localStorage.getItem(REMINDER_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Failed to load biometric reminder state:", error);
  }

  // Default state
  return {
    lastShown: null,
    snoozeUntil: null,
    enabled: false,
    accountCreated: null,
  };
}

/**
 * Save reminder state to localStorage
 */
export function saveBiometricReminderState(
  state: Partial<BiometricReminderState>,
): void {
  try {
    const currentState = getBiometricReminderState();
    const newState = { ...currentState, ...state };
    localStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(newState));
  } catch (error) {
    console.error("Failed to save biometric reminder state:", error);
  }
}

/**
 * Initialize account creation timestamp (call when user creates profile)
 */
export function initializeBiometricReminder(): void {
  const state = getBiometricReminderState();
  if (!state.accountCreated) {
    saveBiometricReminderState({ accountCreated: Date.now() });
  }
}

/**
 * Mark biometric as enabled
 */
export function markBiometricEnabled(): void {
  saveBiometricReminderState({
    enabled: true,
    lastShown: Date.now(),
  });
}

/**
 * Snooze the reminder
 */
export function snoozeBiometricReminder(days: number = SNOOZE_DAYS): void {
  const snoozeUntil = Date.now() + days * 24 * 60 * 60 * 1000;
  saveBiometricReminderState({
    snoozeUntil,
    lastShown: Date.now(),
  });
}

/**
 * Check if biometric is already enabled for a user
 */
export function isBiometricEnabledForUser(userId: string): boolean {
  try {
    const stored = localStorage.getItem(`biometric_state_${userId}`);
    if (stored) {
      const state = JSON.parse(stored);
      return state.isEnabled === true;
    }
  } catch (error) {
    console.error("Failed to check biometric state:", error);
  }
  return false;
}

/**
 * Check if the biometric reminder modal should be shown
 * Returns true if all conditions are met:
 * - Browser/device supports biometric authentication
 * - User hasn't enabled biometric yet
 * - At least 3 days have passed since account creation (or first app launch for existing users)
 * - Snooze period has expired (if set)
 */
export async function shouldShowBiometricReminder(
  userId: string | null,
): Promise<boolean> {
  // No user ID
  if (!userId) {
    return false;
  }

  // Check if browser supports biometric
  if (!isBiometricSupported()) {
    return false;
  }

  // Check if user already enabled biometric
  if (isBiometricEnabledForUser(userId)) {
    return false;
  }

  // Get reminder state
  const state = getBiometricReminderState();

  // User already enabled through modal
  if (state.enabled) {
    return false;
  }

  // Initialize timestamp for existing users who don't have one
  // This gives existing users a 3-day grace period from their first app launch with this feature
  if (!state.accountCreated) {
    initializeBiometricReminder();
    return false; // Don't show yet, wait for 3 days
  }

  // Check if snoozed
  if (state.snoozeUntil && Date.now() < state.snoozeUntil) {
    return false;
  }

  // At this point, accountCreated is guaranteed to be set
  // Check if account is at least 3 days old
  const daysSinceCreation =
    (Date.now() - state.accountCreated!) / (1000 * 60 * 60 * 24);

  if (daysSinceCreation < DAYS_BEFORE_SHOWING) {
    return false;
  }

  // All conditions met - show the reminder
  return true;
}
