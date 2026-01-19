import React, { useState } from "react";
import { useNavigate } from "react-router";
import {
  Wallet,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Info,
} from "lucide-react";
import { useThemeColors } from "../hooks/useThemeColors";
import NavBar from "../components/NavBar";
import { useBalance } from "../hooks/useBalance";
import { useTransfer } from "../hooks/useTransfer";
import { toast } from "sonner";

const WithdrawExternal: React.FC = () => {
  const navigate = useNavigate();
  const colors = useThemeColors();
  const { balance, formattedBalance, refetch: refetchBalance } = useBalance();
  const {
    transfer,
    isTransferring,
    error: transferError,
    withdrawalFee,
  } = useTransfer();

  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const isValidAddress = (addr: string) => {
    return /^0x[a-fA-F0-9]{40}$/.test(addr);
  };

  const handleMaxAmount = () => {
    if (balance) {
      // Amount = Total Balance - Withdrawal Fee
      const feeInWei = BigInt(Math.floor(withdrawalFee * 1e18));
      const maxAvailable = balance > feeInWei ? balance - feeInWei : 0n;
      setAmount((Number(maxAvailable) / 1e18).toString());
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidAddress(address)) {
      toast.error("Invalid wallet address");
      return;
    }

    const amountInWei = BigInt(Math.floor(parseFloat(amount) * 1e18));
    const feeInWei = BigInt(Math.floor(withdrawalFee * 1e18));
    const totalRequired = amountInWei + feeInWei;

    if (balance && totalRequired > balance) {
      toast.error(
        `Insufficient balance. You need ${amount} + ${withdrawalFee} USDm fee.`,
      );
      return;
    }

    try {
      await transfer(address, amountInWei, true);
      setIsSuccess(true);
      toast.success("Withdrawal successful!");
      refetchBalance();
    } catch (err: any) {
      toast.error(err.message || "Withdrawal failed");
    }
  };

  if (isSuccess) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
        style={{ backgroundColor: colors.background }}
      >
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
          style={{ backgroundColor: colors.successBg }}
        >
          <CheckCircle2 size={40} className="text-emerald-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: colors.text }}>
          Transfer Sent!
        </h2>
        <p className="mb-8 max-w-xs" style={{ color: colors.textLight }}>
          Your withdrawal to {address.slice(0, 6)}...{address.slice(-4)} has
          been processed.
        </p>
        <div className="space-y-4 w-full max-w-xs">
          <button
            onClick={() => navigate("/")}
            className="w-full py-4 rounded-2xl font-bold text-white transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
            style={{ background: colors.primary }}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <NavBar
        variant="minimal"
        onBack={() => navigate(-1)}
        title="Withdraw to Wallet"
        subtitle="Send funds to external wallet"
        titleIcon={<Wallet size={18} className="text-white" />}
        colors={colors}
      />

      <div
        className="min-h-screen pb-20 pt-4"
        style={{ backgroundColor: colors.background }}
      >
        <div className="max-w-xl mx-auto px-4 space-y-6">
          {/* Instructions Card */}
          <div
            className="p-5 rounded-3xl border-2 border-dashed flex gap-4 items-start"
            style={{
              backgroundColor: colors.primary + "05",
              borderColor: colors.primary + "20",
            }}
          >
            <div className="p-2 rounded-xl bg-white shadow-sm shrink-0">
              <Info size={20} style={{ color: colors.primary }} />
            </div>
            <div className="space-y-2">
              <h4
                className="text-xs font-black uppercase tracking-wider"
                style={{ color: colors.text }}
              >
                How to withdraw
              </h4>
              <ol
                className="text-[11px] leading-relaxed font-semibold space-y-1 ml-4 list-decimal"
                style={{ color: colors.textLight }}
              >
                <li>
                  Open your external wallet and tap <strong>Deposit</strong>.
                </li>
                <li>
                  Select <strong>USDm</strong> as the token.
                </li>
                <li>
                  Select the <strong>Celo Network</strong> (Critical!).
                </li>
                <li>Copy and paste that address below.</li>
                <li>Enter amount and send.</li>
              </ol>
            </div>
          </div>
          {/* Internal Transfer Nudge */}
          <div
            className="p-4 rounded-2xl flex items-center gap-3 cursor-pointer transition-transform active:scale-[0.98]"
            onClick={() => navigate("/withdraw/internal")}
            style={{
              backgroundColor: colors.primary + "10",
              border: `1px solid ${colors.primary}20`,
            }}
          >
            <div
              className="p-2 rounded-xl bg-white shadow-sm shrink-0"
              style={{ color: colors.primary }}
            >
              <ArrowRight size={16} />
            </div>
            <p className="text-[11px] font-bold" style={{ color: colors.text }}>
              Sending to a Circlepot user?{" "}
              <span className="underline" style={{ color: colors.primary }}>
                Use Internal Transfer
              </span>{" "}
              for instant, free sending!
            </p>
          </div>

          <form onSubmit={handleWithdraw} className="space-y-6">
            <div
              className="p-6 rounded-3xl space-y-2 border"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }}
            >
              <span
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: colors.textLight }}
              >
                Available Balance
              </span>
              <div className="flex items-baseline gap-2">
                <h2
                  className="text-3xl font-bold"
                  style={{ color: colors.text }}
                >
                  {formattedBalance}
                </h2>
                <span
                  className="text-lg font-medium"
                  style={{ color: colors.textLight }}
                >
                  USDm
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label
                  className="text-sm font-semibold ml-1"
                  style={{ color: colors.text }}
                >
                  Recipient Wallet Address
                </label>
                <input
                  type="text"
                  placeholder="0x..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                  className="w-full px-5 py-4 rounded-2xl border-2 transition-all outline-none"
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.text,
                  }}
                />
              </div>

              <div className="space-y-2">
                <label
                  className="text-sm font-semibold ml-1"
                  style={{ color: colors.text }}
                >
                  Amount to Withdraw
                </label>
                <div className="relative flex flex-col gap-2">
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                      className="w-full px-5 py-4 rounded-2xl border-2 transition-all outline-none pr-24"
                      style={{
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                        color: colors.text,
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleMaxAmount}
                      className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-tight transition-colors"
                      style={{
                        backgroundColor: colors.primary + "15",
                        color: colors.primary,
                      }}
                    >
                      MAX
                    </button>
                  </div>
                  <p
                    className="text-xs leading-relaxed"
                    style={{ color: colors.textLight }}
                  >
                    <strong>{withdrawalFee} USDm</strong> withdrawal fee is
                    charged on all external withdrawals.
                  </p>
                </div>
              </div>
            </div>

            {transferError && (
              <div
                className="p-4 rounded-2xl text-sm flex gap-3 items-start"
                style={{ backgroundColor: colors.errorBg, color: "#EF4444" }}
              >
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <p>{transferError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isTransferring || !address || !amount}
              className="w-full py-5 rounded-2xl font-black text-lg text-white transition-all active:scale-[0.98] shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
              style={{
                background: colors.primary,
              }}
            >
              {isTransferring ? (
                <>
                  <Loader2 className="animate-spin" size={24} />
                  Processing...
                </>
              ) : (
                <>
                  Withdraw Funds
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <div
            className="p-4 rounded-2xl border-2 border-dashed flex gap-4 items-center"
            style={{ borderColor: colors.border }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: colors.infoBg }}
            >
              <Info size={20} style={{ color: colors.primary }} />
            </div>
            <p
              className="text-xs leading-relaxed"
              style={{ color: colors.textLight }}
            >
              <strong>Important:</strong> Only send to a wallet on the{" "}
              <strong>Celo Network</strong>. Sending to the wrong network may
              result in permanent loss of funds. Blockchain transactions are
              irreversible.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default WithdrawExternal;
