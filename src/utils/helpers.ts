import { ActiveCircle } from "../interfaces/interfaces";

// Convert wei to human readable format (assuming 18 decimals)
export const formatBalance = (value: bigint | number) => {
    const num = typeof value === 'bigint' ? Number(value) : value
    return num / 1e18
}

// Helper function to format blockchain timestamp to readable date
export const formatTimestamp = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
};

// Helper function to calculate next contribution date based on last contribution
export const calculateNextContribution = (
    goalId: bigint,
    frequency: number,
    contributions: Array<{ goalId: bigint; timestamp: bigint }>
) => {
    const goalContributions = contributions.filter((c) => c.goalId === goalId);

    if (goalContributions.length === 0) {
        return "No contributions yet";
    }

    const lastContribution = goalContributions.reduce((latest, current) =>
        current.timestamp > latest.timestamp ? current : latest
    );

    const lastDate = new Date(Number(lastContribution.timestamp) * 1000);
    const nextDate = new Date(lastDate);

    switch (frequency) {
        case 0: // Daily
            nextDate.setDate(nextDate.getDate() + 1);
            break;
        case 1: // Weekly
            nextDate.setDate(nextDate.getDate() + 7);
            break;
        case 2: // Monthly
            nextDate.setMonth(nextDate.getMonth() + 1);
            break;
    }

    return nextDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
};

// Helper to format BigInt to readable number
export const formatBigInt = (value: bigint, decimals: number = 18): string => {
    const divisor = BigInt(10 ** decimals);
    const integerPart = value / divisor;
    const fractionalPart = value % divisor;

    if (fractionalPart === 0n) {
        return integerPart.toString();
    }

    const fractionalStr = fractionalPart.toString().padStart(decimals, "0");
    const trimmed = fractionalStr.replace(/0+$/, "");
    return `${integerPart}.${trimmed}`;
};

// Helper to get frequency text
export const getFrequencyText = (frequency: number): string => {
    switch (frequency) {
        case 0:
            return "Daily";
        case 1:
            return "Weekly";
        case 2:
            return "Monthly";
        default:
            return "Unknown";
    }
};

// Helper to get state text
export const getStateText = (state: number): ActiveCircle['status'] => {
    switch (state) {
        case 0:
            return "pending";
        case 1:
            return "created";
        case 2:
            return "voting";
        case 3:
            return "active";
        case 4:
            return "completed";
        case 5:
            return "withdrawn";
        default:
            return "unknown";
    }
};

// Calculate next payout date based on current round
export const calculateNextPayout = (
    startedAt: bigint,
    frequency: number,
    currentRound: bigint = 1n
): string => {
    if (startedAt === 0n) {
        return "Pending Start";
    }

    const startDate = new Date(Number(startedAt) * 1000);
    const nextDate = new Date(startDate);

    // Calculate date for the NEXT round (currentRound + 1)
    const nextRoundNumber = Number(currentRound);

    switch (frequency) {
        case 0: // Daily
            nextDate.setDate(nextDate.getDate() + nextRoundNumber);
            break;
        case 1: // Weekly
            nextDate.setDate(nextDate.getDate() + (nextRoundNumber * 7));
            break;
        case 2: // Monthly
            nextDate.setMonth(nextDate.getMonth() + nextRoundNumber);
            break;
    }

    return nextDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
};

// Calculate collateral required
export const calculateCollateral = (
    contribution: bigint,
    maxMembers: bigint
): bigint => {
    const totalCommitment = contribution * maxMembers;
    const lateBuffer = (totalCommitment * BigInt(1)) / BigInt(100); // 1% buffer
    return totalCommitment + lateBuffer;
};

// Calculate contribution deadline for current round
// Returns the grace deadline (base deadline + grace period)
// Members can contribute without penalty until this time
// After this: contributions are deducted from collateral with 1% late fee
export const calculateContributionDeadline = (
    startedAt: bigint,
    currentRound: bigint,
    frequency: number
): bigint => {
    if (startedAt === 0n || currentRound === 0n) {
        return 0n;
    }

    const startDate = new Date(Number(startedAt) * 1000);
    const deadlineDate = new Date(startDate);

    // Calculate base deadline based on current round and frequency
    const roundNumber = Number(currentRound);

    switch (frequency) {
        case 0: // Daily
            deadlineDate.setDate(deadlineDate.getDate() + roundNumber);
            break;
        case 1: // Weekly
            deadlineDate.setDate(deadlineDate.getDate() + (roundNumber * 7));
            break;
        case 2: // Monthly
            deadlineDate.setMonth(deadlineDate.getMonth() + roundNumber);
            break;
    }

    // Add grace period - this is when members can still contribute from wallet
    // After grace period: contributions are deducted from collateral with penalty
    // Daily: 12 hours, Weekly/Monthly: 48 hours
    const gracePeriodHours = frequency === 0 ? 12 : 48;
    deadlineDate.setHours(deadlineDate.getHours() + gracePeriodHours);

    // Return as Unix timestamp (seconds)
    return BigInt(Math.floor(deadlineDate.getTime() / 1000));
};
