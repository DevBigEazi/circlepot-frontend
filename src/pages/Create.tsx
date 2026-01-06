import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router";
import { Target, Users, Handshake } from "lucide-react";
import { useThemeColors } from "../hooks/useThemeColors";
import NavBar from "../components/NavBar";
import QuickAction from "../components/QuickAction";

const Create: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const colors = useThemeColors();

  // Determine if we're on a sub-route
  const isSubRoute =
    location.pathname !== "/create" && location.pathname.startsWith("/create");
  const [showCreateOptions, setShowCreateOptions] = useState(!isSubRoute);

  // Update state when route changes
  useEffect(() => {
    setShowCreateOptions(!isSubRoute);
  }, [isSubRoute]);

  const handleNavigatePersonalGoal = () => {
    setShowCreateOptions(false);
    navigate("personal-goal");
  };

  const handleNavigateCircle = () => {
    setShowCreateOptions(false);
    navigate("circle");
  };

  const handleBack = () => {
    setShowCreateOptions(true);
    navigate("/create");
  };

  // Show sub-route content
  if (!showCreateOptions) {
    return (
      <div style={{ backgroundColor: colors.background }}>
        <Outlet context={{ onBack: handleBack }} />
      </div>
    );
  }

  // Show Create Options
  return (
    <div
      className="pb-20 min-h-screen"
      style={{ backgroundColor: colors.background }}
    >
      {/* Navigation Bar */}
      <NavBar
        variant="minimal"
        onBack={() => navigate(-1)}
        title="What would you like to create ?"
        subtitle="Choose an option to start saving"
        colors={colors}
      />

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Create Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Create Personal Goal Option */}
          <button
            onClick={handleNavigatePersonalGoal}
            className="p-6 rounded-2xl border-2 transition-all hover:scale-105 text-left"
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor =
                colors.primary;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor =
                colors.border;
            }}
          >
            <div className="flex flex-col items-center">
              <div
                className="p-4 rounded-2xl mb-4"
                style={{ backgroundColor: `${colors.primary}15` }}
              >
                <Target size={40} style={{ color: colors.primary }} />
              </div>
              <h3
                className="text-lg font-bold mb-2"
                style={{ color: colors.text }}
              >
                Personal Goal
              </h3>
              <p
                className="text-center text-sm mb-4"
                style={{ color: colors.textLight }}
              >
                Set and track your individual savings targets
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <span
                  className="text-xs px-2 py-1 rounded-lg"
                  style={{
                    backgroundColor: colors.primary + "20",
                    color: colors.primary,
                  }}
                >
                  Solo Saving
                </span>
                <span
                  className="text-xs px-2 py-1 rounded-lg"
                  style={{
                    backgroundColor: colors.primary + "20",
                    color: colors.primary,
                  }}
                >
                  Custom Timeline
                </span>
                <span
                  className="text-xs px-2 py-1 rounded-lg"
                  style={{
                    backgroundColor: colors.primary + "20",
                    color: colors.primary,
                  }}
                >
                  Flexible Amount
                </span>
              </div>
            </div>
          </button>

          {/* Create Savings Circle Option */}
          <button
            onClick={handleNavigateCircle}
            className="p-6 rounded-2xl border-2 transition-all hover:scale-105 text-left"
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor =
                colors.secondary;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor =
                colors.border;
            }}
          >
            <div className="flex flex-col items-center">
              <div
                className="p-4 rounded-2xl mb-4"
                style={{ backgroundColor: `${colors.secondary}15` }}
              >
                <Users size={40} style={{ color: colors.secondary }} />
              </div>
              <h3
                className="text-lg font-bold mb-2"
                style={{ color: colors.text }}
              >
                Savings Circle
              </h3>
              <p
                className="text-center text-sm mb-4"
                style={{ color: colors.textLight }}
              >
                Create a group savings pool with friends
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <span
                  className="text-xs px-2 py-1 rounded-lg"
                  style={{
                    backgroundColor: colors.warningBg,
                    color: colors.secondary,
                  }}
                >
                  Group Saving
                </span>
                <span
                  className="text-xs px-2 py-1 rounded-lg"
                  style={{
                    backgroundColor: colors.warningBg,
                    color: colors.secondary,
                  }}
                >
                  Shared Goals
                </span>
                <span
                  className="text-xs px-2 py-1 rounded-lg"
                  style={{
                    backgroundColor: colors.warningBg,
                    color: colors.secondary,
                  }}
                >
                  Social Support
                </span>
              </div>
            </div>
          </button>

          {/* Create Non-collateralized Circle (Coming Soon) */}
          <div
            className="p-6 rounded-2xl border-2 transition-all relative overflow-hidden text-left"
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border,
              opacity: 0.7,
            }}
          >
            {/* Coming Soon Badge */}
            <div
              className="absolute top-0 right-0 px-3 py-1 rounded-bl-xl text-[10px] font-bold uppercase tracking-wider shadow-sm"
              style={{
                backgroundColor: colors.secondary,
                color: "white",
              }}
            >
              Coming Soon
            </div>

            <div className="flex flex-col items-center">
              <div
                className="p-4 rounded-2xl mb-4"
                style={{ backgroundColor: `${colors.primary}15` }}
              >
                <Handshake size={40} style={{ color: colors.primary }} />
              </div>
              <h3
                className="text-lg font-bold mb-2"
                style={{ color: colors.text }}
              >
                Zero Collateral
              </h3>
              <p
                className="text-center text-sm mb-4"
                style={{ color: colors.textLight }}
              >
                Join savings circles based on your reputation score
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <span
                  className="text-xs px-2 py-1 rounded-lg"
                  style={{
                    backgroundColor: colors.primary + "20",
                    color: colors.primary,
                  }}
                >
                  No Deposit
                </span>
                <span
                  className="text-xs px-2 py-1 rounded-lg"
                  style={{
                    backgroundColor: colors.primary + "20",
                    color: colors.primary,
                  }}
                >
                  Reputation
                </span>
                <span
                  className="text-xs px-2 py-1 rounded-lg"
                  style={{
                    backgroundColor: colors.primary + "20",
                    color: colors.primary,
                  }}
                >
                  Trust Score
                </span>
              </div>
            </div>
          </div>
        </div>

        <QuickAction />
      </div>
    </div>
  );
};

export default Create;
