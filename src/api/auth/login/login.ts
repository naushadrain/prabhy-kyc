// src/api/login.ts
import CryptoJS from "crypto-js";
import { ensureSession } from "../../session/sessionClient";

const API_BASE_URL = "https://insurancedemo.iremit.com.my/WebOnline"; // https://.../WebOnline
const SECRET_KEY = import.meta.env.VITE_SECRET_KEY as string;
const USER_LOGIN_ID = import.meta.env.VITE_USER_LOGIN_ID as string;

export type LoginParams = {
  username: string; // plain
  password: string; // plain
};

export type LoginResult = {
  accessToken: string;
  refreshToken: string;
  raw: any;
};

export async function login({ username, password }: LoginParams): Promise<LoginResult> {
  if (!API_BASE_URL || !SECRET_KEY || !USER_LOGIN_ID) {
    throw new Error("Missing env vars: VITE_API_BASE_URL / VITE_SECRET_KEY / VITE_USER_LOGIN_ID");
  }

  // ✅ 0) FIRST: get process_key from session-id
  const processKey = await ensureSession(USER_LOGIN_ID);

  // ✅ 1) AES encrypt username & password (CBC, PKCS7, key=SECRET, iv=SECRET)
  const key = CryptoJS.enc.Utf8.parse(SECRET_KEY);
  const iv = CryptoJS.enc.Utf8.parse(SECRET_KEY);

  const encUsername = CryptoJS.AES.encrypt(username, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  }).toString();

  const encPassword = CryptoJS.AES.encrypt(password, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  }).toString();

  // ✅ 2) body (as API expects)
  const bodyObj = {
    username: encUsername,
    password: encPassword,
    grant_type: "password",
  };
  const jsonBody = JSON.stringify(bodyObj);

  // ✅ 3) signature = SHA256("<unixTs>.<jsonBody>.<secret_key>")
  const unixTs = Math.floor(Date.now() / 1000).toString();
  const dataToSign = `${unixTs}.${jsonBody}.${SECRET_KEY}`;
  const signature = CryptoJS.SHA256(dataToSign).toString(CryptoJS.enc.Hex);

  // ✅ 4) Basic Auth = user_login_id : process_key
  const basicToken = btoa(`${USER_LOGIN_ID}:${processKey}`);

  const res = await fetch(`${API_BASE_URL}/v1/common/login`, {
    method: "POST",
    headers: {
      Accept: "*/*",
      "Content-Type": "application/json",
      Authorization: `Basic ${basicToken}`,
      "verify-signature": `${unixTs}.${signature}`,
      // ✅ keep split-signature too (some endpoints accept either)
      "split-signature": `${unixTs}.${signature}`,
    },
    body: jsonBody,
  });

  const rawText = await res.text();
  let data: any = {};
  try {
    data = rawText ? JSON.parse(rawText) : {};
  } catch {
    data = {};
  }

  if (!res.ok) {
    const msg = data?.error_list?.[0]?.error_message || `Login failed (${res.status})`;
    throw new Error(msg);
  }

  if (!data?.access_token) {
    const msg = data?.error_list?.[0]?.error_message || "Login failed (no access_token)";
    throw new Error(msg);
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    raw: data,
  };
}
