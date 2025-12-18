import React from "react";
import { useThemeColors } from "../hooks/useThemeColors";

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = "",
  width,
  height,
  borderRadius,
}) => {
  const colors = useThemeColors();

  const shimmerStyle = {
    backgroundImage: `linear-gradient(90deg, 
      ${colors.surface} 0%, 
      ${colors.background} 50%, 
      ${colors.surface} 100%)`,
    backgroundSize: "200% 100%",
    animation: "shimmer 1.5s infinite",
    width: width || "100%",
    height: height || "1rem",
    borderRadius: borderRadius || "0.5rem",
  };

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={shimmerStyle}
    >
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
};

export const CircleCardSkeleton: React.FC = () => {
  const colors = useThemeColors();
  return (
    <div
      className="p-6 rounded-xl border space-y-4"
      style={{ backgroundColor: colors.surface, borderColor: colors.border }}
    >
      <div className="flex justify-between items-start">
        <div className="space-y-2 flex-1">
          <Skeleton width="60%" height="1.5rem" />
          <Skeleton width="40%" height="1rem" />
        </div>
        <Skeleton width="3rem" height="1.5rem" borderRadius="1rem" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} height="4rem" borderRadius="0.75rem" />
        ))}
      </div>
      <div className="flex justify-between items-center pt-2">
        <Skeleton width="30%" height="1rem" />
        <Skeleton width="8rem" height="2.5rem" borderRadius="0.75rem" />
      </div>
    </div>
  );
};

export const GoalCardSkeleton: React.FC = () => {
  const colors = useThemeColors();
  return (
    <div
      className="p-5 rounded-2xl border space-y-4"
      style={{ backgroundColor: colors.surface, borderColor: colors.border }}
    >
      <div className="flex justify-between items-start">
        <div className="space-y-2 flex-1">
          <Skeleton width="50%" height="1.25rem" />
          <Skeleton width="70%" height="1rem" />
        </div>
        <Skeleton width="3rem" height="1.5rem" />
      </div>
      <Skeleton width="100%" height="0.5rem" borderRadius="1rem" />
    </div>
  );
};

export const TransactionItemSkeleton: React.FC = () => {
  const colors = useThemeColors();
  return (
    <div
      className="p-4 rounded-xl border space-y-4"
      style={{ backgroundColor: colors.surface, borderColor: colors.border }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <Skeleton width="3rem" height="3rem" borderRadius="0.75rem" />
          <div className="flex-1 space-y-2">
            <Skeleton width="60%" height="1.25rem" />
            <Skeleton width="40%" height="1rem" />
          </div>
        </div>
        <div className="text-right space-y-2">
          <Skeleton width="5rem" height="1.5rem" />
          <Skeleton width="3rem" height="1rem" />
        </div>
      </div>
      <div
        className="border-t pt-3 space-y-2"
        style={{ borderColor: colors.border }}
      >
        <div className="flex justify-between">
          <Skeleton width="20%" height="0.75rem" />
          <Skeleton width="30%" height="0.75rem" />
        </div>
        <div className="flex justify-between">
          <Skeleton width="25%" height="0.75rem" />
          <Skeleton width="40%" height="0.75rem" />
        </div>
      </div>
    </div>
  );
};

export const CardSkeleton: React.FC<{ height?: string }> = ({
  height = "8rem",
}) => {
  return <Skeleton height={height} borderRadius="1rem" />;
};
