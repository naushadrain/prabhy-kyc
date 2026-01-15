import { buildSignatureForBody } from "../session/signature";
import { createSession } from "../session/sessionClient";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;
const USER_LOGIN_ID = import.meta.env.VITE_USER_LOGIN_ID as string;

export async function getTravelAgeBands() {
    const processKey = await createSession(USER_LOGIN_ID);

    const { unixTs, signature } = buildSignatureForBody("");
    const basicToken = btoa(`${USER_LOGIN_ID}:${processKey}`);

    const url = new URL(`${API_BASE_URL}/v1/Travel/get-travel-age-bands?class_id=81`);

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

    return res.json();
}