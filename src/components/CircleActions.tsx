import React, { useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import {
  Vote,
  AlertTriangle,
  DollarSign,
  UserX,
  CheckCircle,
  Share2,
  Check,
  UserPlus,
} from "lucide-react";
import { ActiveCircle } from "../interfaces/interfaces";
import { toast } from "sonner";
import VoteModal from "../modals/VoteModal";
import WithdrawCollateralModal from "../modals/WithdrawCollateralModal";

interface CircleActionsProps {
  circle: ActiveCircle;
  colors: any;
  onInitiateVoting: (circleId: bigint) => Promise<any>;
  onCastVote: (circleId: bigint, choice: 1 | 2) => Promise<any>;
  onExecuteVote: (circleId: bigint) => Promise<any>;
  onWithdrawCollateral: (circleId: bigint) => Promise<any>;
  onContribute: (circleId: bigint, amount: bigint) => Promise<any>;
  onForfeitMember: (circleId: bigint, lateMembers: string[]) => Promise<any>;
  getLateMembersForCircle: (circleId: bigint) => string[];
  getWithdrawalInfo?: (circleId: bigint, userAddress?: string) => any;
  onInviteMembers?: () => void;
}

const CircleActions: React.FC<CircleActionsProps> = ({
  circle,
  colors,
  onInitiateVoting,
  onCastVote,
  onExecuteVote,
  onWithdrawCollateral,
  onContribute,
  onForfeitMember,
  getLateMembersForCircle,
  getWithdrawalInfo,
  onInviteMembers,
}) => {
  const account = useActiveAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isVoteModalOpen, setIsVoteModalOpen] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  // Get withdrawal info if function is available
  const withdrawalInfo = getWithdrawalInfo
    ? getWithdrawalInfo(circle.rawCircle.circleId, account?.address)
    : (circle as any); // Fallback to circle data if not provided (matching previous logic)

  if (!account || !circle.rawCircle) return null;

  const {
    circleId,
    creator,
    currentMembers,
    maxMembers,
    createdAt,
    frequency,
    contributionAmount,
    state,
    visibility,
  } = circle.rawCircle;

  const isCreator =
    creator?.id?.toLowerCase() === account.address.toLowerCase();

  // We determine membership based on whether the subgraph has assigned the user a position (> 0).
  const isMember = circle.currentPosition > 0;

  // Time calculations
  const now = Math.floor(Date.now() / 1000);
  const createdTime = Number(createdAt);

  // Ultimatum Period
  // Daily/Weekly: 7 days (604800s) | Monthly: 14 days (1209600s)
  const ultimatumDuration = frequency <= 1 ? 604800 : 1209600;
  const ultimatumPassed = now > createdTime + ultimatumDuration;

  // Grace Period
  // Daily: 12 hours (43200s) | Others: 48 hours (172800s)
  // We use circle.contributionDeadline (including grace period from subgraph) to determine if actions like 'Forfeit' are now accessible.

  // Handler for withdrawal confirmation
  const handleWithdrawConfirm = async () => {
    try {
      await handleAction(
        () => onWithdrawCollateral(circle.rawCircle.circleId),
        "Withdraw collateral",
      );
      setShowWithdrawModal(false);
    } catch (error) {
      // Error already handled by handleAction
    }
  };

  const handleAction = async (
    action: () => Promise<any>,
    actionName: string,
  ) => {
    try {
      setIsLoading(true);
      await action();
      toast.success(`${actionName} successful!`);
    } catch (error: any) {
      toast.error(error?.message || `${actionName} failed`);
    } finally {
      setIsLoading(false);
    }
  };

  // Share/Invite functionality
  const handleShareInvite = async () => {
    const inviteUrl = `${window.location.origin}/circles/join/${circleId}`;

    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {}
  };

  // Helper for premium withdraw button design
  const renderWithdrawButton = () => (
    <button
      onClick={() => setShowWithdrawModal(true)}
      disabled={isLoading}
      className="flex-1 py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 text-white shadow-sm hover:shadow-orange-100 dark:hover:shadow-none hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 group bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none"
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span className="whitespace-nowrap">Withdrawing...</span>
        </span>
      ) : (
        <>
          <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform shrink-0" />
          <span className="whitespace-nowrap">
            <span className="hidden sm:inline">Withdraw Collateral</span>
            <span className="sm:hidden">Withdraw</span>
          </span>
          {withdrawalInfo?.isCreator && withdrawalInfo.creatorDeadFee > 0n && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-black/10 backdrop-blur-sm hidden md:inline-block">
              Fee: ${(Number(withdrawalInfo.creatorDeadFee) / 1e18).toFixed(2)}
            </span>
          )}
        </>
      )}
    </button>
  );

  const renderInviteShareButtons = () => {
    const circleFull = Number(currentMembers) >= Number(maxMembers);
    if (circleFull) return null;

    // For Private Circles (visibility === 0): Only creator can Invite and Share
    if (visibility === 0) {
      if (isCreator && onInviteMembers) {
        return (
          <div className="flex gap-2 flex-1">
            <button
              onClick={onInviteMembers}
              className="flex-1 px-2.5 py-1.5 sm:py-2 rounded-lg font-semibold text-[10px] sm:text-sm transition text-white hover:shadow-md flex items-center justify-center gap-1 sm:gap-2"
              style={{ background: colors.primary }}
            >
              <UserPlus className="sm:w-4 sm:h-4 w-3 h-3" />
              <span>Invite</span>
            </button>
            <button
              onClick={handleShareInvite}
              disabled={copied}
              className="flex-1 px-2.5 py-1.5 sm:py-2 rounded-lg font-semibold text-[10px] sm:text-sm transition text-white hover:shadow-md flex items-center justify-center gap-1 sm:gap-2"
              style={{ background: copied ? colors.secondary : colors.primary }}
            >
              {copied ? (
                <>
                  <Check className="sm:w-4 sm:h-4 w-3 h-3" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="sm:w-4 sm:h-4 w-3 h-3" />
                  <span>Share</span>
                </>
              )}
            </button>
          </div>
        );
      }
      return null;
    }

    // For Public Circles (visibility === 1): Both creator and members can Share only
    if (visibility === 1 && (isCreator || isMember)) {
      return (
        <button
          onClick={handleShareInvite}
          disabled={copied}
          className="flex-1 py-1.5 sm:py-2 rounded-lg font-semibold text-[10px] sm:text-sm transition text-white hover:shadow-md flex items-center justify-center gap-1 sm:gap-2"
          style={{ background: copied ? colors.secondary : colors.primary }}
        >
          {copied ? (
            <>
              <Check className="sm:w-4 sm:h-4 w-3 h-3" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Share2 className="sm:w-4 sm:h-4 w-3 h-3" />
              <span>Share</span>
            </>
          )}
        </button>
      );
    }
    return null;
  };

  const renderButtons = () => {
    // State: COMPLETED (4) or DEAD (5)
    if (state === 4 || state === 5) {
      if (
        state === 5 &&
        isMember &&
        (withdrawalInfo?.canWithdraw ||
          withdrawalInfo?.canWithdrawCollateral) &&
        !circle.hasWithdrawn
      ) {
        return renderWithdrawButton();
      }
      return null;
    }

    // State: CREATED (1)
    if (state === 1) {
      // Logic handles phase-specific actions: Voting status, Vote Execution, or Ultimatum Expiry.
      // If no phase-specific action is currently valid, it falls back to Invite/Share buttons.
      const latestVotingEvt = circle.votingEvents?.[0];
      const votingHasEnded =
        latestVotingEvt && now > Number(latestVotingEvt.votingEndAt);
      const votingIsActive =
        latestVotingEvt && now <= Number(latestVotingEvt.votingEndAt);

      const latestVoteResult = circle.voteResults?.[0];
      const voteHasBeenExecuted = !!latestVoteResult;
      const withdrawWonVote = latestVoteResult?.withdrawWon === true;

      // 1. Voting phase ended but not executed
      if (votingHasEnded && !voteHasBeenExecuted) {
        return (
          <button
            onClick={() =>
              handleAction(() => onExecuteVote(circleId), "Execute vote")
            }
            disabled={isLoading}
            className="w-full py-2 rounded-lg font-semibold text-xs sm:text-sm transition text-white hover:shadow-md flex items-center justify-center gap-1 sm:gap-2"
            style={{ background: colors.primary }}
          >
            {isLoading ? "Processing..." : "Execute Vote Results"}
          </button>
        );
      }

      // 2. Voting phase active
      if (votingIsActive) {
        const userVote = circle.votes?.find(
          (v: any) =>
            v.voter.id.toLowerCase() === account.address.toLowerCase(),
        );
        if (!!userVote) return renderInviteShareButtons();

        return (
          <button
            onClick={() => setIsVoteModalOpen(true)}
            disabled={isLoading}
            className="flex-1 py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm transition text-white hover:shadow-md flex items-center justify-center gap-1 sm:gap-2"
            style={{ background: colors.primary }}
          >
            <Vote className="w-4 h-4" />
            <span>Vote</span>
          </button>
        );
      }

      // 3. Vote executed and withdraw won
      if (voteHasBeenExecuted && withdrawWonVote && isMember) {
        return renderWithdrawButton();
      }

      // 4. Threshold & Ultimatum logic
      const thresholdReached =
        Number(currentMembers) >= Number(maxMembers) * 0.6;
      if (ultimatumPassed) {
        if (thresholdReached) {
          if (isMember) {
            return (
              <button
                onClick={() =>
                  handleAction(
                    () => onInitiateVoting(circleId),
                    "Initiate voting",
                  )
                }
                disabled={isLoading}
                className="flex-1 py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm transition text-white hover:shadow-md flex items-center justify-center gap-1 sm:gap-2 bg-yellow-500 hover:bg-yellow-600"
              >
                {isLoading ? (
                  "Processing..."
                ) : (
                  <>
                    <Vote className="w-4 h-4" />
                    <span>Initiate Vote</span>
                  </>
                )}
              </button>
            );
          }
        } else if (
          isMember &&
          (withdrawalInfo?.canWithdraw || withdrawalInfo?.canWithdrawCollateral)
        ) {
          return renderWithdrawButton();
        }
      }

      return renderInviteShareButtons();
    }

    // State: VOTING (2)
    if (state === 2) {
      const latestVotingEvent = circle.votingEvents?.[0];
      const votingEnded = latestVotingEvent
        ? now > Number(latestVotingEvent.votingEndAt)
        : false;

      if (votingEnded) {
        return (
          <button
            onClick={() =>
              handleAction(() => onExecuteVote(circleId), "Execute vote")
            }
            disabled={isLoading}
            className="w-full py-2 rounded-lg font-semibold text-xs sm:text-sm transition text-white hover:shadow-md flex items-center justify-center gap-1 sm:gap-2"
            style={{ background: colors.primary }}
          >
            {isLoading ? "Processing..." : "Execute Vote Results"}
          </button>
        );
      }

      const userVote = circle.votes?.find(
        (v: any) => v.voter.id.toLowerCase() === account.address.toLowerCase(),
      );
      if (!!userVote) return renderInviteShareButtons();

      return (
        <button
          onClick={() => setIsVoteModalOpen(true)}
          disabled={isLoading}
          className="flex-1 py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm transition text-white hover:shadow-md flex items-center justify-center gap-1 sm:gap-2"
          style={{ background: colors.primary }}
        >
          <Vote className="w-4 h-4" />
          <span>Vote</span>
        </button>
      );
    }

    // State: ACTIVE (3)
    if (state === 3) {
      const hasContributed = circle.hasContributed;
      const currentRound = Number(circle.rawCircle.currentRound || 1);
      const deadlineElapsed = now > Number(circle.contributionDeadline);
      const isRecipient = circle.currentPosition === currentRound;
      const hasReceivedPayout =
        circle.payouts?.some(
          (payout: any) => Number(payout.round) === currentRound,
        ) || false;

      if (isRecipient) {
        if (deadlineElapsed && !hasReceivedPayout) {
          return (
            <button
              onClick={() => {
                const lateMembers = getLateMembersForCircle(circleId);
                handleAction(
                  () => onForfeitMember(circleId, lateMembers),
                  "Forfeit member",
                );
              }}
              disabled={isLoading}
              className="flex-1 py-2 px-2 rounded-lg font-medium text-xs sm:text-sm text-center border flex items-center justify-center gap-1 hover:bg-red-50 dark:hover:bg-red-950 text-red-500 border-red-200 dark:border-red-800"
            >
              {isLoading ? (
                "Processing..."
              ) : (
                <>
                  <UserX className="w-4 h-4" />
                  <span>Forfeit</span>
                </>
              )}
            </button>
          );
        }

        if (!hasContributed) {
          return (
            <button
              onClick={() =>
                handleAction(
                  () => onContribute(circleId, contributionAmount),
                  "Contribution",
                )
              }
              disabled={isLoading}
              className="flex-1 py-2 rounded-lg font-semibold text-xs sm:text-sm transition text-white hover:shadow-md flex items-center justify-center gap-1 sm:gap-2"
              style={{ background: colors.primary }}
            >
              {isLoading ? (
                "Processing..."
              ) : (
                <>
                  <DollarSign className="w-4 h-4" />
                  <span>Contribute</span>
                </>
              )}
            </button>
          );
        }

        return (
          <div
            className="flex-1 py-2 px-2 rounded-lg font-medium text-xs sm:text-sm text-center border flex items-center justify-center gap-1"
            style={{ borderColor: colors.border, color: colors.textLight }}
          >
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>
              {hasReceivedPayout ? "Payout Received" : "Awaiting Payout"}
            </span>
          </div>
        );
      }

      const canForfeit =
        deadlineElapsed && hasContributed && !hasReceivedPayout;

      if (!hasContributed) {
        return (
          <button
            onClick={() =>
              handleAction(
                () => onContribute(circleId, contributionAmount),
                "Contribution",
              )
            }
            disabled={isLoading}
            className="flex-1 py-2 rounded-lg font-semibold text-xs sm:text-sm transition text-white hover:shadow-md flex items-center justify-center gap-1 sm:gap-2"
            style={{ background: colors.primary }}
          >
            {isLoading ? (
              "Processing..."
            ) : (
              <>
                <DollarSign className="w-4 h-4" />
                <span>Contribute</span>
              </>
            )}
          </button>
        );
      } else if (canForfeit) {
        return (
          <button
            onClick={() => {
              const lateMembers = getLateMembersForCircle(circleId);
              handleAction(
                () => onForfeitMember(circleId, lateMembers),
                "Forfeit member",
              );
            }}
            disabled={isLoading}
            className="flex-1 py-2 px-2 rounded-lg font-medium text-xs sm:text-sm text-center border flex items-center justify-center gap-1 hover:bg-red-50 dark:hover:bg-red-950 text-red-500 border-red-200 dark:border-red-800"
          >
            {isLoading ? (
              "Processing..."
            ) : (
              <>
                <UserX className="w-4 h-4" />
                <span>Forfeit</span>
              </>
            )}
          </button>
        );
      }

      return (
        <div
          className="flex-1 py-2 px-2 rounded-lg font-medium text-xs sm:text-sm text-center border flex items-center justify-center gap-1"
          style={{ borderColor: colors.border, color: colors.textLight }}
        >
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span>Contributed</span>
        </div>
      );
    }

    return null;
  };

  return (
    <>
      <div className="flex gap-2 flex-1">{renderButtons()}</div>

      {isVoteModalOpen && (
        <VoteModal
          isOpen={isVoteModalOpen}
          onClose={() => setIsVoteModalOpen(false)}
          isLoading={isLoading}
          onVoteStart={async () => {
            await handleAction(() => onCastVote(circleId, 1), "Vote to start");
            setIsVoteModalOpen(false);
          }}
          onVoteWithdraw={async () => {
            await handleAction(
              () => onCastVote(circleId, 2),
              "Vote to withdraw",
            );
            setIsVoteModalOpen(false);
          }}
        />
      )}

      {showWithdrawModal && withdrawalInfo && (
        <WithdrawCollateralModal
          isOpen={showWithdrawModal}
          onClose={() => setShowWithdrawModal(false)}
          onConfirm={handleWithdrawConfirm}
          colors={colors}
          circleName={circle.name}
          collateralLocked={withdrawalInfo.collateralLocked || 0n}
          creatorDeadFee={withdrawalInfo.creatorDeadFee || 0n}
          netAmount={withdrawalInfo.netWithdrawalAmount || 0n}
          isCreator={withdrawalInfo.isCreator || false}
          withdrawalReason={
            withdrawalInfo.reason ||
            withdrawalInfo.withdrawalReason ||
            "vote_failed"
          }
          isLoading={isLoading}
        />
      )}
    </>
  );
};

export default CircleActions;
