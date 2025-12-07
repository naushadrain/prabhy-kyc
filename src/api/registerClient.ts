// src/api/registerClient.js
import { encryptAESWithSecret } from "./cryptoHelpers";
import { buildSignatureForBody } from "./signature";
import { ensureSession } from "./sessionClient";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const USER_LOGIN_ID = import.meta.env.VITE_USER_LOGIN_ID;

export async function registerCustomer({ firstName, lastName, password }) {
    if (!API_BASE_URL) throw new Error("VITE_API_BASE_URL is not set");
    if (!USER_LOGIN_ID) throw new Error("VITE_USER_LOGIN_ID is not set");

    const sessionProcessId = await ensureSession();              // {{process_id}} for Basic
    const otpProcessId = localStorage.getItem("otp_process_id"); // {{otp-process-id}}
    let loginEncrypt = localStorage.getItem("login_encrypt");    // {{login-encrypt}}
    const otpMobile = localStorage.getItem("otp_mobile");

    if (!otpProcessId) {
        throw new Error("Missing OTP process. Please verify OTP again.");
    }

    // 🔁 Fallback: recompute login_encrypt from mobile if needed
    if (!loginEncrypt && otpMobile) {
        loginEncrypt = encryptAESWithSecret(otpMobile);
        localStorage.setItem("login_encrypt", loginEncrypt);
    }

    if (!loginEncrypt) {
        throw new Error("Missing login_encrypt. Please send OTP again.");
    }

    // 🔐 password encryption – same as Postman (pwd-encrypt)
    const encryptedPwd = encryptAESWithSecret(password);

    // 🔸 Body EXACTLY like your Postman example
    const bodyObj = {
        process_id: otpProcessId,
        auto_login_after_registration: true,
        user_name: loginEncrypt,
        password: encryptedPwd,
        Party_Type: "Individual",
        Customer_Name: {
            First_Name: firstName,
            Last_Name: lastName,
        },
    };

    const jsonBody = JSON.stringify(bodyObj);

    // signature: unix_ts + "." + jsonBody + "." + secret-key
    const { unixTs, signature } = buildSignatureForBody(jsonBody);

    const basicToken = btoa(`${USER_LOGIN_ID}:${sessionProcessId}`);

    const res = await fetch(`${API_BASE_URL}/v1/member/registercustomer`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "verify-signature": `${unixTs}.${signature}`,
            Authorization: `Basic ${basicToken}`,
        },
        body: jsonBody,
    });

    const data = await res.json();

    if (data?.error_list && data.error_list.length > 0) {
        const err = data.error_list[0];
        throw new Error(err.error_message || "Registration failed");
    }

    if (!res.ok) {
        throw new Error(`Registration error ${res.status}`);
    }

    return data;
}
