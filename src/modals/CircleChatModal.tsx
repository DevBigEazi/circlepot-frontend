import React, { useState } from "react";
import { X, Send, MessageCircle } from "lucide-react";

interface CircleChatModalProps {
  circle: any;
  currentUser: string;
  onClose: () => void;
  colors: any;
}

const CircleChatModal: React.FC<CircleChatModalProps> = ({
  circle,
  currentUser,
  onClose,
  colors,
}) => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "System",
      text: `Welcome to the ${circle.name} chat!`,
      timestamp: "Now",
    },
  ]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setMessages([
      ...messages,
      {
        id: Date.now(),
        sender: currentUser,
        text: message,
        timestamp: "Just now",
      },
    ]);
    setMessage("");
  };

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

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.sender === currentUser ? "items-end" : "items-start"
              }`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-xl ${
                  msg.sender === currentUser
                    ? "rounded-tr-none text-white"
                    : "rounded-tl-none"
                }`}
                style={{
                  background:
                    msg.sender === currentUser
                      ? colors.primary
                      : colors.background,
                  color: msg.sender === currentUser ? "#fff" : colors.text,
                }}
              >
                <p className="text-sm">{msg.text}</p>
              </div>
              <span
                className="text-[10px] mt-1 px-1"
                style={{ color: colors.textLight }}
              >
                {msg.sender} • {msg.timestamp}
              </span>
            </div>
          ))}
        </div>

        {/* Input */}
        <form
          onSubmit={handleSend}
          className="p-4 border-t"
          style={{ borderColor: colors.border }}
        >
          <div className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 rounded-xl border focus:outline-none focus:ring-2"
              style={
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.text,
                  "--tw-ring-color": colors.primary,
                } as any
              }
            />
            <button
              type="submit"
              className="p-2 rounded-xl text-white transition hover:opacity-90"
              style={{ background: colors.primary }}
            >
              <Send size={20} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CircleChatModal;
