// src/kyc/getcatalogue/getcatalogue.ts
import { ensureSession } from "@/api/session/sessionClient";
import { buildSignatureForBody } from "@/api/session/signature";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;
const USER_LOGIN_ID = import.meta.env.VITE_USER_LOGIN_ID as string;

export type CatalogueResponse = {
    process_result?: boolean;
    error_list?: Array<{ error_code: string; error_message: string }>;
    [k: string]: any;
};

export async function getCatalogue(
    catalogue_type: string | number,
    id: string | number
): Promise<CatalogueResponse> {
    if (!API_BASE_URL) throw new Error("VITE_API_BASE_URL is not set");
    if (!USER_LOGIN_ID) throw new Error("VITE_USER_LOGIN_ID is not set");

    // 1) session (process_key)
    const processKey = await ensureSession();

    // 2) Postman signs EMPTY body for this GET
    const jsonBody = "";
    const { unixTs, signature } = buildSignatureForBody(jsonBody);

    // 3) Basic Auth: user_login_id : process_key
    const basicToken = btoa(`${USER_LOGIN_ID}:${processKey}`);

    // 4) Build URL with query
    const url = new URL(`${API_BASE_URL}/v1/catalogue/getcatalogue`);
    url.searchParams.set("catalogue_type", String(catalogue_type));
    url.searchParams.set("id", String(id));

    const res = await fetch(url.toString(), {
        method: "GET",
        headers: {
            Authorization: `Basic ${basicToken}`,
            "verify-signature": `${unixTs}.${signature}`,
            // optional (some servers accept this too)
            "split-signature": `${unixTs}.${signature}`,
            Accept: "*/*",
        },
    });

    const rawText = await res.text();
    let data: CatalogueResponse = {};
    try {
        data = rawText ? JSON.parse(rawText) : {};
    } catch {
        data = {};
    }

    if (!res.ok || data?.error_list?.length) {
        const msg =
            data?.error_list?.[0]?.error_message ||
            rawText ||
            `GetCatalogue failed (${res.status})`;
        throw new Error(msg);
    }

    return data;
}
