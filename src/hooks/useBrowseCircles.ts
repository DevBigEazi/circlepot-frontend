import { useQuery } from "@tanstack/react-query";
import { gql, request } from "graphql-request";
import { SUBGRAPH_URL, SUBGRAPH_HEADERS } from "../constants/constants";
import { Circle } from "../interfaces/interfaces";

// GraphQL query to fetch all circles (public and private)
const allCirclesQuery = gql`
  query GetAllCircles {
    circles(orderBy: updatedAt, orderDirection: desc, first: 100) {
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
    
    # Get all members for these circles
    circleJoineds(orderBy: transaction__blockTimestamp, orderDirection: asc, first: 1000) {
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
    
    # Get payouts to calculate currentRound
    payoutDistributeds(orderBy: round, orderDirection: desc, first: 1000) {
      circleId
      round
    }
  }
`;

export const useBrowseCircles = (enablePolling: boolean = true) => {
    const {
        data: circlesData,
        isLoading,
        refetch,
        error
    } = useQuery({
        queryKey: ["browseCircles"],
        async queryFn() {
            try {
                console.log("🔄 [BrowseCircles] Fetching all circles...");
                const result: any = await request(
                    SUBGRAPH_URL,
                    allCirclesQuery,
                    {},
                    SUBGRAPH_HEADERS
                );

                // Calculate currentRound for each circle
                const payouts = result.payoutDistributeds || [];
                const roundMap = new Map<string, bigint>();
                payouts.forEach((p: any) => {
                    const cid = p.circleId.toString();
                    const r = BigInt(p.round);
                    if (!roundMap.has(cid) || r > roundMap.get(cid)!) {
                        roundMap.set(cid, r);
                    }
                });

                // Process circles
                const circles: Circle[] = result.circles.map((circle: any) => ({
                    id: circle.id,
                    circleId: BigInt(circle.circleId),
                    circleName: circle.circleName,
                    circleDescription: circle.circleDescription,
                    contributionAmount: BigInt(circle.contributionAmount),
                    collateralAmount: BigInt(circle.collateralAmount),
                    frequency: circle.frequency,
                    maxMembers: BigInt(circle.maxMembers),
                    currentMembers: BigInt(circle.currentMembers),
                    currentRound: (roundMap.get(circle.circleId) || 0n) + 1n,
                    visibility: circle.visibility,
                    state: circle.state,
                    createdAt: BigInt(circle.createdAt),
                    startedAt: BigInt(circle.startedAt),
                    creator: circle.creator,
                }));

                // Process members
                const members = result.circleJoineds.map((joined: any) => ({
                    id: joined.user.id,
                    circleId: BigInt(joined.circleId),
                    currentMembers: BigInt(joined.currentMembers),
                    circleState: joined.circleState,
                    timestamp: BigInt(joined.transaction.blockTimestamp),
                    user: joined.user,
                }));

                console.log(`✅ [BrowseCircles] Fetched ${circles.length} circles`);

                return { circles, members };
            } catch (err) {
                console.error("❌ [BrowseCircles] Error fetching circles:", err);
                throw err;
            }
        },
        refetchInterval: enablePolling ? 10000 : 0, // Poll every 10 seconds if enabled
        gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        refetchOnMount: true,
        retry: 1,
    });

    return {
        circles: circlesData?.circles || [],
        members: circlesData?.members || [],
        isLoading,
        error,
        refetch,
    };
};
