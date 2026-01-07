import { ActiveCircle, Circle, CircleJoined } from "../interfaces/interfaces";
import { calculateCollateral, calculateNextPayout, formatBigInt, getStateText, calculateContributionDeadline, calculateBaseDeadline } from "./helpers";

// Transform Circle to ActiveCircle
export const transformCircleToActiveCircle = (
    circle: Circle,
    joinedCircles: CircleJoined[],
    userAddress?: string,
    votingEvents: any[] = [],
    votes: any[] = [],
    voteResults: any[] = [],
    positions: any[] = [],
    contributions: any[] = [],
    payouts: any[] = [],
    collateralWithdrawals: any[] = [],
    forfeitures: any[] = [],
    collateralReturns: any[] = [],
    latePayments: any[] = []
): ActiveCircle => {
    // Find members for this circle
    const circleMembers = joinedCircles
        .filter((j) => j.circleId === circle.circleId)
        .map((j) => ({
            id: j.id,
            username: j.id.substring(0, 8), // Fallback from ID
            fullName: j.id.substring(0, 6) + "...",
        }));

    // Filter events for this circle
    const circleVotingEvents = votingEvents.filter(e => e.circleId === circle.circleId);
    const circleVotes = votes.filter(v => v.circleId === circle.circleId);
    const circleVoteResults = voteResults.filter(r => r.circleId === circle.circleId);
    const circlePositions = positions.filter(p => p.circleId === circle.circleId);
    const circlePayouts = payouts.filter(p => p.circleId === circle.circleId);

    // Find user's assigned position if it exists
    const userAssignedPosition = circlePositions.find(
        (p: any) => p.user?.id?.toLowerCase() === userAddress?.toLowerCase()
    );

    // Find join order position as fallback
    const userJoinPosition = userAddress
        ? circleMembers.findIndex(
            (m) => m.id.toLowerCase() === userAddress.toLowerCase()
        ) + 1
        : 0;

    const userPosition = userAssignedPosition
        ? Number(userAssignedPosition.position)
        : (userJoinPosition > 0 ? userJoinPosition : 1);

    const contributionFormatted = formatBigInt(circle.contributionAmount);

    // For active/completed circles, use currentMembers (actual participants)
    // For created/pending/voting circles, use maxMembers (proposed maximum)
    const isStarted = circle.state >= 3; // ACTIVE (3) or COMPLETED (4)
    const effectiveMembers = isStarted ? circle.currentMembers : circle.maxMembers;

    // Calculate payout amount
    // Creator gets full payout, non-creators pay 1% on payout up to $1000, and $10 fix fee for above $1000 platform fee (100 basis points)
    const totalPot = circle.contributionAmount * effectiveMembers;
    const isCreator = userAddress && circle.creator?.id?.toLowerCase() === userAddress.toLowerCase();

    let payoutAmountBigInt = totalPot;
    if (!isCreator) {
        // Apply platform fee: 100 basis points = 1%
        const platformFee = (totalPot * 100n) / 10000n;
        payoutAmountBigInt = totalPot - platformFee;
    }

    // Find the latest payout to use as basis for next round deadline
    const lastPayout = circlePayouts.length > 0
        ? circlePayouts.reduce((latest, current) =>
            current.timestamp > latest.timestamp ? current : latest
        )
        : null;
    const lastPayoutTimestamp = lastPayout ? lastPayout.timestamp : undefined;

    const payoutAmount = formatBigInt(payoutAmountBigInt);
    const nextPayout = calculateNextPayout(
        circle.startedAt,
        circle.frequency,
        circle.currentRound || 1n,
        lastPayoutTimestamp
    );
    const collateral = calculateCollateral(
        circle.contributionAmount,
        circle.maxMembers // Collateral is always based on maxMembers (what you committed to)
    );

    // Check if user has contributed or was forfeited for the current round
    let hasContributed = false;
    let isForfeitedThisRound = false;
    let userTotalContributed = 0n;

    if (userAddress) {
        // Calculate total contributed by user for this circle
        userTotalContributed = contributions
            .filter(c => c.circleId === circle.circleId)
            .reduce((sum, c) => sum + c.amount, 0n);

        if (circle.state === 3) { // ACTIVE
            const currentRound = circle.currentRound || 1n;

            // Check manual contribution
            const contributedThisRound = contributions.some(c =>
                c.circleId === circle.circleId &&
                c.round === currentRound
            );

            // Check if forfeited this round
            const forfeitedThisRoundEvent = forfeitures.find(f =>
                f.circleId === circle.circleId &&
                f.forfeitedUser?.id?.toLowerCase() === userAddress.toLowerCase() &&
                f.round === currentRound
            );

            isForfeitedThisRound = !!forfeitedThisRoundEvent;
            hasContributed = contributedThisRound || isForfeitedThisRound;
        }
    }

    // Check if user has withdrawn collateral or it has been returned
    const userCollateralWithdrawals = userAddress
        ? collateralWithdrawals.filter(cw =>
            cw.circleId === circle.circleId &&
            cw.user?.id?.toLowerCase() === userAddress.toLowerCase()
        )
        : [];

    const userCollateralReturns = userAddress
        ? collateralReturns.filter(cr =>
            cr.circleId === circle.circleId &&
            cr.user?.id?.toLowerCase() === userAddress.toLowerCase()
        )
        : [];

    const hasWithdrawn = userCollateralWithdrawals.length > 0 || userCollateralReturns.length > 0;

    // Check if user has been forfeited at any point and count events
    const userForfeitures = userAddress
        ? forfeitures.filter(f =>
            f.circleId === circle.circleId &&
            f.forfeitedUser?.id?.toLowerCase() === userAddress.toLowerCase()
        )
        : [];

    const isForfeited = userForfeitures.length > 0;

    // Calculate actual financial loss (penalty fees and missed contributions)
    let forfeitedPenaltyTotal = 0n;
    let forfeitedContributionTotal = 0n;

    // We track deductions by round to avoid double counting if multiple events exist
    const roundDeductions = new Map<bigint, { penalty: bigint, contribution: bigint }>();

    // Check for late payments (where user paid late and deduction happened)
    const userLatePayments = userAddress
        ? latePayments.filter(lp =>
            lp.circleId === circle.circleId &&
            (lp.user?.id?.toLowerCase() === userAddress.toLowerCase())
        )
        : [];

    // 1. Process late payments (paid late, so only a penalty fee is deducted from collateral)
    userLatePayments.forEach(lp => {
        const round = BigInt(lp.round);
        const fee = BigInt(lp.fee || 0);

        if (!roundDeductions.has(round)) {
            roundDeductions.set(round, { penalty: fee, contribution: 0n });
        }
    });

    // 2. Process forfeitures (missed contribution, so BOTH contribution and penalty are deducted)
    userForfeitures.forEach((f) => {
        const round = BigInt(f.round);
        const deduction = BigInt(f.deductionAmount || 0);
        const contributionAmount = BigInt(circle.contributionAmount || 0);

        const penaltyPortion = deduction > contributionAmount ? deduction - contributionAmount : 0n;
        const contributionPortion = deduction >= contributionAmount ? contributionAmount : deduction;

        // Forfeiture deductuion always takes precedence/overwrites late record for the same round
        roundDeductions.set(round, { penalty: penaltyPortion, contribution: contributionPortion });
    });

    // Sum all unique round deductions
    roundDeductions.forEach((d) => {
        forfeitedPenaltyTotal += d.penalty;
        forfeitedContributionTotal += d.contribution;
    });

    const forfeitedAmount = forfeitedPenaltyTotal;
    const forfeitedContributionPortion = forfeitedContributionTotal;
    const latePayCount = roundDeductions.size;

    const circleCollateralWithdrawals = collateralWithdrawals.filter(
        cw => cw.circleId === circle.circleId
    );
    const isDead = circleCollateralWithdrawals.length > 0;
    const actualState = isDead ? 5 : circle.state; // 5 = DEAD state

    return {
        id: circle.id,
        name: circle.circleName,
        contribution: contributionFormatted,
        frequency: circle.frequency,
        totalPositions: Number(effectiveMembers),
        currentPosition: userPosition > 0 ? userPosition : 1,
        payoutAmount: payoutAmount,
        nextPayout: nextPayout,
        status: getStateText(actualState), // Use actualState instead of circle.state
        membersList: circleMembers,
        currentRound: circle.currentRound || 1n,
        contributionDeadline: calculateContributionDeadline(
            circle.startedAt,
            circle.currentRound || 1n,
            circle.frequency,
            lastPayoutTimestamp
        ),
        baseDeadline: calculateBaseDeadline(
            circle.startedAt,
            circle.frequency,
            circle.currentRound || 1n,
            lastPayoutTimestamp
        ),
        votingEvents: circleVotingEvents,
        votes: circleVotes,
        voteResults: circleVoteResults,
        positions: circlePositions,
        payouts: circlePayouts,
        hasContributed: hasContributed,
        userTotalContributed: userTotalContributed,
        hasWithdrawn: hasWithdrawn,
        isForfeited: isForfeited,
        isForfeitedThisRound: isForfeitedThisRound,
        forfeitedAmount: forfeitedAmount,
        forfeitedContributionPortion: forfeitedContributionPortion,
        latePayCount: latePayCount,
        rawCircle: {
            ...circle,
            circleId: circle.circleId,
            circleName: circle.circleName,
            circleDescription: circle.circleDescription,
            contributionAmount: circle.contributionAmount,
            collateralAmount: collateral,
            frequency: circle.frequency,
            maxMembers: circle.maxMembers,
            currentMembers: circle.currentMembers,
            currentRound: circle.currentRound,
            visibility: circle.visibility,
            state: actualState, // Use actualState instead of circle.state
            createdAt: circle.createdAt,
            startedAt: circle.startedAt,
            creator: circle.creator,
        },
    };
};

// Transform multiple circles
export const transformCircles = (
    circles: Circle[],
    joinedCircles: CircleJoined[],
    userAddress?: string,
    votingEvents: any[] = [],
    votes: any[] = [],
    voteResults: any[] = [],
    positions: any[] = [],
    contributions: any[] = [],
    payouts: any[] = [],
    collateralWithdrawals: any[] = [],
    forfeitures: any[] = [],
    collateralReturns: any[] = [],
    latePayments: any[] = []
): ActiveCircle[] => {
    return circles
        .map((circle) =>
            transformCircleToActiveCircle(
                circle,
                joinedCircles,
                userAddress,
                votingEvents,
                votes,
                voteResults,
                positions,
                contributions,
                payouts,
                collateralWithdrawals,
                forfeitures,
                collateralReturns,
                latePayments
            )
        )
        .sort(
            (a, b) =>
                new Date(b.nextPayout).getTime() - new Date(a.nextPayout).getTime()
        );
};