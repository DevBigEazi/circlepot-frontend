import { useState, useEffect, useCallback, useMemo } from "react";
import { useActiveAccount, useSendTransaction } from "thirdweb/react";
import { prepareContractCall, getContract } from "thirdweb";
import { defineChain } from "thirdweb/chains";
import { ThirdwebClient } from "thirdweb";
import { USER_PROFILE_ABI } from "../abis/UserProfileV1";
import { useQuery } from "@tanstack/react-query";
import { gql, request } from "graphql-request";

const SUBGRAPH_URL = import.meta.env.VITE_SUBGRAPH_URL;
const SUBGRAPH_HEADERS = { Authorization: "Bearer {api-key}" };

const userProfileQuery = gql`
  query GetUserProfile($id: String!) {
    user(id: $id) {
      id
      email
      username
      fullName
      accountId
      photo
      lastPhotoUpdate
      createdAt
      hasProfile
      repCategory
      totalReputation
      totalLatePayments
      totalGoalsCompleted
      totalCirclesCompleted
    }
  }
`;

interface UserProfile {
  userAddress: string;
  email: string;
  username: string;
  fullName: string;
  accountId: bigint;
  photo: string;
  lastPhotoUpdate: bigint;
  createdAt: bigint;
  hasProfile: Boolean;
  repCategory: Number;
  totalReputation: Number;
  totalLatePayments: Number;
  totalGoalsCompleted: Number;
  totalCirclesCompleted: Number;
}

const CONTRACT_ADDRESS = import.meta.env.VITE_USER_PROFILE_ADDRESS;
const CHAIN_ID = 11142220; // Celo-Sepolia testnet

export const useUserProfile = (client: ThirdwebClient) => {
  const account = useActiveAccount();
  const { mutate: sendTransaction, isPending: isSending } =
    useSendTransaction();
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const chain = useMemo(() => defineChain(CHAIN_ID), []);

  const contract = useMemo(
    () =>
      getContract({
        client,
        chain,
        address: CONTRACT_ADDRESS,
        abi: USER_PROFILE_ABI,
      }),
    [client, chain]
  );

  // Fetch user profile from Subgraph
  const {
    data: userData,
    isLoading: isUserLoading,
    refetch: refetchUser,
  } = useQuery({
    queryKey: ["userProfile", account?.address],
    async queryFn() {
      if (!account?.address) return null;

      try {
        const result = await request(
          SUBGRAPH_URL,
          userProfileQuery,
          { id: account.address.toLowerCase() },
          SUBGRAPH_HEADERS
        );
        return result.user;
      } catch (err) {
        console.error("❌ [UserProfile] Error fetching from Subgraph:", err);
        throw err;
      }
    },
    enabled: !!account?.address,
  });

  // Update local state when subgraph data changes
  useEffect(() => {
    if (userData) {
      setHasProfile(userData.hasProfile);
      setProfile({
        userAddress: userData.id,
        email: userData.email,
        username: userData.username,
        fullName: userData.fullName,
        accountId: BigInt(userData.accountId),
        photo: userData.photo,
        lastPhotoUpdate: BigInt(userData.lastPhotoUpdate),
        createdAt: BigInt(userData.createdAt),
        hasProfile: userData.hasProfile,
        repCategory: userData.repCategory,
        totalReputation: userData.totalReputation,
        totalLatePayments: userData.totalLatePayments,
        totalGoalsCompleted: userData.totalGoalsCompleted,
        totalCirclesCompleted: userData.totalCirclesCompleted,
      });
      setError(null);
    } else if (!isUserLoading && account?.address) {
      setHasProfile(false);
      setProfile(null);
    }
  }, [userData, isUserLoading, account?.address]);

  // Create profile function
  const createProfile = useCallback(
    async (
      email: string,
      username: string,
      fullName: string,
      photo: string = ""
    ) => {
      if (!account?.address) {
        const error = "No wallet connected";
        console.error("❌ [UserProfile] Create profile failed:", error);
        throw new Error(error);
      }

      try {
        setError(null);

        // Validate inputs
        if (!email || email.trim().length === 0) {
          throw new Error("Email is required and cannot be empty");
        }

        if (!username || username.trim().length === 0) {
          throw new Error("Username is required and cannot be empty");
        }

        if (!fullName || fullName.trim().length === 0) {
          throw new Error("Full name is required and cannot be empty");
        }

        // Photo is optional - pass empty string if not provided
        const photoUrl = photo?.trim() || "";

        const transaction = prepareContractCall({
          contract,
          method: "createProfile",
          params: [email, username, fullName, photoUrl],
        });

        // Send transaction using the hook from top level
        return new Promise((resolve, reject) => {
          sendTransaction(transaction, {
            onSuccess: (receipt) => {
              // Refetch profile from subgraph after successful transaction
              setTimeout(() => refetchUser(), 2000);
              resolve(receipt);
            },
            onError: (error) => {
              console.error("❌ [UserProfile] Transaction failed:", {
                error: error.message,
                code: (error as any)?.code,
                details: error,
              });
              setError(error.message);
              reject(error);
            },
          });
        });
      } catch (err) {
        const error = err as Error;
        console.error("❌ [UserProfile] Error creating profile:", {
          message: error.message,
          details: error,
        });
        setError(error.message || "Failed to create profile");
        throw err;
      }
    },
    [account?.address, contract, sendTransaction, refetchUser]
  );

  // Update profile photo function
  const updatePhoto = useCallback(
    async (photo: string) => {
      if (!account?.address) {
        const error = "No wallet connected";
        console.error("❌ [UserProfile] Update photo failed:", error);
        throw new Error(error);
      }

      try {
        setError(null);

        // Validate input
        if (!photo || photo.trim().length === 0) {
          throw new Error("Profile photo cannot be empty");
        }

        const transaction = prepareContractCall({
          contract,
          method: "updatePhoto",
          params: [photo],
        });

        // Send transaction
        return new Promise((resolve, reject) => {
          sendTransaction(transaction, {
            onSuccess: (receipt) => {
              // Refresh profile data from subgraph after successful update
              setTimeout(() => refetchUser(), 2000);
              resolve(receipt);
            },
            onError: (error) => {
              console.error("❌ [UserProfile] Transaction failed:", error);
              setError(error.message);
              reject(error);
            },
          });
        });
      } catch (err) {
        const error = err as Error;
        console.error("❌ [UserProfile] Error updating photo:", {
          message: error.message,
          details: error,
        });
        setError(error.message || "Failed to update photo");
        throw err;
      }
    },
    [account?.address, contract, sendTransaction, refetchUser]
  );

  // Check username availability
  const checkUsernameAvailability = useCallback(async (username: string): Promise<boolean> => {
    try {
      const query = gql`
        query CheckUsernameAvailable($username: String!) {
          users(where: { username: $username }) {
            id
          }
        }
      `

      const result = await request(
        SUBGRAPH_URL,
        query,
        { username: username.toLowerCase() },
        SUBGRAPH_HEADERS
      )

      // If no users found with this username, it's available
      return result.users.length === 0;
    } catch (err) {
      console.error('❌ [UserProfile] Error checking username:', err);
      // If query fails, assume unavailable (safer)
      return false;
    }
  }, []);


  // Get profile by AccountId
  const getProfileByAccountId = useCallback(async (accountId: string) => {
    try {
      const query = gql`
        query GetUserByAccountId($accountId: String!) {
          users(where: { accountId: $accountId }) {
            id
            email
            username
            fullName
            accountId
            photo
            lastPhotoUpdate
            createdAt
            hasProfile
            repCategory
            totalReputation
            totalLatePayments
            totalGoalsCompleted
            totalCirclesCompleted
          }
        }
      `;

      const result = await request(
        SUBGRAPH_URL,
        query,
        { accountId: accountId },
        SUBGRAPH_HEADERS
      );

      // Return first user if found
      return result.users && result.users.length > 0 ? result.users[0] : null;
    } catch (err) {
      console.error("❌ [UserProfile] Error getting profile by username:", err);
      throw err;
    }
  }, []);

  // Get profile by Email
  const getProfileByEmail = useCallback(async (email: string) => {
    try {
      const query = gql`
        query GetUserByEmail($email: String!) {
          users(where: { email: $email }) {
            id
            email
            username
            fullName
            accountId
            photo
            lastPhotoUpdate
            createdAt
            hasProfile
            repCategory
            totalReputation
            totalLatePayments
            totalGoalsCompleted
            totalCirclesCompleted
          }
        }
      `;

      const result = await request(
        SUBGRAPH_URL,
        query,
        { email: email },
        SUBGRAPH_HEADERS
      );

      // Return first user if found
      return result.users && result.users.length > 0 ? result.users[0] : null;
    } catch (err) {
      console.error("❌ [UserProfile] Error getting profile by username:", err);
      throw err;
    }
  }, []);

  // Get profile by username
  const getProfileByUsername = useCallback(async (username: string) => {
    try {
      const query = gql`
        query GetUserByUsername($username: String!) {
          users(where: { username: $username }) {
            id
            email
            username
            fullName
            accountId
            photo
            lastPhotoUpdate
            createdAt
            hasProfile
            repCategory
            totalReputation
            totalLatePayments
            totalGoalsCompleted
            totalCirclesCompleted
          }
        }
      `;

      const result = await request(
        SUBGRAPH_URL,
        query,
        { username: username.toLowerCase() },
        SUBGRAPH_HEADERS
      );

      // Return first user if found
      return result.users && result.users.length > 0 ? result.users[0] : null;
    } catch (err) {
      console.error("❌ [UserProfile] Error getting profile by username:", err);
      throw err;
    }
  }, []);

  return {
    hasProfile,
    profile,
    isLoading: isUserLoading || isSending,
    error,
    createProfile,
    updatePhoto,
    checkUsernameAvailability,
    getProfileByAccountId,
    getProfileByEmail,
    getProfileByUsername,
    refreshProfile: refetchUser,
    contract,
  };
};
