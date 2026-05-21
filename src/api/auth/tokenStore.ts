// src/api/auth/tokenStore.ts
const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const EXPIRES_AT_KEY = "expires_at";

export type TokenPayload = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
};

class TokenStore {
  setTokens({ access_token, refresh_token, expires_in }: TokenPayload): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, access_token);

    if (refresh_token) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refresh_token);
    }

    if (expires_in && Number.isFinite(expires_in)) {
      const expiresAt = Date.now() + expires_in * 1000;
      localStorage.setItem(EXPIRES_AT_KEY, String(expiresAt));
    }
  }

  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  getExpiresAt(): number | null {
    const value = localStorage.getItem(EXPIRES_AT_KEY);
    return value ? Number(value) : null;
  }

  clearTokens(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(EXPIRES_AT_KEY);
  }

  hasAccessToken(): boolean {
    return !!this.getAccessToken();
  }

  hasRefreshToken(): boolean {
    return !!this.getRefreshToken();
  }
}

export const tokenStore = new TokenStore();

export const setTokens = tokenStore.setTokens.bind(tokenStore);
export const getAccessToken = tokenStore.getAccessToken.bind(tokenStore);
export const getRefreshToken = tokenStore.getRefreshToken.bind(tokenStore);
export const getExpiresAt = tokenStore.getExpiresAt.bind(tokenStore);
export const clearTokens = tokenStore.clearTokens.bind(tokenStore);