import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isTokenExpired, msUntilTokenExpiry } from "@/api/auth/tokenExpiry";

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

  // ✅ keep token synced across tabs/windows
  React.useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "access_token") {
        setToken(e.newValue);
        if (!e.newValue) {
          setForceLogin(true);
        }
      }
      if (e.key === "refresh_token" && !e.newValue) {
        setToken(null);
        setForceLogin(true);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // ✅ boot check: token exist? expired?
  React.useEffect(() => {
    const current = localStorage.getItem("access_token");

    if (!current) {
      setToken(null);
      setForceLogin(true);
      setReady(true);
      return;
    }

    // expired -> logout
    if (isTokenExpired(current)) {
      logout();
      setToken(null);
      setForceLogin(true);
      setReady(true);
      return;
    }

    // valid
    setToken(current);
    setForceLogin(false);
    setReady(true);
  }, []);

  // ✅ auto logout exactly when token expires (timer)
  React.useEffect(() => {
    if (!ready || !token) return;

    // if already expired
    if (isTokenExpired(token)) {
      logout();
      setToken(null);
      setForceLogin(true);
      return;
    }

    const ms = msUntilTokenExpiry(token);
    if (ms == null) return;

    // small safety buffer so it logs out just before expiry
    const buffer = 1000; // 1 sec
    const delay = Math.max(0, ms - buffer);

    const id = window.setTimeout(() => {
      logout();
      setToken(null);
      setForceLogin(true);
    }, delay);

    return () => window.clearTimeout(id);
  }, [ready, token]);

  // ✅ if user returns to tab, re-check (important)
  React.useEffect(() => {
    if (!ready) return;

    const onVis = () => {
      if (document.visibilityState !== "visible") return;

      const current = localStorage.getItem("access_token");
      if (!current) {
        setToken(null);
        setForceLogin(true);
        return;
      }

      if (isTokenExpired(current)) {
        logout();
        setToken(null);
        setForceLogin(true);
        return;
      }

      setToken(current);
      setForceLogin(false);
    };

    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [ready]);

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
