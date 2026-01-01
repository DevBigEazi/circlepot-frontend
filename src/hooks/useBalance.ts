import { useMemo } from "react";
import { useActiveAccount, useReadContract } from "thirdweb/react";
import { getContract } from "thirdweb";
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

    return {
        balance: balance as bigint | undefined,
        isLoading,
        refetch,
        formattedBalance: balance ? (Number(balance) / 1e18).toFixed(2) : "0.00",
    };
};
