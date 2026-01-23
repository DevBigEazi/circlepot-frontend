import React, { useState, useEffect } from "react";
import { useActiveAccount } from "thirdweb/react";
import { X, Users, Lock, Globe } from "lucide-react";
import { ActiveCircle } from "../interfaces/interfaces";
import { useCircleSavings } from "../hooks/useCircleSavings";
import { ThirdwebClient } from "thirdweb";
import VisibilityConfirmModal from "./VisibilityConfirmModal";
import CircleOverviewTab from "../components/CircleOverviewTab";
import CircleRulesTab from "../components/CircleRulesTab";
import CircleMembersTab from "../components/CircleMembersTab";
import { MessageCircle } from "lucide-react";
import CircleActions from "../components/CircleActions";
import { toast } from "sonner";
import CirclePayoutHistoryTab from "../components/CirclePayoutHistoryTab";

interface CircleDetailsModalProps {
  circle: ActiveCircle;
  setShowCircleDetails: (show: boolean) => void;
  colors: any;
  onJoinCircle: (circle: ActiveCircle) => void;
  onRequestInvite: () => void;
  client: ThirdwebClient;
  onInitiateVoting: (circleId: bigint) => Promise<any>;
  onCastVote: (circleId: bigint, choice: 1 | 2) => Promise<any>;
  onExecuteVote: (circleId: bigint) => Promise<any>;
  onWithdrawCollateral: (circleId: bigint) => Promise<any>;
  onContribute: (
    circleId: bigint,
    amount: bigint,
    isLate?: boolean,
  ) => Promise<any>;
  onForfeitMember: (circleId: bigint, lateMembers: string[]) => Promise<any>;
  getWithdrawalInfo?: (circleId: bigint, userAddress?: string) => any;
  getLateMembersForCircle: (circleId: bigint) => string[];
}

const CircleDetailsModal: React.FC<CircleDetailsModalProps> = ({
  circle,
  setShowCircleDetails,
  colors,
  onJoinCircle,
  client,
  onInitiateVoting,
  onCastVote,
  onExecuteVote,
  onWithdrawCollateral,
  onContribute,
  onForfeitMember,
  getWithdrawalInfo,
  getLateMembersForCircle,
}) => {
  const [activeTab, setActiveTab] = useState("overview");
  const { updateCircleVisibility, vaultProjects } = useCircleSavings(
    client,
    true,
  );
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [localVisibility, setLocalVisibility] = useState<0 | 1 | null>(null);
  const account = useActiveAccount();

  const isCreator =
    account?.address &&
    circle.rawCircle?.creator?.id &&
    account.address.toLowerCase() === circle.rawCircle.creator.id.toLowerCase();

  const isMember = circle.currentPosition > 0;

  // Initialize local visibility from circle data
  useEffect(() => {
    if (circle.rawCircle?.visibility !== undefined) {
      setLocalVisibility(circle.rawCircle.visibility as 0 | 1);
    }
  }, [circle.rawCircle?.visibility]);

  if (!circle) return null;

  const handleVisibilityButtonClick = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmVisibilityUpdate = async () => {
    if (!circle.rawCircle) return;

    try {
      setShowConfirmModal(false);
      setIsUpdatingVisibility(true);

      const currentVisibility =
        localVisibility ?? (circle.rawCircle.visibility as 0 | 1);
      const newVisibility = currentVisibility === 0 ? 1 : 0;

      await updateCircleVisibility(
        circle.rawCircle.circleId,
        newVisibility as 0 | 1,
      );

      setLocalVisibility(newVisibility as 0 | 1);
      setIsUpdatingVisibility(false);
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Failed to update visibility");
      setIsUpdatingVisibility(false);
    }
  };

  const handleCancelVisibilityUpdate = () => {
    setShowConfirmModal(false);
  };

  const getCircleState = (state: string) => {
    switch (state.toUpperCase()) {
      case "PENDING":
        return {
          text: "Waiting for Members",
          color: "bg-yellow-100 text-yellow-700",
        };
      case "CREATED":
        return {
          text: "Waiting for Members",
          color: "bg-yellow-100 text-yellow-700",
        };
      case "VOTING":
        return { text: "Voting Active", color: "bg-blue-100 text-blue-700" };
      case "ACTIVE":
        return { text: "Active", color: "bg-green-100 text-green-700" };
      case "COMPLETED":
        return { text: "Completed", color: "bg-gray-100 text-gray-700" };
      case "DEAD":
        return {
          text: "Circle Dead",
          color: "bg-red-100 text-red-700",
        };
      case "WITHDRAWN":
        return { text: "Withdrawn", color: "bg-gray-100 text-gray-700" };
      default:
        return { text: "Pending", color: "bg-gray-100 text-gray-700" };
    }
  };

  const getUltimatumPeriod = (frequency: number) => {
    switch (frequency) {
      case 0: // Daily
      case 1: // Weekly
        return "7 days";
      case 2: // Monthly
        return "14 days";
      default:
        return "7 days";
    }
  };

  const getMinMembersToStart = (maxMembers: number) => {
    return Math.ceil(maxMembers * 0.6); // 60% threshold
  };

  const calculateCollateral = (contribution: string, maxMembers: number) => {
    const contributionNum = parseFloat(contribution);
    const totalCommitment = contributionNum * maxMembers;
    const lateBuffer = totalCommitment * 0.01; // 1% buffer
    return totalCommitment + lateBuffer;
  };

  const circleState = getCircleState(circle.status || "created");

  // Calculate deductions from late payments/forfeitures
  const deductions =
    (Number(circle.forfeitedAmount || 0n) +
      Number(circle.forfeitedContributionPortion || 0n)) /
    1e18;

  // Collateral Locked: Based on maxMembers (what was originally proposed and locked)
  const maxMembers = Number(
    circle.rawCircle?.maxMembers || circle.totalPositions,
  );
  // Show 0 for dead circles (hasWithdrawn) or completed circles (status === 'completed')
  const collateralLocked =
    circle.hasWithdrawn || circle.status === "completed"
      ? 0
      : Math.max(
          0,
          calculateCollateral(circle.contribution, maxMembers) - deductions,
        );

  // Collateral Required: Based on currentMembers (what's actually needed for the circle)
  const currentMembers = Number(
    circle.rawCircle?.currentMembers || circle.totalPositions,
  );
  // Show 0 for dead circles (hasWithdrawn) or completed circles (status === 'completed')
  const collateralRequired =
    circle.hasWithdrawn || circle.status === "completed"
      ? 0
      : calculateCollateral(circle.contribution, currentMembers);

  const minMembersToStart = getMinMembersToStart(maxMembers);
  const ultimatumPeriod = getUltimatumPeriod(circle.frequency);

  // Determine circle type (public/private)
  const currentVisibility =
    localVisibility ?? (circle.rawCircle?.visibility as 0 | 1);
  const circleType = currentVisibility === 0 ? "private" : "public";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
      <div
        className="rounded-2xl sm:rounded-3xl max-w-4xl w-full shadow-2xl my-4 sm:my-8 flex flex-col max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-4rem)]"
        style={{ backgroundColor: colors.surface }}
      >
        {/* Header */}
        <div
          className="p-3 sm:p-6 border-b shrink-0"
          style={{ borderColor: colors.border }}
        >
          <div className="flex justify-between items-start sm:items-center gap-2 mb-4">
            <div className="flex items-start sm:items-center gap-2 sm:gap-3 min-w-0">
              <div
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl shrink-0 flex items-center justify-center"
                style={{ backgroundColor: colors.primary }}
              >
                <Users className="text-white w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <h2
                  className="text-xl sm:text-2xl font-bold truncate"
                  style={{ color: colors.text }}
                >
                  {circle.name}
                </h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {circleType === "private" ? (
                    <Lock size={14} style={{ color: colors.secondary }} />
                  ) : (
                    <Globe size={14} style={{ color: colors.primary }} />
                  )}
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      circleType === "public"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-purple-100 text-purple-700"
                    }`}
                  >
                    {circleType === "public" ? "Public" : "Private"}
                  </span>

                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${circleState.color}`}
                  >
                    {circleState.text}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowCircleDetails(false)}
              className="p-2 rounded-xl transition hover:opacity-80"
              style={{ color: colors.text }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 sm:gap-2 overflow-x-auto pb-2 -mx-2 px-2">
            {["overview", "rules", "members", "payouts"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === tab ? "text-white" : "hover:bg-indigo-400"
                }`}
                style={
                  activeTab === tab
                    ? {
                        backgroundColor: colors.primary,
                      }
                    : { color: colors.text }
                }
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-3 sm:p-6">
          {activeTab === "overview" && (
            <CircleOverviewTab
              circle={circle}
              colors={colors}
              collateralLocked={collateralLocked}
              collateralRequired={collateralRequired}
              minMembersToStart={minMembersToStart}
              ultimatumPeriod={ultimatumPeriod}
              projectName={
                circle.rawCircle?.token
                  ? vaultProjects[circle.rawCircle.token.toLowerCase()]
                  : undefined
              }
            />
          )}

          {activeTab === "rules" && (
            <CircleRulesTab
              circle={circle}
              colors={colors}
              minMembersToStart={minMembersToStart}
              ultimatumPeriod={ultimatumPeriod}
            />
          )}

          {activeTab === "members" && (
            <CircleMembersTab circle={circle} colors={colors} />
          )}
          {activeTab === "payouts" && (
            <CirclePayoutHistoryTab circle={circle} colors={colors} />
          )}
        </div>

        {/* Action Buttons */}
        {(((circle.status as string) !== "completed" &&
          (circle.status as string) !== "dead") ||
          (circle.status === "dead" &&
            isMember &&
            circle.rawCircle?.state === 5 &&
            !circle.hasWithdrawn)) && (
          <div
            className="p-4 sm:p-6 border-t shrink-0 flex gap-3 flex-wrap"
            style={{ borderColor: colors.border }}
          >
            {isCreator &&
              (circle.status as string) !== "completed" &&
              (circle.status as string) !== "dead" && (
                <button
                  onClick={handleVisibilityButtonClick}
                  disabled={isUpdatingVisibility}
                  className="px-4 rounded-xl font-semibold border flex-1 py-1.5 sm:py-2 text-xs sm:text-sm transition flex items-center justify-center gap-1 sm:gap-2"
                  style={{
                    borderColor: colors.primary,
                    color: colors.primary,
                    opacity: isUpdatingVisibility ? 0.6 : 1,
                  }}
                >
                  {isUpdatingVisibility
                    ? "Updating..."
                    : `Make ${circleType === "public" ? "Private" : "Public"}`}
                </button>
              )}
            {(circle.status as string) !== "completed" &&
              (circle.status as string) !== "dead" && (
                <button
                  onClick={() => {
                    setShowCircleDetails(false);
                    if (onJoinCircle) onJoinCircle(circle);
                  }}
                  className="flex-1 py-1.5 sm:py-2 rounded-lg font-medium text-xs sm:text-sm transition flex items-center justify-center gap-1 sm:gap-2"
                  style={{
                    backgroundColor: colors.accentBg,
                    color: colors.text,
                  }}
                >
                  <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>Chat</span>
                </button>
              )}
            <CircleActions
              circle={circle}
              colors={colors}
              onInitiateVoting={onInitiateVoting}
              onCastVote={onCastVote}
              onExecuteVote={onExecuteVote}
              onWithdrawCollateral={onWithdrawCollateral}
              onContribute={onContribute}
              onForfeitMember={onForfeitMember}
              getWithdrawalInfo={getWithdrawalInfo}
              getLateMembersForCircle={getLateMembersForCircle}
            />
          </div>
        )}
      </div>

      {/* Visibility Confirmation Modal */}
      {showConfirmModal && (
        <VisibilityConfirmModal
          currentVisibility={circleType}
          onConfirm={handleConfirmVisibilityUpdate}
          onCancel={handleCancelVisibilityUpdate}
          colors={colors}
        />
      )}
    </div>
  );
};

export default CircleDetailsModal;
