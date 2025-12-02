import React, { useMemo } from "react";
import { useUserProfile } from "../hooks/useUserProfile";
import { client } from "../thirdwebClient";
import { useNavigate } from "react-router";
import { useThemeColors } from "../hooks/useThemeColors";
import NavBar from "../components/NavBar";
import { normalizeIpfsUrl } from "../utils/ipfs";

const Analytics: React.FC = () => {
  const navigate = useNavigate();
  const colors = useThemeColors();

  const { profile } = useUserProfile(client);
  // Normalize IPFS URL to ensure it's properly formatted
  const profileImageUrl = useMemo(() => {
    if (!profile?.photo) return null;
    const normalized = normalizeIpfsUrl(profile.photo);
    return normalized;
  }, [profile?.photo]);

  return (
    <>
      <NavBar
        colors={colors}
        userName={profile?.username}
        fullName={profile?.fullName}
        profileImage={profileImageUrl}
        onBack={() => navigate(-1)}
      />

      {/* main UI */}
      <div
        className="min-h-screen pb-20"
        style={{ backgroundColor: colors.background }}
      >
        
      </div>
    </>
  );
};

export default Analytics;
