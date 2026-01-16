import React, { useState } from "react";
import { Copy, Check, Users, Gift, Share2 } from "lucide-react";
import { useThemeColors } from "../hooks/useThemeColors";
import { useQuery } from "@tanstack/react-query";
import { request } from "graphql-request";
import { SUBGRAPH_URL, SUBGRAPH_HEADERS } from "../constants/constants";
import {
  GET_MINIMAL_REFERRAL_STATS,
  GET_REFERRAL_SETTINGS,
} from "../graphql/referralQueries";
import { toast } from "sonner";

interface ReferralSectionProps {
  userAddress: string;
  username: string;
}

const ReferralSection: React.FC<ReferralSectionProps> = ({
  userAddress,
  username,
}) => {
  const colors = useThemeColors();
  const [copied, setCopied] = useState(false);

  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["referralStats", userAddress],
    queryFn: async () => {
      const result: any = await request(
        SUBGRAPH_URL,
        GET_MINIMAL_REFERRAL_STATS,
        { userId: userAddress.toLowerCase() },
        SUBGRAPH_HEADERS
      );
      return result.user;
    },
    enabled: !!userAddress,
  });

  const { data: settings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ["referralSettings"],
    queryFn: async () => {
      const result: any = await request(
        SUBGRAPH_URL,
        GET_REFERRAL_SETTINGS,
        {},
        SUBGRAPH_HEADERS
      );
      return result.referralSystem;
    },
  });

  const referralLink = `${window.location.origin}?ref=${username}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Referral link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join Circlepot!",
          text: `Save in dollars with me on Circlepot! Use my link:`,
          url: referralLink,
        });
      } catch (err) {
        console.log("Share cancelled");
      }
    } else {
      handleCopy();
    }
  };

  const isEnabled = settings?.rewardsEnabled;
  // Find the first token with a bonus
  const activeToken = settings?.supportedTokens?.find(
    (t: any) => Number(t.bonusAmount) > 0
  );
  const rawBonus = activeToken?.bonusAmount || "0";
  const bonusVal = Number(rawBonus);

  // Use the exact same formatting as the stats card below
  const bonusAmount = (bonusVal / 1e18).toFixed(2);

  const hasBonus = isEnabled && bonusVal > 0;

  return (
    <div
      className="rounded-2xl py-6 border mt-6"
      style={{ backgroundColor: colors.surface, borderColor: colors.border }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
          style={{ backgroundColor: colors.primary }}
        >
          <Gift size={20} />
        </div>
        <div>
          <h4 className="font-bold text-lg" style={{ color: colors.text }}>
            {isLoadingSettings
              ? "..."
              : hasBonus
              ? `Share & Earn`
              : "Invite Your Friends"}
          </h4>
          <p className="text-xs" style={{ color: colors.textLight }}>
            {isLoadingSettings
              ? "Loading rewards..."
              : hasBonus
              ? `Invite friends and earn $${bonusAmount} USDm`
              : "Invite friends to join Circlepot"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
          <div
            className="flex items-center gap-2 mb-1 text-xs"
            style={{ color: colors.textLight }}
          >
            <Users size={14} />
            <span>Referrals</span>
          </div>
          <p className="text-xl font-bold" style={{ color: colors.text }}>
            {isLoadingStats ? "..." : stats?.referralCount || 0}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
          <div
            className="flex items-center gap-2 mb-1 text-xs"
            style={{ color: colors.textLight }}
          >
            <Gift size={14} />
            <span>Earned</span>
          </div>
          <div className="flex flex-col">
            <p className="text-xl font-bold text-green-500">
              {isLoadingStats
                ? "..."
                : `$${(
                    (Number(stats?.totalReferralRewardsEarned || 0) -
                      Number(stats?.pendingRewardsEarned || 0)) /
                    1e18
                  ).toFixed(2)}`}
            </p>
            {Number(stats?.pendingRewardsEarned || 0) > 0 && (
              <span className="text-[10px] font-medium text-amber-500 mt-1">
                + ${(Number(stats.pendingRewardsEarned) / 1e18).toFixed(2)}{" "}
                Pending
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex gap-2">
          <div
            className="flex-1 px-4 py-3 rounded-xl border text-sm truncate"
            style={{
              backgroundColor: colors.background,
              borderColor: colors.border,
              color: colors.textLight,
            }}
          >
            {referralLink}
          </div>
          <button
            onClick={handleCopy}
            className="w-12 h-12 rounded-xl flex items-center justify-center border transition hover:opacity-80"
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border,
              color: colors.text,
            }}
          >
            {copied ? (
              <Check size={18} className="text-green-500" />
            ) : (
              <Copy size={18} />
            )}
          </button>
        </div>

        <button
          onClick={shareLink}
          className="w-full py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-white transition hover:opacity-90 shadow-lg"
          style={{ backgroundColor: colors.primary }}
        >
          <Share2 size={18} />
          Share with Friends
        </button>
      </div>

      {stats?.referredBy && (
        <div
          className="mt-4 pt-4 border-t text-center"
          style={{ borderColor: colors.border }}
        >
          <p className="text-xs italic" style={{ color: colors.textLight }}>
            You were referred by{" "}
            <span className="font-bold">@{stats.referredBy.username}</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default ReferralSection;
