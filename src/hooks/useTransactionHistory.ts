import { useMemo } from "react";
import { useActiveAccount } from "thirdweb/react";
import { useQuery } from "@tanstack/react-query";
import { gql, request } from "graphql-request";
import { defineChain } from "thirdweb";
import { getRpcClient, eth_getBlockByNumber, eth_getLogs } from "thirdweb/rpc";
import { client } from "../thirdwebClient";
import {
    SUBGRAPH_URL,
    SUBGRAPH_HEADERS,
    CUSD_ADDRESS,
    CHAIN_ID,
    PERSONAL_SAVINGS_ADDRESS,
    CIRCLE_SAVINGS_ADDRESS,
} from "../constants/constants";

// GraphQL Query for all transaction types
const transactionHistoryQuery = gql`
  query GetTransactionHistory($userId: Bytes!) {
    # Circle contributions
    contributionMades(where: { user: $userId }, orderBy: transaction__blockTimestamp, orderDirection: desc) {
      id
      user {
        id
        username
        fullName
      }
      circleId
      round
      amount
      transaction {
        blockTimestamp
        transactionHash
      }
    }

    # Circle payouts
    payoutDistributeds(where: { user: $userId }, orderBy: transaction__blockTimestamp, orderDirection: desc) {
      id
      user {
        id
        username
        fullName
      }
      circleId
      round
      payoutAmount
      transaction {
        blockTimestamp
        transactionHash
      }
    }

    # Goal contributions
    goalContributions(where: { user: $userId }, orderBy: transaction__blockTimestamp, orderDirection: desc) {
      id
      user {
        id
        username
        fullName
      }
      goalId
      amount
      transaction {
        blockTimestamp
        transactionHash
      }
    }

    # Goal withdrawals
    goalWithdrawns(where: { user: $userId }, orderBy: transaction__blockTimestamp, orderDirection: desc) {
      id
      user {
        id
        username
        fullName
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

    # Goal completions
    goalCompleteds(where: { user: $userId }, orderBy: transaction__blockTimestamp, orderDirection: desc) {
      id
      user {
        id
        username
        fullName
      }
      goalId
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
        username
        fullName
      }
      circleId
      round
      fee
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
        username
        fullName
      }
      circleId
      amount
      transaction {
        blockTimestamp
        transactionHash
      }
    }

    # Get circle details for all circles user participated in
    circles(where: { id_in: [] }) {
      id
      circleId
      circleName
    }

    # Get goal details for all goals user created
    personalGoals(where: { user: $userId }) {
      id
      goalId
      goalName
      goalAmount
    }
  }
`;

// Separate query to get circle names
const circleNamesQuery = gql`
  query GetCircleNames($circleIds: [BigInt!]!) {
    circles(where: { circleId_in: $circleIds }) {
      id
      circleId
      circleName
    }
  }
`;

// Query to get user profiles by addresses
const userProfilesQuery = gql`
  query GetUserProfiles($addresses: [Bytes!]!) {
    users(where: { id_in: $addresses }) {
      id
      username
      fullName
    }
  }
`;

export interface Transaction {
    id: string;
    type:
    | 'circle_contribution'
    | 'circle_payout'
    | 'goal_contribution'
    | 'goal_withdrawal'
    | 'goal_completion'
    | 'late_payment'
    | 'collateral_withdrawal'
    | 'cusd_send'
    | 'cusd_receive';
    amount: bigint;
    currency: string;
    timestamp: bigint;
    transactionHash: string;
    status: 'success';
    fee?: bigint;
    note?: string;
    // Additional metadata
    circleName?: string;
    circleId?: bigint;
    goalName?: string;
    goalId?: bigint;
    round?: bigint;
    penalty?: bigint;
    // For cUSD transfers
    from?: string;
    to?: string;
    fromUsername?: string;
    fromFullName?: string;
    toUsername?: string;
    toFullName?: string;
}

export const useTransactionHistory = () => {
    const account = useActiveAccount();

    // Fetch transaction history
    const {
        data: transactionsData,
        isLoading,
        refetch,
    } = useQuery({
        queryKey: ["transactionHistory", account?.address],
        async queryFn() {
            if (!account?.address) return null;

            try {
                console.log("🔄 [TransactionHistory] Fetching transaction history...");

                // Fetch all transaction events from subgraph
                const result: any = await request(
                    SUBGRAPH_URL,
                    transactionHistoryQuery,
                    { userId: account.address.toLowerCase() },
                    SUBGRAPH_HEADERS
                );

                const userAddress = account.address.toLowerCase();
                const rpcRequest = getRpcClient({ client, chain: defineChain(CHAIN_ID) });
                const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
                const paddedAddress = ("0x000000000000000000000000" + userAddress.slice(2)) as `0x${string}`;

                // Fetch sent transfers (topic1 = from)
                const sentLogsPromise = eth_getLogs(rpcRequest, {
                    address: CUSD_ADDRESS,
                    fromBlock: 1n,
                    topics: [TRANSFER_TOPIC, paddedAddress],
                });

                // Fetch received transfers (topic2 = to)
                const receivedLogsPromise = eth_getLogs(rpcRequest, {
                    address: CUSD_ADDRESS,
                    fromBlock: 1n,
                    topics: [TRANSFER_TOPIC, null, paddedAddress],
                });

                const [sentLogs, receivedLogs] = await Promise.all([
                    sentLogsPromise,
                    receivedLogsPromise,
                ]);

                // Parse logs
                const parseLog = (log: any) => {
                    try {
                        // Topics are 32 bytes (66 hex chars with 0x), addresses are last 20 bytes (40 hex chars)
                        const from = ("0x" + log.topics[1].slice(-40)).toLowerCase();
                        const to = ("0x" + log.topics[2].slice(-40)).toLowerCase();
                        const value = BigInt(log.data);
                        return {
                            ...log,
                            args: { from, to, value },
                        };
                    } catch (e) {
                        console.warn("Failed to parse log:", e);
                        return null;
                    }
                };

                const sentTransfers = sentLogs.map(parseLog).filter((l: any) => l !== null);
                const receivedTransfers = receivedLogs.map(parseLog).filter((l: any) => l !== null);

                // Combine and filter out internal contract transfers
                const personalSavingsAddr = PERSONAL_SAVINGS_ADDRESS?.toLowerCase();
                const circleSavingsAddr = CIRCLE_SAVINGS_ADDRESS?.toLowerCase();

                console.log("🔍 [TransactionHistory] Filtering addresses:", {
                    personalSavings: personalSavingsAddr,
                    circleSavings: circleSavingsAddr,
                    totalTransfers: sentTransfers.length + receivedTransfers.length
                });

                const rawCusdTransfers = [...sentTransfers, ...receivedTransfers].filter((event: any) => {
                    const from = event.args.from;
                    const to = event.args.to;

                    // Filter out transfers involving savings contracts
                    const isInternalTransfer =
                        from === personalSavingsAddr || to === personalSavingsAddr ||
                        from === circleSavingsAddr || to === circleSavingsAddr;

                    if (isInternalTransfer) {
                        console.log("🚫 [TransactionHistory] Filtered internal transfer:", { from, to });
                    }

                    return !isInternalTransfer;
                });

                console.log(`✅ [TransactionHistory] After filtering: ${rawCusdTransfers.length} transfers (removed ${sentTransfers.length + receivedTransfers.length - rawCusdTransfers.length} internal transfers)`);

                // Fetch timestamps for these transfers
                const blockCache = new Map<string, bigint>();

                const cusdTransfers = await Promise.all(
                    rawCusdTransfers.map(async (event: any) => {
                        const blockNumber = event.blockNumber;
                        let timestamp = blockCache.get(blockNumber.toString());

                        if (!timestamp) {
                            try {
                                const block = await eth_getBlockByNumber(rpcRequest, {
                                    blockNumber: blockNumber,
                                    includeTransactions: false,
                                });
                                timestamp = block.timestamp;
                                blockCache.set(blockNumber.toString(), timestamp);
                            } catch (e) {
                                console.warn(`Could not fetch block ${blockNumber}`, e);
                                timestamp = BigInt(Math.floor(Date.now() / 1000));
                            }
                        }

                        return {
                            ...event,
                            timestamp: timestamp,
                        };
                    })
                );

                console.log(`📊 [TransactionHistory] Found ${cusdTransfers.length} cUSD transfers`);

                // Extract unique circle IDs from contributions and payouts
                const circleIds = [
                    ...new Set([
                        ...result.contributionMades.map((c: any) => c.circleId),
                        ...result.payoutDistributeds.map((p: any) => p.circleId),
                        ...result.latePaymentRecordeds.map((l: any) => l.circleId),
                        ...result.collateralWithdrawns.map((cw: any) => cw.circleId),
                    ])
                ];

                // Fetch circle names if there are any circles
                let circleNamesMap = new Map<string, string>();
                if (circleIds.length > 0) {
                    const circleNamesResult: any = await request(
                        SUBGRAPH_URL,
                        circleNamesQuery,
                        { circleIds },
                        SUBGRAPH_HEADERS
                    );
                    circleNamesResult.circles.forEach((circle: any) => {
                        circleNamesMap.set(circle.circleId, circle.circleName);
                    });
                }

                // Create goal names and amounts maps
                const goalNamesMap = new Map<string, string>();
                const goalAmountsMap = new Map<string, bigint>();
                result.personalGoals.forEach((goal: any) => {
                    goalNamesMap.set(goal.goalId, goal.goalName);
                    goalAmountsMap.set(goal.goalId, BigInt(goal.goalAmount));
                });

                // Extract unique addresses from cUSD transfers
                const uniqueAddresses = [
                    ...new Set(
                        cusdTransfers.flatMap((event: any) => [
                            event.args.from?.toLowerCase(),
                            event.args.to?.toLowerCase(),
                        ]).filter((addr: string) => addr && addr !== userAddress)
                    )
                ];

                // Fetch user profiles for these addresses
                let userProfilesMap = new Map<string, { username: string; fullName: string }>();
                if (uniqueAddresses.length > 0) {
                    try {
                        const profilesResult: any = await request(
                            SUBGRAPH_URL,
                            userProfilesQuery,
                            { addresses: uniqueAddresses },
                            SUBGRAPH_HEADERS
                        );
                        profilesResult.users.forEach((user: any) => {
                            userProfilesMap.set(user.id.toLowerCase(), {
                                username: user.username,
                                fullName: user.fullName,
                            });
                        });
                    } catch (err) {
                        console.warn("⚠️ [TransactionHistory] Could not fetch user profiles:", err);
                    }
                }

                return {
                    ...result,
                    circleNamesMap,
                    goalNamesMap,
                    goalAmountsMap,
                    cusdTransfers,
                    userProfilesMap,
                };
            } catch (err) {
                console.error("❌ [TransactionHistory] Error fetching from Subgraph:", err);
                throw err;
            }
        },
        enabled: !!account?.address,
        refetchInterval: 10000, // Refetch every 10 seconds for real-time updates
        gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        refetchOnMount: true,
        retry: 1,
    });

    // Transform data into unified transaction list
    const transactions = useMemo<Transaction[]>(() => {
        if (!transactionsData) return [];

        const allTransactions: Transaction[] = [];
        const userAddress = account?.address?.toLowerCase();

        // Process cUSD transfers
        transactionsData.cusdTransfers?.forEach((event: any) => {
            const from = event.args.from?.toLowerCase();
            const to = event.args.to?.toLowerCase();
            const isSend = from === userAddress;
            const amount = BigInt(event.args.value);

            // Skip zero value transfers if desired, or keep them

            const otherAddress = isSend ? to : from;
            const otherProfile = transactionsData.userProfilesMap?.get(otherAddress);

            allTransactions.push({
                id: `${event.transactionHash}-${event.logIndex || 0}`,
                type: isSend ? 'cusd_send' : 'cusd_receive',
                amount: amount,
                currency: 'cUSD',
                timestamp: event.timestamp, // This is now BigInt from queryFn
                transactionHash: event.transactionHash,
                status: 'success',
                fee: 0n, // We don't have gas fee info easily here
                from: from,
                to: to,
                fromUsername: isSend ? 'You' : (otherProfile?.username || from),
                fromFullName: isSend ? 'You' : (otherProfile?.fullName || ''),
                toUsername: !isSend ? 'You' : (otherProfile?.username || to),
                toFullName: !isSend ? 'You' : (otherProfile?.fullName || ''),
                note: isSend
                    ? `Sent to ${otherProfile?.username || (otherAddress ? `${otherAddress.slice(0, 6)}...${otherAddress.slice(-4)}` : 'Unknown')}`
                    : `Received from ${otherProfile?.username || (otherAddress ? `${otherAddress.slice(0, 6)}...${otherAddress.slice(-4)}` : 'Unknown')}`,
            });
        });

        // Process circle contributions
        transactionsData.contributionMades?.forEach((contrib: any) => {
            allTransactions.push({
                id: contrib.id,
                type: 'circle_contribution',
                amount: BigInt(contrib.amount),
                currency: 'cUSD',
                timestamp: BigInt(contrib.transaction.blockTimestamp),
                transactionHash: contrib.transaction.transactionHash,
                status: 'success',
                fee: 0n,
                circleName: transactionsData.circleNamesMap.get(contrib.circleId) || 'Unknown Circle',
                circleId: BigInt(contrib.circleId),
                round: BigInt(contrib.round),
                note: `Round ${contrib.round} contribution`,
            });
        });

        // Process circle payouts
        transactionsData.payoutDistributeds?.forEach((payout: any) => {
            allTransactions.push({
                id: payout.id,
                type: 'circle_payout',
                amount: BigInt(payout.payoutAmount),
                currency: 'cUSD',
                timestamp: BigInt(payout.transaction.blockTimestamp),
                transactionHash: payout.transaction.transactionHash,
                status: 'success',
                fee: 0n,
                circleName: transactionsData.circleNamesMap.get(payout.circleId) || 'Unknown Circle',
                circleId: BigInt(payout.circleId),
                round: BigInt(payout.round),
                note: `Position #${payout.round} payout`,
            });
        });

        // Process goal contributions
        transactionsData.goalContributions?.forEach((contrib: any) => {
            allTransactions.push({
                id: contrib.id,
                type: 'goal_contribution',
                amount: BigInt(contrib.amount),
                currency: 'cUSD',
                timestamp: BigInt(contrib.transaction.blockTimestamp),
                transactionHash: contrib.transaction.transactionHash,
                status: 'success',
                fee: 0n,
                goalName: transactionsData.goalNamesMap.get(contrib.goalId) || 'Unknown Goal',
                goalId: BigInt(contrib.goalId),
                note: 'Savings contribution',
            });
        });

        // Process goal withdrawals
        transactionsData.goalWithdrawns?.forEach((withdrawal: any) => {
            allTransactions.push({
                id: withdrawal.id,
                type: 'goal_withdrawal',
                amount: BigInt(withdrawal.amount),
                currency: 'cUSD',
                timestamp: BigInt(withdrawal.transaction.blockTimestamp),
                transactionHash: withdrawal.transaction.transactionHash,
                status: 'success',
                fee: 0n,
                penalty: BigInt(withdrawal.penalty),
                goalName: transactionsData.goalNamesMap.get(withdrawal.goalId) || 'Unknown Goal',
                goalId: BigInt(withdrawal.goalId),
                note: withdrawal.penalty > 0 ? `Early withdrawal` : 'Withdrawal',
            });
        });

        // Process goal completions
        transactionsData.goalCompleteds?.forEach((completion: any) => {
            const goalAmount = transactionsData.goalAmountsMap.get(completion.goalId) || 0n;
            allTransactions.push({
                id: completion.id,
                type: 'goal_completion',
                amount: goalAmount,
                currency: 'cUSD',
                timestamp: BigInt(completion.transaction.blockTimestamp),
                transactionHash: completion.transaction.transactionHash,
                status: 'success',
                fee: 0n,
                goalName: transactionsData.goalNamesMap.get(completion.goalId) || 'Unknown Goal',
                goalId: BigInt(completion.goalId),
                note: 'Goal completed successfully',
            });
        });

        // Process late payments
        transactionsData.latePaymentRecordeds?.forEach((late: any) => {
            allTransactions.push({
                id: late.id,
                type: 'late_payment',
                amount: BigInt(late.fee),
                currency: 'cUSD',
                timestamp: BigInt(late.transaction.blockTimestamp),
                transactionHash: late.transaction.transactionHash,
                status: 'success',
                fee: BigInt(late.fee),
                circleName: transactionsData.circleNamesMap.get(late.circleId) || 'Unknown Circle',
                circleId: BigInt(late.circleId),
                round: BigInt(late.round),
                note: `Late payment fee for Round ${late.round}`,
            });
        });

        // Process collateral withdrawals
        transactionsData.collateralWithdrawns?.forEach((cw: any) => {
            allTransactions.push({
                id: cw.id,
                type: 'collateral_withdrawal',
                amount: BigInt(cw.amount),
                currency: 'cUSD',
                timestamp: BigInt(cw.transaction.blockTimestamp),
                transactionHash: cw.transaction.transactionHash,
                status: 'success',
                fee: 0n,
                circleName: transactionsData.circleNamesMap.get(cw.circleId) || 'Unknown Circle',
                circleId: BigInt(cw.circleId),
                note: 'Collateral refund',
            });
        });

        // Sort all transactions by timestamp (newest first)
        return allTransactions.sort((a, b) =>
            Number(b.timestamp) - Number(a.timestamp)
        );
    }, [transactionsData]);

    return {
        transactions,
        isLoading,
        refetch,
    };
};
