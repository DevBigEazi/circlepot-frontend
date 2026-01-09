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
// Maps to contract's CircleState enum:
// PENDING = 0, CREATED = 1, VOTING = 2, ACTIVE = 3, COMPLETED = 4, DEAD = 5
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
            return "dead";
        default:
            return "unknown";
    }
};

// Calculate next payout date based on current round
// The contract sets round deadlines as follows:
// - Round 1 deadline = startedAt + period (e.g., weekly = 7 days)
// - Round N deadline = when round N-1 paid out + period
// Since we don't track exact payout times, we calculate the "ideal" deadline:
// Round N deadline = startedAt + (N * period)
// This is the deadline BY which contributions must be made (before grace period)
// Calculate base deadline for the current round (without grace period)
export const calculateBaseDeadline = (
    startedAt: bigint,
    frequency: number,
    currentRound: bigint = 1n,
    lastPayoutTimestamp?: bigint
): bigint => {
    if (startedAt === 0n) {
        return 0n;
    }

    let basisDate: Date;
    let roundsToAdd: number;

    if (currentRound > 1n && lastPayoutTimestamp && lastPayoutTimestamp > 0n) {
        basisDate = new Date(Number(lastPayoutTimestamp) * 1000);
        roundsToAdd = 1;
    } else {
        basisDate = new Date(Number(startedAt) * 1000);
        roundsToAdd = Number(currentRound);
    }

    const nextDate = new Date(basisDate);

    switch (frequency) {
        case 0: // Daily
            nextDate.setDate(nextDate.getDate() + roundsToAdd);
            break;
        case 1: // Weekly
            nextDate.setDate(nextDate.getDate() + (roundsToAdd * 7));
            break;
        case 2: // Monthly
            nextDate.setMonth(nextDate.getMonth() + roundsToAdd);
            break;
    }

    return BigInt(Math.floor(nextDate.getTime() / 1000));
};

export const calculateNextPayout = (
    startedAt: bigint,
    frequency: number,
    currentRound: bigint = 1n,
    lastPayoutTimestamp?: bigint
): string => {
    const deadline = calculateBaseDeadline(startedAt, frequency, currentRound, lastPayoutTimestamp);
    if (deadline === 0n) return "Pending Start";

    const nextDate = new Date(Number(deadline) * 1000);
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
// 
// CONTRACT LOGIC:
// 1. Round deadline (circleRoundDeadlines[circleId][round]) = when contributions must be made
//    - Round 1: startedAt + period (e.g., startedAt + 7 days for weekly)
//    - Round N: previous_payout_timestamp + period
//    
// 2. Grace deadline = round deadline + grace period
//    - Daily: 12 hours grace
//    - Weekly/Monthly: 48 hours grace
//    
// 3. After grace deadline expires, next recipient can call forfeitMember()
//
// FRONTEND APPROXIMATION:
// Since we don't track exact payout timestamps, we calculate the "ideal" deadline
// assuming payouts happen exactly on time:
// - Round N deadline = startedAt + (N * period)
// - Grace deadline = Round N deadline + grace period
//
// IMPORTANT: The actual contract deadline may differ if previous payouts
// were triggered late. This is an approximation for UI display.
//
// Returns: Unix timestamp (seconds) of the grace deadline
export const calculateContributionDeadline = (
    startedAt: bigint,
    currentRound: bigint,
    frequency: number,
    lastPayoutTimestamp?: bigint
): bigint => {
    const baseDeadline = calculateBaseDeadline(startedAt, frequency, currentRound, lastPayoutTimestamp);
    if (baseDeadline === 0n) return 0n;

    const deadlineDate = new Date(Number(baseDeadline) * 1000);

    // Add grace period on top of the base deadline
    // Contract: _getGracePeriod() returns:
    // - Daily: 12 hours (43200 seconds)
    // - Weekly/Monthly: 48 hours (172800 seconds)
    const gracePeriodHours = frequency === 0 ? 12 : 48;
    deadlineDate.setHours(deadlineDate.getHours() + gracePeriodHours);

    // Return as Unix timestamp (seconds)
    return BigInt(Math.floor(deadlineDate.getTime() / 1000));
};

// Helper to shorten wallet address
export const shortenAddress = (addr: string, startChars: number = 8, endChars: number = 8): string => {
    if (!addr) return "";
    return `${addr.slice(0, startChars)}...${addr.slice(-endChars)}`;
};

// Helper to get user initials from full name
export const getInitials = (fullName?: string): string => {
    if (!fullName) return "NN";
    const initials = fullName
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((name) => name.charAt(0).toUpperCase())
        .join("");
    return initials || "NN";
};

