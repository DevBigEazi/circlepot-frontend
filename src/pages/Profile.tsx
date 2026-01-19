import {
  User,
  Camera,
  Loader,
  Check,
  Mail,
  Phone,
  Shield,
  Copy,
  CopyCheck,
} from "lucide-react";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { useThemeColors } from "../hooks/useThemeColors";
import { useUserProfile } from "../hooks/useUserProfile";
import { useThirdwebStorage } from "../hooks/useThirdwebStorage";
import { toast } from "sonner";
import NavBar from "../components/NavBar";
import { useNavigate } from "react-router";
import { client } from "../thirdwebClient";
import { Skeleton } from "../components/Skeleton";
import UpdateContactModal from "../modals/UpdateContactModal";
import { getInitials } from "../utils/helpers";
import ReferralSection from "../components/ReferralSection";

const Profile: React.FC = () => {
  const colors = useThemeColors();
  const navigate = useNavigate();

  const { profile, isLoading, updateProfile, isUpdatingProfile } =
    useUserProfile(client);
  const { uploadImage, isUploading } = useThirdwebStorage(client);

  const [userSettings, setUserSettings] = useState({
    userName: "",
    userFullName: "",
    userEmail: "",
    accountId: "",
    profileImage: null as string | null,
    lastProfileUpdate: null as string | null,
  });

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showUpdateContactModal, setShowUpdateContactModal] = useState(false);
  const [contactToUpdate, setContactToUpdate] = useState<{
    type: "email" | "phone";
    value: string;
    isOriginal: boolean;
  } | null>(null);
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

  const canUpdatePhoto = (): boolean => {
    const lastUpdateSecs =
      profile?.lastProfileUpdate || userSettings.lastProfileUpdate;
    if (!lastUpdateSecs) return true;
    const lastUpdate = new Date(Number(lastUpdateSecs) * 1000);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return lastUpdate < thirtyDaysAgo;
  };

  const daysUntilPhotoUpdate = (): number => {
    const lastUpdateSecs =
      profile?.lastProfileUpdate || userSettings.lastProfileUpdate;
    if (!lastUpdateSecs) return 0;
    const lastUpdate = new Date(Number(lastUpdateSecs) * 1000);
    const nextAllowedUpdate = new Date(lastUpdate);
    nextAllowedUpdate.setDate(nextAllowedUpdate.getDate() + 30);
    const daysLeft = Math.ceil(
      (nextAllowedUpdate.getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24),
    );
    return daysLeft > 0 ? daysLeft : 0;
  };

  const handleImageChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ): void => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        return;
      }

      if (!file.type.startsWith("image/")) {
        toast.error("Please select a valid image file");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPreviewImage(result);
        setSelectedFile(file);
      };
      reader.onerror = () => {
        toast.error("Failed to read image file");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = useCallback(async (): Promise<void> => {
    try {
      let profilePhotoUrl: string | null = previewImage;
      const nameChanged = userSettings.userFullName !== profile?.fullName;
      const photoChanged = !!selectedFile;

      if (!nameChanged && !photoChanged) return;

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
        } catch (uploadErr) {
          const err = uploadErr as Error;
          toast.error(`Failed to upload photo: ${err.message}`);
          return;
        }
      }

      // Update on blockchain
      await updateProfile(userSettings.userFullName, profilePhotoUrl || "");

      setUserSettings((prev) => ({
        ...prev,
        profileImage: profilePhotoUrl,
        lastProfileUpdate: Math.floor(Date.now() / 1000).toString(),
      }));
      toast.success("Profile updated successfully!");
      setSelectedFile(null);
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || "Failed to save profile");
    }
  }, [
    previewImage,
    selectedFile,
    userSettings.userName,
    userSettings.userEmail,
    userSettings.userFullName,
    profile?.fullName,
    uploadImage,
    updateProfile,
  ]);

  const handleCancelEdit = (): void => {
    setPreviewImage(userSettings.profileImage);
    setSelectedFile(null);
  };

  const triggerFileInput = (): void => {
    fileInputRef.current?.click();
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(
      `${field.charAt(0).toUpperCase() + field.slice(1)} copied to clipboard`,
    );
    setTimeout(() => setCopiedField(null), 2000);
  };

  const isProcessing = isUpdatingProfile || isUploading;

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
          className="px-3 sm:px-4 py-2 sm:py-3 rounded-xl border transition flex items-center justify-center shrink-0 hover:opacity-80"
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
        title="My Profile"
        titleIcon={<User size={24} />}
        colors={colors}
      />

      <div
        className="min-h-screen pb-20 px-2 sm:px-4"
        style={{ backgroundColor: colors.background }}
      >
        <div className="max-w-2xl mx-auto py-4 sm:py-6">
          <div
            className="rounded-2xl p-4 sm:p-6 shadow-sm border"
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border,
            }}
          >
            {isLoading ? (
              <div className="space-y-6">
                <div className="flex flex-col items-center">
                  <Skeleton
                    width="6rem"
                    height="6rem"
                    borderRadius="50%"
                    className="mb-4"
                  />
                  <Skeleton width="8rem" height="2rem" borderRadius="0.75rem" />
                </div>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton width="30%" height="1rem" />
                      <Skeleton
                        width="100%"
                        height="3rem"
                        borderRadius="0.75rem"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Profile Photo - Standalone Centered */}
                <div className="flex flex-col items-center mb-8">
                  <div className="relative">
                    <div
                      className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl overflow-hidden border-2 flex items-center justify-center relative bg-muted"
                      style={{ borderColor: colors.border }}
                    >
                      {previewImage ? (
                        <img
                          src={previewImage}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-3xl font-bold">
                          {getInitials(profile?.fullName)}
                        </div>
                      )}
                      {isUploading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <Loader
                            className="text-white animate-spin"
                            size={24}
                          />
                        </div>
                      )}
                    </div>
                    {canUpdatePhoto() && (
                      <button
                        onClick={triggerFileInput}
                        disabled={isProcessing}
                        className="absolute -bottom-2 -right-2 p-2.5 rounded-2xl text-white shadow-lg transition hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                        style={{ backgroundColor: colors.primary }}
                      >
                        <Camera size={20} />
                      </button>
                    )}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageChange}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>

                  {/* Photo Action Buttons */}
                  {selectedFile && (
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={handleSaveProfile}
                        disabled={isProcessing}
                        className="px-4 py-2 rounded-xl text-white text-xs sm:text-sm font-semibold transition hover:opacity-90 flex items-center gap-2"
                        style={{ backgroundColor: colors.primary }}
                      >
                        {isProcessing ? (
                          <Loader size={14} className="animate-spin" />
                        ) : (
                          <Check size={14} />
                        )}
                        Save Photo
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        disabled={isProcessing}
                        className="px-4 py-2 rounded-xl border text-xs sm:text-sm font-semibold transition hover:bg-gray-50"
                        style={{
                          borderColor: colors.border,
                          color: colors.text,
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {!canUpdatePhoto() && daysUntilPhotoUpdate() > 0 && (
                    <p
                      className="text-xs mt-3 px-3 py-1 rounded-full bg-opacity-10"
                      style={{
                        color: colors.textLight,
                        backgroundColor: colors.border,
                      }}
                    >
                      Wait {daysUntilPhotoUpdate()} days to update again
                    </p>
                  )}
                </div>

                {/* Account Information */}
                <div className="space-y-4">
                  <div
                    className="pb-2 border-b"
                    style={{ borderColor: colors.border }}
                  >
                    <h4
                      className="font-bold text-sm"
                      style={{ color: colors.text }}
                    >
                      Account Information
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Account ID */}
                    <CopyableField
                      label="Account ID"
                      value={userSettings.accountId}
                      field="accountId"
                    />

                    {/* Username */}
                    <CopyableField
                      label="Username"
                      value={userSettings.userName}
                      field="userName"
                    />

                    {/* Full Name */}
                    <div className="space-y-2">
                      <label
                        className="block text-xs sm:text-sm font-medium"
                        style={{ color: colors.text }}
                      >
                        Full Name
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={userSettings.userFullName}
                          onChange={(e) =>
                            setUserSettings((prev) => ({
                              ...prev,
                              userFullName: e.target.value,
                            }))
                          }
                          disabled={!canUpdatePhoto() || isProcessing}
                          className={`flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-xl border text-sm transition focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                            !canUpdatePhoto()
                              ? "cursor-not-allowed opacity-60"
                              : ""
                          }`}
                          style={{
                            borderColor:
                              userSettings.userFullName !== profile?.fullName &&
                              canUpdatePhoto()
                                ? colors.primary
                                : colors.border,
                            backgroundColor: colors.background,
                            color: colors.text,
                          }}
                          placeholder="Enter your full name"
                        />
                        {(userSettings.userFullName !== profile?.fullName ||
                          selectedFile) &&
                          canUpdatePhoto() && (
                            <button
                              onClick={handleSaveProfile}
                              disabled={isProcessing}
                              className="px-3 sm:px-4 rounded-xl text-white text-xs font-bold transition hover:opacity-90 flex items-center justify-center shrink-0"
                              style={{ backgroundColor: colors.primary }}
                              title="Save changes"
                            >
                              {isProcessing ? (
                                <Loader size={14} className="animate-spin" />
                              ) : (
                                <Check size={18} />
                              )}
                            </button>
                          )}
                      </div>
                      {!canUpdatePhoto() && (
                        <p
                          className="text-[10px] sm:text-xs"
                          style={{ color: colors.textLight }}
                        >
                          Name can be updated once every 30 days
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Contact Information Section */}
                  <div className="mt-8 mb-4">
                    <h4
                      className="font-bold text-sm flex items-center gap-2"
                      style={{ color: colors.text }}
                    >
                      Contact Information
                    </h4>
                    <p className="text-xs" style={{ color: colors.textLight }}>
                      Linked methods for account recovery
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Email Display */}
                    <div
                      className="p-4 rounded-xl border"
                      style={{
                        borderColor: colors.border,
                        backgroundColor: colors.background,
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Mail size={16} style={{ color: colors.primary }} />
                          <span
                            className="text-xs font-semibold"
                            style={{ color: colors.text }}
                          >
                            Email Address
                          </span>
                        </div>
                        {profile?.emailIsOriginal && (
                          <div
                            className="px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1"
                            style={{
                              backgroundColor: colors.accentBg,
                              color: colors.primary,
                            }}
                          >
                            <Shield size={10} /> PRIMARY
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2 overflow-hidden">
                        <p
                          className="text-sm font-medium truncate"
                          style={{ color: colors.text }}
                        >
                          {profile?.email || "Not linked"}
                        </p>
                        {!profile?.emailIsOriginal && (
                          <button style={{ color: colors.primary }}>
                            Comming soon
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Phone Display */}
                    <div
                      className="p-4 rounded-xl border"
                      style={{
                        borderColor: colors.border,
                        backgroundColor: colors.background,
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Phone size={16} style={{ color: colors.primary }} />
                          <span
                            className="text-xs font-semibold"
                            style={{ color: colors.text }}
                          >
                            Phone Number
                          </span>
                        </div>
                        {profile?.phoneIsOriginal && (
                          <div
                            className="px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1"
                            style={{
                              backgroundColor: colors.accentBg,
                              color: colors.primary,
                            }}
                          >
                            <Shield size={10} /> PRIMARY
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2 overflow-hidden">
                        <p
                          className="text-sm font-medium truncate"
                          style={{ color: colors.text }}
                        >
                          {profile?.phoneNumber || "Not linked"}
                        </p>
                        {!profile?.phoneIsOriginal && (
                          <button style={{ color: colors.primary }}>
                            Comming soon
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Minimal Referral Section */}
                  {profile && (
                    <ReferralSection
                      userAddress={profile.userAddress}
                      username={profile.username}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Update Contact Modal */}
      {showUpdateContactModal && contactToUpdate && (
        <UpdateContactModal
          contactType={contactToUpdate.type}
          currentValue={contactToUpdate.value}
          isOriginal={contactToUpdate.isOriginal}
          onClose={() => {
            setShowUpdateContactModal(false);
            setContactToUpdate(null);
          }}
        />
      )}
    </>
  );
};

export default Profile;
