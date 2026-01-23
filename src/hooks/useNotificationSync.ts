import { useEffect, useRef } from "react";
import { useNotifications } from "../contexts/NotificationsContext";
import { useActiveAccount } from "thirdweb/react";

/**
 * Hook to sync app events with notifications
 * This hook monitors various data sources and creates notifications for important events
 */
export const useNotificationSync = (
  circles: any[] = [],
  goals: any[] = [],
  transactions: any[] = [],
  reputationHistory: any[] = [],
  categoryChanges: any[] = [],
  referralRewards: any[] = []
) => {
  const { addNotification, notificationsEnabled } = useNotifications();
  const account = useActiveAccount();
  const processedEvents = useRef<Set<string>>(new Set());

  // Load processed events from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("processed_notification_events");
    if (stored) {
      try {
        const events = JSON.parse(stored);
        processedEvents.current = new Set(events);
      } catch (error) {
        //console.error("Failed to parse stored processed events:", error);
        processedEvents.current = new Set();
      }
    }
  }, []);

  // Save processed events to localStorage
  const saveProcessedEvents = () => {
    localStorage.setItem(
      "processed_notification_events",
      JSON.stringify(Array.from(processedEvents.current))
    );
  };

  // Check for new circle events
  useEffect(() => {
    if (!notificationsEnabled || !account || !circles.length) return;

    circles.forEach((circle) => {
      const circleId = circle.id || circle.circleId?.toString();
      if (!circleId) return;

      // Circle started notification
      if (
        circle.isStarted &&
        !processedEvents.current.has(`circle_started_v6_${circleId}`)
      ) {
        addNotification({
          title: "Circle Started",
          message: `"${circle.circleName}" has started. First contribution is due soon.`,
          type: "circle_started",
          priority: "medium",
          action: {
            action: "/",
          },
        });
        processedEvents.current.add(`circle_started_v6_${circleId}`);
        saveProcessedEvents();
      }

      // Contribution due (Reminders)
      if (circle.isStarted && circle.currentRound && !circle.hasContributed) {
        const eventKey = `contribution_due_v6_${circleId}_${circle.currentRound}`;
        if (!processedEvents.current.has(eventKey)) {
          addNotification({
            title: "Contribution Due",
            message: `Your contribution for "${circle.circleName}" is due for round ${circle.currentRound}.`,
            type: "contribution_due",
            priority: "high",
            action: {
              action: "/",
            },
          });
          processedEvents.current.add(eventKey);
          saveProcessedEvents();
        }
      }

      // Circle completed notification
      if (
        circle.isCompleted &&
        !processedEvents.current.has(`circle_completed_v6_${circleId}`)
      ) {
        addNotification({
          title: "Circle Completed",
          message: `Congratulations! "${circle.circleName}" has been completed successfully.`,
          type: "circle_payout",
          priority: "low",
          action: {
            action: "/circles",
          },
        });
        processedEvents.current.add(`circle_completed_v6_${circleId}`);
        saveProcessedEvents();
      }
    });
  }, [circles, notificationsEnabled, account, addNotification]);

  // Check for new goal events
  useEffect(() => {
    if (!notificationsEnabled || !account || !goals.length) return;

    goals.forEach((goal) => {
      const goalId = goal.id || goal.goalId?.toString();
      if (!goalId) return;

      // Goal completed notification
      if (!goal.isActive && goal.currentAmount >= goal.goalAmount) {
        const eventKey = `goal_completed_v6_${goalId}`;
        if (!processedEvents.current.has(eventKey)) {
          addNotification({
            title: "Goal Completed",
            message: `Congratulations! You completed your "${goal.goalName}" goal.`,
            type: "goal_completed",
            priority: "low",
            action: {
              action: "/goals",
            },
          });
          processedEvents.current.add(eventKey);
          saveProcessedEvents();
        }
      }

      // Goal reminder (if active and close to deadline)
      if (goal.isActive && goal.deadline) {
        const deadline = new Date(Number(goal.deadline) * 1000);
        const now = new Date();
        const daysUntilDeadline = Math.floor(
          (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Remind 7 days before deadline
        if (daysUntilDeadline <= 7 && daysUntilDeadline > 0) {
          const eventKey = `goal_reminder_v6_${goalId}_7days`;
          if (!processedEvents.current.has(eventKey)) {
            addNotification({
              title: "Goal Deadline Approaching",
              message: `Your "${goal.goalName}" goal deadline is in ${daysUntilDeadline} days.`,
              type: "goal_reminder",
              priority: "medium",
              action: {
                action: "/goals",
              },
            });
            processedEvents.current.add(eventKey);
            saveProcessedEvents();
          }
        }
      }
    });
  }, [goals, notificationsEnabled, account, addNotification]);

  // Check for new transaction events (payouts, late payments, contributions, etc.)
  useEffect(() => {
    if (!notificationsEnabled || !account || !transactions.length) return;

    // Get recent transactions (last 30 days) to ensure all recent activity is picked up
    const lookbackPeriod = 30 * 24 * 60 * 60 * 1000;
    const sinceTimestamp = Date.now() - lookbackPeriod;

    transactions.forEach((tx) => {
      const txId = tx.id || tx.hash;
      if (!txId) return;

      const txTime = tx.timestamp ? Number(tx.timestamp) * 1000 : 0;
      if (txTime < sinceTimestamp) return; // Skip old transactions

      const isMe = tx.userId && account?.address
        ? tx.userId.toLowerCase() === account.address.toLowerCase()
        : false;

      // 1. Payouts
      if (tx.type === "circle_payout") {
        const eventKey = `payout_v6_${txId}_${isMe}`;
        if (!processedEvents.current.has(eventKey)) {
          //console.log(`[NotificationSync] Adding Payout Notification: ID=${txId}, isMe=${isMe}, Round=${tx.round}`);
          addNotification({
            title: isMe ? "Payment Received! 💰" : "Circle Payout Completed ✅",
            message: isMe
              ? `You received ${tx.amount} from "${tx.circleName || "Circle"}" payout (Round ${tx.round}).`
              : `${tx.userName || "A member"} received their payout of ${tx.amount} from "${tx.circleName || "Circle"}" (Round ${tx.round}).`,
            type: isMe ? "circle_payout" : "circle_member_payout",
            priority: isMe ? "high" : "medium",
            action: {
              action: isMe ? "/transactions-history" : "/circles",
            },
          });
          processedEvents.current.add(eventKey);
          saveProcessedEvents();
        }
      }

      // 2. Late payments
      if (tx.type === "late_payment") {
        const eventKey = `late_v6_${txId}_${isMe}`;
        if (!processedEvents.current.has(eventKey)) {
          const roundStr = tx.round ? ` (Round ${tx.round.toString()})` : "";
          //console.log(`[NotificationSync] Adding Late Payment Notification: ID=${txId}, isMe=${isMe}, Round=${tx.round}`);
          addNotification({
            title: isMe ? "Late Payment Penalty" : "Member Late Payment",
            message: isMe
              ? `You were charged a late payment penalty for "${tx.circleName || "Circle"}"${roundStr}.`
              : `${tx.userName || "A member"} was charged a late penalty in "${tx.circleName || "Circle"}"${roundStr}.`,
            type: "payment_late",
            priority: isMe ? "high" : "medium",
            action: {
              action: isMe ? "/transactions-history" : "/circles",
            },
          });
          processedEvents.current.add(eventKey);
          saveProcessedEvents();
        }
      }

      // 3. Member forfeitures
      if (tx.type === "member_forfeited") {
        const eventKey = `forfeit_v6_${txId}_${isMe}`;
        if (!processedEvents.current.has(eventKey)) {
          //console.log(`[NotificationSync] Adding Forfeit Notification: ID=${txId}, isMe=${isMe}, Round=${tx.round}`);
          addNotification({
            title: isMe ? "You have been forfeited ⚠️" : "Member Forfeited",
            message: isMe
              ? `You were forfeited from "${tx.circleName || "Circle"}". Deduction: ${tx.amount} (Round ${tx.round}).`
              : `${tx.userName || "A member"} has been forfeited from "${tx.circleName || "Circle"}" (Round ${tx.round}).`,
            type: "member_forfeited",
            priority: isMe ? "high" : "medium",
            action: {
              action: "/circles",
            },
          });
          processedEvents.current.add(eventKey);
          saveProcessedEvents();
        }
      }

      // 4. Collateral withdrawals
      if (tx.type === "collateral_withdrawn") {
        const eventKey = `collateral_v6_${txId}_${isMe}`;
        if (!processedEvents.current.has(eventKey)) {
          //console.log(`[NotificationSync] Adding Collateral Notification: ID=${txId}, isMe=${isMe}`);
          addNotification({
            title: isMe ? "Collateral Returned 💵" : "Member Withdrew Collateral",
            message: isMe
              ? `Your collateral of ${tx.amount} from "${tx.circleName || "Circle"}" has been returned.`
              : `${tx.userName || "A member"} withdrew their collateral from "${tx.circleName || "Circle"}".`,
            type: isMe ? "collateral_returned" : "circle_member_withdrew",
            priority: isMe ? "high" : "medium",
            action: {
              action: isMe ? "/transactions-history" : "/circles",
            },
          });
          processedEvents.current.add(eventKey);
          saveProcessedEvents();
        }
      }

      // 5. Member Contributions
      if (tx.type === "contribution_made") {
        const eventKey = `contribution_v6_${txId}_${isMe}_R${tx.round}`;
        if (!processedEvents.current.has(eventKey)) {
          const roundStr = tx.round ? ` (Round ${tx.round})` : "";
          const msg = isMe
            ? `Your contribution of ${tx.amount} to "${tx.circleName || "Circle"}" was successful${roundStr}.`
            : `${tx.userName || "A member"} contributed ${tx.amount} to "${tx.circleName || "Circle"}"${roundStr}.`;

          //console.log(`[NotificationSync] Adding Contribution Notification: ID=${txId}, isMe=${isMe}, Round=${tx.round}`);
          addNotification({
            title: isMe ? "Contribution Successful ✅" : "Circle Contribution Made",
            message: msg,
            type: isMe ? "circle_contribution_self" : "circle_member_contributed",
            priority: isMe ? "high" : "medium",
            action: {
              action: isMe ? "/transactions-history" : "/circles",
            },
          });
          processedEvents.current.add(eventKey);
          saveProcessedEvents();
        }
      }
    });
  }, [transactions, notificationsEnabled, account, addNotification]);

  // Check for reputation events
  useEffect(() => {
    if (!notificationsEnabled || !account || !reputationHistory.length) return;

    reputationHistory.forEach((event) => {
      const eventKey = `rep_v6_${event.type}_${event.id}`;
      if (!processedEvents.current.has(eventKey)) {
        const isIncrease = event.type === "increase";
        addNotification({
          title: isIncrease ? "Credit Score Boost! ⭐️" : "Credit Score Decreased ⚠️",
          message: `Your credit score ${isIncrease ? "increased" : "decreased"}. Reason: ${event.reason}`,
          type: "credit_score_changed",
          priority: isIncrease ? "medium" : "high",
          action: { action: "/profile" },
          data: { points: event.points, reason: event.reason },
        });
        processedEvents.current.add(eventKey);
        saveProcessedEvents();
      }
    });
  }, [reputationHistory, notificationsEnabled, account, addNotification]);

  // Check for category changes
  useEffect(() => {
    if (!notificationsEnabled || !account || !categoryChanges.length) return;

    const categories = ["Newbie", "Basic", "Bronze", "Silver", "Gold", "Platinum"];
    categoryChanges.forEach((event) => {
      const eventKey = `cat_change_v6_${event.id}`;
      if (!processedEvents.current.has(eventKey)) {
        const newCat = categories[event.newCategory] || "Elite";
        const improved = event.newCategory > event.oldCategory;

        addNotification({
          title: improved ? "Category Level Up! 📈" : "Category Changed",
          message: improved
            ? `Congratulations! You've been promoted to the ${newCat} category.`
            : `Your credit category has changed to ${newCat}.`,
          type: "credit_score_changed",
          priority: "high",
          action: { action: "/profile" },
          data: { newCategory: event.newCategory },
        });
        processedEvents.current.add(eventKey);
        saveProcessedEvents();
      }
    });
  }, [categoryChanges, notificationsEnabled, account, addNotification]);

  // Check for referral rewards
  useEffect(() => {
    if (!notificationsEnabled || !account || !referralRewards.length) return;

    referralRewards.forEach((event) => {
      const eventKey = `ref_reward_v6_${event.id}`;
      if (!processedEvents.current.has(eventKey)) {
        const amount = (Number(event.rewardAmount) / 1e18).toFixed(2);
        const friend = event.referee?.username || "A friend";

        addNotification({
          title: "Referral Bonus! 🎁",
          message: `You earned $${amount} because ${friend} completed their first goal!`,
          type: "referral_reward",
          priority: "high",
          action: { action: "/profile" },
          data: { amount: event.rewardAmount },
        });
        processedEvents.current.add(eventKey);
        saveProcessedEvents();
      }
    });
  }, [referralRewards, notificationsEnabled, account, addNotification]);

  return {
    processedEventsCount: processedEvents.current.size,
    clearProcessedEvents: () => {
      processedEvents.current.clear();
      localStorage.removeItem("processed_notification_events");
    },
  };
};
