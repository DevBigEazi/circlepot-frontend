import { useState, useEffect, useCallback } from 'react';
import { getAAVEAPRFromDeFiLlama } from '../utils/apy';

interface YieldAPYData {
    apy: number;
    tvl: number;
    lastUpdated: number;
    isLoading: boolean;
    error: string | null;
}

// Cache duration: 1 hour
const CACHE_DURATION = 60 * 60 * 1000;

// Global cache to share across component instances: project -> data
let globalAPYCache: Record<string, {
    apy: number;
    tvl: number;
    timestamp: number;
}> = {};

export const useYieldAPY = (project?: string) => {
    const [data, setData] = useState<YieldAPYData>({
        apy: 0,
        tvl: 0,
        lastUpdated: 0,
        isLoading: true,
        error: null,
    });

    const fetchAPY = useCallback(async (forceRefresh = false) => {
        if (!project) {
            setData(prev => ({ ...prev, isLoading: false }));
            return;
        }

        // Check cache first for this specific project
        const projectCache = globalAPYCache[project];
        if (!forceRefresh && projectCache) {
            const cacheAge = Date.now() - projectCache.timestamp;
            if (cacheAge < CACHE_DURATION) {
                setData({
                    apy: projectCache.apy,
                    tvl: projectCache.tvl,
                    lastUpdated: projectCache.timestamp,
                    isLoading: false,
                    error: null,
                });
                return;
            }
        }

        // Fetch fresh data
        setData(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            const result = await getAAVEAPRFromDeFiLlama(project);
            const timestamp = Date.now();

            // Update global cache for this project
            globalAPYCache[project] = {
                apy: result.apy,
                tvl: result.tvl,
                timestamp,
            };

            setData({
                apy: result.apy,
                tvl: result.tvl,
                lastUpdated: timestamp,
                isLoading: false,
                error: null,
            });
        } catch (err) {
            setData(prev => ({
                ...prev,
                isLoading: false,
                error: 'Failed to load APY data',
            }));
        }
    }, [project]);

    useEffect(() => {
        fetchAPY();
    }, [fetchAPY]);

    const refresh = useCallback(() => {
        fetchAPY(true);
    }, [fetchAPY]);

    return {
        ...data,
        refresh,
    };
};
