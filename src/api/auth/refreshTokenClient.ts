import { buildSignatureForBody } from "@/api/session/signature";
import { createSession } from "@/api/session/sessionClient";
import { getRefreshToken, setTokens, clearTokens } from "./tokenStore";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;
const USER_LOGIN_ID = import.meta.env.VITE_USER_LOGIN_ID as string;

// ✅ prevent multiple refresh calls at once
let refreshPromise: Promise<string> | null = null;

/**
 * Refreshes access token using refresh_token.
 * IMPORTANT:
 * - access token is used as Bearer for protected APIs
 * - refresh endpoint usually uses refresh_token in BODY (not Bearer)
 * - your backend also needs verify-signature + Basic like login
 */
export async function refreshAccessToken(): Promise<string> {
    if (refreshPromise) return refreshPromise;

    refreshPromise = (async () => {
        if (!API_BASE_URL) throw new Error("VITE_API_BASE_URL is not set");
        if (!USER_LOGIN_ID) throw new Error("VITE_USER_LOGIN_ID is not set");

        const refresh_token = getRefreshToken();
        if (!refresh_token) throw new Error("No refresh token");

        const sessionProcessId = await createSession();

        // ✅ adjust body keys ONLY if your backend expects different
        const bodyObj = { refresh_token, grant_type: "refresh_token" };
        const jsonBody = JSON.stringify(bodyObj);

        const { unixTs, signature } = buildSignatureForBody(jsonBody);
        const basicToken = btoa(`${USER_LOGIN_ID}:${sessionProcessId}`);

        // ✅ replace endpoint with your real refresh endpoint
        const res = await fetch(`${API_BASE_URL}/v1/common/refresh-token`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "verify-signature": `${unixTs}.${signature}`,
                Authorization: `Basic ${basicToken}`,
                Accept: "*/*",
            },
            body: jsonBody,
        });

        const text = await res.text();
        let data: any = {};
        try {
            data = text ? JSON.parse(text) : {};
        } catch {
            data = {};
        }

        if (!res.ok) {
            clearTokens(); // refresh failed => logout
            throw new Error(data?.message || `Refresh error ${res.status}`);
        }

        // ✅ some APIs rotate refresh token, some do not
        setTokens({
            access_token: data.access_token,
            refresh_token: data.refresh_token ?? refresh_token,
            expires_in: data.expires_in,
        });

        if (!data.access_token) {
            clearTokens();
            throw new Error("Refresh response missing access_token");
        }

        return data.access_token as string;
    })();

    try {
        return await refreshPromise;
    } finally {
        refreshPromise = null;
    }
}
