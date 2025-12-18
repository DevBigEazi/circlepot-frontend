import { useState, useEffect, useCallback, useMemo } from "react";
import { useActiveAccount, useSendTransaction } from "thirdweb/react";
import { prepareContractCall, getContract } from "thirdweb";
import { defineChain } from "thirdweb/chains";
import { ThirdwebClient } from "thirdweb";
import { CIRCLE_SAVINGS_ABI } from "../abis/CircleSavingsV1";
import { useQuery } from "@tanstack/react-query";
import { gql, request } from "graphql-request";
import { CUSD_ABI } from "../abis/Cusd";
import {
  SUBGRAPH_URL,
  SUBGRAPH_HEADERS,
  CIRCLE_SAVINGS_ADDRESS,
  CUSD_ADDRESS,
  CHAIN_ID
} from "../constants/constants";
import {
  Circle, CircleJoined, Contribution, CreateCircleParams, Payout,
  VotingInitiated, VoteCast, VoteExecuted, PositionAssigned,
  MemberInvited, LatePayment, MemberForfeited, CollateralWithdrawn
} from "../interfaces/interfaces";

// GraphQL Queries
const userCirclesQuery = gql`
  query GetUserCircles($userId: Bytes!) {
    # Query circles where user is creator
    createdCircles: circles(where: { creator: $userId }, orderBy: updatedAt, orderDirection: desc) {
      id
      circleId
      creator {
        id
        username
        fullName
      }
      circleName
      circleDescription
      contributionAmount
      collateralAmount
      frequency
      maxMembers
      currentMembers
      visibility
      state
      createdAt
      startedAt
      updatedAt
    }

    # Query circles user has joined
    circleJoineds(where: { user: $userId }, orderBy: transaction__blockTimestamp, orderDirection: desc) {
      id
      circleId
      user {
        id
        username
        fullName
      }
      currentMembers
      circleState
      transaction {
        blockTimestamp
        transactionHash
      }
    }

    # Contributions
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

    # Payouts
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

    # Position assignments
    positionAssigneds(where: { user: $userId }, orderBy: transaction__blockTimestamp, orderDirection: desc) {
      id
      user {
        id
        username
        fullName
      }
      circleId
      position
      transaction {
        blockTimestamp
        transactionHash
      }
    }

    # Votes cast by user
    voteCasts(where: { voter: $userId }, orderBy: transaction__blockTimestamp, orderDirection: desc) {
      id
      voter {
        id
        username
        fullName
      }
      circleId
      choice
      transaction {
        blockTimestamp
        transactionHash
      }
    }

    # Late payments
    latePaymentRecordeds(where: { user: $userId }, orderBy: transaction__blockTimestamp, orderDirection: desc) {
      id
      user {
        id
      }
      circleId
      round
      fee
      transaction {
        blockTimestamp
        transactionHash
      }
    }

    # Member forfeitures (where user was forfeited)
    memberForfeiteds(where: { forfeitedUser: $userId }, orderBy: transaction__blockTimestamp, orderDirection: desc) {
      id
      forfeiter {
        id
        username
        fullName
      }
      forfeitedUser {
        id
        username
        fullName
      }
      circleId
      round
      deductionAmount
      transaction {
        blockTimestamp
        transactionHash
      }
    }

    # Invitations received
    memberInviteds(where: { invitee: $userId }, orderBy: invitedAt, orderDirection: desc) {
      id
      inviter {
        id
        username
        fullName
      }
      invitee {
        id
        username
        fullName
      }
      circleId
      invitedAt
      transaction {
        blockTimestamp
        transactionHash
      }
    }

    # Collateral withdrawals
    collateralWithdrawns(where: { user: $userId }, orderBy: transaction__blockTimestamp, orderDirection: desc) {
      id
      user {
        id
      }
      circleId
      amount
      transaction {
        blockTimestamp
        transactionHash
      }
    }
  }
`;

// Separate query to fetch circles by IDs and their members
const circlesByIdsQuery = gql`
  query GetCirclesByIds($circleIds: [BigInt!]!) {
    circles(where: { circleId_in: $circleIds }) {
      id
      circleId
      creator {
        id
        username
        fullName
      }
      circleName
      circleDescription
      currentRound
      contributionAmount
      collateralAmount
      frequency
      maxMembers
      currentMembers
      visibility
      state
      createdAt
      startedAt
      updatedAt
    }
    # Fetch ALL members for these circles to calculate positions correctly
    circleJoineds(where: { circleId_in: $circleIds }, orderBy: transaction__blockTimestamp, orderDirection: asc) {
      id
      circleId
      user {
        id
        username
        fullName
      }
      currentMembers
      circleState
      transaction {
        blockTimestamp
        transactionHash
      }
    }
    # Voting initiated events
    votingInitiateds(where: { circleId_in: $circleIds }, orderBy: transaction__blockTimestamp, orderDirection: desc) {
      id
      circleId
      votingStartAt
      votingEndAt
      transaction {
        blockTimestamp
        transactionHash
      }
    }
    # Vote execution results
    voteExecuteds(where: { circleId_in: $circleIds }, orderBy: transaction__blockTimestamp, orderDirection: desc) {
      id
      circleId
      circleStarted
      startVoteTotal
      withdrawVoteTotal
      transaction {
        blockTimestamp
        transactionHash
      }
    }
    # Circle started events
    circleStarteds(where: { circleId_in: $circleIds }, orderBy: transaction__blockTimestamp, orderDirection: desc) {
      id
      circleId
      circleStartedAt
      transaction {
        blockTimestamp
        transactionHash
      }
    }
    # Position assignments for these circles
    positionAssigneds(where: { circleId_in: $circleIds }, orderBy: position, orderDirection: asc) {
      id
      user {
        id
        username
        fullName
      }
      circleId
      position
      transaction {
        blockTimestamp
        transactionHash
      }
    }
    # All votes cast for these circles
    voteCasts(where: { circleId_in: $circleIds }, orderBy: transaction__blockTimestamp, orderDirection: desc) {
      id
      voter {
        id
        username
        fullName
      }
      circleId
      choice
      transaction {
        blockTimestamp
        transactionHash
      }
    }
  }
`;

const singleCircleQuery = gql`
  query GetSingleCircle($circleId: BigInt!) {
    # Get current circle state
    circles(where: { circleId: $circleId }) {
      id
      circleId
      creator {
        id
        username
        fullName
      }
      circleName
      circleDescription
      currentRound
      contributionAmount
      collateralAmount
      frequency
      maxMembers
      currentMembers
      visibility
      state
      createdAt
      startedAt
      updatedAt
    }

    # Get all members who joined
    circleJoineds(
      where: { circleId: $circleId }
      orderBy: transaction__blockTimestamp
      orderDirection: asc
    ) {
      id
      user {
        id
        username
        fullName
      }
      currentMembers
      circleState
      transaction {
        blockTimestamp
      }
    }

    # Voting initiated
    votingInitiateds(where: { circleId: $circleId }, orderBy: transaction__blockTimestamp, orderDirection: desc, first: 1) {
      id
      circleId
      votingStartAt
      votingEndAt
      transaction {
        blockTimestamp
        transactionHash
      }
    }

    # Vote results
    voteExecuteds(where: { circleId: $circleId }, orderBy: transaction__blockTimestamp, orderDirection: desc, first: 1) {
      id
      circleId
      circleStarted
      startVoteTotal
      withdrawVoteTotal
      transaction {
        blockTimestamp
        transactionHash
      }
    }

    # All votes cast
    voteCasts(where: { circleId: $circleId }, orderBy: transaction__blockTimestamp, orderDirection: desc) {
      id
      voter {
        id
        username
        fullName
      }
      circleId
      choice
      transaction {
        blockTimestamp
        transactionHash
      }
    }

    # Position assignments
    positionAssigneds(where: { circleId: $circleId }, orderBy: position, orderDirection: asc) {
      id
      user {
        id
        username
        fullName
      }
      circleId
      position
      transaction {
        blockTimestamp
        transactionHash
      }
    }

    # Payouts to calculate currentRound
    payoutDistributeds(where: { circleId: $circleId }, orderBy: round, orderDirection: desc) {
      round
    }
  }
`;

export const useCircleSavings = (client: ThirdwebClient, enablePolling: boolean = false) => {
  const account = useActiveAccount();
  const { mutate: sendTransaction, isPending: isSending } = useSendTransaction();
  const [circles, setCircles] = useState<Circle[]>([]);
  const [joinedCircles, setJoinedCircles] = useState<CircleJoined[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [votingEvents, setVotingEvents] = useState<VotingInitiated[]>([]);
  const [votes, setVotes] = useState<VoteCast[]>([]);
  const [voteResults, setVoteResults] = useState<VoteExecuted[]>([]);
  const [positions, setPositions] = useState<PositionAssigned[]>([]);
  const [invitations, setInvitations] = useState<MemberInvited[]>([]);
  const [latePayments, setLatePayments] = useState<LatePayment[]>([]);
  const [forfeitures, setForfeitures] = useState<MemberForfeited[]>([]);
  const [collateralWithdrawals, setCollateralWithdrawals] = useState<CollateralWithdrawn[]>([]);
  const [error, setError] = useState<string | null>(null);

  const chain = useMemo(() => defineChain(CHAIN_ID), []);

  const contract = useMemo(
    () =>
      getContract({
        client,
        chain,
        address: CIRCLE_SAVINGS_ADDRESS,
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
        // 1. Fetch user's created circles and join events
        const userResult: any = await request(
          SUBGRAPH_URL,
          userCirclesQuery,
          { userId: account.address.toLowerCase() },
          SUBGRAPH_HEADERS
        );

        // 2. Extract unique circle IDs from join events
        const joinedCircleIds = [...new Set(userResult.circleJoineds.map((j: any) => j.circleId))];

        // 3. Fetch details for joined circles
        let joinedCirclesDetails = [];
        let joinedCirclesMembers = [];
        let joinedCirclesVotingEvents = [];
        let joinedCirclesVoteResults = [];
        if (joinedCircleIds.length > 0) {
          const circlesResult: any = await request(
            SUBGRAPH_URL,
            circlesByIdsQuery,
            { circleIds: joinedCircleIds },
            SUBGRAPH_HEADERS
          );
          joinedCirclesDetails = circlesResult.circles;
          joinedCirclesMembers = circlesResult.circleJoineds;
          joinedCirclesVotingEvents = circlesResult.votingInitiateds;
          joinedCirclesVoteResults = circlesResult.voteExecuteds;
          // No need to calculate currentRound - subgraph now tracks it directly
        }

        return {
          ...userResult,
          joinedCirclesDetails,
          joinedCirclesMembers,
          joinedCirclesVotingEvents,
          joinedCirclesVoteResults,
        };
      } catch (err) {
        throw err;
      }
    },
    enabled: !!account?.address,
    refetchInterval: enablePolling ? 5000 : 0, // Poll only if enablePolling is true
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes (reduced from 30)
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnReconnect: true, // Refetch on network reconnect
    refetchOnMount: true, // Refetch when component mounts
    retry: 1, // Only retry once on failure
  });

  // Update local state when subgraph data changes
  useEffect(() => {
    if (circlesData) {
      // Process circles created by user
      const createdCircles = circlesData.createdCircles?.map((circle: any) => ({
        id: circle.id,
        circleId: BigInt(circle.circleId),
        circleName: circle.circleName,
        circleDescription: circle.circleDescription,
        contributionAmount: BigInt(circle.contributionAmount),
        collateralAmount: BigInt(circle.collateralAmount),
        frequency: circle.frequency,
        maxMembers: BigInt(circle.maxMembers),
        currentMembers: BigInt(circle.currentMembers),
        // For created circles not in joined list (rare), default to 1 or fetch separately. 
        // But they should be in joined list if creator is member.
        currentRound: 1n,
        visibility: circle.visibility,
        state: circle.state,
        createdAt: BigInt(circle.createdAt),
        startedAt: BigInt(circle.startedAt),
        creator: circle.creator,
      })) || [];

      // Process circles user has joined (from separate query)
      const joinedCirclesData = circlesData.joinedCirclesDetails?.map((circle: any) => ({
        id: circle.id,
        circleId: BigInt(circle.circleId),
        circleName: circle.circleName,
        circleDescription: circle.circleDescription,
        contributionAmount: BigInt(circle.contributionAmount),
        collateralAmount: BigInt(circle.collateralAmount),
        frequency: circle.frequency,
        maxMembers: BigInt(circle.maxMembers),
        currentMembers: BigInt(circle.currentMembers),
        currentRound: BigInt(circle.currentRound || 1),
        visibility: circle.visibility,
        state: circle.state,
        createdAt: BigInt(circle.createdAt),
        startedAt: BigInt(circle.startedAt),
        creator: circle.creator,
      })) || [];

      // Combine created and joined circles, removing duplicates by circleId
      const allCirclesMap = new Map();

      // Add created circles first
      createdCircles.forEach((circle: any) => {
        allCirclesMap.set(circle.circleId.toString(), circle);
      });

      // Add joined circles (will overwrite if duplicate, ensuring latest data)
      joinedCirclesData.forEach((circle: any) => {
        allCirclesMap.set(circle.circleId.toString(), circle);
      });

      // Convert map back to array
      const combinedCircles = Array.from(allCirclesMap.values());
      setCircles(combinedCircles);

      // Process joined circles metadata (for position tracking)
      // We need to combine the user's join events (from first query) with ALL members of joined circles (from second query)
      // to ensure we have complete member lists for position calculation.

      const allJoinEventsMap = new Map();

      // Add user's join events first
      circlesData.circleJoineds.forEach((joined: any) => {
        allJoinEventsMap.set(joined.id, joined);
      });

      // Add all members from joined circles
      circlesData.joinedCirclesMembers?.forEach((joined: any) => {
        allJoinEventsMap.set(joined.id, joined);
      });

      const allJoinEvents = Array.from(allJoinEventsMap.values()).sort(
        (a: any, b: any) =>
          Number(a.transaction.blockTimestamp) -
          Number(b.transaction.blockTimestamp)
      );

      const processedJoined = allJoinEvents.map((joined: any) => ({
        id: joined.user.id, // Use user address as ID for correct membership checking
        circleId: BigInt(joined.circleId),
        currentMembers: BigInt(joined.currentMembers),
        circleState: joined.circleState,
        timestamp: BigInt(joined.transaction.blockTimestamp),
        user: joined.user,
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
        user: payout.user, // Include user info for payout received indicator
        timestamp: BigInt(payout.transaction.blockTimestamp),
      }));
      setPayouts(processedPayouts);

      // Process position assignments
      const processedPositions = (circlesData.positionAssigneds || []).map((pos: any) => ({
        id: pos.id,
        circleId: BigInt(pos.circleId),
        user: pos.user,
        position: BigInt(pos.position),
        timestamp: BigInt(pos.transaction.blockTimestamp),
        transactionHash: pos.transaction.transactionHash,
      }));
      setPositions(processedPositions);

      // Process votes cast
      const processedVotes = (circlesData.voteCasts || []).map((vote: any) => ({
        id: vote.id,
        circleId: BigInt(vote.circleId),
        voter: vote.voter,
        choice: vote.choice,
        timestamp: BigInt(vote.transaction.blockTimestamp),
        transactionHash: vote.transaction.transactionHash,
      }));
      setVotes(processedVotes);

      // Process late payments
      const processedLatePayments = (circlesData.latePaymentRecordeds || []).map((late: any) => ({
        id: late.id,
        circleId: BigInt(late.circleId),
        round: BigInt(late.round),
        fee: BigInt(late.fee),
        timestamp: BigInt(late.transaction.blockTimestamp),
        transactionHash: late.transaction.transactionHash,
      }));
      setLatePayments(processedLatePayments);

      // Process member forfeitures
      const processedForfeitures = (circlesData.memberForfeiteds || []).map((forf: any) => ({
        id: forf.id,
        circleId: BigInt(forf.circleId),
        forfeiter: forf.forfeiter,
        forfeitedUser: forf.forfeitedUser,
        round: BigInt(forf.round),
        deductionAmount: BigInt(forf.deductionAmount),
        timestamp: BigInt(forf.transaction.blockTimestamp),
        transactionHash: forf.transaction.transactionHash,
      }));
      setForfeitures(processedForfeitures);

      // Process invitations
      const processedInvitations = (circlesData.memberInviteds || []).map((inv: any) => ({
        id: inv.id,
        circleId: BigInt(inv.circleId),
        inviter: inv.inviter,
        invitee: inv.invitee,
        invitedAt: BigInt(inv.invitedAt),
        timestamp: BigInt(inv.transaction.blockTimestamp),
        transactionHash: inv.transaction.transactionHash,
      }));
      setInvitations(processedInvitations);

      // Process collateral withdrawals
      const processedCollateralWithdrawals = (circlesData.collateralWithdrawns || []).map((cw: any) => ({
        id: cw.id,
        circleId: BigInt(cw.circleId),
        amount: BigInt(cw.amount),
        timestamp: BigInt(cw.transaction.blockTimestamp),
        transactionHash: cw.transaction.transactionHash,
      }));
      setCollateralWithdrawals(processedCollateralWithdrawals);

      // Process voting events from joined circles
      const processedVotingEvents = (circlesData.joinedCirclesVotingEvents || []).map((evt: any) => ({
        id: evt.id,
        circleId: BigInt(evt.circleId),
        votingStartAt: BigInt(evt.votingStartAt),
        votingEndAt: BigInt(evt.votingEndAt),
        timestamp: BigInt(evt.transaction.blockTimestamp),
        transactionHash: evt.transaction.transactionHash,
      }));
      setVotingEvents(processedVotingEvents);

      // Process vote results from joined circles
      const processedVoteResults = (circlesData.joinedCirclesVoteResults || []).map((res: any) => ({
        id: res.id,
        circleId: BigInt(res.circleId),
        circleStarted: res.circleStarted,
        startVoteTotal: BigInt(res.startVoteTotal),
        withdrawVoteTotal: BigInt(res.withdrawVoteTotal),
        timestamp: BigInt(res.transaction.blockTimestamp),
        transactionHash: res.transaction.transactionHash,
      }));
      setVoteResults(processedVoteResults);

      setError(null);
    }
  }, [circlesData]);

  // Create circle
  const createCircle = useCallback(
    async (params: CreateCircleParams) => {
      if (!account?.address) {
        const error = "No wallet connected";
        throw new Error(error);
      }

      try {
        setError(null);

        const totalCommitment = params.contributionAmount * params.maxMembers;
        const lateBuffer = (totalCommitment * 100n) / 10000n;
        const collateral = totalCommitment + lateBuffer;
        const visibilityFee = params.visibility === 1 ? BigInt("500000000000000000") : 0n;
        const totalRequired = collateral + visibilityFee;

        const approveTx = prepareContractCall({
          contract: getContract({
            client,
            chain,
            address: CUSD_ADDRESS,
            abi: CUSD_ABI,
          }),
          method: "approve",
          params: [CIRCLE_SAVINGS_ADDRESS, totalRequired],
        });

        return new Promise((resolve, reject) => {
          sendTransaction(approveTx, {
            onSuccess: () => {
              setTimeout(() => {
                const createTransaction = prepareContractCall({
                  contract,
                  method: "createCircle",
                  params: [params],
                });

                sendTransaction(createTransaction, {
                  onSuccess: (receipt) => {
                    setTimeout(() => refetchCircles(), 3000);
                    resolve(receipt);
                  },
                  onError: (error: any) => {
                    const errorMsg = error?.message || error?.toString() || "Transaction failed";
                    setError(errorMsg);
                    reject(new Error(errorMsg));
                  },
                });
              }, 1500);
            },
            onError: (error: any) => {
              const errorMsg = error?.message || error?.toString() || "Approval failed";
              setError(errorMsg);
              reject(new Error(errorMsg));
            },
          });
        });
      } catch (err) {
        const error = err as Error;
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

        const approveTx = prepareContractCall({
          contract: getContract({
            client,
            chain,
            address: CUSD_ADDRESS,
            abi: CUSD_ABI,
          }),
          method: "approve",
          params: [CIRCLE_SAVINGS_ADDRESS, collateralAmount],
        });

        return new Promise((resolve, reject) => {
          sendTransaction(approveTx, {
            onSuccess: () => {
              setTimeout(() => {
                const joinTransaction = prepareContractCall({
                  contract,
                  method: "joinCircle",
                  params: [circleId],
                });

                sendTransaction(joinTransaction, {
                  onSuccess: (receipt) => {
                    setTimeout(() => { refetchCircles(); }, 2000);
                    resolve(receipt);
                  },
                  onError: (error: any) => {
                    const errorMsg = error?.message || error?.toString() || "Join failed";
                    setError(errorMsg);
                    reject(new Error(errorMsg));
                  },
                });
              }, 1500);
            },
            onError: (error: any) => {
              const errorMsg = error?.message || error?.toString() || "Approval failed";
              setError(errorMsg);
              reject(new Error(errorMsg));
            },
          });
        });
      } catch (err) {
        const error = err as Error;
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

        const approveTx = prepareContractCall({
          contract: getContract({
            client,
            chain,
            address: CUSD_ADDRESS,
            abi: CUSD_ABI,
          }),
          method: "approve",
          params: [CIRCLE_SAVINGS_ADDRESS, contributionAmount],
        });

        return new Promise((resolve, reject) => {
          sendTransaction(approveTx, {
            onSuccess: () => {
              setTimeout(() => {
                const contributeTransaction = prepareContractCall({
                  contract,
                  method: "contribute",
                  params: [circleId],
                });

                sendTransaction(contributeTransaction, {
                  onSuccess: (receipt) => {
                    setTimeout(() => refetchCircles(), 3000);
                    resolve(receipt);
                  },
                  onError: (error: any) => {
                    const errorMsg = error?.message || error?.toString() || "Contribution failed";
                    setError(errorMsg);
                    reject(new Error(errorMsg));
                  },
                });
              }, 1500);
            },
            onError: (error: any) => {
              const errorMsg = error?.message || error?.toString() || "Approval failed";
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
    [account?.address, contract, sendTransaction, refetchCircles, client, chain]
  );

  // Update circle visibility
  const updateCircleVisibility = useCallback(
    async (circleId: bigint, newVisibility: 0 | 1) => {
      if (!account?.address) {
        throw new Error("No wallet connected");
      }

      try {
        setError(null);

        const approveTx = prepareContractCall({
          contract: getContract({
            client,
            chain,
            address: CUSD_ADDRESS,
            abi: CUSD_ABI,
          }),
          method: "approve",
          params: [CIRCLE_SAVINGS_ADDRESS, BigInt("500000000000000000")], // 0.5 cUSD fee
        });

        return new Promise((resolve, reject) => {
          sendTransaction(approveTx, {
            onSuccess: () => {
              setTimeout(() => {
                const updateTransaction = prepareContractCall({
                  contract,
                  method: "updateCircleVisibility",
                  params: [circleId, newVisibility],
                });

                sendTransaction(updateTransaction, {
                  onSuccess: (receipt) => {
                    setTimeout(() => refetchCircles(), 3000);
                    resolve(receipt);
                  },
                  onError: (error: any) => {
                    setError(error.message);
                    reject(error);
                  },
                });
              }, 1500);
            },
            onError: (error: any) => {
              setError(error.message);
              reject(error);
            },
          });
        });
      } catch (err) {
        const error = err as Error;
        setError(error.message || "Failed to update visibility");
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

        const inviteTransaction = prepareContractCall({
          contract,
          method: "inviteMembers",
          params: [circleId, invitees],
        });

        return new Promise((resolve, reject) => {
          sendTransaction(inviteTransaction, {
            onSuccess: (receipt) => {
              setTimeout(() => refetchCircles(), 3000);
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

        const startTransaction = prepareContractCall({
          contract,
          method: "startCircle",
          params: [circleId],
        });

        return new Promise((resolve, reject) => {
          sendTransaction(startTransaction, {
            onSuccess: (receipt) => {
              setTimeout(() => refetchCircles(), 3000);
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

        const voteTransaction = prepareContractCall({
          contract,
          method: "initiateVoting",
          params: [circleId],
        });

        return new Promise((resolve, reject) => {
          sendTransaction(voteTransaction, {
            onSuccess: (receipt) => {
              setTimeout(() => refetchCircles(), 3000);
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

        const voteTransaction = prepareContractCall({
          contract,
          method: "castVote",
          params: [circleId, choice],
        });

        return new Promise((resolve, reject) => {
          sendTransaction(voteTransaction, {
            onSuccess: (receipt) => {
              setTimeout(() => refetchCircles(), 3000);
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

        const executeTransaction = prepareContractCall({
          contract,
          method: "executeVote",
          params: [circleId],
        });

        return new Promise((resolve, reject) => {
          sendTransaction(executeTransaction, {
            onSuccess: (receipt) => {
              setTimeout(() => refetchCircles(), 3000);
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

        const withdrawTransaction = prepareContractCall({
          contract,
          method: "WithdrawCollateral",
          params: [circleId],
        });

        return new Promise((resolve, reject) => {
          sendTransaction(withdrawTransaction, {
            onSuccess: (receipt) => {
              setTimeout(() => refetchCircles(), 3000);
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

        const forfeitTransaction = prepareContractCall({
          contract,
          method: "forfeitMember",
          params: [circleId],
        });

        return new Promise((resolve, reject) => {
          sendTransaction(forfeitTransaction, {
            onSuccess: (receipt) => {
              setTimeout(() => refetchCircles(), 3000);
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
        setError(error.message || "Failed to forfeit member");
        throw err;
      }
    },
    [account?.address, contract, sendTransaction, refetchCircles]
  );

  // Get single circle by ID
  const getCircleById = useCallback(async (circleId: string) => {
    try {
      const result = await request(
        SUBGRAPH_URL,
        singleCircleQuery,
        { circleId },
        SUBGRAPH_HEADERS
      );

      if (result.circles && result.circles.length > 0) {
        const circle = result.circles[0];
        const members = result.circleJoineds.map((join: any) => ({
          id: join.user.id,
          username: join.user.username,
          fullName: join.user.fullName,
          joinedAt: join.transaction.blockTimestamp,
        }));

        const votingEvents = result.votingInitiateds?.map((evt: any) => ({
          id: evt.id,
          circleId: BigInt(evt.circleId),
          votingStartAt: BigInt(evt.votingStartAt),
          votingEndAt: BigInt(evt.votingEndAt),
          timestamp: BigInt(evt.transaction.blockTimestamp),
        })) || [];

        const voteResults = result.voteExecuteds?.map((res: any) => ({
          id: res.id,
          circleId: BigInt(res.circleId),
          circleStarted: res.circleStarted,
          startVoteTotal: BigInt(res.startVoteTotal),
          withdrawVoteTotal: BigInt(res.withdrawVoteTotal),
          timestamp: BigInt(res.transaction.blockTimestamp),
        })) || [];

        const votes = result.voteCasts?.map((vote: any) => ({
          id: vote.id,
          circleId: BigInt(vote.circleId),
          voter: vote.voter,
          choice: vote.choice,
          timestamp: BigInt(vote.transaction.blockTimestamp),
        })) || [];

        const positions = result.positionAssigneds?.map((pos: any) => ({
          id: pos.id,
          circleId: BigInt(pos.circleId),
          user: pos.user,
          position: BigInt(pos.position),
          timestamp: BigInt(pos.transaction.blockTimestamp),
        })) || [];

        // Calculate currentRound
        const payouts = result.payoutDistributeds || [];
        let currentRound = 1n;
        if (payouts.length > 0) {
          // Payouts are ordered by round desc, so first one is latest
          currentRound = BigInt(payouts[0].round) + 1n;
        }

        return {
          id: circle.id,
          circleId: BigInt(circle.circleId),
          circleName: circle.circleName,
          circleDescription: circle.circleDescription,
          contributionAmount: BigInt(circle.contributionAmount),
          collateralAmount: BigInt(circle.collateralAmount),
          frequency: circle.frequency,
          maxMembers: BigInt(circle.maxMembers),
          currentMembers: BigInt(circle.currentMembers),
          currentRound: currentRound,
          visibility: circle.visibility,
          state: circle.state,
          createdAt: BigInt(circle.createdAt),
          startedAt: BigInt(circle.startedAt),
          creator: circle.creator,
          members: members,
          votingEvents,
          voteResults,
          votes,
          positions,
        };
      }
      return null;
    } catch (err) {
      throw err;
    }
  }, []);

  return {
    circles,
    joinedCircles,
    contributions,
    payouts,
    votingEvents,
    votes,
    voteResults,
    positions,
    invitations,
    latePayments,
    forfeitures,
    collateralWithdrawals,
    isLoading: isCirclesLoading,
    isTransactionPending: isSending,
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
    updateCircleVisibility,
    refreshCircles: refetchCircles,
    contract,
  };
};

