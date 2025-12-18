import { useState, useEffect, useCallback } from 'react';

interface CurrencyData {
    symbol: string;
    name: string;
    rate: number;
}

interface CurrencyRates {
    [key: string]: CurrencyData;
}

const CURRENCIES: CurrencyRates = {
    USD: { symbol: '$', name: 'US Dollar', rate: 1 },
    NGN: { symbol: '₦', name: 'Nigerian Naira', rate: 1400 },
    EUR: { symbol: '€', name: 'Euro', rate: 0.8 },
    GBP: { symbol: '£', name: 'British Pound', rate: 0.7 },
    KES: { symbol: 'KSh', name: 'Kenyan Shilling', rate: 125 },
    GHS: { symbol: '₵', name: 'Ghanaian Cedi', rate: 13 },
};



export const useCurrencyConverter = () => {
    const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    // Load from cache on mount
    useEffect(() => {
        const cachedData = localStorage.getItem('currency_rates_cache');
        if (cachedData) {
            try {
                const { rates, timestamp } = JSON.parse(cachedData);
                setExchangeRates(rates);
                setLastUpdated(new Date(timestamp));
            } catch (e) {
                throw e; 
            }
        } else {
            // Set initial default rates if no cache
            const defaultRates: Record<string, number> = {};
            Object.keys(CURRENCIES).forEach(key => {
                defaultRates[key] = CURRENCIES[key].rate;
            });
            setExchangeRates(defaultRates);
        }
    }, []);

    // Fetch cUSD price in all supported currencies
    const fetchRates = useCallback(async () => {
        // Check cache validity (15 days = ~2 times per month)
        const CACHE_DURATION = 15 * 24 * 60 * 60 * 1000; // 15 days in ms

        const cachedData = localStorage.getItem('currency_rates_cache');
        if (cachedData) {
            try {
                const { timestamp } = JSON.parse(cachedData);
                const now = new Date().getTime();
                const cacheTime = new Date(timestamp).getTime();

                // If cache is less than 15 days old, don't fetch
                if (now - cacheTime < CACHE_DURATION) {
                    return;
                }
            } catch (e) {
                // Ignore cache error, proceed to fetch
            }
        }

        try {
            setIsLoading(true);
            setError(null);

            // Use CoinGecko API which supports CORS and doesn't require an API key for basic usage
            // cUSD ID on CoinGecko is 'celo-dollar'
            const convertTo = Object.keys(CURRENCIES).map(c => c.toLowerCase()).join(',');

            const response = await fetch(
                `https://api.coingecko.com/api/v3/simple/price?ids=celo-dollar&vs_currencies=${convertTo}`,
                {
                    headers: {
                        'Accept': 'application/json',
                    },
                }
            );

            if (response.status === 429) {
                // Don't update state, keep using what we have
                return;
            }

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }

            const data = await response.json();

            if (data['celo-dollar']) {
                const quotes = data['celo-dollar'];

                setExchangeRates(prevRates => {
                    const newRates: Record<string, number> = {};

                    Object.keys(CURRENCIES).forEach(currency => {
                        const currencyKey = currency.toLowerCase();
                        if (quotes[currencyKey]) {
                            newRates[currency] = quotes[currencyKey];
                        } else {
                            // Fallback to existing rate if specific currency fails
                            newRates[currency] = prevRates[currency] || CURRENCIES[currency].rate;
                        }
                    });

                    // Save to cache with new rates
                    const now = new Date();
                    localStorage.setItem('currency_rates_cache', JSON.stringify({
                        rates: newRates,
                        timestamp: now.toISOString()
                    }));
                    setLastUpdated(now);

                    return newRates;
                });
            }
        } catch (err) {
            throw err;
                setError('Failed to fetch latest rates. Using cached/default rates.');
            // Keep existing rates on error
        } finally {
            setIsLoading(false);
        }
    }, []); // No dependencies needed now

    // Fetch rates on mount and check every 24 hours
    useEffect(() => {
        fetchRates();
        const interval = setInterval(fetchRates, 24 * 60 * 60 * 1000); // Check daily
        return () => clearInterval(interval);
    }, [fetchRates]);

    // Convert cUSD amount to selected currency
    const convertToLocal = useCallback(
        (cusdAmount: number, targetCurrency: string): string => {
            const rate = exchangeRates[targetCurrency] || exchangeRates.USD || 1;
            const localValue = cusdAmount * rate;

            // Format with appropriate decimal places
            if (localValue >= 1000) {
                return localValue.toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                });
            } else {
                return localValue.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                });
            }
        },
        [exchangeRates]
    );

    // Get currency info with current rate
    const getCurrencyInfo = useCallback((currencyCode: string): CurrencyData => {
        const baseInfo = CURRENCIES[currencyCode] || CURRENCIES.USD;
        return {
            ...baseInfo,
            rate: exchangeRates[currencyCode] || baseInfo.rate
        };
    }, [exchangeRates]);

    return {
        exchangeRates,
        isLoading,
        error,
        lastUpdated,
        convertToLocal,
        getCurrencyInfo,
        refreshPrice: fetchRates,
        availableCurrencies: CURRENCIES,
    };
};
