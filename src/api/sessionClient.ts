// src/api/sessionClient.js
import { buildSignatureForBody } from "./signature";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; // e.g. https://insurancedemo.iremit.com.my/WebOnline
const USER_LOGIN_ID = import.meta.env.VITE_USER_LOGIN_ID;
const DEVICE_OS = import.meta.env.VITE_DEVICE_OS || "online";
const APP_VERSION = import.meta.env.VITE_APP_VERSION || "1.0.0";

const STORAGE_KEY = "session_process_key";
let cachedProcessKey = null;

export async function createSession() {
    if (!API_BASE_URL) throw new Error("VITE_API_BASE_URL is not set");
    if (!USER_LOGIN_ID) throw new Error("VITE_USER_LOGIN_ID is not set");

    const bodyObj = {
        device_id: USER_LOGIN_ID,
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
            "split-signature": `${unixTs}.${signature}`,
        },
        body: jsonBody,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        const msg = data?.error_list?.[0]?.error_message || `Session error ${res.status}`;
        throw new Error(msg);
    }

    if (!data?.process_key) throw new Error("process_key आएन (session failed)");

    cachedProcessKey = data.process_key;
    localStorage.setItem(STORAGE_KEY, cachedProcessKey);
    return cachedProcessKey;
}

export async function ensureSession() {
    if (cachedProcessKey) return cachedProcessKey;

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        cachedProcessKey = stored;
        return stored;
    }

    return createSession();
}
