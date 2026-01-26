import React, { useMemo, useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import { client } from "../thirdwebClient";
import { useNavigate } from "react-router";
import { useThemeColors } from "../hooks/useThemeColors";
import NavBar from "../components/NavBar";
import { useCircleSavings } from "../hooks/useCircleSavings";
import { transformCircles } from "../utils/circleTransformer";
import ActiveCircleCard from "../components/ActiveCircleCard";
import CircleDetailsModal from "../modals/CircleDetailsModal";
import CircleChatModal from "../modals/CircleChatModal";
import InviteMembersModal from "../modals/InviteMembersModal";
import { ActiveCircle } from "../interfaces/interfaces";
import { Users, TrendingUp, CheckCircle, AlertOctagon } from "lucide-react";
import { CircleCardSkeleton } from "../components/Skeleton";
import SEO from "../components/SEO";

const Circles: React.FC = () => {
  const navigate = useNavigate();
  const colors = useThemeColors();
  const account = useActiveAccount();

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
    collateralReturns,
    getWithdrawalInfo,
    getLateMembersForCircle,
    forfeitures,
    isLoading,
    initiateVoting,
    castVote,
    executeVote,
    withdrawCollateral,
    contribute,
    forfeitMember,
    inviteMembers,
    vaultProjects,
  } = useCircleSavings(client, true);

  // Modal states
  const [showCircleDetails, setShowCircleDetails] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedCircle, setSelectedCircle] = useState<ActiveCircle | null>(
    null,
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
      collateralWithdrawals,
      forfeitures,
      collateralReturns,
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
    collateralReturns,
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

      // Check if user was forfeited or has forfeit record
      const isForfeited = circle.isForfeited;
      const hasForfeit = (circle.forfeitCount || 0) > 0;

      return isCreator || isMember || isForfeited || hasForfeit;
    });

    const active = involvedCircles.filter((c) => {
      // If user has withdrawn, it's not active for them
      if (c.hasWithdrawn) return false;
      // If circle is in a terminal state, it's not active
      if (["completed", "dead"].includes(c.status)) return false;

      // Otherwise include standard active states
      return ["active", "created", "pending", "voting"].includes(c.status);
    });

    const history = involvedCircles.filter((c) => {
      // 1. Completed
      if (c.status === "completed") return true;
      // 2. Withdrawn (Circle status OR User specific withdrawal OR Dead)
      if (c.status === "dead" || c.hasWithdrawn) return true;

      // 3. Forfeited record (Show in history even if still active)
      if (c.isForfeited || (c.forfeitCount || 0) > 0) return true;

      // 4. Payout Received by current user
      // Track in history even if still active, as a record of success
      if (
        account?.address &&
        c.payouts &&
        c.payouts.some(
          (p: any) =>
            p.user?.id?.toLowerCase() === account.address.toLowerCase(),
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
        const initialCollateral = circle.rawCircle?.collateralAmount
          ? Number(circle.rawCircle.collateralAmount) / 1e18
          : 0;

        const deductions =
          (Number(circle.forfeitedAmount || 0n) +
            Number(circle.forfeitedContributionPortion || 0n)) /
          1e18;

        const collateralAmount = Math.max(0, initialCollateral - deductions);

        const contributedAmount =
          circle.status === "dead"
            ? 0
            : circle.userTotalContributed
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
      <SEO
        title="My Circles"
        description="Manage your rotating savings circles. Join, contribute, and track your collaborative savings with trusted members from around the world on Circlepot."
        url="/circles"
      />
      <NavBar
        variant="minimal"
        onBack={() => navigate(-1)}
        title="Circles"
        subtitle="Manage your collaborative savings circles and track your contributions"
        colors={colors}
      />

      <div
        className="min-h-screen pb-10"
        style={{ backgroundColor: colors.background }}
      >
        <div className="max-w-4xl mx-auto px-4 md:py-6">
          {/* Summary Cards */}
          <div className="flex overflow-x-auto pb-4 gap-3 mb-8 md:gap-4 md:grid md:grid-cols-5 md:overflow-visible md:pb-0 scrollbar-hide snap-x">
            <div
              className="rounded-xl p-4 md:p-6 border shrink-0 w-48 md:w-auto md:col-span-1 snap-start"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className="text-xs md:text-sm"
                  style={{ color: colors.textLight }}
                >
                  Total Committed
                </div>
                <TrendingUp size={16} style={{ color: colors.primary }} />
              </div>
              <div
                className="text-lg md:text-xl font-bold"
                style={{ color: colors.text }}
              >
                $
                {Number(totalBalance).toLocaleString("en-US", {
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>

            <div
              className="rounded-xl p-4 md:p-6 border shrink-0 w-32 md:w-auto snap-start"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }}
            >
              <div
                className="text-xs md:text-sm mb-2"
                style={{ color: colors.textLight }}
              >
                Active
              </div>
              <div
                className="text-xl md:text-2xl font-bold"
                style={{ color: colors.text }}
              >
                {activeCircles.length}
              </div>
            </div>

            <div
              className="rounded-xl p-4 md:p-6 border shrink-0 w-32 md:w-auto snap-start"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }}
            >
              <div
                className="text-xs md:text-sm mb-2"
                style={{ color: colors.textLight }}
              >
                Completed
              </div>
              <div
                className="text-xl md:text-2xl font-bold"
                style={{ color: colors.text }}
              >
                {historyCircles.filter((c) => c.status === "completed").length}
              </div>
            </div>

            <div
              className="rounded-xl p-4 md:p-6 border shrink-0 w-32 md:w-auto snap-start"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }}
            >
              <div
                className="text-xs md:text-sm mb-2"
                style={{ color: colors.textLight }}
              >
                Dead
              </div>
              <div className="text-xl md:text-2xl font-bold text-orange-800">
                {
                  historyCircles.filter(
                    (c) => c.status === "dead" || c.hasWithdrawn,
                  ).length
                }
              </div>
            </div>

            <div
              className="rounded-xl p-4 md:p-6 border shrink-0 w-32 md:w-auto snap-start"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }}
            >
              <div
                className="text-xs md:text-sm mb-2"
                style={{ color: colors.textLight }}
              >
                Forfeits
              </div>
              <div className="text-xl md:text-2xl font-bold text-orange-500">
                {allCircles.reduce((sum, c) => sum + (c.forfeitCount || 0), 0)}
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
              <div className="grid grid-cols-1 gap-4 mb-5">
                {[1, 2].map((i) => (
                  <CircleCardSkeleton key={i} />
                ))}
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
                    onInitiateVoting={initiateVoting}
                    onCastVote={castVote}
                    onExecuteVote={executeVote}
                    onWithdrawCollateral={withdrawCollateral}
                    onContribute={contribute}
                    onForfeitMember={forfeitMember}
                    getWithdrawalInfo={getWithdrawalInfo}
                    getLateMembersForCircle={getLateMembersForCircle}
                    onInviteMembers={() => handleInviteClick(circle)}
                    projectName={
                      circle.rawCircle?.token
                        ? vaultProjects[circle.rawCircle.token.toLowerCase()]
                        : undefined
                    }
                  />
                ))}
              </div>
            )}
          </div>

          {/* History Section */}
          {historyCircles.length > 0 && (
            <div className="mt-12 sm:mt-10 mb-16">
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
                      account?.address?.toLowerCase(),
                  );
                  // Only consider actually withdrawn from DEAD circles, not completed circles
                  const hasWithdrawn =
                    circle.hasWithdrawn && circle.status === "dead";
                  const isForfeited = circle.isForfeited;
                  const hasForfeit = (circle.forfeitCount || 0) > 0;

                  const statusInfo = [];
                  let detailsText;
                  if (hasForfeit) {
                    statusInfo.push({
                      label: "Forfeited",
                      icon: (
                        <AlertOctagon
                          size={16}
                          className="md:w-[18px] md:h-[18px]"
                        />
                      ),
                      class:
                        "text-orange-600 bg-orange-50 dark:bg-orange-900/20",
                    });
                  }
                  if (userPayout) {
                    statusInfo.push({
                      label: "Payout Received",
                      icon: (
                        <TrendingUp
                          size={16}
                          className="md:w-[18px] md:h-[18px]"
                        />
                      ),
                      class: "text-blue-600 bg-blue-50 dark:bg-blue-900/20",
                    });
                  }
                  // Only show withdrawn label for DEAD circles, not completed ones
                  if (
                    hasWithdrawn &&
                    !isForfeited &&
                    circle.status === "dead"
                  ) {
                    statusInfo.push({
                      label: "Withdrawn (Circle Dead)",
                      icon: (
                        <AlertOctagon
                          size={16}
                          className="md:w-[18px] md:h-[18px]"
                        />
                      ),
                      class:
                        "text-orange-600 bg-orange-50 dark:bg-orange-900/20",
                    });
                  }
                  if (circle.status === "completed") {
                    statusInfo.push({
                      label: "Completed",
                      icon: (
                        <CheckCircle
                          size={16}
                          className="md:w-[18px] md:h-[18px]"
                        />
                      ),
                      class: "text-green-600 bg-green-50 dark:bg-green-900/20",
                    });
                  }

                  // Default if somehow empty
                  if (statusInfo.length === 0) {
                    statusInfo.push({
                      label:
                        circle.status.charAt(0).toUpperCase() +
                        circle.status.slice(1),
                      icon: <TrendingUp size={16} />,
                      class: "text-gray-600 bg-gray-50",
                    });
                  }

                  detailsText = (
                    <div className="flex flex-col gap-1">
                      {userPayout && (
                        <span className="text-xs md:text-sm text-blue-600 font-medium">
                          Received: $
                          {(
                            Number(userPayout.payoutAmount) / 1e18
                          ).toLocaleString("en-US", {
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      )}
                      {hasForfeit && (
                        <span className="text-xs md:text-sm text-orange-600 font-medium">
                          {circle.forfeitCount} Forfeiture Record
                          {circle.forfeitCount !== 1 ? "s" : ""}
                        </span>
                      )}
                      {circle.status === "completed" &&
                        (() => {
                          const userCollateralReturn = collateralReturns.find(
                            (cr: any) =>
                              BigInt(cr.circleId).toString() ===
                                circle.rawCircle.circleId.toString() &&
                              cr.user?.id?.toLowerCase() ===
                                account?.address?.toLowerCase(),
                          );

                          const returnedAmount = userCollateralReturn
                            ? Number(userCollateralReturn.amount) / 1e18
                            : 0;

                          return (
                            <span
                              className="text-xs md:text-sm"
                              style={{ color: colors.textLight }}
                            >
                              Collateral Returned: $
                              {returnedAmount.toLocaleString("en-US", {
                                maximumFractionDigits: 2,
                                minimumFractionDigits: 2,
                              })}
                            </span>
                          );
                        })()}
                    </div>
                  );

                  return (
                    <div
                      key={circle.id}
                      onClick={() => handleViewDetails(circle)}
                      className="rounded-xl p-3 md:p-4 border opacity-85 hover:opacity-100 transition-all cursor-pointer hover:shadow-md"
                      style={{
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      }}
                    >
                      <div className="flex justify-between items-start md:items-center gap-2">
                        <div className="min-w-0">
                          <h3
                            className="font-semibold text-sm md:text-lg truncate"
                            style={{ color: colors.text }}
                          >
                            {circle.name}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            {detailsText}
                            <span
                              className="text-[10px] md:text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20"
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
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          {statusInfo.map((info, idx) => (
                            <div
                              key={idx}
                              className={`flex items-center gap-1.5 font-semibold px-2 py-1 md:px-3 md:py-1.5 rounded-lg text-[10px] md:text-xs ${info.class}`}
                            >
                              {info.icon}
                              <span>{info.label}</span>
                            </div>
                          ))}
                          {hasForfeit && (
                            <span className="text-[10px] md:text-xs font-bold text-orange-500 mr-1 whitespace-nowrap">
                              Deduction from collateral: $
                              {(
                                (Number(circle.forfeitedAmount || 0n) +
                                  Number(
                                    circle.forfeitedContributionPortion || 0n,
                                  )) /
                                1e18
                              ).toLocaleString("en-US", {
                                maximumFractionDigits: 2,
                                minimumFractionDigits: 2,
                              })}
                            </span>
                          )}
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
          onInitiateVoting={initiateVoting}
          onCastVote={castVote}
          onExecuteVote={executeVote}
          onWithdrawCollateral={withdrawCollateral}
          onContribute={contribute}
          onForfeitMember={forfeitMember}
          getWithdrawalInfo={getWithdrawalInfo}
          getLateMembersForCircle={getLateMembersForCircle}
        />
      )}

      {showChatModal && selectedCircle && (
        <CircleChatModal
          circle={selectedCircle}
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
