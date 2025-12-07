// src/api/otpClient.js
import { encryptAESWithSecret } from "./cryptoHelpers";
import { buildSignatureForBody } from "./signature";
import { ensureSession } from "./sessionClient";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const USER_LOGIN_ID = import.meta.env.VITE_USER_LOGIN_ID;

export async function sendOneTimeOtp(mobileNumber) {
    if (!API_BASE_URL) throw new Error("VITE_API_BASE_URL is not set");
    if (!USER_LOGIN_ID) throw new Error("VITE_USER_LOGIN_ID is not set");

    const sessionProcessId = await ensureSession();

    // 🔐 same as Postman: AES(mobile, secret_key, iv=secret_key)
    const encryptedMobile = encryptAESWithSecret(mobileNumber);

    // 🔹 store for later steps (validate + register)
    localStorage.setItem("otp_mobile", mobileNumber);
    localStorage.setItem("login_encrypt", encryptedMobile);

    const bodyObj = {
        mobile_number: encryptedMobile,
        language: "en",
        issue_type: "07",
    };

    const jsonBody = JSON.stringify(bodyObj);
    const { unixTs, signature } = buildSignatureForBody(jsonBody);

    const basicToken = btoa(`${USER_LOGIN_ID}:${sessionProcessId}`);

    const res = await fetch(`${API_BASE_URL}/v1/common/onetime-otp`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "verify-signature": `${unixTs}.${signature}`,
            Authorization: `Basic ${basicToken}`,
        },
        body: jsonBody,
    });

    const data = await res.json();

    if (!res.ok) {
        const errMsg =
            data?.error_list?.[0]?.error_message || `OTP error ${res.status}`;
        throw new Error(errMsg);
    }

    // we already decided: if process_id exists, treat as success
    return data;
}



export async function validateOneTimeOtp(otp) {
    if (!API_BASE_URL) throw new Error("VITE_API_BASE_URL is not set");
    if (!USER_LOGIN_ID) throw new Error("VITE_USER_LOGIN_ID is not set");

    // session-id process_key (used as Basic Auth password)
    const sessionProcessId = await ensureSession();

    // process_id returned from /onetime-otp (saved earlier)
    const otpProcessId = localStorage.getItem("otp_process_id");
    if (!otpProcessId) {
        throw new Error("OTP session missing. Please request OTP again.");
    }

    // Encrypt OTP exactly like Postman (otp-encrypt)
    const encryptedOtp = encryptAESWithSecret(otp);

    const bodyObj = {
        issue_type: "07",
        process_id: otpProcessId,
        verification_code: encryptedOtp,
    };

    const jsonBody = JSON.stringify(bodyObj);
    const { unixTs, signature } = buildSignatureForBody(jsonBody);

    // Basic auth: username=user_login_id, password=process_id
    const basicToken = btoa(`${USER_LOGIN_ID}:${sessionProcessId}`);

    const res = await fetch(`${API_BASE_URL}/v1/common/onetime-otp/validate`, {
        // v1/common/onetime-otp/validate
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "verify-signature": `${unixTs}.${signature}`,
            Authorization: `Basic ${basicToken}`,
        },
        body: jsonBody,
    });

    const data = await res.json();

    // Negative case: status 200 but error_list has E5999 etc.
    if (data?.error_list && data.error_list.length > 0) {
        const err = data.error_list[0];
        throw new Error(err.error_message || "OTP validation failed");
    }

    if (!res.ok) {
        throw new Error(`OTP validation error ${res.status}`);
    }

    // Success — store tokens if present
    if (data.access_token) {
        localStorage.setItem("access_token", data.access_token);
    }
    if (data.refresh_token) {
        localStorage.setItem("refresh_token", data.refresh_token);
    }

    return data;
}