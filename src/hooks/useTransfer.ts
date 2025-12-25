import { useCallback, useMemo, useState } from "react";
import { useActiveAccount, useSendTransaction } from "thirdweb/react";
import { prepareContractCall, getContract, estimateGas, getGasPrice } from "thirdweb";
import { defineChain } from "thirdweb/chains";
import { client } from "../thirdwebClient";
import { CUSD_ADDRESS, CHAIN_ID } from "../constants/constants";
import { CUSD_ABI } from "../abis/Cusd";

export const useTransfer = () => {
    const account = useActiveAccount();

    // Standard User-Paid Transaction Hook (Default for EIP7702 when sponsorGas: false)
    const { mutate: sendUserPaidTransaction, isPending: isSendingUserPaid } = useSendTransaction();

    // Explicitly Sponsored Transaction Hook (Opt-In)
    const { mutate: sendSponsoredTransaction, isPending: isSendingSponsored } = useSendTransaction({
        // @ts-ignore - gasless: true opt-in for EIP7702 managed sponsorship
        gasless: true,
    });

    const [error, setError] = useState<string | null>(null);
    const [estimatedFee, setEstimatedFee] = useState<bigint | null>(null);
    const [isEstimating, setIsEstimating] = useState(false);

    const chain = useMemo(() => defineChain(CHAIN_ID), []);

    const contract = useMemo(
        () =>
            getContract({
                client,
                chain,
                address: CUSD_ADDRESS,
                abi: CUSD_ABI,
            }),
        [chain]
    );

    const getEstimatedFee = useCallback(
        async (to: string, amount: bigint) => {
            if (!account) return null;
            setIsEstimating(true);
            try {
                const transaction = prepareContractCall({
                    contract,
                    method: "transfer",
                    params: [to, amount],
                });

                // Celo Fee Abstraction: We want to know the cost in cUSD
                // @ts-ignore
                transaction.feeCurrency = CUSD_ADDRESS;

                const [gas, gasPrice] = await Promise.all([
                    estimateGas({ transaction, account }),
                    getGasPrice({ client, chain })
                ]);

                // Add 20% buffer for safety
                const fee = (BigInt(gas) * gasPrice * BigInt(120)) / BigInt(100);
                setEstimatedFee(fee);
                return fee;
            } catch (err) {
                console.error("Fee estimation failed:", err);
                return null;
            } finally {
                setIsEstimating(false);
            }
        },
        [account, contract, client, chain]
    );

    const transfer = useCallback(
        async (to: string, amount: bigint, isSponsored: boolean = true) => {
            if (!account) {
                throw new Error("No wallet connected");
            }

            setError(null);

            try {
                const transaction = prepareContractCall({
                    contract,
                    method: "transfer",
                    params: [to, amount],
                });

                // Celo Fee Abstraction: Use cUSD to pay for gas
                // @ts-ignore - feeCurrency is supported on Celo
                transaction.feeCurrency = CUSD_ADDRESS;

                const sendTx = isSponsored ? sendSponsoredTransaction : sendUserPaidTransaction;

                return new Promise((resolve, reject) => {
                    sendTx(transaction, {
                        onSuccess: (result) => {
                            resolve(result);
                        },
                        onError: (err) => {
                            const errorMessage = err.message || "Transfer failed";
                            setError(errorMessage);
                            reject(err);
                        },
                    });
                });
            } catch (err: any) {
                const errorMessage = err.message || "Failed to prepare transfer";
                setError(errorMessage);
                throw err;
            }
        },
        [account, contract, sendSponsoredTransaction, sendUserPaidTransaction]
    );

    return {
        transfer,
        getEstimatedFee,
        estimatedFee,
        isEstimating,
        isTransferring: isSendingUserPaid || isSendingSponsored,
        error,
        clearError: () => setError(null),
    };
};
