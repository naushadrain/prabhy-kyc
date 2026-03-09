// src/api/travels/CreateTravelPolicy.ts
import { buildSignatureForBody } from "../session/signature";
import { getAccessToken } from "../auth/tokenStore";
import { createSession } from "../session/sessionClient";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;
const USER_LOGIN_ID = import.meta.env.VITE_USER_LOGIN_ID as string;

// Matches the Postman collection entity exactly
export type CreateTravelPolicyPayload = {
  client_info: { Bank_Code: string };

  policy_info: {
    department_id: string;
    class_id: string;
    payment_process: string;
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
    passport_front_id: string | null;
    passport_back_id: string | null;
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

  policy_session_id: string;

  child_info?: Array<{
    children_name: string;
    children_dob: string;
    children_passport: string;
    children_passport_front_id: string | null;
    children_passport_back_id: string | null;
  }>;
};

export async function createTravelPolicy(payload: CreateTravelPolicyPayload) {
  if (!API_BASE_URL) throw new Error("Missing env var: VITE_API_BASE_URL");

  const accessToken = getAccessToken();
  if (!accessToken) throw new Error("No access token found. Please login again.");

  // Fresh session tied to the logged-in user
  const processKey = await createSession(USER_LOGIN_ID);
  const basicToken = btoa(`${USER_LOGIN_ID}:${processKey}`);

  // Inject the fresh session ID into the payload
  const finalPayload = { ...payload, policy_session_id: processKey };

  const bodyStr = JSON.stringify(finalPayload);
  const { unixTs, signature } = buildSignatureForBody(bodyStr);

  const res = await fetch(`${API_BASE_URL}/v1/Travel/create_travel_policy`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      "X-Authorization": `Basic ${basicToken}`,
      "verify-signature": `${unixTs}.${signature}`,
      "split-signature": `${unixTs}.${signature}`,
      Accept: "*/*",
    },
    body: bodyStr,
  });

  const rawText = await res.text();
  let responseData: any = null;
  try {
    responseData = rawText ? JSON.parse(rawText) : null;
  } catch {
    responseData = null;
  }

  if (!res.ok) {
    throw {
      status: res.status,
      data: responseData,
      message:
        responseData?.error_list?.[0]?.error_message ||
        rawText ||
        `HTTP error ${res.status}`,
    };
  }

  return responseData;
}
