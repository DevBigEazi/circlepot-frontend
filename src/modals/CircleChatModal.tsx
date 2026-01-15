import React from "react";
import { X, MessageCircle } from "lucide-react";

interface CircleChatModalProps {
  circle: any;
  onClose: () => void;
  colors: any;
}

const CircleChatModal: React.FC<CircleChatModalProps> = ({
  circle,
  onClose,
  colors,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className="relative w-full max-w-md h-[500px] flex flex-col rounded-2xl shadow-xl overflow-hidden"
        style={{ backgroundColor: colors.surface }}
      >
        {/* Header */}
        <div
          className="p-4 border-b flex justify-between items-center"
          style={{ borderColor: colors.border }}
        >
          <div className="flex items-center gap-2">
            <MessageCircle size={20} style={{ color: colors.primary }} />
            <h3 className="font-bold" style={{ color: colors.text }}>
              {circle.name} Chat
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            style={{ color: colors.textLight }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Coming Soon Message */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
            style={{ backgroundColor: colors.background }}
          >
            <MessageCircle size={40} style={{ color: colors.primary }} />
          </div>
          <h4 className="text-xl font-bold mb-2" style={{ color: colors.text }}>
            Coming Soon
          </h4>
          <p className="text-sm max-w-xs" style={{ color: colors.textLight }}>
            Circle chat feature is currently under development. Stay tuned for
            updates!
          </p>
        </div>
      </div>
    </div>
  );
};

export default CircleChatModal;
