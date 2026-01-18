import React, { useMemo } from "react";
import { useActiveAccount } from "thirdweb/react";
import { useCircleSavings } from "../hooks/useCircleSavings";
import { usePersonalGoals } from "../hooks/usePersonalGoals";
import { useCreditScore } from "../hooks/useCreditScore";
import { useNotificationSync } from "../hooks/useNotificationSync";
import { useQuery } from "@tanstack/react-query";
import { request } from "graphql-request";
import { SUBGRAPH_URL, SUBGRAPH_HEADERS } from "../constants/constants";
import { GET_REFERRAL_REWARDS } from "../graphql/referralQueries";
import { transformCircles } from "../utils/circleTransformer";
import { client as thirdwebClient } from "../thirdwebClient";

/**
 * Global component to handle notification synchronization across all pages.
 * It fetches the necessary data once and runs the sync hook.
 * Since most hooks use React Query, data is cached and shared with individual pages.
 */
const GlobalNotificationSync: React.FC = () => {
  const account = useActiveAccount();

  // Fetch all necessary data for notification sync
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
    forfeitures,
    latePayments,
  } = useCircleSavings(thirdwebClient);

  const { goals } = usePersonalGoals(thirdwebClient);

  const { reputationHistory, categoryChanges } = useCreditScore();

  // Fetch referral rewards
  const { data: referralRewards } = useQuery({
    queryKey: ["referralRewards", account?.address],
    queryFn: async () => {
      if (!account?.address) return [];
      const result: any = await request(
        SUBGRAPH_URL,
        GET_REFERRAL_REWARDS,
        { userId: account.address.toLowerCase() },
        SUBGRAPH_HEADERS,
      );
      return result.referralRewardPaids || [];
    },
    enabled: !!account?.address,
  });

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
        [], // collateralReturns
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
    ],
  );

  // Transform transactions for notification sync
  const transformedTransactions = useMemo(() => {
    const txs: any[] = [];

    // Add contributions
    contributions.forEach((c) => {
      const circle = circles.find((cir) => cir.circleId === c.circleId);
      txs.push({
        id: c.id,
        type: "contribution_made",
        amount: `$${(Number(c.amount) / 1e18).toFixed(2)}`,
        circleName: circle?.circleName || "Circle",
        userId: c.user?.id || "",
        userName: c.user?.username || c.user?.fullName || "A member",
        round: String(c.round || "1"),
        timestamp: Number(c.timestamp),
      });
    });

    // Add payouts
    payouts.forEach((p) => {
      const circle = circles.find((cir) => cir.circleId === p.circleId);
      txs.push({
        id: p.id,
        type: "circle_payout",
        amount: `$${(Number(p.payoutAmount) / 1e18).toFixed(2)}`,
        circleName: circle?.circleName || "Circle",
        userId: p.user?.id || "",
        userName: p.user?.username || p.user?.fullName || "A member",
        round: String(p.round || "1"),
        timestamp: Number(p.timestamp),
      });
    });

    // Add late payments
    latePayments.forEach((lp: any) => {
      const circle = circles.find((cir) => cir.circleId === lp.circleId);
      txs.push({
        id: lp.id,
        type: "late_payment",
        amount: `$${(Number(lp.fee) / 1e18).toFixed(2)}`,
        circleName: circle?.circleName || "Circle",
        userId: lp.user?.id || "",
        userName: lp.user?.username || lp.user?.fullName || "A member",
        round: String(lp.round || "1"),
        timestamp: Number(lp.timestamp),
      });
    });

    // Add forfeitures
    forfeitures.forEach((f: any) => {
      const circle = circles.find((cir) => cir.circleId === f.circleId);
      txs.push({
        id: f.id,
        type: "member_forfeited",
        amount: `$${(Number(f.deductionAmount) / 1e18).toFixed(2)}`,
        circleName: circle?.circleName || "Circle",
        userId: f.forfeitedUser?.id || "",
        userName:
          f.forfeitedUser?.username || f.forfeitedUser?.fullName || "A member",
        round: String(f.round || "1"),
        timestamp: Number(f.timestamp),
      });
    });

    // Add collateral withdrawals
    collateralWithdrawals.forEach((cw: any) => {
      const circle = circles.find((cir) => cir.circleId === cw.circleId);
      txs.push({
        id: cw.id,
        type: "collateral_withdrawn",
        amount: `$${(Number(cw.amount) / 1e18).toFixed(2)}`,
        circleName: circle?.circleName || "Circle",
        userId: cw.user?.id,
        userName: cw.user?.username || cw.user?.fullName,
        timestamp: Number(cw.timestamp),
      });
    });

    return txs.sort((a, b) => b.timestamp - a.timestamp);
  }, [
    contributions,
    payouts,
    circles,
    latePayments,
    forfeitures,
    collateralWithdrawals,
  ]);

  // Sync notifications with app events
  useNotificationSync(
    transformedCircles,
    goals,
    transformedTransactions,
    reputationHistory,
    categoryChanges,
    referralRewards || [],
  );

  return null; // Component doesn't render anything
};

export default GlobalNotificationSync;
