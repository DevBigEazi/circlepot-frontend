// Blockchain Configuration
export const CHAIN_ID = 11142220; // Celo-Sepolia testnet

// Contract Addresses
export const CUSD_ADDRESS = import.meta.env.VITE_CUSD_ADDRESS;
export const PERSONAL_SAVINGS_ADDRESS = import.meta.env.VITE_PERSONAL_SAVINGS_ADDRESS;
export const CIRCLE_SAVINGS_ADDRESS = import.meta.env.VITE_CIRCLE_SAVINGS_ADDRESS;
export const USER_PROFILE_ADDRESS = import.meta.env.VITE_USER_PROFILE_ADDRESS;

// Subgraph Configuration
export const SUBGRAPH_URL = import.meta.env.VITE_SUBGRAPH_URL;
export const SUBGRAPH_HEADERS = { Authorization: "Bearer {api-key}" };
