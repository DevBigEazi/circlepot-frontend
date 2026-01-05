import React, { useState, useEffect } from "react";
import { X, CheckCircle, UserX, Loader2 } from "lucide-react";
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
  const [votingFor, setVotingFor] = useState<"start" | "withdraw" | null>(null);

  // Reset votingFor state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setVotingFor(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleVoteStart = () => {
    setVotingFor("start");
    onVoteStart();
  };

  const handleVoteWithdraw = () => {
    setVotingFor("withdraw");
    onVoteWithdraw();
  };

  const isVotingStart = isLoading && votingFor === "start";
  const isVotingWithdraw = isLoading && votingFor === "withdraw";

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
            disabled={isLoading}
            className="p-2 rounded-lg transition hover:opacity-80 disabled:opacity-50"
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
            onClick={handleVoteStart}
            disabled={isLoading}
            className="w-full py-3 rounded-xl font-semibold text-white transition flex items-center justify-center gap-2 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
            style={{ backgroundColor: colors.primary }}
          >
            {isVotingStart ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Voting to Start...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                <span>Vote to Start</span>
              </>
            )}
          </button>

          <button
            onClick={handleVoteWithdraw}
            disabled={isLoading}
            className="w-full py-3 rounded-xl font-semibold text-white transition flex items-center justify-center gap-2 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
            style={{ backgroundColor: colors.primary }}
          >
            {isVotingWithdraw ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Voting to Withdraw...</span>
              </>
            ) : (
              <>
                <UserX className="w-5 h-5" />
                <span>Vote to Withdraw</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoteModal;
