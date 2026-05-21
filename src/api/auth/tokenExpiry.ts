// src/api/auth/tokenExpiry.ts
import { getExpiresAt } from "@/api/auth/tokenStore";

function parseJwt(token: string): Record<string, any> | null {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;

    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("")
    );

    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function getTokenExpiryTime(token?: string | null): number | null {
  if (!token) return getExpiresAt();

  const parsed = parseJwt(token);
  if (parsed?.exp) {
    return parsed.exp * 1000;
  }

  return getExpiresAt();
}

export function isTokenExpired(token?: string | null): boolean {
  const expiryTime = getTokenExpiryTime(token);
  if (!expiryTime) return true;
  return Date.now() >= expiryTime;
}