// src/hooks/useTokenRefresh.ts
import { useEffect, useRef, useCallback } from 'react';
import { refreshToken } from '@/api/session/refreshTokenClient';

const REFRESH_INTERVAL = 3 * 60 * 1000; // 3 minutes in milliseconds

export const useTokenRefresh = () => {
    const refreshTimeoutRef = useRef<NodeJS.Timeout>();
    const isRefreshingRef = useRef(false);

    const performRefresh = useCallback(async () => {
        // Don't refresh if already refreshing
        if (isRefreshingRef.current) return;
        
        isRefreshingRef.current = true;
        try {
            await refreshToken();
            console.log('🔄 Token refreshed successfully at', new Date().toLocaleTimeString());
        } catch (error) {
            console.error('❌ Token refresh failed:', error);
            // If refresh fails, user will be redirected to login by the next API call
        } finally {
            isRefreshingRef.current = false;
        }
    }, []);

    const startRefreshCycle = useCallback(() => {
        // Clear any existing timeout
        if (refreshTimeoutRef.current) {
            clearTimeout(refreshTimeoutRef.current);
        }

        // Schedule the next refresh
        refreshTimeoutRef.current = setTimeout(async () => {
            await performRefresh();
            // Schedule the next refresh after this one completes
            startRefreshCycle();
        }, REFRESH_INTERVAL);
    }, [performRefresh]);

    const stopRefreshCycle = useCallback(() => {
        if (refreshTimeoutRef.current) {
            clearTimeout(refreshTimeoutRef.current);
            refreshTimeoutRef.current = undefined;
        }
    }, []);

    // Auto-start the refresh cycle when the hook is used
    useEffect(() => {
        // Only start if we're in a protected route (user is logged in)
        // You can check for token existence here
        const token = localStorage.getItem('access_token'); // or your token store method
        if (token) {
            startRefreshCycle();
        }

        // Cleanup on unmount
        return () => {
            stopRefreshCycle();
        };
    }, [startRefreshCycle, stopRefreshCycle]);

    return { 
        refreshNow: performRefresh,
        stopRefresh: stopRefreshCycle,
        startRefresh: startRefreshCycle 
    };
};