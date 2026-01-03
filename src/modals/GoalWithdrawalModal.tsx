import React, { useMemo } from "react";
import { AlertCircle, X, Loader } from "lucide-react";
import { useThemeColors } from "../hooks/useThemeColors";
import { GoalWithdrawalModalProps } from "../interfaces/interfaces";

export const GoalWithdrawalModal: React.FC<GoalWithdrawalModalProps> = ({
  isOpen,
  goalName,
  currentAmount,
  targetAmount,
  isLoading,
  onClose,
  onCompleteWithdraw,
  onEarlyWithdraw,
  goalCard,
}) => {
  const colors = useThemeColors();

  const progress = useMemo(() => {
    return targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;
  }, [currentAmount, targetAmount]);

  const isGoalComplete = currentAmount >= targetAmount;

  // Calculate penalty based on progress
  const calculatePenalty = (progressPercent: number) => {
    if (progressPercent < 25) return 1.0; // 1.0%
    if (progressPercent < 50) return 0.6; // 0.6%
    if (progressPercent < 75) return 0.3; // 0.3%
    if (progressPercent < 100) return 0.1; // 0.1%
    return 0;
  };

  const penaltyPercentage = calculatePenalty(progress);
  const penaltyAmount = (currentAmount * penaltyPercentage) / 100;
  const netAmount = currentAmount - penaltyAmount;

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop with Goal Card Background */}
      <div
        className="fixed inset-0 z-40 transition-opacity backdrop-blur-sm pointer-events-none flex items-center justify-center p-4 sm:p-0"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
      >
        {goalCard && (
          <div className="hidden sm:block absolute pointer-events-none opacity-40 scale-90">
            {goalCard}
          </div>
        )}
      </div>

      {/* Clickable Backdrop */}
      <div
        className="fixed inset-0 z-40 cursor-pointer"
        onClick={onClose}
        style={{ backgroundColor: "transparent" }}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div
          className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto"
          style={{ backgroundColor: colors.surface }}
        >
          {/* Handle Bar for Mobile */}
          <div className="flex justify-center py-2 sm:hidden">
            <div
              className="w-12 h-1 rounded-full"
              style={{ backgroundColor: colors.border }}
            />
          </div>

          {/* Header */}
          <div
            className="flex items-center justify-between p-4 sm:p-6 border-b"
            style={{ borderColor: colors.border }}
          >
            <h2
              className="text-lg sm:text-xl font-bold"
              style={{ color: colors.text }}
            >
              Withdraw from Goal
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:opacity-70 transition"
              disabled={isLoading}
            >
              <X size={20} style={{ color: colors.textLight }} />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            {/* Goal Info */}
            <div>
              <p
                className="text-xs sm:text-sm mb-2"
                style={{ color: colors.textLight }}
              >
                Goal Name
              </p>
              <p
                className="text-base sm:text-lg font-semibold"
                style={{ color: colors.text }}
              >
                {goalName}
              </p>
            </div>

            {/* Progress Info */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <p
                  className="text-xs sm:text-sm"
                  style={{ color: colors.textLight }}
                >
                  Progress
                </p>
                <p
                  className="text-xs sm:text-sm font-semibold"
                  style={{ color: colors.primary }}
                >
                  {progress.toFixed(0)}%
                </p>
              </div>
              <div
                className="w-full rounded-full h-2"
                style={{ backgroundColor: colors.border }}
              >
                <div
                  className="h-2 rounded-full transition-all"
                  style={{
                    backgroundColor: colors.primary,
                    width: `${Math.min(progress, 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* Withdrawal Info */}
            <div
              className="rounded-lg p-3 sm:p-4"
              style={{ backgroundColor: colors.background }}
            >
              <p
                className="text-xs mb-2 sm:mb-3"
                style={{ color: colors.textLight }}
              >
                Current Amount
              </p>
              <p
                className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4"
                style={{ color: colors.text }}
              >
                $
                {currentAmount.toLocaleString("en-US", {
                  maximumFractionDigits: 2,
                })}
              </p>

              {!isGoalComplete && penaltyPercentage > 0 && (
                <div
                  className="space-y-2 pt-3 sm:pt-4 border-t"
                  style={{ borderColor: colors.border }}
                >
                  <div className="flex justify-between">
                    <span
                      style={{ color: colors.textLight }}
                      className="text-xs"
                    >
                      Early Withdrawal Penalty
                    </span>
                    <span
                      style={{ color: "#ef4444" }}
                      className="text-xs font-semibold"
                    >
                      {penaltyPercentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span
                      style={{ color: colors.textLight }}
                      className="text-xs"
                    >
                      Penalty Amount
                    </span>
                    <span
                      style={{ color: "#ef4444" }}
                      className="text-xs font-semibold"
                    >
                      $
                      {penaltyAmount.toLocaleString("en-US", {
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div
                    className="flex justify-between pt-2 border-t"
                    style={{ borderColor: colors.border }}
                  >
                    <span
                      style={{ color: colors.text }}
                      className="text-xs sm:text-sm font-semibold"
                    >
                      You Receive
                    </span>
                    <span
                      style={{ color: colors.primary }}
                      className="text-xs sm:text-sm font-semibold"
                    >
                      $
                      {netAmount.toLocaleString("en-US", {
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Warning */}
            {!isGoalComplete && (
              <div
                className="rounded-lg p-3 flex gap-2"
                style={{ backgroundColor: "#fef2f2", borderColor: "#fee2e2" }}
              >
                <AlertCircle
                  size={16}
                  style={{ color: "#ef4444", flexShrink: 0, marginTop: "2px" }}
                />
                <p
                  style={{ color: "#991b1b" }}
                  className="text-xs leading-relaxed"
                >
                  Withdrawing early will result in a penalty and a reputation
                  decrease of 5 points.
                </p>
              </div>
            )}

            {isGoalComplete && (
              <div
                className="rounded-lg p-3 flex gap-2"
                style={{ backgroundColor: "#f0fdf4", borderColor: "#dcfce7" }}
              >
                <AlertCircle
                  size={16}
                  style={{ color: "#22c55e", flexShrink: 0, marginTop: "2px" }}
                />
                <p
                  style={{ color: "#166534" }}
                  className="text-xs leading-relaxed"
                >
                  Goal target reached! Withdraw your full amount without penalty
                  and gain 10 reputation points. You can also keep your goal
                  active to save more.
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div
            className="flex flex-col-reverse sm:flex-row gap-2 p-4 sm:p-6 border-t"
            style={{ borderColor: colors.border }}
          >
            {isGoalComplete ? (
              <button
                onClick={onCompleteWithdraw}
                disabled={isLoading}
                className="w-full px-4 py-3 sm:py-2 rounded-lg font-medium transition hover:opacity-80 disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base"
                style={{
                  backgroundColor: colors.primary,
                  color: "#ffffff",
                }}
              >
                {isLoading ? (
                  <>
                    <Loader size={16} className="animate-spin" />
                    Withdrawing...
                  </>
                ) : (
                  "Complete & Withdraw"
                )}
              </button>
            ) : (
              <button
                onClick={onEarlyWithdraw}
                disabled={isLoading}
                className="w-full px-4 py-3 sm:py-2 rounded-lg font-medium transition hover:opacity-80 disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base"
                style={{
                  backgroundColor: "#ef4444",
                  color: "#ffffff",
                }}
              >
                {isLoading ? (
                  <>
                    <Loader size={16} className="animate-spin" />
                    Withdrawing...
                  </>
                ) : (
                  "Withdraw Early"
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
