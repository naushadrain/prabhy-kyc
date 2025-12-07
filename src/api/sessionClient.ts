// src/api/sessionClient.js
import { buildSignatureForBody } from "./signature";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const USER_LOGIN_ID = import.meta.env.VITE_USER_LOGIN_ID;
const DEVICE_OS = import.meta.env.VITE_DEVICE_OS;
const APP_VERSION = import.meta.env.VITE_APP_VERSION;

let cachedProcessId = null;

export async function createSession() {
    if (!API_BASE_URL) {
        throw new Error("VITE_API_BASE_URL is not set");
    }

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

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Session error ${res.status}: ${text}`);
    }

    const data = await res.json(); // expects { process_key: "..." }
    const processId = data.process_key;
    localStorage.setItem("session_process_id", processId);
    cachedProcessId = processId;
    return processId;
}

export async function ensureSession() {
    if (cachedProcessId) return cachedProcessId;

    const stored = localStorage.getItem("session_process_id");
    if (stored) {
        cachedProcessId = stored;
        return stored;
    }

    return createSession();
}
