import { Bytes } from "@graphprotocol/graph-ts";
import {
  GoalContribution as GoalContributionEvent,
  GoalWithdrawn as GoalWithdrawnEvent,
  PersonalGoalCreated as PersonalGoalCreatedEvent,
} from "../generated/PersonalSavingsProxy/PersonalSavingsV1";
import { GoalContribution, GoalWithdrawn, PersonalGoalCreated } from "../generated/schema";
import { createTransaction, getOrCreateUser } from "./utils";

export function handlePersonalGoalCreated(
  event: PersonalGoalCreatedEvent
): void {
  const transaction = createTransaction(event);
  const user = getOrCreateUser(event.params.owner);

  const personalGoalCreated = new PersonalGoalCreated(event.transaction.hash);
  personalGoalCreated.user = user.id;
  personalGoalCreated.goalId = event.params.goalId;
  personalGoalCreated.goalName = event.params.name;
  personalGoalCreated.goalAmount = event.params.amount;
  personalGoalCreated.currentAmount = event.params.currentAmount;
  personalGoalCreated.isActive = event.params.isActive;
  personalGoalCreated.transaction = transaction.id;

  user.save();
  personalGoalCreated.save();
}

export function handleGoalContribution(event: GoalContributionEvent): void {
    const transaction = createTransaction(event);
    const user = getOrCreateUser(event.params.owner);

    const goalContribution = new GoalContribution(event.transaction.hash);
    goalContribution.user = user.id;
    goalContribution.amount = event.params.amount;
    goalContribution.goalId = event.params.goalId;
    goalContribution.transaction = transaction.id;

    user.save();
    goalContribution.save();
}

export function handleGoalWithdrawn(event: GoalWithdrawnEvent): void {
    const transaction = createTransaction(event);
    const user = getOrCreateUser(event.params.owner);

    const goalWithdrawn = new GoalWithdrawn(event.transaction.hash);
    goalWithdrawn.user = user.id;
    goalWithdrawn.goalId = event.params.goalId;
    goalWithdrawn.amount = event.params.amount;
    goalWithdrawn.penalty = event.params.penalty;
    goalWithdrawn.transaction = transaction.id;

    user.save();
    goalWithdrawn.save();
}
