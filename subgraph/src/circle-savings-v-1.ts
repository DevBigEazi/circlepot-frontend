import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import {
    VisibilityUpdated as VisibilityUpdatedEvent,
    CircleCreated as CircleCreatedEvent,
    CircleJoined as CircleJoinedEvent,
    CircleStarted as CircleStartedEvent,
    PayoutDistributed as PayoutDistributedEvent,
    PositionAssigned as PositionAssignedEvent,
    CollateralWithdrawn as CollateralWithdrawnEvent,
    VotingInitiated as VotingInitiatedEvent,
    VoteCast as VoteCastEvent,
    MemberInvited as MemberInvitedEvent,
    VoteExecuted as VoteExecutedEvent,
    ContributionMade as ContributionMadeEvent,
    MemberForfeited as MemberForfeitedEvent,
} from "../generated/CircleSavingsProxy/CircleSavingsV1"
import { Circle, CircleCreated, CircleJoined, CircleStarted, CollateralWithdrawn, ContributionMade, MemberForfeited, MemberInvited, PayoutDistributed, PositionAssigned, VisibilityUpdated, VoteCast, VoteExecuted, VotingInitiated } from "../generated/schema";
import { createTransaction, getOrCreateUser } from "./utils"

export function handleCircleCreated(event: CircleCreatedEvent): void {
    const transaction = createTransaction(event);
    const user = getOrCreateUser(event.params.creator);

    // Create the immutable event record
    const circleCreated = new CircleCreated(event.transaction.hash);
    circleCreated.user = user.id;
    circleCreated.circleId = event.params.circleId;
    circleCreated.circleName = event.params.title;
    circleCreated.circleDescription = event.params.description;
    circleCreated.circleContributionAmount = event.params.contributionAmount;
    circleCreated.collateralAmount = event.params.collateralLocked;
    circleCreated.circleFrequency = event.params.frequency;
    circleCreated.circleMaxMembers = event.params.maxMembers;
    circleCreated.circleVisibility = event.params.visibility;
    circleCreated.circleCreatedAt = event.params.createdAt;
    circleCreated.transaction = transaction.id;

    // Create the mutable Circle state entity
    const circleId = changetype<Bytes>(Bytes.fromBigInt(event.params.circleId));
    const circle = new Circle(circleId);
    circle.circleId = event.params.circleId;
    circle.creator = user.id;
    circle.circleName = event.params.title;
    circle.circleDescription = event.params.description;
    circle.contributionAmount = event.params.contributionAmount;
    circle.collateralAmount = event.params.collateralLocked;
    circle.frequency = event.params.frequency;
    circle.maxMembers = event.params.maxMembers;
    circle.currentMembers = BigInt.fromI32(1); // Circle starts with just the creator
    circle.visibility = event.params.visibility;
    circle.state = 0; // 0 = Pending (initial state)
    circle.createdAt = event.params.createdAt;
    circle.startedAt = BigInt.fromI32(0); // Not started yet
    circle.updatedAt = event.block.timestamp;

    circleCreated.save();
    circle.save();
}

export function handleCircleJoined(event: CircleJoinedEvent): void {
    const transaction = createTransaction(event);
    const user = getOrCreateUser(event.params.member);

    // Create the immutable join event record
    const circleJoined = new CircleJoined(event.transaction.hash);
    circleJoined.circleId = event.params.circleId;
    circleJoined.user = user.id
    circleJoined.currentMembers = event.params.currentMembers;
    circleJoined.circleState = event.params.state;
    circleJoined.transaction = transaction.id;

    // Update the mutable Circle entity
    const circleId = changetype<Bytes>(Bytes.fromBigInt(event.params.circleId));
    const circle = Circle.load(circleId);
    if (circle) {
        circle.currentMembers = event.params.currentMembers;
        circle.state = event.params.state;
        circle.updatedAt = event.block.timestamp;
        circle.save();
    }

    circleJoined.save();
}

export function handleCircleStarted(event: CircleStartedEvent): void {
    const transaction = createTransaction(event);

    // Create immutable event record
    const circleStarted = new CircleStarted(event.transaction.hash);
    circleStarted.circleId = event.params.circleId;
    circleStarted.circleStartedAt = event.params.startedAt;
    circleStarted.transaction = transaction.id;

    // Update the mutable Circle entity
    const circleId = changetype<Bytes>(Bytes.fromBigInt(event.params.circleId));
    const circle = Circle.load(circleId);
    if (circle) {
        circle.state = event.params.state; // 1 = Active
        circle.startedAt = event.params.startedAt;
        circle.updatedAt = event.block.timestamp;
        circle.save();
    }

    circleStarted.save();
}

export function handlePayoutDistributed(event: PayoutDistributedEvent): void {
    const transaction = createTransaction(event);
    const user = getOrCreateUser(event.params.recipient);

    const payoutDistributed = new PayoutDistributed(event.transaction.hash);
    payoutDistributed.user = user.id;
    payoutDistributed.circleId = event.params.circleId;
    payoutDistributed.round = event.params.round;
    payoutDistributed.payoutAmount = event.params.amount
    payoutDistributed.transaction = transaction.id;

    payoutDistributed.save();
}

export function handlePositionAssigned(event: PositionAssignedEvent): void {
    const transaction = createTransaction(event);
    const user = getOrCreateUser(event.params.member);

    const positionAssigned = new PositionAssigned(event.transaction.hash);
    positionAssigned.user = user.id;
    positionAssigned.circleId = event.params.circleId;
    positionAssigned.position = event.params.position;
    positionAssigned.transaction = transaction.id;

    positionAssigned.save()
}

export function handleCollateralWithdrawn(event: CollateralWithdrawnEvent): void {
    const transaction = createTransaction(event);
    const user = getOrCreateUser(event.params.member);

    const collateralWithdrawn = new CollateralWithdrawn(event.transaction.hash);
    collateralWithdrawn.user = user.id;
    collateralWithdrawn.circleId = event.params.circleId;
    collateralWithdrawn.amount = event.params.amount;
    collateralWithdrawn.transaction = transaction.id;

    collateralWithdrawn.save()
}

export function handleVotingInitiated(event: VotingInitiatedEvent): void {
    const transaction = createTransaction(event);

    const votingInitiated = new VotingInitiated(event.transaction.hash);
    votingInitiated.circleId = event.params.circleId;
    votingInitiated.votingStartAt = event.params.votingStartTime;
    votingInitiated.votingEndAt = event.params.votingEndTime;
    votingInitiated.transaction = transaction.id;

    votingInitiated.save();
}

export function handleVoteCast(event: VoteCastEvent): void {
    const transaction = createTransaction(event);
    const user = getOrCreateUser(event.params.voter)

    const voteCast = new VoteCast(event.transaction.hash);
    voteCast.voter = user.id;
    voteCast.circleId = event.params.circleId;
    voteCast.choice = event.params.choice;
    voteCast.transaction = transaction.id;

    voteCast.save();
}

export function handleMemberInvited(event: MemberInvitedEvent): void {
    const transaction = createTransaction(event);
    const user = getOrCreateUser(event.params.creator)

    const memberInvited = new MemberInvited(event.transaction.hash);
    memberInvited.inviter = user.id;
    memberInvited.invitee = event.params.invitee;
    memberInvited.circleId = event.params.circleId;
    memberInvited.invitedAt = event.params.invitedAt;
    memberInvited.transaction = transaction.id;

    memberInvited.save();
}

export function handleVoteExecuted(event: VoteExecutedEvent): void {
    const transaction = createTransaction(event);

    const voteExecuted = new VoteExecuted(event.transaction.hash);
    voteExecuted.circleId = event.params.circleId;
    voteExecuted.circleStarted = event.params.circleStarted;
    voteExecuted.startVoteTotal = event.params.startVoteCount
    voteExecuted.withdrawVoteTotal = event.params.withdrawVoteCount;
    voteExecuted.transaction = transaction.id;

    voteExecuted.save();
}

export function handleContributionMade(event: ContributionMadeEvent): void {
    const transaction = createTransaction(event);
    const user = getOrCreateUser(event.params.member)

    const contributionMade = new ContributionMade(event.transaction.hash);
    contributionMade.user = user.id;
    contributionMade.circleId = event.params.circleId;
    contributionMade.round = event.params.round
    contributionMade.amount = event.params.amount;
    contributionMade.transaction = transaction.id;

    contributionMade.save();
}

export function handleMemberForfeited(event: MemberForfeitedEvent): void {
    const transaction = createTransaction(event);
    const user = getOrCreateUser(event.params.forfeiter)

    const memberForfeited = new MemberForfeited(event.transaction.hash);
    memberForfeited.forfeiter = user.id;
    memberForfeited.circleId = event.params.circleId;
    memberForfeited.round = event.params.round
    memberForfeited.deductionAmount = event.params.deduction;
    memberForfeited.forfeitedUser = event.params.member;
    memberForfeited.transaction = transaction.id;

    memberForfeited.save();
}

export function handleVisibilityUpdated(event: VisibilityUpdatedEvent): void {
    const transaction = createTransaction(event);

    const visibilityUpdated = new VisibilityUpdated(event.transaction.hash);
    visibilityUpdated.circleId = event.params.circleId;
    visibilityUpdated.transaction = transaction.id;

    visibilityUpdated.save();
}