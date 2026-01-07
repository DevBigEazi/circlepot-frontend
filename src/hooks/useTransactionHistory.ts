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
  USDm_ADDRESS,
  CHAIN_ID,
  PERSONAL_SAVINGS_ADDRESS,
  CIRCLE_SAVINGS_ADDRESS,
  PLATFORM_FEE_RECIPIENT,
} from "../constants/constants";

// GraphQL Query for all transaction types
const transactionHistoryQuery = gql`
  query GetTransactionHistory($userId: Bytes!) {
    # Circle contributions
    contributionMades(
      where: { user: $userId }
      orderBy: transaction__blockTimestamp
      orderDirection: desc
    ) {
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
    payoutDistributeds(
      where: { user: $userId }
      orderBy: transaction__blockTimestamp
      orderDirection: desc
    ) {
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
    goalContributions(
      where: { user: $userId }
      orderBy: transaction__blockTimestamp
      orderDirection: desc
    ) {
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
    goalWithdrawns(
      where: { user: $userId }
      orderBy: transaction__blockTimestamp
      orderDirection: desc
    ) {
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
    goalCompleteds(
      where: { user: $userId }
      orderBy: transaction__blockTimestamp
      orderDirection: desc
    ) {
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
    latePaymentRecordeds(
      where: { user: $userId }
      orderBy: transaction__blockTimestamp
      orderDirection: desc
    ) {
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
    collateralWithdrawns(
      where: { user: $userId }
      orderBy: transaction__blockTimestamp
      orderDirection: desc
    ) {
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

    # Dead circle fees deducted
    deadCircleFeeDeducteds(
      where: { creator: $userId }
      orderBy: transaction__blockTimestamp
      orderDirection: desc
    ) {
      id
      circleId
      deadFee
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
  | "circle_contribution"
  | "circle_payout"
  | "goal_contribution"
  | "goal_withdrawal"
  | "goal_completion"
  | "late_payment"
  | "collateral_withdrawal"
  | "USDm_send"
  | "late_payment"
  | "collateral_withdrawal"
  | "dead_circle_fee"
  | "USDm_send"
  | "USDm_receive";
  amount: bigint;
  currency: string;
  timestamp: bigint;
  transactionHash: string;
  status: "success";
  fee?: bigint;
  note?: string;
  // Additional metadata
  circleName?: string;
  circleId?: bigint;
  goalName?: string;
  goalId?: bigint;
  round?: bigint;
  penalty?: bigint;
  // For USDm transfers
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
        // Fetch all transaction events from subgraph
        const result: any = await request(
          SUBGRAPH_URL,
          transactionHistoryQuery,
          { userId: account.address.toLowerCase() },
          SUBGRAPH_HEADERS
        );

        const userAddress = account.address.toLowerCase();
        const rpcRequest = getRpcClient({
          client,
          chain: defineChain(CHAIN_ID),
        });
        const TRANSFER_TOPIC =
          "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
        const paddedAddress = ("0x000000000000000000000000" +
          userAddress.slice(2)) as `0x${string}`;

        // Fetch sent transfers (topic1 = from)
        const sentLogsPromise = eth_getLogs(rpcRequest, {
          address: USDm_ADDRESS,
          fromBlock: 1n,
          topics: [TRANSFER_TOPIC, paddedAddress],
        });

        // Fetch received transfers (topic2 = to)
        const receivedLogsPromise = eth_getLogs(rpcRequest, {
          address: USDm_ADDRESS,
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
            return null;
          }
        };

        const sentTransfers = sentLogs
          .map(parseLog)
          .filter((l: any) => l !== null);
        const receivedTransfers = receivedLogs
          .map(parseLog)
          .filter((l: any) => l !== null);

        // Combine and filter out internal contract transfers
        const personalSavingsAddr = PERSONAL_SAVINGS_ADDRESS?.toLowerCase();
        const circleSavingsAddr = CIRCLE_SAVINGS_ADDRESS?.toLowerCase();

        const rawUSDmTransfers = [
          ...sentTransfers,
          ...receivedTransfers,
        ].filter((event: any) => {
          const from = event.args.from;
          const to = event.args.to;

          // Filter out transfers involving savings contracts
          const isInternalTransfer =
            from === personalSavingsAddr ||
            to === personalSavingsAddr ||
            from === circleSavingsAddr ||
            to === circleSavingsAddr;

          return !isInternalTransfer;
        });

        // Fetch timestamps for these transfers
        const blockCache = new Map<string, bigint>();

        const USDmTransfers = await Promise.all(
          rawUSDmTransfers.map(async (event: any) => {
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
                timestamp = BigInt(Math.floor(Date.now() / 1000));
              }
            }

            return {
              ...event,
              timestamp: timestamp,
            };
          })
        );

        // Extract unique circle IDs from contributions and payouts
        const circleIds = [
          ...new Set([
            ...result.contributionMades.map((c: any) => c.circleId),
            ...result.payoutDistributeds.map((p: any) => p.circleId),
            ...result.latePaymentRecordeds.map((l: any) => l.circleId),
            ...result.latePaymentRecordeds.map((l: any) => l.circleId),
            ...result.collateralWithdrawns.map((cw: any) => cw.circleId),
            ...result.deadCircleFeeDeducteds.map((d: any) => d.circleId),
          ]),
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

        // Extract unique addresses from USDm transfers
        const uniqueAddresses = [
          ...new Set(
            USDmTransfers
              .flatMap((event: any) => [
                event.args.from?.toLowerCase(),
                event.args.to?.toLowerCase(),
              ])
              .filter((addr: string) => addr && addr !== userAddress)
          ),
        ];

        // Fetch user profiles for these addresses
        let userProfilesMap = new Map<
          string,
          { username: string; fullName: string }
        >();
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
            throw err;
          }
        }

        return {
          ...result,
          circleNamesMap,
          goalNamesMap,
          goalAmountsMap,
          USDmTransfers,
          userProfilesMap,
        };
      } catch (err) {
        throw err;
      }
    },
    enabled: !!account?.address,
  });

  // Transform data into unified transaction list
  const transactions = useMemo<Transaction[]>(() => {
    if (!transactionsData) return [];

    const allTransactions: Transaction[] = [];
    const userAddress = account?.address?.toLowerCase();

    // Group transfers by hash to handle fee merging
    const transfersByHash = new Map<string, any[]>();
    transactionsData.USDmTransfers?.forEach((event: any) => {
      const hash = event.transactionHash;
      if (!transfersByHash.has(hash)) transfersByHash.set(hash, []);
      transfersByHash.get(hash)?.push(event);
    });

    transfersByHash.forEach((events) => {
      const userSends = events.filter(
        (e) => e.args.from?.toLowerCase() === userAddress
      );
      const userReceives = events.filter(
        (e) => e.args.to?.toLowerCase() === userAddress
      );

      // Handle Sent Transfers (Potential Merging)
      let platformFee = 0n;
      const feeRecipient = PLATFORM_FEE_RECIPIENT?.toLowerCase();

      // If we find multiple sends from the user in one TX, look for a platform fee to merge
      if (userSends.length > 1 && feeRecipient) {
        const feeEvent = userSends.find(
          (e) => e.args.to?.toLowerCase() === feeRecipient
        );
        if (feeEvent) {
          platformFee = BigInt(feeEvent.args.value);
        }
      }

      // Add Sends
      userSends.forEach((event) => {
        const to = event.args.to?.toLowerCase();
        // Skip the explicit "Fee" entry if we've already merged it into another entry in this hash
        if (platformFee > 0n && to === feeRecipient && userSends.length > 1) {
          return;
        }

        const amount = BigInt(event.args.value);
        const otherProfile = transactionsData.userProfilesMap?.get(to);

        allTransactions.push({
          id: `${event.transactionHash}-${event.logIndex || 0}`,
          type: "USDm_send",
          amount: amount,
          currency: "USDm",
          timestamp: event.timestamp,
          transactionHash: event.transactionHash,
          status: "success",
          fee: platformFee, // Reflect the platform fee here
          from: userAddress,
          to: to,
          fromUsername: "You",
          fromFullName: "You",
          toUsername: otherProfile?.username || to,
          toFullName: otherProfile?.fullName || "",
          note: `Sent to ${otherProfile?.username ||
            (to ? `${to.slice(0, 6)}...${to.slice(-4)}` : "Unknown")
            }`,
        });
      });

      // Add Receives
      userReceives.forEach((event) => {
        const from = event.args.from?.toLowerCase();
        const amount = BigInt(event.args.value);
        const otherProfile = transactionsData.userProfilesMap?.get(from);

        allTransactions.push({
          id: `${event.transactionHash}-${event.logIndex || 0}`,
          type: "USDm_receive",
          amount: amount,
          currency: "USDm",
          timestamp: event.timestamp,
          transactionHash: event.transactionHash,
          status: "success",
          fee: 0n,
          from: from,
          to: userAddress,
          fromUsername: otherProfile?.username || from,
          fromFullName: otherProfile?.fullName || "",
          toUsername: "You",
          toFullName: "You",
          note: `Received from ${otherProfile?.username ||
            (from ? `${from.slice(0, 6)}...${from.slice(-4)}` : "Unknown")
            }`,
        });
      });
    });

    // Process circle contributions
    transactionsData.contributionMades?.forEach((contrib: any) => {
      allTransactions.push({
        id: contrib.id,
        type: "circle_contribution",
        amount: BigInt(contrib.amount),
        currency: "USDm",
        timestamp: BigInt(contrib.transaction.blockTimestamp),
        transactionHash: contrib.transaction.transactionHash,
        status: "success",
        fee: 0n,
        circleName:
          transactionsData.circleNamesMap.get(contrib.circleId) ||
          "Unknown Circle",
        circleId: BigInt(contrib.circleId),
        round: BigInt(contrib.round),
        note: `Round ${contrib.round} contribution`,
      });
    });

    // Process circle payouts
    transactionsData.payoutDistributeds?.forEach((payout: any) => {
      allTransactions.push({
        id: payout.id,
        type: "circle_payout",
        amount: BigInt(payout.payoutAmount),
        currency: "USDm",
        timestamp: BigInt(payout.transaction.blockTimestamp),
        transactionHash: payout.transaction.transactionHash,
        status: "success",
        fee: 0n,
        circleName:
          transactionsData.circleNamesMap.get(payout.circleId) ||
          "Unknown Circle",
        circleId: BigInt(payout.circleId),
        round: BigInt(payout.round),
        note: `Position #${payout.round} payout`,
      });
    });

    // Process goal contributions
    transactionsData.goalContributions?.forEach((contrib: any) => {
      allTransactions.push({
        id: contrib.id,
        type: "goal_contribution",
        amount: BigInt(contrib.amount),
        currency: "USDm",
        timestamp: BigInt(contrib.transaction.blockTimestamp),
        transactionHash: contrib.transaction.transactionHash,
        status: "success",
        fee: 0n,
        goalName:
          transactionsData.goalNamesMap.get(contrib.goalId) || "Unknown Goal",
        goalId: BigInt(contrib.goalId),
        note: "Savings contribution",
      });
    });

    // Process goal withdrawals (only early withdrawals, not completions)
    // When a goal is completed, isActive = false and it's captured by goalCompleteds
    transactionsData.goalWithdrawns?.forEach((withdrawal: any) => {
      // Skip withdrawals where isActive = false (these are completions, not early withdrawals)
      if (withdrawal.isActive === false) {
        return;
      }

      allTransactions.push({
        id: withdrawal.id,
        type: "goal_withdrawal",
        amount: BigInt(withdrawal.amount),
        currency: "USDm",
        timestamp: BigInt(withdrawal.transaction.blockTimestamp),
        transactionHash: withdrawal.transaction.transactionHash,
        status: "success",
        fee: 0n,
        penalty: BigInt(withdrawal.penalty),
        goalName:
          transactionsData.goalNamesMap.get(withdrawal.goalId) ||
          "Unknown Goal",
        goalId: BigInt(withdrawal.goalId),
        note: withdrawal.penalty > 0 ? `Early withdrawal` : "Withdrawal",
      });
    });

    // Process goal completions (deduplicate by goalId)
    const seenGoalIds = new Set();
    transactionsData.goalCompleteds?.forEach((completion: any) => {
      // Skip if we've already seen this goalId
      if (seenGoalIds.has(completion.goalId)) return;
      seenGoalIds.add(completion.goalId);

      const goalAmount =
        transactionsData.goalAmountsMap.get(completion.goalId) || 0n;
      allTransactions.push({
        id: completion.id,
        type: "goal_completion",
        amount: goalAmount,
        currency: "USDm",
        timestamp: BigInt(completion.transaction.blockTimestamp),
        transactionHash: completion.transaction.transactionHash,
        status: "success",
        fee: 0n,
        goalName:
          transactionsData.goalNamesMap.get(completion.goalId) ||
          "Unknown Goal",
        goalId: BigInt(completion.goalId),
        note: "Goal completed successfully",
      });
    });

    // Process late payments
    transactionsData.latePaymentRecordeds?.forEach((late: any) => {
      allTransactions.push({
        id: late.id,
        type: "late_payment",
        amount: BigInt(late.fee),
        currency: "USDm",
        timestamp: BigInt(late.transaction.blockTimestamp),
        transactionHash: late.transaction.transactionHash,
        status: "success",
        fee: BigInt(late.fee),
        circleName:
          transactionsData.circleNamesMap.get(late.circleId) ||
          "Unknown Circle",
        circleId: BigInt(late.circleId),
        round: BigInt(late.round),
        note: `Late payment fee for Round ${late.round}`,
      });
    });

    // Create a map of dead circle fees by transaction hash for merging
    const deadCircleFeesByHash = new Map<string, any>();
    transactionsData.deadCircleFeeDeducteds?.forEach((fee: any) => {
      deadCircleFeesByHash.set(fee.transaction.transactionHash, fee);
    });

    // Process collateral withdrawals and merge with dead circle fees if applicable
    transactionsData.collateralWithdrawns?.forEach((cw: any) => {
      const txHash = cw.transaction.transactionHash;
      const deadCircleFee = deadCircleFeesByHash.get(txHash);

      // If there's a dead circle fee in the same transaction, merge it
      const feeAmount = deadCircleFee ? BigInt(deadCircleFee.deadFee) : 0n;
      const hasDeadCircleFee = feeAmount > 0n;

      allTransactions.push({
        id: cw.id,
        type: "collateral_withdrawal",
        amount: BigInt(cw.amount),
        currency: "USDm",
        timestamp: BigInt(cw.transaction.blockTimestamp),
        transactionHash: txHash,
        status: "success",
        fee: feeAmount,
        circleName:
          transactionsData.circleNamesMap.get(cw.circleId) || "Unknown Circle",
        circleId: BigInt(cw.circleId),
        note: hasDeadCircleFee
          ? `Collateral refund (Dead circle fee: ${(Number(feeAmount) / 1e18).toFixed(2)} USDm deducted)`
          : "Collateral refund",
      });

      // Mark this fee as processed so we don't create a duplicate transaction
      if (deadCircleFee) {
        deadCircleFeesByHash.delete(txHash);
      }
    });

    // Process any remaining dead circle fees that weren't merged
    // (This shouldn't normally happen, but handles edge cases)
    deadCircleFeesByHash.forEach((fee: any) => {
      allTransactions.push({
        id: fee.id,
        type: "dead_circle_fee",
        amount: BigInt(fee.deadFee),
        currency: "USDm",
        timestamp: BigInt(fee.transaction.blockTimestamp),
        transactionHash: fee.transaction.transactionHash,
        status: "success",
        fee: BigInt(fee.deadFee),
        circleName:
          transactionsData.circleNamesMap.get(fee.circleId) || "Unknown Circle",
        circleId: BigInt(fee.circleId),
        note: "Fee for dead circle",
      });
    });

    // Sort all transactions by timestamp (newest first)
    return allTransactions.sort(
      (a, b) => Number(b.timestamp) - Number(a.timestamp)
    );
  }, [transactionsData, account]);

  return {
    transactions,
    isLoading,
    refetch,
  };
};
