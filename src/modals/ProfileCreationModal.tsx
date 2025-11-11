import React, { useState, useRef, useEffect, useCallback } from 'react';
import { User, Camera, Check, AlertCircle, Upload } from 'lucide-react';
import { useThemeColors } from '../hooks/useThemeColors';
import { useUserProfile } from '../hooks/useUserProfile';
import { usePinata } from '../hooks/usePinata';
import { useActiveAccount } from 'thirdweb/react';
import { getUserEmail } from "thirdweb/wallets/in-app";
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorDisplay from '../components/ErrorDisplay';

interface ProfileCreationModalProps {
  client: any;
  onProfileCreated?: () => void;
  userEmail?: string;
}

const ProfileCreationModal: React.FC<ProfileCreationModalProps> = ({ client, onProfileCreated }) => {
  const colors = useThemeColors();
  const account = useActiveAccount();
  const { createProfile, checkUsernameAvailability, isLoading } = useUserProfile(client);
  const { uploadImage, isUploading, uploadProgress } = usePinata();

  const [userName, setUserName] = useState('');
  const [fullName, setFullName] = useState('');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const usernameCheckTimeout = useRef<number | undefined>(undefined);

  // Fetch user email on component mount
  useEffect(() => {
    const fetchUserEmail = async () => {
      try {
        const email = await getUserEmail({ client });
        setUserEmail(email ?? null);
        console.log(email);
      } catch (err) {
        console.error('Failed to fetch user email:', err);
        setError('Failed to retrieve your email. Please try signing in again.');
      }
    };

    fetchUserEmail();
  }, [client]);

  const handleUsernameChange = useCallback((value: string) => {
    setUserName(value);
    
    if (usernameCheckTimeout.current) {
      clearTimeout(usernameCheckTimeout.current);
    }

    if (value.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    usernameCheckTimeout.current = window.setTimeout(async () => {
      setIsCheckingUsername(true);
      try {
        const available = await checkUsernameAvailability(value);
        setUsernameAvailable(available);
      } catch (err) {
        console.error('Error checking username:', err);
        setUsernameAvailable(null);
      } finally {
        setIsCheckingUsername(false);
      }
    }, 800);
  }, [checkUsernameAvailability]);

  useEffect(() => {
    return () => {
      if (usernameCheckTimeout.current) {
        clearTimeout(usernameCheckTimeout.current);
      }
    };
  }, []);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPreviewImage(result);
        setSelectedFile(file);
        setError(null);
      };
      reader.onerror = () => {
        setError('Failed to read image file');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCompleteSetup = async () => {
    if (!account?.address) {
      setError('No wallet connected');
      return;
    }

    if (!userEmail) {
      setError('Email is required. Please make sure you signed in with email.');
      return;
    }

    if (!userName.trim()) {
      setError('Username is required');
      return;
    }

    if (userName.trim().length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    if (usernameAvailable === false) {
      setError('Username is not available');
      return;
    }

    if (isCheckingUsername) {
      setError('Please wait while we check username availability');
      return;
    }

    if (!fullName.trim()) {
      setError('Full name is required');
      return;
    }

    try {
      setError(null);

      let profilePhotoUrl = '';

      if (selectedFile) {
        const uploadResult = await uploadImage(selectedFile, {
          name: `profile-${userName}-${Date.now()}`,
          keyvalues: {
            username: userName,
            email: userEmail,
            type: 'profile_photo'
          }
        });
        profilePhotoUrl = uploadResult.ipfsUrl;
      }

      await createProfile(
        userEmail,
        userName.trim(),
        fullName.trim(),
        profilePhotoUrl
      );

      onProfileCreated?.();

    } catch (err: any) {
      console.error('ProfileModal Profile setup failed:', {
        message: err.message,
        code: err.code,
        details: err
      });

      if (err.message?.includes('ProfileAlreadyExists')) {
        onProfileCreated?.();
        return;
      }

      let errorMessage = err.message || 'Failed to create profile';

      if (err.code === 'PINATA_UPLOAD_ERROR') {
        errorMessage = 'Failed to upload image to IPFS. Please try again.';
      } else if (err.code === 'PINATA_AUTH_ERROR') {
        errorMessage = 'Invalid Pinata credentials. Please check configuration.';
      } else if (err.code === 'NETWORK_ERROR') {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (err.message?.includes('timeout')) {
        errorMessage = 'Transaction timeout. Your wallet may be busy. Please try again.';
      } else if (err.message?.includes('rejected')) {
        errorMessage = 'Transaction was rejected. Please approve in your wallet.';
      } else if (err.message?.includes('UsernameAlreadyTaken')) {
        errorMessage = 'This username is already taken. Please choose another.';
      }

      setError(errorMessage);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const isFormValid = 
    userName.trim().length >= 3 && 
    usernameAvailable === true &&
    !isCheckingUsername &&
    fullName.trim().length > 0;

  const isProcessing = isLoading || isUploading;

  const formatWalletAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        className="rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto" 
        style={{ backgroundColor: colors.surface, borderColor: colors.border }}
      >
        {/* Header */}
        <div className="p-6 text-center border-b sticky top-0 z-10" style={{ borderColor: colors.border, backgroundColor: colors.surface }}>
          <div 
            className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" 
            style={{ backgroundColor: colors.primary }}
          >
            <User className="text-white" size={32} />
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: colors.text }}>
            Complete Your Profile
          </h2>
          <p className="text-sm" style={{ color: colors.textLight }}>
            Create your on-chain profile to get started
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Error Display */}
          {error && (
            <div className="mb-4">
              <ErrorDisplay
                error={{ code: 'PROFILE_ERROR', message: error }}
                onDismiss={() => setError(null)}
              />
            </div>
          )}

          {/* Profile Image */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative mb-4">
              <div 
                className="w-24 h-24 rounded-full overflow-hidden border-4" 
                style={{ borderColor: colors.primary }}
              >
                {previewImage ? (
                  <img 
                    src={previewImage} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div 
                    className="w-full h-full flex items-center justify-center" 
                    style={{ backgroundColor: colors.background }}
                  >
                    <User size={32} style={{ color: colors.textLight }} />
                  </div>
                )}
              </div>
              <button
                onClick={triggerFileInput}
                disabled={isProcessing}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center shadow-lg disabled:opacity-50 transition hover:scale-110"
                style={{ backgroundColor: colors.primary }}
              >
                {isUploading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera size={16} className="text-white" />
                )}
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
                disabled={isProcessing}
              />
            </div>
            
            <button
              onClick={triggerFileInput}
              disabled={isProcessing}
              className="text-sm font-medium disabled:opacity-50 flex items-center gap-2 px-4 py-2 rounded-lg transition hover:bg-opacity-10"
              style={{ color: colors.primary, backgroundColor: selectedFile ? colors.successBg : 'transparent' }}
            >
              {selectedFile ? (
                <>
                  <Check size={16} />
                  Image Selected
                </>
              ) : (
                <>
                  <Upload size={16} />
                  Upload Photo (Optional)
                </>
              )}
            </button>

            {isUploading && (
              <div className="mt-2 w-full">
                <div className="flex justify-between text-xs mb-1" style={{ color: colors.textLight }}>
                  <span>Uploading to IPFS...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: colors.border }}>
                  <div 
                    className="h-full rounded-full transition-all duration-300"
                    style={{ 
                      width: `${uploadProgress}%`,
                      backgroundColor: colors.primary 
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Email Display */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>
              Email Address
            </label>
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl border" style={{ borderColor: colors.border, backgroundColor: colors.background }}>
              <span className="text-sm flex-1 truncate" style={{ color: colors.textLight }}>
                {userEmail || 'No email available'}
              </span>
              {userEmail && (
                <Check size={16} className="text-green-500 flex-shrink-0" />
              )}
            </div>
            <p className="text-xs mt-1" style={{ color: colors.textLight }}>
              Your email from authentication
            </p>
          </div>

          {/* Wallet Address Display */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>
              Wallet Address
            </label>
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl border" style={{ borderColor: colors.border, backgroundColor: colors.background }}>
              <span className="text-xs font-mono flex-1" style={{ color: colors.textLight }}>
                {account?.address ? formatWalletAddress(account.address) : 'No wallet connected'}
              </span>
              {account?.address && (
                <Check size={16} className="text-green-500 flex-shrink-0" />
              )}
            </div>
            <p className="text-xs mt-1" style={{ color: colors.textLight }}>
              Your wallet address on the blockchain
            </p>
          </div>

          {/* Username Field */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>
              Username *
            </label>
            <div className="relative">
              <input
                type="text"
                value={userName}
                onChange={(e) => handleUsernameChange(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-offset-2 transition pr-10"
                style={{ 
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                  color: colors.text
                }}
                placeholder="Enter your username"
                disabled={isProcessing}
                minLength={3}
                maxLength={20}
              />
              {isCheckingUsername && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div 
                    className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
                    style={{ borderColor: colors.primary }}
                  />
                </div>
              )}
              {!isCheckingUsername && usernameAvailable !== null && userName.length >= 3 && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {usernameAvailable ? (
                    <Check size={20} style={{ color: colors.primary }} />
                  ) : (
                    <AlertCircle size={20} className="text-red-500" />
                  )}
                </div>
              )}
            </div>
            <div className="mt-1">
              {userName.length > 0 && userName.length < 3 && (
                <p className="text-xs text-yellow-600">
                  Username must be at least 3 characters
                </p>
              )}
              {usernameAvailable === false && (
                <p className="text-xs text-red-500">
                  Username is already taken
                </p>
              )}
              {usernameAvailable === true && (
                <p className="text-xs" style={{ color: colors.primary }}>
                  Username is available!
                </p>
              )}
              <p className="text-xs mt-1" style={{ color: colors.textLight }}>
                This will be visible to other members. Username cannot be changed after setup.
              </p>
            </div>
          </div>

          {/* Full Name Field */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>
              Full Name *
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-offset-2 transition"
              style={{ 
                borderColor: colors.border,
                backgroundColor: colors.surface,
                color: colors.text
              }}
              placeholder="Enter your full name"
              disabled={isProcessing}
              maxLength={50}
            />
            <p className="text-xs mt-1" style={{ color: colors.textLight }}>
              Your full name will be stored on-chain and cannot be changed
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t sticky bottom-0" style={{ borderColor: colors.border, backgroundColor: colors.surface }}>
          <button
            onClick={handleCompleteSetup}
            disabled={!isFormValid || isProcessing || !userEmail}
            className="w-full px-4 py-3 rounded-xl font-medium text-white transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: colors.gradient }}
          >
            {isUploading ? (
              <LoadingSpinner size="sm" text="Uploading to IPFS..." />
            ) : isLoading ? (
              <LoadingSpinner size="sm" text="Creating Profile..." />
            ) : (
              <>
                Complete Setup & Continue
                <Check size={18} />
              </>
            )}
          </button>
          <p className="text-xs text-center mt-3" style={{ color: colors.textLight }}>
            Your profile will be stored on the blockchain
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProfileCreationModal;