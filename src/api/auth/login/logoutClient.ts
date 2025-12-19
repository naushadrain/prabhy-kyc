// src/api/logoutClient.ts
import { buildSignatureForBody } from "@/api/session/signature"; // same helper you used for other APIs

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

export async function logoutCustomer() {
    if (!API_BASE_URL) {
        throw new Error("VITE_API_BASE_URL is not set");
    }

    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) {
        // Not logged in, nothing to do
        return;
    }

    // In Postman:
    // var unix_ts = pm.environment.get("unix-ts");
    // var secret_key = pm.environment.get("secret-key");
    // var jsonBody = pm.request.body.raw ?? "";
    // dataToSign = unix_ts + "." + jsonBody + "." + secret_key;
    //
    // For logout, body is empty → jsonBody = ""
    const jsonBody = "";

    const { unixTs, signature } = buildSignatureForBody(jsonBody);

    const res = await fetch(`${API_BASE_URL}/v1/member/logout`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "verify-signature": `${unixTs}.${signature}`,
            Authorization: `Bearer ${accessToken}`,
        },
        body: jsonBody, // empty string (same as Postman raw body)
    });

    // Some backends return empty body; just check status
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Logout error ${res.status}`);
    }

    return true;
}
