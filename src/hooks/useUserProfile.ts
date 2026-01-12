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
      phoneNumber
      username
      usernameLowercase
      fullName
      accountId
      photo
      emailIsOriginal
      phoneIsOriginal
      lastProfileUpdate
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
  phoneNumber: string;
  username: string; // The "Display" name (e.g. "AbC")
  usernameLowercase: string; // The "Identity" (e.g. "abc")
  fullName: string;
  accountId: bigint;
  photo: string;
  emailIsOriginal: boolean;
  phoneIsOriginal: boolean;
  lastProfileUpdate: bigint;
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
        address: USER_PROFILE_ADDRESS,
        abi: USER_PROFILE_ABI,
      }),
    [client, chain]
  );
  const {
    data: userData,
    isLoading: isUserLoading,
    error: userDataError,
    refetch: refetchUser,
  } = useQuery({
    queryKey: ["userProfile", account?.address],
    async queryFn() {
      if (!account?.address) return null;
      try {
        const result = await request({
          url: SUBGRAPH_URL,
          document: userProfileQuery,
          variables: { id: account.address.toLowerCase() },
          requestHeaders: SUBGRAPH_HEADERS,
          signal: AbortSignal.timeout(5000),
        });
        return result.user;
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          throw new Error("The data server is taking too long to respond. It might be undergoing maintenance.");
        }
        throw err;
      }
    },
    enabled: !!account?.address,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 0,
  });

  const queryError = useMemo(() => {
    // If we have an error, show it regardless of loading state
    if (userDataError) return (userDataError as any)?.message || "Data server error";
    if (isUserLoading) return null;
    return null;
  }, [userDataError, isUserLoading]);
  useEffect(() => {
    if (userData) {
      setHasProfile(userData.hasProfile);
      setProfile({
        userAddress: userData.id,
        email: userData.email,
        phoneNumber: userData.phoneNumber,
        username: userData.username, // Original casing shown to user
        usernameLowercase: userData.usernameLowercase,
        fullName: userData.fullName,
        accountId: BigInt(userData.accountId),
        photo: userData.photo,
        emailIsOriginal: userData.emailIsOriginal,
        phoneIsOriginal: userData.phoneIsOriginal,
        lastProfileUpdate: BigInt(userData.lastProfileUpdate),
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
      // Only set to false if no error occurred, otherwise we want to keep it null 
      // so the error state can be shown in App.tsx
      if (!userDataError) {
        setHasProfile(false);
        setProfile(null);
      }
    }
  }, [userData, isUserLoading, account?.address, userDataError]);

  // Create profile function
  const createProfile = useCallback(
    async (
      email: string,
      username: string,
      fullName: string,
      photo: string = "",
      phoneNumber: string = ""
    ) => {
      if (!account?.address) {
        throw new Error("No wallet connected");
      }
      try {
        setError(null);

        // Validate that at least email or phone is provided
        const hasEmail = email && email.trim().length > 0;
        const hasPhone = phoneNumber && phoneNumber.trim().length > 0;

        if (!hasEmail && !hasPhone) {
          throw new Error("Either email or phone number is required");
        }

        if (!username || username.trim().length === 0) throw new Error("Username is required");
        if (!fullName || fullName.trim().length === 0) throw new Error("Full name is required");

        const emailParam = email?.trim() || "";
        const phoneParam = phoneNumber?.trim() || "";
        const photoUrl = photo?.trim() || "";

        const transaction = prepareContractCall({
          contract,
          method: "createProfile",
          params: [emailParam, phoneParam, username, fullName, photoUrl],
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

  // Update profile (fullName and/or photo)
  const updateProfile = useCallback(
    async (fullName: string, photo: string) => {
      if (!account?.address) {
        throw new Error("No wallet connected");
      }

      try {
        setError(null);

        // Validate that at least one field is provided
        const hasFullName = fullName && fullName.trim().length > 0;
        const hasPhoto = photo && photo.trim().length > 0;

        if (!hasFullName && !hasPhoto) {
          throw new Error("Please provide at least a full name or photo");
        }

        const fullNameParam = fullName?.trim() || "";
        const photoParam = photo?.trim() || "";

        const transaction = prepareContractCall({
          contract,
          method: "updateProfile",
          params: [fullNameParam, photoParam],
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
        setError(error.message || "Failed to update profile");
        throw err;
      }
    },
    [account?.address, contract, sendTransaction, refetchUser]
  );

  // Update contact info (email and/or phone number)
  const updateContactInfo = useCallback(
    async (email: string, phoneNumber: string) => {
      if (!account?.address) {
        throw new Error("No wallet connected");
      }

      try {
        setError(null);

        // Validate that at least one field is provided
        const hasEmail = email && email.trim().length > 0;
        const hasPhone = phoneNumber && phoneNumber.trim().length > 0;

        if (!hasEmail && !hasPhone) {
          throw new Error("Please provide at least an email or phone number");
        }

        const emailParam = email?.trim() || "";
        const phoneParam = phoneNumber?.trim() || "";

        const transaction = prepareContractCall({
          contract,
          method: "updateContactInfo",
          params: [emailParam, phoneParam],
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
        setError(error.message || "Failed to update contact info");
        throw err;
      }
    },
    [account?.address, contract, sendTransaction, refetchUser]
  );

  // Check if user can update contact info (30-day cooldown)
  const canUpdateContact = useCallback((): boolean => {
    if (!profile?.lastProfileUpdate) return true;
    const lastUpdate = new Date(Number(profile.lastProfileUpdate) * 1000);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return lastUpdate < thirtyDaysAgo;
  }, [profile]);

  // Get days until next contact update is allowed
  const daysUntilContactUpdate = useCallback((): number => {
    if (!profile?.lastProfileUpdate) return 0;
    const lastUpdate = new Date(Number(profile.lastProfileUpdate) * 1000);
    const nextAllowedUpdate = new Date(lastUpdate);
    nextAllowedUpdate.setDate(nextAllowedUpdate.getDate() + 30);
    const daysLeft = Math.ceil(
      (nextAllowedUpdate.getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24)
    );
    return daysLeft > 0 ? daysLeft : 0;
  }, [profile]);

  // Get which contact method is original (permanent)
  const getOriginalContact = useCallback((): {
    emailIsOriginal: boolean;
    phoneIsOriginal: boolean;
  } => {
    return {
      emailIsOriginal: profile?.emailIsOriginal || false,
      phoneIsOriginal: profile?.phoneIsOriginal || false,
    };
  }, [profile]);

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
    phoneNumber
    username
    usernameLowercase
    fullName
    accountId
    photo
    emailIsOriginal
    phoneIsOriginal
    lastProfileUpdate
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
            phoneNumber
            username
            usernameLowercase
            fullName
            accountId
            photo
            emailIsOriginal
            phoneIsOriginal
            lastProfileUpdate
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
            phoneNumber
            username
            usernameLowercase
            fullName
            accountId
            photo
            emailIsOriginal
            phoneIsOriginal
            lastProfileUpdate
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
    error: error || queryError,
    createProfile,
    updateProfile,
    updateContactInfo,
    canUpdateContact,
    daysUntilContactUpdate,
    getOriginalContact,
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
        phoneNumber: userProfile.phoneNumber,
        username: userProfile.username,
        usernameLowercase: userProfile.usernameLowercase,
        fullName: userProfile.fullName,
        accountId: BigInt(userProfile.accountId),
        photo: userProfile.photo,
        emailIsOriginal: userProfile.emailIsOriginal,
        phoneIsOriginal: userProfile.phoneIsOriginal,
        lastProfileUpdate: BigInt(userProfile.lastProfileUpdate),
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
