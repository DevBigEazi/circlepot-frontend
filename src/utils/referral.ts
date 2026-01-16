const REFERRAL_KEY = "cp_referral_code";

export const getReferralFromURL = (): string | null => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    return params.get("ref");
};

export const saveReferralCode = (code: string): void => {
    if (!code) return;
    localStorage.setItem(REFERRAL_KEY, code.trim());
};

export const getStoredReferral = (): string | null => {
    return localStorage.getItem(REFERRAL_KEY);
};

export const clearReferral = (): void => {
    localStorage.removeItem(REFERRAL_KEY);
};

export const cleanURL = (): void => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.delete("ref");
    window.history.replaceState({}, "", url.toString());
};
