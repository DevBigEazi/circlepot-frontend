import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import BiometricOverlay from '../components/BiometricOverlay';
import { useBiometric } from '../hooks/useBiometric';
import { useBiometricLock } from '../hooks/useBiomerickLock';
import { useThemeColors } from '../hooks/useThemeColors';

interface BiometricContextType {
  isBiometricEnabled: boolean;
  enableBiometric: () => void;
  disableBiometric: () => void;
  isAuthenticated: boolean;
}

const BiometricContext = createContext<BiometricContextType | undefined>(undefined);

interface BiometricProviderProps {
  children: ReactNode;
  userId: string | null;
}

export const BiometricProvider: React.FC<BiometricProviderProps> = ({ 
  children, 
  userId 
}) => {
  const colors = useThemeColors();
  const { authenticateWithBiometric } = useBiometric();
  const { isLocked, isBiometricEnabled, unlock } = useBiometricLock(userId);
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [localBiometricEnabled, setLocalBiometricEnabled] = useState(false);

  // Sync with localStorage
  useEffect(() => {
    setLocalBiometricEnabled(isBiometricEnabled);
    if (!isBiometricEnabled) {
      setIsAuthenticated(true); // If biometric is disabled, consider user authenticated
    }
  }, [isBiometricEnabled]);

  // Handle biometric authentication
  const handleAuthenticate = async () => {
    if (!userId) {
      return { success: false, error: 'User ID not found' };
    }

    const result = await authenticateWithBiometric(userId);
    
    if (result.success) {
      setIsAuthenticated(true);
      unlock();
    }
    
    return result;
  };

  const enableBiometric = () => {
    if (userId) {
      const state = { isEnabled: true, userId };
      localStorage.setItem(`biometric_state_${userId}`, JSON.stringify(state));
      setLocalBiometricEnabled(true);
    }
  };

  const disableBiometric = () => {
    if (userId) {
      const state = { isEnabled: false, userId };
      localStorage.setItem(`biometric_state_${userId}`, JSON.stringify(state));
      setLocalBiometricEnabled(false);
      setIsAuthenticated(true); // When disabled, user is considered authenticated
      unlock();
    }
  };

  const handleCancel = () => {
    // Optional: Handle cancel action (e.g., logout user)
    console.log('Biometric authentication cancelled');
  };

  return (
    <BiometricContext.Provider
      value={{
        isBiometricEnabled: localBiometricEnabled,
        enableBiometric,
        disableBiometric,
        isAuthenticated,
      }}
    >
      {children}
      
      {/* Show biometric overlay when app is locked */}
      {isLocked && localBiometricEnabled && (
        <BiometricOverlay
          isOpen={isLocked}
          onAuthenticate={handleAuthenticate}
          onCancel={handleCancel}
          colors={colors}
        />
      )}
    </BiometricContext.Provider>
  );
};

export const useBiometricContext = () => {
  const context = useContext(BiometricContext);
  if (!context) {
    throw new Error('useBiometricContext must be used within BiometricProvider');
  }
  return context;
};