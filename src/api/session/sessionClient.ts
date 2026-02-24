// src/api/sessionClient.ts
import { buildSignatureForBody } from "./signature";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string; // e.g. https://insurancedemo.iremit.com.my/WebOnline
const ENV_USER_LOGIN_ID = import.meta.env.VITE_USER_LOGIN_ID as string;

const DEVICE_OS = (import.meta.env.VITE_DEVICE_OS as string) || "online";
const APP_VERSION = (import.meta.env.VITE_APP_VERSION as string) || "1.0.0";

const STORAGE_KEY = "session_process_key";

let cachedProcessKey: string | null = null;

export async function createSession(userLoginId?: string): Promise<string> {
  if (!API_BASE_URL) throw new Error("VITE_API_BASE_URL is not set");
  const loginId = userLoginId || ENV_USER_LOGIN_ID;
  if (!loginId) throw new Error("VITE_USER_LOGIN_ID is not set");

  const bodyObj = {
    device_id: loginId,
    device_name: DEVICE_OS,
    device_os: DEVICE_OS,
    app_version: APP_VERSION,
  };

  const jsonBody = JSON.stringify(bodyObj);
  const { unixTs, signature } = buildSignatureForBody(jsonBody);

  const res = await fetch(`${API_BASE_URL}/v1/common/session-id`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      //  session-id uses split-signature (as your Postman)
      "split-signature": `${unixTs}.${signature}`,
      Accept: "*/*",
    },
    body: jsonBody,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg =
      data?.error_list?.[0]?.error_message ||
      data?.message ||
      `Session error ${res.status}`;
    throw new Error(msg);
  }

  //  some APIs return process_key, others process_id — handle both
  const processKey: string | undefined = data?.process_key || data?.process_id;
  if (!processKey) throw new Error("process_key/process_id आएन (session failed)");

  cachedProcessKey = processKey;
  localStorage.setItem(STORAGE_KEY, processKey);
  return processKey;
}

export async function ensureSession(userLoginId?: string): Promise<string> {
  if (cachedProcessKey) return cachedProcessKey;

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    cachedProcessKey = stored;
    return stored;
  }

  return createSession(userLoginId);
}
