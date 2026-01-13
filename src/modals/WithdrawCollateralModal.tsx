import React from "react";
import { AlertTriangle, X } from "lucide-react";

interface WithdrawCollateralModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  colors: any;
  circleName: string;
  collateralLocked: bigint;
  creatorDeadFee: bigint;
  netAmount: bigint;
  isCreator: boolean;
  withdrawalReason: "vote_failed" | "below_threshold";
  isLoading: boolean;
}

const WithdrawCollateralModal: React.FC<WithdrawCollateralModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  colors,
  circleName,
  collateralLocked,
  creatorDeadFee,
  netAmount,
  isCreator,
  withdrawalReason,
  isLoading,
}) => {
  if (!isOpen) return null;

  const reasonText =
    withdrawalReason === "vote_failed"
      ? "The vote to withdraw won"
      : "Circle did not reach minimum members";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div
        className="rounded-2xl max-w-md w-full p-6 shadow-2xl"
        style={{ backgroundColor: colors.surface }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg" style={{ color: colors.text }}>
                Withdraw Collateral
              </h3>
              <p className="text-sm" style={{ color: colors.textLight }}>
                {circleName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            style={{ color: colors.text }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Warning */}
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-4">
          <p className="text-sm dark:text-orange-200 font-medium mb-2" style={{color: colors.primary}}>
            ⚠️ This will mark the circle as DEAD
          </p>
          <p className="text-xs dark:text-orange-300" style={{color: colors.textLight}}>
            Reason: {reasonText}
          </p>
        </div>

        {/* Amount Breakdown */}
        <div
          className="space-y-3 mb-6 p-4 rounded-lg"
          style={{ backgroundColor: colors.accentBg }}
        >
          <div className="flex justify-between items-center">
            <span className="text-sm" style={{ color: colors.textLight }}>
              Collateral Locked:
            </span>
            <span className="font-semibold" style={{ color: colors.text }}>
              ${(Number(collateralLocked) / 1e18).toFixed(2)}
            </span>
          </div>

          {isCreator && creatorDeadFee > 0n && (
            <>
              <div
                className="border-t pt-3"
                style={{ borderColor: colors.border }}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-orange-600">
                    Dead Circle Fee:
                  </span>
                  <span className="font-semibold text-orange-600">
                    -${(Number(creatorDeadFee) / 1e18).toFixed(2)}
                  </span>
                </div>
                <p className="text-[10px] text-orange-500">
                  Creator fee for dead circles
                </p>
              </div>
            </>
          )}

          <div className="border-t pt-3" style={{ borderColor: colors.border }}>
            <div className="flex justify-between items-center">
              <span className="font-semibold" style={{ color: colors.text }}>
                You will receive:
              </span>
              <span
                className="font-bold text-lg"
                style={{ color: colors.primary }}
              >
                ${(Number(netAmount) / 1e18).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-2.5 rounded-lg font-semibold text-sm transition border hover:opacity-80"
            style={{ borderColor: colors.border, color: colors.text }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 py-2.5 rounded-lg font-semibold text-sm transition text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-50"
          >
            {isLoading ? "Processing..." : "Confirm Withdrawal"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WithdrawCollateralModal;
