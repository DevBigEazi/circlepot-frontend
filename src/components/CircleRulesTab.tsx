import React from "react";
import { AlertCircle, TrendingUp } from "lucide-react";
import { ActiveCircle } from "../interfaces/interfaces";
import { getFrequencyText } from "../utils/helpers";

interface CircleRulesTabProps {
  circle: ActiveCircle;
  colors: any;
  minMembersToStart: number;
  ultimatumPeriod: string;
}

const CircleRulesTab: React.FC<CircleRulesTabProps> = ({
  circle,
  colors,
  minMembersToStart,
  ultimatumPeriod,
}) => {
  return (
    <div className="space-y-6">
      <div
        className="rounded-xl p-6 border"
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.border,
        }}
      >
        <h3
          className="font-bold text-lg mb-4 flex items-center gap-2"
          style={{ color: colors.text }}
        >
          <AlertCircle size={20} style={{ color: colors.primary }} />
          Circle Rules & Guidelines
        </h3>

        <div className="space-y-4">
          <div
            className="border-l-4 pl-4"
            style={{ borderColor: colors.primary }}
          >
            <h4 className="font-semibold mb-2" style={{ color: colors.text }}>
              Contribution Rules
            </h4>
            <ul
              className="text-sm space-y-1"
              style={{ color: colors.textLight }}
            >
              <li>
                • Each member contributes ${circle.contribution} every{" "}
                {getFrequencyText(circle.frequency).toLowerCase()}
              </li>
              <li>
                • Contributions are due by the deadline (48-hour grace period
                for weekly/monthly)
              </li>
              <li>• Late payments incur a 1% fee deducted from collateral</li>
              <li>• All contributions are automated and gasless</li>
            </ul>
          </div>

          <div
            className="border-l-4 pl-4"
            style={{ borderColor: colors.secondary }}
          >
            <h4 className="font-semibold mb-2" style={{ color: colors.text }}>
              Payout System
            </h4>
            <ul
              className="text-sm space-y-1"
              style={{ color: colors.textLight }}
            >
              <li>• Positions are assigned based on your credit score</li>
              <li>• Circle creator always gets position #1</li>
              <li>
                • Other positions assigned by credit score (higher = better
                position)
              </li>
              {circle.status !== "dead" && (
                <li>• Payout amount: ${circle.payoutAmount} per round</li>
              )}
              <li>
                • Platform fee: 1% for up to $1000 payout, and $10 fix fee for
                above $1000 (creators pay 0%)
              </li>
            </ul>
          </div>

          <div
            className="border-l-4 pl-4"
            style={{ borderColor: colors.accent }}
          >
            <h4 className="font-semibold mb-2" style={{ color: colors.text }}>
              Circle Start Process
            </h4>
            <ul
              className="text-sm space-y-1"
              style={{ color: colors.textLight }}
            >
              <li>
                • Circle starts when {minMembersToStart} members join (60%
                threshold)
              </li>
              <li>
                • After ultimatum period ({ultimatumPeriod}), voting can be
                initiated
              </li>
              <li>
                • If 51% vote to start, circle begins; otherwise members can
                withdraw
              </li>
              <li>• Collateral is returned after circle completion</li>
            </ul>
          </div>

          {circle.isYieldEnabled && (
            <div
              className="border-l-4 pl-4"
              style={{ borderColor: colors.primary }}
            >
              <h4
                className="font-semibold mb-2 flex items-center gap-2"
                style={{ color: colors.text }}
              >
                <TrendingUp size={16} />
                Yield & Performance Rewards
              </h4>
              <ul
                className="text-sm space-y-1"
                style={{ color: colors.textLight }}
              >
                <li>
                  • Collateral is invested in decentralized finance (DeFi) to
                  earn yield
                </li>
                <li>
                  • Late fees contribute to the community reward pool instead of
                  the platform
                </li>
                <li>• Rewards are distributed only at the end of the circle</li>
                <li>
                  • Distribution is based on Performance Points (earned for
                  on-time payments)
                </li>
                <li>
                  • High performers earn a larger share of the total yield and
                  late fee pool
                </li>
                <li>• Platform takes a 10% share of generated yield only</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CircleRulesTab;
