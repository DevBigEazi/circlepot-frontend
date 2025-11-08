
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useActiveAccount } from 'thirdweb/react';

interface AuthContextType {
  userEmail: string | null;
  setUserEmail: (email: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_EMAIL_STORAGE_KEY = 'circlepot_user_email';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userEmail, setUserEmail] = useState<string | null>(() => {
    // Initialize from localStorage on mount
    try {
      return localStorage.getItem(USER_EMAIL_STORAGE_KEY);
    } catch {
      return null;
    }
  });
  const account = useActiveAccount();

  // Persist email to localStorage whenever it changes
  useEffect(() => {
    if (userEmail) {
      try {
        localStorage.setItem(USER_EMAIL_STORAGE_KEY, userEmail);
      } catch (error) {
        console.error('Failed to save email to localStorage:', error);
      }
    } else {
      try {
        localStorage.removeItem(USER_EMAIL_STORAGE_KEY);
      } catch (error) {
        console.error('Failed to remove email from localStorage:', error);
      }
    }
  }, [userEmail]);

  // Clear email when account disconnects
  useEffect(() => {
    if (!account) {
      setUserEmail(null);
    }
  }, [account]);

  return (
    <AuthContext.Provider value={{ userEmail, setUserEmail }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};