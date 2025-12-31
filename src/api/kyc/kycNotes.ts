// src/api/kyc/kycStatus.ts
import { buildSignatureForBody } from "../session/signature";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

function getAccessTokenOrThrow() {
    const token =
        localStorage.getItem("access_token") ||
        localStorage.getItem("accessToken") ||
        "";
    if (!token) throw new Error("Not logged in. access_token not found. Please login first.");
    return token;
}

export async function KycNotes() {
    const url = `${API_BASE_URL}/v1/CustomerKyc/get-kyc-notes`;
    const accessToken = getAccessTokenOrThrow();

    // For GET with no body, sign empty string (if your backend expects that)
    const { unixTs, signature } = buildSignatureForBody("");

    // ✅ correct order
    const verifySignature = `${unixTs}.${signature}`;

    const res = await fetch(url, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "verify-signature": verifySignature,
            Accept: "application/json",
        },
    });

    const text = await res.text();
    let data: any = {};
    try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }

    // helpful logs
    console.log("KYC STATUS HTTP:", res.status);
    console.log("KYC STATUS BODY:", data);

    if (!res.ok) {
        throw new Error(data?.message || data?.error_list?.[0]?.error_message || `HTTP ${res.status}`);
    }

    return data;
}
