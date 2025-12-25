import { useMemo } from "react";
import { useActiveAccount, useReadContract } from "thirdweb/react";
import { getContract } from "thirdweb";
import { defineChain } from "thirdweb/chains";
import { client } from "../thirdwebClient";
import { CUSD_ADDRESS, CHAIN_ID } from "../constants/constants";
import { CUSD_ABI } from "../abis/Cusd";

export const useBalance = () => {
    const account = useActiveAccount();

    const contract = useMemo(
        () =>
            getContract({
                client,
                chain: defineChain(CHAIN_ID),
                address: CUSD_ADDRESS,
                abi: CUSD_ABI,
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
