// src/api/loginClient.ts
import { encryptAESWithSecret } from "@/api/cryptoHelpers";
import { buildSignatureForBody } from "@/api/session/signature";
import { createSession } from "@/api/session/sessionClient";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;
const USER_LOGIN_ID = import.meta.env.VITE_USER_LOGIN_ID as string;

export async function loginCustomer(mobile: string, password: string) {
    if (!API_BASE_URL) throw new Error("VITE_API_BASE_URL is not set");
    if (!USER_LOGIN_ID) throw new Error("VITE_USER_LOGIN_ID is not set");

    // 1) session-id -> process_id
    const sessionProcessId = await createSession();

    // 2) AES encrypt
    const encryptedMobile = encryptAESWithSecret(mobile);
    const encryptedPwd = encryptAESWithSecret(password);

    // 3) Body
    const bodyObj = { username: encryptedMobile, password: encryptedPwd, grant_type: "password" };
    const jsonBody = JSON.stringify(bodyObj);

    // 4) Signature for LOGIN (body = jsonBody)
    const { unixTs, signature } = buildSignatureForBody(jsonBody);

    // 5) Basic auth
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

    if (data.access_token) localStorage.setItem("access_token", data.access_token);
    if (data.refresh_token) localStorage.setItem("refresh_token", data.refresh_token);
    if (data.new_device_process_id) localStorage.setItem("otp_process_id", data.new_device_process_id);

    return data;
}
