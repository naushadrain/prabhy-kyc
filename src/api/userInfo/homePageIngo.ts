import { buildSignatureForBody } from "../session/signature";
import { createSession } from "../session/sessionClient";
import type { UsersInfo } from "@/types/gotohome";
import { authFetch } from "../auth/authFetch";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;
const USER_LOGIN_ID = import.meta.env.VITE_USER_LOGIN_ID as string;

export async function getUserInfo(): Promise<UsersInfo> {
    const processKey = await createSession(USER_LOGIN_ID);
    if (!processKey) throw new Error("Failed to create session");

    const { unixTs, signature } = buildSignatureForBody("");
    const basicToken = btoa(`${USER_LOGIN_ID}:${processKey}`);

    const response = await authFetch(`${API_BASE_URL}/v1/member/get-user-info`, {
        method: "GET",
        headers: {
            "X-Authorization": `Basic ${basicToken}`,
            "verify-signature": `${unixTs}.${signature}`,
            "split-signature": `${unixTs}.${signature}`,
            Accept: "application/json",
        },
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (data.process_result === false) {
        throw new Error(data.error_list?.[0]?.error_message || "Failed to fetch user info");
    }

    if (!data.member_info) {
        throw new Error("No user information found in response");
    }

    return data.member_info;
}
