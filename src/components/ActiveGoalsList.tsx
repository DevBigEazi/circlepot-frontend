import React, { useState, useEffect } from "react";
import {
  Target,
  Plus,
  Calendar,
  Clock,
  Loader,
  TrendingUp,
} from "lucide-react";
import { useThemeColors } from "../hooks/useThemeColors";
import { useNavigate } from "react-router";
import { GoalWithdrawalModal } from "../modals/GoalWithdrawalModal";
import { ActiveGoalsListProps, Goal } from "../interfaces/interfaces";
import { GoalCardSkeleton } from "./Skeleton";

export const ActiveGoalsList: React.FC<ActiveGoalsListProps> = ({
  goals,
  isLoading,
  contributingGoalId,
  onContribute,
  onWithdraw,
  contributions,
}) => {
  const colors = useThemeColors();
  const navigate = useNavigate();
  const [withdrawalModal, setWithdrawalModal] = useState<{
    isOpen: boolean;
    goalId: bigint | null;
    goalName: string;
    currentAmount: number;
    targetAmount: number;
  }>({
    isOpen: false,
    goalId: null,
    goalName: "",
    currentAmount: 0,
    targetAmount: 0,
  });
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [countdowns, setCountdowns] = useState<Record<string, string>>({});

  // Calculate next contribution timestamp
  const getNextContributionTimestamp = (
    goalId: bigint,
    frequency: number
  ): number => {
    const goalContributions = contributions.filter((c) => c.goalId === goalId);

    if (goalContributions.length === 0) {
      return 0; // Can contribute immediately if no contributions yet
    }

    const lastContribution = goalContributions.reduce((latest, current) =>
      current.timestamp > latest.timestamp ? current : latest
    );

    const lastDate = new Date(Number(lastContribution.timestamp) * 1000);
    const nextDate = new Date(lastDate);

    switch (frequency) {
      case 0: // Daily
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case 1: // Weekly
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 2: // Monthly
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
    }

    return nextDate.getTime();
  };

  // Check if contribution is allowed
  const canContribute = (goalId: bigint, frequency: number): boolean => {
    const nextTimestamp = getNextContributionTimestamp(goalId, frequency);
    if (nextTimestamp === 0) return true; // No contributions yet
    return Date.now() >= nextTimestamp;
  };

  // Format countdown timer
  const formatCountdown = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  // Update countdown every second
  useEffect(() => {
    const interval = setInterval(() => {
      const newCountdowns: Record<string, string> = {};

      goals.forEach((goal) => {
        if (!canContribute(goal.goalId, goal.frequency)) {
          const nextTimestamp = getNextContributionTimestamp(
            goal.goalId,
            goal.frequency
          );
          const timeRemaining = nextTimestamp - Date.now();

          if (timeRemaining > 0) {
            newCountdowns[goal.id] = formatCountdown(timeRemaining);
          }
        }
      });

      setCountdowns(newCountdowns);
    }, 1000);

    return () => clearInterval(interval);
  }, [goals, contributions]);

  const getFrequencyLabel = (frequency: number) => {
    switch (frequency) {
      case 0:
        return "Daily";
      case 1:
        return "Weekly";
      case 2:
        return "Monthly";
      default:
        return "Unknown";
    }
  };

  const openWithdrawalModal = (goal: Goal) => {
    setWithdrawalModal({
      isOpen: true,
      goalId: goal.goalId,
      goalName: goal.goalName,
      currentAmount: goal.savedAmount,
      targetAmount: goal.targetAmount,
    });
  };

  const closeWithdrawalModal = () => {
    setWithdrawalModal({
      isOpen: false,
      goalId: null,
      goalName: "",
      currentAmount: 0,
      targetAmount: 0,
    });
  };

  const handleCompleteWithdraw = async () => {
    if (withdrawalModal.goalId) {
      setIsWithdrawing(true);
      try {
        await onWithdraw(withdrawalModal.goalId);
        closeWithdrawalModal();
      } catch (err) {
      } finally {
        setIsWithdrawing(false);
      }
    }
  };

  const handleEarlyWithdraw = async () => {
    if (withdrawalModal.goalId) {
      setIsWithdrawing(true);
      try {
        await onWithdraw(withdrawalModal.goalId);
        closeWithdrawalModal();
      } catch (err) {
      } finally {
        setIsWithdrawing(false);
      }
    }
  };

  return (
    <>
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2
              className="text-xl font-bold flex items-center gap-2"
              style={{ color: colors.text }}
            >
              <Target size={20} style={{ color: colors.primary }} />
              Active Goals
            </h2>
          </div>
          <button
            onClick={() => navigate("/create/personal-goal")}
            className="rounded-lg transition hover:opacity-80 font-medium"
          >
            <Plus size={24} color={colors.primary} />
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <GoalCardSkeleton key={i} />
            ))}
          </div>
        ) : goals.length === 0 ? (
          <div
            className="rounded-xl p-12 border text-center"
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border,
            }}
          >
            <Target
              size={32}
              className="mx-auto mb-3"
              style={{ color: colors.textLight }}
            />
            <p style={{ color: colors.textLight }}>
              No active goals yet. Create one to start saving!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {goals.map((goal) => {
              const isContributeAllowed = canContribute(
                goal.goalId,
                goal.frequency
              );
              const countdown = countdowns[goal.id];

              return (
                <div
                  key={goal.id}
                  className="rounded-xl p-6 border transition hover:shadow-md"
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3
                        className="font-bold text-lg"
                        style={{ color: colors.text }}
                      >
                        {goal.goalName}
                      </h3>

                      {goal.isYieldEnabled && (
                        <div
                          className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold mt-1 w-fit"
                          style={{
                            backgroundColor: `${colors.primary}15`,
                            color: colors.primary,
                            border: `1px solid ${colors.primary}30`,
                          }}
                        >
                          <TrendingUp size={10} />
                          YIELD EARNING
                        </div>
                      )}

                      <div className="flex gap-1 items-center">
                        <Calendar
                          size={14}
                          style={{ color: colors.textLight }}
                        />
                        <p
                          className="text-sm mt-1"
                          style={{ color: colors.textLight }}
                        >
                          {getFrequencyLabel(goal.frequency)} contributions
                        </p>
                      </div>

                      {/* Next Contribution and Deadline */}
                      <div className="flex gap-4 mt-2 flex-wrap">
                        <div className="flex items-center gap-1">
                          <Clock
                            size={14}
                            style={{ color: colors.textLight }}
                          />
                          <span
                            className="text-xs"
                            style={{ color: colors.textLight }}
                          >
                            Next: {goal.nextContribution}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Target
                            size={14}
                            style={{ color: colors.textLight }}
                          />
                          <span
                            className="text-xs"
                            style={{ color: colors.textLight }}
                          >
                            Est: {goal.formattedDeadline}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className="text-2xl font-bold"
                        style={{ color: colors.primary }}
                      >
                        {goal.progress.toFixed(0)}%
                      </div>
                      <div
                        className="text-xs"
                        style={{ color: colors.textLight }}
                      >
                        Complete
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div
                    className="w-full rounded-full h-3 mb-4"
                    style={{ backgroundColor: colors.border }}
                  >
                    <div
                      className="h-3 rounded-full transition-all duration-500"
                      style={{
                        backgroundColor: colors.primary,
                        width: `${goal.progress}%`,
                      }}
                    ></div>
                  </div>

                  {/* Amount Info */}
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <p
                        className="text-xs"
                        style={{ color: colors.textLight }}
                      >
                        Saved
                      </p>
                      <p
                        className="font-semibold"
                        style={{ color: colors.text }}
                      >
                        $
                        {goal.savedAmount.toLocaleString("en-US", {
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                    <div className="text-center">
                      <p
                        className="text-xs"
                        style={{ color: colors.textLight }}
                      >
                        of
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className="text-xs"
                        style={{ color: colors.textLight }}
                      >
                        Target
                      </p>
                      <p
                        className="font-semibold"
                        style={{ color: colors.text }}
                      >
                        $
                        {goal.targetAmount.toLocaleString("en-US", {
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        onContribute(
                          goal.goalId,
                          BigInt(goal.contributionAmount),
                          goal.token
                        )
                      }
                      disabled={
                        !isContributeAllowed ||
                        contributingGoalId === goal.goalId
                      }
                      className="flex-1 px-4 py-2 rounded-lg font-medium transition hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        backgroundColor: colors.primary,
                        color: "#ffffff",
                      }}
                    >
                      {contributingGoalId === goal.goalId ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader size={16} className="animate-spin" />
                          Contributing...
                        </span>
                      ) : !isContributeAllowed && countdown ? (
                        <span className="flex items-center justify-center gap-2">
                          <Clock size={10} />
                          <p className="text-xs">{countdown}</p>
                        </span>
                      ) : (
                        "Contribute"
                      )}
                    </button>
                    <button
                      onClick={() => openWithdrawalModal(goal)}
                      className="flex-1 px-4 py-2 rounded-lg font-medium transition hover:opacity-80"
                      style={{
                        backgroundColor: colors.border,
                        color: colors.text,
                      }}
                    >
                      Withdraw
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <GoalWithdrawalModal
        isOpen={withdrawalModal.isOpen}
        goalName={withdrawalModal.goalName}
        currentAmount={withdrawalModal.currentAmount}
        targetAmount={withdrawalModal.targetAmount}
        isLoading={isWithdrawing}
        onClose={closeWithdrawalModal}
        onCompleteWithdraw={handleCompleteWithdraw}
        onEarlyWithdraw={handleEarlyWithdraw}
      />
    </>
  );
};
