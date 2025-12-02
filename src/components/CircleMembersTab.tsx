import React, { useMemo } from "react";
import { Users } from "lucide-react";
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
  query GetCircleMembers($circleId: String!) {
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
  }
`;

const CircleMembersTab: React.FC<CircleMembersTabProps> = ({
  circle,
  colors,
}) => {
  const account = useActiveAccount();
  const { data: membersData, isLoading } = useQuery({
    queryKey: ["circleMembers", circle.rawCircle?.circleId?.toString()],
    queryFn: async () => {
      if (!circle.rawCircle?.circleId) return null;
      const result = await request(SUBGRAPH_URL, GET_CIRCLE_MEMBERS, {
        circleId: circle.rawCircle.circleId.toString(),
      });
      return result.circleJoineds;
    },
    enabled: !!circle.rawCircle?.circleId,
  });

  const members = useMemo(() => {
    if (!membersData) return [];
    return membersData.map((join: any) => join.user);
  }, [membersData]);

  return (
    <div className="space-y-6">
      <div
        className="rounded-xl p-6 border"
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.border,
        }}
      >
        <h3
          className="font-bold text-lg mb-4 flex items-center gap-2"
          style={{ color: colors.text }}
        >
          <Users size={20} style={{ color: colors.primary }} />
          Circle Members ({members.length}/{circle.totalPositions})
        </h3>

        <div className="space-y-3">
          {Array.from({ length: circle.totalPositions }, (_, i) => i + 1).map(
            (position, i) => {
              const member = members[i];
              const isCurrentUser =
                member &&
                account?.address &&
                member.id?.toLowerCase() === account.address.toLowerCase();

              return (
                <div
                  key={position}
                  className="flex items-center justify-between p-3 rounded-lg border"
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                      style={{ backgroundColor: colors.primary }}
                    >
                      {position}
                    </div>
                    <div>
                      <div
                        className="font-semibold"
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
                        className="text-xs"
                        style={{ color: colors.textLight }}
                      >
                        {isLoading ? (
                          <span className="animate-pulse">...</span>
                        ) : member ? (
                          <>
                            <span className="mr-2">
                              @{member.username || "no-username"}
                            </span>
                            <span>ID: {member.accountId}</span>
                          </>
                        ) : (
                          "Waiting for member"
                        )}
                      </div>
                    </div>
                  </div>
                  {member && member.id === circle.rawCircle?.creator?.id && (
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                      Creator
                    </span>
                  )}
                </div>
              );
            }
          )}
        </div>
      </div>
    </div>
  );
};

export default CircleMembersTab;
