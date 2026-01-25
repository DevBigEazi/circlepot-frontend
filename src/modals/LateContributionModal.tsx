import React from "react";
import { Clock, AlertTriangle, DollarSign, Shield } from "lucide-react";

interface LateContributionModalProps {
  contributionAmount: bigint;
  lateFee: bigint;
  circleName: string;
  onConfirm: () => void;
  onCancel: () => void;
  colors: any;
  isLoading?: boolean;
}

const LateContributionModal: React.FC<LateContributionModalProps> = ({
  contributionAmount,
  lateFee,
  circleName,
  onConfirm,
  onCancel,
  colors,
  isLoading = false,
}) => {
  const formatAmount = (amount: bigint) => {
    return (Number(amount) / 1e18).toFixed(2);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-60">
      <div
        className="rounded-2xl max-w-md w-full shadow-2xl"
        style={{ backgroundColor: colors.surface }}
      >
        {/* Header */}
        <div className="p-6 border-b" style={{ borderColor: colors.border }}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-amber-100">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold" style={{ color: colors.text }}>
                Late Contribution
              </h2>
              <p className="text-sm" style={{ color: colors.textLight }}>
                You're contributing after the deadline
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Circle Name */}
          <div
            className="rounded-xl p-4 border"
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border,
            }}
          >
            <div className="flex items-center justify-between">
              <span
                className="text-sm font-medium"
                style={{ color: colors.textLight }}
              >
                Circle:
              </span>
              <span className="font-semibold" style={{ color: colors.text }}>
                {circleName}
              </span>
            </div>
          </div>

          {/* Warning Box */}
          <div
            className="rounded-xl p-4 border-l-4 bg-amber-50 dark:bg-amber-950/30"
            style={{ borderColor: "#f59e0b" }}
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Late Fee Applies
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  Since you're contributing after the round deadline, a 1% late
                  fee will be deducted from your locked collateral.
                </p>
              </div>
            </div>
          </div>

          {/* Amount Breakdown */}
          <div
            className="rounded-xl p-4 border space-y-3"
            style={{
              backgroundColor: colors.background,
              borderColor: colors.border,
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <DollarSign size={18} style={{ color: colors.primary }} />
              <span className="font-semibold" style={{ color: colors.text }}>
                Transaction Breakdown
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm" style={{ color: colors.textLight }}>
                Contribution Amount:
              </span>
              <span className="font-semibold" style={{ color: colors.text }}>
                ${formatAmount(contributionAmount)} USDm
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm" style={{ color: colors.textLight }}>
                Late Fee (1%):
              </span>
              <span className="font-semibold text-amber-600">
                -${formatAmount(lateFee)} USDm
              </span>
            </div>

            <div
              className="border-t pt-3 mt-2"
              style={{ borderColor: colors.border }}
            >
              <div className="flex items-center gap-2">
                <Shield size={14} className="text-amber-500" />
                <span className="text-xs" style={{ color: colors.textLight }}>
                  Fee deducted from your locked collateral
                </span>
              </div>
            </div>
          </div>

          {/* Info Note */}
          <div
            className="rounded-xl p-4 border-l-4"
            style={{
              backgroundColor: colors.infoBg,
              borderColor: colors.primary,
            }}
          >
            <p className="text-sm" style={{ color: colors.textLight }}>
              Your contribution will still be added to the pot. The late fee is
              separate and helps incentivize timely payments.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div
          className="p-6 border-t flex gap-3"
          style={{ borderColor: colors.border }}
        >
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 py-3 rounded-xl font-semibold transition hover:opacity-80 disabled:opacity-50"
            style={{
              backgroundColor: colors.border,
              color: colors.text,
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 py-3 rounded-xl font-semibold text-white transition hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Clock size={18} />
                <span>Confirm Late Contribution</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LateContributionModal;
