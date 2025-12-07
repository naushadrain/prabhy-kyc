// src/api/loginClient.ts
import { encryptAESWithSecret } from "./cryptoHelpers";
import { buildSignatureForBody } from "./signature";
import { ensureSession } from "./sessionClient";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;
const USER_LOGIN_ID = import.meta.env.VITE_USER_LOGIN_ID as string;

/**
 * Matches Postman login pre-request:
 * - AES(mobile)  -> username
 * - AES(password)-> password
 * - verify-signature: unix_ts + "." + JSON(body) + "." + secret-key
 * - Basic Auth: username = user_login_id, password = process_id (from session-id)
 */
export async function loginCustomer(mobile: string, password: string) {
    if (!API_BASE_URL) {
        throw new Error("VITE_API_BASE_URL is not set");
    }
    if (!USER_LOGIN_ID) {
        throw new Error("VITE_USER_LOGIN_ID is not set");
    }

    // 1) session-id -> process_id (for Basic Auth password)
    const sessionProcessId = await ensureSession();

    // 2) AES encrypt mobile & password (like Postman)
    const encryptedMobile = encryptAESWithSecret(mobile);     // "{{login-encrypt}}"
    const encryptedPwd = encryptAESWithSecret(password);      // "{{pwd-encrypt}}"

    // 3) Request body (same as Postman raw body)
    const bodyObj = {
        username: encryptedMobile,
        password: encryptedPwd,
        grant_type: "password",
    };

    const jsonBody = JSON.stringify(bodyObj);

    // 4) Signature: unix_ts + "." + jsonBody + "." + secret-key
    const { unixTs, signature } = buildSignatureForBody(jsonBody);

    // 5) Basic auth: username=user_login_id, password=process_id
    const basicToken = btoa(`${USER_LOGIN_ID}:${sessionProcessId}`);

    const res = await fetch(`${API_BASE_URL}/v1/common/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "verify-signature": `${unixTs}.${signature}`,
            Authorization: `Basic ${basicToken}`,
        },
        body: jsonBody,
    });

    const data = await res.json();

    // API error: error_list[]
    if (data?.error_list && data.error_list.length > 0) {
        const err = data.error_list[0];
        throw new Error(err.error_message || "Login failed");
    }

    if (!res.ok) {
        throw new Error(`Login error ${res.status}`);
    }

    // Store tokens like Postman test script would
    if (data.access_token) {
        localStorage.setItem("access_token", data.access_token);
    }
    if (data.refresh_token) {
        localStorage.setItem("refresh_token", data.refresh_token);
    }
    if (data.new_device_process_id) {
        // if backend says "new device", you can use this for OTP flow
        localStorage.setItem("otp_process_id", data.new_device_process_id);
    }

    return data;
}
