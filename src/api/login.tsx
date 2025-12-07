// src/api/login.ts
import CryptoJS from "crypto-js";
import { createSession } from "./createSession";

const HOST = import.meta.env.VITE_API_HOST as string;
const SECRET_KEY = import.meta.env.VITE_SECRET_KEY as string;
const DEFAULT_USER_LOGIN_ID = import.meta.env.VITE_USER_LOGIN_ID as string;

export type LoginParams = {
    username: string; // mobile or email (plain)
    password: string; // plain
};

export type LoginResult = {
    accessToken: string;
    refreshToken: string;
    raw: any;
};

export async function login({ username, password }: LoginParams): Promise<LoginResult> {
    if (!HOST || !SECRET_KEY || !DEFAULT_USER_LOGIN_ID) {
        throw new Error("API env vars are missing (VITE_API_HOST / VITE_SECRET_KEY / VITE_USER_LOGIN_ID).");
    }

    // 0) FIRST: create session to get process_key (like Postman)
    const session = await createSession({
        userLoginId: DEFAULT_USER_LOGIN_ID,
    });
    const processKey = session.processId;          // process_key
    const loginId = DEFAULT_USER_LOGIN_ID;         // device_id / user_login_id

    // 1) AES-encrypt username & password (same as Postman login-encrypt, pwd-encrypt)
    const key = CryptoJS.enc.Utf8.parse(SECRET_KEY);
    const iv = CryptoJS.enc.Utf8.parse(SECRET_KEY);

    const usernameEncrypted = CryptoJS.AES.encrypt(username, key, {
        iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
    }).toString();

    const passwordEncrypted = CryptoJS.AES.encrypt(password, key, {
        iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
    }).toString();

    // 2) unix timestamp (seconds) for THIS login request
    const unixTs = Math.floor(Date.now() / 1000).toString();

    // 3) request body (matches PDF spec)
    const bodyObj = {
        username: usernameEncrypted,
        password: passwordEncrypted,
        grant_type: "password",
    };

    const jsonBody = JSON.stringify(bodyObj);

    // 4) signature = SHA256("<unixTs>.<jsonBody>.<secret_key>")
    const dataToSign = `${unixTs}.${jsonBody}.${SECRET_KEY}`;
    const hash = CryptoJS.SHA256(dataToSign);
    const signature = hash.toString(CryptoJS.enc.Hex);

    // 5) Basic Auth: username = device_id/user_login_id, password = process_key
    const basicToken = btoa(`${loginId}:${processKey}`);

    const res = await fetch(`${HOST}/v1/common/login`, {
        method: "POST",
        headers: {
            Accept: "*/*",
            "Content-Type": "application/json",
            Authorization: `Basic ${basicToken}`,
            "verify-signature": `${unixTs}.${signature}`,
            // send both to be safe, some endpoints mention split-signature
            "split-signature": `${unixTs}.${signature}`,
        },
        body: jsonBody,
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Login failed (${res.status}): ${text}`);
    }

    const data = await res.json();
    console.log("[LOGIN] response", data);

    if (!data.access_token) {
        const firstError = data.error_list?.[0];
        const msg = firstError?.error_message || "Login failed.";
        const err: any = new Error(msg);
        err.apiData = data;
        throw err;
    }

    return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        raw: data,
    };
}
