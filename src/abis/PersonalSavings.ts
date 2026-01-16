export const PERSONAL_SAVING_ABI = [
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
  {
    "inputs": [
      { "internalType": "address", "name": "implementation", "type": "address" }
    ],
    "name": "ERC1967InvalidImplementation",
    "type": "error"
  },
  { "inputs": [], "name": "ERC1967NonPayable", "type": "error" },
  { "inputs": [], "name": "FailedCall", "type": "error" },
  { "inputs": [], "name": "GoalNotActive", "type": "error" },
  { "inputs": [], "name": "InsufficientBalance", "type": "error" },
  { "inputs": [], "name": "InvalidContributionAmount", "type": "error" },
  { "inputs": [], "name": "InvalidDeadline", "type": "error" },
  { "inputs": [], "name": "InvalidGoalAmount", "type": "error" },
  { "inputs": [], "name": "InvalidInitialization", "type": "error" },
  { "inputs": [], "name": "InvalidSavingGoal", "type": "error" },
  { "inputs": [], "name": "InvalidTreasuryAddress", "type": "error" },
  { "inputs": [], "name": "NotGoalOwner", "type": "error" },
  { "inputs": [], "name": "NotInitializing", "type": "error" },
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
  { "inputs": [], "name": "UnsupportedToken", "type": "error" },
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
        "name": "goalId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "owner",
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
        "name": "currentAmount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "token",
        "type": "address"
      }
    ],
    "name": "GoalContribution",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "goalId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "owner",
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
        "name": "penalty",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "token",
        "type": "address"
      }
    ],
    "name": "GoalWithdrawn",
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
        "name": "goalId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "currentAmount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "enum PersonalSavings.Frequency",
        "name": "frequency",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "deadline",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "isActive",
        "type": "bool"
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
    "name": "PersonalGoalCreated",
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
        "name": "goalId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "yieldAmount",
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
        "internalType": "address",
        "name": "token",
        "type": "address"
      }
    ],
    "name": "YieldDistributed",
    "type": "event"
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
      { "internalType": "uint256", "name": "_goalId", "type": "uint256" }
    ],
    "name": "completeGoal",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_goalId", "type": "uint256" }
    ],
    "name": "contributeToGoal",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "components": [
          { "internalType": "string", "name": "name", "type": "string" },
          {
            "internalType": "uint256",
            "name": "targetAmount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "contributionAmount",
            "type": "uint256"
          },
          {
            "internalType": "enum PersonalSavings.Frequency",
            "name": "frequency",
            "type": "uint8"
          },
          { "internalType": "uint256", "name": "deadline", "type": "uint256" },
          { "internalType": "bool", "name": "enableYield", "type": "bool" },
          { "internalType": "address", "name": "token", "type": "address" },
          { "internalType": "uint256", "name": "yieldAPY", "type": "uint256" }
        ],
        "internalType": "struct PersonalSavings.CreateGoalParams",
        "name": "params",
        "type": "tuple"
      }
    ],
    "name": "createPersonalGoal",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_goalId", "type": "uint256" }
    ],
    "name": "getGoalToken",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
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
      { "internalType": "address", "name": "_user", "type": "address" }
    ],
    "name": "getUserGoals",
    "outputs": [
      { "internalType": "uint256[]", "name": "", "type": "uint256[]" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "_user", "type": "address" }
    ],
    "name": "getUserReputation",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "goalCounter",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "name": "goalShares",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "name": "goalToken",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
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
      { "internalType": "address", "name": "_token", "type": "address" }
    ],
    "name": "isSupportedToken",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
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
    "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "name": "personalGoals",
    "outputs": [
      { "internalType": "address", "name": "owner", "type": "address" },
      { "internalType": "string", "name": "name", "type": "string" },
      { "internalType": "uint256", "name": "targetAmount", "type": "uint256" },
      { "internalType": "uint256", "name": "currentAmount", "type": "uint256" },
      {
        "internalType": "uint256",
        "name": "contributionAmount",
        "type": "uint256"
      },
      {
        "internalType": "enum PersonalSavings.Frequency",
        "name": "frequency",
        "type": "uint8"
      },
      { "internalType": "uint256", "name": "deadline", "type": "uint256" },
      { "internalType": "uint256", "name": "createdAt", "type": "uint256" },
      { "internalType": "bool", "name": "isActive", "type": "bool" },
      {
        "internalType": "uint256",
        "name": "lastContributionAt",
        "type": "uint256"
      },
      { "internalType": "bool", "name": "isYieldEnabled", "type": "bool" }
    ],
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
    "outputs": [
      { "internalType": "contract IReputation", "name": "", "type": "address" }
    ],
    "stateMutability": "view",
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
    "inputs": [
      {
        "internalType": "address",
        "name": "_userProfileContract",
        "type": "address"
      }
    ],
    "name": "setUserProfileContract",
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
      { "internalType": "address", "name": "_new", "type": "address" }
    ],
    "name": "updateTreasury",
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
    "inputs": [
      { "internalType": "address", "name": "", "type": "address" },
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "name": "userGoals",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "userProfileContract",
    "outputs": [
      { "internalType": "contract IUserProfile", "name": "", "type": "address" }
    ],
    "stateMutability": "view",
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
      { "internalType": "uint256", "name": "_goalId", "type": "uint256" },
      { "internalType": "uint256", "name": "_amount", "type": "uint256" }
    ],
    "name": "withdrawFromGoal",
    "outputs": [],
    "stateMutability": "nonpayable",
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
