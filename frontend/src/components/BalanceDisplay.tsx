import React, { useState } from "react";
import { Wallet, Eye, EyeOff } from "lucide-react";
import { useCurrency } from "../contexts/CurrencyContext";
import { useCurrencyConverter } from "../hooks/useCurrencyConverter";
import image from "../constants/image";

interface BalanceDisplayProps {
  currentBalances: {
    cUSD: number;
  };
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
}

const BalanceDisplay: React.FC<BalanceDisplayProps> = ({
  currentBalances,
  setShowAddFundsModal,
  setShowWithdrawModal,
  colors,
}) => {
  const [showBalance, setShowBalance] = useState(true);
  const { selectedCurrency } = useCurrency();
  const { convertToLocal, getCurrencyInfo } = useCurrencyConverter();

  const totalBalance = currentBalances.cUSD;
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
          </div>
          <h3
            className="text-3xl font-bold mb-1"
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
          <div className="font-semibold text-lg" style={{ color: colors.text }}>
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
          className="flex-1 py-3 rounded-xl font-semibold transition shadow-sm hover:shadow-md text-white"
          style={{ background: colors.gradient }}
        >
          Add Funds
        </button>
        <button
          onClick={() => setShowWithdrawModal(true)}
          className="flex-1 py-3 rounded-xl font-semibold transition border hover:opacity-80"
          style={{ borderColor: colors.border, color: colors.text }}
        >
          Withdraw
        </button>
      </div>
    </div>
  );
};

export default BalanceDisplay;
