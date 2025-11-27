import React, { useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { useActiveAccount, useActiveWallet } from "thirdweb/react";
import { useUserProfile } from "../hooks/useUserProfile";
import { client } from "../thirdwebClient";
import { useThemeColors } from "../hooks/useThemeColors";
import { Settings, Bell, History } from "lucide-react";
import { normalizeIpfsUrl } from "../utils/ipfs";
import NavBar from "../components/NavBar";

const Dashboard: React.FC = () => {
  const account = useActiveAccount();
  const wallet = useActiveWallet();

  const {
    profile,
    isLoading: isLoadingProfile,
    getProfileByAccountId,
    getProfileByEmail,
    getProfileByUsername,
  } = useUserProfile(client);

  // Normalize IPFS URL to ensure it's properly formatted
  const profileImageUrl = useMemo(() => {
    if (!profile?.photo) return null;
    const normalized = normalizeIpfsUrl(profile.photo);
    return normalized;
  }, [profile?.photo]);

  const navigate = useNavigate();
  const colors = useThemeColors();

  // Debug logging
  useEffect(() => {
    const debugLog = async () => {
      console.log("Dashboard - Account state:", account);
      console.log("Dashboard - Wallet state:", wallet);

      try {
        // Test getProfileByEmail
        const emailProfile = await getProfileByEmail(
          "adesholatajudeen1@gmail.com"
        );
        console.log("Dashboard - get profileByEmail:", emailProfile);

        // Test getProfileByAccountId
        const accountIdProfile = await getProfileByAccountId("7937839747");
        console.log("Dashboard - get profileByAccountId:", accountIdProfile);

        // Test getProfileByUsername
        const usernameProfile = await getProfileByUsername("bigeazi");
        console.log("Dashboard - get profileByUsername:", usernameProfile);
      } catch (err) {
        console.error("Dashboard - Error fetching profiles:", err);
      }

      // Log current profile state
      console.log("Dashboard - Profile state:", {
        hasProfile: !!profile,
        username: profile?.username,
        fullName: profile?.fullName,
        email: profile?.email,
        accountId: profile?.accountId,
        lastPhotoUpdate: profile?.lastPhotoUpdate,
        photo: profile?.photo,
        photoLength: profile?.photo?.length,
        isLoading: isLoadingProfile,
      });
    };

    debugLog();
  }, [
    account,
    wallet,
    profile,
    isLoadingProfile,
    getProfileByEmail,
    getProfileByAccountId,
    getProfileByUsername,
  ]);

  return (
    <>
      <NavBar
        colors={colors}
        userName={profile?.username}
        fullName={profile?.fullName}
        profileImage={profileImageUrl}
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => navigate("/transactions-history")}
              className="p-2 rounded-xl transition hover:opacity-80"
              style={{ color: colors.text }}
            >
              <History size={18} />
            </button>
            <button
              onClick={() => navigate("/notifications")}
              className="p-2 rounded-xl relative transition hover:opacity-80"
              style={{ color: colors.text }}
            >
              <Bell size={18} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <button
              onClick={() => navigate("/settings")}
              className="p-2 rounded-xl transition hover:opacity-80"
              style={{ color: colors.text }}
            >
              <Settings size={18} />
            </button>
          </div>
        }
      />
       <div
        className="min-h-screen pb-10"
        style={{ backgroundColor: colors.background }}
      ></div>
    </>
  );
};

export default Dashboard;
