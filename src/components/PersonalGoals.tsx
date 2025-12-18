import React, { useMemo } from "react";
import { useNavigate } from "react-router";
import { Target, Plus } from "lucide-react";
import { usePersonalGoals } from "../hooks/usePersonalGoals";
import { client } from "../thirdwebClient";
import { useThemeColors } from "../hooks/useThemeColors";
import { GoalCardSkeleton } from "./Skeleton";

interface PersonalGoalsProps {
  className?: string;
}

const PersonalGoals: React.FC<PersonalGoalsProps> = ({ className = "" }) => {
  const navigate = useNavigate();
  const colors = useThemeColors();

  const {
    goals,
    isLoading: isLoadingGoals,
    error: goalsError,
  } = usePersonalGoals(client);

  // Filter active goals
  const activeGoals = useMemo(() => {
    return goals.filter((goal) => goal.isActive);
  }, [goals]);

  // Calculate goal progress percentage
  const calculateProgress = (current: bigint, target: bigint): number => {
    if (target === 0n) return 0;
    const progress = (Number(current) / Number(target)) * 100;
    return Math.min(Math.round(progress), 100);
  };

  // Format amount for display (18 decimals)
  const formatAmount = (amount: bigint): string => {
    const value = Number(amount) / 1e18;
    return value.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  // Convert frequency index to readable text
  const getFrequencyText = (frequency: number): string => {
    const frequencyMap: { [key: number]: string } = {
      0: "daily",
      1: "weekly",
      2: "monthly",
    };
    return frequencyMap[frequency] || String(frequency);
  };

  return (
    <div
      className={`rounded-2xl p-6 shadow-sm border ${className}`}
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.border,
      }}
    >
      <div className="flex justify-between items-center mb-6">
        <h3
          className="font-bold text-base sm:text-lg flex items-center gap-3"
          style={{ color: colors.text }}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: colors.primary + "20" }}
          >
            <Target style={{ color: colors.primary }} size={22} />
          </div>
          Personal Goals
        </h3>
        <button
          onClick={() => navigate("/create/personal-goal")}
          className="p-2 rounded-lg transition hover:opacity-80"
          style={{ color: colors.primary }}
          aria-label="Create new goal"
        >
          <Plus size={24} />
        </button>
      </div>

      {isLoadingGoals ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <GoalCardSkeleton key={i} />
          ))}
        </div>
      ) : goalsError ? (
        <div className="text-center py-6">
          <p className="text-sm" style={{ color: colors.textLight }}>
            Error loading goals
          </p>
        </div>
      ) : activeGoals.length > 0 ? (
        <div className="space-y-5 max-h-96 overflow-y-auto pr-2">
          {activeGoals.map((goal) => {
            const progress = calculateProgress(
              goal.currentAmount,
              goal.goalAmount
            );
            const currentFormatted = formatAmount(goal.currentAmount);
            const targetFormatted = formatAmount(goal.goalAmount);
            const contributionFormatted = formatAmount(goal.contributionAmount);
            const frequencyText = getFrequencyText(goal.frequency);

            return (
              <div
                key={goal.id}
                onClick={() => navigate("/goals")}
                className="p-5 rounded-2xl border cursor-pointer transition-all hover:opacity-90"
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                }}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4
                      className="font-bold text-sm sm:text-base mb-1"
                      style={{ color: colors.text }}
                    >
                      {goal.goalName}
                    </h4>
                    <p className="text-sm" style={{ color: colors.textLight }}>
                      ${contributionFormatted}/{frequencyText} • $
                      {currentFormatted} of ${targetFormatted}
                    </p>
                  </div>
                  <div className="text-right">
                    <div
                      className="text-sm sm:text-base font-bold"
                      style={{ color: colors.primary }}
                    >
                      {progress}%
                    </div>
                  </div>
                </div>

                <div
                  className="w-full rounded-full h-2"
                  style={{ backgroundColor: colors.border }}
                >
                  <div
                    className="h-2 rounded-full transition-all duration-300"
                    style={{
                      backgroundColor: colors.primary,
                      width: `${progress}%`,
                    }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: colors.primary + "20" }}
          >
            <Target size={32} style={{ color: colors.primary }} />
          </div>
          <p
            className="text-base font-medium mb-2"
            style={{ color: colors.text }}
          >
            No goals yet
          </p>
          <p className="text-sm mb-5" style={{ color: colors.textLight }}>
            Create your first savings goal!
          </p>
          <button
            onClick={() => navigate("/create/personal-goal")}
            className="px-6 py-2.5 rounded-lg text-sm font-medium transition hover:opacity-90"
            style={{
              backgroundColor: colors.primary,
              color: "white",
            }}
          >
            Create Goal
          </button>
        </div>
      )}
    </div>
  );
};

export default PersonalGoals;
