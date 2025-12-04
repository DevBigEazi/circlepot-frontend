// Interfaces for personal goals hook and related entities
export interface PersonalGoal {
  id: string;
  goalId: bigint;
  goalName: string;
  goalAmount: bigint;
  currentAmount: bigint;
  frequency: 0 | 1 | 2;
  contributionAmount: bigint;
  deadline: bigint;
  isActive: boolean;
  createdAt: bigint;
  user: {
    id: string;
    username: string;
    fullName: string;
  };
}

export interface GoalContribution {
  id: string;
  amount: bigint;
  goalId: bigint;
  goalName: string;
  timestamp: bigint;
}

export interface GoalWithdrawal {
  id: string;
  goalId: bigint;
  goalName: string;
  amount: bigint;
  penalty: bigint;
  timestamp: bigint;
}

export interface CreateGoalParams {
  name: string;
  targetAmount: bigint;
  contributionAmount: bigint;
  frequency: 0 | 1 | 2; // 0 = Daily, 1 = Weekly, 2 = Monthly
  deadline: bigint;
}

// Interfaces for goal withdrawal modal
export interface GoalWithdrawalModalProps {
  isOpen: boolean;
  goalName: string;
  currentAmount: number;
  targetAmount: number;
  isLoading: boolean;
  onClose: () => void;
  onCompleteWithdraw: () => void;
  onEarlyWithdraw: () => void;
  goalCard?: React.ReactNode;
}

// Interfaces for active goals list
export interface Goal {
  id: string;
  goalId: bigint;
  goalName: string;
  progress: number;
  targetAmount: number;
  savedAmount: number;
  contributionAmount: bigint;
  formattedDeadline: string;
  nextContribution: string;
  frequency: number;
}

export interface ActiveGoalsListProps {
  goals: Goal[];
  isLoading: boolean;
  contributingGoalId: bigint | null;
  onContribute: (goalId: bigint, amount: bigint) => Promise<void>;
  onWithdraw: (goalId: bigint) => Promise<void>;
  contributions: Array<{
    goalId: bigint;
    timestamp: bigint;
  }>;
}

// Interfaces for circles
export interface ActiveCircle {
  id: string;
  name: string;
  currentPosition: number;
  totalPositions: number;
  status: 'active' | 'completed' | 'pending' | 'voting' | 'withdrawn' | 'created' | 'unknown';
  payoutAmount: string;
  nextPayout: string;
  contribution: string;
  membersList: any[];
  rawCircle: any;
  frequency: number; // 0: Daily, 1: Weekly, 2: Monthly
  currentRound: bigint;
  contributionDeadline: bigint; // Unix timestamp for when contributions are due
  votingEvents?: any[];
  votes?: any[];
  voteResults?: any[];
  positions?: any[];
  payouts?: any[];
  hasContributed?: boolean;
}

export interface Circle {
  id: string;
  circleId: bigint;
  circleName: string;
  circleDescription: string;
  contributionAmount: bigint;
  collateralAmount: bigint;
  frequency: 0 | 1 | 2;
  maxMembers: bigint;
  currentMembers: bigint; // current member count
  currentRound: bigint;
  visibility: 0 | 1;
  state: number; // 0 = PENDING, 1 = CREATED, 2 = VOTING, 3 = ACTIVE, 4 = COMPLETED, 5 = WITHDRAWN
  createdAt: bigint;
  startedAt: bigint;
  creator: {
    id: string;
    username: string;
    fullName: string;
  };
}

export interface CircleJoined {
  id: string;
  circleId: bigint;
  user: {
    id: string;
    username: string;
    fullName: string;
  };
  currentMembers: bigint;
  circleState: number;
  timestamp: bigint;
}

export interface Contribution {
  id: string;
  circleId: bigint;
  round: bigint;
  amount: bigint;
  timestamp: bigint;
}

export interface Payout {
  id: string;
  circleId: bigint;
  round: bigint;
  payoutAmount: bigint;
  timestamp: bigint;
}

export interface CreateCircleParams {
  title: string;
  description: string;
  contributionAmount: bigint;
  frequency: 0 | 1 | 2;
  maxMembers: bigint;
  visibility: 0 | 1;
}

// Voting-related interfaces
export interface VotingInitiated {
  id: string;
  circleId: bigint;
  votingStartAt: bigint;
  votingEndAt: bigint;
  timestamp: bigint;
  transactionHash: string;
}

export interface VoteCast {
  id: string;
  circleId: bigint;
  voter: {
    id: string;
    username: string;
    fullName: string;
  };
  choice: number; // 1 = START, 2 = WITHDRAW
  timestamp: bigint;
  transactionHash: string;
}

export interface VoteExecuted {
  id: string;
  circleId: bigint;
  circleStarted: boolean;
  startVoteTotal: bigint;
  withdrawVoteTotal: bigint;
  timestamp: bigint;
  transactionHash: string;
}

// Position assignment interface
export interface PositionAssigned {
  id: string;
  circleId: bigint;
  user: {
    id: string;
    username: string;
    fullName: string;
  };
  position: bigint;
  timestamp: bigint;
  transactionHash: string;
}

// Member invitation interface
export interface MemberInvited {
  id: string;
  circleId: bigint;
  inviter: {
    id: string;
    username: string;
    fullName: string;
  };
  invitee: {
    id: string;
    username: string;
    fullName: string;
  };
  invitedAt: bigint;
  timestamp: bigint;
  transactionHash: string;
}

// Late payment interface
export interface LatePayment {
  id: string;
  circleId: bigint;
  round: bigint;
  fee: bigint;
  timestamp: bigint;
  transactionHash: string;
}

// Member forfeited interface
export interface MemberForfeited {
  id: string;
  circleId: bigint;
  forfeiter: {
    id: string;
    username: string;
    fullName: string;
  };
  forfeitedUser: {
    id: string;
    username: string;
    fullName: string;
  };
  round: bigint;
  deductionAmount: bigint;
  timestamp: bigint;
  transactionHash: string;
}

// Collateral withdrawal interface
export interface CollateralWithdrawn {
  id: string;
  circleId: bigint;
  amount: bigint;
  timestamp: bigint;
  transactionHash: string;
}

// Reputation and Credit Score interfaces
export interface ReputationIncrease {
  id: string;
  points: bigint;
  reason: string;
  timestamp: bigint;
  transactionHash: string;
}

export interface ReputationDecrease {
  id: string;
  points: bigint;
  reason: string;
  timestamp: bigint;
  transactionHash: string;
}

export interface ScoreCategoryChange {
  id: string;
  oldCategory: number;
  newCategory: number;
  timestamp: bigint;
  transactionHash: string;
}

export interface CircleCompletion {
  id: string;
  circleId: bigint;
  timestamp: bigint;
  transactionHash: string;
}

export interface LatePaymentRecord {
  id: string;
  circleId: bigint;
  round: bigint;
  fee: bigint;
  timestamp: bigint;
  transactionHash: string;
}

export interface GoalCompletion {
  id: string;
  goalId: bigint;
  timestamp: bigint;
  transactionHash: string;
}

export interface CreditScore {
  score: number;
  category: ScoreCategory;
  categoryLabel: string;
  categoryColor: string;
  totalCirclesCompleted: number;
  totalGoalsCompleted: number;
  totalLatePayments: number;
}

export enum ScoreCategory {
  POOR = 0,
  FAIR = 1,
  GOOD = 2,
  VERY_GOOD = 3,
  EXCEPTIONAL = 4,
}
