import React from "react";

interface NetworkTroubleshootingProps {
  onRetry: () => void;
  onDismiss: () => void;
}

const NetworkTroubleshooting: React.FC<NetworkTroubleshootingProps> = ({
  onRetry,
  onDismiss,
}) => {
  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 mb-4">
      <div className="flex items-start gap-3">
        <span className="text-lg">🌐</span>
        <div className="flex-1">
          <h4 className="font-medium text-blue-800 mb-2">
            Network Connection Issue
          </h4>
          <p className="text-sm text-blue-700 mb-3">
            It looks like there's a network connectivity issue. This might be
            due to:
          </p>
          <ul className="text-sm text-blue-700 mb-3 space-y-1">
            <li>• Corporate firewall or proxy settings</li>
            <li>• VPN configuration issues</li>
            <li>• Internet connection problems</li>
            <li>• Browser security settings</li>
          </ul>
          <div className="flex gap-2">
            <button
              onClick={onRetry}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={onDismiss}
              className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm hover:bg-blue-200 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetworkTroubleshooting;
