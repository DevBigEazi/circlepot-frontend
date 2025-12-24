import React from "react";
import { useThemeColors } from "../hooks/useThemeColors";
import { Users, Search, FolderOpen } from "lucide-react";
import { useNavigate } from "react-router";

const QuickAction: React.FC = () => {
  const navigate = useNavigate();
  const colors = useThemeColors();
  return (
    <>
      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-bold mb-4" style={{ color: colors.text }}>
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => navigate("/browse")}
            className="p-4 rounded-xl border flex items-center gap-3 hover:opacity-80 transition"
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border,
            }}
          >
            <Search size={20} style={{ color: colors.primary }} />
            <div className="text-left">
              <div
                className="text-sm font-medium"
                style={{ color: colors.text }}
              >
                Browse Circles
              </div>
              <div className="text-xs" style={{ color: colors.textLight }}>
                Join existing groups
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate("/goals")}
            className="p-4 rounded-xl border flex items-center gap-3 hover:opacity-80 transition"
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border,
            }}
          >
            <FolderOpen size={20} style={{ color: colors.primary }} />
            <div className="text-left">
              <div
                className="text-sm font-medium"
                style={{ color: colors.text }}
              >
                View Goals
              </div>
              <div className="text-xs" style={{ color: colors.textLight }}>
                Track your progress
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate("/circles")}
            className="p-4 rounded-xl border flex items-center gap-3 hover:opacity-80 transition"
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border,
            }}
          >
            <Users size={20} style={{ color: colors.primary }} />
            <div className="text-left">
              <div
                className="text-sm font-medium"
                style={{ color: colors.text }}
              >
                Active Circles
              </div>
              <div className="text-xs" style={{ color: colors.textLight }}>
                View your circle savings
              </div>
            </div>
          </button>
        </div>
      </div>
    </>
  );
};

export default QuickAction;
