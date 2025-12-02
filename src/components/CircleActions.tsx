import React, { useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import {
  Play,
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

interface CircleActionsProps {
  circle: ActiveCircle;
  colors: any;
  onStartCircle: (circleId: bigint) => Promise<any>;
  onInitiateVoting: (circleId: bigint) => Promise<any>;
  onCastVote: (circleId: bigint, choice: 1 | 2) => Promise<any>;
  onExecuteVote: (circleId: bigint) => Promise<any>;
  onWithdrawCollateral: (circleId: bigint) => Promise<any>;
  onContribute: (circleId: bigint, amount: bigint) => Promise<any>;
  onForfeitMember: (circleId: bigint) => Promise<any>;
  onInviteMembers?: () => void;
}

const CircleActions: React.FC<CircleActionsProps> = ({
  circle,
  colors,
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
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const handleAction = async (action: () => Promise<any>) => {
    try {
      setIsLoading(true);
      await action();
    } catch (error) {
      console.error("Action failed:", error);
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
    } catch (error) {
      console.error("Failed to copy invite link:", error);
    }
  };

  // Determine if user can share invite
  // Public circles: All members can share
  // Private circles: Only creator can share
  const canShareInvite = visibility === 1 ? isMember : isCreator;

  // Render buttons based on state
  // State: CREATED (1)
  if (state === 1) {
    const thresholdReached = Number(currentMembers) >= Number(maxMembers) * 0.6;
    const circleFull = Number(currentMembers) >= Number(maxMembers);

    // For private circles, show both Invite and Share buttons for creator
    if (!circleFull && visibility === 0 && isCreator && onInviteMembers) {
      return (
        <div className="flex gap-2 flex-1">
          <button
            onClick={onInviteMembers}
            className="flex-1 px-2.5 py-1.5 sm:py-2 rounded-lg font-semibold text-[10px] sm:text-sm transition text-white hover:shadow-md flex items-center justify-center gap-1 sm:gap-2"
            style={{ background: colors.gradient }}
          >
            <UserPlus className="sm:w-4 sm:h-4 w-3 h-3" />
            <span>Invite</span>
          </button>
          <button
            onClick={handleShareInvite}
            disabled={copied}
            className="flex-1 px-2.5 py-1.5 sm:py-2 rounded-lg font-semibold text-[10px] sm:text-sm transition text-white hover:shadow-md flex items-center justify-center gap-1 sm:gap-2"
            style={{ background: copied ? "#10B981" : colors.gradient }}
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

    // For public circles, show share button if circle is not full and user can share
    if (!circleFull && canShareInvite) {
      return (
        <button
          onClick={handleShareInvite}
          disabled={copied}
          className="flex-1 py-1.5 sm:py-2 rounded-lg font-semibold text-[10px] sm:text-sm transition text-white hover:shadow-md flex items-center justify-center gap-1 sm:gap-2"
          style={{ background: copied ? "#10B981" : colors.gradient }}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4" />
              <span>Share Invite</span>
            </>
          )}
        </button>
      );
    }

    if (ultimatumPassed) {
      if (thresholdReached) {
        if (isCreator) {
          return (
            <button
              onClick={() => handleAction(() => onStartCircle(circleId))}
              disabled={isLoading}
              className="flex-1 py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm transition text-white hover:shadow-md flex items-center justify-center gap-1 sm:gap-2"
              style={{ background: colors.gradient }}
            >
              {isLoading ? (
                "Starting..."
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Start Circle</span>
                </>
              )}
            </button>
          );
        } else if (isMember) {
          return (
            <button
              onClick={() => handleAction(() => onInitiateVoting(circleId))}
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
        if (isMember) {
          return (
            <button
              onClick={() => handleAction(() => onWithdrawCollateral(circleId))}
              disabled={isLoading}
              className="flex-1 py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm transition text-white hover:shadow-md flex items-center justify-center gap-1 sm:gap-2 bg-red-500 hover:bg-red-600"
            >
              {isLoading ? (
                "Withdrawing..."
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  <span>Withdraw Collateral</span>
                </>
              )}
            </button>
          );
        }
      }
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
          onClick={() => handleAction(() => onExecuteVote(circleId))}
          disabled={isLoading}
          className="w-full py-2 rounded-lg font-semibold text-xs sm:text-sm transition text-white hover:shadow-md flex items-center justify-center gap-1 sm:gap-2"
          style={{ background: colors.gradient }}
        >
          {isLoading ? "Processing..." : "Execute Vote Results"}
        </button>
      );
    }

    if (hasVoted) {
      return (
        <div
          className="flex-1 py-1.5 sm:py-2 rounded-lg font-medium text-xs sm:text-sm text-center border flex items-center justify-center gap-2"
          style={{ borderColor: colors.border, color: colors.textLight }}
        >
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span>Voted: {userVote.choice === 1 ? "Start" : "Withdraw"}</span>
        </div>
      );
    }

    return (
      <div className="flex flex-col sm:flex-row gap-2 flex-1">
        <div className="flex gap-2 flex-1">
          <button
            onClick={() => handleAction(() => onCastVote(circleId, 1))} // 1 = START
            disabled={isLoading}
            className="flex-1 py-2 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm transition text-white hover:shadow-md flex items-center justify-center gap-1 sm:gap-2 bg-green-500 hover:bg-green-600"
          >
            <CheckCircle className="w-4 h-4" />
            <span className="hidden xs:inline">Vote </span>Start
          </button>
          <button
            onClick={() => handleAction(() => onCastVote(circleId, 2))} // 2 = WITHDRAW
            disabled={isLoading}
            className="flex-1 py-2 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm transition text-white hover:shadow-md flex items-center justify-center gap-1 sm:gap-2 bg-red-500 hover:bg-red-600"
          >
            <UserX className="w-4 h-4" />
            <span className="hidden xs:inline">Vote </span>Withdraw
          </button>
        </div>
      </div>
    );
  }

  // State: ACTIVE (3)
  if (state === 3) {
    const hasContributed = circle.hasContributed;
    const currentRound = Number(circle.rawCircle.currentRound || 1);
    const isNextRecipient = circle.currentPosition === currentRound;

    return (
      <div className="flex gap-2 flex-1">
        {!hasContributed ? (
          <button
            onClick={() =>
              handleAction(() => onContribute(circleId, contributionAmount))
            }
            disabled={isLoading}
            className="flex-1 py-2 rounded-lg font-semibold text-xs sm:text-sm transition text-white hover:shadow-md flex items-center justify-center gap-1 sm:gap-2"
            style={{ background: colors.gradient }}
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
        ) : (
          <div
            className="flex-1 py-2 rounded-lg font-medium text-xs sm:text-sm text-center border flex items-center justify-center gap-2"
            style={{ borderColor: colors.border, color: colors.textLight }}
          >
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Contributed</span>
          </div>
        )}

        {isNextRecipient && (
          <button
            onClick={() => handleAction(() => onForfeitMember(circleId))}
            disabled={isLoading}
            className="px-3 sm:px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm transition border hover:bg-red-50 dark:hover:bg-red-950 text-red-500 border-red-200 dark:border-red-800"
            title="Forfeit late members (Only available to current round recipient after grace period)"
          >
            <span className="hidden sm:inline">Forfeit</span>
            <UserX className="w-4 h-4 sm:hidden" />
          </button>
        )}
      </div>
    );
  }

  return null;
};

export default CircleActions;
