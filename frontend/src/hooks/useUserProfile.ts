import { useState, useEffect, useCallback, useMemo } from 'react';
import { useActiveAccount, useSendTransaction } from 'thirdweb/react';
import { prepareContractCall, getContract, readContract } from 'thirdweb';
import { defineChain } from 'thirdweb/chains';
import { ThirdwebClient } from 'thirdweb';
import { USER_PROFILE_ABI } from '../abis/UserProfileV1';

interface UserProfile {
  username: string;
  email: string;
  profilePhoto: string;
  createdAt: bigint;
}

const CONTRACT_ADDRESS = "0x920230F82265cB636D90Be33D94434e28b25c92f";
const CHAIN_ID = 11142220; // Celo-Sepolia testnet

export const useUserProfile = (client: ThirdwebClient) => {
  const account = useActiveAccount();
  const { mutate: sendTransaction, isPending: isSending } = useSendTransaction();
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chain = useMemo(() => defineChain(CHAIN_ID), []);
  
  const contract = useMemo(() => getContract({
    client,
    chain,
    address: CONTRACT_ADDRESS,
    abi: USER_PROFILE_ABI,
  }), [client, chain]);

  // Check if user has a profile
  const checkProfile = useCallback(async () => {
    if (!account?.address) {
      setHasProfile(null);
      setProfile(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Check if user has profile
      const hasProfileResult = await readContract({
        contract,
        method: "hasUserProfile",
        params: [account.address],
      });

      setHasProfile(hasProfileResult);

      // If user has profile, fetch it
      if (hasProfileResult) {
        const profileData = await readContract({
          contract,
          method: "getProfile",
          params: [account.address],
        });

        setProfile(profileData);
      } else {
        setProfile(null);
      }
    } catch (err) {
      const error = err as Error;
      console.error('❌ [UserProfile] Error checking profile:', error);
      setError(error.message || 'Failed to check profile');
      setHasProfile(false);
    } finally {
      setIsLoading(false);
    }
  }, [account?.address, contract]);

  // Create profile function
  const createProfile = useCallback(async (email: string, username: string, profilePhoto: string) => {
    if (!account?.address) {
      const error = 'No wallet connected';
      console.error('❌ [UserProfile] Create profile failed:', error);
      throw new Error(error);
    }

    try {
      setIsLoading(true);
      setError(null);

      // Validate inputs
      if (!email || email.trim().length === 0) {
        throw new Error('Email is required and cannot be empty');
      }

      if (!username || username.trim().length === 0) {
        throw new Error('Username is required and cannot be empty');
      }

      // IMPORTANT: Contract requires non-empty photo
      if (!profilePhoto || profilePhoto.trim().length === 0) {
        throw new Error('Profile photo is required by the contract. Please upload an image.');
      }

      const transaction = prepareContractCall({
        contract,
        method: "createProfile",
        params: [email, username, profilePhoto],
      });

      // Send transaction using the hook from top level
      return new Promise((resolve, reject) => {
        sendTransaction(transaction, {
          onSuccess: (receipt) => {
            checkProfile();
            resolve(receipt);
          },
          onError: (error) => {
            console.error('❌ [UserProfile] Transaction failed:', {
              error: error.message,
              code: (error as any)?.code,
              details: error
            });
            reject(error);
          }
        });
      });
    } catch (err) {
      const error = err as Error;
      console.error('❌ [UserProfile] Error creating profile:', {
        message: error.message,
        details: error
      });
      setError(error.message || 'Failed to create profile');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [account?.address, contract, sendTransaction, checkProfile]);

  // Update profile photo function
  const updatePhoto = useCallback(async (profilePhoto: string) => {
    if (!account?.address) {
      const error = 'No wallet connected';
      console.error('❌ [UserProfile] Update photo failed:', error);
      throw new Error(error);
    }

    try {
      setIsLoading(true);
      setError(null);

      // Validate input
      if (!profilePhoto || profilePhoto.trim().length === 0) {
        throw new Error('Profile photo cannot be empty');
      }

      const transaction = prepareContractCall({
        contract,
        method: "updatePhoto",
        params: [profilePhoto],
      });

      // Send transaction
      return new Promise((resolve, reject) => {
        sendTransaction(transaction, {
          onSuccess: (receipt) => {
            // Refresh profile data after successful update
            checkProfile();
            resolve(receipt);

          },
          onError: (error) => {
            reject(error);
          }
        });
      });
    } catch (err) {
      const error = err as Error;
      console.error('UserProfile Error updating photo:', {
        message: error.message,
        details: error
      });
      setError(error.message || 'Failed to update photo');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [account?.address, contract, sendTransaction, checkProfile]);

  // Check username availability
  const checkUsernameAvailability = useCallback(async (username: string): Promise<boolean> => {
    try {
      const isAvailable = await readContract({
        contract,
        method: "isUsernameAvailable",
        params: [username],
      });

      return isAvailable;
    } catch (err) {
      console.error('❌ [UserProfile] Error checking username:', err);
      return false;
    }
  }, [contract]);

  // Get profile by username
  const getProfileByUsername = useCallback(async (username: string) => {
    try {
      const userAddress = await readContract({
        contract,
        method: "getAddressByUsername",
        params: [username],
      });

      const profileData = await readContract({
        contract,
        method: "getProfile",
        params: [userAddress],
      });

      return profileData;
    } catch (err) {
      console.error('❌ [UserProfile] Error getting profile by username:', err);
      throw err;
    }
  }, [contract]);

  // Auto-check profile on mount and when account changes
  useEffect(() => {
    checkProfile();
  }, [checkProfile]);

  return {
    hasProfile,
    profile,
    isLoading: isLoading || isSending, // Combine both loading states
    error,
    createProfile,
    updatePhoto,
    checkUsernameAvailability,
    getProfileByUsername,
    refreshProfile: checkProfile,
    contract,
  };
};