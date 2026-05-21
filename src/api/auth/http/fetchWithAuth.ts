// src/api/http/fetchWithAuth.ts
import { refreshToken } from "@/api/session/refreshTokenClient";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

let refreshing: Promise<string | null> | null = null;

function getAccessToken() {
    return localStorage.getItem("access_token");
}

function setAccessToken(token: string) {
    localStorage.setItem("access_token", token);
}

export async function fetchWithAuth(input: RequestInfo, init: RequestInit = {}) {
    const token = getAccessToken();

    const headers = new Headers(init.headers || {});
    if (token) headers.set("Authorization", `Bearer ${token}`);

    const res = await fetch(input, { ...init, headers });

    //  If token expired -> try refresh once
    if (res.status !== 401) return res;

    // avoid multiple refresh calls in parallel
    if (!refreshing) {
        refreshing = (async () => {
            try {
                const newToken = await refreshToken();
                if (newToken) setAccessToken(newToken);
                return newToken;
            } finally {
                refreshing = null;
            }
        })();
    }

    const newToken = await refreshing;
    if (!newToken) return res; // refresh failed -> caller can redirect to login

    // retry original request with new token
    const headers2 = new Headers(init.headers || {});
    headers2.set("Authorization", `Bearer ${newToken}`);

    return fetch(input, { ...init, headers: headers2 });
}
