// src/components/TokenRefreshProvider.tsx
import React from "react";
import { getAccessToken, getRefreshToken, clearTokens } from "@/api/auth/tokenStore";
import { getTokenExpiryTime, isTokenExpired } from "@/api/auth/tokenExpiry";
import { refreshAccessToken } from "@/api/auth/login/loginClient";

type Props = {
  children: React.ReactNode;
};

export const TokenRefreshProvider: React.FC<Props> = ({ children }) => {
  const timerRef = React.useRef<number | null>(null);

  const clearTimer = React.useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const scheduleNextRefresh = React.useCallback(async () => {
    clearTimer();

    const accessToken = getAccessToken();
    const refreshToken = getRefreshToken();

    if (!refreshToken) {
      return;
    }

    try {
      if (!accessToken || isTokenExpired(accessToken)) {
        await refreshAccessToken();
      }

      const latestAccessToken = getAccessToken();
      const expiryTime = getTokenExpiryTime(latestAccessToken);

      if (!expiryTime) return;

      const now = Date.now();
      const refreshBeforeMs = 30 * 1000;
      const delay = Math.max(expiryTime - now - refreshBeforeMs, 1000);

      timerRef.current = window.setTimeout(async () => {
        try {
          await refreshAccessToken();
          await scheduleNextRefresh();
        } catch {
          clearTokens();
        }
      }, delay);
    } catch {
      clearTokens();
    }
  }, [clearTimer]);

  React.useEffect(() => {
    scheduleNextRefresh();

    const onStorage = (e: StorageEvent) => {
      if (
        e.key === "access_token" ||
        e.key === "refresh_token" ||
        e.key === "expires_at" ||
        e.key === null
      ) {
        scheduleNextRefresh();
      }
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        scheduleNextRefresh();
      }
    };

    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearTimer();
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [scheduleNextRefresh, clearTimer]);

  return <>{children}</>;
};

export default TokenRefreshProvider;