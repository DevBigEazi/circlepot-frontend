/**
 * Fetch APY data for a specific project on Celo from DeFi Llama
 */
export async function getAAVEAPRFromDeFiLlama(project: string) {
    const response = await fetch('https://yields.llama.fi/pools');
    const data = await response.json();

    const poolData = data.data.find((pool: any) =>
        pool.project === project &&
        pool.chain === 'Celo' &&
        (pool.symbol === 'USDm' || pool.symbol === 'CUSD')
    );

    return {
        apy: poolData?.apy || 0,
        tvl: poolData?.tvlUsd || 0
    };
}
