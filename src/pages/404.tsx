import React from "react";
import { useNavigate, Link } from "react-router";
import { Home, ArrowLeft } from "lucide-react";
import { useThemeColors } from "../hooks/useThemeColors";
import image from "../constants/image";

const Error404: React.FC = () => {
  const navigate = useNavigate();
  const colors = useThemeColors();

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6 text-center overflow-hidden relative transition-colors duration-300"
      style={{ backgroundColor: colors.background }}
    >
      {/* Decorative background elements */}
      <div
        className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full blur-3xl animate-pulse opacity-20"
        style={{ backgroundColor: colors.primary }}
      />
      <div
        className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full blur-3xl animate-pulse opacity-20"
        style={{ backgroundColor: colors.secondary, animationDelay: "1s" }}
      />

      <div className="relative z-10 max-w-2xl flex flex-col items-center">
        {/* Animated Illustration Container */}
        <div className="relative mb-8 group">
          <div
            className="absolute inset-0 rounded-full blur-2xl scale-75 group-hover:scale-100 transition-transform duration-700 opacity-20"
            style={{ backgroundColor: colors.primary }}
          />
          <img
            src={image.illustration}
            alt="404 Illustration"
            className="w-64 h-64 md:w-80 md:h-80 object-contain relative z-10 animate-float mix-blend-multiply dark:mix-blend-normal"
          />
        </div>

        {/* Text Content */}
        <h1
          className="text-8xl md:text-9xl font-black mb-4 tracking-tighter opacity-10 transition-colors duration-300"
          style={{ color: colors.accent }}
        >
          404
        </h1>

        <h2
          className="text-3xl md:text-4xl font-bold mb-4 -mt-12 relative z-20 transition-colors duration-300"
          style={{ color: colors.accent }}
        >
          Oops! You're lost in space.
        </h2>

        <p
          className="text-lg mb-10 max-w-md mx-auto leading-relaxed transition-colors duration-300"
          style={{ color: colors.textLight }}
        >
          The page you're looking for has drifted away. Don't worry, we can help
          you find your way back to your circles.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl border-2 font-semibold transition-all duration-300"
            style={{
              borderColor: colors.border,
              color: colors.text,
              backgroundColor: colors.surface,
            }}
          >
            <ArrowLeft size={20} />
            Go Back
          </button>

          <Link
            to="/"
            reloadDocument
            className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-white font-semibold shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              backgroundColor: colors.primary,
              boxShadow: `0 10px 15px -3px ${colors.primary}40`,
            }}
          >
            <Home size={20} />
            Return Home
          </Link>
        </div>
      </div>

      {/* Embedded CSS for animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(2deg); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default Error404;
