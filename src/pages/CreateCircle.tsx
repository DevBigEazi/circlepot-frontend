import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  Shield,
  Crown,
  Clock,
  AlertCircle,
  Loader2,
  TrendingUp,
} from "lucide-react";
import { useThemeColors } from "../hooks/useThemeColors";
import { useCircleSavings } from "../hooks/useCircleSavings";
import { client } from "../thirdwebClient";
import NavBar from "../components/NavBar";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { useBalance } from "../hooks/useBalance";
import { useYieldAPY } from "../hooks/useYieldAPY";
import { USDm_ADDRESS } from "../constants/constants";
import { Info } from "lucide-react";

const CreateCircle: React.FC = () => {
  const navigate = useNavigate();
  const colors = useThemeColors();
  const { createCircle, checkVaultAddress, vaultProjects, isLoading } =
    useCircleSavings(client);

  const { balance: balanceData } = useBalance();

  const [circleForm, setCircleForm] = useState({
    name: "",
    description: "",
    contribution: "",
    frequency: "1", // WEEKLY
    maxMembers: "5",
    visibility: "0", // PRIVATE
  });

  const [isCreating, setIsCreating] = useState(false);
  const [isYieldEnabled, setIsYieldEnabled] = useState(false);
  const [hasAcceptedRisk, setHasAcceptedRisk] = useState(false);
  const [isYieldAvailable, setIsYieldAvailable] = useState(false);
  const [isCheckingYield, setIsCheckingYield] = useState(true);
  const [step, setStep] = useState(1);

  // Deriving project name from vaultProjects
  const projectName = vaultProjects[USDm_ADDRESS.toLowerCase()];

  // Fetch APY data
  const { apy, isLoading: isLoadingAPY } = useYieldAPY(projectName);

  const checkYieldAvailability = React.useCallback(async () => {
    setIsCheckingYield(true);
    try {
      const vault = await checkVaultAddress(USDm_ADDRESS);
      setIsYieldAvailable(
        vault !== "0x0000000000000000000000000000000000000000",
      );
    } catch {
      setIsYieldAvailable(false);
    } finally {
      setIsCheckingYield(false);
    }
  }, [checkVaultAddress]);

  useEffect(() => {
    checkYieldAvailability();
  }, [vaultProjects, checkYieldAvailability]);

  // Get actual balance from blockchain
  const currentBalance = balanceData ? Number(balanceData) / 1e18 : 0;

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

    if (isYieldEnabled && !hasAcceptedRisk) {
      toast.error("Please accept the yield risk agreement");
      return;
    }

    setIsCreating(true);

    try {
      // Convert to BigInt (assuming 18 decimals for USDm)
      const contributionAmountBigInt = BigInt(
        Math.floor(contributionAmount * 1e18),
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
        enableYield: isYieldEnabled,
        token: USDm_ADDRESS,
        yieldAPY: isYieldEnabled ? BigInt(Math.floor((apy || 0) * 100)) : 0n,
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
              className="shrink-0"
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
        },
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
            <AlertCircle size={20} className="text-red-600 shrink-0" />
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
        },
      );
    } finally {
      setIsCreating(false);
    }
  };

  const nextStep = () => {
    if (step === 1) {
      if (!circleForm.name) {
        toast.error("Please enter a circle name");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!circleForm.contribution || Number(circleForm.contribution) <= 0) {
        toast.error("Please enter a valid contribution amount");
        return;
      }
      if (isYieldEnabled && !hasAcceptedRisk) {
        toast.error("Please accept the yield risk agreement to continue");
        return;
      }
      setStep(3);
    }
    window.scrollTo(0, 0);
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
    window.scrollTo(0, 0);
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
            {/* Step Indicator */}
            <div className="flex items-center justify-between mb-8 px-2 max-w-md mx-auto">
              {[1, 2, 3].map((s) => (
                <React.Fragment key={s}>
                  <div className="flex flex-col items-center gap-2">
                    <div
                      onClick={() => s < step && setStep(s)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
                        s < step ? "cursor-pointer" : "cursor-default"
                      }`}
                      style={{
                        backgroundColor:
                          s === step
                            ? colors.primary
                            : s < step
                              ? `${colors.primary}20`
                              : colors.surface,
                        color:
                          s === step
                            ? "#FFF"
                            : s < step
                              ? colors.primary
                              : colors.textLight,
                        border:
                          s === step
                            ? "none"
                            : `2px solid ${
                                s < step ? colors.primary : colors.border
                              }`,
                      }}
                    >
                      {s < step ? "✓" : s}
                    </div>
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider"
                      style={{
                        color: s === step ? colors.primary : colors.textLight,
                      }}
                    >
                      {s === 1 ? "Info" : s === 2 ? "Rules" : "Finalize"}
                    </span>
                  </div>
                  {s < 3 && (
                    <div
                      className="flex-1 h-1 mx-4 mb-6 rounded-full transition-colors duration-300"
                      style={{
                        backgroundColor:
                          s < step ? colors.primary : colors.border,
                      }}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Balance Display - Show only on final step or as a header */}
            <div
              className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                step === 3 ? "opacity-100" : "opacity-80 scale-95"
              }`}
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
                    Balance: ${currentBalance.toFixed(2)} USDm
                  </div>
                  <div className="text-sm" style={{ color: colors.textLight }}>
                    Required: ${totalRequired.toFixed(2)} USDm (collateral +
                    buffer
                    {visibilityFee > 0 ? " + visibility fee" : ""})
                  </div>
                </div>
                <div
                  className={`w-1/4 sm:px-3 sm:py-1 px-2 py-0.5 rounded-full text-xs sm:text-sm font-semibold text-center ${
                    hasSufficientBalance
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {hasSufficientBalance ? "Sufficient" : "Insufficient"}
                </div>
              </div>
            </div>

            {step === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                    className="w-full px-4 py-3 border-2 rounded-xl transition"
                    style={{ borderColor: colors.border, color: colors.text }}
                  />
                  <div
                    className="text-xs mt-1"
                    style={{ color: colors.textLight }}
                  >
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
                      setCircleForm({
                        ...circleForm,
                        description: e.target.value,
                      })
                    }
                    rows={4}
                    maxLength={160}
                    className="w-full px-4 py-3 border-2 rounded-xl transition resize-none"
                    style={{ borderColor: colors.border, color: colors.text }}
                  />
                  <div
                    className="text-xs mt-1 flex justify-end"
                    style={{ color: colors.textLight }}
                  >
                    {circleForm.description.length}/160 characters
                  </div>
                </div>

                {/* Member Slots*/}
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
                    Maximum Member Slots
                  </label>
                  <select
                    value={circleForm.maxMembers}
                    onChange={(e) =>
                      setCircleForm({
                        ...circleForm,
                        maxMembers: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border-2 rounded-xl transition"
                    style={{
                      borderColor: colors.border,
                      color: colors.text,
                    }}
                  >
                    {[
                      5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
                    ].map((num) => (
                      <option key={num} value={num.toString()}>
                        {num} members
                      </option>
                    ))}
                  </select>
                </div>

                {/* Visibility Settings*/}
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
                    Circle Visibility
                  </label>
                  <select
                    value={circleForm.visibility}
                    onChange={(e) =>
                      setCircleForm({
                        ...circleForm,
                        visibility: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border-2 rounded-xl transition"
                    style={{
                      borderColor: colors.border,
                      color: colors.text,
                    }}
                  >
                    <option value="0">Private Circle (Invite only)</option>
                    <option value="1">Public Circle (Marketplace)</option>
                  </select>
                  {circleForm.visibility === "1" && (
                    <div
                      className="text-xs mt-2 p-2 rounded-lg"
                      style={{
                        backgroundColor: `${colors.primary}10`,
                        color: colors.textLight,
                      }}
                    >
                      <Info size={14} className="inline mr-1" />
                      $0.50 USDm fee applies for public circles to prevent spam.
                    </div>
                  )}
                </div>

                <div className="pt-4">
                  <button
                    onClick={nextStep}
                    className="w-full py-4 font-bold rounded-xl transition shadow-lg text-white"
                    style={{ background: colors.primary }}
                  >
                    Continue to Rules
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                {/* Contribution & Frequency */}
                <div
                  className="rounded-xl p-6 border"
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  }}
                >
                  <h3 className="font-bold mb-4" style={{ color: colors.text }}>
                    Savings Rules
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label
                        className="block text-sm font-semibold mb-2"
                        style={{ color: colors.text }}
                      >
                        Contribution Amount (USDm) *
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
                          $
                        </span>
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
                          className="w-full pl-8 pr-4 py-3 border-2 rounded-xl transition"
                          style={{
                            borderColor: colors.border,
                            color: colors.text,
                          }}
                        />
                      </div>
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
                        Savings Frequency
                      </label>
                      <select
                        value={circleForm.frequency}
                        onChange={(e) =>
                          setCircleForm({
                            ...circleForm,
                            frequency: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border-2 rounded-xl transition"
                        style={{
                          borderColor: colors.border,
                          color: colors.text,
                        }}
                      >
                        <option value="0">Daily Contributions</option>
                        <option value="1">Weekly Contributions</option>
                        <option value="2">Monthly Contributions</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Yield Option*/}
                <div
                  className={`rounded-2xl p-6 border transition-all duration-300 ${
                    !isYieldAvailable && !isCheckingYield ? "opacity-60" : ""
                  }`}
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: isYieldEnabled
                      ? colors.primary
                      : colors.border,
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp
                        size={20}
                        style={{
                          color: isYieldEnabled
                            ? colors.primary
                            : colors.textLight,
                        }}
                      />
                      <div>
                        <span
                          className="font-bold flex items-center gap-2"
                          style={{ color: colors.text }}
                        >
                          Enable Yield Savings
                          {!isYieldAvailable && !isCheckingYield && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-500 font-medium">
                              Unavailable
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={!isYieldAvailable || isCreating || isLoading}
                      onClick={() => setIsYieldEnabled(!isYieldEnabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                        isYieldEnabled ? "" : "bg-gray-200"
                      }`}
                      style={{
                        backgroundColor: isYieldEnabled
                          ? colors.primary
                          : undefined,
                      }}
                    >
                      <span
                        className={`${
                          isYieldEnabled ? "translate-x-6" : "translate-x-1"
                        } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                      />
                    </button>
                  </div>
                  <p
                    className="text-xs mb-4"
                    style={{
                      color: colors.textLight,
                    }}
                  >
                    {!isYieldAvailable && !isCheckingYield
                      ? "Currently unavailable for this token"
                      : "Earn yield on your group payouts via money markets"}
                  </p>

                  {/* APY Display - shown when yield is available */}
                  {isYieldAvailable && !isCheckingYield && (
                    <div
                      className="p-3 rounded-xl border mb-4"
                      style={{
                        backgroundColor: `${colors.primary}08`,
                        borderColor: `${colors.primary}30`,
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <TrendingUp
                            size={16}
                            style={{ color: colors.primary }}
                          />
                          <span
                            className="text-sm font-semibold"
                            style={{ color: colors.text }}
                          >
                            {isLoadingAPY ? (
                              <span className="flex items-center gap-2">
                                <Loader2 size={12} className="animate-spin" />
                                Loading APY...
                              </span>
                            ) : apy > 0 ? (
                              `Estimated APY: ${apy.toFixed(2)}%`
                            ) : (
                              "APY data unavailable"
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {isYieldEnabled && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div
                        className="p-3 rounded-xl border border-dashed text-[11px]"
                        style={{
                          backgroundColor: `${colors.primary}05`,
                          borderColor: `${colors.primary}40`,
                          color: colors.textLight,
                        }}
                      >
                        <div className="flex items-start gap-2">
                          <Info
                            size={14}
                            className="mt-0.5 shrink-0"
                            style={{ color: colors.primary }}
                          />
                          <p style={{ color: colors.text }}>
                            Circlepot takes a 10% share of generated yield to
                            support the platform.
                          </p>
                        </div>
                      </div>

                      <div
                        className="flex items-start gap-3 p-3 rounded-xl"
                        style={{ backgroundColor: colors.warningBg }}
                      >
                        <div className="shrink-0 mt-0.5">
                          <input
                            type="checkbox"
                            id="risk-agreement"
                            checked={hasAcceptedRisk}
                            onChange={(e) =>
                              setHasAcceptedRisk(e.target.checked)
                            }
                            className="h-3.5 w-3.5 rounded border-gray-300 transition focus:ring-offset-0"
                            style={{ accentColor: colors.primary }}
                          />
                        </div>
                        <label
                          htmlFor="risk-agreement"
                          className="text-[11px] leading-snug cursor-pointer"
                          style={{ color: colors.text }}
                        >
                          I understand that yield involves protocol risks (e.g.
                          AAVE).
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={prevStep}
                    className="flex-1 py-4 font-bold rounded-xl transition border-2"
                    style={{
                      borderColor: colors.border,
                      color: colors.text,
                      backgroundColor: colors.surface,
                    }}
                  >
                    Back
                  </button>
                  <button
                    onClick={nextStep}
                    className="flex-2 py-4 font-bold rounded-xl transition shadow-lg text-white"
                    style={{ background: colors.primary }}
                  >
                    Continue to Finalize
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-6">
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
                      className="mt-3 p-3 rounded-xl border flex flex-col gap-2"
                      style={{
                        backgroundColor: `${colors.errorBg}50`,
                        borderColor: colors.errorBorder,
                      }}
                    >
                      <div className="flex items-start gap-2">
                        <AlertCircle
                          size={14}
                          className="mt-0.5"
                          style={{ color: colors.primary }}
                        />
                        <p
                          className="text-[11px] leading-tight"
                          style={{ color: colors.text }}
                        >
                          If the circle doesn't reach {ultimatum.minMembers}{" "}
                          members within {ultimatum.days} days, a{" "}
                          <strong>${deadFee.toFixed(2)}</strong> fee applies.
                          Members can then withdraw their collateral.
                        </p>
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
                      <span
                        className="text-sm"
                        style={{ color: colors.textLight }}
                      >
                        Collateral is returned after successful circle
                        completion
                      </span>
                    </div>
                  </div>
                </div>

                {/* Perks & Fees combined */}
                <div
                  className="rounded-2xl p-6 border"
                  style={{
                    backgroundColor: colors.infoBg,
                    borderColor: colors.border,
                  }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Crown style={{ color: colors.primary }} size={20} />
                    <span
                      className="font-semibold text-lg"
                      style={{ color: colors.text }}
                    >
                      Perks & Disclosures
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                          Creator Perks
                        </span>
                        <ul
                          className="text-xs space-y-1"
                          style={{ color: colors.text }}
                        >
                          <li className="flex items-center gap-2">
                            <div
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: colors.primary }}
                            ></div>
                            Always 1st payout position
                          </li>
                          <li className="flex items-center gap-2">
                            <div
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: colors.primary }}
                            ></div>
                            0% platform fees for you
                          </li>
                        </ul>
                      </div>
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                          Platform Fees
                        </span>
                        <div
                          className="text-xs space-y-1"
                          style={{ color: colors.text }}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <span>Members Payout:</span>
                            <span className="font-semibold text-right">
                              1% fee (capped at $10 max)
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Listing Fee:</span>
                            <span
                              className={`font-semibold ${
                                circleForm.visibility === "1"
                                  ? ""
                                  : "text-green-600"
                              }`}
                            >
                              {circleForm.visibility === "1"
                                ? "$0.50 listing fee"
                                : "Free (Private)"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 mt-8">
                    <button
                      onClick={prevStep}
                      className="flex-1 py-4 font-bold rounded-xl transition border-2"
                      style={{
                        borderColor: colors.border,
                        color: colors.text,
                        backgroundColor: colors.surface,
                      }}
                    >
                      Back
                    </button>
                    <button
                      onClick={handleCreateCircle}
                      disabled={
                        !hasSufficientBalance ||
                        !circleForm.name ||
                        !circleForm.contribution ||
                        (isYieldEnabled && !hasAcceptedRisk) ||
                        isCreating ||
                        isLoading
                      }
                      className={`flex-2 py-4 font-bold rounded-xl transition shadow-lg flex items-center justify-center gap-2 ${
                        hasSufficientBalance &&
                        circleForm.name &&
                        circleForm.contribution &&
                        !(isYieldEnabled && !hasAcceptedRisk) &&
                        !isCreating &&
                        !isLoading
                          ? "text-white hover:shadow-xl"
                          : "cursor-not-allowed"
                      }`}
                      style={
                        hasSufficientBalance &&
                        circleForm.name &&
                        circleForm.contribution &&
                        !(isYieldEnabled && !hasAcceptedRisk) &&
                        !isCreating &&
                        !isLoading
                          ? { background: colors.primary }
                          : {
                              backgroundColor: colors.border,
                              color: colors.textLight,
                            }
                      }
                    >
                      {isCreating || isLoading ? (
                        <>
                          <Loader2 size={20} className="animate-spin" />
                          Creating...
                        </>
                      ) : !hasSufficientBalance ? (
                        "Insufficient Balance"
                      ) : isYieldEnabled && !hasAcceptedRisk ? (
                        "Accept Yield Risk"
                      ) : (
                        "Create Circle"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default CreateCircle;
