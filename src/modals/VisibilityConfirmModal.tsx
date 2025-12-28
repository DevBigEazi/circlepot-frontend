import React from "react";
import { AlertCircle, DollarSign, Lock, Globe } from "lucide-react";

interface VisibilityConfirmModalProps {
  currentVisibility: "public" | "private";
  onConfirm: () => void;
  onCancel: () => void;
  colors: any;
}

const VisibilityConfirmModal: React.FC<VisibilityConfirmModalProps> = ({
  currentVisibility,
  onConfirm,
  onCancel,
  colors,
}) => {
  const newVisibility = currentVisibility === "public" ? "private" : "public";
  const fee = "0.5"; // 0.5 USDm fee

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
      <div
        className="rounded-2xl max-w-md w-full shadow-2xl"
        style={{ backgroundColor: colors.surface }}
      >
        {/* Header */}
        <div className="p-6 border-b" style={{ borderColor: colors.border }}>
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: colors.warningBg }}
            >
              <AlertCircle
                className="w-6 h-6"
                style={{ color: colors.secondary }}
              />
            </div>
            <div>
              <h2 className="text-xl font-bold" style={{ color: colors.text }}>
                Confirm Visibility Change
              </h2>
              <p className="text-sm" style={{ color: colors.textLight }}>
                This action requires a fee
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Visibility Change Info */}
          <div
            className="rounded-xl p-4 border"
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border,
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {currentVisibility === "private" ? (
                  <Lock size={16} style={{ color: colors.secondary }} />
                ) : (
                  <Globe size={16} style={{ color: colors.primary }} />
                )}
                <span
                  className="text-sm font-medium"
                  style={{ color: colors.textLight }}
                >
                  Current:
                </span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    currentVisibility === "public"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-purple-100 text-purple-700"
                  }`}
                >
                  {currentVisibility === "public" ? "Public" : "Private"}
                </span>
              </div>
              <span style={{ color: colors.textLight }}>→</span>
              <div className="flex items-center gap-2">
                {newVisibility === "private" ? (
                  <Lock size={16} style={{ color: colors.secondary }} />
                ) : (
                  <Globe size={16} style={{ color: colors.primary }} />
                )}
                <span
                  className="text-sm font-medium"
                  style={{ color: colors.textLight }}
                >
                  New:
                </span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    newVisibility === "public"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-purple-100 text-purple-700"
                  }`}
                >
                  {newVisibility === "public" ? "Public" : "Private"}
                </span>
              </div>
            </div>
          </div>

          {/* Fee Information */}
          <div
            className="rounded-xl p-4 border"
            style={{
              backgroundColor: colors.warningBg,
              borderColor: colors.warningBorder,
            }}
          >
            <div className="flex items-center gap-3 mb-2">
              <DollarSign size={20} style={{ color: colors.secondary }} />
              <span className="font-semibold" style={{ color: colors.text }}>
                Transaction Fee
              </span>
            </div>
            <p className="text-sm mb-3" style={{ color: colors.textLight }}>
              Changing circle visibility requires a fee to prevent spam and
              abuse.
            </p>
            <div className="flex justify-between items-center">
              <span
                className="text-sm font-medium"
                style={{ color: colors.textLight }}
              >
                Fee Amount:
              </span>
              <span
                className="text-lg font-bold"
                style={{ color: colors.text }}
              >
                ${fee} USDm
              </span>
            </div>
          </div>

          {/* Warning Message */}
          <div
            className="rounded-xl p-4 border-l-4"
            style={{
              backgroundColor: colors.infoBg,
              borderColor: colors.primary,
            }}
          >
            <p className="text-sm" style={{ color: colors.textLight }}>
              {newVisibility === "public"
                ? "Making your circle public will allow anyone to join without an invite."
                : "Making your circle private will require you to invite members manually."}
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
            className="flex-1 py-3 rounded-xl font-semibold transition hover:opacity-80"
            style={{
              backgroundColor: colors.border,
              color: colors.text,
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-xl font-semibold text-white transition hover:opacity-90"
            style={{ background: colors.gradient }}
          >
            Confirm & Pay ${fee}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VisibilityConfirmModal;
