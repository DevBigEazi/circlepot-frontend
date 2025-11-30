import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { TrendingUp, AlertCircle, AlertTriangle } from "lucide-react";
import { useThemeColors } from "../hooks/useThemeColors";
import NavBar from "../components/NavBar";
import { useUserProfile } from "../hooks/useUserProfile";
import { usePersonalGoals } from "../hooks/usePersonalGoals";
import { ActiveGoalsList } from "../components/ActiveGoalsList";
import { client } from "../thirdwebClient";
import {
  calculateNextContribution,
  formatBalance,
  formatTimestamp,
} from "../utils/helpers";
import { toast } from "sonner";
import confetti from "canvas-confetti";

const Goals: React.FC = () => {
  const navigate = useNavigate();
  const colors = useThemeColors();
  const { profile } = useUserProfile(client);
  const {
    goals,
    contributions,
    isLoading,
    contributeToGoal,
    withdrawFromGoal,
    completeGoal,
  } = usePersonalGoals(client);
  const [contributingGoalId, setContributingGoalId] = useState<bigint | null>(
    null
  );

  // Calculate total saved across all goals
  const totalBalance = useMemo(() => {
    return goals.reduce(
      (sum, goal) => sum + formatBalance(goal.currentAmount),
      0
    );
  }, [goals]);

  // Calculate progress percentage for each goal
  const goalsWithProgress = useMemo(() => {
    return goals.map((goal) => {
      const target = formatBalance(goal.goalAmount);
      let saved = formatBalance(goal.currentAmount);

      // For inactive goals with 0 current amount, get the actual withdrawn amount from contributions
      if (!goal.isActive && goal.currentAmount === BigInt(0)) {
        // Sum all contributions for this goal
        const totalContributed = contributions
          .filter((c) => c.goalId === goal.goalId)
          .reduce((sum, c) => sum + formatBalance(c.amount), 0);
        saved = totalContributed;
      }

      const progress = target > 0 ? Math.min((saved / target) * 100, 100) : 0;

      return {
        ...goal,
        progress,
        savedAmount: saved,
        targetAmount: target,
        formattedDeadline: formatTimestamp(goal.deadline),
        nextContribution: calculateNextContribution(
          goal.goalId,
          goal.frequency,
          contributions
        ),
      };
    });
  }, [goals, contributions]);

  const activeGoals = goalsWithProgress.filter((g) => g.isActive);

  // Merge completed and early withdrawn goals into history
  const goalsHistory = useMemo(() => {
    const completed = goalsWithProgress
      .filter((g) => !g.isActive && g.currentAmount >= g.goalAmount)
      .map((goal) => ({ ...goal, status: "completed" as const }));

    const earlyWithdrawn = goalsWithProgress
      .filter((g) => !g.isActive && g.currentAmount < g.goalAmount)
      .map((goal) => ({ ...goal, status: "earlyWithdrawn" as const }));

    // Merge and sort by most recent first (using createdAt as timestamp)
    return [...completed, ...earlyWithdrawn].sort(
      (a, b) => Number(b.createdAt) - Number(a.createdAt)
    );
  }, [goalsWithProgress]);

  // Handle contribute to goal
  const handleContribute = async (
    goalId: bigint,
    contributionAmount: bigint
  ) => {
    setContributingGoalId(goalId);
    try {
      await contributeToGoal(goalId, contributionAmount);
      toast.custom(
        () => (
          <div
            className="rounded-2xl p-4 shadow-lg border-2 border-green-500 flex items-center gap-3 max-w-sm"
            style={{
              backgroundColor: "#dcfce7",
              animation: `slideIn 0.3s ease-out`,
            }}
          >
            <AlertCircle size={20} className="text-green-600 flex-shrink-0" />
            <span className="text-sm font-semibold text-green-600">
              Contribution successful!
            </span>
          </div>
        ),
        {
          duration: 4000,
          position: "top-center",
        }
      );
    } catch (err: any) {
      console.error("Contribution failed:", err);
      toast.custom(
        () => (
          <div
            className="rounded-2xl p-4 shadow-lg border-2 border-red-500 flex items-center gap-3 max-w-sm"
            style={{
              backgroundColor: "#fee2e2",
              animation: `slideIn 0.3s ease-out`,
            }}
          >
            <AlertTriangle size={20} className="text-red-600 flex-shrink-0" />
            <span className="text-sm font-semibold text-red-600">
              {err?.message || "Contribution failed"}
            </span>
          </div>
        ),
        {
          duration: 4000,
          position: "top-center",
        }
      );
    } finally {
      setContributingGoalId(null);
    }
  };

  // Handle withdraw from goal
  const handleWithdraw = async (goalId: bigint) => {
    try {
      const goal = goals.find((g) => g.goalId === goalId);
      if (!goal) {
        toast.custom(
          () => (
            <div
              className="rounded-2xl p-4 shadow-lg border-2 border-red-500 flex items-center gap-3 max-w-sm"
              style={{
                backgroundColor: "#fee2e2",
                animation: `slideIn 0.3s ease-out`,
              }}
            >
              <AlertTriangle size={20} className="text-red-600 flex-shrink-0" />
              <span className="text-sm font-semibold text-red-600">
                Goal not found
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

      // Check if goal is complete using raw bigint values (not formatted)
      const isGoalComplete = goal.currentAmount >= goal.goalAmount;

      if (isGoalComplete) {
        // Complete withdrawal - no penalty, withdraw full amount
        console.log("Attempting complete goal withdrawal...");
        await completeGoal(goalId);
        toast.custom(
          () => (
            <div
              className="rounded-2xl p-4 shadow-lg border-2 border-green-500 flex items-center gap-3 max-w-sm"
              style={{
                backgroundColor: "#dcfce7",
                animation: `slideIn 0.3s ease-out`,
              }}
            >
              <AlertCircle size={20} className="text-green-600 flex-shrink-0" />
              <span className="text-sm font-semibold text-green-600">
                Goal completed successfully!
              </span>
            </div>
          ),
          {
            duration: 4000,
            position: "top-center",
          }
        );

        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } else {
        // Early withdrawal - with penalty
        await withdrawFromGoal(goalId, goal.currentAmount);
        toast.custom(
          () => (
            <div
              className="rounded-2xl p-4 shadow-lg border-2 border-orange-500 flex items-center gap-3 max-w-sm"
              style={{
                backgroundColor: "#fff7ed",
                animation: `slideIn 0.3s ease-out`,
              }}
            >
              <AlertTriangle
                size={20}
                className="text-orange-600 flex-shrink-0"
              />
              <span className="text-sm font-semibold text-orange-600">
                Early withdrawal completed with penalty
              </span>
            </div>
          ),
          {
            duration: 4000,
            position: "top-center",
          }
        );
      }
    } catch (err: any) {
      toast.custom(
        () => (
          <div
            className="rounded-2xl p-4 shadow-lg border-2 border-red-500 flex items-center gap-3 max-w-sm"
            style={{
              backgroundColor: "#fee2e2",
              animation: `slideIn 0.3s ease-out`,
            }}
          >
            <AlertTriangle size={20} className="text-red-600 flex-shrink-0" />
            <span className="text-sm font-semibold text-red-600">
              {err?.message || "Withdrawal failed"}
            </span>
          </div>
        ),
        {
          duration: 4000,
          position: "top-center",
        }
      );
    }
  };

  return (
    <>
      <NavBar
        colors={colors}
        userName={profile?.username}
        fullName={profile?.fullName}
        onBack={() => navigate(-1)}
      />
      <div
        className="min-h-screen pb-10"
        style={{ backgroundColor: colors.background }}
      >
        <div className="max-w-4xl mx-auto p-4 md:p-6">
          {/* Header */}
          <div className="mb-8">
            <h1
              className="text-3xl font-bold mb-2"
              style={{ color: colors.text }}
            >
              Your Goals
            </h1>
            <p style={{ color: colors.textLight }}>
              Track and manage your savings goals with deadline-based incentives
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div
              className="rounded-xl p-6 border"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm" style={{ color: colors.textLight }}>
                  Total Saved
                </div>
                <TrendingUp size={16} style={{ color: colors.primary }} />
              </div>
              <div
                className="text-2xl font-bold"
                style={{ color: colors.text }}
              >
                $
                {totalBalance.toLocaleString("en-US", {
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>

            <div
              className="rounded-xl p-6 border"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }}
            >
              <div className="text-sm mb-2" style={{ color: colors.textLight }}>
                Active Goals
              </div>
              <div
                className="text-2xl font-bold"
                style={{ color: colors.text }}
              >
                {activeGoals.length}
              </div>
            </div>

            <div
              className="rounded-xl p-6 border"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }}
            >
              <div className="text-sm mb-2" style={{ color: colors.textLight }}>
                Completed
              </div>
              <div
                className="text-2xl font-bold"
                style={{ color: colors.text }}
              >
                {goalsHistory.filter((g) => g.status === "completed").length}
              </div>
            </div>

            <div
              className="rounded-xl p-6 border"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }}
            >
              <div className="text-sm mb-2" style={{ color: colors.textLight }}>
                Early Withdrawals
              </div>
              <div
                className="text-2xl font-bold"
                style={{ color: colors.text }}
              >
                {
                  goalsHistory.filter((g) => g.status === "earlyWithdrawn")
                    .length
                }
              </div>
            </div>
          </div>

          {/* Active Goals Section */}
          <ActiveGoalsList
            goals={activeGoals}
            isLoading={isLoading}
            contributingGoalId={contributingGoalId}
            onContribute={handleContribute}
            onWithdraw={handleWithdraw}
            contributions={contributions}
          />

          {/* Goals History Section */}
          {goalsHistory.length > 0 && (
            <div className="mb-8">
              <h2
                className="text-xl font-bold mb-4"
                style={{ color: colors.text }}
              >
                Goals History
              </h2>
              <div className="space-y-4">
                {goalsHistory.map((goal) => (
                  <div
                    key={goal.id}
                    className="rounded-xl p-4 border opacity-75"
                    style={{
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3
                          className="font-semibold"
                          style={{ color: colors.text }}
                        >
                          {goal.goalName}
                        </h3>
                        {goal.status === "completed" ? (
                          <p
                            className="text-sm"
                            style={{ color: colors.textLight }}
                          >
                            $
                            {goal.targetAmount.toLocaleString("en-US", {
                              maximumFractionDigits: 2,
                            })}{" "}
                            saved
                          </p>
                        ) : (
                          <p
                            className="text-sm"
                            style={{ color: colors.textLight }}
                          >
                            Withdrawn early • $
                            {goal.savedAmount.toLocaleString("en-US", {
                              maximumFractionDigits: 2,
                            })}{" "}
                            of $
                            {goal.targetAmount.toLocaleString("en-US", {
                              maximumFractionDigits: 2,
                            })}{" "}
                            ({goal.progress.toFixed(0)}% progress)
                          </p>
                        )}
                      </div>
                      {goal.status === "completed" ? (
                        <div className="text-green-600 font-semibold">
                          ✓ Complete
                        </div>
                      ) : (
                        <div className="text-orange-600 font-semibold flex items-center gap-1">
                          <AlertTriangle size={16} />
                          Early
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Goals;
