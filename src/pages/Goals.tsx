import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { TrendingUp, AlertTriangle } from "lucide-react";
import { useThemeColors } from "../hooks/useThemeColors";
import NavBar from "../components/NavBar";
import { usePersonalGoals } from "../hooks/usePersonalGoals";
import { ActiveGoalsList } from "../components/ActiveGoalsList";
import { GoalWithdrawalModal } from "../modals/GoalWithdrawalModal";
import { GoalContributionModal } from "../modals/GoalContributionModal";
import { client } from "../thirdwebClient";
import { formatBalance } from "../utils/helpers";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import SEO from "../components/SEO";

const Goals: React.FC = () => {
  const navigate = useNavigate();
  const colors = useThemeColors();
  const { goals, contributions, isLoading, contributeToGoal, withdraw } =
    usePersonalGoals(client);

  const [contributingGoalId, setContributingGoalId] = useState<bigint | null>(
    null,
  );
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isContributing, setIsContributing] = useState(false);

  const [withdrawalModal, setWithdrawalModal] = useState<{
    isOpen: boolean;
    goal: any | null;
  }>({
    isOpen: false,
    goal: null,
  });

  const [contributionModal, setContributionModal] = useState<{
    isOpen: boolean;
    goal: any | null;
  }>({
    isOpen: false,
    goal: null,
  });

  // Calculate total saved across all active goals
  const totalBalance = useMemo(() => {
    return goals
      .filter((g) => g.isActive)
      .reduce((sum, goal) => sum + goal.savedAmount, 0);
  }, [goals]);

  const activeGoals = useMemo(() => goals.filter((g) => g.isActive), [goals]);

  const goalsHistory = useMemo(() => {
    const inactiveGoals = goals.filter((g) => !g.isActive);

    const categorized = inactiveGoals.map((goal) => {
      // For inactive goals, check total contributions to determine if completed
      const goalContributions = contributions.filter(
        (c) => c.goalId === goal.goalId,
      );
      const totalContributed = goalContributions.reduce(
        (sum, c) => sum + formatBalance(c.amount),
        0,
      );
      const isCompleted = totalContributed >= goal.targetAmount;

      // Recalculate progress based on actual contributions
      const progress =
        goal.targetAmount > 0
          ? Math.min((totalContributed / goal.targetAmount) * 100, 100)
          : 0;

      return {
        ...goal,
        savedAmount: totalContributed,
        progress, // Use recalculated progress
        status: isCompleted
          ? ("completed" as const)
          : ("earlyWithdrawn" as const),
      };
    });

    return categorized.sort(
      (a, b) => Number(b.createdAt) - Number(a.createdAt),
    );
  }, [goals, contributions]);

  const handleContribute = async (amount: number) => {
    if (!contributionModal.goal) return;
    const goal = contributionModal.goal;
    setContributingGoalId(goal.goalId);
    setIsContributing(true);
    try {
      const amountWei = BigInt(Math.floor(amount * 1e18));
      await contributeToGoal(goal.goalId, amountWei, goal.token);
      setContributionModal({ isOpen: false, goal: null });
      toast.success("Contribution successful!");
    } catch (err: any) {
      toast.error(err?.message || "Contribution failed");
    } finally {
      setContributingGoalId(null);
      setIsContributing(false);
    }
  };

  const handleWithdraw = async (amount?: number) => {
    if (!withdrawalModal.goal) return;
    const goal = withdrawalModal.goal;
    setIsWithdrawing(true);
    try {
      const amountWei = amount ? BigInt(Math.floor(amount * 1e18)) : undefined;
      await withdraw(goal.goalId, amountWei);

      const isComplete = !amountWei || amountWei >= goal.currentAmount;
      if (isComplete && goal.currentAmount >= goal.goalAmount) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        toast.success("Goal completed successfully!");
      } else {
        toast.success(
          goal.progress >= 100
            ? "Withdrawal successful"
            : "Early withdrawal completed with penalty",
        );
      }
      setWithdrawalModal({ isOpen: false, goal: null });
    } catch (err: any) {
      toast.error(err?.message || "Withdrawal failed");
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <>
      <SEO
        title="My Goals"
        description="Track and manage your personal savings goals. Set deadlines, contribute regularly, and achieve your financial targets with Circlepot."
        url="/goals"
      />
      <NavBar
        variant="minimal"
        onBack={() => navigate(-1)}
        title="Goals"
        subtitle="Track and manage your savings goals with deadline-based incentives"
        colors={colors}
      />

      <div
        className="min-h-screen pb-10"
        style={{ backgroundColor: colors.background }}
      >
        <div className="max-w-4xl mx-auto p-4 md:p-6">
          {/* Summary Cards */}
          <div className="flex overflow-x-auto pb-4 gap-3 mb-8 md:gap-4 md:grid md:grid-cols-4 md:overflow-visible md:pb-0 scrollbar-hide snap-x">
            <div
              className="rounded-xl p-4 md:p-6 border shrink-0 w-48 md:w-auto snap-start"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className="text-xs md:text-sm"
                  style={{ color: colors.textLight }}
                >
                  Total Saved
                </div>
                <TrendingUp size={16} style={{ color: colors.primary }} />
              </div>
              <div
                className="text-lg md:text-xl font-bold"
                style={{ color: colors.text }}
              >
                $
                {totalBalance.toLocaleString("en-US", {
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>

            <div
              className="rounded-xl p-4 md:p-6 border shrink-0 w-32 md:w-auto snap-start"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }}
            >
              <div
                className="text-xs md:text-sm mb-2"
                style={{ color: colors.textLight }}
              >
                Active Goals
              </div>
              <div
                className="text-xl md:text-2xl font-bold"
                style={{ color: colors.text }}
              >
                {activeGoals.length}
              </div>
            </div>

            <div
              className="rounded-xl p-4 md:p-6 border shrink-0 w-32 md:w-auto snap-start"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }}
            >
              <div
                className="text-xs md:text-sm mb-2"
                style={{ color: colors.textLight }}
              >
                Completed
              </div>
              <div
                className="text-xl md:text-2xl font-bold"
                style={{ color: colors.text }}
              >
                {goalsHistory.filter((g) => g.status === "completed").length}
              </div>
            </div>

            <div
              className="rounded-xl p-4 md:p-6 border shrink-0 w-32 md:w-auto snap-start"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }}
            >
              <div
                className="text-xs md:text-sm mb-2"
                style={{ color: colors.textLight }}
              >
                Early Withdrawals
              </div>
              <div
                className="text-xl md:text-2xl font-bold"
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
            onContributeClick={(goal) =>
              setContributionModal({ isOpen: true, goal })
            }
            onWithdrawClick={(goal) =>
              setWithdrawalModal({ isOpen: true, goal })
            }
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

      {withdrawalModal.goal && (
        <GoalWithdrawalModal
          isOpen={withdrawalModal.isOpen}
          goalName={withdrawalModal.goal.goalName}
          currentAmount={withdrawalModal.goal.savedAmount}
          targetAmount={withdrawalModal.goal.targetAmount}
          isLoading={isWithdrawing}
          onClose={() => setWithdrawalModal({ isOpen: false, goal: null })}
          onCompleteWithdraw={() => handleWithdraw()}
          onEarlyWithdraw={(amount) => handleWithdraw(amount)}
        />
      )}

      {contributionModal.goal && (
        <GoalContributionModal
          isOpen={contributionModal.isOpen}
          goalName={contributionModal.goal.goalName}
          defaultAmount={
            Number(contributionModal.goal.contributionAmount) / 1e18
          }
          isLoading={isContributing}
          onClose={() => setContributionModal({ isOpen: false, goal: null })}
          onContribute={handleContribute}
        />
      )}
    </>
  );
};

export default Goals;
