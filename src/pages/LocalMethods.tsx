import React from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, CreditCard } from "lucide-react";
import { useThemeColors } from "../hooks/useThemeColors";

const LocalMethods: React.FC = () => {
  const navigate = useNavigate();
  const colors = useThemeColors();

  return (
    <div
      className="min-h-screen pb-20"
      style={{ backgroundColor: colors.background }}
    >
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 mb-6 transition hover:opacity-70"
          style={{ color: colors.text }}
        >
          <ArrowLeft size={20} />
          <span className="font-semibold">Back</span>
        </button>

        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-2xl bg-primary/10 text-primary">
            <CreditCard size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-bold" style={{ color: colors.text }}>
              Local Methods
            </h1>
            <p style={{ color: colors.textLight }}>
              Choose your preferred local payment provider
            </p>
          </div>
        </div>

        <div
          className="p-8 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center text-center space-y-4"
          style={{
            borderColor: colors.border,
            backgroundColor: colors.surface,
          }}
        >
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
            <CreditCard size={32} className="text-gray-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold" style={{ color: colors.text }}>
              Coming Soon
            </h3>
            <p className="max-w-xs mx-auto" style={{ color: colors.textLight }}>
              We're working on integrating local payment methods. Stay tuned!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocalMethods;
