export function getJwtExpMs(token: string): number | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null; // not a JWT

    // base64url -> base64
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(b64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );

    const payload = JSON.parse(json);
    if (!payload?.exp) return null;
    return payload.exp * 1000;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const expMs = getJwtExpMs(token);

  // If token isn't a JWT, rely on stored "access_expires_at"
  if (!expMs) {
    const stored = Number(localStorage.getItem("access_expires_at") || "0");
    if (!stored) return false;
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
