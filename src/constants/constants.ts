// Blockchain Configuration
export const CHAIN_ID = 11142220; // Celo-Sepolia testnet

// Contract Addresses
export const CUSD_ADDRESS = import.meta.env.VITE_CUSD_ADDRESS;
export const PERSONAL_SAVINGS_ADDRESS = import.meta.env
  .VITE_PERSONAL_SAVINGS_ADDRESS;
export const CIRCLE_SAVINGS_ADDRESS = import.meta.env
  .VITE_CIRCLE_SAVINGS_ADDRESS;
export const USER_PROFILE_ADDRESS = import.meta.env.VITE_USER_PROFILE_ADDRESS;
export const REPUTATION_ADDRESS = import.meta.env.VITE_REPUTATION_ADDRESS;

// Subgraph Configuration
export const SUBGRAPH_URL = import.meta.env.VITE_SUBGRAPH_URL;
export const SUBGRAPH_HEADERS = { Authorization: "Bearer {api-key}" };

// Platform Config
export const PLATFORM_FEE_RECIPIENT = import.meta.env.VITE_PLATFORM_FEE_RECIPIENT; // Dedicated Platform Wallet
export const WITHDRAWAL_FEE = 0.2; // 0.2 cUSD
