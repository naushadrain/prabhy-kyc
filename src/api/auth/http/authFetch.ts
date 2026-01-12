import { getAccessToken, isNearExpiry, clearTokens } from "@/api/auth/tokenStore";
import { refreshAccessToken } from "@/api/auth/refreshTokenClient";

export async function authFetch(input: RequestInfo, init: RequestInit = {}) {
  // if near expiry, refresh first
  if (isNearExpiry()) {
    try {
      await refreshAccessToken();
    } catch (e) {
      clearTokens();
      throw e;
    }
  }

  const token = getAccessToken();

  const res1 = await fetch(input, {
    ...init,
    headers: {
      ...(init.headers || {}),
      Authorization: token ? `Bearer ${token}` : "",
    },
  });

  // if unauthorized, refresh and retry once
  if (res1.status !== 401) return res1;

  try {
    const newToken = await refreshAccessToken();
    const res2 = await fetch(input, {
      ...init,
      headers: {
        ...(init.headers || {}),
        Authorization: `Bearer ${newToken}`,
      },
    });

    if (res2.status === 401) clearTokens();
    return res2;
  } catch (e) {
    clearTokens();
    throw e;
  }
}
