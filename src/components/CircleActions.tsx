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
  AlertCircle,
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
    : circle; // Fallback to circle data if not provided

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
  // We assume the user is a member if they are seeing this card in "Active Circles" or if we check the members list.
  // we should check if they are in the members list.
  const isMember = circle.currentPosition > 0;

  // Time calculations
  const now = Math.floor(Date.now() / 1000);
  const createdTime = Number(createdAt);

  // Ultimatum Period
  // Daily/Weekly: 7 days (604800s)
  // Monthly: 14 days (1209600s)
  const ultimatumDuration = frequency <= 1 ? 604800 : 1209600;
  const ultimatumPassed = now > createdTime + ultimatumDuration;

  // Grace Period
  // Daily: 12 hours (43200s)
  // Others: 48 hours (172800s)
  // We need the deadline of the current round to check grace period.
  // Ideally this info should be in the circle object, but we might need to estimate it or fetch it.
  // For now, we'll assume the button is enabled if the backend allows it (we can't easily check grace period on frontend without round deadline).
  // However, `forfeitMember` is only for the NEXT recipient.

  const handleAction = async (
    action: () => Promise<any>,
    actionName: string
  ) => {
    try {
      setIsLoading(true);
      await action();
      toast.custom(
        () => (
          <div
            className="rounded-2xl p-4 shadow-lg border-2 border-green-500 flex items-center gap-3 max-w-sm"
            style={{
              backgroundColor: "#dcfce7",
              animation: `slideIn 0.3s ease-out`,
            }}
          >
            <AlertCircle size={20} className="text-green-600 flex-shrink-0" />
            <span className="text-sm font-semibold text-green-600">
              {actionName} successful!
            </span>
          </div>
        ),
        {
          duration: 4000,
          position: "top-center",
        }
      );
    } catch (error: any) {
      toast.custom(
        () => (
          <div
            className="rounded-2xl p-4 shadow-lg border-2 border-red-500 flex items-center gap-3 max-w-sm"
            style={{
              backgroundColor: "#fee2e2",
              animation: `slideIn 0.3s ease-out`,
            }}
          >
            <AlertTriangle size={20} className="text-red-600 flex-shrink-0" />
            <span className="text-sm font-semibold text-red-600">
              {error?.message || `${actionName} failed`}
            </span>
          </div>
        ),
        {
          duration: 4000,
          position: "top-center",
        }
      );
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

  // Render buttons based on state
  // State: CREATED (1)
  if (state === 1) {
    const thresholdReached = Number(currentMembers) >= Number(maxMembers) * 0.6;

    // Logic should prioritize phase-specific actions (Voting/Ultimatum)
    // Initial and post-vote share buttons are handled by fall-through

    // Check if there is an active voting session that the subgraph state might have missed
    // or if we simply want to treat a certain condition as voting.
    const latestVotingEvt = circle.votingEvents?.[0];
    const votingHasEnded =
      latestVotingEvt && now > Number(latestVotingEvt.votingEndAt);
    const votingIsActive =
      latestVotingEvt && now <= Number(latestVotingEvt.votingEndAt);

    // Check if vote has been executed by looking for voteResults
    const latestVoteResult = circle.voteResults?.[0];
    const voteHasBeenExecuted =
      latestVoteResult &&
      latestVotingEvt &&
      latestVoteResult.circleId === latestVotingEvt.circleId;

    // Check if withdraw won the vote
    const withdrawWonVote = latestVoteResult?.withdrawWon === true;

    // If voting has ended but not executed, show Execute Vote button
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

    // If vote has been executed and withdraw won, show withdraw button immediately
    if (
      voteHasBeenExecuted &&
      withdrawWonVote &&
      isMember &&
      withdrawalInfo?.canWithdraw
    ) {
      return (
        <button
          onClick={() => setShowWithdrawModal(true)}
          disabled={isLoading}
          className="flex-1 py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm transition text-white hover:shadow-md flex items-center justify-center gap-1 sm:gap-2 bg-orange-500 hover:bg-orange-600"
        >
          {isLoading ? (
            "Withdrawing..."
          ) : (
            <>
              <AlertTriangle className="w-4 h-4" />
              <span>Withdraw Collateral</span>
              {withdrawalInfo.isCreator &&
                withdrawalInfo.creatorDeadFee > 0n && (
                  <span className="text-[10px] opacity-80">
                    (Fee: $
                    {(Number(withdrawalInfo.creatorDeadFee) / 1e18).toFixed(2)})
                  </span>
                )}
            </>
          )}
        </button>
      );
    }

    // If we are effectively in voting mode, Return the voting UI
    if (votingIsActive) {
      // Check if user has voted
      const userVote = circle.votes?.find(
        (v: any) => v.voter.id.toLowerCase() === account.address.toLowerCase()
      );
      const hasVoted = !!userVote;

      if (hasVoted) {
        return renderInviteShareButtons();
      }

      return (
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <button
            onClick={() => setIsVoteModalOpen(true)}
            disabled={isLoading}
            className="flex-1 py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm transition text-white hover:shadow-md flex items-center justify-center gap-1 sm:gap-2"
            style={{ background: colors.primary }}
          >
            <Vote className="w-4 h-4" />
            <span>Vote</span>
          </button>

          <VoteModal
            isOpen={isVoteModalOpen}
            onClose={() => setIsVoteModalOpen(false)}
            isLoading={isLoading}
            onVoteStart={async () => {
              await handleAction(
                () => onCastVote(circleId, 1),
                "Vote to start"
              );
              setIsVoteModalOpen(false);
            }}
            onVoteWithdraw={async () => {
              await handleAction(
                () => onCastVote(circleId, 2),
                "Vote to withdraw"
              );
              setIsVoteModalOpen(false);
            }}
          />
        </div>
      );
    }

    // Check ultimatum and threshold for voting initiation or withdrawal
    if (ultimatumPassed) {
      if (thresholdReached) {
        // Show "Initiate Vote" for all members (including creator)
        // The circle will auto-start when vote is executed if start wins
        if (isMember) {
          return (
            <button
              onClick={() =>
                handleAction(
                  () => onInitiateVoting(circleId),
                  "Initiate voting"
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
      } else {
        // Threshold NOT reached and Ultimatum PASSED -> Withdraw Collateral
        // Check if withdrawal is eligible using withdrawalInfo
        if (isMember && withdrawalInfo?.canWithdraw) {
          return (
            <button
              onClick={() => setShowWithdrawModal(true)}
              disabled={isLoading}
              className="flex-1 py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm transition text-white hover:shadow-md flex items-center justify-center gap-1 sm:gap-2 bg-orange-500 hover:bg-orange-600"
            >
              {isLoading ? (
                "Withdrawing..."
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  <span>Withdraw Collateral</span>
                  {withdrawalInfo.isCreator &&
                    withdrawalInfo.creatorDeadFee > 0n && (
                      <span className="text-[10px] opacity-80">
                        (Fee: $
                        {(Number(withdrawalInfo.creatorDeadFee) / 1e18).toFixed(
                          2
                        )}
                        )
                      </span>
                    )}
                </>
              )}
            </button>
          );
        }
      }
    }

    // For public circles or general members, show buttons if applicable
    const generalInviteButtons = renderInviteShareButtons();
    if (generalInviteButtons) {
      return generalInviteButtons;
    }

    return null;
  }

  // State: VOTING (2)
  if (state === 2) {
    // Check if user has voted
    const userVote = circle.votes?.find(
      (v: any) => v.voter.id.toLowerCase() === account.address.toLowerCase()
    );
    const hasVoted = !!userVote;

    // Check if voting period has passed
    // We use the latest voting event
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

    if (hasVoted) {
      return renderInviteShareButtons();
    }

    return (
      <div className="flex flex-col sm:flex-row gap-2 flex-1">
        <button
          onClick={() => setIsVoteModalOpen(true)}
          disabled={isLoading}
          className="flex-1 py-2 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm transition text-white hover:shadow-md flex items-center justify-center gap-1 sm:gap-2"
          style={{ background: colors.primary }}
        >
          <Vote className="w-4 h-4" />
          <span>Vote</span>
        </button>

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
              "Vote to withdraw"
            );
            setIsVoteModalOpen(false);
          }}
        />
      </div>
    );
  }

  // State: ACTIVE (3)
  if (state === 3) {
    const hasContributed = circle.hasContributed;
    const currentRound = Number(circle.rawCircle.currentRound || 1);

    const contributionDeadlineWithGrace = circle.contributionDeadline;
    const deadlineElapsed = now > Number(contributionDeadlineWithGrace);

    // Check if user has received payout for the current round
    const hasReceivedPayout =
      circle.payouts?.some(
        (payout: any) => Number(payout.round) === currentRound
      ) || false;

    // Show forfeit button only if:
    // 1. Contribution deadline (WITH grace period) has elapsed
    // 2. User has already contributed (to ensure they are an active player)
    // 3. User has NOT received payout for this round (if they were the recipient)
    const canForfeit = deadlineElapsed && hasContributed && !hasReceivedPayout;

    return (
      <div className="flex gap-2 flex-1">
        {!hasContributed ? (
          <button
            onClick={() =>
              handleAction(
                () => onContribute(circleId, contributionAmount),
                "Contribution"
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
        ) : canForfeit ? (
          <button
            onClick={() => {
              const lateMembers = getLateMembersForCircle(circleId);
              handleAction(
                () => onForfeitMember(circleId, lateMembers),
                "Forfeit member"
              );
            }}
            disabled={isLoading}
            className="flex-1 py-2 px-2 rounded-lg font-medium text-xs sm:text-sm text-center border flex items-center justify-center gap-1 hover:bg-red-50 dark:hover:bg-red-950 text-red-500 border-red-200 dark:border-red-800"
            title="Forfeit late members (Available after grace period if payout hasn't been distributed)"
          >
            {isLoading ? (
              "Processing..."
            ) : (
              <>
                <UserX className="w-4 h-4" />
                <span className="inline">Forfeit</span>
              </>
            )}
          </button>
        ) : (
          <div
            className="flex-1 py-2 px-2 rounded-lg font-medium text-xs sm:text-sm text-center border flex items-center justify-center gap-1"
            style={{ borderColor: colors.border, color: colors.textLight }}
          >
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Contributed</span>
          </div>
        )}
      </div>
    );
  }

  // Handler for withdrawal confirmation
  const handleWithdrawConfirm = async () => {
    try {
      await handleAction(
        () => onWithdrawCollateral(circle.rawCircle.circleId),
        "Withdraw collateral"
      );
      setShowWithdrawModal(false);
    } catch (error) {
      // Error already handled by handleAction
    }
  };

  return (
    <>
      {/* Withdrawal Modal */}
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
          withdrawalReason={withdrawalInfo.reason || "below_threshold"}
          isLoading={isLoading}
        />
      )}
      {null}
    </>
  );
};

export default CircleActions;
