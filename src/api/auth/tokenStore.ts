import { getJwtExpMs } from "./tokenExpiry";

export type TokenPair = {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number; // seconds
};

const ACCESS = "access_token";
const REFRESH = "refresh_token";
const ACCESS_EXPIRES_AT = "access_expires_at";

export function setTokens(data: TokenPair) {
    if (data.access_token) localStorage.setItem(ACCESS, data.access_token);
    if (data.refresh_token) localStorage.setItem(REFRESH, data.refresh_token);

    // Prefer expires_in (seconds)
    if (typeof data.expires_in === "number" && data.expires_in > 0) {
        const expMs = Date.now() + data.expires_in * 1000;
        localStorage.setItem(ACCESS_EXPIRES_AT, String(expMs));
        return;
    }

    // Else try JWT exp
    if (data.access_token) {
        const expMs = getJwtExpMs(data.access_token);
        if (expMs) localStorage.setItem(ACCESS_EXPIRES_AT, String(expMs));
    }
}

export function getAccessToken() {
    return localStorage.getItem(ACCESS);
}
export function getRefreshToken() {
    return localStorage.getItem(REFRESH);
}
export function getAccessExpiresAtMs() {
    const v = localStorage.getItem(ACCESS_EXPIRES_AT);
    return v ? Number(v) : 0;
}

export function clearTokens() {
    localStorage.removeItem(ACCESS);
    localStorage.removeItem(REFRESH);
    localStorage.removeItem(ACCESS_EXPIRES_AT);
}

// if exp is unknown => return false and rely on 401 retry
export function isNearExpiry(bufferMs = 30_000) {
    const exp = getAccessExpiresAtMs();
    if (!exp) return false;
    return Date.now() >= exp - bufferMs;
}
