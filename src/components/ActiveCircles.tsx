import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { useActiveAccount } from "thirdweb/react";
import { Users } from "lucide-react";
import CircleDetailsModal from "../modals/CircleDetailsModal";
import CircleChatModal from "../modals/CircleChatModal";
import InviteMembersModal from "../modals/InviteMembersModal";
import { ActiveCircle } from "../interfaces/interfaces";
import { ThirdwebClient } from "thirdweb";
import { useCircleSavings } from "../hooks/useCircleSavings";
import { transformCircles } from "../utils/circleTransformer";
import ActiveCircleCard from "./ActiveCircleCard";
import { CircleCardSkeleton, Skeleton } from "./Skeleton";

interface ActiveCirclesProps {
  colors: any;
  client: ThirdwebClient;
}

const ActiveCircles: React.FC<ActiveCirclesProps> = ({ colors, client }) => {
  const navigate = useNavigate();
  const account = useActiveAccount();
  const {
    circles,
    joinedCircles,
    votingEvents,
    votes,
    voteResults,
    positions,
    contributions,
    payouts,
    collateralWithdrawals,
    getWithdrawalInfo,
    getLateMembersForCircle,
    forfeitures,
    isLoading,
    startCircle,
    initiateVoting,
    castVote,
    executeVote,
    withdrawCollateral,
    contribute,
    forfeitMember,
    inviteMembers,
  } = useCircleSavings(client);

  const [showCircleDetails, setShowCircleDetails] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedCircle, setSelectedCircle] = useState<ActiveCircle | null>(
    null
  );

  // Transform circles data
  const activeCircles = useMemo(() => {
    return transformCircles(
      circles,
      joinedCircles,
      account?.address,
      votingEvents,
      votes,
      voteResults,
      positions,
      contributions,
      payouts,
      collateralWithdrawals,
      forfeitures
    );
  }, [
    circles,
    joinedCircles,
    account?.address,
    votingEvents,
    votes,
    voteResults,
    positions,
    contributions,
    payouts,
    collateralWithdrawals,
    forfeitures,
  ]);

  // Filter circles:
  // 1. Show all "active" circles
  // 2. Show "created", "pending", ,"voting" circles IF the user is the creator OR a member
  const filteredCircles = useMemo(() => {
    if (!account?.address) {
      // If not connected, only show active circles
      return activeCircles.filter((circle) => circle.status === "active");
    }

    const userAddressLower = account.address.toLowerCase();

    return activeCircles.filter((circle) => {
      // Always show active circles
      if (circle.status === "active") return true;

      // Check if user is creator
      const isCreator =
        circle.rawCircle?.creator?.id?.toLowerCase() === userAddressLower;

      // Check if user is a member (currentPosition > 0 means they are in the members list)
      const isMember = circle.currentPosition > 0;

      // Show non-active circles if user is involved
      if (
        ["created", "pending", "voting"].includes(circle.status) &&
        (isCreator || isMember)
      ) {
        return true;
      }

      return false;
    });
  }, [activeCircles, account?.address]);

  // Calculate total committed balance
  const totalBalance = useMemo(() => {
    return filteredCircles
      .reduce((sum, circle) => {
        // Use the actual collateral amount that the user deposited
        // This is contribution * maxMembers * 1.01 (includes 1% buffer)
        const collateralAmount = circle.rawCircle?.collateralAmount
          ? Number(circle.rawCircle.collateralAmount) / 1e18
          : 0;

        // Add the total amount contributed by the user to this circle
        const contributedAmount = circle.userTotalContributed
          ? Number(circle.userTotalContributed) / 1e18
          : 0;

        return sum + collateralAmount + contributedAmount;
      }, 0)
      .toFixed(2);
  }, [filteredCircles]);

  const handleViewDetails = (circle: ActiveCircle) => {
    setSelectedCircle(circle);
    setShowCircleDetails(true);
  };

  const handleChatClick = (circle: ActiveCircle) => {
    setSelectedCircle(circle);
    setShowChatModal(true);
  };

  const handleInviteClick = (circle: ActiveCircle) => {
    setSelectedCircle(circle);
    setShowInviteModal(true);
  };

  if (isLoading) {
    return (
      <div
        className="rounded-2xl p-4 sm:p-6 shadow-sm border space-y-4"
        style={{ backgroundColor: colors.surface, borderColor: colors.border }}
      >
        <div className="flex justify-between items-center mb-6">
          <div className="space-y-2">
            <Skeleton width="12rem" height="1.5rem" />
            <Skeleton width="8rem" height="1rem" />
          </div>
        </div>
        {[1, 2, 3].map((i) => (
          <CircleCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl p-4 sm:p-6 shadow-sm border"
      style={{ backgroundColor: colors.surface, borderColor: colors.border }}
    >
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 sm:mb-6">
        <div>
          <h3
            className="font-bold text-base sm:text-lg flex items-center gap-2"
            style={{ color: colors.text }}
          >
            <Users
              style={{ color: colors.primary }}
              className="w-4 h-4 sm:w-5 sm:h-5"
            />
            Active Savings Circles
          </h3>
          <div
            className="text-xs sm:text-sm mt-0.5"
            style={{ color: colors.textLight }}
          >
            Total Committed:{" "}
            <span className="font-semibold" style={{ color: colors.primary }}>
              ${totalBalance}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {filteredCircles.length === 0 ? (
          <div className="text-center py-8" style={{ color: colors.textLight }}>
            <p>No active circles found.</p>
          </div>
        ) : (
          filteredCircles
            .slice(0, 3)
            .map((circle) => (
              <ActiveCircleCard
                key={circle.id}
                circle={circle}
                colors={colors}
                onViewDetails={handleViewDetails}
                onChat={handleChatClick}
                onStartCircle={startCircle}
                onInitiateVoting={initiateVoting}
                onCastVote={castVote}
                onExecuteVote={executeVote}
                onWithdrawCollateral={withdrawCollateral}
                onContribute={contribute}
                onForfeitMember={forfeitMember}
                getWithdrawalInfo={getWithdrawalInfo}
                getLateMembersForCircle={getLateMembersForCircle}
                onInviteMembers={() => handleInviteClick(circle)}
              />
            ))
        )}

        <button
          onClick={() => navigate("/circles")}
          className="text-sm font-medium hover:opacity-80 transition-opacity whitespace-nowrap"
          style={{ color: colors.primary }}
        >
          View All
        </button>
      </div>

      {/* Modals */}
      {showCircleDetails && selectedCircle && (
        <CircleDetailsModal
          circle={selectedCircle}
          setShowCircleDetails={setShowCircleDetails}
          colors={colors}
          onJoinCircle={() => {
            setShowCircleDetails(false);
            setShowChatModal(true);
          }}
          onRequestInvite={() => {
            setShowCircleDetails(false);
          }}
          client={client}
          onStartCircle={startCircle}
          onInitiateVoting={initiateVoting}
          onCastVote={castVote}
          onExecuteVote={executeVote}
          onWithdrawCollateral={withdrawCollateral}
          onContribute={contribute}
          onForfeitMember={forfeitMember}
          getLateMembersForCircle={getLateMembersForCircle}
        />
      )}

      {showChatModal && selectedCircle && (
        <CircleChatModal
          circle={selectedCircle}
          currentUser={account?.address || "You"}
          onClose={() => setShowChatModal(false)}
          colors={colors}
        />
      )}

      {/* Invite Members Modal */}
      {showInviteModal && selectedCircle && (
        <InviteMembersModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          circleId={selectedCircle.rawCircle?.circleId || BigInt(0)}
          circleName={selectedCircle.name}
          colors={colors}
          onInvite={inviteMembers}
        />
      )}
    </div>
  );
};

export default ActiveCircles;
