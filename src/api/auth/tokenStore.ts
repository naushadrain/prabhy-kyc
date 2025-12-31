// src/api/auth/tokenStore.ts
export type TokenPair = {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number; // seconds (if API provides)
};

const ACCESS = "access_token";
const REFRESH = "refresh_token";
const ACCESS_EXPIRES_AT = "access_expires_at";

export function setTokens(data: TokenPair) {
    if (data.access_token) localStorage.setItem(ACCESS, data.access_token);
    if (data.refresh_token) localStorage.setItem(REFRESH, data.refresh_token);

    // Prefer expires_in if present
    if (data.expires_in && data.expires_in > 0) {
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

export function isNearExpiry(bufferMs = 30_000) {
    const exp = getAccessExpiresAtMs();
    if (!exp) return false; // unknown -> rely on 401 retry
    return Date.now() >= exp - bufferMs;
}

function getJwtExpMs(token: string): number | null {
    try {
        const parts = token.split(".");
        if (parts.length !== 3) return null;
        const payload = JSON.parse(atob(parts[1]));
        if (!payload?.exp) return null;
        return payload.exp * 1000;
    } catch {
        return null;
    }
}
