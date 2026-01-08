import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  User,
  CheckCircle2,
  Search,
  Loader2,
  AlertCircle,
  Info,
} from "lucide-react";
import { useThemeColors } from "../hooks/useThemeColors";
import NavBar from "../components/NavBar";
import { useBalance } from "../hooks/useBalance";
import { useTransfer } from "../hooks/useTransfer";
import { useUserProfile } from "../hooks/useUserProfile";
import { client } from "../thirdwebClient";
import { toast } from "sonner";

const WithdrawInternal: React.FC = () => {
  const navigate = useNavigate();
  const colors = useThemeColors();
  const { balance, formattedBalance, refetch: refetchBalance } = useBalance();
  const { transfer, isTransferring, error: transferError } = useTransfer();
  const { getProfileByUsername, getProfileByEmail, getProfileByAccountId } =
    useUserProfile(client);

  const [searchInput, setSearchInput] = useState("");
  const [recipient, setRecipient] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [amount, setAmount] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      const query = searchInput.trim();
      if (query.length >= 2) {
        setIsSearching(true);
        try {
          let profile = null;
          if (query.includes("@")) {
            profile = await getProfileByEmail(query);
          } else if (/^\d+$/.test(query)) {
            profile = await getProfileByAccountId(query);
          } else {
            profile = await getProfileByUsername(query);
          }
          setRecipient(profile);
        } catch (err) {
          throw err;
          setRecipient(null);
        } finally {
          setIsSearching(false);
        }
      } else {
        setRecipient(null);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [
    searchInput,
    getProfileByUsername,
    getProfileByEmail,
    getProfileByAccountId,
  ]);

  const handleMaxAmount = () => {
    if (balance) {
      setAmount((Number(balance) / 1e18).toString());
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient?.id) {
      toast.error("Please select a valid recipient");
      return;
    }
    const amountInWei = BigInt(Math.floor(parseFloat(amount) * 1e18));
    if (balance && amountInWei > balance) {
      toast.error("Insufficient balance");
      return;
    }

    try {
      await transfer(recipient.id, amountInWei, false); // false = internal/sponsored
      setIsSuccess(true);
      toast.success("Transfer successful!");
      refetchBalance();
    } catch (err) {
      throw err;
    }
  };

  if (isSuccess) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-6 text-center animate-in fade-in"
        style={{ backgroundColor: colors.background }}
      >
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-lg"
          style={{ backgroundColor: colors.successBg }}
        >
          <CheckCircle2 size={40} className="text-lime-900" />
        </div>
        <h2 className="text-2xl font-black mb-2" style={{ color: colors.text }}>
          Transfer Successful!
        </h2>
        <p className="mb-8 font-medium" style={{ color: colors.textLight }}>
          Sent <span className="text-lime-900 font-bold">{amount} USDm</span> to
          @{recipient?.username}
        </p>
        <button
          onClick={() => navigate("/")}
          className="w-full max-w-xs py-4 rounded-2xl font-bold text-white shadow-xl"
          style={{ background: colors.primary }}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: colors.background }}
    >
      <NavBar
        variant="minimal"
        onBack={() => navigate(-1)}
        title="Internal Transfer"
        subtitle="Instantly send to users"
        titleIcon={<User size={18} className="text-white" />}
        colors={colors}
      />
      <div className="flex-1 pb-20 pt-4 px-4 overflow-y-auto">
        <div className="max-w-xl mx-auto space-y-6">
          {/* Instruction Card */}
          <div
            className="p-5 rounded-[1.5rem] border-2 border-dashed flex gap-4 items-start"
            style={{
              backgroundColor: colors.primary + "10",
              borderColor: colors.primary + "30",
            }}
          >
            <div className="p-2 rounded-xl bg-white shadow-sm flex-shrink-0">
              <Info size={20} style={{ color: colors.primary }} />
            </div>
            <div className="space-y-1">
              <h4
                className="text-xs font-black uppercase tracking-wider"
                style={{ color: colors.text }}
              >
                How to send
              </h4>
              <p
                className="text-[11px] leading-relaxed font-semibold opacity-80"
                style={{ color: colors.textLight }}
              >
                Search for recipients using their{" "}
                <span className="text-primary">Username</span>,
                <span className="text-primary"> Email</span>, or{" "}
                <span className="text-primary"> Account ID</span>. Transfers to
                other Circlepot users are{" "}
                <strong>always instant and 100% free</strong>. No withdrawal
                fees required!
              </p>
            </div>
          </div>

          <form onSubmit={handleWithdraw} className="space-y-6">
            {/* Balance Card */}
            <div
              className="p-6 rounded-[2rem] border-2 shadow-sm flex justify-between items-center"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }}
            >
              <div className="space-y-1">
                <span
                  className="text-[10px] font-black uppercase tracking-widest opacity-50 block"
                  style={{ color: colors.text }}
                >
                  Available Balance
                </span>
                <div className="flex items-baseline gap-2">
                  <h2
                    className="text-3xl font-black"
                    style={{ color: colors.text }}
                  >
                    {formattedBalance}
                  </h2>
                  <span className="text-sm font-bold opacity-60">USDm</span>
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-lime-200 text-lime-600">
                <User size={24} />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-widest ml-1 opacity-60">
                Find Recipient
              </label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400">
                  <Search size={22} />
                </div>
                <input
                  type="text"
                  placeholder="Username, Email or ID"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full pl-14 pr-12 py-4 rounded-2xl border-2 outline-none font-bold"
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.text,
                  }}
                />
                {isSearching && (
                  <div className="absolute right-5 top-1/2 -translate-y-1/2">
                    <Loader2 size={20} className="animate-spin text-primary" />
                  </div>
                )}
              </div>

              {recipient && (
                <div
                  className="p-5 rounded-[1.5rem] border-2 flex items-center gap-4 animate-in slide-in-from-top-2"
                  style={{
                    backgroundColor: colors.primary + "10",
                    borderColor: colors.primary + "40",
                  }}
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-white border shadow-sm">
                    {recipient.photo ? (
                      <img
                        src={recipient.photo}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-400">
                        <User size={24} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4
                      className="font-black truncate"
                      style={{ color: colors.text }}
                    >
                      {recipient.fullName}
                    </h4>
                    <span className="text-xs font-bold text-primary">
                      @{recipient.username}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center ml-1">
                <label className="text-xs font-black uppercase tracking-widest opacity-60">
                  Amount to send
                </label>
                <button
                  type="button"
                  onClick={handleMaxAmount}
                  className="text-[10px] font-black px-3 py-1 rounded-xl"
                  style={{
                    backgroundColor: colors.primary + "15",
                    color: colors.primary,
                  }}
                >
                  MAX
                </button>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="w-full px-6 py-4 rounded-2xl border-2 outline-none font-black text-2xl"
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.text,
                  }}
                />
                <div className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-lg opacity-30">
                  USDm
                </div>
              </div>
            </div>

            {transferError && (
              <div
                className="p-5 rounded-[1.5rem] border-2 text-sm flex gap-4 items-center"
                style={{
                  backgroundColor: colors.errorBg,
                  color: "#EF4444",
                  borderColor: "#EF444430",
                }}
              >
                <AlertCircle size={20} className="shrink-0" />
                <p className="font-bold">{transferError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isTransferring || !recipient || !amount}
              className="w-full py-4 rounded-2xl font-black text-lg text-white shadow-2xl flex items-center justify-center gap-3"
              style={{ background: colors.primary }}
            >
              {isTransferring ? (
                <Loader2 className="animate-spin" size={26} />
              ) : (
                "Send Instantly"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default WithdrawInternal;
