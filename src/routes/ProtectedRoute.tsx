// src/routes/ProtectedRoute.tsx
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getAccessToken, getRefreshToken, clearTokens } from "@/api/auth/tokenStore";
import { isTokenExpired } from "@/api/auth/tokenExpiry";
import { refreshAccessToken } from "@/api/auth/login/loginClient";

type Status = "checking" | "ok" | "redirect";

export const ProtectedRoute = () => {
  const location = useLocation();
  const [status, setStatus] = React.useState<Status>("checking");

  React.useEffect(() => {
    let cancelled = false;

    const checkAuth = async () => {
      const accessToken = getAccessToken();
      const refreshToken = getRefreshToken();

      if (accessToken && !isTokenExpired(accessToken)) {
        if (!cancelled) setStatus("ok");
        return;
      }

      if (refreshToken) {
        try {
          await refreshAccessToken();
          if (!cancelled) setStatus("ok");
          return;
        } catch {
          clearTokens();
        }
      }

      if (!cancelled) setStatus("redirect");
    };

    checkAuth();

    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "access_token") {
        setStatus(e.newValue ? "ok" : "redirect");
      }

      if (e.key === "refresh_token" && !e.newValue) {
        setStatus("redirect");
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  if (status === "checking") return null;

  if (status === "redirect") {
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

export default ProtectedRoute;