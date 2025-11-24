import { useState, useEffect, useCallback, useMemo } from "react";
import { useActiveAccount, useSendTransaction } from "thirdweb/react";
import { prepareContractCall, getContract } from "thirdweb";
import { defineChain } from "thirdweb/chains";
import { ThirdwebClient } from "thirdweb";
import { PERSONAL_SAVING_ABI } from "../abis/PersonalSavingsV1";
import { useQuery } from "@tanstack/react-query";
import { gql, request } from "graphql-request";

const SUBGRAPH_URL = import.meta.env.VITE_SUBGRAPH_URL;
const SUBGRAPH_HEADERS = { Authorization: "Bearer {api-key}" };

const userGoalsQuery = gql`
  query GetUserGoals($userId: Bytes!) {
    personalGoalCreateds(where: { user: $userId }, orderBy: transaction__blockTimestamp, orderDirection: desc) {
      id
      user {
        id
        username
        fullName
      }
      goalId
      goalName
      goalAmount
      currentAmount
      isActive
      transaction {
        blockTimestamp
        transactionHash
      }
    }
    goalContributions(where: { user: $userId }, orderBy: transaction__blockTimestamp, orderDirection: desc) {
      id
      user {
        id
      }
      amount
      goal {
        id
        goalId
        goalName
      }
      transaction {
        blockTimestamp
        transactionHash
      }
    }
    goalWithdrawns(where: { user: $userId }, orderBy: transaction__blockTimestamp, orderDirection: desc) {
      id
      user {
        id
      }
      goal {
        id
        goalId
        goalName
      }
      amount
      penalty
      transaction {
        blockTimestamp
        transactionHash
      }
    }
  }
`;

const singleGoalQuery = gql`
  query GetSingleGoal($goalId: String!) {
    personalGoalCreateds(where: { goalId: $goalId }) {
      id
      user {
        id
        username
        fullName
      }
      goalId
      goalName
      goalAmount
      currentAmount
      isActive
      transaction {
        blockTimestamp
        transactionHash
      }
    }
  }
`;

interface PersonalGoal {
  id: string;
  goalId: bigint;
  goalName: string;
  goalAmount: bigint;
  currentAmount: bigint;
  isActive: boolean;
  createdAt: bigint;
  user: {
    id: string;
    username: string;
    fullName: string;
  };
}

interface GoalContribution {
  id: string;
  amount: bigint;
  goalId: bigint;
  goalName: string;
  timestamp: bigint;
}

interface GoalWithdrawal {
  id: string;
  goalId: bigint;
  goalName: string;
  amount: bigint;
  penalty: bigint;
  timestamp: bigint;
}

interface CreateGoalParams {
  name: string;
  targetAmount: bigint;
  contributionAmount: bigint;
  frequency: 0 | 1 | 2; // 0 = Daily, 1 = Weekly, 2 = Monthly
  deadline: bigint;
}

const CONTRACT_ADDRESS = import.meta.env.VITE_PERSONAL_SAVINGS_ADDRESS;
const CHAIN_ID = 11142220; // Celo-Sepolia testnet

export const usePersonalGoals = (client: ThirdwebClient) => {
  const account = useActiveAccount();
  const { mutate: sendTransaction, isPending: isSending } = useSendTransaction();
  const [goals, setGoals] = useState<PersonalGoal[]>([]);
  const [contributions, setContributions] = useState<GoalContribution[]>([]);
  const [withdrawals, setWithdrawals] = useState<GoalWithdrawal[]>([]);
  const [error, setError] = useState<string | null>(null);

  const chain = useMemo(() => defineChain(CHAIN_ID), []);

  const contract = useMemo(
    () =>
      getContract({
        client,
        chain,
        address: CONTRACT_ADDRESS,
        abi: PERSONAL_SAVING_ABI,
      }),
    [client, chain]
  );

  // Fetch user goals from Subgraph
  const {
    data: goalsData,
    isLoading: isGoalsLoading,
    refetch: refetchGoals,
  } = useQuery({
    queryKey: ["personalGoals", account?.address],
    async queryFn() {
      if (!account?.address) return null;

      try {
        const result = await request(
          SUBGRAPH_URL,
          userGoalsQuery,
          { userId: account.address.toLowerCase() },
          SUBGRAPH_HEADERS
        );
        return result;
      } catch (err) {
        console.error("❌ [PersonalGoals] Error fetching from Subgraph:", err);
        throw err;
      }
    },
    enabled: !!account?.address,
  });

  // Update local state when subgraph data changes
  useEffect(() => {
    if (goalsData) {
      // Process goals
      const processedGoals = goalsData.personalGoalCreateds.map((goal: any) => ({
        id: goal.id,
        goalId: BigInt(goal.goalId),
        goalName: goal.goalName,
        goalAmount: BigInt(goal.goalAmount),
        currentAmount: BigInt(goal.currentAmount),
        isActive: goal.isActive,
        createdAt: BigInt(goal.transaction.blockTimestamp),
        user: goal.user,
      }));
      setGoals(processedGoals);

      // Process contributions
      const processedContributions = goalsData.goalContributions.map((contrib: any) => ({
        id: contrib.id,
        amount: BigInt(contrib.amount),
        goalId: BigInt(contrib.goal.goalId),
        goalName: contrib.goal.goalName,
        timestamp: BigInt(contrib.transaction.blockTimestamp),
      }));
      setContributions(processedContributions);

      // Process withdrawals
      const processedWithdrawals = goalsData.goalWithdrawns.map((withdrawal: any) => ({
        id: withdrawal.id,
        goalId: BigInt(withdrawal.goal.goalId),
        goalName: withdrawal.goal.goalName,
        amount: BigInt(withdrawal.amount),
        penalty: BigInt(withdrawal.penalty),
        timestamp: BigInt(withdrawal.transaction.blockTimestamp),
      }));
      setWithdrawals(processedWithdrawals);

      setError(null);
    }
  }, [goalsData]);

  // Create personal goal
  const createPersonalGoal = useCallback(
    async (params: CreateGoalParams) => {
      if (!account?.address) {
        const error = "No wallet connected";
        console.error("❌ [PersonalGoals] Create goal failed:", error);
        throw new Error(error);
      }

      try {
        setError(null);

        // Log incoming params for debugging
        console.log('📥 [PersonalGoals] Received params:', {
          name: params.name,
          targetAmount: params.targetAmount.toString(),
          contributionAmount: params.contributionAmount.toString(),
          frequency: params.frequency,
          deadline: params.deadline.toString()
        });

        console.log("📝 [PersonalGoals] Creating personal goal...");
        const createTransaction = prepareContractCall({
          contract,
          method: "createPersonalGoal",
          params: [params],
        });

        return new Promise((resolve, reject) => {
          sendTransaction(createTransaction, {
            onSuccess: (receipt) => {
              console.log("✅ [PersonalGoals] Goal created:", receipt);
              // Refetch goals after successful creation
              setTimeout(() => refetchGoals(), 3000);
              resolve(receipt);
            },
            onError: (error: any) => {
              console.error("❌ [PersonalGoals] Transaction failed:", error);
              const errorMsg = error?.message || error?.toString() || "Transaction failed";
              setError(errorMsg);
              reject(new Error(errorMsg));
            },
          });
        });
      } catch (err) {
        const error = err as Error;
        console.error("❌ [PersonalGoals] Error creating goal:", error);
        setError(error.message || "Failed to create goal");
        throw err;
      }
    },
    [account?.address, contract, sendTransaction, refetchGoals]
  );

  // Contribute to goal
  const contributeToGoal = useCallback(
    async (goalId: bigint) => {
      if (!account?.address) {
        throw new Error("No wallet connected");
      }

      try {
        setError(null);

        console.log("📝 [PersonalGoals] Contributing to goal...");
        const contributeTransaction = prepareContractCall({
          contract,
          method: "contributeToGoal",
          params: [goalId],
        });

        return new Promise((resolve, reject) => {
          sendTransaction(contributeTransaction, {
            onSuccess: (receipt) => {
              console.log("✅ [PersonalGoals] Contribution successful:", receipt);
              setTimeout(() => refetchGoals(), 3000);
              resolve(receipt);
            },
            onError: (error: any) => {
              console.error("❌ [PersonalGoals] Contribution failed:", error);
              const errorMsg = error?.message || error?.toString() || "Contribution failed";
              setError(errorMsg);
              reject(new Error(errorMsg));
            },
          });
        });
      } catch (err) {
        const error = err as Error;
        console.error("❌ [PersonalGoals] Error contributing:", error);
        setError(error.message || "Failed to contribute");
        throw err;
      }
    },
    [account?.address, contract, sendTransaction, refetchGoals]
  );

  // Withdraw from goal
  const withdrawFromGoal = useCallback(
    async (goalId: bigint, amount: bigint) => {
      if (!account?.address) {
        throw new Error("No wallet connected");
      }

      try {
        setError(null);

        console.log("📝 [PersonalGoals] Withdrawing from goal...");
        const withdrawTransaction = prepareContractCall({
          contract,
          method: "withdrawFromGoal",
          params: [goalId, amount],
        });

        return new Promise((resolve, reject) => {
          sendTransaction(withdrawTransaction, {
            onSuccess: (receipt) => {
              console.log("✅ [PersonalGoals] Withdrawal successful:", receipt);
              setTimeout(() => refetchGoals(), 3000);
              resolve(receipt);
            },
            onError: (error) => {
              console.error("❌ [PersonalGoals] Withdrawal failed:", error);
              setError(error.message);
              reject(error);
            },
          });
        });
      } catch (err) {
        const error = err as Error;
        console.error("❌ [PersonalGoals] Error withdrawing:", error);
        setError(error.message || "Failed to withdraw");
        throw err;
      }
    },
    [account?.address, contract, sendTransaction, refetchGoals]
  );

  // Complete goal
  const completeGoal = useCallback(
    async (goalId: bigint) => {
      if (!account?.address) {
        throw new Error("No wallet connected");
      }

      try {
        setError(null);

        console.log("📝 [PersonalGoals] Completing goal...");
        const completeTransaction = prepareContractCall({
          contract,
          method: "completeGoal",
          params: [goalId],
        });

        return new Promise((resolve, reject) => {
          sendTransaction(completeTransaction, {
            onSuccess: (receipt) => {
              console.log("✅ [PersonalGoals] Goal completed:", receipt);
              setTimeout(() => refetchGoals(), 3000);
              resolve(receipt);
            },
            onError: (error) => {
              console.error("❌ [PersonalGoals] Goal completion failed:", error);
              setError(error.message);
              reject(error);
            },
          });
        });
      } catch (err) {
        const error = err as Error;
        console.error("❌ [PersonalGoals] Error completing goal:", error);
        setError(error.message || "Failed to complete goal");
        throw err;
      }
    },
    [account?.address, contract, sendTransaction, refetchGoals]
  );

  // Get single goal by ID
  const getGoalById = useCallback(
    async (goalId: string) => {
      try {
        const result = await request(
          SUBGRAPH_URL,
          singleGoalQuery,
          { goalId },
          SUBGRAPH_HEADERS
        );

        if (result.personalGoalCreateds && result.personalGoalCreateds.length > 0) {
          const goal = result.personalGoalCreateds[0];
          return {
            id: goal.id,
            goalId: BigInt(goal.goalId),
            goalName: goal.goalName,
            goalAmount: BigInt(goal.goalAmount),
            currentAmount: BigInt(goal.currentAmount),
            isActive: goal.isActive,
            createdAt: BigInt(goal.transaction.blockTimestamp),
            user: goal.user,
          };
        }
        return null;
      } catch (err) {
        console.error("❌ [PersonalGoals] Error fetching goal:", err);
        throw err;
      }
    },
    []
  );

  return {
    goals,
    contributions,
    withdrawals,
    isLoading: isGoalsLoading || isSending,
    error,
    createPersonalGoal,
    contributeToGoal,
    withdrawFromGoal,
    completeGoal,
    getGoalById,
    refreshGoals: refetchGoals,
    contract,
  };
};