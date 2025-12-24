import { useState, useEffect, useCallback } from "react";

interface CurrencyData {
  symbol: string;
  name: string;
  rate: number;
  flag?: string;
}

interface CurrencyRates {
  [key: string]: CurrencyData;
}

const INITIAL_CURRENCIES: CurrencyRates = {
  USD: {
    symbol: "$",
    name: "US Dollar",
    rate: 1,
    flag: "https://flagcdn.com/w80/us.png",
  },
  NGN: {
    symbol: "₦",
    name: "Nigerian Naira",
    rate: 1400,
    flag: "https://flagcdn.com/w80/ng.png",
  },
  EUR: {
    symbol: "€",
    name: "Euro",
    rate: 0.8,
    flag: "https://flagcdn.com/w80/eu.png",
  },
  GBP: {
    symbol: "£",
    name: "British Pound",
    rate: 0.7,
    flag: "https://flagcdn.com/w80/gb.png",
  },
  KES: {
    symbol: "KSh",
    name: "Kenyan Shilling",
    rate: 125,
    flag: "https://flagcdn.com/w80/ke.png",
  },
  GHS: {
    symbol: "₵",
    name: "Ghanaian Cedi",
    rate: 13,
    flag: "https://flagcdn.com/w80/gh.png",
  },
  JPY: {
    symbol: "¥",
    name: "Japanese Yen",
    rate: 150,
    flag: "https://flagcdn.com/w80/jp.png",
  },
  CAD: {
    symbol: "C$",
    name: "Canadian Dollar",
    rate: 1.35,
    flag: "https://flagcdn.com/w80/ca.png",
  },
  AUD: {
    symbol: "A$",
    name: "Australian Dollar",
    rate: 1.5,
    flag: "https://flagcdn.com/w80/au.png",
  },
  CHF: {
    symbol: "CHF",
    name: "Swiss Franc",
    rate: 0.9,
    flag: "https://flagcdn.com/w80/ch.png",
  },
  CNY: {
    symbol: "¥",
    name: "Chinese Yuan",
    rate: 7.2,
    flag: "https://flagcdn.com/w80/cn.png",
  },
  INR: {
    symbol: "₹",
    name: "Indian Rupee",
    rate: 83,
    flag: "https://flagcdn.com/w80/in.png",
  },
};

export const useCurrencyConverter = () => {
  const [availableCurrencies, setAvailableCurrencies] =
    useState<CurrencyRates>(INITIAL_CURRENCIES);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>(
    {}
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Initial load from cache
  useEffect(() => {
    const cachedRates = localStorage.getItem("currency_rates_cache");
    const cachedMeta = localStorage.getItem("currency_metadata_cache");

    if (cachedMeta) {
      try {
        setAvailableCurrencies(JSON.parse(cachedMeta));
      } catch (e) {
        console.error("Failed to parse cached currency metadata", e);
      }
    }

    if (cachedRates) {
      try {
        const { rates, timestamp } = JSON.parse(cachedRates);
        setExchangeRates(rates);
        setLastUpdated(new Date(timestamp));
      } catch (e) {
        console.error("Failed to parse cached rates", e);
      }
    } else {
      const defaultRates: Record<string, number> = {};
      Object.keys(INITIAL_CURRENCIES).forEach((key) => {
        defaultRates[key] = INITIAL_CURRENCIES[key].rate;
      });
      setExchangeRates(defaultRates);
    }
  }, []);

  const fetchAllCurrencyData = useCallback(async () => {
    try {
      setIsLoading(true);

      // 1. Fetch available currencies and flags from RestCountries
      const countriesRes = await fetch(
        "https://restcountries.com/v3.1/all?fields=currencies,flags"
      );
      if (!countriesRes.ok) throw new Error("Failed to fetch countries");
      const countriesData = await countriesRes.json();

      // 2. Fetch supported vs_currencies from CoinGecko
      const supportedRes = await fetch(
        "https://api.coingecko.com/api/v3/simple/supported_vs_currencies"
      );
      if (!supportedRes.ok)
        throw new Error("Failed to fetch supported currencies");
      const supportedCodes: string[] = await supportedRes.json();
      const supportedSet = new Set(supportedCodes.map((c) => c.toUpperCase()));

      const newCurrencyMap: CurrencyRates = { ...INITIAL_CURRENCIES };

      countriesData.forEach((country: any) => {
        if (country.currencies) {
          Object.entries(country.currencies).forEach(
            ([code, data]: [string, any]) => {
              const upperCode = code.toUpperCase();
              // Only add if supported by CoinGecko and not already in map
              if (supportedSet.has(upperCode) && !newCurrencyMap[upperCode]) {
                newCurrencyMap[upperCode] = {
                  symbol: data.symbol || upperCode,
                  name: data.name,
                  flag: country.flags?.png,
                  rate: 1,
                };
              }
            }
          );
        }
      });

      setAvailableCurrencies(newCurrencyMap);
      localStorage.setItem(
        "currency_metadata_cache",
        JSON.stringify(newCurrencyMap)
      );

      // 3. Fetch rates for all these currencies
      const convertTo = Object.keys(newCurrencyMap)
        .map((c) => c.toLowerCase())
        .join(",");
      const ratesRes = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=celo-dollar&vs_currencies=${convertTo}`
      );

      if (ratesRes.status === 429) {
        setIsLoading(false);
        return;
      }

      if (!ratesRes.ok) throw new Error(`Rates API failed: ${ratesRes.status}`);

      const ratesData = await ratesRes.json();

      if (ratesData["celo-dollar"]) {
        const quotes = ratesData["celo-dollar"];

        setExchangeRates((prevRates) => {
          const newRates: Record<string, number> = {};

          Object.keys(newCurrencyMap).forEach((currency) => {
            const currencyKey = currency.toLowerCase();
            if (quotes[currencyKey]) {
              newRates[currency] = quotes[currencyKey];
            } else if (prevRates[currency]) {
              newRates[currency] = prevRates[currency];
            } else {
              newRates[currency] = INITIAL_CURRENCIES[currency]?.rate || 1;
            }
          });

          // Save to cache with new rates
          localStorage.setItem(
            "currency_rates_cache",
            JSON.stringify({
              rates: newRates,
              timestamp: new Date().toISOString(),
            })
          );

          return newRates;
        });

        // CRITICAL: Update metadata cache with the newly fetched/merged data containing flags
        setAvailableCurrencies(newCurrencyMap);
        localStorage.setItem(
          "currency_metadata_cache",
          JSON.stringify(newCurrencyMap)
        );

        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error("Error fetching currency data:", err);
      setError("Failed to update rates. Using cached data.");
    } finally {
      setIsLoading(false);
    }
  }, [exchangeRates]); // Re-add exchangeRates to ensure we have its latest value for merging

  useEffect(() => {
    const cachedRates = localStorage.getItem("currency_rates_cache");
    const cachedMeta = localStorage.getItem("currency_metadata_cache");
    const CACHE_DURATION = 15 * 24 * 60 * 60 * 1000;

    let shouldFetch = true;
    if (cachedRates && cachedMeta) {
      try {
        const { timestamp } = JSON.parse(cachedRates);
        if (
          new Date().getTime() - new Date(timestamp).getTime() <
          CACHE_DURATION
        ) {
          shouldFetch = false;
        }
      } catch (e) {}
    }

    if (shouldFetch) {
      fetchAllCurrencyData();
    }

    const interval = setInterval(fetchAllCurrencyData, 24 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchAllCurrencyData]);

  const convertToLocal = useCallback(
    (cusdAmount: number, targetCurrency: string): string => {
      const rate = exchangeRates[targetCurrency] || exchangeRates.USD || 1;
      const localValue = cusdAmount * rate;

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

  const getCurrencyInfo = useCallback(
    (currencyCode: string): CurrencyData => {
      const baseInfo =
        availableCurrencies[currencyCode] ||
        INITIAL_CURRENCIES[currencyCode] ||
        INITIAL_CURRENCIES.USD;
      return {
        ...baseInfo,
        rate: exchangeRates[currencyCode] || baseInfo.rate,
      };
    },
    [exchangeRates, availableCurrencies]
  );

  // Force refresh if metadata exists but is missing flags (for users who cached early)
  useEffect(() => {
    const needsFlagRefresh = Object.values(availableCurrencies).some(
      (c) => !c.flag && c.name !== "US Dollar"
    );
    if (needsFlagRefresh && !isLoading) {
      fetchAllCurrencyData();
    }
  }, [availableCurrencies, isLoading, fetchAllCurrencyData]);

  return {
    exchangeRates,
    isLoading,
    error,
    lastUpdated,
    convertToLocal,
    getCurrencyInfo,
    refreshPrice: fetchAllCurrencyData,
    availableCurrencies,
  };
};
