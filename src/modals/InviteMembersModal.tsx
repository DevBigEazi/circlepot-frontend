import React, { useState } from "react";
import { X, UserPlus, Loader2, Check, AlertCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { client } from "../thirdwebClient";
import { useUserProfile } from "../hooks/useUserProfile";

interface InviteMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  circleId: bigint;
  circleName: string;
  colors: any;
  onInvite: (circleId: bigint, addresses: string[]) => Promise<any>;
}

interface InviteeInput {
  id: string;
  value: string;
  status: "idle" | "validating" | "valid" | "invalid";
  address?: string;
  displayName?: string;
  error?: string;
}

const InviteMembersModal: React.FC<InviteMembersModalProps> = ({
  isOpen,
  onClose,
  circleId,
  circleName,
  colors,
  onInvite,
}) => {
  const { getProfileByAccountId, getProfileByEmail, getProfileByUsername } =
    useUserProfile(client);

  const [invitees, setInvitees] = useState<InviteeInput[]>([
    { id: "1", value: "", status: "idle" },
  ]);
  const [isInviting, setIsInviting] = useState(false);

  const addInviteeField = () => {
    const newId = (invitees.length + 1).toString();
    setInvitees([...invitees, { id: newId, value: "", status: "idle" }]);
  };

  const removeInviteeField = (id: string) => {
    if (invitees.length > 1) {
      setInvitees(invitees.filter((inv) => inv.id !== id));
    }
  };

  const validateInvitee = async (id: string, value: string) => {
    if (!value.trim()) {
      updateInvitee(id, {
        status: "idle",
        address: undefined,
        error: undefined,
      });
      return;
    }

    updateInvitee(id, { status: "validating" });

    try {
      let profile = null;
      let searchType = "";

      if (value.includes("@")) {
        // Email
        searchType = "email";
        profile = await getProfileByEmail(value.toLowerCase());
      } else if (/^\d+$/.test(value)) {
        // AccountId (numeric)
        searchType = "accountId";
        profile = await getProfileByAccountId(value);
      } else {
        // Username
        searchType = "username";
        profile = await getProfileByUsername(value);
      }

      if (profile && profile.id) {
        updateInvitee(id, {
          status: "valid",
          address: profile.id,
          displayName: `${profile.username} (${profile.fullName})`,
          error: undefined,
        });
      } else {
        const errorMessage =
          searchType === "email"
            ? "No user found with this email"
            : searchType === "accountId"
            ? "No user found with this Account ID"
            : searchType === "username"
            ? "No user found with this username"
            : "User not found";

        updateInvitee(id, {
          status: "invalid",
          address: undefined,
          error: errorMessage,
        });
      }
    } catch (err) {
      updateInvitee(id, {
        status: "invalid",
        address: undefined,
        error: "Failed to validate user. Please try again.",
      });
    }
  };

  const updateInvitee = (id: string, updates: Partial<InviteeInput>) => {
    setInvitees((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, ...updates } : inv))
    );
  };

  const handleInputChange = (id: string, value: string) => {
    updateInvitee(id, { value });
    // Debounce validation
    const timeoutId = setTimeout(() => {
      validateInvitee(id, value);
    }, 500);
    return () => clearTimeout(timeoutId);
  };

  const handleInvite = async () => {
    // Get all valid addresses
    const validInvitees = invitees.filter(
      (inv) => inv.status === "valid" && inv.address
    );

    if (validInvitees.length === 0) {
      toast.custom(
        () => (
          <div
            className="rounded-2xl p-4 shadow-lg border-2 border-red-500 flex items-center gap-3 max-w-sm"
            style={{
              backgroundColor: "#fee2e2",
              animation: `slideIn 0.3s ease-out`,
            }}
          >
            <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
            <span className="text-sm font-semibold text-red-600">
              Please add at least one valid user to invite
            </span>
          </div>
        ),
        { duration: 3000, position: "top-center" }
      );
      return;
    }

    // Check for duplicates
    const addresses = validInvitees.map((inv) => inv.address!);
    const uniqueAddresses = [...new Set(addresses)];

    if (addresses.length !== uniqueAddresses.length) {
      toast.custom(
        () => (
          <div
            className="rounded-2xl p-4 shadow-lg border-2 border-red-500 flex items-center gap-3 max-w-sm"
            style={{
              backgroundColor: "#fee2e2",
              animation: `slideIn 0.3s ease-out`,
            }}
          >
            <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
            <span className="text-sm font-semibold text-red-600">
              You have duplicate users in the list
            </span>
          </div>
        ),
        { duration: 3000, position: "top-center" }
      );
      return;
    }

    try {
      setIsInviting(true);
      await onInvite(circleId, uniqueAddresses);

      toast.custom(
        () => (
          <div
            className="rounded-2xl p-4 shadow-lg border-2 border-green-500 flex items-center gap-3 max-w-sm"
            style={{
              backgroundColor: "#dcfce7",
              animation: `slideIn 0.3s ease-out`,
            }}
          >
            <Check className="w-6 h-6 text-green-600 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-green-800">
                Invitations Sent!
              </h3>
              <p className="text-sm text-green-700">
                {validCount} member{validCount !== 1 ? "s" : ""} invited
                successfully
              </p>
            </div>
          </div>
        ),
        { duration: 3000, position: "top-center" }
      );

      // Close modal after 2 seconds
      setTimeout(() => {
        onClose();
        // Reset state
        setInvitees([{ id: "1", value: "", status: "idle" }]);
      }, 2000);
    } catch (err: any) {
      const errorMessage = err.message || "Failed to invite members";

      toast.custom(
        () => (
          <div
            className="rounded-2xl p-4 shadow-lg border-2 border-red-500 flex items-center gap-3 max-w-sm"
            style={{
              backgroundColor: "#fee2e2",
              animation: `slideIn 0.3s ease-out`,
            }}
          >
            <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
            <div>
              <span className="text-sm font-semibold text-red-600 block">
                Error Inviting Members
              </span>
              <span className="text-xs text-red-500">{errorMessage}</span>
            </div>
          </div>
        ),
        { duration: 4000, position: "top-center" }
      );
    } finally {
      setIsInviting(false);
    }
  };

  if (!isOpen) return null;

  const validCount = invitees.filter((inv) => inv.status === "valid").length;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div
        className="rounded-2xl max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: colors.surface }}
      >
        {/* Header */}
        <div
          className="p-6 border-b sticky top-0 z-10"
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.border,
          }}
        >
          <div className="flex justify-between items-start">
            <div>
              <h2
                className="text-2xl font-bold mb-1"
                style={{ color: colors.text }}
              >
                Invite Members
              </h2>
              <p className="text-sm" style={{ color: colors.textLight }}>
                to <span className="font-semibold">{circleName}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl transition hover:opacity-80"
              style={{ color: colors.text }}
              disabled={isInviting}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Instructions */}
          <div
            className="p-4 rounded-xl mb-6"
            style={{ backgroundColor: colors.accentBg }}
          >
            <h3
              className="font-semibold mb-2 flex items-center gap-2"
              style={{ color: colors.text }}
            >
              <AlertCircle size={18} style={{ color: colors.primary }} />
              How to Invite
            </h3>
            <p className="text-sm mb-2" style={{ color: colors.textLight }}>
              Enter the <strong>Account ID</strong>, <strong>Email</strong>, or{" "}
              <strong>Username</strong> of the people you want to invite:
            </p>
            <ul
              className="text-sm space-y-1"
              style={{ color: colors.textLight }}
            >
              <li>
                • Account ID: e.g.,{" "}
                <code className="px-1 py-0.5 rounded bg-black/10">12345</code>
              </li>
              <li>
                • Email: e.g.,{" "}
                <code className="px-1 py-0.5 rounded bg-black/10">
                  user@example.com
                </code>
              </li>
              <li>
                • Username: e.g.,{" "}
                <code className="px-1 py-0.5 rounded bg-black/10">johndoe</code>
              </li>
            </ul>
          </div>

          {/* Invitee Inputs */}
          <div className="space-y-3 mb-6">
            {invitees.map((invitee) => (
              <div key={invitee.id} className="flex gap-2">
                <div className="flex-1">
                  <div className="relative">
                    <input
                      type="text"
                      value={invitee.value}
                      onChange={(e) =>
                        handleInputChange(invitee.id, e.target.value)
                      }
                      placeholder="Enter Account ID, Email, or Username"
                      disabled={isInviting}
                      className="w-full px-4 py-3 rounded-xl border transition focus:outline-none focus:ring-2"
                      style={{
                        backgroundColor: colors.background,
                        borderColor:
                          invitee.status === "valid"
                            ? "#10B981"
                            : invitee.status === "invalid"
                            ? "#EF4444"
                            : colors.border,
                        color: colors.text,
                      }}
                    />
                    {invitee.status === "validating" && (
                      <Loader2
                        className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin"
                        size={20}
                        style={{ color: colors.primary }}
                      />
                    )}
                    {invitee.status === "valid" && (
                      <Check
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        size={20}
                        style={{ color: "#10B981" }}
                      />
                    )}
                    {invitee.status === "invalid" && (
                      <AlertCircle
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        size={20}
                        style={{ color: "#EF4444" }}
                      />
                    )}
                  </div>
                  {invitee.status === "valid" && invitee.displayName && (
                    <p
                      className="text-xs mt-1 ml-1"
                      style={{ color: colors.primary }}
                    >
                      ✓ {invitee.displayName}
                    </p>
                  )}
                  {invitee.status === "invalid" && invitee.error && (
                    <p className="text-xs mt-1 ml-1 text-red-500">
                      {invitee.error}
                    </p>
                  )}
                </div>
                {invitees.length > 1 && (
                  <button
                    onClick={() => removeInviteeField(invitee.id)}
                    disabled={isInviting}
                    className="p-3 rounded-xl border transition hover:bg-red-50 dark:hover:bg-red-950"
                    style={{ borderColor: colors.border }}
                  >
                    <Trash2 size={20} className="text-red-500" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Add More Button */}
          <button
            onClick={addInviteeField}
            disabled={isInviting}
            className="w-full py-3 rounded-xl border-2 border-dashed transition hover:opacity-80 flex items-center justify-center gap-2"
            style={{ borderColor: colors.border, color: colors.text }}
          >
            <UserPlus size={20} />
            <span>Add Another Person</span>
          </button>
        </div>

        {/* Footer */}
        <div
          className="p-6 border-t flex gap-3"
          style={{ borderColor: colors.border }}
        >
          <button
            onClick={onClose}
            disabled={isInviting}
            className="flex-1 px-2 py-3 rounded-xl font-semibold text-sm transition border hover:opacity-80"
            style={{ borderColor: colors.border, color: colors.text }}
          >
            Cancel
          </button>
          <button
            onClick={handleInvite}
            disabled={isInviting || validCount === 0}
            className="flex-1 px-2 py-3 rounded-xl font-semibold text-sm text-white transition shadow-sm hover:shadow-md disabled:opacity-50 flex items-center justify-center gap-1"
            style={{ background: colors.gradient }}
          >
            {isInviting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Inviting...
              </>
            ) : (
              <>
                <UserPlus size={16} />
                Invite{" "}
                {validCount > 0
                  ? `${validCount} Member${validCount !== 1 ? "s" : ""}`
                  : "Members"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InviteMembersModal;
