import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isTokenExpired, msUntilTokenExpiry } from "@/api/auth/tokenExpiry";
import { refreshToken } from "@/api/session/refreshTokenClient";

const CHECK_EVERY_MS = 3 * 60 * 1000;      // ✅ every 3 minutes just CHECK
const REFRESH_BEFORE_EXP_MS = 25 * 1000;   // ✅ refresh 25s before expiry
const MIN_DELAY_MS = 5 * 1000;             // safety

function logout() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("access_expires_at");
}

export const ProtectedRoute = () => {
  const location = useLocation();

  const [ready, setReady] = React.useState(false);
  const [token, setToken] = React.useState<string | null>(() =>
    localStorage.getItem("access_token")
  );
  const [forceLogin, setForceLogin] = React.useState(false);

  const refreshingRef = React.useRef(false);

  // ✅ keep token synced across tabs/windows
  React.useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "access_token") setToken(e.newValue);
      if (e.key === "refresh_token" && !e.newValue) {
        setToken(null);
        setForceLogin(true);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // ✅ refresh helper
  const doRefresh = React.useCallback(async (mustSucceed: boolean) => {
    if (refreshingRef.current) return;
    refreshingRef.current = true;

    try {
      const newToken = await refreshToken();

      // refresh failed
      if (!newToken) {
        const current = localStorage.getItem("access_token");

        // logout only if we MUST succeed OR token already expired
        if (mustSucceed || !current || isTokenExpired(current)) {
          logout();
          setToken(null);
          setForceLogin(true);
        }
        return;
      }

      // refresh success
      setToken(newToken);
      setForceLogin(false);
    } finally {
      refreshingRef.current = false;
    }
  }, []);

  // ✅ Check current token state (no refresh unless needed)
  const checkAndRefreshIfNeeded = React.useCallback(async () => {
    const current = localStorage.getItem("access_token");
    if (!current) {
      setToken(null);
      setForceLogin(true);
      return;
    }

    // already expired -> must refresh
    if (isTokenExpired(current)) {
      await doRefresh(true);
      return;
    }

    // near expiry -> must refresh
    const ms = msUntilTokenExpiry(current);
    if (ms != null && ms <= REFRESH_BEFORE_EXP_MS) {
      await doRefresh(true);
      return;
    }

    // still valid
    setToken(current);
  }, [doRefresh]);

  // ✅ Initial boot
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      await checkAndRefreshIfNeeded();
      if (!mounted) return;
      setReady(true);
    })();
    return () => {
      mounted = false;
    };
  }, [checkAndRefreshIfNeeded]);

  // ✅ Every 3 minutes: ONLY CHECK (refresh only if needed)
  React.useEffect(() => {
    if (!ready) return;

    const id = window.setInterval(() => {
      checkAndRefreshIfNeeded();
    }, CHECK_EVERY_MS);

    return () => window.clearInterval(id);
  }, [ready, checkAndRefreshIfNeeded]);

  // ✅ Refresh BEFORE expiry (precise timer)
  React.useEffect(() => {
    if (!ready || !token) return;

    const ms = msUntilTokenExpiry(token);
    if (ms == null) return;

    const delay = Math.max(ms - REFRESH_BEFORE_EXP_MS, MIN_DELAY_MS);

    const id = window.setTimeout(() => {
      doRefresh(true); // must succeed near expiry
    }, delay);

    return () => window.clearTimeout(id);
  }, [ready, token, doRefresh]);

  // ✅ If user comes back to tab -> re-check immediately
  React.useEffect(() => {
    if (!ready) return;

    const onVis = () => {
      if (document.visibilityState === "visible") {
        checkAndRefreshIfNeeded();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [ready, checkAndRefreshIfNeeded]);

  if (!ready) return null;

  if (forceLogin || !token) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location, reason: "unauthorized" }}
      />
    );
  }

  return <Outlet />;
};
