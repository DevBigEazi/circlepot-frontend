import React from "react";
import { TrendingUp } from "lucide-react";
import { ActiveCircle } from "../interfaces/interfaces";

interface CirclePayoutHistoryTabProps {
  circle: ActiveCircle;
  colors: any;
}

const CirclePayoutHistoryTab: React.FC<CirclePayoutHistoryTabProps> = ({
  circle,
  colors,
}) => {
  return (
    <div className="space-y-6">
      {/* Payout History Section */}
      <div
        className="rounded-xl p-4 border"
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.border,
        }}
      >
        <h3
          className="font-bold mb-4 flex items-center gap-2"
          style={{ color: colors.text }}
        >
          <TrendingUp size={18} style={{ color: colors.secondary }} />
          Payout History ({circle.payouts?.length || 0}/{circle.totalPositions})
        </h3>

        {!circle.payouts || circle.payouts.length === 0 ? (
          <div
            className="text-center py-6 text-sm"
            style={{ color: colors.textLight }}
          >
            No payouts recorded yet.
          </div>
        ) : (
          <div className="space-y-3">
            {[...circle.payouts]
              .sort((a, b) => Number(b.round) - Number(a.round))
              .map((payout, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-lg border text-sm"
                  style={{
                    backgroundColor: colors.accentBg,
                    borderColor: colors.border,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                      style={{ backgroundColor: colors.primary }}
                    >
                      #{payout.round.toString()}
                    </div>
                    <div>
                      <div
                        className="font-semibold"
                        style={{ color: colors.text }}
                      >
                        {"Recipient: " +
                          (payout.user?.username ||
                            payout.user?.fullName ||
                            "Unknown")}
                      </div>
                      <div
                        className="text-[10px]"
                        style={{ color: colors.textLight }}
                      >
                        {new Date(
                          Number(payout.timestamp) * 1000
                        ).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold" style={{color: colors.primary}}>
                      +${(Number(payout.payoutAmount) / 1e18).toFixed(2)}
                    </div>
                    <div className="text-[10px] text-green-500 font-medium">
                      Received ✓
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CirclePayoutHistoryTab;
