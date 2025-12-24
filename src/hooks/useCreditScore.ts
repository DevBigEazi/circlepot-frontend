import { useState, useEffect, useMemo } from "react";
import { useActiveAccount } from "thirdweb/react";
import { useQuery } from "@tanstack/react-query";
import { gql, request } from "graphql-request";
import { SUBGRAPH_URL, SUBGRAPH_HEADERS } from "../constants/constants";

// GraphQL Query for Reputation Data
const reputationQuery = gql`
  query GetUserReputation($userId: Bytes!) {
    user(id: $userId) {
      id
      username
      fullName
      repCategory
      totalReputation
      totalLatePayments
      totalGoalsCompleted
      totalCirclesCompleted
    }

    # Reputation increases
    reputationIncreaseds(
      where: { user: $userId }
      orderBy: transaction__blockTimestamp
      orderDirection: desc
      first: 100
    ) {
      id
      user {
        id
        username
      }
      points
      reason
      transaction {
        blockTimestamp
        transactionHash
      }
    }

    # Reputation decreases
    reputationDecreaseds(
      where: { user: $userId }
      orderBy: transaction__blockTimestamp
      orderDirection: desc
      first: 100
    ) {
      id
      user {
        id
        username
      }
      points
      reason
      transaction {
        blockTimestamp
        transactionHash
      }
    }

    # Score category changes
    scoreCategoryChangeds(
      where: { user: $userId }
      orderBy: transaction__blockTimestamp
      orderDirection: desc
      first: 50
    ) {
      id
      user {
        id
        username
      }
      oldCategory
      newCategory
      transaction {
        blockTimestamp
        transactionHash
      }
    }

    # Circle completions
    circleCompleteds(
      where: { user: $userId }
      orderBy: transaction__blockTimestamp
      orderDirection: desc
      first: 100
    ) {
      id
      user {
        id
        username
      }
      circleId
      transaction {
        blockTimestamp
        transactionHash
      }
    }

    # Late payments
    latePaymentRecordeds(
      where: { user: $userId }
      orderBy: transaction__blockTimestamp
      orderDirection: desc
      first: 100
    ) {
      id
      user {
        id
        username
      }
      circleId
      round
      fee
      transaction {
        blockTimestamp
        transactionHash
      }
    }

    # Goal completions
    goalCompleteds(
      where: { user: $userId }
      orderBy: transaction__blockTimestamp
      orderDirection: desc
      first: 100
    ) {
      id
      user {
        id
        username
      }
      goalId
      transaction {
        blockTimestamp
        transactionHash
      }
    }
  }
`;

// Interfaces
export interface ReputationIncrease {
  id: string;
  points: bigint;
  reason: string;
  timestamp: bigint;
  transactionHash: string;
}

export interface ReputationDecrease {
  id: string;
  points: bigint;
  reason: string;
  timestamp: bigint;
  transactionHash: string;
}

export interface ScoreCategoryChange {
  id: string;
  oldCategory: number;
  newCategory: number;
  timestamp: bigint;
  transactionHash: string;
}

export interface CircleCompletion {
  id: string;
  circleId: bigint;
  timestamp: bigint;
  transactionHash: string;
}

export interface LatePaymentRecord {
  id: string;
  circleId: bigint;
  round: bigint;
  fee: bigint;
  timestamp: bigint;
  transactionHash: string;
}

export interface GoalCompletion {
  id: string;
  goalId: bigint;
  timestamp: bigint;
  transactionHash: string;
}

export interface CreditScore {
  score: number;
  category: ScoreCategory;
  categoryLabel: string;
  categoryColor: string;
  totalCirclesCompleted: number;
  totalGoalsCompleted: number;
  totalLatePayments: number;
}

export enum ScoreCategory {
  POOR = 0,
  FAIR = 1,
  GOOD = 2,
  VERY_GOOD = 3,
  EXCEPTIONAL = 4,
}

// Helper functions
const getCategoryLabel = (category: number): string => {
  switch (category) {
    case ScoreCategory.POOR:
      return "Poor (300-579)";
    case ScoreCategory.FAIR:
      return "Fair (580-669)";
    case ScoreCategory.GOOD:
      return "Good (670-739)";
    case ScoreCategory.VERY_GOOD:
      return "Very Good (740-799)";
    case ScoreCategory.EXCEPTIONAL:
      return "Exceptional (800-850)";
    default:
      return "Unknown";
  }
};

const getCategoryColor = (category: number): string => {
  switch (category) {
    case ScoreCategory.POOR:
      return "#EF4444"; // Red
    case ScoreCategory.FAIR:
      return "#F59E0B"; // Orange
    case ScoreCategory.GOOD:
      return "#10B981"; // Green
    case ScoreCategory.VERY_GOOD:
      return "#3B82F6"; // Blue
    case ScoreCategory.EXCEPTIONAL:
      return "#8B5CF6"; // Purple
    default:
      return "#6B7280"; // Gray
  }
};

export const useCreditScore = () => {
  const account = useActiveAccount();
  const [creditScore, setCreditScore] = useState<CreditScore | null>(null);
  const [reputationIncreases, setReputationIncreases] = useState<
    ReputationIncrease[]
  >([]);
  const [reputationDecreases, setReputationDecreases] = useState<
    ReputationDecrease[]
  >([]);
  const [categoryChanges, setCategoryChanges] = useState<ScoreCategoryChange[]>(
    []
  );
  const [circleCompletions, setCircleCompletions] = useState<
    CircleCompletion[]
  >([]);
  const [latePayments, setLatePayments] = useState<LatePaymentRecord[]>([]);
  const [goalCompletions, setGoalCompletions] = useState<GoalCompletion[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch reputation data from Subgraph
  const {
    data: reputationData,
    isLoading: isReputationLoading,
    refetch: refetchReputation,
  } = useQuery({
    queryKey: ["reputation", account?.address],
    async queryFn() {
      if (!account?.address) return null;

      try {
        const result: any = await request(
          SUBGRAPH_URL,
          reputationQuery,
          { userId: account.address.toLowerCase() },
          SUBGRAPH_HEADERS
        );

        return result;
      } catch (err) {
        throw err;
      }
    },
    enabled: !!account?.address,
  });

  // Update local state when subgraph data changes
  useEffect(() => {
    if (reputationData) {
      const user = reputationData.user;

      // Set credit score
      if (user) {
        const score = Number(user.totalReputation) || 0;
        const category = user.repCategory as ScoreCategory;

        setCreditScore({
          score,
          category,
          categoryLabel: getCategoryLabel(category),
          categoryColor: getCategoryColor(category),
          totalCirclesCompleted: Number(user.totalCirclesCompleted) || 0,
          totalGoalsCompleted: Number(user.totalGoalsCompleted) || 0,
          totalLatePayments: Number(user.totalLatePayments) || 0,
        });
      } else {
        // Default score for new users
        setCreditScore({
          score: 0,
          category: ScoreCategory.POOR,
          categoryLabel: getCategoryLabel(ScoreCategory.POOR),
          categoryColor: getCategoryColor(ScoreCategory.POOR),
          totalCirclesCompleted: 0,
          totalGoalsCompleted: 0,
          totalLatePayments: 0,
        });
      }

      // Process reputation increases
      const increases = (reputationData.reputationIncreaseds || []).map(
        (inc: any) => ({
          id: inc.id,
          points: BigInt(inc.points),
          reason: inc.reason,
          timestamp: BigInt(inc.transaction.blockTimestamp),
          transactionHash: inc.transaction.transactionHash,
        })
      );
      setReputationIncreases(increases);

      // Process reputation decreases
      const decreases = (reputationData.reputationDecreaseds || []).map(
        (dec: any) => ({
          id: dec.id,
          points: BigInt(dec.points),
          reason: dec.reason,
          timestamp: BigInt(dec.transaction.blockTimestamp),
          transactionHash: dec.transaction.transactionHash,
        })
      );
      setReputationDecreases(decreases);

      // Process category changes
      const changes = (reputationData.scoreCategoryChangeds || []).map(
        (change: any) => ({
          id: change.id,
          oldCategory: change.oldCategory,
          newCategory: change.newCategory,
          timestamp: BigInt(change.transaction.blockTimestamp),
          transactionHash: change.transaction.transactionHash,
        })
      );
      setCategoryChanges(changes);

      // Process circle completions
      const circles = (reputationData.circleCompleteds || []).map(
        (circle: any) => ({
          id: circle.id,
          circleId: BigInt(circle.circleId),
          timestamp: BigInt(circle.transaction.blockTimestamp),
          transactionHash: circle.transaction.transactionHash,
        })
      );
      setCircleCompletions(circles);

      // Process late payments
      const lates = (reputationData.latePaymentRecordeds || []).map(
        (late: any) => ({
          id: late.id,
          circleId: BigInt(late.circleId),
          round: BigInt(late.round),
          fee: BigInt(late.fee),
          timestamp: BigInt(late.transaction.blockTimestamp),
          transactionHash: late.transaction.transactionHash,
        })
      );
      setLatePayments(lates);

      // Process goal completions
      const goals = (reputationData.goalCompleteds || []).map((goal: any) => ({
        id: goal.id,
        goalId: BigInt(goal.goalId),
        timestamp: BigInt(goal.transaction.blockTimestamp),
        transactionHash: goal.transaction.transactionHash,
      }));
      setGoalCompletions(goals);

      setError(null);
    }
  }, [reputationData]);

  // Calculate reputation history (combined increases and decreases)
  const reputationHistory = useMemo(() => {
    const combined = [
      ...reputationIncreases.map((inc) => ({
        ...inc,
        type: "increase" as const,
      })),
      ...reputationDecreases.map((dec) => ({
        ...dec,
        type: "decrease" as const,
      })),
    ];

    // Sort by timestamp descending (most recent first)
    return combined.sort((a, b) => Number(b.timestamp - a.timestamp));
  }, [reputationIncreases, reputationDecreases]);

  // Calculate score progress percentage (300-850 range)
  const scoreProgress = useMemo(() => {
    if (!creditScore) return 0;
    const minScore = 300;
    const maxScore = 850;
    const range = maxScore - minScore;
    return ((creditScore.score - minScore) / range) * 100;
  }, [creditScore]);

  // Get next category threshold
  const nextCategoryThreshold = useMemo(() => {
    if (!creditScore) return null;

    const thresholds = [
      { category: ScoreCategory.FAIR, score: 580 },
      { category: ScoreCategory.GOOD, score: 670 },
      { category: ScoreCategory.VERY_GOOD, score: 740 },
      { category: ScoreCategory.EXCEPTIONAL, score: 800 },
    ];

    for (const threshold of thresholds) {
      if (creditScore.score < threshold.score) {
        return {
          category: threshold.category,
          score: threshold.score,
          pointsNeeded: threshold.score - creditScore.score,
        };
      }
    }

    return null; // Already at max
  }, [creditScore]);

  return {
    creditScore,
    reputationIncreases,
    reputationDecreases,
    categoryChanges,
    circleCompletions,
    latePayments,
    goalCompletions,
    reputationHistory,
    scoreProgress,
    nextCategoryThreshold,
    isLoading: isReputationLoading,
    error,
    refetchReputation,
  };
};
