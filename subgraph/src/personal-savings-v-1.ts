import { Bytes } from "@graphprotocol/graph-ts";
import {
  GoalContribution as GoalContributionEvent,
  GoalWithdrawn as GoalWithdrawnEvent,
  PersonalGoalCreated as PersonalGoalCreatedEvent,
} from "../generated/PersonalSavingsProxy/PersonalSavingsV1";
import { GoalContribution, GoalWithdrawn, PersonalGoal, PersonalGoalCreated } from "../generated/schema";
import { createTransaction, getOrCreateUser } from "./utils";

export function handlePersonalGoalCreated(
  event: PersonalGoalCreatedEvent
): void {
  const transaction = createTransaction(event);
  const user = getOrCreateUser(event.params.owner);

  // Create the immutable event record
  const personalGoalCreated = new PersonalGoalCreated(event.transaction.hash);
  personalGoalCreated.user = user.id;
  personalGoalCreated.goalId = event.params.goalId;
  personalGoalCreated.goalName = event.params.name;
  personalGoalCreated.goalAmount = event.params.targetAmount;
  personalGoalCreated.currentAmount = event.params.currentAmount;
  personalGoalCreated.contributionAmount = event.params.contributionAmount;
  personalGoalCreated.frequency = event.params.frequency;
  personalGoalCreated.deadline = event.params.deadline;
  personalGoalCreated.isActive = event.params.isActive;
  personalGoalCreated.transaction = transaction.id;

  // Create the mutable goal state entity
  // Use composite key: user address + goalId for unique identification
  const goalEntityId = event.params.owner.toHex() + "-" + event.params.goalId.toString();
  const personalGoal = new PersonalGoal(Bytes.fromUTF8(goalEntityId));
  personalGoal.user = user.id;
  personalGoal.goalId = event.params.goalId;
  personalGoal.goalName = event.params.name;
  personalGoal.goalAmount = event.params.targetAmount;
  personalGoal.currentAmount = event.params.currentAmount;
  personalGoal.contributionAmount = event.params.contributionAmount;
  personalGoal.frequency = event.params.frequency;
  personalGoal.deadline = event.params.deadline;
  personalGoal.isActive = event.params.isActive;
  personalGoal.createdAt = event.block.timestamp;
  personalGoal.updatedAt = event.block.timestamp;

  user.save();
  personalGoalCreated.save();
  personalGoal.save();
}

export function handleGoalContribution(event: GoalContributionEvent): void {
  const transaction = createTransaction(event);
  const user = getOrCreateUser(event.params.owner);

  // Create the event record
  const goalContribution = new GoalContribution(event.transaction.hash);
  goalContribution.user = user.id;
  goalContribution.amount = event.params.amount;
  goalContribution.goalId = event.params.goalId;
  goalContribution.transaction = transaction.id;

  // Update the goal state
  const goalEntityId = event.params.owner.toHex() + "-" + event.params.goalId.toString();
  const personalGoal = PersonalGoal.load(Bytes.fromUTF8(goalEntityId));
  if (personalGoal) {
    // Use currentAmount from event instead of contract call
    personalGoal.currentAmount = event.params.currentAmount;
    personalGoal.updatedAt = event.block.timestamp;
    personalGoal.save();
  }

  user.save();
  goalContribution.save();
}

export function handleGoalWithdrawn(event: GoalWithdrawnEvent): void {
  const transaction = createTransaction(event);
  const user = getOrCreateUser(event.params.owner);

  // Create the event record
  const goalWithdrawn = new GoalWithdrawn(event.transaction.hash);
  goalWithdrawn.user = user.id;
  goalWithdrawn.goalId = event.params.goalId;
  goalWithdrawn.amount = event.params.amount;
  goalWithdrawn.penalty = event.params.penalty;
  goalWithdrawn.transaction = transaction.id;

  // Update the goal state - withdrawal always deactivates the goal
  const goalEntityId = event.params.owner.toHex() + "-" + event.params.goalId.toString();
  const personalGoal = PersonalGoal.load(Bytes.fromUTF8(goalEntityId));
  if (personalGoal) {
    // After withdrawal, goal is no longer active
    personalGoal.isActive = false;
    // Calculate new currentAmount: previous amount - withdrawn amount
    personalGoal.currentAmount = personalGoal.currentAmount.minus(event.params.amount);
    personalGoal.updatedAt = event.block.timestamp;
    personalGoal.save();
  }

  // Set isActive on the event record (goal is deactivated after withdrawal)
  goalWithdrawn.isActive = false;

  user.save();
  goalWithdrawn.save();
}
