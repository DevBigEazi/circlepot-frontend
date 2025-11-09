import { Bytes } from "@graphprotocol/graph-ts";
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
import { CircleCreated, CircleJoined, CircleStarted, CollateralWithdrawn, PayoutDistributed, PositionAssigned, VisibilityUpdated } from "../generated/schema";
import { createTransaction, getOrCreateUser } from "./utils"

export function handleCircleCreated(event: CircleCreatedEvent): void {
    const transaction = createTransaction(event);
    const user = getOrCreateUser(event.params.creator);

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

    circleCreated.save();
}

export function handleCircleJoined(event: CircleJoinedEvent): void {
    const transaction = createTransaction(event);
    const user = getOrCreateUser(event.params.member);

    const circleJoined = new CircleJoined(event.transaction.hash);
    circleJoined.circle = Bytes.fromHexString(event.params.circleId.toHexString());
    circleJoined.user = user.id
    circleJoined.currentMembers = event.params.currentMembers;
    circleJoined.circleState = event.params.state;
    circleJoined.transaction = transaction.id;
    
    circleJoined.save();
}

export function handleCircleStarted(event: CircleStartedEvent): void {
    const transaction = createTransaction(event);

    const circleStarted = new CircleStarted(event.transaction.hash);
    circleStarted.circle = Bytes.fromHexString(event.params.circleId.toHexString());
    circleStarted.circleStartedAt = event.params.startedAt;
    circleStarted.transaction = transaction.id;

    circleStarted.save();
}

export function handlePayoutDistributed(event: PayoutDistributedEvent): void {
    const transaction = createTransaction(event);
    const user = getOrCreateUser(event.params.recipient);

    const payoutDistributed = new PayoutDistributed(event.transaction.hash);
    payoutDistributed.user = user.id;
    payoutDistributed.circle = Bytes.fromHexString(event.params.circleId.toHexString());
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
    positionAssigned.circle = event.params.circleId;
    positionAssigned.position = event.params.position;
    positionAssigned.transaction = transaction.id;

    positionAssigned.save()
}

export function handleCollateralWithdrawn(event: CollateralWithdrawnEvent): void {
    const transaction = createTransaction(event);
    const user = getOrCreateUser(event.params.member);

    const collateralWithdrawn = new CollateralWithdrawn(event.transaction.hash);
    collateralWithdrawn.user = user.id;
    collateralWithdrawn.circle = Bytes.fromHexString(event.params.circleId.toHexString());
    collateralWithdrawn.amount = event.params.amount;
    collateralWithdrawn.transaction = transaction.id;

    collateralWithdrawn.save()
}

export function handleVotingInitiated(event: VotingInitiatedEvent): void {

}

export function handleVoteCast(event: VoteCastEvent): void {

}

export function handleMemberInvited(event: MemberInvitedEvent): void {

}

export function handleVoteExecuted(event: VoteExecutedEvent): void {

}

export function handleContributionMade(event: ContributionMadeEvent): void {

}

export function handleMemberForfeited(event: MemberForfeitedEvent): void {

}

export function handleVisibilityUpdated(event: VisibilityUpdatedEvent): void {
    const transaction = createTransaction(event);

    const visibilityUpdated = new VisibilityUpdated(event.transaction.hash);
    visibilityUpdated.circle = Bytes.fromHexString(event.params.circleId.toHexString());
    visibilityUpdated.transaction = transaction.id;

    visibilityUpdated.save();
}