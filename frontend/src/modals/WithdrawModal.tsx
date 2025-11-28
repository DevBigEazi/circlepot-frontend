import React from "react";
import { X } from "lucide-react";
import { useThemeColors } from "../hooks/useThemeColors";

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WithdrawModal: React.FC<WithdrawModalProps> = ({ isOpen, onClose }) => {
  const colors = useThemeColors();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        className="rounded-2xl p-6 max-w-md w-full shadow-2xl"
        style={{ backgroundColor: colors.surface }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold" style={{ color: colors.text }}>
            Withdraw Funds
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition hover:opacity-80"
            style={{ backgroundColor: colors.background }}
          >
            <X size={20} style={{ color: colors.text }} />
          </button>
        </div>

        <div className="space-y-4">
          <p style={{ color: colors.textLight }}>
            Withdraw functionality will be implemented here. This will allow you
            to withdraw cUSD from your account.
          </p>

          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl font-semibold text-white transition"
            style={{ background: colors.gradient }}
          >
            Coming Soon
          </button>
        </div>
      </div>
    </div>
  );
};

export default WithdrawModal;
