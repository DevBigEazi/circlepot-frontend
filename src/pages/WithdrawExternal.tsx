import React, { useState, useEffect } from "react";
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
    getEstimatedFee,
    estimatedFee,
    isEstimating,
    isTransferring,
    error: transferError,
  } = useTransfer();

  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const isValidAddress = (addr: string) => {
    return /^0x[a-fA-F0-9]{40}$/.test(addr);
  };

  // Estimate fee when address or amount changes
  useEffect(() => {
    const amountNum = parseFloat(amount || "0");
    if (isValidAddress(address) && amountNum > 0) {
      const amountInWei = BigInt(Math.floor(amountNum * 1e18));
      getEstimatedFee(address, amountInWei);
    }
  }, [address, amount, getEstimatedFee]);

  const handleMaxAmount = () => {
    if (balance) {
      // Set the full balance to demonstrate the "Insufficient funds for gas" error
      // as requested by the user.
      setAmount((Number(balance) / 1e18).toString());
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidAddress(address)) {
      toast.error("Invalid wallet address");
      return;
    }

    const amountInWei = BigInt(Math.floor(parseFloat(amount) * 1e18));

    // Check if balance covers amount + fee
    const fee = estimatedFee || 0n;
    const totalRequired = amountInWei + fee;

    if (balance && totalRequired > balance) {
      toast.error(
        `Insufficient funds to cover amount and network fee (~${(
          Number(fee) / 1e18
        ).toFixed(4)} cUSD)`
      );
      return;
    }

    try {
      const result: any = await transfer(address, amountInWei, false);
      setTxHash(result.transactionHash);
      setIsSuccess(true);
      toast.success("Withdrawal successful!");
      refetchBalance();
    } catch (err) {
      console.error("Withdrawal error:", err);
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
          Your cUSD withdrawal to {address.slice(0, 6)}...{address.slice(-4)}{" "}
          has been successfully processed.
        </p>
        <div className="space-y-4 w-full max-w-xs">
          <button
            onClick={() => navigate("/")}
            className="w-full py-4 rounded-2xl font-bold text-white transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
            style={{ background: colors.gradient }}
          >
            Back to Home
          </button>
          {txHash && (
            <a
              href={`https://celo-sepolia.blockscout.com/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-2 text-sm font-medium"
              style={{ color: colors.primary }}
            >
              View on Explorer
            </a>
          )}
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
            <div className="p-2 rounded-xl bg-white shadow-sm flex-shrink-0">
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
                  Select <strong>cUSD</strong> as the token.
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
              className="p-2 rounded-xl bg-white shadow-sm flex-shrink-0"
              style={{ color: colors.primary }}
            >
              <ArrowRight size={16} />
            </div>
            <p className="text-[11px] font-bold" style={{ color: colors.text }}>
              Sending to a Circlepot user?{" "}
              <span className="underline" style={{ color: colors.primary }}>
                Use Internal Transfer
              </span>{" "}
              for instant, gas-free sending!
            </p>
          </div>

          <form onSubmit={handleWithdraw} className="space-y-6">
            {/* Balance Card */}
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
                  cUSD
                </span>
              </div>
            </div>

            {/* Inputs Section */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label
                  className="text-sm font-semibold ml-1"
                  style={{ color: colors.text }}
                >
                  Recipient Wallet Address
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    placeholder="0x..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                    className="w-full px-5 py-4 rounded-2xl border-2 transition-all outline-none"
                    style={{
                      backgroundColor: colors.surface,
                      borderColor:
                        address && !isValidAddress(address)
                          ? "#F87171"
                          : colors.border,
                      color: colors.text,
                    }}
                  />
                  {address && !isValidAddress(address) && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500">
                      <AlertCircle size={20} />
                    </div>
                  )}
                </div>
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

                  {/* Gas Fee Estimation UI */}
                  {(isEstimating || estimatedFee) && (
                    <div
                      className="px-4 py-2 rounded-xl flex justify-between items-center transition-all animate-in fade-in slide-in-from-top-1"
                      style={{ backgroundColor: colors.primary + "05" }}
                    >
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider opacity-60"
                        style={{ color: colors.text }}
                      >
                        Network Fee
                      </span>
                      {isEstimating ? (
                        <div className="flex items-center gap-1 opacity-60">
                          <Loader2 size={10} className="animate-spin" />
                          <span className="text-[10px] font-bold">
                            Estimating...
                          </span>
                        </div>
                      ) : (
                        <span
                          className="text-[10px] font-bold"
                          style={{ color: colors.text }}
                        >
                          ~{(Number(estimatedFee) / 1e18).toFixed(4)} cUSD
                        </span>
                      )}
                    </div>
                  )}
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
              disabled={
                isTransferring ||
                isEstimating ||
                !address ||
                !amount ||
                !isValidAddress(address)
              }
              className="w-full py-5 rounded-2xl font-black text-lg text-white transition-all active:scale-[0.98] shadow-xl disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
              style={{
                background: colors.gradient,
                boxShadow: `0 10px 25px -5px ${colors.primary}40`,
              }}
            >
              {isTransferring ? (
                <>
                  <Loader2 className="animate-spin" size={24} />
                  Processing...
                </>
              ) : isEstimating ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Calculating Fee...
                </>
              ) : (
                <>
                  Send Transfer
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          {/* Security Note */}
          <div
            className="mt-8 p-4 rounded-2xl border-2 border-dashed flex gap-4 items-center"
            style={{ borderColor: colors.border }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: colors.infoBg }}
            >
              <Wallet size={20} style={{ color: colors.primary }} />
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
