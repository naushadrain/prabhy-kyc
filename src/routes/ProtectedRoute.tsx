// src/routes/ProtectedRoute.tsx
import { Navigate, Outlet, useLocation } from "react-router-dom";

export const ProtectedRoute = () => {
    const token = localStorage.getItem("access_token"); // set after login
    const location = useLocation();

    // Not logged in → go to login, but remember where we came from
    if (!token) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    // Logged in → render children routes
    return <Outlet />;
};
