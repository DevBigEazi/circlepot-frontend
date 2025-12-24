import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  Shield,
  Crown,
  Clock,
  DollarSign,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useThemeColors } from "../hooks/useThemeColors";
import { useCircleSavings } from "../hooks/useCircleSavings";
import { client } from "../thirdwebClient";
import NavBar from "../components/NavBar";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { useActiveAccount, useReadContract } from "thirdweb/react";
import { getContract } from "thirdweb";
import { defineChain } from "thirdweb/chains";
import { CUSD_ABI } from "../abis/Cusd";
import { formatBalance } from "../utils/helpers";
import { CUSD_ADDRESS, CHAIN_ID } from "../constants/constants";

const CreateCircle: React.FC = () => {
  const navigate = useNavigate();
  const colors = useThemeColors();
  const { createCircle, isLoading } = useCircleSavings(client);
  const account = useActiveAccount();

  const chain = useMemo(() => defineChain(CHAIN_ID), []);
  const cusdContract = useMemo(
    () =>
      getContract({
        client,
        chain,
        address: CUSD_ADDRESS,
        abi: CUSD_ABI,
      }),
    [chain]
  );

  const { data: balanceData } = useReadContract({
    contract: cusdContract,
    method: "balanceOf",
    params: [account?.address || "0x0000000000000000000000000000000000000000"],
  });

  const [circleForm, setCircleForm] = useState({
    name: "",
    description: "",
    contribution: "",
    frequency: "1", // WEEKLY
    maxMembers: "5",
    visibility: "0", // PRIVATE
  });

  const [isCreating, setIsCreating] = useState(false);

  // Get actual balance from blockchain
  const currentBalance = balanceData ? formatBalance(balanceData) : 0;

  const contributionAmount = parseFloat(circleForm.contribution) || 0;
  const maxMembers = parseInt(circleForm.maxMembers);
  const totalCommitment = contributionAmount * maxMembers;
  const lateBuffer = totalCommitment * 0.01; // 1% late fee buffer
  const totalToLock = totalCommitment + lateBuffer;

  const visibilityFee = circleForm.visibility === "1" ? 0.5 : 0;
  const deadFee = circleForm.visibility === "1" ? 0.5 : 1.0;
  const totalRequired = totalToLock + visibilityFee;
  const hasSufficientBalance = currentBalance >= totalRequired;

  // Calculate ultimatum period based on frequency
  const getUltimatumPeriod = (frequency: string) => {
    switch (frequency) {
      case "0": // DAILY
        return { days: 7, minMembers: Math.ceil(maxMembers * 0.6) };
      case "1": // WEEKLY
        return { days: 7, minMembers: Math.ceil(maxMembers * 0.6) };
      case "2": // MONTHLY
        return { days: 14, minMembers: Math.ceil(maxMembers * 0.6) };
      default:
        return { days: 7, minMembers: Math.ceil(maxMembers * 0.6) };
    }
  };

  const handleCreateCircle = async () => {
    if (!hasSufficientBalance || !circleForm.name || !circleForm.contribution) {
      return;
    }

    setIsCreating(true);

    try {
      // Convert to BigInt (assuming 18 decimals for cUSD)
      const contributionAmountBigInt = BigInt(
        Math.floor(contributionAmount * 1e18)
      );
      const maxMembersBigInt = BigInt(maxMembers);
      const frequencyEnum = parseInt(circleForm.frequency) as 0 | 1 | 2;
      const visibilityEnum = parseInt(circleForm.visibility) as 0 | 1;

      const params = {
        title: circleForm.name,
        description: circleForm.description || "No description provided",
        contributionAmount: contributionAmountBigInt,
        frequency: frequencyEnum,
        maxMembers: maxMembersBigInt,
        visibility: visibilityEnum,
      };

      await createCircle(params);

      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      toast.custom(
        () => (
          <div
            className="rounded-2xl p-4 shadow-lg border-2 flex items-center gap-3 max-w-sm mt-20"
            style={{
              backgroundColor: `${colors.primary}75`,
              borderColor: colors.primary,
              animation: `slideIn 0.3s ease-out`,
            }}
          >
            <Crown
              size={20}
              style={{ color: colors.primary }}
              className="flex-shrink-0"
            />
            <div>
              <span
                className="text-sm font-bold block"
                style={{ color: colors.text }}
              >
                🎉 Circle "{circleForm.name}" created successfully!
              </span>
              <span className="text-xs" style={{ color: colors.textLight }}>
                Your savings circle is now live and ready for members.
              </span>
            </div>
          </div>
        ),
        {
          duration: 4000,
          position: "top-center",
        }
      );

      // Navigate to dashboard after a short delay
      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (err) {
      const error = err as Error;

      // Show error message
      toast.custom(
        () => (
          <div
            className="rounded-2xl p-4 shadow-lg border-2 border-red-500 flex items-center gap-3 max-w-sm mt-20"
            style={{
              backgroundColor: "#fee2e2",
              animation: `slideIn 0.3s ease-out`,
            }}
          >
            <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
            <div>
              <span className="text-sm font-bold block text-red-600">
                ✖️ Failed to create circle!
              </span>
              <span className="text-xs text-red-500">
                {error.message || "An unexpected error occurred"}
              </span>
            </div>
          </div>
        ),
        {
          duration: 4000,
          position: "top-center",
        }
      );
    } finally {
      setIsCreating(false);
    }
  };

  const ultimatum = getUltimatumPeriod(circleForm.frequency);

  return (
    <>
      <NavBar
        variant="minimal"
        onBack={() => navigate(-1)}
        title="Create Savings Circle"
        colors={colors}
      />

      <div
        className="min-h-screen pb-20"
        style={{ backgroundColor: colors.background }}
      >
        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="space-y-6">
            {/* Balance Display */}
            <div
              className="p-4 rounded-xl border-2"
              style={{
                backgroundColor: hasSufficientBalance
                  ? colors.successBg
                  : colors.errorBg,
                borderColor: hasSufficientBalance
                  ? colors.successBorder
                  : colors.errorBorder,
              }}
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold" style={{ color: colors.text }}>
                    Balance: ${currentBalance.toFixed(2)} cUSD
                  </div>
                  <div className="text-sm" style={{ color: colors.textLight }}>
                    Required: ${totalRequired.toFixed(2)} cUSD (collateral +
                    buffer
                    {visibilityFee > 0 ? " + visibility fee" : ""})
                  </div>
                </div>
                <div
                  className={`w-1/4 sm:px-3 sm:py-1 px-2 py-0.5 rounded-full text-xs sm:text-sm font-semibold ${
                    hasSufficientBalance
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {hasSufficientBalance
                    ? "Sufficient Balance"
                    : "Insufficient Balance"}
                </div>
              </div>
              {!hasSufficientBalance && (
                <div
                  className="mt-2 text-sm"
                  style={{ color: colors.textLight }}
                >
                  You need ${(totalRequired - currentBalance).toFixed(2)} more
                  cUSD to create this circle
                </div>
              )}
            </div>

            {/* Circle Name */}
            <div
              className="rounded-xl p-6 border"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }}
            >
              <label
                className="block text-sm font-semibold mb-2"
                style={{ color: colors.text }}
              >
                Circle Name *
              </label>
              <input
                type="text"
                placeholder="e.g., Tech Founders Circle"
                value={circleForm.name}
                onChange={(e) =>
                  setCircleForm({ ...circleForm, name: e.target.value })
                }
                maxLength={32}
                className="w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                style={{ borderColor: colors.border, color: colors.text }}
              />
              <div className="text-xs mt-1" style={{ color: colors.textLight }}>
                Maximum 32 characters
              </div>
            </div>

            {/* Description (Optional) */}
            <div
              className="rounded-xl p-6 border"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }}
            >
              <label
                className="block text-sm font-semibold mb-2"
                style={{ color: colors.text }}
              >
                Description (Optional)
              </label>
              <textarea
                placeholder="Add a description for your circle..."
                value={circleForm.description}
                onChange={(e) =>
                  setCircleForm({ ...circleForm, description: e.target.value })
                }
                rows={3}
                className="w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition resize-none"
                style={{ borderColor: colors.border, color: colors.text }}
              />
            </div>

            {/* Contribution & Frequency */}
            <div
              className="rounded-xl p-6 border"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    className="block text-sm font-semibold mb-2"
                    style={{ color: colors.text }}
                  >
                    Contribution Amount (cUSD) *
                  </label>
                  <input
                    type="number"
                    placeholder="50"
                    min="1"
                    max="5000"
                    step="0.01"
                    value={circleForm.contribution}
                    onChange={(e) =>
                      setCircleForm({
                        ...circleForm,
                        contribution: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                    style={{ borderColor: colors.border, color: colors.text }}
                  />
                  <div
                    className="text-xs mt-1"
                    style={{ color: colors.textLight }}
                  >
                    Range: $1 - $5,000 per period
                  </div>
                </div>

                <div>
                  <label
                    className="block text-sm font-semibold mb-2"
                    style={{ color: colors.text }}
                  >
                    Frequency
                  </label>
                  <select
                    value={circleForm.frequency}
                    onChange={(e) =>
                      setCircleForm({
                        ...circleForm,
                        frequency: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                    style={{ borderColor: colors.border, color: colors.text }}
                  >
                    <option value="0">Daily</option>
                    <option value="1">Weekly</option>
                    <option value="2">Monthly</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Members & Visibility */}
            <div
              className="rounded-xl p-6 border"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    className="block text-sm font-semibold mb-2"
                    style={{ color: colors.text }}
                  >
                    Max Members
                  </label>
                  <select
                    value={circleForm.maxMembers}
                    onChange={(e) =>
                      setCircleForm({
                        ...circleForm,
                        maxMembers: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                    style={{ borderColor: colors.border, color: colors.text }}
                  >
                    <option value="5">5 members</option>
                    <option value="6">6 members</option>
                    <option value="7">7 members</option>
                    <option value="8">8 members</option>
                    <option value="9">9 members</option>
                    <option value="10">10 members</option>
                    <option value="11">11 members</option>
                    <option value="12">12 members</option>
                    <option value="13">13 members</option>
                    <option value="14">14 members</option>
                    <option value="15">15 members</option>
                    <option value="16">16 members</option>
                    <option value="17">17 members</option>
                    <option value="18">18 members</option>
                    <option value="19">19 members</option>
                    <option value="20">20 members</option>
                  </select>
                </div>

                <div>
                  <label
                    className="block text-sm font-semibold mb-2"
                    style={{ color: colors.text }}
                  >
                    Visibility
                  </label>
                  <select
                    value={circleForm.visibility}
                    onChange={(e) =>
                      setCircleForm({
                        ...circleForm,
                        visibility: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                    style={{ borderColor: colors.border, color: colors.text }}
                  >
                    <option value="0">Private (Default)</option>
                    <option value="1">Public</option>
                  </select>
                  {circleForm.visibility === "1" && (
                    <div
                      className="text-xs mt-1 flex items-center gap-1"
                      style={{ color: colors.textLight }}
                    >
                      <span>$0.50 cUSD fee for public circle</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Ultimatum System */}
            <div
              className="rounded-2xl p-6 border"
              style={{
                backgroundColor: colors.accentBg,
                borderColor: colors.accentBorder,
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <Clock style={{ color: colors.primary }} size={24} />
                <h4
                  className="font-bold text-lg"
                  style={{ color: colors.text }}
                >
                  Circle Start Ultimatum
                </h4>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: colors.textLight }}>
                    Ultimatum Period
                  </span>
                  <span
                    className="font-semibold"
                    style={{ color: colors.text }}
                  >
                    {ultimatum.days} days
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: colors.textLight }}>
                    Minimum Members to Start
                  </span>
                  <span
                    className="font-semibold"
                    style={{ color: colors.text }}
                  >
                    {ultimatum.minMembers} members (60%)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: colors.textLight }}>
                    Auto-start Trigger
                  </span>
                  <span
                    className="font-semibold"
                    style={{ color: colors.text }}
                  >
                    After {ultimatum.days} days if 60% joined
                  </span>
                </div>
                <div
                  className="mt-3 p-3 rounded-lg"
                  style={{ backgroundColor: colors.warningBg }}
                >
                  <div className="flex items-center gap-2">
                    <AlertCircle size={16} style={{ color: colors.primary }} />
                    <span
                      className="text-sm font-semibold"
                      style={{ color: colors.text }}
                    >Members can withdraw collateral if circle doesn't start</span>
                  </div>
                </div>
                <div
                  className="mt-2 p-3 rounded-lg border"
                  style={{
                    backgroundColor: colors.errorBg,
                    borderColor: colors.errorBorder,
                  }}
                >
                  <div className="flex items-center gap-2">
                    <AlertCircle size={16} className="text-red-600" />
                    <span className="text-sm font-semibold text-red-600">
                      If circle fails to start, you pay a ${deadFee.toFixed(2)}{" "}
                      fee
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Deposit Requirements */}
            <div
              className="rounded-2xl p-6 border"
              style={{
                backgroundColor: colors.successBg,
                borderColor: colors.successBorder,
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <Shield style={{ color: colors.primary }} size={24} />
                <h4
                  className="font-bold text-lg"
                  style={{ color: colors.text }}
                >
                  Security Deposit Required
                </h4>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: colors.textLight }}>
                    Total Commitment
                  </span>
                  <span
                    className="font-semibold"
                    style={{ color: colors.text }}
                  >
                    ${totalCommitment.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: colors.textLight }}>
                    Late Fee Buffer (1%)
                  </span>
                  <span
                    className="font-semibold"
                    style={{ color: colors.text }}
                  >
                    ${lateBuffer.toFixed(2)}
                  </span>
                </div>
                {visibilityFee > 0 && (
                  <div className="flex justify-between">
                    <span style={{ color: colors.textLight }}>
                      Visibility Fee
                    </span>
                    <span
                      className="font-semibold"
                      style={{ color: colors.text }}
                    >
                      ${visibilityFee.toFixed(2)}
                    </span>
                  </div>
                )}
                <div
                  className="border-t pt-3 flex justify-between"
                  style={{ borderColor: colors.border }}
                >
                  <span
                    className="font-bold text-lg"
                    style={{ color: colors.text }}
                  >
                    Total to Lock
                  </span>
                  <span
                    className="font-bold text-xl"
                    style={{ color: colors.primary }}
                  >
                    ${totalRequired.toFixed(2)}
                  </span>
                </div>
              </div>
              <div
                className="mt-4 p-3 rounded-lg"
                style={{ backgroundColor: colors.infoBg }}
              >
                <div className="flex items-center gap-2">
                  <Shield size={16} style={{ color: colors.primary }} />
                  <span className="text-sm" style={{ color: colors.textLight }}>
                    Collateral is returned after successful circle completion
                  </span>
                </div>
              </div>
            </div>

            {/* Creator Benefits */}
            <div
              className="rounded-2xl p-6 border"
              style={{
                backgroundColor: colors.warningBg,
                borderColor: colors.warningBorder,
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <Crown style={{ color: colors.primary }} size={20} />
                <span
                  className="font-semibold text-lg"
                  style={{ color: colors.text }}
                >
                  Creator Benefits
                </span>
              </div>
              <ul
                className="text-sm space-y-2"
                style={{ color: colors.textLight }}
              >
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  Always receive first payout position
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  0% platform fees (members pay 1% for up to $1000 payout and
                  $10 fix fee for above $1000)
                </li>
              </ul>
            </div>

            {/* Platform Fees */}
            <div
              className="rounded-2xl p-6 border"
              style={{
                backgroundColor: colors.infoBg,
                borderColor: colors.border,
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <DollarSign style={{ color: colors.textLight }} size={20} />
                <span
                  className="font-semibold text-lg"
                  style={{ color: colors.text }}
                >
                  Platform Fees
                </span>
              </div>
              <div
                className="text-sm space-y-3"
                style={{ color: colors.textLight }}
              >
                <div className="flex justify-between">
                  <span>Creator payouts:</span>
                  <span className="font-semibold text-green-600">0%</span>
                </div>
                <div className="flex justify-between">
                  <span>Member payouts:</span>
                  <span className="font-semibold">
                    1% for up to $1000 payout and $10 fix fee for above $1000
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Visibility changes:</span>
                  <span className="font-semibold">$0.50 cUSD (if public)</span>
                </div>
                <div className="flex justify-between">
                  <span>Creation fees:</span>
                  <span className="font-semibold text-green-600">
                    $0 (Free)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Dead Circle Fee:</span>
                  <span className="font-semibold text-red-600">
                    ${deadFee.toFixed(2)} (if failed)
                  </span>
                </div>
              </div>

              {/* Create Button */}
              <div className="mt-8">
                <button
                  onClick={handleCreateCircle}
                  disabled={
                    !hasSufficientBalance ||
                    !circleForm.name ||
                    !circleForm.contribution ||
                    isCreating ||
                    isLoading
                  }
                  className={`w-full py-4 font-bold rounded-xl transition shadow-lg hover:shadow-xl flex items-center justify-center gap-2 ${
                    hasSufficientBalance &&
                    circleForm.name &&
                    circleForm.contribution &&
                    !isCreating
                      ? "text-white hover:shadow-xl"
                      : "cursor-not-allowed"
                  }`}
                  style={
                    hasSufficientBalance &&
                    circleForm.name &&
                    circleForm.contribution &&
                    !isCreating
                      ? { background: colors.gradient }
                      : {
                          backgroundColor: colors.border,
                          color: colors.textLight,
                        }
                  }
                >
                  {isCreating || isLoading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Creating Circle...
                    </>
                  ) : hasSufficientBalance &&
                    circleForm.name &&
                    circleForm.contribution ? (
                    "Create Circle & Lock Collateral"
                  ) : !circleForm.name ? (
                    "Enter Circle Name"
                  ) : !circleForm.contribution ? (
                    "Enter Contribution Amount"
                  ) : (
                    "Insufficient Balance"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreateCircle;
