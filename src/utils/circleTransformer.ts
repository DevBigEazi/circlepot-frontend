import { ActiveCircle, Circle, CircleJoined } from "../interfaces/interfaces";
import { calculateCollateral, calculateNextPayout, formatBigInt, getStateText } from "./helpers";

// Transform Circle to ActiveCircle
export const transformCircleToActiveCircle = (
    circle: Circle,
    joinedCircles: CircleJoined[],
    userAddress?: string,
    votingEvents: any[] = [],
    votes: any[] = [],
    voteResults: any[] = [],
    positions: any[] = [],
    contributions: any[] = []
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
    const payoutAmount = formatBigInt(
        circle.contributionAmount * circle.maxMembers
    );
    const nextPayout = calculateNextPayout(circle.startedAt, circle.frequency);
    const collateral = calculateCollateral(
        circle.contributionAmount,
        circle.maxMembers
    );

    // Filter events for this circle
    const circleVotingEvents = votingEvents.filter(e => e.circleId === circle.circleId);
    const circleVotes = votes.filter(v => v.circleId === circle.circleId);
    const circleVoteResults = voteResults.filter(r => r.circleId === circle.circleId);
    const circlePositions = positions.filter(p => p.circleId === circle.circleId);

    // Check if user has contributed to the current round
    let hasContributed = false;
    if (userAddress && circle.state === 3) { // ACTIVE
        const currentRound = circle.currentRound || 1n;
        hasContributed = contributions.some(c =>
            c.circleId === circle.circleId &&
            c.round === currentRound &&
            // Check if contribution is from this user (contributions array is already filtered by user in useCircleSavings)
            // But wait, useCircleSavings passes `contributions` which are ALL contributions for the user.
            // So we just need to check circleId and round.
            true
        );
    }

    return {
        id: circle.id,
        name: circle.circleName,
        contribution: contributionFormatted,
        frequency: circle.frequency,
        totalPositions: Number(circle.maxMembers),
        currentPosition: userPosition > 0 ? userPosition : 1,
        payoutAmount: payoutAmount,
        nextPayout: nextPayout,
        status: getStateText(circle.state),
        membersList: circleMembers,
        votingEvents: circleVotingEvents,
        votes: circleVotes,
        voteResults: circleVoteResults,
        positions: circlePositions,
        hasContributed: hasContributed,
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
    contributions: any[] = []
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
                contributions
            )
        )
        .sort(
            (a, b) =>
                new Date(b.nextPayout).getTime() - new Date(a.nextPayout).getTime()
        );
};