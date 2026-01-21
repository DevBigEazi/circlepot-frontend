import React, { createContext, useContext, ReactNode } from "react";
import { useCircleSavings } from "../hooks/useCircleSavings";
import { usePersonalGoals } from "../hooks/usePersonalGoals";
import { ThirdwebClient } from "thirdweb";
import {
  Circle,
  CircleJoined,
  Contribution,
  Payout,
  VotingInitiated,
  VoteCast,
  VoteExecuted,
  PositionAssigned,
  MemberInvited,
  LatePayment,
  MemberForfeited,
  CollateralWithdrawn,
  CollateralReturned,
  DeadCircleFeeDeducted,
  PersonalGoal,
  GoalContribution,
  GoalWithdrawal,
  CreateCircleParams,
  CreateGoalParams,
} from "../interfaces/interfaces";

/**
 * Global context for Circle and Goals data
 * This centralizes data fetching to prevent duplicate RPC calls
 * and provides a single source of truth for circle and goal data across the app
 */
interface CircleAndGoalsContextType {
  // Circle Savings Data
  circles: Circle[];
  joinedCircles: CircleJoined[];
  contributions: Contribution[];
  payouts: Payout[];
  votingEvents: VotingInitiated[];
  votes: VoteCast[];
  voteResults: VoteExecuted[];
  positions: PositionAssigned[];
  invitations: MemberInvited[];
  latePayments: LatePayment[];
  forfeitures: MemberForfeited[];
  collateralWithdrawals: CollateralWithdrawn[];
  collateralReturns: CollateralReturned[];
  deadCircleFees: DeadCircleFeeDeducted[];
  vaultProjects: Record<string, string>;

  // Circle Actions
  createCircle: (params: CreateCircleParams) => Promise<void>;
  joinCircle: (circleId: bigint) => Promise<void>;
  contributeToCircle: (circleId: bigint, round: bigint) => Promise<void>;
  castVote: (circleId: bigint, choice: number) => Promise<void>;
  executeVote: (circleId: bigint) => Promise<void>;
  withdrawCollateral: (circleId: bigint) => Promise<void>;
  updateCircleVisibility: (
    circleId: bigint,
    visibility: number,
  ) => Promise<void>;
  getCircleById: (circleId: bigint) => Promise<any>;
  inviteMember: (circleId: bigint, memberAddress: string) => Promise<void>;
  forfeitMember: (
    circleId: bigint,
    memberAddress: string,
    round: bigint,
  ) => Promise<void>;

  // Personal Goals Data
  goals: PersonalGoal[];
  goalContributions: GoalContribution[];
  goalWithdrawals: GoalWithdrawal[];

  // Goal Actions
  createGoal: (params: CreateGoalParams) => Promise<void>;
  contributeToGoal: (goalId: bigint) => Promise<void>;
  withdraw: (goalId: bigint, amount?: bigint) => Promise<void>;
  claimYield: (goalId: bigint) => Promise<void>;

  // Loading States
  isCirclesLoading: boolean;
  isGoalsLoading: boolean;
  isTransactionPending: boolean;

  // Error States
  circlesError: string | null;
  goalsError: string | null;

  // Refetch Functions
  refetchCircles: () => void;
  refetchGoals: () => void;
}

const CircleAndGoalsContext = createContext<
  CircleAndGoalsContextType | undefined
>(undefined);

interface CircleAndGoalsProviderProps {
  children: ReactNode;
  client: ThirdwebClient;
}

export const CircleAndGoalsProvider: React.FC<CircleAndGoalsProviderProps> = ({
  children,
  client,
}) => {
  // Call the hooks ONCE at the app level with optimized polling
  // enablePolling is set to true but with longer intervals (configured in the hooks)
  const circleData = useCircleSavings(client, true);
  const goalData = usePersonalGoals(client);

  const value: CircleAndGoalsContextType = {
    // Circle Savings Data
    circles: circleData.circles,
    joinedCircles: circleData.joinedCircles,
    contributions: circleData.contributions,
    payouts: circleData.payouts,
    votingEvents: circleData.votingEvents,
    votes: circleData.votes,
    voteResults: circleData.voteResults,
    positions: circleData.positions,
    invitations: circleData.invitations,
    latePayments: circleData.latePayments,
    forfeitures: circleData.forfeitures,
    collateralWithdrawals: circleData.collateralWithdrawals,
    collateralReturns: circleData.collateralReturns,
    deadCircleFees: circleData.deadCircleFees,
    vaultProjects: circleData.vaultProjects,

    // Circle Actions - use actual hook method names
    createCircle: circleData.createCircle as any,
    joinCircle: circleData.joinCircle as any,
    contributeToCircle: circleData.contribute as any, // actual method is 'contribute'
    castVote: circleData.castVote as any,
    executeVote: circleData.executeVote as any,
    withdrawCollateral: circleData.withdrawCollateral as any,
    updateCircleVisibility: circleData.updateCircleVisibility as any,
    getCircleById: circleData.getCircleById as any,
    inviteMember: circleData.inviteMembers as any, // actual method is 'inviteMembers'
    forfeitMember: circleData.forfeitMember as any,

    // Personal Goals Data - use actual hook property names
    goals: goalData.goals,
    goalContributions: goalData.contributions, // actual property is 'contributions'
    goalWithdrawals: goalData.withdrawals, // actual property is 'withdrawals'

    // Goal Actions - use actual hook method names
    createGoal: goalData.createPersonalGoal as any, // actual method is 'createPersonalGoal'
    contributeToGoal: goalData.contributeToGoal as any,
    withdraw: goalData.withdraw as any,
    claimYield: goalData.completeGoal as any, // actual method is 'completeGoal'

    // Loading States
    isCirclesLoading: circleData.isLoading,
    isGoalsLoading: goalData.isLoading,
    isTransactionPending:
      circleData.isTransactionPending || goalData.isTransacting, // actual property is 'isTransacting'

    // Error States
    circlesError: circleData.error,
    goalsError: goalData.error,

    // Refetch Functions - use actual hook method names
    refetchCircles: circleData.refreshCircles, // actual method is 'refreshCircles'
    refetchGoals: goalData.refreshGoals, // actual method is 'refreshGoals'
  };

  return (
    <CircleAndGoalsContext.Provider value={value}>
      {children}
    </CircleAndGoalsContext.Provider>
  );
};

/**
 * Hook to access Circle and Goals data from anywhere in the app
 * This replaces individual useCircleSavings and usePersonalGoals calls
 */
export const useCircleAndGoals = () => {
  const context = useContext(CircleAndGoalsContext);
  if (context === undefined) {
    throw new Error(
      "useCircleAndGoals must be used within a CircleAndGoalsProvider",
    );
  }
  return context;
};
