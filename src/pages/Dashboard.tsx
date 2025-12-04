import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useActiveAccount } from "thirdweb/react";
import { useUserProfile } from "../hooks/useUserProfile";
import { useCircleSavings } from "../hooks/useCircleSavings";
import { usePersonalGoals } from "../hooks/usePersonalGoals";
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

import { useReadContract } from "thirdweb/react";
import { getContract } from "thirdweb";
import { defineChain } from "thirdweb/chains";
import { CUSD_ABI } from "../abis/Cusd";
import { formatBalance } from "../utils/helpers";
import { CUSD_ADDRESS, CHAIN_ID } from "../constants/constants";

const Dashboard: React.FC = () => {
  const account = useActiveAccount();
  const chain = useMemo(() => defineChain(CHAIN_ID), []);

  const cusdContract = useMemo(
    () =>
      getContract({
        client,
        chain,
        address: CUSD_ADDRESS,
        abi: CUSD_ABI,
      }),
    [chain]
  );

  const { data: balanceData } = useReadContract({
    contract: cusdContract,
    method: "balanceOf",
    params: [account?.address || "0x0000000000000000000000000000000000000000"],
  });

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
  } = useCircleSavings(client);
  const { goals } = usePersonalGoals(client);
  const { creditScore } = useCreditScore(true);

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

  // User balance data
  const currentBalances = useMemo(
    () => ({
      cUSD: balanceData ? formatBalance(balanceData) : 0,
    }),
    [balanceData]
  );

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
      payouts
    );

    return activeCircles.reduce(
      (acc, circle) => {
        // Use the actual collateral amount that the user deposited
        // This is contribution * maxMembers * 1.01 (includes 1% buffer)
        const collateralAmount = circle.rawCircle?.collateralAmount
          ? Number(circle.rawCircle.collateralAmount) / 1e18
          : 0;

        // Add the total amount contributed by the user to this circle
        const contributedAmount = circle.userTotalContributed
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
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
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
                currentBalances={currentBalances}
                circleCommitted={circleCommitted}
                circleCollateral={circleCollateral}
                circleContributions={circleContributions}
                personalSavingsCommitted={personalSavingsCommitted}
                setShowAddFundsModal={setShowAddFundsModal}
                setShowWithdrawModal={setShowWithdrawModal}
                colors={colors}
                creditScore={creditScore}
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
