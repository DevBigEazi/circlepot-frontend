import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useActiveAccount } from "thirdweb/react";
import {
  Users,
  Calendar,
  DollarSign,
  Lock,
  Globe,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { client } from "../thirdwebClient";
import { useThemeColors } from "../hooks/useThemeColors";
import { useCircleSavings } from "../hooks/useCircleSavings";
import { toast } from "sonner";
import { formatBigInt, getFrequencyText } from "../utils/helpers";
import { Skeleton } from "../components/Skeleton";

const JoinCircle: React.FC = () => {
  const { circleId } = useParams<{ circleId: string }>();
  const navigate = useNavigate();
  const account = useActiveAccount();
  const colors = useThemeColors();
  const { getCircleById, joinCircle } = useCircleSavings(client);

  const [circle, setCircle] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCircle = async () => {
      if (!circleId) {
        setError("Invalid circle ID");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const circleData = await getCircleById(circleId);

        if (!circleData) {
          setError("Circle not found");
        } else {
          setCircle(circleData);
        }
      } catch (err) {
        console.error("Error fetching circle:", err);
        setError("Failed to load circle details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCircle();
  }, [circleId, getCircleById]);

  const handleJoinCircle = async () => {
    if (!account?.address) {
      toast.custom(
        () => (
          <div
            className="rounded-2xl p-4 shadow-lg border-2 border-red-500 flex items-center gap-3 max-w-sm"
            style={{
              backgroundColor: "#fee2e2",
              animation: `slideIn 0.3s ease-out`,
            }}
          >
            <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
            <span className="text-sm font-semibold text-red-600">
              Please connect your wallet first
            </span>
          </div>
        ),
        {
          duration: 4000,
          position: "top-center",
        }
      );
      return;
    }

    if (!circle) return;

    try {
      setIsJoining(true);
      setError(null);

      // Calculate collateral
      const contributionAmount = BigInt(circle.contributionAmount);
      const maxMembers = BigInt(circle.maxMembers);
      const totalCommitment = contributionAmount * maxMembers;
      const lateBuffer = (totalCommitment * BigInt(1)) / BigInt(100);
      const collateral = totalCommitment + lateBuffer;

      await joinCircle(BigInt(circleId!), collateral);

      toast.custom(
        () => (
          <div
            className="rounded-2xl p-4 shadow-lg border-2 border-green-500 flex items-center gap-3 max-w-sm"
            style={{
              backgroundColor: "#dcfce7",
              animation: `slideIn 0.3s ease-out`,
            }}
          >
            <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
            <span className="text-sm font-semibold text-green-600">
              Successfully joined the circle!
            </span>
          </div>
        ),
        {
          duration: 3000,
          position: "top-center",
        }
      );

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (err: any) {
      console.error("Error joining circle:", err);
      toast.custom(
        () => (
          <div
            className="rounded-2xl p-4 shadow-lg border-2 border-red-500 flex items-center gap-3 max-w-sm"
            style={{
              backgroundColor: "#fee2e2",
              animation: `slideIn 0.3s ease-out`,
            }}
          >
            <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
            <span className="text-sm font-semibold text-red-600">
              {err.message || "Failed to join circle"}
            </span>
          </div>
        ),
        {
          duration: 4000,
          position: "top-center",
        }
      );
    } finally {
      setIsJoining(false);
    }
  };

  if (isLoading) {
    return (
      <div
        className="min-h-screen py-8 px-4"
        style={{ backgroundColor: colors.background }}
      >
        <div className="max-w-3xl mx-auto">
          <Skeleton width="10rem" height="1.5rem" className="mb-6" />
          <div
            className="rounded-2xl p-6 sm:p-8 shadow-lg border space-y-6"
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border,
            }}
          >
            <div className="flex gap-4">
              <Skeleton width="4rem" height="4rem" borderRadius="0.75rem" />
              <div className="flex-1 space-y-2">
                <Skeleton width="60%" height="2rem" />
                <Skeleton width="30%" height="1rem" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton width="20%" height="1rem" />
              <Skeleton width="100%" height="4rem" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Skeleton height="5rem" borderRadius="0.75rem" />
              <Skeleton height="5rem" borderRadius="0.75rem" />
              <Skeleton height="5rem" borderRadius="0.75rem" />
              <Skeleton height="5rem" borderRadius="0.75rem" />
            </div>
            <Skeleton height="6rem" borderRadius="0.75rem" />
            <div className="flex gap-3">
              <Skeleton height="3.5rem" className="flex-1" />
              <Skeleton height="3.5rem" className="flex-1" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !circle) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundColor: colors.background }}
      >
        <div
          className="max-w-md w-full rounded-2xl p-8 text-center"
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.border,
          }}
        >
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h2
            className="text-2xl font-bold mb-2"
            style={{ color: colors.text }}
          >
            Circle Not Found
          </h2>
          <p className="mb-6" style={{ color: colors.textLight }}>
            {error}
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-6 py-3 rounded-xl font-semibold text-white transition shadow-sm hover:shadow-md"
            style={{ background: colors.gradient }}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!circle) return null;

  const isPublic = circle.visibility === 1;
  const isFull = Number(circle.currentMembers) >= Number(circle.maxMembers);
  const isActive = circle.state === 3; // ACTIVE state

  // For private circles, user must be invited
  // The contract has a mapping: circleInvitations[circleId][address] => bool
  // need to check this before allowing join
  const canJoin = !isFull && !isActive && account?.address;

  // Note: For private circles, the smart contract will check if the user is invited
  // If they're not invited, the transaction will fail with "NotInvited" error

  const collateralRequired = (() => {
    const contributionAmount = BigInt(circle.contributionAmount);
    const maxMembers = BigInt(circle.maxMembers);
    const totalCommitment = contributionAmount * maxMembers;
    const lateBuffer = (totalCommitment * BigInt(1)) / BigInt(100);
    return formatBigInt(totalCommitment + lateBuffer);
  })();

  return (
    <div
      className="min-h-screen py-8 px-4"
      style={{ backgroundColor: colors.background }}
    >
      <div className="max-w-3xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 mb-6 transition hover:opacity-80"
          style={{ color: colors.text }}
        >
          <ArrowLeft size={20} />
          <span>Back to Dashboard</span>
        </button>

        {/* Circle Details Card */}
        <div
          className="rounded-2xl p-6 sm:p-8 shadow-lg border"
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.border,
          }}
        >
          {/* Header */}
          <div className="flex items-start gap-4 mb-6">
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: colors.primary }}
            >
              <Users className="text-white w-8 h-8" />
            </div>
            <div className="flex-1 min-w-0">
              <h1
                className="text-2xl sm:text-3xl font-bold mb-2"
                style={{ color: colors.text }}
              >
                {circle.circleName}
              </h1>
              <div className="flex items-center gap-2 flex-wrap">
                {isPublic ? (
                  <Globe size={16} style={{ color: colors.primary }} />
                ) : (
                  <Lock size={16} style={{ color: colors.secondary }} />
                )}
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    isPublic
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                      : "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                  }`}
                >
                  {isPublic ? "Public" : "Private"}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    isFull
                      ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                      : "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
                  }`}
                >
                  {isFull ? "Full" : "Open"}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          {circle.circleDescription && (
            <div className="mb-6">
              <h3
                className="text-sm font-semibold mb-2"
                style={{ color: colors.textLight }}
              >
                Description
              </h3>
              <p style={{ color: colors.text }}>{circle.circleDescription}</p>
            </div>
          )}

          {/* Circle Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div
              className="p-4 rounded-xl"
              style={{ backgroundColor: colors.accentBg }}
            >
              <div className="flex items-center gap-3 mb-2">
                <DollarSign size={20} style={{ color: colors.primary }} />
                <span className="text-sm" style={{ color: colors.textLight }}>
                  Contribution Amount
                </span>
              </div>
              <p className="text-2xl font-bold" style={{ color: colors.text }}>
                ${formatBigInt(circle.contributionAmount)}
              </p>
            </div>

            <div
              className="p-4 rounded-xl"
              style={{ backgroundColor: colors.accentBg }}
            >
              <div className="flex items-center gap-3 mb-2">
                <Calendar size={20} style={{ color: colors.primary }} />
                <span className="text-sm" style={{ color: colors.textLight }}>
                  Frequency
                </span>
              </div>
              <p className="text-2xl font-bold" style={{ color: colors.text }}>
                {getFrequencyText(circle.frequency)}
              </p>
            </div>

            <div
              className="p-4 rounded-xl"
              style={{ backgroundColor: colors.accentBg }}
            >
              <div className="flex items-center gap-3 mb-2">
                <Users size={20} style={{ color: colors.primary }} />
                <span className="text-sm" style={{ color: colors.textLight }}>
                  Members
                </span>
              </div>
              <p className="text-2xl font-bold" style={{ color: colors.text }}>
                {Number(circle.currentMembers)} / {Number(circle.maxMembers)}
              </p>
            </div>

            <div
              className="p-4 rounded-xl"
              style={{ backgroundColor: colors.accentBg }}
            >
              <div className="flex items-center gap-3 mb-2">
                <DollarSign size={20} style={{ color: colors.primary }} />
                <span className="text-sm" style={{ color: colors.textLight }}>
                  Collateral Required
                </span>
              </div>
              <p className="text-2xl font-bold" style={{ color: colors.text }}>
                ${collateralRequired}
              </p>
            </div>
          </div>

          {/* Info Box */}
          <div
            className="p-4 rounded-xl mb-6"
            style={{ backgroundColor: colors.accentBg }}
          >
            <h3
              className="font-semibold mb-2 flex items-center gap-2"
              style={{ color: colors.text }}
            >
              <AlertCircle size={18} style={{ color: colors.primary }} />
              What is Collateral?
            </h3>
            <p className="text-sm" style={{ color: colors.textLight }}>
              Collateral is a refundable deposit that ensures all members
              fulfill their commitment. It covers your total contributions plus
              a 1% buffer for late fees. You'll get it back when the circle
              completes successfully.
            </p>
          </div>

          {/* Private Circle Info */}
          {!isPublic && (
            <div
              className="p-4 rounded-xl mb-6 border-2"
              style={{
                backgroundColor: colors.accentBg,
                borderColor: colors.primary + "40",
              }}
            >
              <h3
                className="font-semibold mb-2 flex items-center gap-2"
                style={{ color: colors.text }}
              >
                <Lock size={18} style={{ color: colors.primary }} />
                Private Circle - Invitation Required
              </h3>
              <p className="text-sm" style={{ color: colors.textLight }}>
                This is a private circle. You can only join if the creator has
                invited you. When you click "Join Circle", the system will
                verify your invitation. If you haven't been invited, the process
                will fail.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            {!account?.address ? (
              <div
                className="flex-1 p-4 rounded-xl text-center"
                style={{ backgroundColor: colors.accentBg }}
              >
                <p style={{ color: colors.text }}>
                  Please login to join this circle
                </p>
              </div>
            ) : !canJoin ? (
              <div
                className="flex-1 p-4 rounded-xl text-center"
                style={{ backgroundColor: colors.accentBg }}
              >
                <p style={{ color: colors.text }}>
                  {isFull
                    ? "This circle is full"
                    : isActive
                    ? "This circle has already started"
                    : "You cannot join this circle"}
                </p>
              </div>
            ) : (
              <>
                <button
                  onClick={() => navigate("/")}
                  className="flex-1 py-3 rounded-xl font-semibold transition border hover:opacity-80"
                  style={{ borderColor: colors.border, color: colors.text }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleJoinCircle}
                  disabled={isJoining}
                  className="flex-1 py-3 rounded-xl font-semibold text-white transition shadow-sm hover:shadow-md disabled:opacity-50"
                  style={{ background: colors.gradient }}
                >
                  {isJoining ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Joining...
                    </span>
                  ) : (
                    "Join Circle"
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Creator Info */}
        <div
          className="mt-6 p-4 rounded-xl"
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.border,
          }}
        >
          <p className="text-sm" style={{ color: colors.textLight }}>
            Created by{" "}
            <span className="font-semibold" style={{ color: colors.text }}>
              {circle.creator?.username ||
                circle.creator?.id?.substring(0, 8) + "..."}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default JoinCircle;
