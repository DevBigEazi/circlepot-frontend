import {
  Check,
  Lock,
  LogOut,
  ChevronDown,
  Search,
  Bell,
  ChevronRight,
} from "lucide-react";
import { SiThirdweb } from "react-icons/si";

import React, { useState, useRef, useEffect } from "react";
import { useThemeColors } from "../hooks/useThemeColors";
import { useUserProfile } from "../hooks/useUserProfile";
import { toast } from "sonner";
import NavBar from "../components/NavBar";
import { useNavigate } from "react-router";
import { client } from "../thirdwebClient";
import LogoutModal from "../modals/LogoutModal";
import { useDisconnect, useActiveWallet } from "thirdweb/react";
import { useBiometricContext } from "../contexts/BiometricContext";
import { useBiometric } from "../hooks/useBiometric";
import ThemeToggle from "../components/ThemeToggle";
import { useCurrency } from "../contexts/CurrencyContext";
import { useNotifications } from "../contexts/NotificationsContext";
import { useCurrencyConverter } from "../hooks/useCurrencyConverter";
import { getInitials } from "../utils/helpers";
import { MdRoomPreferences } from "react-icons/md";

const Settings: React.FC = () => {
  const colors = useThemeColors();
  const navigate = useNavigate();
  const { disconnect } = useDisconnect();
  const wallet = useActiveWallet();
  const { selectedCurrency, setSelectedCurrency } = useCurrency();
  const { availableCurrencies } = useCurrencyConverter();
  useNotifications();

  // State for logout and loading
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);
  const [currencySearch, setCurrencySearch] = useState("");
  const currencyDropdownRef = useRef<HTMLDivElement>(null);

  // Profile data for basic display (read-only in settings)
  const { profile } = useUserProfile(client);
  const { enableBiometric, disableBiometric } = useBiometricContext();
  const { registerBiometric, removeBiometric } = useBiometric();

  const [accountId, setAccountId] = useState("");
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);

  useEffect(() => {
    if (profile) {
      setAccountId(profile.accountId?.toString() || "");
    }
  }, [profile]);

  // Sync biometric toggle with actual state
  useEffect(() => {
    if (accountId) {
      const biometricState = localStorage.getItem(
        `biometric_state_${accountId}`,
      );
      if (biometricState) {
        try {
          const state = JSON.parse(biometricState);
          setIsBiometricEnabled(state.isEnabled || false);
        } catch (err) {}
      }
    }
  }, [accountId]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        currencyDropdownRef.current &&
        !currencyDropdownRef.current.contains(event.target as Node)
      ) {
        setIsCurrencyDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDisconnect = async () => {
    try {
      setIsDisconnecting(true);
      if (wallet) {
        navigate("/");
        disconnect(wallet);
      }
    } catch (error: any) {
      toast.error("Failed to disconnect wallet. Please try again.");
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleBiometricToggle = async (enabled: boolean) => {
    if (enabled) {
      const result = await registerBiometric({
        userId: accountId,
        userName: profile?.username || "",
        userEmail: profile?.email || "",
      });
      if (result.success) {
        enableBiometric();
        setIsBiometricEnabled(true);
        toast.success("Biometric registered!");
      } else {
        toast.error(result.error || "Failed to register biometric");
        setIsBiometricEnabled(false);
      }
    } else {
      removeBiometric(accountId);
      disableBiometric();
      setIsBiometricEnabled(false);
      toast.success("Biometric disabled");
    }
  };

  const filteredCurrencies = Object.keys(availableCurrencies).filter((code) => {
    const currency = availableCurrencies[code];
    return (
      code.toLowerCase().includes(currencySearch.toLowerCase()) ||
      currency.name.toLowerCase().includes(currencySearch.toLowerCase())
    );
  });

  return (
    <>
      <NavBar
        variant="minimal"
        onBack={() => navigate(-1)}
        title="Settings"
        colors={colors}
      />

      {/* Content */}
      <div
        className="min-h-screen pb-20 px-2 sm:px-4"
        style={{ backgroundColor: colors.background }}
      >
        <div className="max-w-2xl mx-auto py-4 sm:py-6">
          <div className="space-y-4 sm:space-y-6">
            {/* Profile Navigation Card */}
            <button
              onClick={() => navigate("/profile")}
              className="w-full text-left rounded-2xl p-4 sm:p-6 shadow-sm border transition hover:opacity-90 flex items-center justify-between"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border flex items-center justify-center bg-muted"
                  style={{ borderColor: colors.border }}
                >
                  {profile?.photo ? (
                    <img
                      src={profile.photo}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-lg font-bold">
                      {getInitials(profile?.fullName)}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3
                    className="font-bold text-base sm:text-lg truncate"
                    style={{ color: colors.text }}
                  >
                    {profile?.fullName || "Set your name"}
                  </h3>
                  <p
                    className="text-xs sm:text-sm truncate"
                    style={{ color: colors.textLight }}
                  >
                    @{profile?.username || "username"}
                  </p>
                </div>
              </div>
              <ChevronRight size={20} style={{ color: colors.textLight }} />
            </button>

            {/* Preferences Section */}
            <div
              className="rounded-2xl p-4 sm:p-6 shadow-sm border"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }}
            >
              <div className="flex items-center gap-2 sm:gap-3 mb-6">
                <div
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: colors.primary }}
                >
                  <MdRoomPreferences className="white" size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3
                    className="font-bold text-sm sm:text-base truncate"
                    style={{ color: colors.text }}
                  >
                    Preferences
                  </h3>
                  <p
                    className="text-xs sm:text-sm truncate"
                    style={{ color: colors.textLight }}
                  >
                    Personalize your experience
                  </p>
                </div>
              </div>

              <div className="space-y-8">
                {/* Appearance Sub-section */}
                <div className="space-y-3">
                  <h4
                    className="text-xs font-bold uppercase tracking-wider"
                    style={{ color: colors.textLight }}
                  >
                    Appearance
                  </h4>
                  <ThemeToggle />
                </div>

                {/* Currency Sub-section */}
                <div className="space-y-3">
                  <h4
                    className="text-xs font-bold uppercase tracking-wider"
                    style={{ color: colors.textLight }}
                  >
                    Local Currency
                  </h4>
                  <div className="relative" ref={currencyDropdownRef}>
                    <button
                      onClick={() =>
                        setIsCurrencyDropdownOpen(!isCurrencyDropdownOpen)
                      }
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border flex items-center justify-between transition hover:opacity-80"
                      style={{
                        borderColor: colors.border,
                        backgroundColor: colors.background,
                        color: colors.text,
                      }}
                    >
                      <div className="flex items-center gap-3">
                        {availableCurrencies[selectedCurrency]?.flag && (
                          <img
                            src={availableCurrencies[selectedCurrency].flag}
                            alt=""
                            className="w-6 h-4 object-cover rounded-sm shadow-sm"
                          />
                        )}
                        <span className="font-medium text-sm">
                          {availableCurrencies[selectedCurrency]?.name} (
                          {selectedCurrency})
                        </span>
                      </div>
                      <ChevronDown
                        size={18}
                        className={`transition-transform duration-200 ${
                          isCurrencyDropdownOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {isCurrencyDropdownOpen && (
                      <div
                        className="absolute z-50 mt-2 w-full max-h-64 overflow-hidden rounded-2xl shadow-xl border animate-in fade-in slide-in-from-top-2 duration-200"
                        style={{
                          backgroundColor: colors.surface,
                          borderColor: colors.border,
                        }}
                      >
                        <div
                          className="p-2 border-b sticky top-0 bg-inherit z-10"
                          style={{ borderColor: colors.border }}
                        >
                          <div className="relative">
                            <Search
                              className="absolute left-3 top-1/2 -translate-y-1/2"
                              size={14}
                              style={{ color: colors.textLight }}
                            />
                            <input
                              type="text"
                              placeholder="Search currencies..."
                              value={currencySearch}
                              onChange={(e) =>
                                setCurrencySearch(e.target.value)
                              }
                              className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm focus:outline-none transition"
                              style={{
                                borderColor: colors.border,
                                backgroundColor: colors.background,
                                color: colors.text,
                              }}
                            />
                          </div>
                        </div>
                        <div className="overflow-y-auto max-h-48 custom-scrollbar">
                          {filteredCurrencies.map((code) => (
                            <button
                              key={code}
                              onClick={() => {
                                setSelectedCurrency(code);
                                setIsCurrencyDropdownOpen(false);
                                setCurrencySearch("");
                                toast.success(`Currency set to ${code}`);
                              }}
                              className="w-full px-4 py-3 flex items-center gap-3 transition hover:opacity-80 text-left"
                              style={{
                                backgroundColor:
                                  selectedCurrency === code
                                    ? colors.hoverBg
                                    : "transparent",
                              }}
                            >
                              {availableCurrencies[code].flag && (
                                <img
                                  src={availableCurrencies[code].flag}
                                  alt=""
                                  className="w-6 h-4 object-cover rounded-sm"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <div
                                  className="font-bold text-sm"
                                  style={{ color: colors.text }}
                                >
                                  {code}
                                </div>
                                <div
                                  className="text-xs truncate"
                                  style={{ color: colors.textLight }}
                                >
                                  {availableCurrencies[code].name}
                                </div>
                              </div>
                              {selectedCurrency === code && (
                                <Check
                                  size={16}
                                  style={{ color: colors.primary }}
                                />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notifications & Security Sub-section */}
                <div
                  className="space-y-4 pt-4 border-t"
                  style={{ borderColor: colors.border }}
                >
                  <h4
                    className="text-xs font-bold uppercase tracking-wider"
                    style={{ color: colors.textLight }}
                  >
                    Notifications & Security
                  </h4>

                  <div
                    className="flex items-center justify-between py-2 cursor-pointer transition hover:opacity-70"
                    onClick={() => navigate("/notifications/settings")}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: colors.accentBg }}
                      >
                        <Bell size={16} style={{ color: colors.primary }} />
                      </div>
                      <div>
                        <h4
                          className="font-bold text-sm"
                          style={{ color: colors.text }}
                        >
                          Notification Preferences
                        </h4>
                        <div
                          style={{ color: colors.textLight }}
                          className="text-xs"
                        >
                          Customize what alerts you receive
                        </div>
                      </div>
                    </div>
                    <ChevronRight
                      size={18}
                      style={{ color: colors.textLight }}
                    />
                  </div>

                  {/* Biometric Security */}
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <div
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: colors.accentBg }}
                      >
                        <Lock size={16} style={{ color: colors.primary }} />
                      </div>
                      <div>
                        <h4
                          className="font-bold text-sm"
                          style={{ color: colors.text }}
                        >
                          Biometric Security
                        </h4>
                        <p
                          className="text-xs"
                          style={{ color: colors.textLight }}
                        >
                          Fingerprint or Face ID
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleBiometricToggle(!isBiometricEnabled)}
                      className={`w-12 h-6 rounded-full transition-colors relative ${
                        isBiometricEnabled ? "bg-lime-600" : "bg-gray-300"
                      }`}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                          isBiometricEnabled ? "right-1" : "left-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Support Section */}
            <div
              className="rounded-2xl p-4 sm:p-6 shadow-sm border"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }}
            >
              <div className="flex items-center gap-2 sm:gap-3 mb-4">
                <div
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: colors.primary }}
                >
                  <div className="text-white text-lg font-bold">?</div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3
                    className="font-bold text-sm sm:text-base truncate"
                    style={{ color: colors.text }}
                  >
                    Support
                  </h3>
                  <p
                    className="text-xs sm:text-sm truncate"
                    style={{ color: colors.textLight }}
                  >
                    Get help
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <button
                  className="w-full text-left p-2 sm:p-3 rounded-lg transition hover:opacity-80 text-xs sm:text-sm"
                  style={{ color: colors.text }}
                >
                  Help Center
                </button>
                <button
                  className="w-full text-left p-2 sm:p-3 rounded-lg transition hover:opacity-80 text-xs sm:text-sm"
                  style={{ color: colors.text }}
                >
                  Contact Support
                </button>
                <button
                  className="w-full text-left p-2 sm:p-3 rounded-lg transition hover:opacity-80 text-xs sm:text-sm"
                  style={{ color: colors.text }}
                >
                  Privacy Policy
                </button>
                <button
                  className="w-full text-left p-2 sm:p-3 rounded-lg transition hover:opacity-80 text-xs sm:text-sm"
                  style={{ color: colors.text }}
                >
                  Terms of Service
                </button>
              </div>
            </div>

            {/* Security Info */}
            <div
              className="rounded-2xl p-4 sm:p-6 border"
              style={{
                backgroundColor: colors.successBg,
                borderColor: colors.successBorder,
              }}
            >
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <SiThirdweb size={18} className="text-pink-500" />
                <h4
                  className="font-bold text-sm sm:text-base truncate"
                  style={{ color: colors.text }}
                >
                  Thirdweb Smart Wallet
                </h4>
              </div>
              <p
                className="text-xs sm:text-sm leading-relaxed"
                style={{ color: colors.textLight }}
              >
                Your funds are secured by Thirdweb's self-custodial smart
                wallet.
              </p>
            </div>

            {/* Logout Section */}
            <button
              onClick={() => setShowLogoutModal(true)}
              className="w-full rounded-2xl p-4 sm:p-6 shadow-sm border transition hover:opacity-90 flex items-center gap-2 sm:gap-3"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }}
            >
              <div
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: "#DC2626" }}
              >
                <LogOut className="text-white" size={18} />
              </div>
              <div className="flex-1 text-left min-w-0">
                <h3
                  className="font-bold text-sm sm:text-base"
                  style={{ color: "#DC2626" }}
                >
                  Logout
                </h3>
                <p
                  className="text-xs sm:text-sm"
                  style={{ color: colors.textLight }}
                >
                  Disconnect your wallet
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <LogoutModal
          isOpen={showLogoutModal}
          disabled={isDisconnecting}
          onConfirm={handleDisconnect}
          onCancel={() => setShowLogoutModal(false)}
          colors={colors}
        />
      )}
    </>
  );
};

export default Settings;
