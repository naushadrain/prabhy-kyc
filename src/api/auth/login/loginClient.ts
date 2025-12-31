// src/api/auth/loginClient.ts
import { encryptAESWithSecret } from "@/api/cryptoHelpers";
import { buildSignatureForBody } from "@/api/session/signature";
import { createSession } from "@/api/session/sessionClient";
import { setTokens } from "../tokenStore";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;
const USER_LOGIN_ID = import.meta.env.VITE_USER_LOGIN_ID as string;

export async function loginCustomer(mobile: string, password: string) {
    if (!API_BASE_URL) throw new Error("VITE_API_BASE_URL is not set");
    if (!USER_LOGIN_ID) throw new Error("VITE_USER_LOGIN_ID is not set");

    const sessionProcessId = await createSession();

    const encryptedMobile = encryptAESWithSecret(mobile);
    const encryptedPwd = encryptAESWithSecret(password);

    const bodyObj = { username: encryptedMobile, password: encryptedPwd, grant_type: "password" };
    const jsonBody = JSON.stringify(bodyObj);

    const { unixTs, signature } = buildSignatureForBody(jsonBody);
    const basicToken = btoa(`${USER_LOGIN_ID}:${sessionProcessId}`);

    const res = await fetch(`${API_BASE_URL}/v1/common/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "verify-signature": `${unixTs}.${signature}`,
            Authorization: `Basic ${basicToken}`,
            Accept: "*/*",
        },
        body: jsonBody,
    });

    const text = await res.text();
    let data: any = {};
    try { data = text ? JSON.parse(text) : {}; } catch { data = {}; }

    if (data?.error_list?.length) throw new Error(data.error_list[0]?.error_message || "Login failed");
    if (!res.ok) throw new Error(data?.message || `Login error ${res.status}`);

    // store tokens + expiry
    setTokens({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_in: data.expires_in, // if API provides
    });

    if (data.new_device_process_id) localStorage.setItem("otp_process_id", data.new_device_process_id);

    return data;
}
