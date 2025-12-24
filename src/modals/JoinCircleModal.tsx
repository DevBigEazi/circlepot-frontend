import React, { useState } from "react";
import { useNavigate } from "react-router";
import {
  X,
  Users,
  DollarSign,
  CheckCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { Circle } from "../interfaces/interfaces";
import { toast } from "sonner";
import confetti from "canvas-confetti";

interface JoinCircleModalProps {
  circle: Circle | null;
  setShowJoinCircle: (show: boolean) => void;
  colors: any;
  onJoin: (circleId: bigint, collateralAmount: bigint) => Promise<void>;
  isJoining?: boolean;
}

const JoinCircleModal: React.FC<JoinCircleModalProps> = ({
  circle,
  setShowJoinCircle,
  colors,
  onJoin,
  isJoining = false,
}) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  if (!circle) return null;

  const formatCurrency = (amount: bigint) => {
    return (Number(amount) / 1e18).toFixed(2);
  };

  const minMembersToStart = Math.ceil(Number(circle.maxMembers) * 0.6);

  const getFrequencyText = (frequency: number) => {
    switch (frequency) {
      case 0:
        return "Daily";
      case 1:
        return "Weekly";
      case 2:
        return "Monthly";
      default:
        return "Unknown";
    }
  };

  const getUltimatumPeriod = (frequency: number) => {
    switch (frequency) {
      case 0:
      case 1:
        return "7 days";
      case 2:
        return "14 days";
      default:
        return "7 days";
    }
  };

  const handleJoinCircle = async () => {
    try {
      await onJoin(circle.circleId, circle.collateralAmount);

      // Show success toast
      toast.custom(
        () => (
          <div
            className="rounded-2xl p-4 shadow-lg border-2 border-green-500 flex items-center gap-3 max-w-sm"
            style={{
              backgroundColor: "#dcfce7",
              animation: "slideIn 0.3s ease-out",
            }}
          >
            <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
            <span className="text-sm font-semibold text-green-600">
              Successfully joined {circle.circleName}!
            </span>
          </div>
        ),
        {
          duration: 4000,
          position: "top-center",
        }
      );

      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      // Navigate to home
      setShowJoinCircle(false);
      navigate("/");
    } catch (error: any) {
      // Show error toast
      toast.custom(
        () => (
          <div
            className="rounded-2xl p-4 shadow-lg border-2 border-red-500 flex items-center gap-3 max-w-sm"
            style={{
              backgroundColor: "#fee2e2",
              animation: "slideIn 0.3s ease-out",
            }}
          >
            <AlertTriangle size={20} className="text-red-600 flex-shrink-0" />
            <span className="text-sm font-semibold text-red-600">
              {error?.message || "Failed to join circle"}
            </span>
          </div>
        ),
        {
          duration: 4000,
          position: "top-center",
        }
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div
        className="rounded-3xl max-w-2xl w-full shadow-2xl my-8 flex flex-col max-h-[calc(100vh-4rem)]"
        style={{ backgroundColor: colors.surface }}
      >
        <div
          className="p-4 sm:p-6 border-b shrink-0"
          style={{ borderColor: colors.border }}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: colors.primary }}
              >
                <Users className="text-white" size={24} />
              </div>
              <div>
                <h2
                  className="text-xl font-bold"
                  style={{ color: colors.text }}
                >
                  Join {circle.circleName}
                </h2>
                <p className="text-sm" style={{ color: colors.textLight }}>
                  Step {step} of 3
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowJoinCircle(false)}
              className="p-2 rounded-xl transition hover:opacity-80"
              style={{ color: colors.text }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-4 sm:p-6">
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3
                  className="text-lg font-bold mb-2"
                  style={{ color: colors.text }}
                >
                  Circle Overview
                </h3>
                <p className="text-sm" style={{ color: colors.textLight }}>
                  Review the circle details before joining
                </p>
              </div>

              <div
                className="rounded-xl p-4 border"
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                }}
              >
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <DollarSign
                      className="mx-auto mb-2"
                      size={20}
                      style={{ color: colors.primary }}
                    />
                    <div className="font-bold" style={{ color: colors.text }}>
                      ${formatCurrency(circle.contributionAmount)}
                    </div>
                    <div
                      className="text-xs"
                      style={{ color: colors.textLight }}
                    >
                      Per {getFrequencyText(circle.frequency)}
                    </div>
                  </div>
                  <div className="text-center">
                    <Users
                      className="mx-auto mb-2"
                      size={20}
                      style={{ color: colors.primary }}
                    />
                    <div className="font-bold" style={{ color: colors.text }}>
                      {circle.currentMembers.toString()}/
                      {circle.maxMembers.toString()}
                    </div>
                    <div
                      className="text-xs"
                      style={{ color: colors.textLight }}
                    >
                      Members
                    </div>
                  </div>
                </div>
                <p className="text-sm" style={{ color: colors.textLight }}>
                  {circle.circleDescription}
                </p>
              </div>

              <div
                className="rounded-xl p-4 border"
                style={{
                  backgroundColor: colors.accentBg,
                  borderColor: colors.accentBorder,
                }}
              >
                <h4
                  className="font-semibold mb-2 flex items-center gap-2"
                  style={{ color: colors.text }}
                >
                  <Clock size={16} style={{ color: colors.primary }} />
                  Circle Timeline
                </h4>
                <div
                  className="space-y-1 text-sm"
                  style={{ color: colors.textLight }}
                >
                  <div>
                    • Circle starts when {minMembersToStart} members join (60%
                    threshold)
                  </div>
                  <div>
                    • Ultimatum period: {getUltimatumPeriod(circle.frequency)}
                  </div>
                  <div>
                    • Voting can be initiated after ultimatum if 60% threshold
                    met
                  </div>
                  <div>• 51% vote required to start circle</div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3
                  className="text-lg font-bold mb-2"
                  style={{ color: colors.text }}
                >
                  Security Deposit Required
                </h3>
                <p className="text-sm" style={{ color: colors.textLight }}>
                  You need to lock collateral to join this circle
                </p>
              </div>

              <div
                className="rounded-xl p-6 border"
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                }}
              >
                <div className="text-center mb-4">
                  <div
                    className="text-3xl font-bold mb-2"
                    style={{ color: colors.primary }}
                  >
                    ${formatCurrency(circle.collateralAmount)}
                  </div>
                  <div className="text-sm" style={{ color: colors.textLight }}>
                    Total Security Deposit
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span style={{ color: colors.textLight }}>
                      Total Commitment:
                    </span>
                    <span style={{ color: colors.text }}>
                      $
                      {formatCurrency(
                        circle.contributionAmount * circle.maxMembers
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: colors.textLight }}>
                      Late Fee Buffer (1%):
                    </span>
                    <span style={{ color: colors.text }}>
                      $
                      {formatCurrency(
                        circle.collateralAmount -
                          circle.contributionAmount * circle.maxMembers
                      )}
                    </span>
                  </div>
                  <div
                    className="border-t pt-3 flex justify-between font-semibold"
                    style={{ borderColor: colors.border }}
                  >
                    <span style={{ color: colors.text }}>Total to Lock:</span>
                    <span style={{ color: colors.primary }}>
                      ${formatCurrency(circle.collateralAmount)}
                    </span>
                  </div>
                </div>
              </div>

              <div
                className="rounded-xl p-4 border"
                style={{
                  backgroundColor: colors.successBg,
                  borderColor: colors.successBorder,
                }}
              >
                <h4
                  className="font-semibold mb-2 flex items-center gap-2"
                  style={{ color: colors.text }}
                >
                  <CheckCircle size={16} style={{ color: colors.primary }} />
                  Collateral Protection
                </h4>
                <div
                  className="space-y-1 text-sm"
                  style={{ color: colors.textLight }}
                >
                  <div>• Collateral is returned after circle completion</div>
                  <div>• Late payments deduct from collateral (1% fee)</div>
                  <div>
                    • You can withdraw if circle doesn't start after ultimatum
                  </div>
                  <div>
                    • Your funds are always secure and under your control
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3
                  className="text-lg font-bold mb-2"
                  style={{ color: colors.text }}
                >
                  Terms & Conditions
                </h3>
                <p className="text-sm" style={{ color: colors.textLight }}>
                  Please review and agree to the terms
                </p>
              </div>

              <div
                className="rounded-xl p-4 border max-h-60 overflow-y-auto"
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                }}
              >
                <div
                  className="space-y-4 text-sm"
                  style={{ color: colors.textLight }}
                >
                  <div>
                    <h4
                      className="font-semibold mb-2"
                      style={{ color: colors.text }}
                    >
                      Circle Participation Agreement
                    </h4>
                    <p>By joining this circle, you agree to:</p>
                    <ul className="list-disc list-inside space-y-1 mt-2">
                      <li>
                        Contribute ${formatCurrency(circle.contributionAmount)}{" "}
                        every {getFrequencyText(circle.frequency).toLowerCase()}
                      </li>
                      <li>
                        Make contributions on time (48-hour grace period for
                        weekly/monthly)
                      </li>
                      <li>
                        Accept position assignment based on reputation score
                      </li>
                      <li>
                        Pay 1% platform fee on payouts less than $1000 and $10 fix fee for above $1000 (creators exempt)
                      </li>
                      <li>Accept 1% late fee for delayed contributions</li>
                    </ul>
                  </div>

                  <div>
                    <h4
                      className="font-semibold mb-2"
                      style={{ color: colors.text }}
                    >
                      Smart Contract Terms
                    </h4>
                    <ul className="list-disc list-inside space-y-1">
                      <li>All transactions are executed by smart contracts</li>
                      <li>
                        Circle starts when {minMembersToStart} members join (60%
                        threshold)
                      </li>
                      <li>Voting period lasts 2 days after ultimatum</li>
                      <li>51% vote required to start circle</li>
                      <li>
                        Collateral withdrawal allowed if circle doesn't start
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4
                      className="font-semibold mb-2"
                      style={{ color: colors.text }}
                    >
                      Risk Acknowledgment
                    </h4>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Circle may not start if insufficient members join</li>
                      <li>
                        Late payments result in reputation score reduction
                      </li>
                      <li>
                        Position assignment is based on reputation at circle
                        start
                      </li>
                      <li>All transactions are irreversible once confirmed</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="w-5 h-5 rounded border-2"
                  style={{ borderColor: colors.border }}
                />
                <label
                  htmlFor="terms"
                  className="text-sm"
                  style={{ color: colors.text }}
                >
                  I have read and agree to the terms and conditions
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div
          className="p-4 sm:p-6 border-t shrink-0"
          style={{ borderColor: colors.border }}
        >
          <div className="flex gap-3">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                disabled={isJoining}
                className="px-4 sm:px-6 py-3 rounded-xl font-semibold text-sm sm:text-base transition border hover:opacity-80 disabled:opacity-50"
                style={{ borderColor: colors.border, color: colors.text }}
              >
                Back
              </button>
            )}
            <button
              onClick={() =>
                step < 3 ? setStep(step + 1) : handleJoinCircle()
              }
              disabled={(step === 3 && !agreedToTerms) || isJoining}
              className="flex-1 py-3 rounded-xl font-semibold text-sm sm:text-base transition text-white shadow-sm hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
              style={
                (step < 3 || (step === 3 && agreedToTerms)) && !isJoining
                  ? { background: colors.gradient }
                  : { backgroundColor: colors.border, color: colors.textLight }
              }
            >
              {isJoining
                ? "Joining..."
                : step === 3
                ? "Join Circle & Lock Collateral"
                : "Continue"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinCircleModal;
