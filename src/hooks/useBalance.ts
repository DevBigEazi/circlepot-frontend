import { useMemo, useEffect } from "react";
import { useActiveAccount, useReadContract } from "thirdweb/react";
import { getContract, prepareEvent, watchContractEvents } from "thirdweb";
import { defineChain } from "thirdweb/chains";
import { client } from "../thirdwebClient";
import { USDm_ADDRESS, CHAIN_ID } from "../constants/constants";
import { USDm_ABI } from "../abis/USDm";

export const useBalance = () => {
    const account = useActiveAccount();

    const contract = useMemo(
        () =>
            getContract({
                client,
                chain: defineChain(CHAIN_ID),
                address: USDm_ADDRESS,
                abi: USDm_ABI,
            }),
        []
    );

    const {
        data: balance,
        isLoading,
        refetch,
    } = useReadContract({
        contract,
        method: "balanceOf",
        params: [account?.address || ""],
        queryOptions: {
            enabled: !!account?.address,
        },
    });

    // Watch for incoming Transfer events to auto-update balance
    useEffect(() => {
        if (!account?.address) return;

        // Prepare the Transfer event with filter for incoming transfers
        const transferEvent = prepareEvent({
            signature: "event Transfer(address indexed from, address indexed to, uint256 value)",
        });

        // Watch for Transfer events where user is the recipient
        const unwatch = watchContractEvents({
            contract,
            events: [transferEvent],
            onEvents: (events) => {
                // Check if any event is a transfer TO this user
                const hasIncomingTransfer = events.some(
                    (event) =>
                        event.args.to?.toLowerCase() === account.address.toLowerCase()
                );

                if (hasIncomingTransfer) {
                    // Refetch balance when user receives USDM
                    refetch();
                }
            },
        });

        // Cleanup: stop watching when component unmounts or account changes
        return () => {
            unwatch();
        };
    }, [account?.address, contract, refetch]);

    return {
        balance: balance as bigint | undefined,
        isLoading,
        refetch,
        formattedBalance: balance ? (Number(balance) / 1e18).toFixed(2) : "0.00",
    };
};
