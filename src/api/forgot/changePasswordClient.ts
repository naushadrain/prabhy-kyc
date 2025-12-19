// src/api/forgot/changePasswordClient.ts
import { encryptAESWithSecret } from "../cryptoHelpers";
import { buildSignatureForBody } from "../session/signature";       // <-- use your signature.ts
import { createSession } from "../session/sessionClient";           // <-- use your sessionClient.ts

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;
const USER_LOGIN_ID = import.meta.env.VITE_USER_LOGIN_ID as string;

export async function changePasswordClient(currentPassword: string, newPassword: string) {
    if (!API_BASE_URL) throw new Error("VITE_API_BASE_URL is not set");
    if (!USER_LOGIN_ID) throw new Error("VITE_USER_LOGIN_ID is not set");

    // 
}