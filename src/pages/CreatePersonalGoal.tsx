import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Lock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { useThemeColors } from "../hooks/useThemeColors";
import { usePersonalGoals } from "../hooks/usePersonalGoals";
import { useYieldAPY } from "../hooks/useYieldAPY";
import { client } from "../thirdwebClient";
import NavBar from "../components/NavBar";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { USDm_ADDRESS } from "../constants/constants";
import { Info } from "lucide-react";

const CreatePersonalGoal: React.FC = () => {
  const navigate = useNavigate();
  const colors = useThemeColors();
  const {
    createPersonalGoal,
    checkVaultAddress,
    vaults,
    vaultProjects,
    isLoading: isContractLoading,
  } = usePersonalGoals(client);

  const [goalForm, setGoalForm] = useState({
    name: "",
    targetAmount: "",
    contribution: "",
    frequency: "weekly" as "daily" | "weekly" | "monthly",
    deadline: "",
  });

  const [isCreating, setIsCreating] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isYieldEnabled, setIsYieldEnabled] = useState(false);
  const [hasAcceptedRisk, setHasAcceptedRisk] = useState(false);
  const [isYieldAvailable, setIsYieldAvailable] = useState(false);
  const [isCheckingYield, setIsCheckingYield] = useState(true);
  const [step, setStep] = useState(1);

  // Deriving project name from vaultProjects
  const projectName = vaultProjects[USDm_ADDRESS.toLowerCase()];

  useEffect(() => {}, [vaultProjects, projectName]);

  // Fetch APY data when yield is available
  const {
    apy,
    isLoading: isLoadingAPY,
    lastUpdated,
  } = useYieldAPY(projectName);

  // Only set mounted to true after component fully mounts
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      checkYieldAvailability();
    }
  }, [isMounted, vaults]);

  const checkYieldAvailability = async () => {
    setIsCheckingYield(true);
    try {
      const vault = await checkVaultAddress(USDm_ADDRESS);
      setIsYieldAvailable(
        vault !== "0x0000000000000000000000000000000000000000",
      );
    } catch (err) {
      setIsYieldAvailable(false);
    } finally {
      setIsCheckingYield(false);
    }
  };

  // Validate form inputs early
  const validateForm = (): string | null => {
    if (!goalForm.name || goalForm.name.trim().length === 0) {
      return "Goal name is required";
    }

    if (goalForm.name.length > 30) {
      return "Goal name must be 30 characters or less";
    }

    if (!goalForm.targetAmount) {
      return "Target amount is required";
    }

    const targetAmount = parseFloat(goalForm.targetAmount);
    if (isNaN(targetAmount) || targetAmount < 10 || targetAmount > 50000) {
      return "Target amount must be between $10 and $50,000";
    }

    if (!goalForm.contribution) {
      return "Contribution amount is required";
    }

    const contribution = parseFloat(goalForm.contribution);
    if (isNaN(contribution) || contribution < 1) {
      return "Contribution amount must be at least $1";
    }

    return null;
  };

  // Calculate estimated completion date
  const calculateCompletionDate = () => {
    if (!goalForm.targetAmount || !goalForm.contribution || !goalForm.frequency)
      return null;

    const target = parseFloat(goalForm.targetAmount);
    const contribution = parseFloat(goalForm.contribution);

    if (target <= 0 || contribution <= 0) return null;

    const periodsNeeded = Math.ceil(target / contribution);
    const today = new Date();

    switch (goalForm.frequency) {
      case "daily":
        return new Date(today.getTime() + periodsNeeded * 24 * 60 * 60 * 1000);
      case "weekly":
        return new Date(
          today.getTime() + periodsNeeded * 7 * 24 * 60 * 60 * 1000,
        );
      case "monthly":
        return new Date(
          today.getTime() + periodsNeeded * 30 * 24 * 60 * 60 * 1000,
        );
      default:
        return null;
    }
  };

  useEffect(() => {
    const completionDate = calculateCompletionDate();
    if (completionDate) {
      const isoDate = completionDate.toISOString().split("T")[0];
      setGoalForm((prev) => ({
        ...prev,
        deadline: isoDate,
      }));
    }
  }, [goalForm.targetAmount, goalForm.contribution, goalForm.frequency]);

  const completionDate = calculateCompletionDate();
  const isReasonableGoal =
    goalForm.targetAmount &&
    goalForm.contribution &&
    parseFloat(goalForm.targetAmount) >= 10 &&
    parseFloat(goalForm.targetAmount) <= 50000 &&
    parseFloat(goalForm.contribution) >= 1;

  const validationError = validateForm();
  const isFormValid = !!(
    goalForm.name &&
    goalForm.targetAmount &&
    goalForm.contribution &&
    !isCreating &&
    !isContractLoading &&
    isMounted &&
    !validationError &&
    (!isYieldEnabled || hasAcceptedRisk)
  );

  const handleCreateGoal = async (e: React.MouseEvent<HTMLButtonElement>) => {
    // Prevent any default behavior
    e.preventDefault();
    e.stopPropagation();

    // Validate before proceeding
    const formError = validateForm();
    if (formError) {
      toast.custom(
        () => (
          <div
            className="rounded-2xl p-4 shadow-lg border-2 border-red-500 flex items-center gap-3 max-w-sm"
            style={{
              backgroundColor: "#fee2e2",
              animation: `slideIn 0.3s ease-out`,
            }}
          >
            <AlertTriangle size={20} className="text-red-600 shrink-0" />
            <span className="text-sm font-semibold text-red-600">
              {formError}
            </span>
          </div>
        ),
        {
          duration: 4000,
          position: "top-center",
        },
      );
      return;
    }

    setIsCreating(true);

    try {
      // Convert frequency to enum value (0 = Daily, 1 = Weekly, 2 = Monthly)
      const frequencyMap = { daily: 0, weekly: 1, monthly: 2 } as const;

      // Parse as regular numbers first
      const targetAmount = parseFloat(goalForm.targetAmount);
      const contribution = parseFloat(goalForm.contribution);

      // Convert amounts to wei (multiply by 10^18 for USDm)
      const targetAmountWei = BigInt(Math.floor(targetAmount * 1e18));
      const contributionAmountWei = BigInt(Math.floor(contribution * 1e18));

      // Convert deadline to Unix timestamp (seconds)
      const deadlineTimestamp = goalForm.deadline
        ? BigInt(Math.floor(new Date(goalForm.deadline).getTime() / 1000))
        : BigInt(0);

      const params = {
        name: goalForm.name,
        targetAmount: targetAmountWei,
        contributionAmount: contributionAmountWei,
        frequency: frequencyMap[goalForm.frequency],
        deadline: deadlineTimestamp,
        enableYield: isYieldEnabled,
        token: USDm_ADDRESS,
        yieldAPY:
          isYieldEnabled && apy > 0 ? BigInt(Math.floor(apy * 100)) : 0n,
      };

      await createPersonalGoal(params);

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      // Show success message
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
            <CheckCircle
              size={20}
              style={{ color: colors.primary }}
              className="shrink-0"
            />
            <div>
              <span
                className="text-sm font-bold block"
                style={{ color: colors.text }}
              >
                🎯 Goal "{goalForm.name}" created successfully!
              </span>
              <span className="text-xs" style={{ color: colors.textLight }}>
                Your savings goal is now active. Happy saving!
              </span>
            </div>
          </div>
        ),
        {
          duration: 4000,
          position: "top-center",
        },
      );

      // small delay before navigating back to goals page
      setTimeout(() => {
        navigate("/goals");
      }, 500);
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
            <AlertTriangle size={20} className="text-red-600 shrink-0" />
            <div>
              <span className="text-sm font-bold block text-red-600">
                ✖️ Failed to create your goal!
              </span>
              <span className="text-xs text-red-500">{error.message}</span>
            </div>
          </div>
        ),
        {
          duration: 4000,
          position: "top-center",
        },
      );
      setIsCreating(false);
    }
  };

  const nextStep = () => {
    if (step === 1) {
      // Validate step 1 fields
      if (!goalForm.name || goalForm.name.trim().length === 0) {
        toast.error("Please enter a goal name");
        return;
      }
      if (!goalForm.targetAmount || parseFloat(goalForm.targetAmount) < 10) {
        toast.error("Target amount must be at least $10");
        return;
      }
      if (!goalForm.contribution || parseFloat(goalForm.contribution) < 1) {
        toast.error("Contribution amount must be at least $1");
        return;
      }
      setStep(2);
    }
    window.scrollTo(0, 0);
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
    window.scrollTo(0, 0);
  };

  return (
    <>
      <NavBar
        variant="minimal"
        onBack={() => navigate(-1)}
        title="Create Personal Goal"
        subtitle="Set up savings for your dreams"
        colors={colors}
      />

      <div
        className="pb-20 min-h-screen"
        style={{ backgroundColor: colors.background }}
      >
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="space-y-6">
            {/* Step Indicator */}
            <div className="flex items-center justify-between mb-8 px-2 max-w-md mx-auto">
              {[1, 2].map((s) => (
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
                      {s === 1 ? "Info" : "Finalize"}
                    </span>
                  </div>
                  {s < 2 && (
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

            {step === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Goal Name */}
                <div
                  className="rounded-2xl p-6 border"
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  }}
                >
                  <label
                    className="block text-sm font-semibold mb-3"
                    style={{ color: colors.text }}
                  >
                    Goal Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., New Laptop, Emergency Fund, Vacation"
                    value={goalForm.name}
                    onChange={(e) =>
                      setGoalForm({
                        ...goalForm,
                        name: e.target.value.slice(0, 30),
                      })
                    }
                    disabled={isCreating || isContractLoading}
                    className="w-full px-4 py-3 border-2 rounded-xl focus:ring-2 transition disabled:opacity-50"
                    style={{
                      borderColor: colors.border,
                      backgroundColor: colors.background,
                      color: colors.text,
                    }}
                  />
                  <div
                    className="text-xs mt-2"
                    style={{ color: colors.textLight }}
                  >
                    {goalForm.name.length}/30 characters
                  </div>
                </div>

                {/* Target Amount */}
                <div
                  className="rounded-2xl p-6 border"
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  }}
                >
                  <label
                    className="block text-sm font-semibold mb-3"
                    style={{ color: colors.text }}
                  >
                    Target Amount (USDm)
                  </label>
                  <input
                    type="number"
                    placeholder="500"
                    min="10"
                    max="50000"
                    step="0.01"
                    value={goalForm.targetAmount}
                    onChange={(e) =>
                      setGoalForm({ ...goalForm, targetAmount: e.target.value })
                    }
                    disabled={isCreating || isContractLoading}
                    className="w-full px-4 py-3 border-2 rounded-xl focus:ring-2 transition disabled:opacity-50"
                    style={{
                      borderColor: colors.border,
                      backgroundColor: colors.background,
                      color: colors.text,
                    }}
                  />
                  <div
                    className="text-xs mt-2"
                    style={{ color: colors.textLight }}
                  >
                    Range: $10 - $50,000
                  </div>
                </div>

                {/* Contribution Settings */}
                <div
                  className="rounded-2xl p-6 border"
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  }}
                >
                  <h3
                    className="font-semibold mb-4"
                    style={{ color: colors.text }}
                  >
                    Contribution Settings
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        className="block text-sm font-medium mb-2"
                        style={{ color: colors.text }}
                      >
                        Amount (USDm)
                      </label>
                      <input
                        type="number"
                        placeholder="50"
                        min="1"
                        step="0.01"
                        value={goalForm.contribution}
                        onChange={(e) =>
                          setGoalForm({
                            ...goalForm,
                            contribution: e.target.value,
                          })
                        }
                        disabled={isCreating || isContractLoading}
                        className="w-full px-4 py-3 border-2 rounded-xl focus:ring-2 transition disabled:opacity-50"
                        style={{
                          borderColor: colors.border,
                          backgroundColor: colors.background,
                          color: colors.text,
                        }}
                      />
                    </div>

                    <div>
                      <label
                        className="block text-sm font-medium mb-2"
                        style={{ color: colors.text }}
                      >
                        Frequency
                      </label>
                      <select
                        value={goalForm.frequency}
                        onChange={(e) =>
                          setGoalForm({
                            ...goalForm,
                            frequency: e.target.value as
                              | "daily"
                              | "weekly"
                              | "monthly",
                          })
                        }
                        disabled={isCreating || isContractLoading}
                        className="w-full px-4 py-3 border-2 rounded-xl focus:ring-2 transition disabled:opacity-50"
                        style={{
                          borderColor: colors.border,
                          backgroundColor: colors.background,
                          color: colors.text,
                        }}
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Goal Deadline */}
                <div
                  className="rounded-2xl p-6 border"
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  }}
                >
                  <label
                    className="block text-sm font-semibold mb-3"
                    style={{ color: colors.text }}
                  >
                    Goal Deadline
                  </label>
                  <input
                    type="date"
                    value={goalForm.deadline}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) =>
                      setGoalForm({ ...goalForm, deadline: e.target.value })
                    }
                    disabled={true}
                    className="w-full px-4 py-3 border-2 rounded-xl focus:ring-2 transition disabled:opacity-50"
                    style={{
                      borderColor: colors.border,
                      backgroundColor: colors.background,
                      color: colors.text,
                    }}
                  />
                  <div
                    className="text-xs mt-2"
                    style={{ color: colors.textLight }}
                  >
                    Calculated based on the target amount, contribution amount,
                    and frequency.
                  </div>
                </div>

                {/* Continue Button */}
                <div className="pt-4">
                  <button
                    onClick={nextStep}
                    className="w-full py-4 font-bold rounded-xl transition shadow-lg text-white"
                    style={{ background: colors.primary }}
                  >
                    Continue to Finalize
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                {/* Goal Preview */}
                {isReasonableGoal && (
                  <div
                    className="rounded-2xl p-6 border"
                    style={{
                      backgroundColor: `${colors.primary}10`,
                      borderColor: colors.border,
                    }}
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp size={20} style={{ color: colors.primary }} />
                      <span
                        className="font-bold"
                        style={{ color: colors.text }}
                      >
                        Goal Preview
                      </span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span style={{ color: colors.textLight }}>
                          Estimated completion day:
                        </span>
                        <span
                          className="font-semibold"
                          style={{ color: colors.text }}
                        >
                          {completionDate
                            ? completionDate.toLocaleDateString()
                            : "Calculating..."}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: colors.textLight }}>
                          Periods needed:
                        </span>
                        <span
                          className="font-semibold"
                          style={{ color: colors.text }}
                        >
                          {Math.ceil(
                            parseFloat(goalForm.targetAmount) /
                              parseFloat(goalForm.contribution),
                          )}{" "}
                          {goalForm.frequency}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: colors.textLight }}>
                          Total contribution:
                        </span>
                        <span
                          className="font-semibold"
                          style={{ color: colors.primary }}
                        >
                          ${goalForm.contribution} / {goalForm.frequency}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Early Withdrawal Info */}
                <div
                  className="rounded-2xl p-6 border"
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Lock size={20} style={{ color: colors.secondary }} />
                    <span className="font-bold" style={{ color: colors.text }}>
                      Early Withdrawal Penalties
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    {[
                      {
                        range: "0-24% progress",
                        penalty: "1.0% penalty",
                        color: "text-red-600",
                      },
                      {
                        range: "25-49% progress",
                        penalty: "0.6% penalty",
                        color: "text-orange-600",
                      },
                      {
                        range: "50-74% progress",
                        penalty: "0.3% penalty",
                        color: "text-yellow-600",
                      },
                      {
                        range: "75-99% progress",
                        penalty: "0.1% penalty",
                        color: "text-green-600",
                      },
                      {
                        range: "100% completed",
                        penalty: "0% penalty",
                        color: "text-green-600",
                      },
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center p-2 rounded-lg"
                        style={{ backgroundColor: colors.background }}
                      >
                        <span style={{ color: colors.textLight }}>
                          {item.range}:
                        </span>
                        <span className={`font-semibold ${item.color}`}>
                          {item.penalty}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div
                    className="mt-4 p-3 rounded-lg"
                    style={{ backgroundColor: colors.warningBg }}
                  >
                    <div className="flex items-start gap-2">
                      <AlertTriangle
                        size={14}
                        style={{ color: colors.secondary }}
                        className="mt-0.5"
                      />
                      <span
                        className="text-xs"
                        style={{ color: colors.textLight }}
                      >
                        Penalties encourage commitment while maintaining
                        flexibility. Funds are never locked forever.
                      </span>
                    </div>
                  </div>
                </div>

                {/* Benefits */}
                <div
                  className="rounded-2xl p-6 border"
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle size={20} style={{ color: colors.primary }} />
                    <span className="font-bold" style={{ color: colors.text }}>
                      Goal Benefits
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { icon: "📊", text: "Visual progress tracking" },
                      {
                        icon: "⭐",
                        text: "On-chain credit score for completion",
                      },
                      { icon: "🔒", text: "Secure digital wallet" },
                    ].map((benefit, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span>{benefit.icon}</span>
                        <span
                          className="text-sm"
                          style={{ color: colors.textLight }}
                        >
                          {benefit.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Yield Option */}
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
                  <div className="flex items-center justify-between mb-4">
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
                        <p
                          className="text-xs"
                          style={{
                            color:
                              !isYieldAvailable && !isCheckingYield
                                ? colors.secondary
                                : colors.textLight,
                          }}
                        >
                          {!isYieldAvailable && !isCheckingYield
                            ? "Currently unavailable for this token"
                            : "Earn yield on your savings via money markets"}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={
                        !isYieldAvailable || isCreating || isContractLoading
                      }
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

                  {/* APY Display - shown when yield is available */}
                  {isYieldAvailable && !isCheckingYield && (
                    <div
                      className="mt-4 p-3 rounded-xl border"
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
                      {!isLoadingAPY && apy > 0 && lastUpdated > 0 && (
                        <p
                          className="text-[10px] mt-1"
                          style={{ color: colors.textLight }}
                        >
                          Updated{" "}
                          {Math.round((Date.now() - lastUpdated) / 60000)} mins
                          ago
                        </p>
                      )}
                    </div>
                  )}

                  {!isYieldAvailable && !isCheckingYield && (
                    <div
                      className="mt-4 p-3 rounded-xl border flex items-start gap-2"
                      style={{
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      }}
                    >
                      <AlertTriangle
                        size={14}
                        style={{ color: colors.secondary }}
                        className="mt-0.5 shrink-0"
                      />
                      <p
                        className="text-[11px] leading-relaxed"
                        style={{ color: colors.textLight }}
                      >
                        Yield generation is not currently availabile as
                        market-based yield strategies are added periodically.
                      </p>
                    </div>
                  )}

                  {isYieldEnabled && (
                    <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div
                        className="p-4 rounded-xl border border-dashed text-sm"
                        style={{
                          backgroundColor: `${colors.primary}05`,
                          borderColor: `${colors.primary}40`,
                          color: colors.textLight,
                        }}
                      >
                        <div className="flex items-start gap-2 mb-2">
                          <Info
                            size={16}
                            className="mt-0.5 shrink-0"
                            style={{ color: colors.primary }}
                          />
                          <p
                            className="font-medium text-xs"
                            style={{ color: colors.text }}
                          >
                            You will earn real yield on your deposits. Circlepot
                            takes a 10% share of generated yield to support the
                            platform.
                          </p>
                        </div>
                      </div>

                      <div
                        className="flex items-start gap-3 p-4 rounded-xl"
                        style={{ backgroundColor: colors.warningBg }}
                      >
                        <div className="shrink-0 mt-1">
                          <input
                            type="checkbox"
                            id="risk-agreement"
                            checked={hasAcceptedRisk}
                            onChange={(e) =>
                              setHasAcceptedRisk(e.target.checked)
                            }
                            className="h-4 w-4 rounded border-gray-300 transition focus:ring-offset-0"
                            style={{ accentColor: colors.primary }}
                          />
                        </div>
                        <label
                          htmlFor="risk-agreement"
                          className="text-xs leading-relaxed cursor-pointer"
                          style={{ color: colors.textLight }}
                        >
                          I understand that yield is generated through
                          third-party protocols and carries smart contract risk.
                          I agree to the{" "}
                          <span className="underline font-medium">
                            Yield Savings Terms
                          </span>
                          .
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                {/* Create Button */}
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
                    onClick={handleCreateGoal}
                    type="button"
                    disabled={!isFormValid}
                    className={`flex-[2] py-4 font-bold rounded-2xl transition shadow-lg flex items-center justify-center gap-2 ${
                      isFormValid
                        ? "text-white hover:shadow-xl transform hover:scale-105"
                        : "cursor-not-allowed opacity-50"
                    }`}
                    style={
                      isFormValid
                        ? { background: colors.primary }
                        : {
                            backgroundColor: colors.border,
                            color: colors.textLight,
                          }
                    }
                  >
                    {isCreating || isContractLoading ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        Creating Goal...
                      </>
                    ) : (
                      "Create Savings Goal"
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default CreatePersonalGoal;
