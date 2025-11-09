import { Bytes } from "@graphprotocol/graph-ts";
import {
  CircleCompleted as CircleCompletedEvent,
  GoalCompleted as GoalCompletedEvent,
  LatePaymentRecorded as LatePaymentRecordedEvent,
  ReputationDecreased as ReputationDecreasedEvent,
  ReputationIncreased as ReputationIncreasedEvent,
  ScoreCategoryChanged as ScoreCategoryChangedEvent,
} from "../generated/ReputationProxy/ReputationV1";
import {
  CircleCompleted,
  GoalCompleted,
  LatePaymentRecorded,
  ReputationDecreased,
  ReputationIncreased,
  ScoreCategoryChanged,
} from "../generated/schema";
import { createTransaction, getOrCreateUser } from "./utils";

export function handleLatePaymentRecorded(
  event: LatePaymentRecordedEvent
): void {
  const transaction = createTransaction(event);
  const user = getOrCreateUser(event.params.user);
  user.totalLatePayments = event.params.totalLatePayments;

  const latePaymentRecorded = new LatePaymentRecorded(event.transaction.hash);
  latePaymentRecorded.user = user.id;
  latePaymentRecorded.circle = Bytes.fromHexString(
    event.params.cid.toHexString()
  );
  latePaymentRecorded.round = event.params.round;
  latePaymentRecorded.fee = event.params.fee;
  latePaymentRecorded.transaction = transaction.id;

  user.save();
  transaction.save();
}

export function handleCircleCompleted(event: CircleCompletedEvent): void {
  const transaction = createTransaction(event);
  const user = getOrCreateUser(event.params.user);
  user.totalCirclesCompleted = event.params.totalCompleted;

  const circleCompleted = new CircleCompleted(event.transaction.hash);
  circleCompleted.user = user.id;
  circleCompleted.circle = Bytes.fromHexString(event.params.cid.toHexString());
  circleCompleted.transaction = transaction.id;

  user.save();
  circleCompleted.save();
}

export function handleReputationDecreased(
  event: ReputationDecreasedEvent
): void {
  const transaction = createTransaction(event);
  const user = getOrCreateUser(event.params.user);
  user.totalReputation = user.totalReputation.minus(event.params.points);

  const reputationDecreased = new ReputationDecreased(event.transaction.hash);
  reputationDecreased.user = user.id;
  reputationDecreased.points = event.params.points;
  reputationDecreased.reason = event.params.reason;
  reputationDecreased.transaction = transaction.id;

  user.save();
  reputationDecreased.save();
}

export function handleReputationIncreased(
  event: ReputationIncreasedEvent
): void {
  const transaction = createTransaction(event);
  const user = getOrCreateUser(event.params.user);
  user.totalReputation = user.totalReputation.plus(event.params.points);

  const reputationIncreased = new ReputationIncreased(event.transaction.hash);
  reputationIncreased.user = user.id;
  reputationIncreased.points = event.params.points;
  reputationIncreased.reason = event.params.reason;
  reputationIncreased.transaction = transaction.id;

  user.save();
  reputationIncreased.save();
}

export function handleScoreCategoryChanged(
  event: ScoreCategoryChangedEvent
): void {
  const transaction = createTransaction(event);
  const user = getOrCreateUser(event.params.user);
  user.repCategory = event.params.newCategory;

  const scoreCategoryChanged = new ScoreCategoryChanged(event.transaction.hash);
  scoreCategoryChanged.user = user.id;
  scoreCategoryChanged.newCategory = event.params.newCategory;
  scoreCategoryChanged.oldCategory = event.params.oldCategory;
  scoreCategoryChanged.transaction = transaction.id;

  user.save();
  scoreCategoryChanged.save();
}

export function handleGoalCompleted(event: GoalCompletedEvent): void {
  const transaction = createTransaction(event);
  const user = getOrCreateUser(event.params.user);
  user.totalGoalsCompleted = event.params.totalCompleted;

  const goalCompleted = new GoalCompleted(event.transaction.hash);
  goalCompleted.user = user.id;
  goalCompleted.goal = Bytes.fromHexString(event.params.goalId.toHexString());
  goalCompleted.transaction = transaction.id;

  user.save();
  goalCompleted.save();
}
