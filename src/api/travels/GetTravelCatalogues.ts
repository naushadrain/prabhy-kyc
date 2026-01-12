import { buildSignatureForBody } from "../session/signature";
import { createSession } from "../session/sessionClient";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;
const USER_LOGIN_ID = import.meta.env.VITE_USER_LOGIN_ID as string;

export const getTravelCatalogues = async () => {
    if (!API_BASE_URL || !USER_LOGIN_ID) {
        throw new Error("Missing env vars: VITE_API_BASE_URL / VITE_USER_LOGIN_ID");
    }
    const sessionProcessId = await createSession();
    const {unixTs, signature} = buildSignatureForBody('');
    const basicToken = btoa(`${USER_LOGIN_ID}:${sessionProcessId}`);
    const res = await fetch(`${API_BASE_URL}/v1/travels/catalogues`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "verify-signature": `${unixTs}.${signature}`,
            Authorization: `Basic ${basicToken}`,
            Accept: "*/*",
        },
    })


}