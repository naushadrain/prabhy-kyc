// src/components/TokenRefreshProvider.tsx
import React, { useEffect } from 'react';
import { useTokenRefresh } from '@/hooks/useTokenRefresh';
import { getAccessToken } from '@/api/auth/tokenStore';
interface TokenRefreshProviderProps {
    children: React.ReactNode;
}

export const TokenRefreshProvider: React.FC<TokenRefreshProviderProps> = ({ children }) => {
    const { startRefresh, stopRefresh } = useTokenRefresh();

    useEffect(() => {
        // Check if user is logged in (has access token)
        const checkAuthAndStartRefresh = () => {
            const token = getAccessToken();
            if (token) {
                startRefresh();
            } else {
                stopRefresh();
            }
        };

        // Initial check
        checkAuthAndStartRefresh();

        // Listen for storage events (in case token is cleared in another tab)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'access_token' || e.key === null) {
                checkAuthAndStartRefresh();
            }
        };

        window.addEventListener('storage', handleStorageChange);

        // Custom event listener for token changes within the app
        const handleTokenChange = () => {
            checkAuthAndStartRefresh();
        };

        window.addEventListener('token-change', handleTokenChange);

        return () => {
            stopRefresh();
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('token-change', handleTokenChange);
        };
    }, [startRefresh, stopRefresh]);

    return <>{children}</>;
};