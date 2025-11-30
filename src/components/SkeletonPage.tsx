import React from "react";
import { useThemeColors } from "../hooks/useThemeColors";

const SkeletonPage: React.FC = () => {
  const colors = useThemeColors();

  // Shimmer animation style
  const shimmerStyle = {
    backgroundImage: `linear-gradient(90deg, 
      ${colors.surface} 0%, 
      ${colors.background} 50%, 
      ${colors.surface} 100%)`,
    backgroundSize: "200% 100%",
    animation: "shimmer 1.5s infinite",
  };

  return (
    <div
      className="min-h-screen pb-24 relative"
      style={{ backgroundColor: colors.background }}
    >
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      {/* Header Skeleton */}
      <div className="px-4 py-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full" style={shimmerStyle} />
          <div className="space-y-2">
            <div className="h-4 w-32 rounded" style={shimmerStyle} />
            <div className="h-3 w-20 rounded" style={shimmerStyle} />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="w-10 h-10 rounded-xl" style={shimmerStyle} />
          <div className="w-10 h-10 rounded-xl" style={shimmerStyle} />
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="px-4 space-y-6">
        {/* Balance Card */}
        <div className="w-full h-48 rounded-2xl" style={shimmerStyle} />

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <div className="h-32 rounded-2xl" style={shimmerStyle} />
          <div className="h-32 rounded-2xl" style={shimmerStyle} />
        </div>

        {/* List Items */}
        <div className="space-y-4">
          <div className="h-6 w-40 rounded mb-4" style={shimmerStyle} />
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-full h-20 rounded-xl"
              style={shimmerStyle}
            />
          ))}
        </div>
      </div>

      {/* Bottom Nav Skeleton */}
      <div
        className="fixed bottom-0 left-0 right-0 h-20 border-t flex justify-around items-center px-6"
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.border,
        }}
      >
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="w-8 h-8 rounded-full" style={shimmerStyle} />
        ))}
      </div>
    </div>
  );
};

export default SkeletonPage;
