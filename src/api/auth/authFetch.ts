import { getAccessToken, clearTokens } from "@/api/auth/tokenStore";
import { refreshAccessToken } from "@/api/auth/login/loginClient";

let refreshPromise: Promise<string> | null = null;

async function getFreshToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken();
  }

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

function redirectToLogin() {
  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
}

export async function authFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const makeRequest = async (token?: string | null) => {
    const headers = new Headers(init.headers || {});
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    return fetch(input, {
      ...init,
      headers,
    });
  };

  let accessToken = getAccessToken();
  let response = await makeRequest(accessToken);

  if (response.status === 401 || response.status === 403) {
    try {
      accessToken = await getFreshToken();
      response = await makeRequest(accessToken);
    } catch (error) {
      clearTokens();
      redirectToLogin();
      throw error;
    }
  }

  return response;
}