import React, { useState } from "react";
import { useNavigate } from "react-router";
import { Copy, Check, Info, Share2 } from "lucide-react";
import { useThemeColors } from "../hooks/useThemeColors";
import { useActiveAccount } from "thirdweb/react";
import { QRCodeSVG } from "qrcode.react";
import NavBar from "../components/NavBar";
import { shortenAddress } from "../utils/helpers";
import image from "../constants/image";

const ExternalWallets: React.FC = () => {
  const navigate = useNavigate();
  const colors = useThemeColors();
  const account = useActiveAccount();
  const [copied, setCopied] = useState(false);

  const address = account?.address || "";

  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (address) {
      try {
        await navigator.share({
          text: address,
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    }
  };

  return (
    <>
      <NavBar
        variant="minimal"
        onBack={() => navigate(-1)}
        title="Wallets or Exchanges Deposit"
        colors={colors}
      />

      <div
        className="min-h-screen pb-20"
        style={{ backgroundColor: colors.background }}
      >
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="space-y-6">
            <p className="text-sm px-1" style={{ color: colors.textLight }}>
              Deposit cUSD directly from external sources. Scan the QR code or
              copy the address below.
            </p>

            {/* QR Code Card */}
            <div
              className="p-6 sm:p-8 rounded-3xl shadow-sm border flex flex-col items-center text-center space-y-6"
              style={{
                borderColor: colors.border,
                backgroundColor: colors.surface,
              }}
            >
              <div className="p-4 bg-white rounded-2xl shadow-inner border border-gray-100">
                {address ? (
                  <QRCodeSVG
                    value={address}
                    size={180}
                    level="H"
                    includeMargin={false}
                  />
                ) : (
                  <div className="w-[180px] h-[180px] flex items-center justify-center bg-gray-50 rounded-lg">
                    <p className="text-gray-400 text-xs">Connecting...</p>
                  </div>
                )}
              </div>

              <div className="w-full space-y-2">
                <div
                  className="flex items-center gap-2 p-3 sm:p-4 rounded-2xl border transition-all"
                  style={{
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  }}
                >
                  <code
                    className="flex-1 text-xs sm:text-sm font-mono tracking-tight text-left"
                    style={{ color: colors.text }}
                  >
                    {address ? shortenAddress(address) : "Loading address..."}
                  </code>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopy}
                      disabled={!address}
                      className="p-2 sm:p-2.5 rounded-xl transition-all hover:scale-110 active:scale-95 disabled:opacity-50 flex-shrink-0"
                      style={{
                        backgroundColor: copied
                          ? colors.successBg
                          : colors.surface,
                        color: copied ? colors.primary : colors.text,
                        border: `1px solid ${colors.border}`,
                      }}
                      title="Copy Address"
                    >
                      {copied ? <Check size={18} /> : <Copy size={18} />}
                    </button>
                    {typeof navigator.share !== "undefined" && (
                      <button
                        onClick={handleShare}
                        disabled={!address}
                        className="p-2 sm:p-2.5 rounded-xl transition-all hover:scale-110 active:scale-95 disabled:opacity-50 flex-shrink-0"
                        style={{
                          backgroundColor: colors.surface,
                          color: colors.text,
                          border: `1px solid ${colors.border}`,
                        }}
                        title="Share Address"
                      >
                        <Share2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {/* How to Deposit Guide */}
            <div className="space-y-4 px-1">
              <h3 className="font-bold text-sm" style={{ color: colors.text }}>
                How to deposit from an exchange
              </h3>
              <div className="space-y-3">
                {[
                  {
                    step: 1,
                    title: "Select Celo Network",
                    desc: "Ensure you choose the Celo network on your exchange.",
                  },
                  {
                    step: 2,
                    title: "Select Token",
                    desc: "Choose cUSD as the token to deposit (Supports cUSD only).",
                    icon: (
                      <img
                        src={image.cUSD}
                        alt="cUSD"
                        className="w-4 h-4 rounded-full"
                      />
                    ),
                  },
                  {
                    step: 3,
                    title: "Complete Transfer",
                    desc: "Paste or scan your wallet address above and confirm the transfer.",
                  },
                ].map((item) => (
                  <div key={item.step} className="flex gap-4">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                      style={{
                        backgroundColor: colors.primary,
                        color: "white",
                      }}
                    >
                      {item.step}
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h4
                          className="text-sm font-semibold"
                          style={{ color: colors.text }}
                        >
                          {item.title}
                        </h4>
                        {"icon" in item && item.icon}
                      </div>
                      <p
                        className="text-xs"
                        style={{ color: colors.textLight }}
                      >
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Warning/Instructions */}
            <div
              className="p-4 rounded-2xl border flex gap-3 sm:gap-4"
              style={{
                backgroundColor: "rgba(53, 208, 127, 0.05)",
                borderColor: "rgba(53, 208, 127, 0.2)",
              }}
            >
              <div
                className="p-2 rounded-xl h-fit shrink-0"
                style={{ backgroundColor: "rgba(53, 208, 127, 0.1)" }}
              >
                <Info size={18} style={{ color: colors.primary }} />
              </div>
              <div className="space-y-1">
                <h4
                  className="font-bold text-sm"
                  style={{ color: colors.text }}
                >
                  Important Information
                </h4>
                <ul
                  className="text-xs space-y-1.5 list-disc ml-4 leading-relaxed"
                  style={{ color: colors.textLight }}
                >
                  <li>
                    Send only <b>cUSD</b> to this address.
                  </li>
                  <li>
                    Ensure you are using the <b>Celo</b> network.
                  </li>
                  <li>
                    Sending any other asset or using a different network may
                    result in permanent loss of funds.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ExternalWallets;
