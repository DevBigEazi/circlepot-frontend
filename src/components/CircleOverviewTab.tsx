import React from "react";
import {
  DollarSign,
  Users,
  TrendingUp,
  Star,
  Calendar,
  Shield,
} from "lucide-react";
import { ActiveCircle } from "../interfaces/interfaces";
import { getFrequencyText } from "../utils/helpers";

interface CircleOverviewTabProps {
  circle: ActiveCircle;
  colors: any;
  collateralLocked: number;
  collateralRequired: number;
  minMembersToStart: number;
  ultimatumPeriod: string;
}

const CircleOverviewTab: React.FC<CircleOverviewTabProps> = ({
  circle,
  colors,
  collateralLocked,
  collateralRequired,
  minMembersToStart,
  ultimatumPeriod,
}) => {
  return (
    <div className="space-y-6">
      {/* Circle Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div
          className="rounded-xl p-4 text-center border"
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.border,
          }}
        >
          <DollarSign
            className="mx-auto mb-2"
            size={24}
            style={{ color: colors.primary }}
          />
          <div className="font-bold text-lg" style={{ color: colors.text }}>
            ${circle.contribution}
          </div>
          <div className="text-xs" style={{ color: colors.textLight }}>
            Per {getFrequencyText(circle.frequency)}
          </div>
        </div>

        <div
          className="rounded-xl p-4 text-center border"
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.border,
          }}
        >
          <Users
            className="mx-auto mb-2"
            size={24}
            style={{ color: colors.primary }}
          />
          <div className="font-bold text-lg" style={{ color: colors.text }}>
            {circle.rawCircle?.currentMembers.toString() || 0}/
            {circle.totalPositions}
          </div>
          <div className="text-xs" style={{ color: colors.textLight }}>
            Members
          </div>
        </div>

        <div
          className="rounded-xl p-4 text-center border"
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.border,
          }}
        >
          <TrendingUp
            className="mx-auto mb-2"
            size={24}
            style={{ color: colors.secondary }}
          />
          <div className="font-bold text-lg" style={{ color: colors.text }}>
            ${circle.payoutAmount}
          </div>
          <div className="text-xs" style={{ color: colors.textLight }}>
            Payout Amount
          </div>
        </div>

        <div
          className="rounded-xl p-4 text-center border"
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.border,
          }}
        >
          <Star
            className="mx-auto mb-2"
            size={24}
            style={{ color: colors.secondary }}
          />
        </div>
      </div>

      {/* Circle Description */}
      <div
        className="rounded-xl p-4 border"
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.border,
        }}
      >
        <h3 className="font-bold mb-2" style={{ color: colors.text }}>
          Description
        </h3>
        <p style={{ color: colors.textLight }}>
          {circle.rawCircle?.circleDescription || "No description provided."}
        </p>
      </div>

      {/* Key Information */}
      <div className="grid md:grid-cols-2 gap-4">
        <div
          className="rounded-xl p-4 border"
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.border,
          }}
        >
          <h3
            className="font-bold mb-3 flex items-center gap-2"
            style={{ color: colors.text }}
          >
            <Calendar size={16} style={{ color: colors.primary }} />
            Circle Timeline
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span style={{ color: colors.textLight }}>Frequency:</span>
              <span style={{ color: colors.text }}>
                {getFrequencyText(circle.frequency)}
              </span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: colors.textLight }}>Total Rounds:</span>
              <span style={{ color: colors.text }}>
                {circle.totalPositions}
              </span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: colors.textLight }}>Next Payout:</span>
              <span style={{ color: colors.text }}>{circle.nextPayout}</span>
            </div>
          </div>
        </div>

        <div
          className="rounded-xl p-4 border"
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.border,
          }}
        >
          <h3
            className="font-bold mb-3 flex items-center gap-2"
            style={{ color: colors.text }}
          >
            <Shield size={16} style={{ color: colors.primary }} />
            Security & Requirements
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span style={{ color: colors.textLight }}>
                Initial Expected Members:
              </span>
              <span style={{ color: colors.text }}>
                {circle.rawCircle?.maxMembers.toString() || "N/A"}
              </span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: colors.textLight }}>
                Collateral Locked:
              </span>
              <span style={{ color: colors.text }}>
                ${collateralLocked.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: colors.textLight }}>
                Collateral Required:
              </span>
              <span style={{ color: colors.text }}>
                ${collateralRequired.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: colors.textLight }}>
                Min Members to Start:
              </span>
              <span style={{ color: colors.text }}>{minMembersToStart}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: colors.textLight }}>Ultimatum Period:</span>
              <span style={{ color: colors.text }}>{ultimatumPeriod}</span>
            </div>
          </div>
        </div>
      </div>

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
                        {payout.user?.username ||
                          payout.user?.fullName ||
                          "Recipient: " +
                            (payout.user?.id?.slice(0, 6) || "Unknown")}
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
                    <div className="font-bold text-green-600">
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

export default CircleOverviewTab;
