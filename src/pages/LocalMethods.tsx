import React from "react";
import { useNavigate } from "react-router";
import { CreditCard } from "lucide-react";
import { useThemeColors } from "../hooks/useThemeColors";
import { useCurrency } from "../contexts/CurrencyContext";
import { useCurrencyConverter } from "../hooks/useCurrencyConverter";
import NavBar from "../components/NavBar";

const LocalMethods: React.FC = () => {
  const navigate = useNavigate();
  const colors = useThemeColors();
  const { selectedCurrency } = useCurrency();
  const { getCurrencyInfo } = useCurrencyConverter();

  const currencyInfo = getCurrencyInfo(selectedCurrency);

  return (
    <>
      <NavBar
        variant="minimal"
        onBack={() => navigate(-1)}
        title="Local Methods"
        subtitle="Choose your preferred local payment provider"
        titleIcon={
          <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white shadow-sm flex items-center justify-center">
            {currencyInfo?.flag ? (
              <img
                src={currencyInfo.flag}
                alt={selectedCurrency}
                className="w-full h-full object-cover scale-150"
              />
            ) : (
              <CreditCard size={18} className="text-white" />
            )}
          </div>
        }
        colors={colors}
      />

      <div
        className="min-h-screen pb-20"
        style={{ backgroundColor: colors.background }}
      >
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="space-y-6">
            <p className="text-sm px-1" style={{ color: colors.textLight }}>
              We're currently expanding our local payment options to provide you
              with more ways to top up your balance.
            </p>

            <div
              className="p-10 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center text-center space-y-4"
              style={{
                borderColor: colors.border,
                backgroundColor: colors.surface,
              }}
            >
              <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center overflow-hidden border-2 border-gray-100">
                {currencyInfo?.flag ? (
                  <img
                    src={currencyInfo.flag}
                    alt={selectedCurrency}
                    className="w-full h-full object-cover grayscale opacity-30 scale-110"
                  />
                ) : (
                  <CreditCard size={40} className="text-gray-300" />
                )}
              </div>
              <div className="space-y-2">
                <h3
                  className="text-xl font-bold"
                  style={{ color: colors.text }}
                >
                  Coming Soon!
                </h3>
                <p
                  className="max-w-xs mx-auto text-sm"
                  style={{ color: colors.textLight }}
                >
                  We're working hard to integrate local payment methods for{" "}
                  <span className="font-bold" style={{ color: colors.primary }}>
                    {currencyInfo?.name || selectedCurrency}
                  </span>
                  . Stay tuned!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LocalMethods;
