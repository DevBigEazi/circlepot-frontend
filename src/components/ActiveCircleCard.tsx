import React from "react";
import { Eye, MessageCircle } from "lucide-react";
import { useActiveAccount } from "thirdweb/react";
import { ActiveCircle } from "../interfaces/interfaces";
import CircleActions from "./CircleActions";
import CountdownTimer from "./CountdownTimer";

interface ActiveCircleCardProps {
  circle: ActiveCircle;
  colors: any;
  onViewDetails: (circle: ActiveCircle) => void;
  onChat: (circle: ActiveCircle) => void;
  onStartCircle: (circleId: bigint) => Promise<any>;
  onInitiateVoting: (circleId: bigint) => Promise<any>;
  onCastVote: (circleId: bigint, choice: 1 | 2) => Promise<any>;
  onExecuteVote: (circleId: bigint) => Promise<any>;
  onWithdrawCollateral: (circleId: bigint) => Promise<any>;
  onContribute: (circleId: bigint, amount: bigint) => Promise<any>;
  onForfeitMember: (circleId: bigint) => Promise<any>;
  onInviteMembers?: () => void;
}

const ActiveCircleCard: React.FC<ActiveCircleCardProps> = ({
  circle,
  colors,
  onViewDetails,
  onChat,
  onStartCircle,
  onInitiateVoting,
  onCastVote,
  onExecuteVote,
  onWithdrawCollateral,
  onContribute,
  onForfeitMember,
  onInviteMembers,
}) => {
  const account = useActiveAccount();
  const hasContributed = circle.hasContributed;
  return (
    <div
      className="p-3 sm:p-4 rounded-xl border"
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.border,
      }}
    >
      {/* Circle Header */}
      <div className="flex justify-between items-start mb-2 sm:mb-3">
        <div className="min-w-0">
          <h4
            className="font-semibold text-sm sm:text-base truncate"
            style={{ color: colors.text }}
          >
            {circle.name}
          </h4>
          {circle.status === "active" ||
          circle.status === "completed" ||
          circle.status === "voting" ? (
            <p
              className="text-xs sm:text-sm"
              style={{ color: colors.textLight }}
            >
              Position #{circle.currentPosition} of {circle.totalPositions}
            </p>
          ) : (
            <p
              className="text-xs sm:text-sm"
              style={{ color: colors.textLight }}
            >
              {circle.currentPosition === 1
                ? `Position #${circle.currentPosition} of ${circle.totalPositions}`
                : "Position Pending"}
            </p>
          )}
        </div>
        <span
          className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold whitespace-nowrap ${
            circle.status === "active"
              ? "bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300"
              : "bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300"
          }`}
        >
          {circle.status === "created"
            ? "Waiting for Members"
            : circle.status.charAt(0).toUpperCase() + circle.status.slice(1)}
        </span>
      </div>

      {/* Round and Contribution Deadline - Only for Active Circles */}
      {circle.status === "active" && (
        <div
          className="mb-3 sm:mb-4 p-2 sm:p-3 rounded-lg border"
          style={{
            backgroundColor: colors.accentBg,
            borderColor: colors.border,
          }}
        >
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <div
                className="text-[10px] sm:text-xs uppercase tracking-wide font-semibold mb-0.5"
                style={{ color: colors.textLight }}
              >
                Current Round
              </div>
              <div
                className="text-lg sm:text-xl font-bold"
                style={{ color: colors.primary }}
              >
                Round {circle.currentRound.toString()}
              </div>
              {/* Show payout status ONLY if current user received payout in previous round */}
              {(() => {
                const currentRound = circle.currentRound;
                const previousRound =
                  currentRound > 1n ? currentRound - 1n : 0n;

                if (!account?.address || previousRound === 0n) return null;

                // Check if the CURRENT USER received the payout in the previous round
                // Convert both to numbers for comparison since subgraph might return strings
                const userPayout = circle.payouts?.find((p: any) => {
                  const payoutRound =
                    typeof p.round === "bigint"
                      ? p.round
                      : BigInt(p.round || 0);
                  const isMatchingRound = payoutRound === previousRound;
                  const isMatchingUser =
                    p.user?.id?.toLowerCase() === account.address.toLowerCase();

                  return isMatchingRound && isMatchingUser;
                });

                // Only show "Payout Received" if current user got the payout
                return userPayout ? (
                  <div className="mt-1 text-[10px] sm:text-xs font-semibold text-green-600 flex items-center gap-1">
                    <span>✓</span>
                    <span>Payout Received</span>
                  </div>
                ) : null;
              })()}
            </div>
            { !hasContributed ?
              (<div className="text-right">
                <div
                  className="text-[10px] sm:text-xs uppercase tracking-wide font-semibold mb-0.5"
                  style={{ color: colors.textLight }}
                >
                  Contribution Deadline
                </div>
                <div style={{ color: colors.text }}>
                  <CountdownTimer
                    deadline={circle.contributionDeadline}
                    colors={colors}
                  />
                </div>
              </div>) : (
                <div
                  className="text-[10px] sm:text-xs uppercase tracking-wide font-semibold mb-0.5"
                  style={{ color: colors.textLight }}
                >
                  Contribution Paid
                </div>
              )
            }
          </div>
        </div>
      )}

      {/* Circle Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
        <div>
          <div
            className="text-xl sm:text-2xl font-bold"
            style={{ color: colors.primary }}
          >
            ${circle.payoutAmount}
          </div>
          <div
            className="text-[10px] sm:text-xs"
            style={{ color: colors.textLight }}
          >
            Payout Amount
          </div>
        </div>
        <div>
          {/* Next Payout */}
          <div
            className="text-xs sm:text-sm font-semibold"
            style={{ color: colors.text }}
          >
            {circle.nextPayout}
          </div>
          <div
            className="text-[10px] sm:text-xs"
            style={{ color: colors.textLight }}
          >
            Est. Next Payout Date
          </div>
        </div>
      </div>

      {/* Member Info */}
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <span
          className="text-[10px] sm:text-xs"
          style={{ color: colors.textLight }}
        >
          {circle.rawCircle?.currentMembers.toString() || 0} of{" "}
          {circle.totalPositions} members
        </span>
        <span
          className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full whitespace-nowrap"
          style={{ backgroundColor: "#10B98115", color: "#10B981" }}
        >
          active
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => onViewDetails(circle)}
          className="flex-1 py-1.5 sm:py-2 rounded-lg font-medium text-xs sm:text-sm transition border hover:opacity-80 flex items-center justify-center gap-1 sm:gap-2"
          style={{ borderColor: colors.border, color: colors.text }}
        >
          <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>Details</span>
        </button>
        <button
          onClick={() => onChat(circle)}
          className="flex-1 py-1.5 sm:py-2 rounded-lg font-medium text-xs sm:text-sm transition flex items-center justify-center gap-1 sm:gap-2"
          style={{
            backgroundColor: colors.accentBg,
            color: colors.text,
          }}
        >
          <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>Chat</span>
        </button>
        <CircleActions
          circle={circle}
          colors={colors}
          onStartCircle={onStartCircle}
          onInitiateVoting={onInitiateVoting}
          onCastVote={onCastVote}
          onExecuteVote={onExecuteVote}
          onWithdrawCollateral={onWithdrawCollateral}
          onContribute={onContribute}
          onForfeitMember={onForfeitMember}
          onInviteMembers={onInviteMembers}
        />
      </div>
    </div>
  );
};

export default ActiveCircleCard;
