import { useState, useEffect, useCallback, useMemo } from "react";
import { useActiveAccount, useSendTransaction } from "thirdweb/react";
import { prepareContractCall, getContract } from "thirdweb";
import { defineChain } from "thirdweb/chains";
import { ThirdwebClient } from "thirdweb";
import { CIRCLE_SAVINGS_ABI } from "../abis/CircleSavingsV1";
import { useQuery } from "@tanstack/react-query";
import { gql, request } from "graphql-request";
import { CUSD_ABI } from "../abis/Cusd";

const SUBGRAPH_URL = import.meta.env.VITE_SUBGRAPH_URL;
const SUBGRAPH_HEADERS = { Authorization: "Bearer {api-key}" };

// GraphQL Queries
const userCirclesQuery = gql`
  query GetUserCircles($userId: Bytes!) {
    circleCreateds(where: { user: $userId }, orderBy: transaction__blockTimestamp, orderDirection: desc) {
      id
      user {
        id
        username
        fullName
      }
      circleId
      circleName
      circleDescription
      circleContributionAmount
      collateralAmount
      circleFrequency
      circleMaxMembers
      circleVisibility
      circleCreatedAt
      transaction {
        blockTimestamp
        transactionHash
      }
    }
    circleJoineds(where: { user: $userId }, orderBy: transaction__blockTimestamp, orderDirection: desc) {
      id
      circleId
      user {
        id
      }
      currentMembers
      circleState
      transaction {
        blockTimestamp
        transactionHash
      }
    }
    contributionMades(where: { user: $userId }, orderBy: transaction__blockTimestamp, orderDirection: desc) {
      id
      user {
        id
      }
      circleId
      round
      amount
      transaction {
        blockTimestamp
        transactionHash
      }
    }
    payoutDistributeds(where: { user: $userId }, orderBy: transaction__blockTimestamp, orderDirection: desc) {
      id
      user {
        id
      }
      circleId
      round
      payoutAmount
      transaction {
        blockTimestamp
        transactionHash
      }
    }
  }
`;

const singleCircleQuery = gql`
  query GetSingleCircle($circleId: String!) {
    circleCreateds(where: { circleId: $circleId }) {
      id
      user {
        id
        username
        fullName
      }
      circleId
      circleName
      circleDescription
      circleContributionAmount
      collateralAmount
      circleFrequency
      circleMaxMembers
      circleVisibility
      circleCreatedAt
      transaction {
        blockTimestamp
        transactionHash
      }
    }
  }
`;

// TypeScript Interfaces
interface Circle {
  id: string;
  circleId: bigint;
  circleName: string;
  circleDescription: string;
  contributionAmount: bigint;
  collateralAmount: bigint;
  frequency: 0 | 1 | 2; // DAILY, WEEKLY, MONTHLY
  maxMembers: bigint;
  visibility: 0 | 1; // PRIVATE, PUBLIC
  createdAt: bigint;
  creator: {
    id: string;
    username: string;
    fullName: string;
  };
}

interface CircleJoined {
  id: string;
  circleId: bigint;
  currentMembers: bigint;
  circleState: number;
  timestamp: bigint;
}

interface Contribution {
  id: string;
  circleId: bigint;
  round: bigint;
  amount: bigint;
  timestamp: bigint;
}

interface Payout {
  id: string;
  circleId: bigint;
  round: bigint;
  payoutAmount: bigint;
  timestamp: bigint;
}

interface CreateCircleParams {
  title: string;
  description: string;
  contributionAmount: bigint;
  frequency: 0 | 1 | 2;
  maxMembers: bigint;
  visibility: 0 | 1;
}

const CONTRACT_ADDRESS = import.meta.env.VITE_CIRCLE_SAVINGS_ADDRESS;
const CUSD_ADDRESS = import.meta.env.VITE_CUSD_ADDRESS;
const CHAIN_ID = 11142220; // Celo-Sepolia testnet

export const useCircleSavings = (client: ThirdwebClient) => {
  const account = useActiveAccount();
  const { mutate: sendTransaction, isPending: isSending } = useSendTransaction();
  const [circles, setCircles] = useState<Circle[]>([]);
  const [joinedCircles, setJoinedCircles] = useState<CircleJoined[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [error, setError] = useState<string | null>(null);

  const chain = useMemo(() => defineChain(CHAIN_ID), []);

  const contract = useMemo(
    () =>
      getContract({
        client,
        chain,
        address: CONTRACT_ADDRESS,
        abi: CIRCLE_SAVINGS_ABI,
      }),
    [client, chain]
  );

  // Fetch user circles from Subgraph
  const {
    data: circlesData,
    isLoading: isCirclesLoading,
    refetch: refetchCircles,
  } = useQuery({
    queryKey: ["circleSavings", account?.address],
    async queryFn() {
      if (!account?.address) return null;

      try {
        const result = await request(
          SUBGRAPH_URL,
          userCirclesQuery,
          { userId: account.address.toLowerCase() },
          SUBGRAPH_HEADERS
        );
        return result;
      } catch (err) {
        console.error("❌ [CircleSavings] Error fetching from Subgraph:", err);
        throw err;
      }
    },
    enabled: !!account?.address,
  });

  // Update local state when subgraph data changes
  useEffect(() => {
    if (circlesData) {
      // Process circles
      const processedCircles = circlesData.circleCreateds.map((circle: any) => ({
        id: circle.id,
        circleId: BigInt(circle.circleId),
        circleName: circle.circleName,
        circleDescription: circle.circleDescription,
        contributionAmount: BigInt(circle.circleContributionAmount),
        collateralAmount: BigInt(circle.collateralAmount),
        frequency: circle.circleFrequency,
        maxMembers: BigInt(circle.circleMaxMembers),
        visibility: circle.circleVisibility,
        createdAt: BigInt(circle.circleCreatedAt),
        creator: circle.user,
      }));
      setCircles(processedCircles);

      // Process joined circles
      const processedJoined = circlesData.circleJoineds.map((joined: any) => ({
        id: joined.id,
        circleId: BigInt(joined.circleId),
        currentMembers: BigInt(joined.currentMembers),
        circleState: joined.circleState,
        timestamp: BigInt(joined.transaction.blockTimestamp),
      }));
      setJoinedCircles(processedJoined);

      // Process contributions
      const processedContributions = circlesData.contributionMades.map((contrib: any) => ({
        id: contrib.id,
        circleId: BigInt(contrib.circleId),
        round: BigInt(contrib.round),
        amount: BigInt(contrib.amount),
        timestamp: BigInt(contrib.transaction.blockTimestamp),
      }));
      setContributions(processedContributions);

      // Process payouts
      const processedPayouts = circlesData.payoutDistributeds.map((payout: any) => ({
        id: payout.id,
        circleId: BigInt(payout.circleId),
        round: BigInt(payout.round),
        payoutAmount: BigInt(payout.payoutAmount),
        timestamp: BigInt(payout.transaction.blockTimestamp),
      }));
      setPayouts(processedPayouts);

      setError(null);
    }
  }, [circlesData]);

  // Create circle
  const createCircle = useCallback(
    async (params: CreateCircleParams) => {
      if (!account?.address) {
        const error = "No wallet connected";
        console.error("❌ [CircleSavings] Create circle failed:", error);
        throw new Error(error);
      }

      try {
        setError(null);

        console.log('📥 [CircleSavings] Creating circle with params:', {
          title: params.title,
          contributionAmount: params.contributionAmount.toString(),
          maxMembers: params.maxMembers.toString(),
          frequency: params.frequency,
          visibility: params.visibility
        });

        // Calculate collateral + visibility fee if public
        const totalCommitment = params.contributionAmount * params.maxMembers;
        const lateBuffer = (totalCommitment * 100n) / 10000n; // 1% late fee buffer
        const collateral = totalCommitment + lateBuffer;
        const visibilityFee = params.visibility === 1 ? BigInt("500000000000000000") : 0n; // 0.5 cUSD
        const totalRequired = collateral + visibilityFee;

        // First, approve tokens
        console.log("📝 [CircleSavings] Approving cUSD tokens...");
        const approveTx = prepareContractCall({
          contract: getContract({
            client,
            chain,
            address: CUSD_ADDRESS,
            abi: CUSD_ABI,
          }),
          method: "approve",
          params: [CONTRACT_ADDRESS, totalRequired],
        });

        return new Promise((resolve, reject) => {
          sendTransaction(approveTx, {
            onSuccess: () => {
              console.log("✅ [CircleSavings] Approval successful, now creating circle...");
              
              setTimeout(() => {
                const createTransaction = prepareContractCall({
                  contract,
                  method: "createCircle",
                  params: [params],
                });

                sendTransaction(createTransaction, {
                  onSuccess: (receipt) => {
                    console.log("✅ [CircleSavings] Circle created:", receipt);
                    setTimeout(() => refetchCircles(), 3000);
                    resolve(receipt);
                  },
                  onError: (error: any) => {
                    console.error("❌ [CircleSavings] Circle creation failed:", error);
                    const errorMsg = error?.message || error?.toString() || "Transaction failed";
                    setError(errorMsg);
                    reject(new Error(errorMsg));
                  },
                });
              }, 1500);
            },
            onError: (error: any) => {
              console.error("❌ [CircleSavings] Approval failed:", error);
              const errorMsg = error?.message || error?.toString() || "Approval failed";
              setError(errorMsg);
              reject(new Error(errorMsg));
            },
          });
        });
      } catch (err) {
        const error = err as Error;
        console.error("❌ [CircleSavings] Error creating circle:", error);
        setError(error.message || "Failed to create circle");
        throw err;
      }
    },
    [account?.address, contract, sendTransaction, refetchCircles, client, chain]
  );

  // Join circle
  const joinCircle = useCallback(
    async (circleId: bigint, collateralAmount: bigint) => {
      if (!account?.address) {
        throw new Error("No wallet connected");
      }

      try {
        setError(null);

        console.log("📝 [CircleSavings] Approving cUSD for joining circle...");
        const approveTx = prepareContractCall({
          contract: getContract({
            client,
            chain,
            address: CUSD_ADDRESS,
            abi: CUSD_ABI,
          }),
          method: "approve",
          params: [CONTRACT_ADDRESS, collateralAmount],
        });

        return new Promise((resolve, reject) => {
          sendTransaction(approveTx, {
            onSuccess: () => {
              console.log("✅ [CircleSavings] Approval successful, now joining...");
              
              setTimeout(() => {
                const joinTransaction = prepareContractCall({
                  contract,
                  method: "joinCircle",
                  params: [circleId],
                });

                sendTransaction(joinTransaction, {
                  onSuccess: (receipt) => {
                    console.log("✅ [CircleSavings] Joined circle successfully:", receipt);
                    setTimeout(() => refetchCircles(), 3000);
                    resolve(receipt);
                  },
                  onError: (error: any) => {
                    console.error("❌ [CircleSavings] Join failed:", error);
                    const errorMsg = error?.message || error?.toString() || "Join failed";
                    setError(errorMsg);
                    reject(new Error(errorMsg));
                  },
                });
              }, 1500);
            },
            onError: (error: any) => {
              console.error("❌ [CircleSavings] Approval failed:", error);
              const errorMsg = error?.message || error?.toString() || "Approval failed";
              setError(errorMsg);
              reject(new Error(errorMsg));
            },
          });
        });
      } catch (err) {
        const error = err as Error;
        console.error("❌ [CircleSavings] Error joining circle:", error);
        setError(error.message || "Failed to join circle");
        throw err;
      }
    },
    [account?.address, contract, sendTransaction, refetchCircles, client, chain]
  );

  // Contribute to circle
  const contribute = useCallback(
    async (circleId: bigint, contributionAmount: bigint) => {
      if (!account?.address) {
        throw new Error("No wallet connected");
      }

      try {
        setError(null);

        console.log("📝 [CircleSavings] Approving cUSD for contribution...");
        const approveTx = prepareContractCall({
          contract: getContract({
            client,
            chain,
            address: CUSD_ADDRESS,
            abi: CUSD_ABI,
          }),
          method: "approve",
          params: [CONTRACT_ADDRESS, contributionAmount],
        });

        return new Promise((resolve, reject) => {
          sendTransaction(approveTx, {
            onSuccess: () => {
              console.log("✅ [CircleSavings] Approval successful, now contributing...");
              
              setTimeout(() => {
                const contributeTransaction = prepareContractCall({
                  contract,
                  method: "contribute",
                  params: [circleId],
                });

                sendTransaction(contributeTransaction, {
                  onSuccess: (receipt) => {
                    console.log("✅ [CircleSavings] Contribution successful:", receipt);
                    setTimeout(() => refetchCircles(), 3000);
                    resolve(receipt);
                  },
                  onError: (error: any) => {
                    console.error("❌ [CircleSavings] Contribution failed:", error);
                    const errorMsg = error?.message || error?.toString() || "Contribution failed";
                    setError(errorMsg);
                    reject(new Error(errorMsg));
                  },
                });
              }, 1500);
            },
            onError: (error: any) => {
              console.error("❌ [CircleSavings] Approval failed:", error);
              const errorMsg = error?.message || error?.toString() || "Approval failed";
              setError(errorMsg);
              reject(new Error(errorMsg));
            },
          });
        });
      } catch (err) {
        const error = err as Error;
        console.error("❌ [CircleSavings] Error contributing:", error);
        setError(error.message || "Failed to contribute");
        throw err;
      }
    },
    [account?.address, contract, sendTransaction, refetchCircles, client, chain]
  );

  // Invite members (for private circles)
  const inviteMembers = useCallback(
    async (circleId: bigint, invitees: string[]) => {
      if (!account?.address) {
        throw new Error("No wallet connected");
      }

      try {
        setError(null);

        console.log("📝 [CircleSavings] Inviting members...");
        const inviteTransaction = prepareContractCall({
          contract,
          method: "inviteMembers",
          params: [circleId, invitees],
        });

        return new Promise((resolve, reject) => {
          sendTransaction(inviteTransaction, {
            onSuccess: (receipt) => {
              console.log("✅ [CircleSavings] Members invited:", receipt);
              setTimeout(() => refetchCircles(), 3000);
              resolve(receipt);
            },
            onError: (error) => {
              console.error("❌ [CircleSavings] Invite failed:", error);
              setError(error.message);
              reject(error);
            },
          });
        });
      } catch (err) {
        const error = err as Error;
        console.error("❌ [CircleSavings] Error inviting members:", error);
        setError(error.message || "Failed to invite members");
        throw err;
      }
    },
    [account?.address, contract, sendTransaction, refetchCircles]
  );

  // Start circle (manual start by creator)
  const startCircle = useCallback(
    async (circleId: bigint) => {
      if (!account?.address) {
        throw new Error("No wallet connected");
      }

      try {
        setError(null);

        console.log("📝 [CircleSavings] Starting circle...");
        const startTransaction = prepareContractCall({
          contract,
          method: "startCircle",
          params: [circleId],
        });

        return new Promise((resolve, reject) => {
          sendTransaction(startTransaction, {
            onSuccess: (receipt) => {
              console.log("✅ [CircleSavings] Circle started:", receipt);
              setTimeout(() => refetchCircles(), 3000);
              resolve(receipt);
            },
            onError: (error) => {
              console.error("❌ [CircleSavings] Start failed:", error);
              setError(error.message);
              reject(error);
            },
          });
        });
      } catch (err) {
        const error = err as Error;
        console.error("❌ [CircleSavings] Error starting circle:", error);
        setError(error.message || "Failed to start circle");
        throw err;
      }
    },
    [account?.address, contract, sendTransaction, refetchCircles]
  );

  // Initiate voting
  const initiateVoting = useCallback(
    async (circleId: bigint) => {
      if (!account?.address) {
        throw new Error("No wallet connected");
      }

      try {
        setError(null);

        console.log("📝 [CircleSavings] Initiating voting...");
        const voteTransaction = prepareContractCall({
          contract,
          method: "initiateVoting",
          params: [circleId],
        });

        return new Promise((resolve, reject) => {
          sendTransaction(voteTransaction, {
            onSuccess: (receipt) => {
              console.log("✅ [CircleSavings] Voting initiated:", receipt);
              setTimeout(() => refetchCircles(), 3000);
              resolve(receipt);
            },
            onError: (error) => {
              console.error("❌ [CircleSavings] Voting initiation failed:", error);
              setError(error.message);
              reject(error);
            },
          });
        });
      } catch (err) {
        const error = err as Error;
        console.error("❌ [CircleSavings] Error initiating voting:", error);
        setError(error.message || "Failed to initiate voting");
        throw err;
      }
    },
    [account?.address, contract, sendTransaction, refetchCircles]
  );

  // Cast vote
  const castVote = useCallback(
    async (circleId: bigint, choice: 1 | 2) => {
      if (!account?.address) {
        throw new Error("No wallet connected");
      }

      try {
        setError(null);

        console.log("📝 [CircleSavings] Casting vote...");
        const voteTransaction = prepareContractCall({
          contract,
          method: "castVote",
          params: [circleId, choice],
        });

        return new Promise((resolve, reject) => {
          sendTransaction(voteTransaction, {
            onSuccess: (receipt) => {
              console.log("✅ [CircleSavings] Vote cast:", receipt);
              setTimeout(() => refetchCircles(), 3000);
              resolve(receipt);
            },
            onError: (error) => {
              console.error("❌ [CircleSavings] Vote failed:", error);
              setError(error.message);
              reject(error);
            },
          });
        });
      } catch (err) {
        const error = err as Error;
        console.error("❌ [CircleSavings] Error casting vote:", error);
        setError(error.message || "Failed to cast vote");
        throw err;
      }
    },
    [account?.address, contract, sendTransaction, refetchCircles]
  );

  // Execute vote
  const executeVote = useCallback(
    async (circleId: bigint) => {
      if (!account?.address) {
        throw new Error("No wallet connected");
      }

      try {
        setError(null);

        console.log("📝 [CircleSavings] Executing vote...");
        const executeTransaction = prepareContractCall({
          contract,
          method: "executeVote",
          params: [circleId],
        });

        return new Promise((resolve, reject) => {
          sendTransaction(executeTransaction, {
            onSuccess: (receipt) => {
              console.log("✅ [CircleSavings] Vote executed:", receipt);
              setTimeout(() => refetchCircles(), 3000);
              resolve(receipt);
            },
            onError: (error) => {
              console.error("❌ [CircleSavings] Vote execution failed:", error);
              setError(error.message);
              reject(error);
            },
          });
        });
      } catch (err) {
        const error = err as Error;
        console.error("❌ [CircleSavings] Error executing vote:", error);
        setError(error.message || "Failed to execute vote");
        throw err;
      }
    },
    [account?.address, contract, sendTransaction, refetchCircles]
  );

  // Withdraw collateral
  const withdrawCollateral = useCallback(
    async (circleId: bigint) => {
      if (!account?.address) {
        throw new Error("No wallet connected");
      }

      try {
        setError(null);

        console.log("📝 [CircleSavings] Withdrawing collateral...");
        const withdrawTransaction = prepareContractCall({
          contract,
          method: "WithdrawCollateral",
          params: [circleId],
        });

        return new Promise((resolve, reject) => {
          sendTransaction(withdrawTransaction, {
            onSuccess: (receipt) => {
              console.log("✅ [CircleSavings] Collateral withdrawn:", receipt);
              setTimeout(() => refetchCircles(), 3000);
              resolve(receipt);
            },
            onError: (error) => {
              console.error("❌ [CircleSavings] Withdrawal failed:", error);
              setError(error.message);
              reject(error);
            },
          });
        });
      } catch (err) {
        const error = err as Error;
        console.error("❌ [CircleSavings] Error withdrawing collateral:", error);
        setError(error.message || "Failed to withdraw collateral");
        throw err;
      }
    },
    [account?.address, contract, sendTransaction, refetchCircles]
  );

  // Forfeit member (only next recipient can call)
  const forfeitMember = useCallback(
    async (circleId: bigint) => {
      if (!account?.address) {
        throw new Error("No wallet connected");
      }

      try {
        setError(null);

        console.log("📝 [CircleSavings] Forfeiting late members...");
        const forfeitTransaction = prepareContractCall({
          contract,
          method: "forfeitMember",
          params: [circleId],
        });

        return new Promise((resolve, reject) => {
          sendTransaction(forfeitTransaction, {
            onSuccess: (receipt) => {
              console.log("✅ [CircleSavings] Members forfeited:", receipt);
              setTimeout(() => refetchCircles(), 3000);
              resolve(receipt);
            },
            onError: (error) => {
              console.error("❌ [CircleSavings] Forfeit failed:", error);
              setError(error.message);
              reject(error);
            },
          });
        });
      } catch (err) {
        const error = err as Error;
        console.error("❌ [CircleSavings] Error forfeiting member:", error);
        setError(error.message || "Failed to forfeit member");
        throw err;
      }
    },
    [account?.address, contract, sendTransaction, refetchCircles]
  );

  // Get single circle by ID
  const getCircleById = useCallback(
    async (circleId: string) => {
      try {
        const result = await request(
          SUBGRAPH_URL,
          singleCircleQuery,
          { circleId },
          SUBGRAPH_HEADERS
        );

        if (result.circleCreateds && result.circleCreateds.length > 0) {
          const circle = result.circleCreateds[0];
          return {
            id: circle.id,
            circleId: BigInt(circle.circleId),
            circleName: circle.circleName,
            circleDescription: circle.circleDescription,
            contributionAmount: BigInt(circle.circleContributionAmount),
            collateralAmount: BigInt(circle.collateralAmount),
            frequency: circle.circleFrequency,
            maxMembers: BigInt(circle.circleMaxMembers),
            visibility: circle.circleVisibility,
            createdAt: BigInt(circle.circleCreatedAt),
            creator: circle.user,
          };
        }
        return null;
      } catch (err) {
        console.error("❌ [CircleSavings] Error fetching circle:", err);
        throw err;
      }
    },
    []
  );

  return {
    circles,
    joinedCircles,
    contributions,
    payouts,
    isLoading: isCirclesLoading || isSending,
    error,
    createCircle,
    joinCircle,
    contribute,
    inviteMembers,
    startCircle,
    initiateVoting,
    castVote,
    executeVote,
    withdrawCollateral,
    forfeitMember,
    getCircleById,
    refreshCircles: refetchCircles,
    contract,
  };
};
