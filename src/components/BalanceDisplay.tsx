import React, { useState, useEffect } from "react";
import { Wallet, Eye, EyeOff, Info } from "lucide-react";
import { useCurrency } from "../contexts/CurrencyContext";
import { useCurrencyConverter } from "../hooks/useCurrencyConverter";
import image from "../constants/image";

import { CreditScore } from "../hooks/useCreditScore";

interface BalanceDisplayProps {
  currentBalances: {
    cUSD: number;
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
    gradient: string;
  };
  creditScore?: CreditScore | null;
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

  // Total balance includes cUSD + committed in circles + committed in personal savings
  const totalBalance =
    currentBalances.cUSD + circleCommitted + personalSavingsCommitted;
  const currentCurrency = getCurrencyInfo(selectedCurrency);

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
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                >
                  <div
                    className="text-sm font-semibold mb-3"
                    style={{ color: colors.text }}
                  >
                    Balance Breakdown
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span style={{ color: colors.textLight }}>
                        cUSD Balance:
                      </span>
                      <span
                        className="font-medium"
                        style={{ color: colors.text }}
                      >
                        ${currentBalances.cUSD.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span style={{ color: colors.textLight }}>
                        Circle Collateral:
                      </span>
                      <span
                        className="font-medium"
                        style={{ color: colors.text }}
                      >
                        $
                        {(circleCollateral || 0).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span style={{ color: colors.textLight }}>
                        Circle Contributions:
                      </span>
                      <span
                        className="font-medium"
                        style={{ color: colors.text }}
                      >
                        $
                        {(circleContributions || 0).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span style={{ color: colors.textLight }}>
                        Personal Savings:
                      </span>
                      <span
                        className="font-medium"
                        style={{ color: colors.text }}
                      >
                        $
                        {personalSavingsCommitted.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div
                      className="pt-2 mt-2 border-t flex justify-between items-center"
                      style={{ borderColor: colors.border }}
                    >
                      <span
                        className="font-semibold"
                        style={{ color: colors.text }}
                      >
                        Total:
                      </span>
                      <span
                        className="font-bold"
                        style={{ color: colors.primary }}
                      >
                        $
                        {totalBalance.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <h3
            className="text-xl sm:text-3xl font-bold mb-1"
            style={{ color: colors.text }}
          >
            {showBalance ? `$${totalBalance.toLocaleString()}` : "•••••"}
          </h3>
          <p className="text-sm" style={{ color: colors.textLight }}>
            {showBalance
              ? `≈ ${currentCurrency.symbol}${convertToLocal(
                  totalBalance,
                  selectedCurrency
                )}`
              : "Hidden"}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <button
            onClick={() => setShowBalance(!showBalance)}
            className="p-2 rounded-lg transition hover:opacity-80"
            style={{ backgroundColor: colors.background }}
          >
            {showBalance ? (
              <Eye size={16} style={{ color: colors.primary }} />
            ) : (
              <EyeOff size={16} style={{ color: colors.textLight }} />
            )}
          </button>

          {creditScore && (
            <div
              className="px-1 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5 shadow-sm"
              style={{
                borderColor: creditScore.categoryColor,
                color: creditScore.categoryColor,
                backgroundColor: `${creditScore.categoryColor}10`,
              }}
            >
              <div
                className="w-1 h-1 rounded-full animate-pulse"
                style={{ backgroundColor: creditScore.categoryColor }}
              />
              Credit Score: {creditScore.score}
            </div>
          )}
        </div>
      </div>

      {/* cUSD Balance Card */}
      <div
        className="flex justify-between items-center p-4 rounded-xl border mb-6"
        style={{ backgroundColor: colors.surface, borderColor: colors.border }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center bg-white dark:bg-gray-800 border"
            style={{ borderColor: colors.border }}
          >
            <img src={image.cUSD} alt="cUSD" className="w-8 h-8 rounded" />
          </div>
          <div>
            <div className="font-semibold" style={{ color: colors.text }}>
              cUSD
            </div>
            <div className="text-xs" style={{ color: colors.textLight }}>
              Celo Dollar
            </div>
          </div>
        </div>
        <div className="text-right">
          <div
            className="font-semibold text-base sm:text-lg"
            style={{ color: colors.text }}
          >
            {showBalance ? currentBalances.cUSD.toLocaleString() : "•••"}
          </div>
          <div className="text-sm" style={{ color: colors.primary }}>
            {showBalance
              ? `≈ ${currentCurrency.symbol}${convertToLocal(
                  currentBalances.cUSD,
                  selectedCurrency
                )}`
              : ""}
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => setShowAddFundsModal(true)}
          className="flex-1 text-base sm:text-lg py-3 rounded-xl font-semibold transition shadow-sm hover:shadow-md text-white"
          style={{ background: colors.gradient }}
        >
          Add Funds
        </button>
        <button
          onClick={() => setShowWithdrawModal(true)}
          className="flex-1 text-base sm:text-lg py-3 rounded-xl font-semibold transition border hover:opacity-80"
          style={{ borderColor: colors.border, color: colors.text }}
        >
          Withdraw
        </button>
      </div>
    </div>
  );
};

export default BalanceDisplay;
