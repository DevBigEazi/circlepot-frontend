import React from "react";
import { AlertCircle } from "lucide-react";
import { createPortal } from "react-dom";
import LoadingSpinner from "../components/LoadingSpinner";

interface LogoutModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  colors: {
    surface: string;
    border: string;
    background: string;
    text: string;
    textLight: string;
  };
  disabled: boolean;
}

const LogoutModal: React.FC<LogoutModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  colors,
  disabled,
}) => {
  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div
        className="rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        style={{ backgroundColor: colors.surface }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-red-600">
            <AlertCircle className="text-white" size={20} />
          </div>
          <h2
            className="font-bold text-base sm:text-lg"
            style={{ color: colors.text }}
          >
            Confirm Logout
          </h2>
        </div>

        <p className="text-sm mb-6" style={{ color: colors.textLight }}>
          Are you sure you want to logout? You'll need to reconnect your wallet
          to access your account again.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl font-medium border transition text-sm hover:opacity-80"
            style={{
              borderColor: colors.border,
              color: colors.text,
              backgroundColor: colors.background,
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={disabled}
            className="flex-1 px-4 py-2.5 rounded-xl font-medium text-white transition text-sm hover:opacity-90 bg-red-600"
          >
            {disabled ? (
              <LoadingSpinner size="sm" text="Disconnecting..." />
            ) : (
              <>Logout</>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  // Portal to render outside the component tree to avoid z-index stacking issues
  return createPortal(modalContent, document.body);
};

export default LogoutModal;
