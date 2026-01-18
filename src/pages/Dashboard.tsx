import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useActiveAccount } from "thirdweb/react";
import { useUserProfile } from "../hooks/useUserProfile";
import { useCircleSavings } from "../hooks/useCircleSavings";
import { usePersonalGoals } from "../hooks/usePersonalGoals";
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
  const navigate = useNavigate();
  const colors = useThemeColors();

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

  const { creditScore, isLoading: isCreditScoreLoading } = useCreditScore();

  const { unreadCount } = useNotifications();

  // Modal states
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  // Normalize IPFS URL to ensure it's properly formatted
  const profileImageUrl = useMemo(() => {
    if (!profile?.photo) return null;
    return normalizeIpfsUrl(profile.photo);
  }, [profile?.photo]);

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
      collateralReturns,
    );

    return activeCircles.reduce(
      (acc, circle) => {
        if (circle.status === "completed" || circle.hasWithdrawn) {
          return acc;
        }

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

        return {
          total: acc.total + collateralAmount + contributedAmount,
          collateral: acc.collateral + collateralAmount,
          contributions: acc.contributions + contributedAmount,
        };
      },
      { total: 0, collateral: 0, contributions: 0 },
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
                  isCreditScoreLoading ||
                  isBalanceLoading ||
                  isCirclesLoading ||
                  isGoalsLoading
                }
              />
              <PersonalGoals />
            </div>

            <div className="lg:col-span-3 space-y-6">
              <ActiveCircles colors={colors} client={client} />
            </div>
          </div>
        </div>
      </div>

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
