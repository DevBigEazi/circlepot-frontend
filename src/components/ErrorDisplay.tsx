import React from "react";
import { AuthError } from "../hooks/useAuth";

interface ErrorDisplayProps {
  error: AuthError | null;
  onDismiss: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, onDismiss }) => {
  if (!error) return null;

  const getErrorIcon = (code: string) => {
    switch (code) {
      case "USER_CANCELLED":
        return "⚠️";
      case "NETWORK_ERROR":
        return "🌐";
      case "POPUP_BLOCKED":
        return "🚫";
      case "INVALID_EMAIL":
        return "📧";
      case "RATE_LIMITED":
        return "⏰";
      case "INVALID_CODE":
        return "🔢";
      case "CODE_EXPIRED":
        return "⏰";
      case "NOT_SUPPORTED":
        return "❌";
      case "SECURITY_ERROR":
        return "🔒";
      default:
        return "❌";
    }
  };

  const getErrorColor = (code: string) => {
    if (code === "USER_CANCELLED")
      return "text-yellow-600 bg-yellow-50 border-yellow-200";
    if (code === "NETWORK_ERROR" || code === "RATE_LIMITED")
      return "text-blue-600 bg-blue-50 border-blue-200";
    if (code === "NOT_SUPPORTED")
      return "text-gray-600 bg-gray-50 border-gray-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  return (
    <div className={`rounded-lg border p-4 mb-4 ${getErrorColor(error.code)}`}>
      <div className="flex items-start gap-3">
        <span className="text-lg">{getErrorIcon(error.code)}</span>
        <div className="flex-1">
          <h4 className="font-medium mb-1">Authentication Error</h4>
          <p className="text-sm">{error.message}</p>
        </div>
        <button
          onClick={onDismiss}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Dismiss error"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default ErrorDisplay;
