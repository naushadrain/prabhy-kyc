import { buildSignatureForBody } from "../session/signature";
import { authFetch } from "@/api/auth/authFetch";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

export async function kycStatus() {
  const url = `${API_BASE_URL}/v1/CustomerKyc/check-kyc-status`;

  const { unixTs, signature } = buildSignatureForBody("");
  const verifySignature = `${unixTs}.${signature}`;

  const res = await authFetch(url, {
    method: "GET",
    headers: {
      "verify-signature": verifySignature,
      Accept: "application/json",
    },
  });

  const text = await res.text();
  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  console.log("KYC STATUS HTTP:", res.status);
  console.log("KYC STATUS BODY:", data);

  if (!res.ok) {
    throw new Error(
      data?.message ||
        data?.error_list?.[0]?.error_message ||
        `HTTP ${res.status}`
    );
  }

  return data;
}