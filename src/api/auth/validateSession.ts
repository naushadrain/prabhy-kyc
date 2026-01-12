import { getAccessToken, getRefreshToken, isNearExpiry, clearTokens } from "./tokenStore";
import { refreshAccessToken } from "./refreshTokenClient";

export async function validateSession(): Promise<boolean> {
    const access = getAccessToken();
    const refresh = getRefreshToken();

    if (!access && !refresh) return false;

    // If access exists and not near expiry => ok
    if (access && !isNearExpiry(0)) return true;

    // Otherwise try refresh
    if (refresh) {
        try {
            await refreshAccessToken();
            return true;
        } catch {
            clearTokens();
            return false;
        }
    }

    return false;
}
