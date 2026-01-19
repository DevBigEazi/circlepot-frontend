import React, { useMemo } from "react";
import { Users, CheckCircle } from "lucide-react";
import { ActiveCircle } from "../interfaces/interfaces";
import { useQuery } from "@tanstack/react-query";
import { request, gql } from "graphql-request";
import { SUBGRAPH_URL } from "../constants/constants";
import { useActiveAccount } from "thirdweb/react";

interface CircleMembersTabProps {
  circle: ActiveCircle;
  colors: any;
}

const GET_CIRCLE_MEMBERS = gql`
  query GetCircleMembers($circleId: String!, $currentRound: String!) {
    circleJoineds(
      where: { circleId: $circleId }
      orderBy: transaction__blockTimestamp
      orderDirection: asc
    ) {
      user {
        id
        username
        fullName
        accountId
        photo
      }
    }
    positionAssigneds(
      where: { circleId: $circleId }
      orderBy: position
      orderDirection: asc
    ) {
      user {
        id
      }
      position
    }
    contributionMades(where: { circleId: $circleId, round: $currentRound }) {
      user {
        id
      }
    }
    memberForfeiteds(where: { circleId: $circleId, round: $currentRound }) {
      forfeitedUser {
        id
      }
    }
  }
`;

const CircleMembersTab: React.FC<CircleMembersTabProps> = ({
  circle,
  colors,
}) => {
  const account = useActiveAccount();
  const currentRound = circle.rawCircle?.currentRound || 1n;
  const isActiveCircle = circle.status === "active";

  const { data: membersData, isLoading } = useQuery({
    queryKey: [
      "circleMembers",
      circle.rawCircle?.circleId?.toString(),
      currentRound.toString(),
    ],
    queryFn: async () => {
      if (!circle.rawCircle?.circleId) return null;
      const result = await request(SUBGRAPH_URL, GET_CIRCLE_MEMBERS, {
        circleId: circle.rawCircle.circleId.toString(),
        currentRound: currentRound.toString(),
      });
      return result;
    },
    enabled: !!circle.rawCircle?.circleId,
    refetchInterval: isActiveCircle ? 5000 : false, // Refetch every 5s for active circles
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0, // Always consider data stale
  });

  const members = useMemo(() => {
    if (!membersData?.circleJoineds) return [];

    const joinedUsers = membersData.circleJoineds.map((join: any) => join.user);
    const positions = membersData.positionAssigneds || [];

    // If circle has started and positions are assigned, sort by position
    if (positions.length > 0) {
      // Create a map of userId to position
      const positionMap = new Map(
        positions.map((p: any) => [
          p.user.id.toLowerCase(),
          Number(p.position),
        ]),
      );

      // Sort users by their assigned position
      return [...joinedUsers].sort((a: any, b: any) => {
        const posA = Number(positionMap.get(a.id.toLowerCase()) ?? 999);
        const posB = Number(positionMap.get(b.id.toLowerCase()) ?? 999);
        return posA - posB;
      });
    }

    // Before circle starts, use join order
    return joinedUsers;
  }, [membersData]);

  const contributedMembers = useMemo(() => {
    const contributed = new Set<string>();

    // Add members who manually contributed
    if (membersData?.contributionMades) {
      membersData.contributionMades.forEach((c: any) => {
        contributed.add(c.user.id.toLowerCase());
      });
    }

    // Add members who were forfeited (their collateral was deducted, counts as contributed)
    if (membersData?.memberForfeiteds) {
      membersData.memberForfeiteds.forEach((f: any) => {
        contributed.add(f.forfeitedUser.id.toLowerCase());
      });
    }

    return contributed;
  }, [membersData, isActiveCircle, circle.rawCircle?.circleId, currentRound]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div
        className="rounded-xl p-3 sm:p-6 border"
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.border,
        }}
      >
        <h3
          className="font-bold text-sm sm:text-lg mb-3 sm:mb-4 flex items-center gap-1.5 sm:gap-2"
          style={{ color: colors.text }}
        >
          <Users
            size={16}
            className="sm:w-5 sm:h-5"
            style={{ color: colors.primary }}
          />
          <span className="truncate">
            Members ({members.length}/{circle.totalPositions})
          </span>
        </h3>

        <div className="space-y-2 sm:space-y-3">
          {Array.from({ length: circle.totalPositions }, (_, i) => i + 1).map(
            (position, i) => {
              const member = members[i];
              const isCurrentUser =
                member &&
                account?.address &&
                member.id?.toLowerCase() === account.address.toLowerCase();

              const hasContributed =
                member && contributedMembers.has(member.id.toLowerCase());
              const isRecipient = position === Number(currentRound);

              return (
                <div
                  key={position}
                  className="flex flex-col gap-2 p-2 sm:p-3 rounded-lg border"
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  }}
                >
                  {/* Member Info Row */}
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm shrink-0"
                      style={{ backgroundColor: colors.primary }}
                    >
                      {position}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div
                        className="font-semibold text-xs sm:text-sm truncate"
                        style={{ color: colors.text }}
                      >
                        {isLoading ? (
                          <span className="animate-pulse">Loading...</span>
                        ) : member ? (
                          isCurrentUser ? (
                            "You"
                          ) : (
                            member.username || member.fullName || "Unknown User"
                          )
                        ) : (
                          "Empty Slot"
                        )}
                      </div>
                      <div
                        className="text-[10px] sm:text-xs truncate"
                        style={{ color: colors.textLight }}
                      >
                        {isLoading ? (
                          <span className="animate-pulse">...</span>
                        ) : member ? (
                          <>
                            <span className="mr-1">
                              @{member.username || "no-username"}
                            </span>
                          </>
                        ) : (
                          "Waiting for member"
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Badges Row - Stack on very small screens */}
                  {(isActiveCircle ||
                    (member &&
                      member.id === circle.rawCircle?.creator?.id)) && (
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 ml-9 sm:ml-11">
                      {/* Contribution Status - Only show for active circles */}
                      {isActiveCircle && member && (
                        <>
                          {isRecipient ? (
                            <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-purple-500 text-white font-semibold whitespace-nowrap">
                              Recipient
                            </span>
                          ) : hasContributed ? (
                            <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-green-500 text-white font-semibold flex items-center gap-0.5 sm:gap-1 whitespace-nowrap">
                              <CheckCircle
                                size={10}
                                className="sm:w-3 sm:h-3"
                              />
                              <span>Contributed</span>
                            </span>
                          ) : (
                            <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-orange-500 text-white font-semibold whitespace-nowrap">
                              Pending
                            </span>
                          )}
                        </>
                      )}

                      {/* Creator Badge */}
                      {member &&
                        member.id === circle.rawCircle?.creator?.id && (
                          <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-blue-500 text-white font-semibold whitespace-nowrap">
                            Creator
                          </span>
                        )}
                    </div>
                  )}
                </div>
              );
            },
          )}
        </div>
      </div>
    </div>
  );
};

export default CircleMembersTab;
