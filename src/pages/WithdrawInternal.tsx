import React from "react";
import { useNavigate } from "react-router";
import { User } from "lucide-react";
import { useThemeColors } from "../hooks/useThemeColors";
import NavBar from "../components/NavBar";

const WithdrawInternal: React.FC = () => {
  const navigate = useNavigate();
  const colors = useThemeColors();

  return (
    <>
      <NavBar
        variant="minimal"
        onBack={() => navigate(-1)}
        title="Withdraw Internally"
        subtitle="Send funds to another user"
        titleIcon={<User size={18} className="text-white" />}
        colors={colors}
      />

      <div
        className="min-h-screen pb-20"
        style={{ backgroundColor: colors.background }}
      >
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div
            className="p-6 rounded-2xl text-center space-y-4"
            style={{ backgroundColor: colors.surface }}
          >
            <h3 className="text-xl font-bold" style={{ color: colors.text }}>
              Internal Withdrawal
            </h3>
            <p style={{ color: colors.textLight }}>
              Implementation coming soon.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default WithdrawInternal;
