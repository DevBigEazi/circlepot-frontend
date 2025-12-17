import React, { useMemo, useState } from "react";
import { useUserProfile } from "../hooks/useUserProfile";
import { useActiveAccount } from "thirdweb/react";
import { client } from "../thirdwebClient";
import { useNavigate } from "react-router";
import { useThemeColors } from "../hooks/useThemeColors";
import NavBar from "../components/NavBar";
import { normalizeIpfsUrl } from "../utils/ipfs";
import { useCircleSavings } from "../hooks/useCircleSavings";
import { transformCircles } from "../utils/circleTransformer";
import ActiveCircleCard from "../components/ActiveCircleCard";
import CircleDetailsModal from "../modals/CircleDetailsModal";
import CircleChatModal from "../modals/CircleChatModal";
import InviteMembersModal from "../modals/InviteMembersModal";
import { ActiveCircle } from "../interfaces/interfaces";
import { Users, TrendingUp, CheckCircle, AlertOctagon } from "lucide-react";

const Circles: React.FC = () => {
  const navigate = useNavigate();
  const colors = useThemeColors();
  const account = useActiveAccount();

  const { profile } = useUserProfile(client);

  // Normalize IPFS URL
  const profileImageUrl = useMemo(() => {
    if (!profile?.photo) return null;
    return normalizeIpfsUrl(profile.photo);
  }, [profile?.photo]);

  // Fetch circle data
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

  // Modal states
  const [showCircleDetails, setShowCircleDetails] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedCircle, setSelectedCircle] = useState<ActiveCircle | null>(
    null
  );

  // Transform circles data
  const allCircles = useMemo(() => {
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
      collateralWithdrawals
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
  ]);

  // Categorize circles
  const { activeCircles, historyCircles } = useMemo(() => {
    if (!account?.address) {
      return { activeCircles: [], historyCircles: [] };
    }

    const userAddressLower = account.address.toLowerCase();

    const involvedCircles = allCircles.filter((circle) => {
      // Check if user is creator
      const isCreator =
        circle.rawCircle?.creator?.id?.toLowerCase() === userAddressLower;
      // Check if user is a member
      const isMember = circle.currentPosition > 0;

      return isCreator || isMember;
    });

    const active = involvedCircles.filter((c) => {
      // If user has withdrawn, it's not active for them
      if (c.hasWithdrawn) return false;
      // If circle is in a terminal state, it's not active
      if (["completed", "withdrawn", "dead"].includes(c.status)) return false;

      // Otherwise include standard active states
      return ["active", "created", "pending", "voting"].includes(c.status);
    });

    const history = involvedCircles.filter((c) => {
      // 1. Completed
      if (c.status === "completed") return true;
      // 2. Withdrawn (Circle status OR User specific withdrawal OR Dead)
      if (c.status === "withdrawn" || c.status === "dead" || c.hasWithdrawn)
        return true;

      // 3. Payout Received by current user
      // Track in history even if still active, as a record of success
      if (
        account?.address &&
        c.payouts &&
        c.payouts.some(
          (p: any) =>
            p.user?.id?.toLowerCase() === account.address.toLowerCase()
        )
      ) {
        return true;
      }

      return false;
    });

    return { activeCircles: active, historyCircles: history };
  }, [allCircles, account?.address]);

  // Calculate total committed balance
  const totalBalance = useMemo(() => {
    return activeCircles
      .reduce((sum, circle) => {
        const collateralAmount = circle.rawCircle?.collateralAmount
          ? Number(circle.rawCircle.collateralAmount) / 1e18
          : 0;

        const contributedAmount = circle.userTotalContributed
          ? Number(circle.userTotalContributed) / 1e18
          : 0;

        return sum + collateralAmount + contributedAmount;
      }, 0)
      .toFixed(2);
  }, [activeCircles]);

  // Handlers
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

  return (
    <>
      <NavBar
        colors={colors}
        userName={profile?.username}
        fullName={profile?.fullName}
        profileImage={profileImageUrl}
        onBack={() => navigate(-1)}
      />

      <div
        className="min-h-screen pb-10"
        style={{ backgroundColor: colors.background }}
      >
        <div className="max-w-4xl mx-auto p-4 md:p-6">
          {/* Header */}
          <div className="mb-8">
            <h1
              className="text-3xl font-bold mb-2"
              style={{ color: colors.text }}
            >
              Your Service Circles
            </h1>
            <p style={{ color: colors.textLight }}>
              Manage your collaborative savings circles and track your
              contributions
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div
              className="rounded-xl p-6 border"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm" style={{ color: colors.textLight }}>
                  Total Committed
                </div>
                <TrendingUp size={16} style={{ color: colors.primary }} />
              </div>
              <div
                className="text-2xl font-bold"
                style={{ color: colors.text }}
              >
                $
                {Number(totalBalance).toLocaleString("en-US", {
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>

            <div
              className="rounded-xl p-6 border"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }}
            >
              <div className="text-sm mb-2" style={{ color: colors.textLight }}>
                Active Circles
              </div>
              <div
                className="text-2xl font-bold"
                style={{ color: colors.text }}
              >
                {activeCircles.length}
              </div>
            </div>

            <div
              className="rounded-xl p-6 border"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }}
            >
              <div className="text-sm mb-2" style={{ color: colors.textLight }}>
                Completed
              </div>
              <div
                className="text-2xl font-bold"
                style={{ color: colors.text }}
              >
                {historyCircles.filter((c) => c.status === "completed").length}
              </div>
            </div>
            <div
              className="rounded-xl p-6 border"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }}
            >
              <div className="text-sm mb-2" style={{ color: colors.textLight }}>
                Withdrawn
              </div>
              <div
                className="text-2xl font-bold"
                style={{ color: colors.text }}
              >
                {historyCircles.filter((c) => c.status === "withdrawn").length}
              </div>
            </div>
          </div>

          {/* Active Circles Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Users style={{ color: colors.primary }} className="w-5 h-5" />
              <h2 className="text-xl font-bold" style={{ color: colors.text }}>
                Active Circles
              </h2>
            </div>

            {isLoading ? (
              <div
                className="text-center py-8"
                style={{ color: colors.textLight }}
              >
                Loading circles...
              </div>
            ) : activeCircles.length === 0 ? (
              <div
                className="rounded-xl p-8 text-center border dashed"
                style={{ borderColor: colors.border }}
              >
                <p style={{ color: colors.textLight }}>
                  No active circles found.
                </p>
                <button
                  onClick={() => navigate("/create/circle")}
                  className="mt-4 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: colors.primary }}
                >
                  Create a Circle
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 mb-5">
                {activeCircles.map((circle) => (
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
                    onInviteMembers={() => handleInviteClick(circle)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* History Section */}
          {historyCircles.length > 0 && (
            <div className="mt-12 mb-8">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle
                  style={{ color: colors.text }}
                  className="w-5 h-5"
                />
                <h2
                  className="text-xl font-bold"
                  style={{ color: colors.text }}
                >
                  Circle History
                </h2>
              </div>
              <div className="space-y-4">
                {historyCircles.map((circle) => {
                  const userPayout = circle.payouts?.find(
                    (p: any) =>
                      p.user?.id?.toLowerCase() ===
                      account?.address?.toLowerCase()
                  );
                  const hasWithdrawn =
                    circle.hasWithdrawn ||
                    circle.status === "withdrawn" ||
                    circle.status === "dead";

                  let statusLabel = "";
                  let statusIcon = null;
                  let statusClass = "";
                  let detailsText = null;

                  if (circle.status === "completed") {
                    statusLabel = "Completed";
                    statusIcon = <CheckCircle size={18} />;
                    statusClass =
                      "text-green-600 bg-green-50 dark:bg-green-900/20";
                    detailsText = (
                      <span
                        className="text-sm"
                        style={{ color: colors.textLight }}
                      >
                        Collateral Returned ($
                        {Math.floor(
                          Number(circle.rawCircle.collateralAmount) / 1e18
                        )}
                        )
                      </span>
                    );
                  } else if (hasWithdrawn) {
                    statusLabel = "Withdrawn";
                    statusIcon = <AlertOctagon size={18} />;
                    statusClass =
                      "text-orange-600 bg-orange-50 dark:bg-orange-900/20";
                    detailsText = (
                      <span
                        className="text-sm"
                        style={{ color: colors.textLight }}
                      >
                        Collateral Withdrawn
                      </span>
                    );
                  } else if (userPayout) {
                    statusLabel = "Payout Received";
                    statusIcon = <TrendingUp size={18} />;
                    statusClass =
                      "text-blue-600 bg-blue-50 dark:bg-blue-900/20";
                    detailsText = (
                      <span
                        className="text-sm"
                        style={{ color: colors.textLight }}
                      >
                        Received: $
                        {(
                          Number(userPayout.payoutAmount) / 1e18
                        ).toLocaleString("en-US", {
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    );
                  }

                  return (
                    <div
                      key={circle.id}
                      className="rounded-xl p-4 border opacity-75"
                      style={{
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      }}
                    >
                      <div className="flex justify-between items-center sm:flex-row flex-col gap-4 sm:gap-0">
                        <div>
                          <h3
                            className="font-semibold text-lg"
                            style={{ color: colors.text }}
                          >
                            {circle.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            {detailsText}
                            <span
                              className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800"
                              style={{ color: colors.textLight }}
                            >
                              {circle.frequency === 0
                                ? "Daily"
                                : circle.frequency === 1
                                ? "Weekly"
                                : "Monthly"}
                            </span>
                          </div>
                        </div>
                        <div
                          className={`flex items-center gap-2 font-semibold px-3 py-1.5 rounded-lg ${statusClass}`}
                        >
                          {statusIcon}
                          <span>{statusLabel}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
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
    </>
  );
};

export default Circles;
