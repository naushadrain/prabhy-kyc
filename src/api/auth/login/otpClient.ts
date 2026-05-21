// src/api/otpClient.js
import { encryptAESWithSecret } from "../../cryptoHelpers";
import { buildSignatureForBody } from "../../session/signature";
import { ensureSession } from "../../session/sessionClient";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const USER_LOGIN_ID = import.meta.env.VITE_USER_LOGIN_ID;

export async function sendOneTimeOtp(mobileNumber) {
  if (!API_BASE_URL) throw new Error("VITE_API_BASE_URL is not set");
  if (!USER_LOGIN_ID) throw new Error("VITE_USER_LOGIN_ID is not set");

  //  session process_key (for Basic Auth password)
  const sessionProcessKey = await ensureSession();

  const encryptedMobile = encryptAESWithSecret(mobileNumber);

  localStorage.setItem("otp_mobile", mobileNumber);
  localStorage.setItem("login_encrypt", encryptedMobile);

  const bodyObj = {
    mobile_number: encryptedMobile,
    language: "en",
    issue_type: "07",
  };

  const jsonBody = JSON.stringify(bodyObj);
  const { unixTs, signature } = buildSignatureForBody(jsonBody);

  // Basic Auth = user_login_id : session_process_key
  const basicToken = btoa(`${USER_LOGIN_ID}:${sessionProcessKey}`);

  const res = await fetch(`${API_BASE_URL}/v1/common/onetime-otp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "verify-signature": `${unixTs}.${signature}`,
      Authorization: `Basic ${basicToken}`,
    },
    body: jsonBody,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const errMsg = data?.error_list?.[0]?.error_message || `OTP error ${res.status}`;
    throw new Error(errMsg);
  }

  return data; // expects { process_id: "..." }
}

export async function validateOneTimeOtp(otp) {
  if (!API_BASE_URL) throw new Error("VITE_API_BASE_URL is not set");
  if (!USER_LOGIN_ID) throw new Error("VITE_USER_LOGIN_ID is not set");

  //  session process_key (Basic password)
  const sessionProcessKey = await ensureSession();

  const otpProcessId = localStorage.getItem("otp_process_id");
  if (!otpProcessId) throw new Error("OTP session missing. Please request OTP again.");

  const encryptedOtp = encryptAESWithSecret(otp);

  const bodyObj = {
    issue_type: "07",
    process_id: otpProcessId, //  OTP process id goes in BODY
    verification_code: encryptedOtp,
  };

  const jsonBody = JSON.stringify(bodyObj);
  const { unixTs, signature } = buildSignatureForBody(jsonBody);

  //  Basic Auth = user_login_id : session_process_key (NOT otp_process_id)
  const basicToken = btoa(`${USER_LOGIN_ID}:${sessionProcessKey}`);

  const res = await fetch(`${API_BASE_URL}/v1/common/onetime-otp/validate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "verify-signature": `${unixTs}.${signature}`,
      Authorization: `Basic ${basicToken}`,
    },
    body: jsonBody,
  });

  const data = await res.json().catch(() => ({}));

  if (data?.error_list?.length) {
    throw new Error(data.error_list[0]?.error_message || "OTP validation failed");
  }
  if (!res.ok) {
    throw new Error(`OTP validation error ${res.status}`);
  }

  //  save tokens
  if (data.access_token) localStorage.setItem("access_token", data.access_token);
  if (data.refresh_token) localStorage.setItem("refresh_token", data.refresh_token);

  return data;
}
