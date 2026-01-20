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
import { ActiveGoalsListProps } from "../interfaces/interfaces";
import { GoalCardSkeleton } from "./Skeleton";
import { formatTimestamp } from "../utils/helpers";

export const ActiveGoalsList: React.FC<ActiveGoalsListProps> = ({
  goals,
  isLoading,
  onContributeClick,
  onWithdrawClick,
  contributingGoalId,
}) => {
  const colors = useThemeColors();
  const navigate = useNavigate();
  const [countdowns, setCountdowns] = useState<Record<string, string>>({});

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
        if (!goal.canContribute && goal.nextContributionTime > Date.now()) {
          const timeRemaining = goal.nextContributionTime - Date.now();
          newCountdowns[goal.id] = formatCountdown(timeRemaining);
        }
      });

      setCountdowns(newCountdowns);
    }, 1000);

    return () => clearInterval(interval);
  }, [goals]);

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

  return (
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
                        {goal.yieldAPY &&
                          goal.yieldAPY > 0n &&
                          ` • ${(Number(goal.yieldAPY) / 100).toFixed(2)}% APY`}
                      </div>
                    )}

                    <div className="flex gap-1 items-center">
                      <Calendar size={14} style={{ color: colors.textLight }} />
                      <p
                        className="text-sm mt-1"
                        style={{ color: colors.textLight }}
                      >
                        <span
                          className="text-xs font-medium"
                          style={{ color: colors.text }}
                        >
                          $
                          {(
                            Number(goal.contributionAmount) / 1e18
                          ).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>{" "}
                        / {getFrequencyLabel(goal.frequency)} contributions
                      </p>
                    </div>

                    <div className="flex gap-4 mt-2 flex-wrap">
                      <div className="flex items-center gap-1">
                        <Clock size={14} style={{ color: colors.textLight }} />
                        <span
                          className="text-xs"
                          style={{ color: colors.textLight }}
                        >
                          Est: {formatTimestamp(goal.deadline)}
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

                <div className="flex justify-between items-center mb-4">
                  <div>
                    <p className="text-xs" style={{ color: colors.textLight }}>
                      Saved
                    </p>
                    <p className="font-semibold" style={{ color: colors.text }}>
                      $
                      {goal.savedAmount.toLocaleString("en-US", {
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs" style={{ color: colors.textLight }}>
                      of
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs" style={{ color: colors.textLight }}>
                      Target
                    </p>
                    <p className="font-semibold" style={{ color: colors.text }}>
                      $
                      {goal.targetAmount.toLocaleString("en-US", {
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => onContributeClick(goal)}
                    disabled={
                      !goal.canContribute || contributingGoalId === goal.goalId
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
                    ) : !goal.canContribute && countdown ? (
                      <span className="flex items-center justify-center gap-2">
                        <Clock size={10} />
                        <p className="text-xs">{countdown}</p>
                      </span>
                    ) : (
                      "Contribute"
                    )}
                  </button>
                  <button
                    onClick={() => onWithdrawClick(goal)}
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
  );
};
