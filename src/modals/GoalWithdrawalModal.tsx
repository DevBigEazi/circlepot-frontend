import React, { useMemo, useState, useEffect } from "react";
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
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");

  // Initialize withdrawAmount with currentAmount when modal opens
  useEffect(() => {
    if (isOpen) {
      setWithdrawAmount(currentAmount.toString());
    }
  }, [isOpen, currentAmount]);

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

  const amountToWithdraw = parseFloat(withdrawAmount) || 0;
  const penaltyPercentage = calculatePenalty(progress);
  const penaltyAmount = (amountToWithdraw * penaltyPercentage) / 100;
  const netAmount = amountToWithdraw - penaltyAmount;

  const handleMax = () => {
    setWithdrawAmount(currentAmount.toString());
  };

  const handleEarlyWithdrawClick = () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0 || amount > currentAmount) return;
    onEarlyWithdraw(amount);
  };

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
            <div className="flex flex-col">
              <h2
                className="text-lg sm:text-xl font-bold"
                style={{ color: colors.text }}
              >
                Withdraw from Goal
              </h2>
              <span className="text-xs" style={{ color: colors.textLight }}>
                {goalName}
              </span>
            </div>
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
            {/* Goal Info & Progress */}
            <div
              className="rounded-xl p-4 border border-dashed"
              style={{
                borderColor: colors.border,
                backgroundColor: `${colors.primary}05`,
              }}
            >
              <div className="flex justify-between items-center mb-2">
                <p
                  className="text-xs font-semibold"
                  style={{ color: colors.textLight }}
                >
                  Progress to Goal
                </p>
                <p
                  className="text-xs font-bold"
                  style={{ color: colors.primary }}
                >
                  {progress.toFixed(0)}%
                </p>
              </div>
              <div
                className="w-full rounded-full h-1.5"
                style={{ backgroundColor: colors.border }}
              >
                <div
                  className="h-1.5 rounded-full transition-all"
                  style={{
                    backgroundColor: colors.primary,
                    width: `${Math.min(progress, 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* Withdrawal Amount Input */}
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: colors.textLight }}
                >
                  Withdrawal Amount
                </label>
                <div className="flex items-center gap-1">
                  <span
                    className="text-[10px]"
                    style={{ color: colors.textLight }}
                  >
                    Available:
                  </span>
                  <span
                    className="text-[10px] font-bold"
                    style={{ color: colors.text }}
                  >
                    ${currentAmount.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="relative group">
                <div
                  className="absolute left-4 top-1/2 -translate-y-1/2 font-bold"
                  style={{ color: colors.textLight }}
                >
                  $
                </div>
                <input
                  type="number"
                  placeholder="0.00"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  disabled={isLoading || isGoalComplete}
                  className="w-full pl-8 pr-16 py-4 rounded-xl border-2 transition-all focus:ring-0 text-lg font-bold"
                  style={{
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                    color: colors.text,
                  }}
                />
                {!isGoalComplete && (
                  <button
                    onClick={handleMax}
                    disabled={isLoading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all hover:scale-105 active:scale-95"
                    style={{
                      backgroundColor: `${colors.primary}20`,
                      color: colors.primary,
                    }}
                  >
                    Max
                  </button>
                )}
              </div>
            </div>

            {/* Summary Box */}
            <div
              className="rounded-2xl p-4 space-y-3"
              style={{
                backgroundColor: colors.background,
                border: `1px solid ${colors.border}`,
              }}
            >
              {!isGoalComplete && penaltyPercentage > 0 && (
                <>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: colors.textLight }}>
                      Penalty Fee ({penaltyPercentage.toFixed(1)}%)
                    </span>
                    <span style={{ color: "#ef4444" }} className="font-bold">
                      -$
                      {penaltyAmount.toLocaleString("en-US", {
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div
                    className="h-px w-full"
                    style={{ backgroundColor: colors.border }}
                  />
                </>
              )}
              <div className="flex justify-between items-center">
                <span
                  className="text-sm font-bold"
                  style={{ color: colors.text }}
                >
                  Expected Return
                </span>
                <span
                  className="text-lg font-black"
                  style={{ color: colors.primary }}
                >
                  $
                  {netAmount.toLocaleString("en-US", {
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>

            {/* Warning/Info Alerts */}
            {!isGoalComplete ? (
              <div
                className="rounded-2xl p-4 flex gap-3 border shadow-sm"
                style={{ backgroundColor: "#fef2f2", borderColor: "#fee2e2" }}
              >
                <AlertCircle
                  size={20}
                  className="shrink-0"
                  style={{ color: "#ef4444" }}
                />
                <div className="space-y-1">
                  <p
                    style={{ color: "#991b1b" }}
                    className="text-xs font-bold uppercase tracking-tight"
                  >
                    Early Withdrawal Warning
                  </p>
                  <p
                    style={{ color: "#b91c1c" }}
                    className="text-[11px] leading-relaxed"
                  >
                    Withdrawing before reaching your goal will incur a{" "}
                    <span className="font-bold">
                      {penaltyPercentage}% penalty
                    </span>{" "}
                    and decrease your reputation.
                  </p>
                </div>
              </div>
            ) : (
              <div
                className="rounded-2xl p-4 flex gap-3 border shadow-sm"
                style={{ backgroundColor: "#f0fdf4", borderColor: "#dcfce7" }}
              >
                <AlertCircle
                  size={20}
                  className="shrink-0"
                  style={{ color: "#22c55e" }}
                />
                <div className="space-y-1">
                  <p
                    style={{ color: "#166534" }}
                    className="text-xs font-bold uppercase tracking-tight"
                  >
                    Goal Completed!
                  </p>
                  <p
                    style={{ color: "#15803d" }}
                    className="text-[11px] leading-relaxed"
                  >
                    Congratulations! You've reached your target. Withdraw your
                    full amount with{" "}
                    <span className="font-bold">0 penalty</span> and earn{" "}
                    <span className="font-bold">reputation points</span>.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div
            className="p-4 sm:p-6 border-t"
            style={{ borderColor: colors.border }}
          >
            {isGoalComplete ? (
              <button
                onClick={onCompleteWithdraw}
                disabled={isLoading}
                className="w-full py-4 rounded-xl font-bold transition shadow-lg flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                style={{
                  backgroundColor: colors.primary,
                  color: "#ffffff",
                }}
              >
                {isLoading ? (
                  <>
                    <Loader size={18} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Complete & Withdraw All"
                )}
              </button>
            ) : (
              <button
                onClick={handleEarlyWithdrawClick}
                disabled={
                  isLoading ||
                  amountToWithdraw <= 0 ||
                  amountToWithdraw > currentAmount
                }
                className="w-full py-4 rounded-xl font-bold transition shadow-lg flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                style={{
                  backgroundColor: "#ef4444",
                  color: "#ffffff",
                }}
              >
                {isLoading ? (
                  <>
                    <Loader size={18} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Withdraw $${amountToWithdraw.toLocaleString()}`
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
