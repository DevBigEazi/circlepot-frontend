export const CIRCLE_SAVINGS_ABI = [
  { "inputs": [], "stateMutability": "nonpayable", "type": "constructor" },
  {
    "inputs": [
      { "internalType": "address", "name": "target", "type": "address" }
    ],
    "name": "AddressEmptyCode",
    "type": "error"
  },
  { "inputs": [], "name": "AddressZeroNotAllowed", "type": "error" },
  { "inputs": [], "name": "AlreadyContributed", "type": "error" },
  { "inputs": [], "name": "AlreadyJoined", "type": "error" },
  { "inputs": [], "name": "AlreadyVoted", "type": "error" },
  { "inputs": [], "name": "CircleNotActive", "type": "error" },
  { "inputs": [], "name": "CircleNotExist", "type": "error" },
  { "inputs": [], "name": "CircleNotOpen", "type": "error" },
  { "inputs": [], "name": "CircleNotPrivate", "type": "error" },
  {
    "inputs": [
      { "internalType": "address", "name": "implementation", "type": "address" }
    ],
    "name": "ERC1967InvalidImplementation",
    "type": "error"
  },
  { "inputs": [], "name": "ERC1967NonPayable", "type": "error" },
  { "inputs": [], "name": "FailedCall", "type": "error" },
  { "inputs": [], "name": "GracePeriodNotExpired", "type": "error" },
  { "inputs": [], "name": "InsufficientCollateral", "type": "error" },
  { "inputs": [], "name": "InvalidCircle", "type": "error" },
  { "inputs": [], "name": "InvalidContributionAmount", "type": "error" },
  { "inputs": [], "name": "InvalidInitialization", "type": "error" },
  { "inputs": [], "name": "InvalidMemberCount", "type": "error" },
  { "inputs": [], "name": "InvalidVoteChoice", "type": "error" },
  { "inputs": [], "name": "MinMembersNotReached", "type": "error" },
  { "inputs": [], "name": "NotActiveMember", "type": "error" },
  { "inputs": [], "name": "NotInitializing", "type": "error" },
  { "inputs": [], "name": "NotInvited", "type": "error" },
  { "inputs": [], "name": "NotNextRecipient", "type": "error" },
  { "inputs": [], "name": "OnlyCreator", "type": "error" },
  {
    "inputs": [
      { "internalType": "address", "name": "owner", "type": "address" }
    ],
    "name": "OwnableInvalidOwner",
    "type": "error"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "account", "type": "address" }
    ],
    "name": "OwnableUnauthorizedAccount",
    "type": "error"
  },
  { "inputs": [], "name": "ReentrancyGuardReentrantCall", "type": "error" },
  {
    "inputs": [
      { "internalType": "address", "name": "token", "type": "address" }
    ],
    "name": "SafeERC20FailedOperation",
    "type": "error"
  },
  { "inputs": [], "name": "SameVisibility", "type": "error" },
  { "inputs": [], "name": "TitleTooShortOrLong", "type": "error" },
  { "inputs": [], "name": "TokenAlreadySupported", "type": "error" },
  { "inputs": [], "name": "TokenNotSupported", "type": "error" },
  { "inputs": [], "name": "UUPSUnauthorizedCallContext", "type": "error" },
  {
    "inputs": [
      { "internalType": "bytes32", "name": "slot", "type": "bytes32" }
    ],
    "name": "UUPSUnsupportedProxiableUUID",
    "type": "error"
  },
  { "inputs": [], "name": "UltimatumNotPassed", "type": "error" },
  { "inputs": [], "name": "UltimatumNotReached", "type": "error" },
  { "inputs": [], "name": "UnsupportedToken", "type": "error" },
  { "inputs": [], "name": "VoteAlreadyExecuted", "type": "error" },
  { "inputs": [], "name": "VotingAlreadyExecuted", "type": "error" },
  { "inputs": [], "name": "VotingNotActive", "type": "error" },
  { "inputs": [], "name": "VotingPeriodEnded", "type": "error" },
  { "inputs": [], "name": "VotingStillActive", "type": "error" },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "circleId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "title",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "description",
        "type": "string"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "creator",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "contributionAmount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "enum CircleSavings.Frequency",
        "name": "frequency",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "maxMembers",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "enum CircleSavings.Visibility",
        "name": "visibility",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "createdAt",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "collateralLocked",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "token",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "yieldAPY",
        "type": "uint256"
      }
    ],
    "name": "CircleCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "circleId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "member",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "currentMembers",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "enum CircleSavings.CircleState",
        "name": "state",
        "type": "uint8"
      }
    ],
    "name": "CircleJoined",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "circleId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "startedAt",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "enum CircleSavings.CircleState",
        "name": "state",
        "type": "uint8"
      }
    ],
    "name": "CircleStarted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "circleId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "member",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "token",
        "type": "address"
      }
    ],
    "name": "CollateralReturned",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "circleId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "member",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "token",
        "type": "address"
      }
    ],
    "name": "CollateralWithdrawn",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "newImplementation",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "version",
        "type": "uint256"
      }
    ],
    "name": "ContractUpgraded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "circleId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "round",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "member",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "token",
        "type": "address"
      }
    ],
    "name": "ContributionMade",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "circleId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "creator",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "DeadCircleFeeDeducted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint64",
        "name": "version",
        "type": "uint64"
      }
    ],
    "name": "Initialized",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "circleId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "round",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "member",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "fee",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "token",
        "type": "address"
      }
    ],
    "name": "LateContributionMade",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "circleId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "member",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "LateFeeAddedToPool",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "circleId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "round",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "member",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "deduction",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "forfeiter",
        "type": "address"
      }
    ],
    "name": "MemberForfeited",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "circleId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "creator",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "invitee",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "invitedAt",
        "type": "uint256"
      }
    ],
    "name": "MemberInvited",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "circleId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "member",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "rewardAmount",
        "type": "uint256"
      }
    ],
    "name": "MemberRewardClaimed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "circleId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "round",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "recipient",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "token",
        "type": "address"
      }
    ],
    "name": "PayoutDistributed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "circleId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "member",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "points",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "reason",
        "type": "string"
      }
    ],
    "name": "PointsAwarded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "circleId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "member",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "position",
        "type": "uint256"
      }
    ],
    "name": "PositionAssigned",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "newContract",
        "type": "address"
      }
    ],
    "name": "ReputationContractUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "token",
        "type": "address"
      }
    ],
    "name": "TokenAdded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "token",
        "type": "address"
      }
    ],
    "name": "TokenRemoved",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "implementation",
        "type": "address"
      }
    ],
    "name": "Upgraded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "token",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newVault",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "project",
        "type": "string"
      }
    ],
    "name": "VaultUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "circleId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "creator",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "enum CircleSavings.Visibility",
        "name": "newVisibility",
        "type": "uint8"
      }
    ],
    "name": "VisibilityUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "circleId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "voter",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "enum CircleSavings.VoteChoice",
        "name": "choice",
        "type": "uint8"
      }
    ],
    "name": "VoteCast",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "circleId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "circleStarted",
        "type": "bool"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "startVoteCount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "withdrawVoteCount",
        "type": "uint256"
      }
    ],
    "name": "VoteExecuted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "circleId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "votingStartTime",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "votingEndTime",
        "type": "uint256"
      }
    ],
    "name": "VotingInitiated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "circleId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "totalSurplus",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "platformShare",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "communityShare",
        "type": "uint256"
      }
    ],
    "name": "YieldDistributed",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "FIXED_FEE_AMOUNT",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "FIXED_FEE_THRESHOLD",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "LATE_FEE_BPS",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MAX_CONTRIBUTION",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MAX_MEMBERS",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MIN_CONTRIBUTION",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MIN_MEMBERS",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "PLATFORM_FEE_BPS",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "PLATFORM_YIELD_SHARE_BPS",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "PRIVATE_CIRCLE_DEAD_FEE",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "PUBLIC_CIRCLE_DEAD_FEE",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "START_VOTE_THRESHOLD",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "UPGRADE_INTERFACE_VERSION",
    "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "VERSION",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "VISIBILITY_UPDATE_FEE",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "VOTING_PERIOD",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_circleId", "type": "uint256" }
    ],
    "name": "WithdrawCollateral",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "enum CircleSavings.Frequency",
        "name": "f",
        "type": "uint8"
      }
    ],
    "name": "_getGracePeriod",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "_token", "type": "address" }
    ],
    "name": "addSupportedToken",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_circleId", "type": "uint256" }
    ],
    "name": "canWithdrawAfterVote",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_circleId", "type": "uint256" },
      {
        "internalType": "enum CircleSavings.VoteChoice",
        "name": "_choice",
        "type": "uint8"
      }
    ],
    "name": "castVote",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "name": "circleConfigs",
    "outputs": [
      { "internalType": "uint256", "name": "circleId", "type": "uint256" },
      { "internalType": "string", "name": "title", "type": "string" },
      { "internalType": "string", "name": "description", "type": "string" },
      { "internalType": "address", "name": "creator", "type": "address" },
      {
        "internalType": "uint256",
        "name": "contributionAmount",
        "type": "uint256"
      },
      {
        "internalType": "enum CircleSavings.Frequency",
        "name": "frequency",
        "type": "uint8"
      },
      { "internalType": "uint256", "name": "maxMembers", "type": "uint256" },
      {
        "internalType": "enum CircleSavings.Visibility",
        "name": "visibility",
        "type": "uint8"
      },
      { "internalType": "uint256", "name": "createdAt", "type": "uint256" },
      { "internalType": "bool", "name": "isYieldEnabled", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "circleCounter",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" },
      { "internalType": "address", "name": "", "type": "address" }
    ],
    "name": "circleInvitations",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "name": "circleLateFeePool",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" },
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "name": "circleMemberList",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" },
      { "internalType": "address", "name": "", "type": "address" }
    ],
    "name": "circleMembers",
    "outputs": [
      { "internalType": "uint256", "name": "position", "type": "uint256" },
      {
        "internalType": "uint256",
        "name": "totalContributed",
        "type": "uint256"
      },
      { "internalType": "bool", "name": "hasReceivedPayout", "type": "bool" },
      { "internalType": "bool", "name": "isActive", "type": "bool" },
      {
        "internalType": "uint256",
        "name": "collateralLocked",
        "type": "uint256"
      },
      { "internalType": "uint256", "name": "joinedAt", "type": "uint256" },
      {
        "internalType": "uint256",
        "name": "performancePoints",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" },
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "name": "circleRoundDeadlines",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "name": "circleShares",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "name": "circleStatus",
    "outputs": [
      {
        "internalType": "enum CircleSavings.CircleState",
        "name": "state",
        "type": "uint8"
      },
      {
        "internalType": "uint256",
        "name": "currentMembers",
        "type": "uint256"
      },
      { "internalType": "uint256", "name": "currentRound", "type": "uint256" },
      { "internalType": "uint256", "name": "totalRounds", "type": "uint256" },
      { "internalType": "uint256", "name": "startedAt", "type": "uint256" },
      { "internalType": "uint256", "name": "totalPot", "type": "uint256" },
      {
        "internalType": "uint256",
        "name": "contributionsThisRound",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "name": "circleToken",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "name": "circleVotes",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "votingStartTime",
        "type": "uint256"
      },
      { "internalType": "uint256", "name": "votingEndTime", "type": "uint256" },
      {
        "internalType": "uint256",
        "name": "startVoteCount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "withdrawVoteCount",
        "type": "uint256"
      },
      { "internalType": "bool", "name": "votingActive", "type": "bool" },
      { "internalType": "bool", "name": "voteExecuted", "type": "bool" },
      {
        "internalType": "uint256",
        "name": "totalEligibleVoters",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_circleId", "type": "uint256" }
    ],
    "name": "contribute",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "components": [
          { "internalType": "string", "name": "title", "type": "string" },
          { "internalType": "string", "name": "description", "type": "string" },
          {
            "internalType": "uint256",
            "name": "contributionAmount",
            "type": "uint256"
          },
          {
            "internalType": "enum CircleSavings.Frequency",
            "name": "frequency",
            "type": "uint8"
          },
          {
            "internalType": "uint256",
            "name": "maxMembers",
            "type": "uint256"
          },
          {
            "internalType": "enum CircleSavings.Visibility",
            "name": "visibility",
            "type": "uint8"
          },
          { "internalType": "bool", "name": "enableYield", "type": "bool" },
          { "internalType": "address", "name": "token", "type": "address" },
          { "internalType": "uint256", "name": "yieldAPY", "type": "uint256" }
        ],
        "internalType": "struct CircleSavings.CreateCircleParams",
        "name": "params",
        "type": "tuple"
      }
    ],
    "name": "createCircle",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_circleId", "type": "uint256" }
    ],
    "name": "executeVote",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "fixedFeeThreshold",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_circleId", "type": "uint256" },
      {
        "internalType": "address[]",
        "name": "_membersToForfeit",
        "type": "address[]"
      }
    ],
    "name": "forfeitMember",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_circleId", "type": "uint256" }
    ],
    "name": "getCircleDetails",
    "outputs": [
      {
        "components": [
          { "internalType": "uint256", "name": "circleId", "type": "uint256" },
          { "internalType": "string", "name": "title", "type": "string" },
          { "internalType": "string", "name": "description", "type": "string" },
          { "internalType": "address", "name": "creator", "type": "address" },
          {
            "internalType": "uint256",
            "name": "contributionAmount",
            "type": "uint256"
          },
          {
            "internalType": "enum CircleSavings.Frequency",
            "name": "frequency",
            "type": "uint8"
          },
          {
            "internalType": "uint256",
            "name": "maxMembers",
            "type": "uint256"
          },
          {
            "internalType": "enum CircleSavings.Visibility",
            "name": "visibility",
            "type": "uint8"
          },
          { "internalType": "uint256", "name": "createdAt", "type": "uint256" },
          { "internalType": "bool", "name": "isYieldEnabled", "type": "bool" }
        ],
        "internalType": "struct CircleSavings.CircleConfig",
        "name": "config",
        "type": "tuple"
      },
      {
        "components": [
          {
            "internalType": "enum CircleSavings.CircleState",
            "name": "state",
            "type": "uint8"
          },
          {
            "internalType": "uint256",
            "name": "currentMembers",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "currentRound",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalRounds",
            "type": "uint256"
          },
          { "internalType": "uint256", "name": "startedAt", "type": "uint256" },
          { "internalType": "uint256", "name": "totalPot", "type": "uint256" },
          {
            "internalType": "uint256",
            "name": "contributionsThisRound",
            "type": "uint256"
          }
        ],
        "internalType": "struct CircleSavings.CircleStatus",
        "name": "status",
        "type": "tuple"
      },
      {
        "internalType": "uint256",
        "name": "currentDeadline",
        "type": "uint256"
      },
      { "internalType": "bool", "name": "canStart", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_circleId", "type": "uint256" }
    ],
    "name": "getCircleMembers",
    "outputs": [
      { "internalType": "address[]", "name": "", "type": "address[]" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_circleId", "type": "uint256" }
    ],
    "name": "getCircleProgress",
    "outputs": [
      { "internalType": "uint256", "name": "currentRound", "type": "uint256" },
      { "internalType": "uint256", "name": "totalRounds", "type": "uint256" },
      {
        "internalType": "uint256",
        "name": "contributionsThisRound",
        "type": "uint256"
      },
      { "internalType": "uint256", "name": "totalMembers", "type": "uint256" },
      { "internalType": "uint256", "name": "lateFeePool", "type": "uint256" },
      { "internalType": "uint256", "name": "totalPoints", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_circleId", "type": "uint256" }
    ],
    "name": "getCircleToken",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_circleId", "type": "uint256" },
      { "internalType": "address", "name": "_member", "type": "address" }
    ],
    "name": "getMemberInfo",
    "outputs": [
      {
        "components": [
          { "internalType": "uint256", "name": "position", "type": "uint256" },
          {
            "internalType": "uint256",
            "name": "totalContributed",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "hasReceivedPayout",
            "type": "bool"
          },
          { "internalType": "bool", "name": "isActive", "type": "bool" },
          {
            "internalType": "uint256",
            "name": "collateralLocked",
            "type": "uint256"
          },
          { "internalType": "uint256", "name": "joinedAt", "type": "uint256" },
          {
            "internalType": "uint256",
            "name": "performancePoints",
            "type": "uint256"
          }
        ],
        "internalType": "struct CircleSavings.Member",
        "name": "memberInfo",
        "type": "tuple"
      },
      {
        "internalType": "bool",
        "name": "hasContributedThisRound",
        "type": "bool"
      },
      { "internalType": "uint256", "name": "nextDeadline", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "_token", "type": "address" }
    ],
    "name": "getPlatformFees",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getSupportedTokens",
    "outputs": [
      { "internalType": "address[]", "name": "", "type": "address[]" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_circleId", "type": "uint256" }
    ],
    "name": "getVoteInfo",
    "outputs": [
      { "internalType": "uint256", "name": "votingEndTime", "type": "uint256" },
      {
        "internalType": "uint256",
        "name": "startVoteCount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "withdrawVoteCount",
        "type": "uint256"
      },
      { "internalType": "bool", "name": "votingActive", "type": "bool" },
      { "internalType": "bool", "name": "voteExecuted", "type": "bool" },
      {
        "internalType": "enum CircleSavings.VoteChoice",
        "name": "userVote",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address[]",
        "name": "_supportedTokens",
        "type": "address[]"
      },
      { "internalType": "address", "name": "_treasury", "type": "address" },
      {
        "internalType": "address",
        "name": "_reputationContract",
        "type": "address"
      },
      { "internalType": "address", "name": "initialOwner", "type": "address" }
    ],
    "name": "initialize",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_circleId", "type": "uint256" }
    ],
    "name": "initiateVoting",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_circleId", "type": "uint256" },
      { "internalType": "address[]", "name": "_invitees", "type": "address[]" }
    ],
    "name": "inviteMembers",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_circleId", "type": "uint256" },
      { "internalType": "address", "name": "_user", "type": "address" }
    ],
    "name": "isInvited",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "_token", "type": "address" }
    ],
    "name": "isSupportedToken",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_circleId", "type": "uint256" }
    ],
    "name": "joinCircle",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" },
      { "internalType": "address", "name": "", "type": "address" }
    ],
    "name": "memberVotes",
    "outputs": [
      {
        "internalType": "enum CircleSavings.VoteChoice",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "platformFeeBps",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "name": "platformFeesByToken",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "proxiableUUID",
    "outputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "_token", "type": "address" }
    ],
    "name": "removeSupportedToken",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "reputationContract",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" },
      { "internalType": "uint256", "name": "", "type": "uint256" },
      { "internalType": "address", "name": "", "type": "address" }
    ],
    "name": "roundContributions",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_newBps", "type": "uint256" }
    ],
    "name": "setPlatformFeeBps",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "_token", "type": "address" },
      { "internalType": "address", "name": "_vault", "type": "address" },
      { "internalType": "string", "name": "_project", "type": "string" }
    ],
    "name": "setTokenVault",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "name": "supportedTokenList",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "name": "supportedTokens",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "name": "tokenVaults",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "name": "totalCirclePoints",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "newOwner", "type": "address" }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "treasury",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_circleId", "type": "uint256" },
      {
        "internalType": "enum CircleSavings.Visibility",
        "name": "_newVisibility",
        "type": "uint8"
      }
    ],
    "name": "updateCircleVisibility",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_newThreshold", "type": "uint256" }
    ],
    "name": "updateFeeThreshold",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_newReputationContract",
        "type": "address"
      }
    ],
    "name": "updateReputationContract",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "_new", "type": "address" }
    ],
    "name": "updateTreasury",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "_treasury", "type": "address" },
      {
        "internalType": "address",
        "name": "_reputationContract",
        "type": "address"
      },
      { "internalType": "uint8", "name": "_version", "type": "uint8" }
    ],
    "name": "upgrade",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newImplementation",
        "type": "address"
      },
      { "internalType": "bytes", "name": "data", "type": "bytes" }
    ],
    "name": "upgradeToAndCall",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "version",
    "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "_token", "type": "address" }
    ],
    "name": "withdrawPlatformFees",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;
