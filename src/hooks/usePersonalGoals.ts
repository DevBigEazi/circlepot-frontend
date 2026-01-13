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
      isYieldEnabled
      token
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

    # Vault updates to check yield availability
    vaultUpdateds(
      where: { contractType: "PERSONAL_SAVINGS" }
      orderBy: transaction__blockTimestamp
      orderDirection: desc
    ) {
      id
      token
      newVault
      transaction {
        blockTimestamp
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
      isYieldEnabled
      token
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
  const [vaults, setVaults] = useState<Record<string, string>>({});
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

  const checkVaultAddress = useCallback(
    async (token: string) => {
      // First check local state from subgraph
      const lowerToken = token.toLowerCase();
      if (vaults[lowerToken]) {
        return vaults[lowerToken];
      }

      // Fallback to contract call if not in subgraph or not yet loaded
      try {
        const { readContract } = await import("thirdweb");
        const vault = await readContract({
          contract,
          method: "tokenVaults",
          params: [token],
        });
        return vault as string;
      } catch (err) {
        console.error("Error checking vault address:", err);
        return "0x0000000000000000000000000000000000000000";
      }
    },
    [contract, vaults]
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
          signal: AbortSignal.timeout(10000),
        });
        console.log("Personal Goals Subgraph Data:", result);
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
      try {
        // Process goals
        if (goalsData.personalGoals) {
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
            isYieldEnabled: goal.isYieldEnabled,
            token: goal.token,
            createdAt: BigInt(goal.createdAt),
            user: goal.user,
          }));
          setGoals(processedGoals);
        }

        // Process contributions
        if (goalsData.goalContributions) {
          const processedContributions = goalsData.goalContributions.map(
            (contrib: any) => {
              const relatedGoal = goalsData.personalGoals?.find(
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
        }

        // Process withdrawals
        if (goalsData.goalWithdrawns) {
          const processedWithdrawals = goalsData.goalWithdrawns.map(
            (withdrawal: any) => {
              const relatedGoal = goalsData.personalGoals?.find(
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
        }

        // Process vaults correctly - take the latest for each token
        const processedVaults: Record<string, string> = {};
        if (goalsData.vaultUpdateds && goalsData.vaultUpdateds.length > 0) {
          console.log("VaultUpdated Entity Sample:", goalsData.vaultUpdateds[0]);
          goalsData.vaultUpdateds.forEach((v: any) => {
            const token = v.token.toLowerCase();
            if (!processedVaults[token]) {
              processedVaults[token] = v.newVault;
            }
          });
        }
        console.log("Processed Vaults:", processedVaults);
        setVaults(processedVaults);
        setError(null);
      } catch (err) {
        console.error("Error processing subgraph data:", err);
        setError("Error processing goal data");
      }
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
            address: params.token || USDm_ADDRESS,
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
    async (goalId: bigint, contributionAmount: bigint, tokenAddress?: string) => {
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
            address: tokenAddress || USDm_ADDRESS,
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
          isYieldEnabled: goal.isYieldEnabled,
          token: goal.token,
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
    isFetching: !!goalsData && !isGoalsLoading, // Useful for showing subtle loading states
    isTransacting: isSending,
    error: error, // Mutation error
    queryError: queryError, // Query error
    createPersonalGoal,
    contributeToGoal,
    withdrawFromGoal,
    completeGoal,
    getGoalById,
    checkVaultAddress,
    refreshGoals: refetchGoals,
    contract,
    vaults,
  };
};
