// src/api/session/refreshTokenClient.ts
import { buildSignatureForBody } from "@/api/session/signature";
import { setTokens } from "@/api/auth/tokenStore"; // adjust path if different

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

function safeJsonParse(text: string) {
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
}

export async function refreshToken(): Promise<string | null> {
  if (!API_BASE_URL) throw new Error("VITE_API_BASE_URL is not set");

  const accessToken = localStorage.getItem("access_token") || "";
  const refreshToken = localStorage.getItem("refresh_token") || "";

  if (!refreshToken) return null;

  // ✅ Body exactly as your API requires
  const bodyObj = {
    grant_type: "refresh-token",
    access_token: accessToken,
    refresh_token: refreshToken,
  };

  const jsonBody = JSON.stringify(bodyObj);

  // ✅ signature built from body
  const { unixTs, signature } = buildSignatureForBody(jsonBody);

  const res = await fetch(`${API_BASE_URL}/v1/common/refresh-token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "*/*",
      "verify-signature": `${unixTs}.${signature}`,

      // ✅ Bearer token (as you requested)
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: jsonBody,
  });

  const text = await res.text();
  const data = safeJsonParse(text);

  // ✅ API error handling (same style as login)
  if (data?.error_list?.length) return null;
  if (!res.ok) return null;

  // ✅ Save new tokens (some APIs rotate refresh_token too)
  const newAccess = data?.access_token || null;
  const newRefresh = data?.refresh_token || refreshToken;

  if (!newAccess) return null;

  // Prefer your tokenStore so expiry stays consistent everywhere
  setTokens({
    access_token: newAccess,
    refresh_token: newRefresh,
    expires_in: data?.expires_in, // if provided
  });

  return newAccess;
}
