import React, { useState, useMemo } from "react";
import {
  Search,
  Users,
  Lock,
  Globe,
  DollarSign,
  Calendar,
  TrendingUp,
} from "lucide-react";
import { useBrowseCircles } from "../hooks/useBrowseCircles";
import { useThemeColors } from "../hooks/useThemeColors";
import { useCircleSavings } from "../hooks/useCircleSavings";
import { client } from "../thirdwebClient";
import { Circle } from "../interfaces/interfaces";
import JoinCircleModal from "../modals/JoinCircleModal";
import { getFrequencyText } from "../utils/helpers";
import { CircleCardSkeleton } from "../components/Skeleton";
import SEO from "../components/SEO";

const Browse: React.FC = () => {
  const colors = useThemeColors();
  const { circles, isLoading } = useBrowseCircles(true);
  const { joinCircle, isTransactionPending } = useCircleSavings(client);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<
    "all" | "public" | "private" | "weekly" | "monthly" | "daily"
  >("all");
  const [joiningCircleId, setJoiningCircleId] = useState<bigint | null>(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedCircle, setSelectedCircle] = useState<Circle | null>(null);

  const formatCurrency = (amount: bigint) => {
    return (Number(amount) / 1e18).toFixed(2);
  };

  const calculateMinMembersToStart = (maxMembers: bigint) => {
    return Math.ceil(Number(maxMembers) * 0.6);
  };

  // Filter circles based on search and active filter
  const filteredCircles = useMemo(() => {
    return circles.filter((circle: Circle) => {
      // Show circles in CREATED (1) or VOTING (2) state
      const isJoinableState = circle.state === 1 || circle.state === 2;

      // Search filter
      const matchesSearch =
        circle.circleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        circle.circleDescription
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        circle.creator.username
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        circle.creator.fullName
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase());

      // Type/frequency filter
      const matchesFilter =
        activeFilter === "all" ||
        (activeFilter === "public" && circle.visibility === 1) ||
        (activeFilter === "private" && circle.visibility === 0) ||
        (activeFilter === "daily" && circle.frequency === 0) ||
        (activeFilter === "weekly" && circle.frequency === 1) ||
        (activeFilter === "monthly" && circle.frequency === 2);

      return isJoinableState && matchesSearch && matchesFilter;
    });
  }, [circles, searchQuery, activeFilter]);

  const handleJoinCircleClick = (circle: Circle) => {
    setSelectedCircle(circle);
    setShowJoinModal(true);
  };

  const handleJoinCircle = async (
    circleId: bigint,
    collateralAmount: bigint,
  ) => {
    try {
      setJoiningCircleId(circleId);
      await joinCircle(circleId, collateralAmount);
      // Success - modal will handle the success screen
    } catch (error) {
      throw error;
    } finally {
      setJoiningCircleId(null);
    }
  };

  return (
    <>
      <SEO
        title="Browse Circles"
        description="Discover and join rotating savings circles worldwide. Find public circles to join or browse private circles by invitation. Start saving with a global community today."
        url="/browse"
      />
      <div
        className="pb-20 min-h-screen"
        style={{ backgroundColor: colors.background }}
      >
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Search and Filter */}
          <div className="mb-6">
            <div className="relative mb-4">
              <Search
                className="absolute left-4 top-1/2 transform -translate-y-1/2"
                size={20}
                style={{ color: colors.textLight }}
              />
              <input
                type="text"
                placeholder="Search circles by name, description, or creator..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 rounded-xl transition"
                style={{
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                  color: colors.text,
                }}
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {(
                [
                  "all",
                  "public",
                  "private",
                  "daily",
                  "weekly",
                  "monthly",
                ] as const
              ).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-3 sm:px-4 py-2 rounded-full font-semibold text-xs sm:text-sm whitespace-nowrap transition ${
                    activeFilter === filter ? "text-white shadow-md" : ""
                  }`}
                  style={
                    activeFilter === filter
                      ? { background: colors.primary }
                      : {
                          backgroundColor: colors.infoBg,
                          color: colors.textLight,
                        }
                  }
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Circle Type Explanation */}
          <div className="mb-8 grid md:grid-cols-2 gap-4">
            <div
              className="rounded-xl p-4 border"
              style={{
                backgroundColor: colors.accentBg,
                borderColor: colors.accentBorder,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Globe size={20} style={{ color: colors.primary }} />
                <h4 className="font-bold" style={{ color: colors.text }}>
                  Public Circles
                </h4>
              </div>
              <p className="text-sm" style={{ color: colors.textLight }}>
                Open to everyone. Anyone can join and see circle details. Great
                for building community and meeting new people.
              </p>
            </div>
            <div
              className="rounded-xl p-4 border"
              style={{
                backgroundColor: colors.warningBg,
                borderColor: colors.warningBorder,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Lock size={20} style={{ color: colors.secondary }} />
                <h4 className="font-bold" style={{ color: colors.text }}>
                  Private Circles
                </h4>
              </div>
              <p className="text-sm" style={{ color: colors.textLight }}>
                Invite-only circles. Only members can see details. Perfect for
                trusted groups like friends, colleagues, or specific
                communities.
              </p>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="grid gap-4 mt-8">
              {[1, 2, 3].map((i) => (
                <CircleCardSkeleton key={i} />
              ))}
            </div>
          )}

          {/* No Results */}
          {!isLoading && filteredCircles.length === 0 && (
            <div className="text-center py-12">
              <Users
                size={48}
                style={{ color: colors.textLight }}
                className="mx-auto mb-4"
              />
              <h3
                className="text-xl font-bold mb-2"
                style={{ color: colors.text }}
              >
                No circles found
              </h3>
              <p className="text-sm" style={{ color: colors.textLight }}>
                {searchQuery
                  ? "Try adjusting your search or filters"
                  : "Be the first to create a circle!"}
              </p>
            </div>
          )}

          {/* All Circles */}
          {!isLoading && filteredCircles.length > 0 && (
            <div>
              <h3
                className="font-bold text-lg mb-4 flex items-center gap-2"
                style={{ color: colors.text }}
              >
                <Users size={20} style={{ color: colors.primary }} />
                Joinable Circles ({filteredCircles.length})
              </h3>
              <div className="grid gap-4">
                {filteredCircles.map((circle: Circle) => {
                  const minMembers = calculateMinMembersToStart(
                    circle.maxMembers,
                  );
                  const isJoining = joiningCircleId === circle.circleId;
                  const canJoin =
                    circle.visibility === 1 &&
                    (circle.state === 1 || circle.state === 2); // Public and Created/Voting state

                  return (
                    <div
                      key={circle.id}
                      className="p-6 rounded-xl border hover:shadow-lg transition-all duration-300"
                      style={{
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      }}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h4
                              className="font-bold text-lg"
                              style={{ color: colors.text }}
                            >
                              {circle.circleName}
                            </h4>
                            {circle.isYieldEnabled && (
                              <div
                                className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold"
                                style={{
                                  backgroundColor: `${colors.primary}15`,
                                  color: colors.primary,
                                  border: `1px solid ${colors.primary}30`,
                                }}
                              >
                                <TrendingUp size={8} />
                                {circle.yieldAPY
                                  ? `${(Number(circle.yieldAPY) / 100).toFixed(
                                      1,
                                    )}% APY`
                                  : "YIELD"}
                              </div>
                            )}
                            {circle.visibility === 0 ? (
                              <Lock
                                size={16}
                                style={{ color: colors.secondary }}
                              />
                            ) : (
                              <Globe
                                size={16}
                                style={{ color: colors.primary }}
                              />
                            )}
                            <span
                              className="px-2 py-1 rounded-full text-xs font-semibold"
                              style={{
                                backgroundColor:
                                  circle.visibility === 0
                                    ? "#E9D5FF"
                                    : "#DBEAFE",
                                color:
                                  circle.visibility === 0
                                    ? "#6B21A8"
                                    : "#1E40AF",
                              }}
                            >
                              {circle.visibility === 0 ? "Private" : "Public"}
                            </span>
                          </div>
                          <p
                            className="text-sm mb-3"
                            style={{ color: colors.textLight }}
                          >
                            {circle.circleDescription}
                          </p>
                          <div
                            className="flex items-center gap-2 text-xs"
                            style={{ color: colors.textLight }}
                          >
                            <span>Created by</span>
                            <span
                              className="font-semibold"
                              style={{ color: colors.text }}
                            >
                              {circle.creator.username ||
                                circle.creator.fullName ||
                                `${circle.creator.id.slice(
                                  0,
                                  6,
                                )}...${circle.creator.id.slice(-4)}`}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div
                          className="text-center p-3 rounded-lg"
                          style={{ backgroundColor: colors.background }}
                        >
                          <DollarSign
                            size={20}
                            className="mx-auto mb-1"
                            style={{ color: colors.primary }}
                          />
                          <div
                            className="text-lg font-bold"
                            style={{ color: colors.primary }}
                          >
                            ${formatCurrency(circle.contributionAmount)}
                          </div>
                          <div
                            className="text-xs"
                            style={{ color: colors.textLight }}
                          >
                            Per {getFrequencyText(circle.frequency)}
                          </div>
                        </div>
                        <div
                          className="text-center p-3 rounded-lg"
                          style={{ backgroundColor: colors.background }}
                        >
                          <Users
                            size={20}
                            className="mx-auto mb-1"
                            style={{ color: colors.primary }}
                          />
                          <div
                            className="text-lg font-bold"
                            style={{ color: colors.text }}
                          >
                            {circle.currentMembers.toString()}/
                            {circle.maxMembers.toString()}
                          </div>
                          <div
                            className="text-xs"
                            style={{ color: colors.textLight }}
                          >
                            Members
                          </div>
                        </div>
                        <div
                          className="text-center p-3 rounded-lg"
                          style={{ backgroundColor: colors.background }}
                        >
                          <Calendar
                            size={20}
                            className="mx-auto mb-1"
                            style={{ color: colors.primary }}
                          />
                          <div
                            className="text-lg font-bold"
                            style={{ color: colors.text }}
                          >
                            {getFrequencyText(circle.frequency)}
                          </div>
                          <div
                            className="text-xs"
                            style={{ color: colors.textLight }}
                          >
                            Frequency
                          </div>
                        </div>
                        <div
                          className="text-center p-3 rounded-lg"
                          style={{ backgroundColor: colors.background }}
                        >
                          <Lock
                            size={20}
                            className="mx-auto mb-1"
                            style={{ color: colors.secondary }}
                          />
                          <div
                            className="text-lg font-bold"
                            style={{ color: colors.text }}
                          >
                            ${formatCurrency(circle.collateralAmount)}
                          </div>
                          <div
                            className="text-xs"
                            style={{ color: colors.textLight }}
                          >
                            Collateral
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div
                          className="text-xs sm:text-sm w-1/2"
                          style={{ color: colors.textLight }}
                        >
                          {circle.state === 1 && (
                            <span>
                              Needs at least {minMembers} members to start.
                            </span>
                          )}
                          {circle.state === 2 && (
                            <span>Voting in progress</span>
                          )}
                          {circle.state === 3 && <span>Circle is active</span>}
                          {circle.state === 4 && <span>Circle completed</span>}
                        </div>
                        <div className="flex">
                          {canJoin && (
                            <button
                              onClick={() => handleJoinCircleClick(circle)}
                              disabled={isJoining || isTransactionPending}
                              className="px-4 sm:px-6 py-2 rounded-lg font-semibold text-xs sm:text-base text-white transition shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                              style={{ background: colors.primary }}
                            >
                              {isJoining ? "Joining..." : "Join Circle"}
                            </button>
                          )}
                          {circle.visibility === 1 && null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Join Circle Modal */}
      {showJoinModal && selectedCircle && (
        <JoinCircleModal
          circle={selectedCircle}
          setShowJoinCircle={setShowJoinModal}
          colors={colors}
          onJoin={handleJoinCircle}
          isJoining={joiningCircleId === selectedCircle.circleId}
        />
      )}
    </>
  );
};

export default Browse;
