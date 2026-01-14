import React from "react";
import { Eye, MessageCircle, TrendingUp, Loader2 } from "lucide-react";
import { useActiveAccount } from "thirdweb/react";
import { ActiveCircle } from "../interfaces/interfaces";
import CircleActions from "./CircleActions";
import CountdownTimer from "./CountdownTimer";
import { useYieldAPY } from "../hooks/useYieldAPY";

interface ActiveCircleCardProps {
  circle: ActiveCircle;
  colors: any;
  onViewDetails: (circle: ActiveCircle) => void;
  onChat: (circle: ActiveCircle) => void;
  onInitiateVoting: (circleId: bigint) => Promise<any>;
  onCastVote: (circleId: bigint, choice: 1 | 2) => Promise<any>;
  onExecuteVote: (circleId: bigint) => Promise<any>;
  onWithdrawCollateral: (circleId: bigint) => Promise<any>;
  onContribute: (circleId: bigint, amount: bigint) => Promise<any>;
  onForfeitMember: (circleId: bigint, lateMembers: string[]) => Promise<any>;
  getWithdrawalInfo?: (circleId: bigint, userAddress?: string) => any;
  getLateMembersForCircle: (circleId: bigint) => string[];
  onInviteMembers?: () => void;
  projectName?: string;
}

const ActiveCircleCard: React.FC<ActiveCircleCardProps> = ({
  circle,
  colors,
  onViewDetails,
  onChat,
  onInitiateVoting,
  onCastVote,
  onExecuteVote,
  onWithdrawCollateral,
  onContribute,
  onForfeitMember,
  getWithdrawalInfo,
  getLateMembersForCircle,
  onInviteMembers,
  projectName,
}) => {
  const account = useActiveAccount();
  const hasContributed = circle.hasContributed;

  // Fetch live APY for yield-enabled circles
  const { apy, isLoading: isLoadingAPY } = useYieldAPY(
    circle.isYieldEnabled ? projectName : undefined
  );
  const [now, setNow] = React.useState(Math.floor(Date.now() / 1000));

  React.useEffect(() => {
    const timer = setInterval(() => {
      setNow(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const isRecipient = circle.currentPosition === Number(circle.currentRound);
  const userPayout = circle.payouts?.find(
    (p: any) =>
      p.user?.id?.toLowerCase() === account?.address?.toLowerCase() &&
      Number(p.round) === Number(circle.currentRound)
  );
  const payoutPending = isRecipient && !userPayout;

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
          <div className="flex items-center gap-2 mb-1">
            <h4
              className="font-semibold text-sm sm:text-base truncate"
              style={{ color: colors.text }}
            >
              {circle.name}
            </h4>
            {circle.isYieldEnabled && (
              <div
                className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold w-fit"
                style={{
                  backgroundColor: `${colors.primary}15`,
                  color: colors.primary,
                  border: `1px solid ${colors.primary}30`,
                }}
              >
                <TrendingUp size={8} />
                {isLoadingAPY ? (
                  <Loader2 size={8} className="animate-spin" />
                ) : apy > 0 ? (
                  `${apy.toFixed(1)}% APY`
                ) : (
                  `${(Number(circle.yieldAPY || 0) / 100).toFixed(1)}% APY`
                )}
              </div>
            )}
          </div>
          {circle.status === "active" ||
          circle.status === "completed" ||
          circle.status === "voting" ? (
            <p
              className="text-xs sm:text-sm"
              style={{ color: colors.textLight }}
            >
              Position #{circle.currentPosition} of {circle.totalPositions}
            </p>
          ) : circle.status === "dead" ? (
            <p
              className="text-xs sm:text-sm"
              style={{ color: colors.textLight }}
            >
              Circle Dead
            </p>
          ) : (
            <p
              className="text-xs sm:text-sm"
              style={{ color: colors.textLight }}
            >
              Position Pending
            </p>
          )}
        </div>
        <span
          className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold whitespace-nowrap ${
            circle.status === "active"
              ? "bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300"
              : circle.status === "dead"
              ? "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300"
              : circle.status === "completed"
              ? "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
              : "bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300"
          }`}
        >
          {circle.status === "created"
            ? "Waiting for Members"
            : circle.status.charAt(0).toUpperCase() + circle.status.slice(1)}
        </span>
      </div>

      {/* Ultimatum Timer - For CREATED state (subtle indicator) */}
      {circle.status === "created" &&
        circle.rawCircle &&
        (() => {
          const createdAt = Number(circle.rawCircle.createdAt);
          const frequency = circle.rawCircle.frequency;
          const ultimatumPeriod = frequency <= 1 ? 604800 : 1209600; // 7 days or 14 days
          const ultimatumDeadline = BigInt(createdAt + ultimatumPeriod);
          const ultimatumPassed = now > createdAt + ultimatumPeriod;

          if (ultimatumPassed) return null; // Don't show if already passed

          return (
            <div
              className="mb-2 p-2 rounded-lg border-l-2"
              style={{
                backgroundColor: colors.accentBg,
                borderLeftColor: colors.textLight,
                opacity: 0.7,
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <div
                  className="text-[10px] sm:text-xs opacity-70"
                  style={{ color: colors.textLight }}
                >
                  Voting available in
                </div>
                <div style={{ color: colors.text }}>
                  <CountdownTimer
                    deadline={ultimatumDeadline}
                    colors={colors}
                  />
                </div>
              </div>
            </div>
          );
        })()}

      {/* Voting Timer - For VOTING state */}
      {circle.status === "voting" &&
        circle.votingEvents &&
        circle.votingEvents.length > 0 &&
        (() => {
          const latestVoting = circle.votingEvents[0];
          const votingEndAt = BigInt(latestVoting.votingEndAt);
          const votingEnded = now > Number(latestVoting.votingEndAt);

          // Check if user has voted
          const userVote = circle.votes?.find(
            (v: any) =>
              v.voter.id.toLowerCase() === account?.address?.toLowerCase()
          );
          const hasVoted = !!userVote;

          return (
            <div
              className="mb-3 p-2 sm:p-3 rounded-lg border"
              style={{
                backgroundColor: colors.accentBg,
                borderColor: colors.border,
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div
                    className="text-[10px] sm:text-xs uppercase tracking-wide font-semibold mb-0.5"
                    style={{ color: colors.textLight }}
                  >
                    {votingEnded ? "Voting Ended" : "Voting Ends In"}
                  </div>
                  {hasVoted && (
                    <div className="text-[10px] font-semibold text-green-600 flex items-center gap-1">
                      <span>✓</span>
                      <span>
                        You voted:{" "}
                        {userVote.choice === 1 ? "Start" : "Withdraw"}
                      </span>
                    </div>
                  )}
                </div>
                <div style={{ color: colors.text }}>
                  {votingEnded ? (
                    <div className="text-xs sm:text-sm font-semibold text-orange-500">
                      Execute Vote
                    </div>
                  ) : (
                    <CountdownTimer deadline={votingEndAt} colors={colors} />
                  )}
                </div>
              </div>
            </div>
          );
        })()}

      {/* Round and Contribution Deadline - For Active Circles */}
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
              {/* Show payout status if current user has ever received a payout */}
              {(() => {
                if (!account?.address) return null;

                // Only show "Payout Received" if current user got the payout
                return userPayout ? (
                  <div className="mt-1 text-[10px] sm:text-xs font-semibold text-green-600 flex items-center gap-1">
                    <span>✓</span>
                    <span>Payout Received</span>
                  </div>
                ) : null;
              })()}
            </div>
            {!hasContributed || payoutPending ? (
              <div className="text-right">
                <div
                  className="text-[10px] sm:text-xs uppercase tracking-wide font-semibold mb-0.5"
                  style={{ color: colors.textLight }}
                >
                  {now > Number(circle.contributionDeadline)
                    ? "Forfeit Available"
                    : hasContributed && isRecipient
                    ? "Time until Forfeit"
                    : "Contribution Deadline"}
                </div>
                <div style={{ color: colors.text }}>
                  <CountdownTimer
                    deadline={circle.contributionDeadline}
                    colors={colors}
                    showLateTime={now > Number(circle.contributionDeadline)}
                  />
                </div>
                {hasContributed && isRecipient && (
                  <div className="mt-1 text-[10px] font-semibold text-blue-600 flex items-center justify-end gap-1">
                    <span>✓</span>
                    <span>Contributed</span>
                  </div>
                )}
              </div>
            ) : circle.isForfeitedThisRound ? (
              <div className="text-right">
                <div className="text-[10px] sm:text-xs uppercase tracking-wide font-semibold mb-0.5 text-orange-500">
                  Covered from Collateral
                </div>
                <div className="text-[10px] sm:text-xs font-medium text-orange-500 italic">
                  Late payment deduction
                </div>
              </div>
            ) : (
              <div className="text-right">
                <div
                  className="text-[10px] sm:text-xs uppercase tracking-wide font-semibold mb-0.5"
                  style={{ color: colors.textLight }}
                >
                  Status
                </div>
                <div className="mt-1 text-[10px] sm:text-xs font-semibold text-blue-600 flex items-center justify-end gap-1">
                  <span>✓</span>
                  <span>Contribution Paid</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {circle.status !== "dead" && (
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
      )}

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
          Collateralized
        </span>
        {(circle.forfeitCount || 0) > 0 && (
          <span
            className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full whitespace-nowrap border"
            style={{
              backgroundColor: "#FFF7ED",
              color: "#C2410C",
              borderColor: "#FFEDD5",
            }}
          >
            {circle.forfeitCount} Forfeit Record
            {circle.forfeitCount !== 1 ? "s" : ""}
          </span>
        )}
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
          onInitiateVoting={onInitiateVoting}
          onCastVote={onCastVote}
          onExecuteVote={onExecuteVote}
          onWithdrawCollateral={onWithdrawCollateral}
          onContribute={onContribute}
          onForfeitMember={onForfeitMember}
          getWithdrawalInfo={getWithdrawalInfo}
          getLateMembersForCircle={getLateMembersForCircle}
          onInviteMembers={onInviteMembers}
        />
      </div>
    </div>
  );
};

export default ActiveCircleCard;
