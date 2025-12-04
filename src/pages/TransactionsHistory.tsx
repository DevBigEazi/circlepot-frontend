import React from "react";
import { useNavigate } from "react-router";
import {
  History,
  Filter,
  Users,
  Target,
  AlertCircle,
  DollarSign,
  Building,
  CreditCard,
  Wallet,
  Send,
  Download,
} from "lucide-react";
import { useThemeColors } from "../hooks/useThemeColors";
import {
  useTransactionHistory,
  Transaction,
} from "../hooks/useTransactionHistory";
import NavBar from "../components/NavBar";

const TransactionsHistory: React.FC = () => {
  const navigate = useNavigate();
  const colors = useThemeColors();
  const { transactions, isLoading } = useTransactionHistory();

  // Get transaction icon based on type
  const getTransactionIcon = (type: Transaction["type"]) => {
    switch (type) {
      case "circle_contribution":
        return Users;
      case "circle_payout":
        return Users;
      case "goal_contribution":
        return Target;
      case "goal_withdrawal":
        return Target;
      case "goal_completion":
        return Target;
      case "late_payment":
        return AlertCircle;
      case "collateral_withdrawal":
        return DollarSign;
      case "cusd_send":
        return Send;
      case "cusd_receive":
        return Download;
      // Future transaction types (placeholders)
      case "bank_withdrawal" as any:
        return Building;
      case "bank_deposit" as any:
        return Building;
      case "card_deposit" as any:
        return CreditCard;
      case "crypto_deposit" as any:
        return Wallet;
      case "crypto_send" as any:
        return Wallet;
      default:
        return History;
    }
  };

  // Get transaction color based on type (for icon background)
  const getTransactionColor = (type: Transaction["type"]) => {
    switch (type) {
      case "circle_payout":
      case "goal_withdrawal":
      case "goal_completion":
      case "collateral_withdrawal":
      case "cusd_receive":
        return "bg-green-100 text-green-600";
      case "circle_contribution":
      case "goal_contribution":
        return "bg-orange-100 text-orange-600";
      case "late_payment":
      case "cusd_send":
        return "bg-red-100 text-red-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  // Get transaction title
  const getTransactionTitle = (transaction: Transaction) => {
    switch (transaction.type) {
      case "circle_contribution":
        return "Circle Contribution";
      case "circle_payout":
        return "Circle Payout";
      case "goal_contribution":
        return "Goal Contribution";
      case "goal_withdrawal":
        return "Goal Withdrawal";
      case "goal_completion":
        return "Goal Completed";
      case "late_payment":
        return "Late Payment Fee";
      case "collateral_withdrawal":
        return "Collateral Refund";
      case "cusd_send":
        return "Sent cUSD";
      case "cusd_receive":
        return "Received cUSD";
      default:
        return transaction.type;
    }
  };

  // Determine if transaction is incoming (positive) or outgoing (negative)
  const isIncoming = (type: Transaction["type"]) => {
    return [
      "circle_payout",
      "goal_withdrawal",
      "goal_completion",
      "collateral_withdrawal",
      "cusd_receive",
    ].includes(type);
  };

  // Format amount for display
  const formatAmount = (amount: bigint) => {
    return (Number(amount) / 1e18).toFixed(2);
  };

  // Format timestamp
  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Icon component
  const IconComponent = ({ type }: { type: Transaction["type"] }) => {
    const Icon = getTransactionIcon(type);
    const colorClass = getTransactionColor(type);

    return (
      <div
        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${colorClass}`}
      >
        <Icon size={20} />
      </div>
    );
  };

  return (
    <>
      <NavBar
        variant="minimal"
        onBack={() => navigate(-1)}
        title="Transaction History"
        titleIcon={<History size={24} />}
        colors={colors}
        actions={
          <button
            className="p-2 rounded-xl transition hover:opacity-80"
            style={{ color: colors.text }}
            onClick={() => {
              // TODO: Implement filter functionality
              console.log("Filter clicked");
            }}
          >
            <Filter size={18} />
          </button>
        }
      />

      <div
        className="min-h-screen pb-20"
        style={{ backgroundColor: colors.background }}
      >
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div
                className="animate-spin rounded-full h-12 w-12 border-b-2"
                style={{ borderColor: colors.primary }}
              ></div>
            </div>
          )}

          {/* Transactions List */}
          {!isLoading && transactions.length > 0 && (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="p-4 rounded-xl border hover:shadow-md transition-shadow"
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <IconComponent type={transaction.type} />
                      <div className="flex-1 min-w-0">
                        <div
                          className="font-semibold text-base truncate"
                          style={{ color: colors.text }}
                        >
                          {getTransactionTitle(transaction)}
                        </div>
                        <div
                          className="text-sm truncate"
                          style={{ color: colors.textLight }}
                        >
                          {formatDate(transaction.timestamp)}
                        </div>
                        {transaction.note && (
                          <div
                            className="text-xs truncate mt-1"
                            style={{ color: colors.primary }}
                          >
                            {transaction.note}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right ml-2">
                      <div
                        className={`text-lg font-bold ${
                          isIncoming(transaction.type)
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {isIncoming(transaction.type) ? "+" : "-"}
                        {formatAmount(transaction.amount)}{" "}
                        {transaction.currency}
                      </div>
                      {transaction.fee !== undefined &&
                        transaction.fee > 0n && (
                          <div
                            className="text-sm"
                            style={{ color: colors.textLight }}
                          >
                            Fee: {formatAmount(transaction.fee)} cUSD
                          </div>
                        )}
                    </div>
                  </div>

                  {/* Transaction Details */}
                  <div
                    className="border-t pt-3 mt-3"
                    style={{ borderColor: colors.border }}
                  >
                    <div className="text-sm space-y-1">
                      {transaction.circleName && (
                        <div className="flex justify-between">
                          <span style={{ color: colors.textLight }}>
                            Circle:
                          </span>
                          <span
                            style={{ color: colors.text }}
                            className="font-medium"
                          >
                            {transaction.circleName}
                          </span>
                        </div>
                      )}
                      {transaction.goalName && (
                        <div className="flex justify-between">
                          <span style={{ color: colors.textLight }}>Goal:</span>
                          <span
                            style={{ color: colors.text }}
                            className="font-medium"
                          >
                            {transaction.goalName}
                          </span>
                        </div>
                      )}
                      {transaction.round !== undefined && (
                        <div className="flex justify-between">
                          <span style={{ color: colors.textLight }}>
                            Round:
                          </span>
                          <span style={{ color: colors.text }}>
                            {transaction.round.toString()}
                          </span>
                        </div>
                      )}
                      {transaction.penalty !== undefined &&
                        transaction.penalty > 0n && (
                          <div className="flex justify-between">
                            <span style={{ color: colors.textLight }}>
                              Penalty:
                            </span>
                            <span className="text-red-600 font-medium">
                              {formatAmount(transaction.penalty)} cUSD
                            </span>
                          </div>
                        )}
                      <div className="flex justify-between">
                        <span style={{ color: colors.textLight }}>Status:</span>
                        <span className="text-green-600 font-medium capitalize">
                          {transaction.status}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span style={{ color: colors.textLight }}>
                          Transaction:
                        </span>
                        <a
                          href={`https://celo-sepolia.blockscout.com/tx/${transaction.transactionHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs truncate max-w-[200px] hover:underline"
                          style={{ color: colors.primary }}
                        >
                          {transaction.transactionHash.slice(0, 10)}...
                          {transaction.transactionHash.slice(-8)}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && transactions.length === 0 && (
            <div className="text-center py-12">
              <History
                size={48}
                style={{ color: colors.textLight }}
                className="mx-auto mb-4 opacity-50"
              />
              <h3
                className="text-lg font-semibold mb-2"
                style={{ color: colors.text }}
              >
                No Transactions Yet
              </h3>
              <p className="text-sm" style={{ color: colors.textLight }}>
                Your transaction history will appear here once you start using
                CirclePot
              </p>
            </div>
          )}

          {/* Summary */}
          {!isLoading && transactions.length > 0 && (
            <div
              className="mt-8 p-4 rounded-xl border"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }}
            >
              <div className="flex justify-between items-center text-sm">
                <span style={{ color: colors.textLight }}>
                  Total Transactions:
                </span>
                <span style={{ color: colors.text }} className="font-semibold">
                  {transactions.length}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default TransactionsHistory;
