import { useState, useEffect, useCallback } from 'react';

export const useBiometricLock = (userId: string | null) => {
  const [isLocked, setIsLocked] = useState(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);

  // Check if biometric is enabled for this user
  useEffect(() => {
    if (userId) {
      const biometricState = localStorage.getItem(`biometric_state_${userId}`);
      if (biometricState) {
        try {
          const state = JSON.parse(biometricState);
          setIsBiometricEnabled(state.isEnabled || false);
        } catch (err) {
          console.error('Failed to load biometric state:', err);
        }
      }
    }
  }, [userId]);

  // Handle visibility change (when user switches tabs or minimizes app)
  useEffect(() => {
    if (!isBiometricEnabled || !userId) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // User left the app - set lock flag
        sessionStorage.setItem('app_locked', 'true');
      } else {
        // User returned to the app
        const wasLocked = sessionStorage.getItem('app_locked');
        if (wasLocked === 'true') {
          setIsLocked(true);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Also lock when the page is about to unload
    const handleBeforeUnload = () => {
      sessionStorage.setItem('app_locked', 'true');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isBiometricEnabled, userId]);

  // Check if app should be locked on mount
  useEffect(() => {
    if (isBiometricEnabled && userId) {
      const wasLocked = sessionStorage.getItem('app_locked');
      if (wasLocked === 'true') {
        setIsLocked(true);
      }
    }
  }, [isBiometricEnabled, userId]);

  const unlock = useCallback(() => {
    setIsLocked(false);
    sessionStorage.removeItem('app_locked');
  }, []);

  const lock = useCallback(() => {
    setIsLocked(true);
    sessionStorage.setItem('app_locked', 'true');
  }, []);

  return {
    isLocked,
    isBiometricEnabled,
    unlock,
    lock,
  };
};