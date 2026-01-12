import React from "react";
import { useThemeColors } from "../hooks/useThemeColors";
import { RefreshCcw, WifiOff } from "lucide-react";

interface DataErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  isSyncing?: boolean;
}

const DataErrorState: React.FC<DataErrorStateProps> = ({
  title = "It's Not You, It's Us",
  message = "Our data server is having a little trouble. We're working to get things back on track as quickly as possible.",
  onRetry,
  isSyncing = false,
}) => {
  const colors = useThemeColors();

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{ backgroundColor: colors.background }}
    >
      <div
        className="w-20 h-20 rounded-3xl flex items-center justify-center mb-8 animate-pulse"
        style={{ backgroundColor: colors.errorBg, color: colors.errorBorder }}
      >
        {isSyncing ? (
          <RefreshCcw size={40} className="animate-spin" />
        ) : (
          <WifiOff size={40} />
        )}
      </div>

      <h1 className="text-2xl font-bold mb-3" style={{ color: colors.text }}>
        {title}
      </h1>

      <p
        className="text-base mb-10 max-w-xs leading-relaxed"
        style={{ color: colors.textLight }}
      >
        {message}
      </p>

      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-8 py-4 rounded-2xl font-semibold transition-all active:scale-95 shadow-lg"
          style={{
            backgroundColor: colors.primary,
            color: "#FFF",
            boxShadow: `0 10px 20px ${colors.primary}30`,
          }}
        >
          <RefreshCcw size={18} />
          Try Again
        </button>
      )}
    </div>
  );
};

export default DataErrorState;
