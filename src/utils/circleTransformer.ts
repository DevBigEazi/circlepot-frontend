import { ActiveCircle, Circle, CircleJoined } from "../interfaces/interfaces";
import { calculateCollateral, calculateNextPayout, formatBigInt, getStateText, calculateContributionDeadline } from "./helpers";

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
    forfeitures: any[] = []
): ActiveCircle => {
    // Find members for this circle
    const circleMembers = joinedCircles
        .filter((j) => j.circleId === circle.circleId)
        .map((j) => ({
            id: j.id,
            username: j.id.substring(0, 8), // Fallback from ID
            fullName: j.id.substring(0, 6) + "...",
        }));

    // Find user's position
    const userPosition = userAddress
        ? circleMembers.findIndex(
            (m) => m.id.toLowerCase() === userAddress.toLowerCase()
        ) + 1
        : 0;

    const contributionFormatted = formatBigInt(circle.contributionAmount);

    // For active/completed circles, use currentMembers (actual participants)
    // For created/pending/voting circles, use maxMembers (proposed maximum)
    const isStarted = circle.state >= 3; // ACTIVE (3) or COMPLETED (4)
    const effectiveMembers = isStarted ? circle.currentMembers : circle.maxMembers;

    // Calculate payout amount
    // Creator gets full payout, non-creators pay 0.2% platform fee (20 basis points)
    const totalPot = circle.contributionAmount * effectiveMembers;
    const isCreator = userAddress && circle.creator?.id?.toLowerCase() === userAddress.toLowerCase();

    let payoutAmountBigInt = totalPot;
    if (!isCreator) {
        // Apply platform fee: 20 basis points = 0.2%
        const platformFee = (totalPot * 20n) / 10000n;
        payoutAmountBigInt = totalPot - platformFee;
    }

    const payoutAmount = formatBigInt(payoutAmountBigInt);
    const nextPayout = calculateNextPayout(circle.startedAt, circle.frequency, circle.currentRound || 1n);
    const collateral = calculateCollateral(
        circle.contributionAmount,
        circle.maxMembers // Collateral is always based on maxMembers (what you committed to)
    );

    // Filter events for this circle
    const circleVotingEvents = votingEvents.filter(e => e.circleId === circle.circleId);
    const circleVotes = votes.filter(v => v.circleId === circle.circleId);
    const circleVoteResults = voteResults.filter(r => r.circleId === circle.circleId);
    const circlePositions = positions.filter(p => p.circleId === circle.circleId);
    const circlePayouts = payouts.filter(p => p.circleId === circle.circleId);

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

    // Check if user has withdrawn collateral
    const hasWithdrawn = userAddress
        ? collateralWithdrawals.some(cw =>
            cw.circleId === circle.circleId &&
            cw.user?.id?.toLowerCase() === userAddress.toLowerCase()
        )
        : false;

    // Check if user has been forfeited at any point and count events
    const userForfeitures = userAddress
        ? forfeitures.filter(f =>
            f.circleId === circle.circleId &&
            f.forfeitedUser?.id?.toLowerCase() === userAddress.toLowerCase()
        )
        : [];

    const isForfeited = userForfeitures.length > 0;
    const latePayCount = userForfeitures.length;

    // Calculate actual financial loss (only the penalty fees) and the contribution portion
    // Loss = Total Deduction - Contribution Portion
    let forfeitedPenaltyTotal = 0n;
    let forfeitedContributionTotal = 0n;

    userForfeitures.forEach((f) => {
        const deduction = BigInt(f.deductionAmount || 0);
        const contributionPortion = deduction > BigInt(circle.contributionAmount || 0)
            ? BigInt(circle.contributionAmount || 0)
            : deduction;
        const penaltyFee = deduction - contributionPortion;

        forfeitedPenaltyTotal += penaltyFee;
        forfeitedContributionTotal += contributionPortion;
    });

    const forfeitedAmount = forfeitedPenaltyTotal;
    const forfeitedContributionPortion = forfeitedContributionTotal;

    return {
        id: circle.id,
        name: circle.circleName,
        contribution: contributionFormatted,
        frequency: circle.frequency,
        totalPositions: Number(circle.currentMembers), 
        currentPosition: userPosition > 0 ? userPosition : 1,
        payoutAmount: payoutAmount,
        nextPayout: nextPayout,
        status: getStateText(circle.state),
        membersList: circleMembers,
        currentRound: circle.currentRound || 1n,
        contributionDeadline: calculateContributionDeadline(
            circle.startedAt,
            circle.currentRound || 1n,
            circle.frequency
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
            state: circle.state,
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
    forfeitures: any[] = []
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
                forfeitures
            )
        )
        .sort(
            (a, b) =>
                new Date(b.nextPayout).getTime() - new Date(a.nextPayout).getTime()
        );
};