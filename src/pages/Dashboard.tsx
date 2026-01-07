import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useActiveAccount } from "thirdweb/react";
import { useUserProfile } from "../hooks/useUserProfile";
import { useCircleSavings } from "../hooks/useCircleSavings";
import { usePersonalGoals } from "../hooks/usePersonalGoals";
import { useNotificationSync } from "../hooks/useNotificationSync";
import { useNotifications } from "../contexts/NotificationsContext";
import { client } from "../thirdwebClient";
import { useThemeColors } from "../hooks/useThemeColors";
import { useCreditScore } from "../hooks/useCreditScore";
import { Settings, Bell, History } from "lucide-react";
import { normalizeIpfsUrl } from "../utils/ipfs";
import NavBar from "../components/NavBar";
import PersonalGoals from "../components/PersonalGoals";
import BalanceDisplay from "../components/BalanceDisplay";
import ActiveCircles from "../components/ActiveCircles";
import AddFundsModal from "../modals/AddFundsModal";
import WithdrawModal from "../modals/WithdrawModal";
import { transformCircles } from "../utils/circleTransformer";

import { useBalance } from "../hooks/useBalance";

const Dashboard: React.FC = () => {
  const account = useActiveAccount();
  const { balance: balanceData, isLoading: isBalanceLoading } = useBalance();

  const { profile } = useUserProfile(client);

  // Fetch circles and personal goals data
  const {
    circles,
    joinedCircles,
    contributions,
    payouts,
    votingEvents,
    votes,
    voteResults,
    positions,
    collateralWithdrawals,
    collateralReturns,
    forfeitures,
    isLoading: isCirclesLoading,
  } = useCircleSavings(client);
  const { goals, isLoading: isGoalsLoading } = usePersonalGoals(client);
  const { creditScore, isLoading: isReputationLoading } = useCreditScore();
  const { unreadCount } = useNotifications();

  // Transform circles for notification sync
  const transformedCircles = useMemo(
    () =>
      transformCircles(
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
        collateralReturns
      ),
    [
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
    ]
  );

  // Sync notifications with app events
  useNotificationSync(transformedCircles, goals, []);

  // Normalize IPFS URL to ensure it's properly formatted
  const profileImageUrl = useMemo(() => {
    if (!profile?.photo) return null;
    const normalized = normalizeIpfsUrl(profile.photo);
    return normalized;
  }, [profile?.photo]);

  const navigate = useNavigate();
  const colors = useThemeColors();

  // Modal states
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  // Calculate total committed in circles with breakdown
  const {
    total: circleCommitted,
    collateral: circleCollateral,
    contributions: circleContributions,
  } = useMemo(() => {
    const activeCircles = transformCircles(
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
      collateralReturns
    );

    return activeCircles.reduce(
      (acc, circle) => {
        // If circle is finished or user already withdrew, skip everything
        if (circle.status === "completed" || circle.hasWithdrawn) {
          return acc;
        }

        // Use the actual collateral amount that the user deposited
        // and subtract any deductions from late payments/forfeitures
        const initialCollateral = circle.rawCircle?.collateralAmount
          ? Number(circle.rawCircle.collateralAmount) / 1e18
          : 0;

        const deductions =
          (Number(circle.forfeitedAmount || 0n) +
            Number(circle.forfeitedContributionPortion || 0n)) /
          1e18;

        const collateralAmount = Math.max(0, initialCollateral - deductions);

        // For dead circles, contributions are lost, so only collateral is "committed"
        // For other active states, both are committed
        const contributedAmount =
          circle.status === "dead"
            ? 0
            : circle.userTotalContributed
            ? Number(circle.userTotalContributed) / 1e18
            : 0;

        return {
          total: acc.total + collateralAmount + contributedAmount,
          collateral: acc.collateral + collateralAmount,
          contributions: acc.contributions + contributedAmount,
        };
      },
      { total: 0, collateral: 0, contributions: 0 }
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

  // Calculate total committed in personal savings
  const personalSavingsCommitted = useMemo(() => {
    const activeGoals = goals.filter((goal) => goal.isActive);

    return activeGoals.reduce((sum, goal) => {
      // Convert bigint to number (18 decimals)
      const currentAmount = Number(goal.currentAmount) / 1e18;
      return sum + currentAmount;
    }, 0);
  }, [goals]);

  return (
    <>
      <NavBar
        colors={colors}
        userName={profile?.username}
        fullName={profile?.fullName}
        profileImage={profileImageUrl}
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => navigate("/transactions-history")}
              className="p-2 rounded-xl transition hover:opacity-80"
              style={{ color: colors.text }}
            >
              <History size={18} />
            </button>
            <button
              onClick={() => navigate("/notifications")}
              className="p-2 rounded-xl relative transition hover:opacity-80"
              style={{ color: colors.text }}
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => navigate("/settings")}
              className="p-2 rounded-xl transition hover:opacity-80"
              style={{ color: colors.text }}
            >
              <Settings size={18} />
            </button>
          </div>
        }
      />
      <div
        className="min-h-screen pb-20"
        style={{ backgroundColor: colors.background }}
      >
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left Column - Balance and Overview */}
            <div className="lg:col-span-2 space-y-6">
              <BalanceDisplay
                currentBalances={{
                  USDm: balanceData ? Number(balanceData) / 1e18 : 0,
                }}
                circleCommitted={circleCommitted}
                circleCollateral={circleCollateral}
                circleContributions={circleContributions}
                personalSavingsCommitted={personalSavingsCommitted}
                setShowAddFundsModal={setShowAddFundsModal}
                setShowWithdrawModal={setShowWithdrawModal}
                colors={colors}
                creditScore={creditScore}
                isLoading={
                  isReputationLoading ||
                  isBalanceLoading ||
                  isCirclesLoading ||
                  isGoalsLoading
                }
              />

              {/* Personal Goals Section */}
              <PersonalGoals />
            </div>

            {/* Right Column - Active Circles and Analytics */}
            <div className="lg:col-span-3 space-y-6">
              {/* ActiveCircles */}
              <ActiveCircles colors={colors} client={client} />
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddFundsModal
        isOpen={showAddFundsModal}
        onClose={() => setShowAddFundsModal(false)}
      />
      <WithdrawModal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
      />
    </>
  );
};

export default Dashboard;
