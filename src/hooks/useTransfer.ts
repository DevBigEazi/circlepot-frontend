import { useCallback, useMemo, useState } from "react";
import { useActiveAccount, useSendBatchTransaction, useSendTransaction } from "thirdweb/react";
import { prepareContractCall, getContract } from "thirdweb";
import { defineChain } from "thirdweb/chains";
import { client } from "../thirdwebClient";
import { USDm_ADDRESS, CHAIN_ID, PLATFORM_FEE_RECIPIENT, WITHDRAWAL_FEE } from "../constants/constants";
import { USDm_ABI } from "../abis/USDm";

export const useTransfer = () => {
    const account = useActiveAccount();

    // Hooks for different transfer types
    const { mutate: sendSingleTx, isPending: isSendingSingle } = useSendTransaction();
    const { mutate: sendBatchTx, isPending: isSendingBatch } = useSendBatchTransaction();

    const [error, setError] = useState<string | null>(null);

    const chain = useMemo(() => defineChain(CHAIN_ID), []);

    const contract = useMemo(
        () =>
            getContract({
                client,
                chain,
                address: USDm_ADDRESS,
                abi: USDm_ABI,
            }),
        [chain]
    );

    const transfer = useCallback(
        async (to: string, amount: bigint, isExternal: boolean = false) => {
            if (!account) {
                throw new Error("No wallet connected");
            }

            setError(null);

            try {
                if (!isExternal) {
                    // INTERNAL TRANSFER: Single Transaction (Gasless)
                    const transaction = prepareContractCall({
                        contract,
                        method: "transfer",
                        params: [to, amount],
                    });

                    return new Promise((resolve, reject) => {
                        sendSingleTx(transaction as any, {
                            onSuccess: (result) => resolve(result),
                            onError: (err) => {
                                setError(err.message || "Internal transfer failed");
                                reject(err);
                            },
                        });
                    });
                } else {
                    // EXTERNAL WITHDRAWAL: Atomic Batch (Fee + Withdrawal)
                    // This ensures both succeed OR both fail together.

                    const feeInWei = BigInt(Math.floor(WITHDRAWAL_FEE * 1e18));

                    // 1. Fee Transaction
                    const feeTx = prepareContractCall({
                        contract,
                        method: "transfer",
                        params: [PLATFORM_FEE_RECIPIENT, feeInWei],
                    });

                    // 2. Withdrawal Transaction
                    const withdrawTx = prepareContractCall({
                        contract,
                        method: "transfer",
                        params: [to, amount],
                    });

                    // Send as a batch. 
                    // For Account Abstraction (EIP-7702), this is bundled into a single signature and execution.
                    return new Promise((resolve, reject) => {
                        sendBatchTx([feeTx, withdrawTx] as any, {
                            onSuccess: (result) => {
                                resolve(result);
                            },
                            onError: (err) => {
                                setError(err.message || "Withdrawal failed");
                                reject(err);
                            },
                        });
                    });
                }
            } catch (err: any) {
                const msg = err.message || "Failed to process transfer";
                setError(msg);
                throw err;
            }
        },
        [account, contract, sendSingleTx, sendBatchTx]
    );

    return {
        transfer,
        isTransferring: isSendingSingle || isSendingBatch,
        error,
        clearError: () => setError(null),
        withdrawalFee: WITHDRAWAL_FEE
    };
};
