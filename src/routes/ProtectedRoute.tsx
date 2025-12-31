// src/routes/ProtectedRoute.tsx
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
    const token = localStorage.getItem("access_token");
    const [expiredNow, setExpiredNow] = React.useState(false);

    // 1) No token -> login
    if (!token) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    // 2) Token present but already expired -> logout immediately
    if (isTokenExpired(token)) {
        logout();
        return <Navigate to="/login" replace state={{ from: location, reason: "expired" }} />;
    }

    // 3) Auto logout exactly when it expires (timer)
    React.useEffect(() => {
        const ms = msUntilTokenExpiry(token);
        if (ms == null) return; // can't determine expiry

        const id = window.setTimeout(() => {
            logout();
            setExpiredNow(true); // trigger rerender -> redirect
        }, ms);

        return () => window.clearTimeout(id);
    }, [token]);

    // 4) If timer fired
    if (expiredNow) {
        return <Navigate to="/login" replace state={{ from: location, reason: "expired" }} />;
    }

    return <Outlet />;
};
