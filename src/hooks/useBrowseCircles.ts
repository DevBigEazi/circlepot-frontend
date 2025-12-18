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
      currentRound
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
        const result: any = await request(
          SUBGRAPH_URL,
          allCirclesQuery,
          {},
          SUBGRAPH_HEADERS
        );

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
          currentRound: BigInt(circle.currentRound || 0),
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

        return { circles, members };
      } catch (err) {
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
