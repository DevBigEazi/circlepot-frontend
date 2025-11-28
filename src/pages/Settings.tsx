import {
  Settings2,
  User,
  Camera,
  AlertCircle,
  Palette,
  HelpCircle,
  Loader,
  Check,
  Upload,
  Bell,
  Lock,
  Copy,
  CopyCheck,
  LogOut,
} from "lucide-react";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { useThemeColors } from "../hooks/useThemeColors";
import { useUserProfile } from "../hooks/useUserProfile";
import { usePinata } from "../hooks/usePinata";
import NavBar from "../components/NavBar";
import { useNavigate } from "react-router";
import { client } from "../thirdwebClient";
import LogoutModal from "../modals/LogoutModal";
import { useDisconnect, useActiveWallet } from "thirdweb/react";
import ErrorDisplay from "../components/ErrorDisplay";
import { useBiometricContext } from "../contexts/BiometricContext";
import { useBiometric } from "../hooks/useBiometric";
import ThemeToggle from "../components/ThemeToggle";
import { useCurrency } from "../contexts/CurrencyContext";

const Settings: React.FC = () => {
  const colors = useThemeColors();
  const navigate = useNavigate();
  const { disconnect } = useDisconnect();
  const wallet = useActiveWallet();
  const { selectedCurrency, setSelectedCurrency } = useCurrency();

  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [disconnectError, setDisconnectError] = useState<string | null>(null);

  const {
    profile,
    isLoading,
    updatePhoto,
    error: profileError,
  } = useUserProfile(client);
  const { uploadImage, isUploading, uploadProgress } = usePinata();
  const { enableBiometric, disableBiometric } = useBiometricContext();
  const {
    isSupported: isBiometricSupported,
    isAuthenticating,
    error: bioError,
    registerBiometric,
    removeBiometric,
  } = useBiometric();

  const [userSettings, setUserSettings] = useState({
    userName: "",
    userFullName: "",
    userEmail: "",
    accountId: "",
    profileImage: null as string | null,
    biometrics: false,
    notifications: true,
    lastProfileUpdate: null as string | null,
  });

  const [editingProfile, setEditingProfile] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  // const [showBalance, setShowBalance] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Populate settings from profile data
  useEffect(() => {
    if (profile) {
      setUserSettings((prev) => ({
        ...prev,
        userName: profile.username || "",
        userFullName: profile.fullName || "",
        userEmail: profile.email || "",
        accountId: profile.accountId?.toString() || "",
        profileImage: profile.photo || null,
      }));
      setPreviewImage(profile.photo || null);
    }
  }, [profile]);

  // Sync biometric toggle with actual state
  useEffect(() => {
    if (userSettings.accountId) {
      const biometricState = localStorage.getItem(
        `biometric_state_${userSettings.accountId}`
      );
      if (biometricState) {
        try {
          const state = JSON.parse(biometricState);
          setUserSettings((prev) => ({
            ...prev,
            biometrics: state.isEnabled || false,
          }));
        } catch (err) {
          console.error("Failed to load biometric state:", err);
        }
      }
    }
  }, [userSettings.accountId]);

  const canUpdatePhoto = (): boolean => {
    if (!profile?.lastPhotoUpdate) return true;
    const lastUpdate = new Date(Number(profile.lastPhotoUpdate) * 1000);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return lastUpdate < thirtyDaysAgo;
  };

  const daysUntilPhotoUpdate = (): number => {
    if (!profile?.lastPhotoUpdate) return 0;
    const lastUpdate = new Date(Number(profile.lastPhotoUpdate) * 1000);
    const nextAllowedUpdate = new Date(lastUpdate);
    nextAllowedUpdate.setDate(nextAllowedUpdate.getDate() + 30);
    const daysLeft = Math.ceil(
      (nextAllowedUpdate.getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24)
    );
    return daysLeft > 0 ? daysLeft : 0;
  };

  const handleImageChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size must be less than 5MB");
        return;
      }

      if (!file.type.startsWith("image/")) {
        setError("Please select a valid image file");
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
        setError("Failed to read image file");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      setSuccess(null);

      let profilePhotoUrl: string | null = previewImage;

      // Upload new photo to IPFS if a new file was selected
      if (selectedFile) {
        try {
          const uploadResult = await uploadImage(selectedFile, {
            name: `profile-${userSettings.userName}-${Date.now()}`,
            keyvalues: {
              username: userSettings.userName,
              email: userSettings.userEmail,
              fullName: userSettings.userFullName,
              type: "profile_photo",
            },
          });
          profilePhotoUrl = uploadResult.ipfsUrl;

          // Update photo on blockchain
          await updatePhoto(profilePhotoUrl);
        } catch (uploadErr) {
          const err = uploadErr as Error;
          console.error("Photo upload failed:", err);
          setError(`Failed to upload photo: ${err.message}`);
          return;
        }
      }

      setUserSettings((prev) => ({
        ...prev,
        profileImage: profilePhotoUrl,
        lastProfileUpdate: new Date().toISOString(),
      }));
      console.log("New Photo", profilePhotoUrl);
      setSuccess("Profile photo updated successfully!");
      setEditingProfile(false);
      setSelectedFile(null);
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const error = err as Error;
      console.error("Failed to save profile:", error);
      setError(error.message || "Failed to save profile");
    }
  }, [
    previewImage,
    selectedFile,
    userSettings.userName,
    userSettings.userEmail,
    userSettings.userFullName,
    uploadImage,
    updatePhoto,
  ]);

  const handleCancelEdit = (): void => {
    setPreviewImage(userSettings.profileImage);
    setSelectedFile(null);
    setEditingProfile(false);
    setError(null);
    setSuccess(null);
  };

  const triggerFileInput = (): void => {
    fileInputRef.current?.click();
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDisconnect = async () => {
    try {
      setIsDisconnecting(true);
      setDisconnectError(null);

      if (wallet) {
        navigate("/");
        disconnect(wallet);
      }
    } catch (error: any) {
      console.error("Disconnect failed:", error);
      setDisconnectError("Failed to disconnect wallet. Please try again.");
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleBiometricToggle = async (enabled: boolean) => {
    if (enabled) {
      const result = await registerBiometric({
        userId: userSettings.accountId,
        userName: userSettings.userName,
        userEmail: userSettings.userEmail,
      });
      if (result.success) {
        enableBiometric(); // Updates global state + localStorage
        setUserSettings((prev) => ({ ...prev, biometrics: true })); // Update local state
        setSuccess("Biometric registered!");
      } else {
        setError(result.error || "Failed to register biometric");
        setUserSettings((prev) => ({ ...prev, biometrics: false })); // Reset on failure
      }
    } else {
      removeBiometric(userSettings.accountId);
      disableBiometric(); // Updates global state + localStorage
      setUserSettings((prev) => ({ ...prev, biometrics: false })); // Update local state
      setSuccess("Biometric disabled");
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const isProcessing = isLoading || isUploading;

  const CopyableField = ({
    label,
    value,
    field,
  }: {
    label: string;
    value: string;
    field: string;
  }) => (
    <div>
      <label
        className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2"
        style={{ color: colors.text }}
      >
        {label}
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          disabled
          className="flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-xl border cursor-not-allowed opacity-60 text-sm"
          style={{
            borderColor: colors.border,
            backgroundColor: colors.background,
            color: colors.textLight,
          }}
        />
        <button
          onClick={() => copyToClipboard(value, field)}
          className="px-3 sm:px-4 py-2 sm:py-3 rounded-xl border transition flex items-center justify-center flex-shrink-0 hover:opacity-80"
          style={{
            borderColor: colors.border,
            backgroundColor: colors.background,
            color: copiedField === field ? colors.primary : colors.text,
          }}
          title="Copy to clipboard"
        >
          {copiedField === field ? <CopyCheck size={16} /> : <Copy size={16} />}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <NavBar
        variant="minimal"
        onBack={() => navigate(-1)}
        title="Settings"
        titleIcon={<Settings2 size={24} />}
        colors={colors}
      />

      {/* Content */}
      <div
        className="min-h-screen pb-20 px-2 sm:px-4"
        style={{ backgroundColor: colors.background }}
      >
        <div className="max-w-2xl mx-auto py-4 sm:py-6">
          <div className="space-y-4 sm:space-y-6">
            {/* Profile Section */}
            <div
              className="rounded-2xl p-4 sm:p-6 shadow-sm border"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }}
            >
              <div className="flex items-center gap-2 sm:gap-3 mb-4">
                <div
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: colors.primary }}
                >
                  <User className="text-white" size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3
                    className="font-bold text-sm sm:text-base truncate"
                    style={{ color: colors.text }}
                  >
                    Profile
                  </h3>
                  <p
                    className="text-xs sm:text-sm truncate"
                    style={{ color: colors.textLight }}
                  >
                    Update your profile photo
                  </p>
                </div>
              </div>

              <div className="space-y-3 sm:space-y-4">
                {/* Profile Image */}
                <div className="flex flex-col items-center">
                  <div className="relative mb-3 sm:mb-4">
                    <div
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-4"
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
                          <User size={28} style={{ color: colors.textLight }} />
                        </div>
                      )}
                    </div>
                    {editingProfile && canUpdatePhoto() && (
                      <button
                        onClick={triggerFileInput}
                        disabled={isProcessing}
                        className="absolute bottom-0 right-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shadow-lg disabled:opacity-50 transition hover:scale-110"
                        style={{ backgroundColor: colors.primary }}
                      >
                        {isUploading ? (
                          <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Camera size={14} className="text-white" />
                        )}
                      </button>
                    )}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageChange}
                      accept="image/*"
                      className="hidden"
                      disabled={isProcessing}
                    />
                  </div>

                  {/* Photo Update Lock Warning */}
                  {!canUpdatePhoto() && (
                    <div
                      className="w-full rounded-lg p-2 sm:p-3 flex items-center gap-2 mb-3"
                      style={{
                        backgroundColor: colors.warningBg,
                        borderColor: colors.warningBorder,
                      }}
                    >
                      <Lock
                        size={14}
                        className="flex-shrink-0"
                        style={{ color: colors.accent }}
                      />
                      <p
                        className="text-xs"
                        style={{ color: colors.textLight }}
                      >
                        Photo update available in {daysUntilPhotoUpdate()} days
                      </p>
                    </div>
                  )}

                  {editingProfile && canUpdatePhoto() && (
                    <>
                      <button
                        onClick={triggerFileInput}
                        disabled={isProcessing}
                        className="text-xs sm:text-sm font-medium disabled:opacity-50 flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition hover:bg-opacity-10 mb-3"
                        style={{
                          color: colors.primary,
                          backgroundColor: selectedFile
                            ? colors.successBg
                            : "transparent",
                        }}
                      >
                        {selectedFile ? (
                          <>
                            <Check size={14} />
                            <span className="hidden sm:inline">
                              Image Selected
                            </span>
                            <span className="sm:hidden">Selected</span>
                          </>
                        ) : (
                          <>
                            <Upload size={14} />
                            <span className="hidden sm:inline">
                              Upload Photo
                            </span>
                            <span className="sm:hidden">Upload</span>
                          </>
                        )}
                      </button>

                      {isUploading && (
                        <div className="w-full mb-3">
                          <div
                            className="flex justify-between text-xs mb-1"
                            style={{ color: colors.textLight }}
                          >
                            <span className="truncate">
                              Uploading to IPFS...
                            </span>
                            <span className="flex-shrink-0 ml-1">
                              {uploadProgress}%
                            </span>
                          </div>
                          <div
                            className="w-full h-1.5 rounded-full"
                            style={{ backgroundColor: colors.border }}
                          >
                            <div
                              className="h-full rounded-full transition-all duration-300"
                              style={{
                                width: `${uploadProgress}%`,
                                backgroundColor: colors.primary,
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {!editingProfile && canUpdatePhoto() && (
                    <button
                      onClick={() => setEditingProfile(true)}
                      disabled={isLoading}
                      className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl font-medium text-white text-sm transition disabled:opacity-50"
                      style={{ background: colors.gradient }}
                    >
                      {isLoading ? (
                        <Loader size={14} className="animate-spin" />
                      ) : (
                        <p>{!success && "Edit Photo"}</p>
                      )}
                    </button>
                  )}
                </div>

                {/* Account ID */}
                <CopyableField
                  label="Account ID"
                  value={userSettings.accountId}
                  field="accountId"
                />

                {/* Email (Copyable) */}
                <CopyableField
                  label="Email"
                  value={userSettings.userEmail}
                  field="email"
                />

                {/* Full Name (Read-only) */}
                <div>
                  <label
                    className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2"
                    style={{ color: colors.text }}
                  >
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={userSettings.userFullName}
                    disabled
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border cursor-not-allowed opacity-60 text-sm"
                    style={{
                      borderColor: colors.border,
                      backgroundColor: colors.background,
                      color: colors.textLight,
                    }}
                  />
                  <p
                    className="text-xs mt-1"
                    style={{ color: colors.textLight }}
                  >
                    Stored on-chain and cannot be edited
                  </p>
                </div>

                {/* Username (Copyable & Read-only) */}
                <CopyableField
                  label="Username"
                  value={userSettings.userName}
                  field="username"
                />

                {(error || profileError || bioError) && (
                  <div
                    className="rounded-xl p-2 sm:p-3 flex items-start gap-2 border"
                    style={{
                      backgroundColor: colors.errorBg,
                      borderColor: colors.errorBorder,
                    }}
                  >
                    <AlertCircle
                      size={14}
                      className="flex-shrink-0 mt-0.5"
                      style={{ color: colors.accent }}
                    />
                    <p className="text-xs" style={{ color: colors.textLight }}>
                      {error || profileError || bioError}
                    </p>
                  </div>
                )}

                {success && (
                  <div
                    className="rounded-xl p-2 sm:p-3 flex items-start gap-2 border"
                    style={{
                      backgroundColor: colors.successBg,
                      borderColor: colors.successBorder,
                    }}
                  >
                    <Check
                      size={14}
                      className="flex-shrink-0 mt-0.5"
                      style={{ color: colors.primary }}
                    />
                    <p className="text-xs" style={{ color: colors.textLight }}>
                      {success}
                    </p>
                  </div>
                )}

                {editingProfile && (
                  <div className="flex gap-2 sm:gap-3">
                    <button
                      onClick={handleCancelEdit}
                      disabled={isProcessing}
                      className="flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-xl font-medium border transition disabled:opacity-50 text-sm"
                      style={{
                        borderColor: colors.border,
                        color: colors.text,
                        backgroundColor: colors.background,
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      disabled={isProcessing}
                      className="flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-xl font-medium text-white transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 sm:gap-2 text-sm"
                      style={{ background: colors.gradient }}
                    >
                      {isProcessing ? (
                        <>
                          <Loader size={14} className="animate-spin" />
                          <span className="hidden sm:inline">Saving...</span>
                        </>
                      ) : (
                        <>
                          <span className="hidden sm:inline">Save Changes</span>
                          <span className="sm:hidden">Save</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Appearance */}
            <div
              className="rounded-2xl p-4 sm:p-6 shadow-sm border"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }}
            >
              <div className="flex items-center gap-2 sm:gap-3 mb-4">
                <div
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: colors.primary }}
                >
                  <Palette className="text-white" size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3
                    className="font-bold text-sm sm:text-base truncate"
                    style={{ color: colors.text }}
                  >
                    Appearance
                  </h3>
                  <p
                    className="text-xs sm:text-sm truncate"
                    style={{ color: colors.textLight }}
                  >
                    Choose your theme
                  </p>
                </div>
              </div>
              <ThemeToggle />
            </div>

            {/* Currency Settings */}
            <div
              className="rounded-2xl p-4 sm:p-6 shadow-sm border"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }}
            >
              <div className="flex items-center gap-2 sm:gap-3 mb-4">
                <div
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: colors.primary }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v12M9 9h6a2 2 0 0 1 0 4H9m6 2H9" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3
                    className="font-bold text-sm sm:text-base truncate"
                    style={{ color: colors.text }}
                  >
                    Currency & Region
                  </h3>
                  <p
                    className="text-xs sm:text-sm truncate"
                    style={{ color: colors.textLight }}
                  >
                    Set currency
                  </p>
                </div>
              </div>
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border focus:outline-none focus:ring-2 text-sm"
                style={{
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                  color: colors.text,
                }}
              >
                <option value="NGN">Nigerian Naira (NGN)</option>
                <option value="USD">US Dollar (USD)</option>
                <option value="EUR">Euro (EUR)</option>
                <option value="GBP">British Pound (GBP)</option>
                <option value="KES">Kenyan Shilling (KES)</option>
                <option value="GHS">Ghanaian Cedi (GHS)</option>
              </select>
            </div>

            {/* Security & Privacy */}
            <div
              className="rounded-2xl p-4 sm:p-6 shadow-sm border"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }}
            >
              <h3
                className="font-bold text-sm sm:text-base mb-3 sm:mb-4"
                style={{ color: colors.text }}
              >
                Security & Privacy
              </h3>

              <div className="space-y-2 sm:space-y-4">
                <div
                  className="flex items-center justify-between p-2 sm:p-4 rounded-xl border"
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  }}
                >
                  <div className="min-w-0">
                    <div
                      className="font-semibold text-sm"
                      style={{ color: colors.text }}
                    >
                      Biometric
                    </div>
                    <div
                      className="text-xs"
                      style={{ color: colors.textLight }}
                    >
                      Fingerprint/Face ID
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={userSettings.biometrics}
                      onChange={(e) => handleBiometricToggle(e.target.checked)}
                      disabled={!isBiometricSupported || isAuthenticating}
                      className="sr-only peer"
                    />
                    <div
                      className="w-11 h-6 rounded-full peer transition"
                      style={{
                        backgroundColor: userSettings.biometrics
                          ? colors.primary
                          : colors.border,
                        opacity: !isBiometricSupported ? 0.5 : 1,
                      }}
                    />
                    <div className="absolute top-[2px] left-[2px] w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
                  </label>
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div
              className="rounded-2xl p-4 sm:p-6 shadow-sm border"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }}
            >
              <div className="flex items-center gap-2 sm:gap-3 mb-4">
                <div
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: colors.secondary }}
                >
                  <Bell className="text-white" size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3
                    className="font-bold text-sm sm:text-base truncate"
                    style={{ color: colors.text }}
                  >
                    Notifications
                  </h3>
                  <p
                    className="text-xs sm:text-sm truncate"
                    style={{ color: colors.textLight }}
                  >
                    Manage notifications
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <div
                    className="font-semibold text-sm"
                    style={{ color: colors.text }}
                  >
                    Push
                  </div>
                  <div className="text-xs" style={{ color: colors.textLight }}>
                    App notifications
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={userSettings.notifications}
                    onChange={(e) =>
                      setUserSettings((prev) => ({
                        ...prev,
                        notifications: e.target.checked,
                      }))
                    }
                  />
                  <div
                    className="w-11 h-6 rounded-full peer"
                    style={{
                      backgroundColor: userSettings.notifications
                        ? colors.primary
                        : colors.border,
                    }}
                  />
                  <div className="absolute top-[2px] left-[2px] w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
                </label>
              </div>
            </div>

            {/* Support */}
            <div
              className="rounded-2xl p-4 sm:p-6 shadow-sm border"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }}
            >
              <div className="flex items-center gap-2 sm:gap-3 mb-4">
                <div
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: colors.primary }}
                >
                  <HelpCircle className="text-white" size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3
                    className="font-bold text-sm sm:text-base truncate"
                    style={{ color: colors.text }}
                  >
                    Support
                  </h3>
                  <p
                    className="text-xs sm:text-sm truncate"
                    style={{ color: colors.textLight }}
                  >
                    Get help
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <button
                  className="w-full text-left p-2 sm:p-3 rounded-lg transition hover:opacity-80 text-xs sm:text-sm"
                  style={{ color: colors.text }}
                >
                  Help Center
                </button>
                <button
                  className="w-full text-left p-2 sm:p-3 rounded-lg transition hover:opacity-80 text-xs sm:text-sm"
                  style={{ color: colors.text }}
                >
                  Contact Support
                </button>
                <button
                  className="w-full text-left p-2 sm:p-3 rounded-lg transition hover:opacity-80 text-xs sm:text-sm"
                  style={{ color: colors.text }}
                >
                  Privacy Policy
                </button>
                <button
                  className="w-full text-left p-2 sm:p-3 rounded-lg transition hover:opacity-80 text-xs sm:text-sm"
                  style={{ color: colors.text }}
                >
                  Terms of Service
                </button>
              </div>
            </div>

            {/* Security Info */}
            <div
              className="rounded-2xl p-4 sm:p-6 border"
              style={{
                backgroundColor: colors.successBg,
                borderColor: colors.successBorder,
              }}
            >
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={colors.primary}
                  strokeWidth="2"
                  className="flex-shrink-0"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <h4
                  className="font-bold text-sm sm:text-base truncate"
                  style={{ color: colors.text }}
                >
                  Thirdweb Smart Wallet
                </h4>
              </div>
              <p
                className="text-xs sm:text-sm leading-relaxed"
                style={{ color: colors.textLight }}
              >
                Your funds are secured by Thirdweb's self-custodial smart
                wallet.
              </p>
            </div>

            {/* Logout Section */}
            <button
              onClick={() => setShowLogoutModal(true)}
              className="w-full rounded-2xl p-4 sm:p-6 shadow-sm border transition hover:opacity-90 flex items-center gap-2 sm:gap-3"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }}
            >
              <div
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: "#DC2626" }}
              >
                <LogOut className="text-white" size={18} />
              </div>
              <div className="flex-1 text-left min-w-0">
                <h3
                  className="font-bold text-sm sm:text-base"
                  style={{ color: "#DC2626" }}
                >
                  Logout
                </h3>
                <p
                  className="text-xs sm:text-sm"
                  style={{ color: colors.textLight }}
                >
                  Disconnect your wallet
                </p>
              </div>
            </button>
            {/* Disconnect Error */}
            {disconnectError && (
              <div className="mb-6">
                <ErrorDisplay
                  error={{ code: "DISCONNECT_ERROR", message: disconnectError }}
                  onDismiss={() => setDisconnectError(null)}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <LogoutModal
          isOpen={showLogoutModal}
          disabled={isDisconnecting}
          onConfirm={handleDisconnect}
          onCancel={() => setShowLogoutModal(false)}
          colors={colors}
        />
      )}
    </>
  );
};

export default Settings;
