import React, { useState, useEffect } from "react";
import { Wallet, Eye, EyeOff, Info, Star } from "lucide-react";
import { useCurrency } from "../contexts/CurrencyContext";
import { useCurrencyConverter } from "../hooks/useCurrencyConverter";
import image from "../constants/image";
import { CreditScore } from "../hooks/useCreditScore";
import { Skeleton } from "./Skeleton";

interface BalanceDisplayProps {
  currentBalances: {
    USDm: number;
  };
  circleCommitted?: number;
  circleCollateral?: number;
  circleContributions?: number;
  personalSavingsCommitted?: number;
  setShowAddFundsModal: (show: boolean) => void;
  setShowWithdrawModal: (show: boolean) => void;
  colors: {
    surface: string;
    border: string;
    primary: string;
    text: string;
    textLight: string;
    background: string;
  };
  creditScore?: CreditScore | null;
  isLoading?: boolean;
}

const BalanceDisplay: React.FC<BalanceDisplayProps> = ({
  currentBalances,
  circleCommitted = 0,
  circleCollateral = 0,
  circleContributions = 0,
  personalSavingsCommitted = 0,
  setShowAddFundsModal,
  setShowWithdrawModal,
  colors,
  creditScore,
  isLoading = false,
}) => {
  // Load showBalance state from localStorage, default to true
  const [showBalance, setShowBalance] = useState(() => {
    const saved = localStorage.getItem("showBalance");
    return saved !== null ? JSON.parse(saved) : true;
  });

  // State for showing balance breakdown tooltip
  const [showTooltip, setShowTooltip] = useState(false);

  // Persist showBalance state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("showBalance", JSON.stringify(showBalance));
  }, [showBalance]);

  const { selectedCurrency } = useCurrency();
  const { convertToLocal, getCurrencyInfo } = useCurrencyConverter();

  // Total balance includes USDm + committed in circles + committed in personal savings
  const totalBalance =
    currentBalances.USDm + circleCommitted + personalSavingsCommitted;
  const currentCurrency = getCurrencyInfo(selectedCurrency);

  if (isLoading) {
    return (
      <div
        className="rounded-2xl p-6 shadow-sm border space-y-6"
        style={{ backgroundColor: colors.surface, borderColor: colors.border }}
      >
        <div className="flex justify-between items-start">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <Skeleton
                width="1.25rem"
                height="1.25rem"
                borderRadius="0.25rem"
              />
              <Skeleton width="6rem" height="1rem" />
            </div>
            <Skeleton width="10rem" height="2.5rem" />
            <Skeleton width="8rem" height="1rem" />
          </div>
          <Skeleton width="3rem" height="1.5rem" />
        </div>
        <div className="flex gap-3">
          <Skeleton height="3rem" borderRadius="0.75rem" className="flex-1" />
          <Skeleton height="3rem" borderRadius="0.75rem" className="flex-1" />
        </div>
        <div
          className="space-y-4 pt-4 border-t"
          style={{ borderColor: colors.border }}
        >
          <div className="flex items-center justify-between">
            <Skeleton width="40%" height="1.25rem" />
            <Skeleton width="20%" height="1.25rem" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <Skeleton width="30%" height="0.75rem" />
              <Skeleton width="15%" height="0.75rem" />
            </div>
            <Skeleton height="0.5rem" borderRadius="1rem" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl p-6 shadow-sm border"
      style={{ backgroundColor: colors.surface, borderColor: colors.border }}
    >
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Wallet size={20} style={{ color: colors.primary }} />
            <h2 className="font-semibold" style={{ color: colors.text }}>
              Total Balance
            </h2>
            {/* Info icon with tooltip */}
            <div className="relative">
              <button
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                onClick={() => setShowTooltip(!showTooltip)}
                className="p-1 rounded-full transition hover:opacity-80"
                style={{ color: colors.textLight }}
                aria-label="Balance breakdown"
              >
                <Info size={16} />
              </button>

              {/* Tooltip */}
              {showTooltip && (
                <div
                  className="absolute left-1/2 -translate-x-1/2 top-8 z-50 w-64 sm:w-72 p-4 rounded-xl shadow-lg border"
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  }}
                >
                  <h4
                    className="font-bold text-sm mb-2"
                    style={{ color: colors.text }}
                  >
                    Balance Breakdown
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span style={{ color: colors.textLight }}>
                        Available USDm:
                      </span>
                      <span
                        className="font-medium"
                        style={{ color: colors.text }}
                      >
                        ${currentBalances.USDm.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span style={{ color: colors.textLight }}>
                        Circle Contributions:
                      </span>
                      <span
                        className="font-medium"
                        style={{ color: colors.text }}
                      >
                        ${circleContributions.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span style={{ color: colors.textLight }}>
                        Collateral Locked:
                      </span>
                      <span
                        className="font-medium"
                        style={{ color: colors.text }}
                      >
                        ${circleCollateral.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span style={{ color: colors.textLight }}>
                        Personal Savings:
                      </span>
                      <span
                        className="font-medium"
                        style={{ color: colors.text }}
                      >
                        ${personalSavingsCommitted.toFixed(2)}
                      </span>
                    </div>
                    <div
                      className="pt-2 mt-2 border-t flex justify-between text-xs font-bold"
                      style={{ borderColor: colors.border }}
                    >
                      <span style={{ color: colors.text }}>Total:</span>
                      <span style={{ color: colors.primary }}>
                        ${totalBalance.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <p
                    className="mt-3 text-[10px] leading-relaxed"
                    style={{ color: colors.textLight }}
                  >
                    Your total balance includes funds you can spend and funds
                    locked in savings goals or circles.
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <h1
              className="text-xl sm:text-3xl font-bold"
              style={{ color: colors.text }}
            >
              {showBalance ? `$${totalBalance.toFixed(2)} USDm` : "••••••"}
            </h1>
            <button
              onClick={() => setShowBalance(!showBalance)}
              className="p-1.5 rounded-lg transition hover:bg-black/5"
              style={{ color: colors.textLight }}
              aria-label={showBalance ? "Hide balance" : "Show balance"}
            >
              {showBalance ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {/* Show Original USDm below local currency if not USD */}
          {selectedCurrency !== "USD" && (
            <p className="text-lg mt-1" style={{ color: colors.textLight }}>
              {showBalance
                ? `≈ ${currentCurrency.symbol}${convertToLocal(
                    totalBalance,
                    selectedCurrency
                  )}`
                : "••••••"}
            </p>
          )}
        </div>
        <div
          className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5"
          style={{ backgroundColor: colors.background, color: colors.primary }}
        >
          <img src={image.USDm} alt="USDm" className="w-4 h-4 rounded-full" />
          USDm
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => setShowAddFundsModal(true)}
          className="flex-1 py-3 px-4 rounded-xl font-bold text-white transition-all transform active:scale-95 shadow-md"
          style={{ background: colors.primary }}
        >
          Add Funds
        </button>
        <button
          onClick={() => setShowWithdrawModal(true)}
          className="flex-1 py-3 px-4 rounded-xl font-bold transition-all transform active:scale-95 border"
          style={{
            backgroundColor: colors.background,
            borderColor: colors.border,
            color: colors.text,
          }}
        >
          Withdraw
        </button>
      </div>

      <div
        className="mt-6 pt-6 border-t"
        style={{ borderColor: colors.border }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div
              className="w-5 h-5 rounded-md flex items-center justify-center"
              style={{ backgroundColor: colors.primary }}
            >
              <Star size={14} className="text-white fill-white" />
            </div>
            <span
              className="text-sm font-semibold"
              style={{ color: colors.text }}
            >
              Credit Score
            </span>
          </div>
          <div className="text-right">
            <span
              className="text-lg font-bold"
              style={{ color: creditScore?.categoryColor || colors.text }}
            >
              {creditScore?.score || 0}
            </span>
            <div
              className="text-[10px] font-medium"
              style={{ color: colors.textLight }}
            >
              {creditScore?.categoryLabel || "Poor"}
            </div>
          </div>
        </div>

        <div className="relative h-2 w-full bg-gray-100 rounded-full overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full transition-all duration-1000 ease-out"
            style={{
              width: `${
                (((creditScore?.score || 0) - 300) / (850 - 300)) * 100
              }%`,
              backgroundColor: creditScore?.categoryColor || colors.primary,
            }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default BalanceDisplay;
