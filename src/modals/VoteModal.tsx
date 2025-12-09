import React from "react";
import { X, CheckCircle, UserX } from "lucide-react";
import { useThemeColors } from "../hooks/useThemeColors";

interface VoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVoteStart: () => void;
  onVoteWithdraw: () => void;
  isLoading: boolean;
}

const VoteModal: React.FC<VoteModalProps> = ({
  isOpen,
  onClose,
  onVoteStart,
  onVoteWithdraw,
  isLoading,
}) => {
  const colors = useThemeColors();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      style={{ zIndex: 100 }}
    >
      <div
        className="rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-6"
        style={{ backgroundColor: colors.surface }}
      >
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold" style={{ color: colors.text }}>
            Cast Your Vote
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition hover:opacity-80"
            style={{ backgroundColor: colors.background }}
          >
            <X size={20} style={{ color: colors.text }} />
          </button>
        </div>

        <p style={{ color: colors.textLight }} className="text-sm">
          Please choose whether to start the circle or withdraw your collateral.
          This action cannot be undone.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => {
              onVoteStart();
            }}
            disabled={isLoading}
            className="w-full py-3 rounded-xl font-semibold text-white transition flex items-center justify-center gap-2 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
            style={{ backgroundColor: "#22c55e" }} // Green-500
          >
            <CheckCircle className="w-5 h-5" />
            <span>Vote to Start</span>
          </button>

          <button
            onClick={() => {
              onVoteWithdraw();
            }}
            disabled={isLoading}
            className="w-full py-3 rounded-xl font-semibold text-white transition flex items-center justify-center gap-2 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
            style={{ backgroundColor: "#ef4444" }} // Red-500
          >
            <UserX className="w-5 h-5" />
            <span>Vote to Withdraw</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoteModal;
