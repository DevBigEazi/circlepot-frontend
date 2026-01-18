// Notification event types
export type NotificationType =
    // Circle notifications
    | "circle_member_joined"
    | "circle_payout"
    | "circle_member_payout"
    | "circle_member_contributed"
    | "circle_member_withdrew"
    | "circle_started"
    | "circle_completed"
    | "circle_dead"
    | "contribution_due"
    | "vote_required"
    | "vote_executed"
    | "member_forfeited"
    | "late_payment_warning"
    | "position_assigned"
    | "circle_contribution_self"
    // Goal notifications
    | "goal_deadline_2days"
    | "goal_deadline_1day"
    | "goal_completed"
    | "goal_contribution_due"
    | "goal_milestone"
    | "goal_reminder"
    // Social notifications
    | "circle_invite"
    | "invite_accepted"
    // Financial notifications
    | "payment_received"
    | "payment_late"
    | "credit_score_changed"
    | "withdrawal_fee_applied"
    | "collateral_returned"
    // System notifications
    | "system_maintenance"
    | "system_update"
    | "security_alert"
    | "circle_joined"
    | "circle_voting"
    | "referral_reward";

export type NotificationPriority = "high" | "medium" | "low";

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: NotificationType;
    priority: NotificationPriority;
    read: boolean;
    timeAgo: string;
    timestamp: number;
    action?: {
        label?: string;
        action: string;
    };
    data?: Record<string, any>;
}

export interface NotificationPreferences {
    pushEnabled: boolean;
    inAppEnabled: boolean;

    // Circle notifications
    circleMemberJoined: boolean;
    circleMemberPayout: boolean;
    circleMemberContributed: boolean;
    circleMemberWithdrew: boolean;
    circleStarted: boolean;
    circleCompleted: boolean;
    circleDead: boolean;
    contributionDue: boolean;
    voteRequired: boolean;
    voteExecuted: boolean;
    memberForfeited: boolean;
    latePaymentWarning: boolean;
    paymentLate: boolean;
    positionAssigned: boolean;
    circleJoined: boolean;
    circleVoting: boolean;
    circleContributionSelf: boolean;

    // Goal notifications
    goalDeadline2Days: boolean;
    goalDeadline1Day: boolean;
    goalCompleted: boolean;
    goalContributionDue: boolean;
    goalMilestone: boolean;
    goalReminder: boolean;

    // Social notifications
    circleInvite: boolean;
    inviteAccepted: boolean;

    // Financial notifications
    paymentReceived: boolean;
    creditScoreChanged: boolean;
    withdrawalFeeApplied: boolean;
    collateralReturned: boolean;

    // System notifications
    systemMaintenance: boolean;
    systemUpdate: boolean;
    securityAlert: boolean;
    referralReward: boolean;
}

export interface PushSubscription {
    endpoint: string;
    keys: {
        p256dh: string;
        auth: string;
    };
}

export interface PushSubscriptionData {
    subscription: PushSubscription;
    userAddress: string;
    preferences: NotificationPreferences;
}

export interface BackendNotificationPayload {
    title: string;
    message: string;
    type: NotificationType;
    priority: NotificationPriority;
    action?: {
        label?: string;
        action: string;
    };
    data?: Record<string, any>;
    userAddresses: string[]; // Array of user wallet addresses to notify
}

// Notification configuration for each type
export interface NotificationConfig {
    type: NotificationType;
    defaultPriority: NotificationPriority;
    defaultAction?: string;
    icon?: string;
    badge?: string;
    requiresAction?: boolean;
}

export const NOTIFICATION_CONFIGS: Record<NotificationType, NotificationConfig> = {
    // Circle notifications
    circle_member_joined: {
        type: "circle_member_joined",
        defaultPriority: "medium",
        defaultAction: "/",
        requiresAction: false,
    },
    circle_payout: {
        type: "circle_payout",
        defaultPriority: "medium",
        defaultAction: "/transactions-history",
        requiresAction: false,
    },
    circle_member_payout: {
        type: "circle_member_payout",
        defaultPriority: "medium",
        defaultAction: "/circles",
        requiresAction: false,
    },
    circle_member_contributed: {
        type: "circle_member_contributed",
        defaultPriority: "low",
        defaultAction: "/",
        requiresAction: false,
    },
    circle_member_withdrew: {
        type: "circle_member_withdrew",
        defaultPriority: "medium",
        defaultAction: "/",
        requiresAction: false,
    },
    circle_started: {
        type: "circle_started",
        defaultPriority: "high",
        defaultAction: "/",
        requiresAction: true,
    },
    circle_completed: {
        type: "circle_completed",
        defaultPriority: "medium",
        defaultAction: "/transactions-history",
        requiresAction: false,
    },
    circle_dead: {
        type: "circle_dead",
        defaultPriority: "high",
        defaultAction: "/",
        requiresAction: true,
    },
    contribution_due: {
        type: "contribution_due",
        defaultPriority: "high",
        defaultAction: "/",
        requiresAction: true,
    },
    vote_required: {
        type: "vote_required",
        defaultPriority: "high",
        defaultAction: "/",
        requiresAction: true,
    },
    vote_executed: {
        type: "vote_executed",
        defaultPriority: "medium",
        defaultAction: "/",
        requiresAction: false,
    },
    member_forfeited: {
        type: "member_forfeited",
        defaultPriority: "high",
        defaultAction: "/",
        requiresAction: true,
    },
    late_payment_warning: {
        type: "late_payment_warning",
        defaultPriority: "high",
        defaultAction: "/",
        requiresAction: true,
    },
    position_assigned: {
        type: "position_assigned",
        defaultPriority: "medium",
        defaultAction: "/",
        requiresAction: false,
    },

    // Goal notifications
    goal_deadline_2days: {
        type: "goal_deadline_2days",
        defaultPriority: "medium",
        defaultAction: "/goals",
        requiresAction: false,
    },
    goal_deadline_1day: {
        type: "goal_deadline_1day",
        defaultPriority: "high",
        defaultAction: "/goals",
        requiresAction: true,
    },
    goal_completed: {
        type: "goal_completed",
        defaultPriority: "medium",
        defaultAction: "/goals",
        requiresAction: false,
    },
    goal_contribution_due: {
        type: "goal_contribution_due",
        defaultPriority: "medium",
        defaultAction: "/goals",
        requiresAction: true,
    },
    goal_milestone: {
        type: "goal_milestone",
        defaultPriority: "low",
        defaultAction: "/goals",
        requiresAction: false,
    },
    goal_reminder: {
        type: "goal_reminder",
        defaultPriority: "medium",
        defaultAction: "/goals",
        requiresAction: false,
    },

    // Social notifications
    circle_invite: {
        type: "circle_invite",
        defaultPriority: "high",
        defaultAction: "/browse",
        requiresAction: true,
    },
    invite_accepted: {
        type: "invite_accepted",
        defaultPriority: "low",
        defaultAction: "/leaderboard",
        requiresAction: false,
    },

    // Financial notifications
    payment_received: {
        type: "payment_received",
        defaultPriority: "medium",
        defaultAction: "/transactions-history",
        requiresAction: false,
    },
    payment_late: {
        type: "payment_late",
        defaultPriority: "high",
        defaultAction: "/transactions-history",
        requiresAction: true,
    },
    credit_score_changed: {
        type: "credit_score_changed",
        defaultPriority: "medium",
        defaultAction: "/",
        requiresAction: false,
    },
    withdrawal_fee_applied: {
        type: "withdrawal_fee_applied",
        defaultPriority: "low",
        defaultAction: "/transactions-history",
        requiresAction: false,
    },
    collateral_returned: {
        type: "collateral_returned",
        defaultPriority: "medium",
        defaultAction: "/transactions-history",
        requiresAction: false,
    },

    // System notifications
    system_maintenance: {
        type: "system_maintenance",
        defaultPriority: "medium",
        defaultAction: "/",
        requiresAction: false,
    },
    system_update: {
        type: "system_update",
        defaultPriority: "low",
        defaultAction: "/",
        requiresAction: false,
    },
    security_alert: {
        type: "security_alert",
        defaultPriority: "high",
        defaultAction: "/settings",
        requiresAction: true,
    },
    circle_joined: {
        type: "circle_joined",
        defaultPriority: "medium",
        defaultAction: "/",
        requiresAction: false,
    },
    circle_voting: {
        type: "circle_voting",
        defaultPriority: "medium",
        defaultAction: "/",
        requiresAction: true,
    },
    referral_reward: {
        type: "referral_reward",
        defaultPriority: "medium",
        defaultAction: "/profile",
        requiresAction: false,
    },
    circle_contribution_self: {
        type: "circle_contribution_self",
        defaultPriority: "medium",
        defaultAction: "/transactions-history",
        requiresAction: false,
    },
};

// Default notification preferences
export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
    pushEnabled: true,
    inAppEnabled: true,

    // Circle notifications (high priority enabled by default)
    circleMemberJoined: true,
    circleMemberPayout: true,
    circleMemberContributed: true,
    circleMemberWithdrew: true,
    circleStarted: true,
    circleCompleted: true,
    circleDead: true,
    contributionDue: true,
    voteRequired: true,
    voteExecuted: true,
    memberForfeited: true,
    latePaymentWarning: true,
    paymentLate: true,
    positionAssigned: true,
    circleJoined: true,
    circleVoting: true,
    circleContributionSelf: true,

    // Goal notifications
    goalDeadline2Days: true,
    goalDeadline1Day: true,
    goalCompleted: true,
    goalContributionDue: true,
    goalMilestone: false,
    goalReminder: true,

    // Social notifications
    circleInvite: true,
    inviteAccepted: false,

    // Financial notifications
    paymentReceived: true,
    creditScoreChanged: true,
    withdrawalFeeApplied: false,
    collateralReturned: true,

    // System notifications
    systemMaintenance: true,
    systemUpdate: true,
    securityAlert: true,
    referralReward: true,
};
