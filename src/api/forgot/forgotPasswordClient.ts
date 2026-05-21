// src/api/forgot/forgotPasswordClient.ts
import { encryptAESWithSecret } from "../cryptoHelpers";
import { buildSignatureForBody } from "../session/signature";       // <-- use your signature.ts
import { createSession } from "../session/sessionClient";           // <-- use your sessionClient.ts

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;
const USER_LOGIN_ID = import.meta.env.VITE_USER_LOGIN_ID as string;

export type SendOtpResponse = {
  process_result?: boolean;
  process_id?: string;
  error_list?: Array<{ error_code: string; error_message: string }>;
  [k: string]: any;
};

export async function sendForgotPasswordOtp(mobileNumber: string): Promise<SendOtpResponse> {
  if (!API_BASE_URL) throw new Error("VITE_API_BASE_URL is not set");
  if (!USER_LOGIN_ID) throw new Error("VITE_USER_LOGIN_ID is not set");

  // 1) create/ensure session (gives process_key)
  const sessionProcessKey = await createSession();

  // 2) encrypt mobile (AES CBC, iv=secret_key)
  const encryptedMobile = encryptAESWithSecret(mobileNumber);

  // store (optional)
  localStorage.setItem("forgot_mobile", mobileNumber);
  localStorage.setItem("forgot_mobile_encrypt", encryptedMobile);

  // 3) build body exactly like Postman
  const bodyObj = {
    mobile_number: encryptedMobile,
    issue_type: "04", // forgot password
    language: "en",
  };

  const jsonBody = JSON.stringify(bodyObj);

  // 4) signature must be based on jsonBody
  const { unixTs, signature } = buildSignatureForBody(jsonBody);

  // 5) Basic Auth: user_login_id : process_key
  const basicToken = btoa(`${USER_LOGIN_ID}:${sessionProcessKey}`);

  const res = await fetch(`${API_BASE_URL}/v1/common/onetime-otp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${basicToken}`,
      "verify-signature": `${unixTs}.${signature}`,
      // some servers accept split-signature too
      "split-signature": `${unixTs}.${signature}`,
    },
    body: jsonBody,
  });

  const rawText = await res.text();
  let data: SendOtpResponse = {};
  try {
    data = rawText ? JSON.parse(rawText) : {};
  } catch {
    data = {};
  }

  // handle API error message
  if (!res.ok || data?.error_list?.length) {
    const msg =
      data?.error_list?.[0]?.error_message ||
      rawText ||
      `Failed to send OTP (${res.status})`;
    throw new Error(msg);
  }

  // save process_id for verify step
  if (data?.process_id) {
    localStorage.setItem("otp_process_id", data.process_id);
  }

  return data;
}


export async function validateForgotPasswordOtp(otp: string): Promise<boolean> {
  if (!API_BASE_URL) throw new Error("VITE_API_BASE_URL is not set");
  if (!USER_LOGIN_ID) throw new Error("VITE_USER_LOGIN_ID is not set");

  // 1) create/ensure session (gives process_key)
  const sessionProcessKey = await createSession();

  // 2) encrypt otp (AES CBC, iv=secret_key)
  const encryptedOtp = encryptAESWithSecret(otp);

  // 3) build body exactly like Postman
  const bodyObj = {
    issue_type: "04", // forgot password
    process_id: localStorage.getItem("otp_process_id"), //  OTP process id goes in BODY
    verification_code: encryptedOtp,
  };

  const jsonBody = JSON.stringify(bodyObj);

  // 4) signature must be based on jsonBody
  const { unixTs, signature } = buildSignatureForBody(jsonBody);

  // 5) Basic Auth: user_login_id : process_key
  const basicToken = btoa(`${USER_LOGIN_ID}:${sessionProcessKey}`);

  const res = await fetch(`${API_BASE_URL}/v1/common/onetime-otp/validate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${basicToken}`,
      "verify-signature": `${unixTs}.${signature}`,
      // some servers accept split-signature too
      "split-signature": `${unixTs}.${signature}`,
    },
    body: jsonBody,
  });

  const rawText = await res.text();
  let data: SendOtpResponse = {};
  try {
    data = rawText ? JSON.parse(rawText) : {};
  } catch {
    data = {};
  }

  // handle API error message
  if (!res.ok || data?.error_list?.length) {
    const msg =
      data?.error_list?.[0]?.error_message ||
      rawText ||
      `Failed to validate OTP (${res.status})`;
    throw new Error(msg);
  }

  return true;
}

export async function resetPassword(newPassword: string): Promise<boolean> {
  if (!API_BASE_URL) throw new Error("VITE_API_BASE_URL is not set");
  if (!USER_LOGIN_ID) throw new Error("VITE_USER_LOGIN_ID is not set");

  const otpProcessId =
    localStorage.getItem("otp_process_id") || localStorage.getItem("otp-process-id");

  if (!otpProcessId) throw new Error("OTP process_id not found. Please validate OTP again.");

  // 1) create/ensure session (gives process_key)
  const sessionProcessKey = await createSession();

  // 2) encrypt password (AES CBC, iv=secret_key)
  const encryptedPassword = encryptAESWithSecret(newPassword);

  // 3) Postman body (MUST match)
  const bodyObj = {
    new_login_password: encryptedPassword,
    issue_type: "02",
    process_id: otpProcessId,
  };

  const jsonBody = JSON.stringify(bodyObj);

  // 4) signature based on jsonBody
  const { unixTs, signature } = buildSignatureForBody(jsonBody);

  // 5) Basic Auth: user_login_id : process_key
  const basicToken = btoa(`${USER_LOGIN_ID}:${sessionProcessKey}`);

  const res = await fetch(`${API_BASE_URL}/v1/member/forgot-password`, {
    method: "PUT", //  Postman uses PUT
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${basicToken}`,
      "verify-signature": `${unixTs}.${signature}`,
      // keep if your backend accepts it (safe)
      "split-signature": `${unixTs}.${signature}`,
    },
    body: jsonBody,
  });

  const rawText = await res.text();
  let data: SendOtpResponse = {};
  try {
    data = rawText ? JSON.parse(rawText) : {};
  } catch {
    data = {};
  }

  if (!res.ok || data?.error_list?.length) {
    const msg =
      data?.error_list?.[0]?.error_message ||
      rawText ||
      `Failed to reset password (${res.status})`;
    throw new Error(msg);
  }

  return true;
}
