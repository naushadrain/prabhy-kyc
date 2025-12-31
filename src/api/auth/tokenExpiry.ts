// src/api/auth/tokenExpiry.ts

export function getJwtExpMs(token: string): number | null {
    try {
        const parts = token.split(".");
        if (parts.length !== 3) return null; // not a JWT
        const payload = JSON.parse(atob(parts[1]));
        if (!payload?.exp) return null;
        return payload.exp * 1000;
    } catch {
        return null;
    }
}

export function isTokenExpired(token: string): boolean {
    const expMs = getJwtExpMs(token);

    // If token isn't a JWT, we can't read exp here.
    // In that case you should store "access_expires_at" at login time.
    if (!expMs) {
        const stored = Number(localStorage.getItem("access_expires_at") || "0");
        if (!stored) return false; // unknown -> cannot auto-expire here
        return Date.now() >= stored;
    }

    return Date.now() >= expMs;
}

export function msUntilTokenExpiry(token: string): number | null {
    const expMs = getJwtExpMs(token);
    if (expMs) return Math.max(0, expMs - Date.now());

    const stored = Number(localStorage.getItem("access_expires_at") || "0");
    if (stored) return Math.max(0, stored - Date.now());

    return null;
}
