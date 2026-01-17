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
        throw error;
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
        !processedEvents.current.has(`circle_started_${circleId}`)
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
        processedEvents.current.add(`circle_started_${circleId}`);
        saveProcessedEvents();
      }

      // Check if user needs to contribute (based on current round and last contribution)
      if (circle.isStarted && circle.currentRound && !circle.hasContributed) {
        const eventKey = `contribution_due_${circleId}_${circle.currentRound}`;
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
        !processedEvents.current.has(`circle_completed_${circleId}`)
      ) {
        addNotification({
          title: "Circle Completed",
          message: `Congratulations! "${circle.circleName}" has been completed successfully.`,
          type: "circle_payout",
          priority: "low",
          action: {
            action: "/transactions-history",
          },
        });
        processedEvents.current.add(`circle_completed_${circleId}`);
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
        const eventKey = `goal_completed_${goalId}`;
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
          const eventKey = `goal_reminder_${goalId}_7days`;
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

  // Check for new transaction events (payouts, late payments, etc.)
  useEffect(() => {
    if (!notificationsEnabled || !account || !transactions.length) return;

    // Get recent transactions (last 24 hours)
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

    transactions.forEach((tx) => {
      const txId = tx.id || tx.hash;
      if (!txId) return;

      const txTime = tx.timestamp ? Number(tx.timestamp) * 1000 : 0;
      if (txTime < oneDayAgo) return; // Skip old transactions

      // Payment received notification
      if (
        tx.type === "circle_payout" &&
        !processedEvents.current.has(`payout_${txId}`)
      ) {
        addNotification({
          title: "Payment Received",
          message: `You received ${tx.amount} from "${tx.circleName || "Circle"
            }" payout.`,
          type: "payment_received",
          priority: "medium",
          action: {
            action: "/transactions-history",
          },
        });
        processedEvents.current.add(`payout_${txId}`);
        saveProcessedEvents();
      }

      // Late payment notification
      if (
        tx.type === "late_payment" &&
        !processedEvents.current.has(`late_${txId}`)
      ) {
        addNotification({
          title: "Late Payment Penalty",
          message: `You were charged a late payment penalty for "${tx.circleName || "Circle"
            }".`,
          type: "payment_late",
          priority: "high",
          action: {
            action: "/transactions-history",
          },
        });
        processedEvents.current.add(`late_${txId}`);
        saveProcessedEvents();
      }

      // Contribution success notification
      if (
        tx.type === "contribution_made" &&
        !processedEvents.current.has(`contribution_${txId}`)
      ) {
        addNotification({
          title: "Contribution Successful ✅",
          message: `Your contribution of ${tx.amount} to "${tx.circleName || "Circle"
            }" was successful.`,
          type: "circle_member_contributed",
          priority: "medium",
          action: {
            action: "/transactions-history",
          },
        });
        processedEvents.current.add(`contribution_${txId}`);
        saveProcessedEvents();
      }
    });
  }, [transactions, notificationsEnabled, account, addNotification]);

  // Check for reputation events
  useEffect(() => {
    if (!notificationsEnabled || !account || !reputationHistory.length) return;

    reputationHistory.forEach((event) => {
      const eventKey = `rep_${event.type}_${event.id}`;
      if (!processedEvents.current.has(eventKey)) {
        const isIncrease = event.type === "increase";
        addNotification({
          title: isIncrease ? "Credit Score Boost! ⭐️" : "Credit Score Decreased ⚠️",
          message: `Your credit score ${isIncrease ? "increased" : "decreased"
            } by ${event.points} points. Reason: ${event.reason}`,
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
      const eventKey = `cat_change_${event.id}`;
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
      const eventKey = `ref_reward_${event.id}`;
      if (!processedEvents.current.has(eventKey)) {
        const amount = (Number(event.rewardAmount) / 1e18).toFixed(2);
        const friend = event.referee?.username || "A friend";

        addNotification({
          title: "Referral Bonus! 🎁",
          message: `You earned $${amount} because ${friend} completed their first goal!`,
          type: "payment_received",
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
