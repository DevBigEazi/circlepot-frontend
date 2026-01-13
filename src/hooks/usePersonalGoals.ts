import { useState, useEffect, useCallback, useMemo } from "react";
import { useActiveAccount, useSendTransaction } from "thirdweb/react";
import { prepareContractCall, getContract } from "thirdweb";
import { defineChain } from "thirdweb/chains";
import { ThirdwebClient } from "thirdweb";
import { PERSONAL_SAVING_ABI } from "../abis/PersonalSavingsV1";
import { useQuery } from "@tanstack/react-query";
import { gql, request } from "graphql-request";
import { USDm_ABI } from "../abis/USDm";
import {
  CreateGoalParams,
  GoalContribution,
  GoalWithdrawal,
  PersonalGoal,
} from "../interfaces/interfaces";
import {
  SUBGRAPH_URL,
  SUBGRAPH_HEADERS,
  PERSONAL_SAVINGS_ADDRESS,
  USDm_ADDRESS,
  CHAIN_ID,
} from "../constants/constants";

const userGoalsQuery = gql`
  query GetUserGoals($userId: Bytes!) {
    # Query the CURRENT state of goals (mutable entity)
    personalGoals(
      where: { user: $userId }
      orderBy: updatedAt
      orderDirection: desc
    ) {
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
      contributionAmount
      frequency
      deadline
      isActive
      createdAt
      updatedAt
    }

    # Keep the historical events for activity tracking
    goalContributions(
      where: { user: $userId }
      orderBy: transaction__blockTimestamp
      orderDirection: desc
    ) {
      id
      user {
        id
      }
      amount
      goalId
      transaction {
        blockTimestamp
        transactionHash
      }
    }

    goalWithdrawns(
      where: { user: $userId }
      orderBy: transaction__blockTimestamp
      orderDirection: desc
    ) {
      id
      user {
        id
      }
      goalId
      amount
      penalty
      isActive
      transaction {
        blockTimestamp
        transactionHash
      }
    }
  }
`;

const singleGoalQuery = gql`
  query GetSingleGoal($goalId: BigInt!) {
    personalGoals(where: { goalId: $goalId }) {
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
      contributionAmount
      frequency
      deadline
      isActive
      createdAt
      updatedAt
    }
  }
`;

export const usePersonalGoals = (client: ThirdwebClient) => {
  const account = useActiveAccount();
  const { mutate: sendTransaction, isPending: isSending } =
    useSendTransaction();
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
        address: PERSONAL_SAVINGS_ADDRESS,
        abi: PERSONAL_SAVING_ABI,
      }),
    [client, chain]
  );

  // Fetch user goals from Subgraph
  const {
    data: goalsData,
    isLoading: isGoalsLoading,
    error: goalsDataError,
    refetch: refetchGoals,
  } = useQuery({
    queryKey: ["personalGoals", account?.address],
    async queryFn() {
      if (!account?.address) return null;

      try {
        const result = await request({
          url: SUBGRAPH_URL,
          document: userGoalsQuery,
          variables: { userId: account.address.toLowerCase() },
          requestHeaders: SUBGRAPH_HEADERS,
          signal: AbortSignal.timeout(5000),
        });
        return result;
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          throw new Error("Personal goals request timed out. Please check your connection.");
        }
        throw err;
      }
    },
    enabled: !!account?.address,
    retry: 0,
  });

  const queryError = useMemo(() => {
    // If we have an error, show it regardless of loading state
    if (goalsDataError) return (goalsDataError as any)?.message || "Data server error";
    if (isGoalsLoading) return null;
    return null;
  }, [goalsDataError, isGoalsLoading]);

  // Update local state when subgraph data changes
  useEffect(() => {
    if (goalsData) {
      // Process goals
      const processedGoals = goalsData.personalGoals.map((goal: any) => ({
        id: goal.id,
        goalId: BigInt(goal.goalId),
        goalName: goal.goalName,
        goalAmount: BigInt(goal.goalAmount),
        contributionAmount: BigInt(goal.contributionAmount),
        currentAmount: BigInt(goal.currentAmount),
        frequency: goal.frequency,
        deadline: BigInt(goal.deadline),
        isActive: goal.isActive,
        createdAt: BigInt(goal.createdAt),
        user: goal.user,
      }));
      setGoals(processedGoals);

      // Process contributions
      const processedContributions = goalsData.goalContributions.map(
        (contrib: any) => {
          // Find the goal name from the CURRENT goals array
          const relatedGoal = goalsData.personalGoals.find(
            (g: any) => g.goalId === contrib.goalId
          );

          return {
            id: contrib.id,
            amount: BigInt(contrib.amount),
            goalId: BigInt(contrib.goalId),
            goalName: relatedGoal?.goalName || "Unknown Goal",
            timestamp: BigInt(contrib.transaction.blockTimestamp),
          };
        }
      );
      setContributions(processedContributions);

      // Process withdrawals
      const processedWithdrawals = goalsData.goalWithdrawns.map(
        (withdrawal: any) => {
          // Find the goal name from the CURRENT goals array
          const relatedGoal = goalsData.personalGoals.find(
            (g: any) => g.goalId === withdrawal.goalId
          );

          return {
            id: withdrawal.id,
            goalId: BigInt(withdrawal.goalId),
            goalName: relatedGoal?.goalName || "Unknown Goal",
            amount: BigInt(withdrawal.amount),
            penalty: BigInt(withdrawal.penalty),
            timestamp: BigInt(withdrawal.transaction.blockTimestamp),
          };
        }
      );
      setWithdrawals(processedWithdrawals);

      setError(null);
    }
  }, [goalsData]);

  // Create personal goal
  const createPersonalGoal = useCallback(
    async (params: CreateGoalParams) => {
      if (!account?.address) {
        const error = "No wallet connected";
        throw new Error(error);
      }

      try {
        setError(null);

        // First, approve tokens
        const approveTx = prepareContractCall({
          contract: getContract({
            client,
            chain,
            address: USDm_ADDRESS,
            abi: USDm_ABI,
          }),
          method: "approve",
          params: [PERSONAL_SAVINGS_ADDRESS, params.contributionAmount],
        });

        return new Promise((resolve, reject) => {
          sendTransaction(approveTx, {
            onSuccess: () => {
              // After approval succeeds, create the goal
              setTimeout(() => {
                const createTransaction = prepareContractCall({
                  contract,
                  method: "createPersonalGoal",
                  params: [params],
                });

                sendTransaction(createTransaction, {
                  onSuccess: (receipt) => {
                    setTimeout(() => refetchGoals(), 3000);
                    resolve(receipt);
                  },
                  onError: (error: any) => {
                    const errorMsg =
                      error?.message ||
                      error?.toString() ||
                      "Transaction failed";
                    setError(errorMsg);
                    reject(new Error(errorMsg));
                  },
                });
              }, 1500);
            },
            onError: (error: any) => {
              const errorMsg =
                error?.message || error?.toString() || "Approval failed";
              setError(errorMsg);
              reject(new Error(errorMsg));
            },
          });
        });
      } catch (err) {
        const error = err as Error;
        setError(error.message || "Failed to create goal");
        throw err;
      }
    },
    [account?.address, contract, sendTransaction, refetchGoals, client, chain]
  );

  // Contribute to goal
  const contributeToGoal = useCallback(
    async (goalId: bigint, contributionAmount: bigint) => {
      if (!account?.address) {
        throw new Error("No wallet connected");
      }

      try {
        setError(null);

        // First, approve tokens
        const approveTx = prepareContractCall({
          contract: getContract({
            client,
            chain,
            address: USDm_ADDRESS,
            abi: USDm_ABI,
          }),
          method: "approve",
          params: [PERSONAL_SAVINGS_ADDRESS, contributionAmount],
        });

        return new Promise((resolve, reject) => {
          sendTransaction(approveTx, {
            onSuccess: () => {
              setTimeout(() => {
                const contributeTransaction = prepareContractCall({
                  contract,
                  method: "contributeToGoal",
                  params: [goalId],
                });

                sendTransaction(contributeTransaction, {
                  onSuccess: (receipt) => {
                    setTimeout(() => refetchGoals(), 3000);
                    resolve(receipt);
                  },
                  onError: (error: any) => {
                    const errorMsg =
                      error?.message ||
                      error?.toString() ||
                      "Contribution failed";
                    setError(errorMsg);
                    reject(new Error(errorMsg));
                  },
                });
              }, 1500);
            },
            onError: (error: any) => {
              const errorMsg =
                error?.message || error?.toString() || "Approval failed";
              setError(errorMsg);
              reject(new Error(errorMsg));
            },
          });
        });
      } catch (err) {
        const error = err as Error;
        setError(error.message || "Failed to contribute");
        throw err;
      }
    },
    [account?.address, contract, sendTransaction, refetchGoals, client, chain]
  );

  // Withdraw from goal
  const withdrawFromGoal = useCallback(
    async (goalId: bigint, amount: bigint) => {
      if (!account?.address) {
        throw new Error("No wallet connected");
      }

      try {
        setError(null);

        const withdrawTransaction = prepareContractCall({
          contract,
          method: "withdrawFromGoal",
          params: [goalId, amount],
        });

        return new Promise((resolve, reject) => {
          sendTransaction(withdrawTransaction, {
            onSuccess: (receipt) => {
              setTimeout(() => refetchGoals(), 3000);
              resolve(receipt);
            },
            onError: (error) => {
              setError(error.message);
              reject(error);
            },
          });
        });
      } catch (err) {
        const error = err as Error;
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

        const completeTransaction = prepareContractCall({
          contract,
          method: "completeGoal",
          params: [goalId],
        });

        return new Promise((resolve, reject) => {
          sendTransaction(completeTransaction, {
            onSuccess: (receipt) => {
              setTimeout(() => refetchGoals(), 3000);
              resolve(receipt);
            },
            onError: (error) => {
              setError(error.message);
              reject(error);
            },
          });
        });
      } catch (err) {
        const error = err as Error;
        setError(error.message || "Failed to complete goal");
        throw err;
      }
    },
    [account?.address, contract, sendTransaction, refetchGoals]
  );

  // Get single goal by ID
  const getGoalById = useCallback(async (goalId: string) => {
    try {
      const result = await request(
        SUBGRAPH_URL,
        singleGoalQuery,
        { goalId },
        SUBGRAPH_HEADERS
      );

      if (result.personalGoals && result.personalGoals.length > 0) {
        const goal = result.personalGoals[0];
        return {
          id: goal.id,
          goalId: BigInt(goal.goalId),
          goalName: goal.goalName,
          goalAmount: BigInt(goal.goalAmount),
          contributionAmount: BigInt(goal.contributionAmount),
          currentAmount: BigInt(goal.currentAmount),
          frequency: goal.frequency,
          deadline: BigInt(goal.deadline),
          isActive: goal.isActive,
          createdAt: BigInt(goal.createdAt),
          user: goal.user,
        };
      }
      return null;
    } catch (err) {
      throw err;
    }
  }, []);

  return {
    goals,
    contributions,
    withdrawals,
    isLoading: isGoalsLoading,
    isTransacting: isSending,
    error: error || queryError,
    createPersonalGoal,
    contributeToGoal,
    withdrawFromGoal,
    completeGoal,
    getGoalById,
    refreshGoals: refetchGoals,
    contract,
  };
};
