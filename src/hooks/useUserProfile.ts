import { useState, useEffect, useCallback, useMemo } from "react";
import { useActiveAccount, useSendTransaction } from "thirdweb/react";
import { prepareContractCall, getContract } from "thirdweb";
import { defineChain } from "thirdweb/chains";
import { ThirdwebClient } from "thirdweb";
import { USER_PROFILE_ABI } from "../abis/UserProfileV1";
import { useQuery } from "@tanstack/react-query";
import { gql, request } from "graphql-request";
import {
  SUBGRAPH_URL,
  SUBGRAPH_HEADERS,
  USER_PROFILE_ADDRESS,
  CHAIN_ID,
} from "../constants/constants";

const userProfileQuery = gql`
  query GetUserProfile($id: String!) {
    user(id: $id) {
      id
      email
      username
      usernameLowercase
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
  username: string; // The "Display" name (e.g. "AbC")
  usernameLowercase: string; // The "Identity" (e.g. "abc")
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
export const useUserProfile = (client: ThirdwebClient) => {
  const account = useActiveAccount();
  const { mutate: sendTransaction, isPending: isSending } =
    useSendTransaction({
      // @ts-ignore - gasless: true opt-in for EIP7702 managed sponsorship
      gasless: true,
    });
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const chain = useMemo(() => defineChain(CHAIN_ID), []);
  const contract = useMemo(
    () =>
      getContract({
        client,
        chain,
        address: USER_PROFILE_ADDRESS,
        abi: USER_PROFILE_ABI,
      }),
    [client, chain]
  );
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
        throw err;
      }
    },
    enabled: !!account?.address,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });
  useEffect(() => {
    if (userData) {
      setHasProfile(userData.hasProfile);
      setProfile({
        userAddress: userData.id,
        email: userData.email,
        username: userData.username, // Original casing shown to user
        usernameLowercase: userData.usernameLowercase,
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
        throw new Error("No wallet connected");
      }
      try {
        setError(null);
        if (!email || email.trim().length === 0) throw new Error("Email is required");
        if (!username || username.trim().length === 0) throw new Error("Username is required");
        if (!fullName || fullName.trim().length === 0) throw new Error("Full name is required");
        const photoUrl = photo?.trim() || "";
        const transaction = prepareContractCall({
          contract,
          method: "createProfile",
          params: [email, username, fullName, photoUrl],
        });
        return new Promise((resolve, reject) => {
          sendTransaction(transaction, {
            onSuccess: (receipt) => {
              setTimeout(() => refetchUser(), 2000);
              resolve(receipt);
            },
            onError: (error) => {
              setError(error.message);
              reject(error);
            },
          });
        });
      } catch (err) {
        const error = err as Error;
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
        throw new Error("No wallet connected");
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
              setError(error.message);
              reject(error);
            },
          });
        });
      } catch (err) {
        const error = err as Error;
        setError(error.message || "Failed to update photo");
        throw err;
      }
    },
    [account?.address, contract, sendTransaction, refetchUser]
  );

  // Check username availability - CASE INSENSITIVE
  const checkUsernameAvailability = useCallback(
    async (username: string): Promise<boolean> => {
      try {
        const query = gql`
          query CheckUsernameAvailable($username: String!) {
            users(where: { usernameLowercase: $username }) {
              id
            }
          }
        `;
        const result = await request(
          SUBGRAPH_URL,
          query,
          { username: username.toLowerCase() }, // Always compare against lowercase
          SUBGRAPH_HEADERS
        );
        return result.users.length === 0;
      } catch (err) {
        return false;
      }
    },
    []
  );
  // Helper common fields for profile queries
  const profileFields = `
    id
    email
    username
    usernameLowercase
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
  `;
  // Get profile by username
  const getProfileByUsername = useCallback(async (username: string) => {
    try {
      const query = gql`
        query GetUserByUsername($usernameLowercase: String!) {
          users(where: { usernameLowercase: $usernameLowercase }, first: 1) {
            ${profileFields}
          }
        }
      `;
      const result = await request(
        SUBGRAPH_URL,
        query,
        { usernameLowercase: username.toLowerCase() },
        SUBGRAPH_HEADERS
      );
      return result.users && result.users.length > 0 ? result.users[0] : null;
    } catch (err) {
      throw err;
    }
  }, []);
  // Get profile by Address
  const getProfileByAddress = useCallback(async (address: string) => {
    try {
      const result = await request(
        SUBGRAPH_URL,
        userProfileQuery,
        { id: address.toLowerCase() },
        SUBGRAPH_HEADERS
      );
      return result.user || null;
    } catch (err) {
      throw err;
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
    getProfileByAddress,
    getProfileByAccountId,
    getProfileByEmail,
    getProfileByUsername,
    refreshProfile: refetchUser,
    contract,
  };
};

export const useProfile = (address?: string) => {
  const {
    data: userProfile,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["userProfile", address],
    queryFn: async () => {
      if (!address) return null;
      try {
        const result = await request(
          SUBGRAPH_URL,
          userProfileQuery,
          { id: address.toLowerCase() },
          SUBGRAPH_HEADERS
        );
        return result.user;
      } catch (err) {
        throw err;
      }
    },
    enabled: !!address,
  });

  return {
    profile: userProfile
      ? {
        userAddress: userProfile.id,
        email: userProfile.email,
        username: userProfile.username,
        fullName: userProfile.fullName,
        accountId: BigInt(userProfile.accountId),
        photo: userProfile.photo,
        lastPhotoUpdate: BigInt(userProfile.lastPhotoUpdate),
        createdAt: BigInt(userProfile.createdAt),
        hasProfile: userProfile.hasProfile,
        repCategory: userProfile.repCategory,
        totalReputation: userProfile.totalReputation,
        totalLatePayments: userProfile.totalLatePayments,
        totalGoalsCompleted: userProfile.totalGoalsCompleted,
        totalCirclesCompleted: userProfile.totalCirclesCompleted,
      }
      : null,
    isLoading,
    error,
  };
};
