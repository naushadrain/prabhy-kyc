// src/api/travels/CreateTravelPolicy.ts
import { buildSignatureForBody } from "../session/signature";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

function getTokenOrThrow() {
  const raw =
    localStorage.getItem("access_token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token");

  if (!raw) throw new Error("No access token found in localStorage");
  return raw;
}

function buildAuthHeader(rawToken: string) {
  // If user stored full header already ("Bearer xxx" or "Basic xxx"), keep it.
  if (/^(Bearer|Basic)\s+/i.test(rawToken)) return rawToken;

  // Otherwise use Bearer as you requested
  return `Bearer ${rawToken}`;
}

export type CreateTravelPolicyPayload = {
  client_info: { Bank_Code: string };

  policy_info: {
    department_id: string;
    class_id: string;
    payment_process: string;
    proposed_date: string;
    issued_date_ad: string;
    issued_date_bs: string;
    effective_date: string;
    expiry_date: string;
  };

  class_info: {
    class_id: string;
    passport_number: string;
    date_of_birth_AD: string;
    phone_number: string;
    age_band_id: string;
    travel_package_id: string;
    travel_area_id: string;
    travel_area_plan_id: string;
    period_id: string;
    currency_id: string;
    currency_rate: number;
    currency_premium: number;
    premium: number;
    currency_suminsured: number;
    total_suminsured: number;
    have_children: boolean;
    country_code: string;
  };

  amount_info: {
    suminsured: number;
    premium_amount: number;
    pa_amount: number;
    tpl_amount: number;
    pool_amount: number;
    taxable_amount: number;
    stamp_duty: number;
    vat_percent: number;
    vat_amount: number;
    total_amount: number;
  };

  child_info?: Array<{
    children_name: string;
    children_dob: string;
    children_passport: string;
  }>;
};

export async function createTravelPolicy(payload: CreateTravelPolicyPayload) {
  if (!API_BASE_URL) throw new Error("Missing env var: VITE_API_BASE_URL");

  const rawToken = getTokenOrThrow();
  const authHeader = buildAuthHeader(rawToken);

  const bodyStr = JSON.stringify(payload);

  // ✅ signature generated from body
  const { unixTs, signature } = buildSignatureForBody(bodyStr);

  const res = await fetch(`${API_BASE_URL}/v1/Travel/create_travel_policy`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader,
      "verify-signature": `${unixTs}.${signature}`,
      "split-signature": `${unixTs}.${signature}`,
      Accept: "*/*",
    },
    body: bodyStr,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to create travel policy");
  }

  return res.json();
}
