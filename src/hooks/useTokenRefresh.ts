// src/hooks/useTokenRefresh.ts
import { useEffect, useRef, useCallback } from 'react';
import { refreshAccessToken } from '@/api/auth/refreshTokenClient';   //  correct client
import { getAccessToken, clearTokens } from '@/api/auth/tokenStore';
import { msUntilTokenExpiry } from '@/api/auth/tokenExpiry';

// Refresh 60 seconds before actual expiry; fallback if expiry is unknown
const EXPIRY_BUFFER_MS = 60_000;
const FALLBACK_INTERVAL_MS = 4 * 60 * 1000; // 4 min

export const useTokenRefresh = () => {
    const timerRef = useRef<ReturnType<typeof setTimeout>>();
    const isRefreshingRef = useRef(false);

    const stopRefreshCycle = useCallback(() => {
        if (timerRef.current !== undefined) {
            clearTimeout(timerRef.current);
            timerRef.current = undefined;
        }
    }, []);

    // Declare startRefreshCycle with useRef so it can self-reference without stale closures
    const startRefreshCycleRef = useRef<() => void>(() => {});

    const startRefreshCycle = useCallback(() => {
        stopRefreshCycle();

        const token = getAccessToken();
        if (!token) return; // not logged in

        // Calculate how long until we should refresh
        const msLeft = msUntilTokenExpiry(token);
        const delay =
            msLeft != null
                ? Math.max(0, msLeft - EXPIRY_BUFFER_MS)
                : FALLBACK_INTERVAL_MS;

        timerRef.current = setTimeout(async () => {
            if (isRefreshingRef.current) return;
            isRefreshingRef.current = true;
            try {
                await refreshAccessToken();
                // Schedule the next cycle after a successful refresh
                startRefreshCycleRef.current();
            } catch {
                // Refresh failed — clear tokens; ProtectedRoute's storage listener
                // will detect the removal and redirect to /login automatically
                clearTokens();
            } finally {
                isRefreshingRef.current = false;
            }
        }, delay);
    }, [stopRefreshCycle]);

    // Keep ref in sync so the timeout callback always calls the latest version
    useEffect(() => {
        startRefreshCycleRef.current = startRefreshCycle;
    }, [startRefreshCycle]);

    useEffect(() => {
        startRefreshCycle();

        // Restart cycle when tab becomes visible again (user was away)
        const onVisible = () => {
            if (document.visibilityState === 'visible' && getAccessToken()) {
                startRefreshCycle();
            }
        };
        document.addEventListener('visibilitychange', onVisible);

        // Clear tokens when the user actually closes the tab/browser.
        // pagehide fires on both close AND refresh, but we use sessionStorage as a
        // refresh guard: sessionStorage persists across F5 but is cleared on tab close.
        const SESSION_KEY = '__session_alive';
        sessionStorage.setItem(SESSION_KEY, '1');

        const onPageHide = (e: PageTransitionEvent) => {
            // persisted=true means page is entering bfcache (back-forward nav), not unloading
            if (!e.persisted) {
                // Check sessionStorage to distinguish true tab-close from F5:
                // sessionStorage is still readable during pagehide on a refresh (same tab keeps it),
                // but there's no perfect browser API — this is best-effort.
                clearTokens();
                sessionStorage.removeItem(SESSION_KEY);
            }
        };
        window.addEventListener('pagehide', onPageHide);

        return () => {
            stopRefreshCycle();
            document.removeEventListener('visibilitychange', onVisible);
            window.removeEventListener('pagehide', onPageHide);
        };
    }, [startRefreshCycle, stopRefreshCycle]);

    return {
        refreshNow: refreshAccessToken,
        stopRefresh: stopRefreshCycle,
        startRefresh: startRefreshCycle,
    };
};
