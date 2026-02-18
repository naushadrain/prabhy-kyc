import { buildSignatureForBody } from "../session/signature";
import { createSession } from "../session/sessionClient";
import { getAccessToken } from "../auth/tokenStore";
import type { UsersInfo, } from "@/types/gotohome";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;
const USER_LOGIN_ID = import.meta.env.VITE_USER_LOGIN_ID as string;

/**
 * Fetches user information from the API
 * @returns Promise with user information
 * @throws Error if authentication fails or API request fails
 */
export async function getUserInfo(): Promise<UsersInfo> {
    try {
        // Get access token from localStorage
        const accessToken = getAccessToken();
        
        if (!accessToken) {
            throw new Error("No access token found. Please login again.");
        }

        // Create session to get processKey
        const processKey = await createSession(USER_LOGIN_ID);
        
        if (!processKey) {
            throw new Error("Failed to create session");
        }

        // Build signature for empty body (GET request)
        const { unixTs, signature } = buildSignatureForBody("");
        
        // Create Basic auth token using USER_LOGIN_ID and processKey
        const basicToken = btoa(`${USER_LOGIN_ID}:${processKey}`);

        const url = new URL(`${API_BASE_URL}/v1/member/get-user-info`);

        const response = await fetch(url.toString(), {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${accessToken}`, // Bearer token from localStorage
                "X-Authorization": `Basic ${basicToken}`, // Basic auth for service authentication
                "verify-signature": `${unixTs}.${signature}`,
                "split-signature": `${unixTs}.${signature}`,
                "Accept": "application/json",
                "Content-Type": "application/json",
            },
        });

        // Check if response is ok
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
        }

        // Parse response
        const data = await response.json();

        // Check if API returned an error
        if (data.process_result === false) {
            const errorMessage = data.error_list?.[0]?.error_message || "Failed to fetch user info";
            throw new Error(errorMessage);
        }

        // Check if member_info exists
        if (!data.member_info) {
            throw new Error("No user information found in response");
        }

        return data.member_info;

    } catch (error) {
        // Re-throw with better error message
        if (error instanceof Error) {
            throw new Error(`getUserInfo failed: ${error.message}`);
        }
        throw new Error("getUserInfo failed: Unknown error");
    }
}
