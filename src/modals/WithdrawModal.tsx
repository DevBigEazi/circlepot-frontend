import React from "react";
import { X, ArrowRight, Wallet, CreditCard } from "lucide-react";
import { useThemeColors } from "../hooks/useThemeColors";
import { useNavigate } from "react-router";
import { useCurrency } from "../contexts/CurrencyContext";
import { useCurrencyConverter } from "../hooks/useCurrencyConverter";
import image from "../constants/image";

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WithdrawModal: React.FC<WithdrawModalProps> = ({ isOpen, onClose }) => {
  const colors = useThemeColors();
  const navigate = useNavigate();
  const { selectedCurrency } = useCurrency();
  const { getCurrencyInfo } = useCurrencyConverter();

  if (!isOpen) return null;

  const currencyInfo = getCurrencyInfo(selectedCurrency);

  const handleInternalClick = () => {
    navigate("/withdraw/internal");
    onClose();
  };

  const handleLocalClick = () => {
    navigate("/withdraw/local");
    onClose();
  };

  const handleExternalClick = () => {
    navigate("/withdraw/external");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        className="rounded-2xl p-6 max-w-md w-full shadow-2xl"
        style={{ backgroundColor: colors.surface }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold" style={{ color: colors.text }}>
            Withdraw Funds
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition hover:opacity-80"
            style={{ backgroundColor: colors.background }}
          >
            <X size={20} style={{ color: colors.text }} />
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-sm px-1" style={{ color: colors.textLight }}>
            Choose how you'd like to withdraw your funds.
          </p>

          <button
            onClick={handleInternalClick}
            className="w-full p-4 rounded-2xl border-2 border-transparent transition-all hover:border-primary/30 group flex items-center gap-4 text-left"
            style={{ backgroundColor: colors.background }}
          >
            <div className="p-2 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
              <img src={image.logo} alt="logo" className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold" style={{ color: colors.text }}>
                Internal Transfer
              </h3>
              <p className="text-xs mt-0.5" style={{ color: colors.textLight }}>
                Send to circlepot users
              </p>
            </div>
            <ArrowRight
              size={18}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: colors.primary }}
            />
          </button>

          <button
            onClick={handleLocalClick}
            className="w-full p-4 rounded-2xl border-2 border-transparent transition-all hover:border-primary/30 group flex items-center gap-4 text-left"
            style={{ backgroundColor: colors.background }}
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform border-2 border-transparent group-hover:border-primary/20">
              {currencyInfo?.flag ? (
                <img
                  src={currencyInfo.flag}
                  alt={selectedCurrency}
                  className="w-full h-full scale-125"
                />
              ) : (
                <CreditCard size={24} className="text-primary" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-bold" style={{ color: colors.text }}>
                Local Offramp
              </h3>
              <p className="text-xs mt-0.5" style={{ color: colors.textLight }}>
                Withdraw to bank or mobile money
              </p>
            </div>
            <ArrowRight
              size={18}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: colors.primary }}
            />
          </button>

          <button
            onClick={handleExternalClick}
            className="w-full p-4 rounded-2xl border-2 border-transparent transition-all hover:border-primary/30 group flex items-center gap-4 text-left"
            style={{ backgroundColor: colors.background }}
          >
            <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
              <Wallet size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold" style={{ color: colors.text }}>
                Wallet or Exchanges
              </h3>
              <p className="text-xs mt-0.5" style={{ color: colors.textLight }}>
                Transfer to external wallet
              </p>
            </div>
            <ArrowRight
              size={18}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: colors.primary }}
            />
          </button>
        </div>
      </div>
    </div>
  );
};

export default WithdrawModal;
