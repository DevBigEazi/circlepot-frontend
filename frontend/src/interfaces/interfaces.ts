// Interfaces for personal goals hook and related entities
export interface PersonalGoal {
  id: string;
  goalId: bigint;
  goalName: string;
  goalAmount: bigint;
  currentAmount: bigint;
  frequency: 0 | 1 | 2;
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
  savedAmount: number;
  targetAmount: number;
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