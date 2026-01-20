import React, { useState, useEffect } from "react";
import { X, Loader, Wallet, ArrowUpRight } from "lucide-react";
import { useThemeColors } from "../hooks/useThemeColors";

interface GoalContributionModalProps {
  isOpen: boolean;
  goalName: string;
  defaultAmount: number;
  isLoading: boolean;
  onClose: () => void;
  onContribute: (amount: number) => void;
}

export const GoalContributionModal: React.FC<GoalContributionModalProps> = ({
  isOpen,
  goalName,
  defaultAmount,
  isLoading,
  onClose,
  onContribute,
}) => {
  const colors = useThemeColors();
  const [amount, setAmount] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      setAmount(defaultAmount.toString());
    }
  }, [isOpen, defaultAmount]);

  const handleContribute = () => {
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) return;
    onContribute(val);
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 backdrop-blur-sm transition-opacity"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
        onClick={onClose}
      />

      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div
          className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden"
          style={{ backgroundColor: colors.surface }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between p-4 sm:p-6 border-b"
            style={{ borderColor: colors.border }}
          >
            <div className="flex items-center gap-3">
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: `${colors.primary}15` }}
              >
                <Wallet size={20} style={{ color: colors.primary }} />
              </div>
              <div className="flex flex-col">
                <h2
                  className="text-lg font-bold"
                  style={{ color: colors.text }}
                >
                  Contribute to Goal
                </h2>
                <span className="text-xs" style={{ color: colors.textLight }}>
                  {goalName}
                </span>
              </div>
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
          <div className="p-4 sm:p-6 space-y-6">
            <div className="space-y-2">
              <label
                className="text-xs font-bold uppercase tracking-widest px-1"
                style={{ color: colors.textLight }}
              >
                Contribution Amount (USDm)
              </label>
              <div className="relative">
                <div
                  className="absolute left-4 top-1/2 -translate-y-1/2 font-bold"
                  style={{ color: colors.textLight }}
                >
                  $
                </div>
                <input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-4 rounded-xl border-2 transition-all focus:ring-0 text-xl font-black"
                  style={{
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                    color: colors.text,
                  }}
                  autoFocus
                />
              </div>
              <p
                className="text-[10px] px-1"
                style={{ color: colors.textLight }}
              >
                Your regular contribution is ${defaultAmount}. You can decrease
                it for this transaction, but it cannot exceed the default
                amount.
              </p>
            </div>

            <div
              className="p-4 rounded-xl border border-dashed flex items-center justify-between"
              style={{
                borderColor: colors.border,
                backgroundColor: `${colors.primary}05`,
              }}
            >
              <span className="text-sm" style={{ color: colors.textLight }}>
                Transaction total
              </span>
              <span
                className="text-lg font-black"
                style={{
                  color:
                    parseFloat(amount) > defaultAmount
                      ? "#ef4444"
                      : colors.text,
                }}
              >
                ${parseFloat(amount) || 0}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div
            className="p-4 sm:p-6 border-t"
            style={{ borderColor: colors.border }}
          >
            <button
              onClick={handleContribute}
              disabled={
                isLoading ||
                !amount ||
                parseFloat(amount) <= 0 ||
                parseFloat(amount) > defaultAmount
              }
              className="w-full py-4 rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              style={{
                backgroundColor: colors.primary,
                color: "#ffffff",
              }}
            >
              {isLoading ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  Sending Transaction...
                </>
              ) : (
                <>
                  <ArrowUpRight size={18} />
                  Confirm Contribution
                </>
              )}
            </button>
            {parseFloat(amount) > defaultAmount && (
              <p className="text-center text-[#ef4444] text-[10px] mt-2 font-bold">
                Amount cannot exceed regular contribution of ${defaultAmount}
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
