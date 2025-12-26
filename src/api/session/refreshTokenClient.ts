// src/api/session/refreshTokenClient.ts
import { buildSignatureForBody } from "@/api/session/signature";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

export async function refreshToken(): Promise<string | null> {
  const refresh = localStorage.getItem("refresh_token");
  if (!refresh) return null;

  const bodyObj = { refresh_token: refresh, grant_type: "refresh_token" };
  const jsonBody = JSON.stringify(bodyObj);

  const { unixTs, signature } = buildSignatureForBody(jsonBody);

  const res = await fetch(`${API_BASE_URL}/v1/common/refresh-token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "verify-signature": `${unixTs}.${signature}`,
      Accept: "*/*",
    },
    body: jsonBody,
  });

  const text = await res.text();
  let data: any = {};
  try { data = text ? JSON.parse(text) : {}; } catch {}

  if (!res.ok || data?.error_list?.length) return null;

  if (data.access_token) localStorage.setItem("access_token", data.access_token);
  if (data.refresh_token) localStorage.setItem("refresh_token", data.refresh_token);

  return data.access_token || null;
}
