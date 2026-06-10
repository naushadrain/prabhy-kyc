// src/api/accident/getPersonalAccidentPremium.ts

import { buildSignatureForBody } from "../session/signature";
import { createSession } from "../session/sessionClient";
import { authFetch } from "../auth/authFetch";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;
const USER_LOGIN_ID = import.meta.env.VITE_USER_LOGIN_ID as string;

export type PersonalAccidentPremiumRequest = {
  class_id: string;
  include_rsd_charge: boolean;
  suminsured: string;
  medical_suminsured: string;
  total_suminsured: string;
  get_direct_discount: string;
};

export type PersonalAccidentAmountInfo = {
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
  commission_percent: number;
  commission_amount: number;
  commission_tax_percent: number;
  commission_tax_amount: number;
};

export type PersonalAccidentPremiumResponse = {
  policy_session_id: string;
  amount_info: PersonalAccidentAmountInfo;
  direct_discount_percent: string | number;
  direct_discount_amount: string | number;
  total_premium_with_vat: string | number;
  process_result: boolean;
  error_list?: {
    error_code?: string;
    error_message?: string;
  }[];
  message?: string;
};

export type CreatePersonalAccidentPolicyPayload = {
  client_info: {
    Bank_Code: string;
  };

  policy_info: {
    department_id: string;
    class_id: string;
    payment_process: string;
    effective_date: string;
    expiry_date: string;
  };

  policy_session_id: string;

  class_info: {
    class_id: string;
    profession_id: string;
    suminsured: string;
    medical_suminsured: string;
    total_suminsured: string;
    nominee_honor_id: string;
    nominee_name: string;
    nominee_relation: string;
    father_name: string;
    mother_name: string;
  };
};

export type CreatePersonalAccidentPolicyResponse = {
  process_result: boolean;
  policy_no?: string;
  policy_number?: string;
  document_number?: string;
  message?: string;
  error_list?: {
    error_code?: string;
    error_message?: string;
  }[];
  [key: string]: any;
};

function getApiErrorMessage(data: any, fallback: string): string {
  return (
    data?.error_list?.[0]?.error_message ||
    data?.message ||
    fallback
  );
}

function buildAuthHeaders(bodyStr: string, processKey: string) {
  const { unixTs, signature } = buildSignatureForBody(bodyStr);
  const basicToken = btoa(`${USER_LOGIN_ID}:${processKey}`);

  return {
    "Content-Type": "application/json",
    Accept: "*/*",

    Authorization: `Basic ${basicToken}`,
    "X-Basic-Authorization": `Basic ${basicToken}`,

    "verify-signature": `${unixTs}.${signature}`,
    "split-signature": `${unixTs}.${signature}`,
  };
}

export async function getPersonalAccidentPremium(
  payload: PersonalAccidentPremiumRequest,
): Promise<PersonalAccidentPremiumResponse> {
  const bodyStr = JSON.stringify(payload);
  const processKey = await createSession();

  const response = await authFetch(`${API_BASE_URL}/v1/Misc/get-pa-premium`, {
    method: "POST",
    headers: buildAuthHeaders(bodyStr, processKey),
    body: bodyStr,
  });

  const data: PersonalAccidentPremiumResponse = await response.json();

  if (!response.ok || data?.process_result === false) {
    throw new Error(
      getApiErrorMessage(data, "Failed to calculate personal accident premium"),
    );
  }

  return data;
}

export async function createPersonalAccidentPolicy(
  payload: CreatePersonalAccidentPolicyPayload,
): Promise<CreatePersonalAccidentPolicyResponse> {
  const bodyStr = JSON.stringify(payload);
  const processKey = await createSession();

  const response = await authFetch(
    `${API_BASE_URL}/v1/Misc/create-misc-pa-policy`,
    {
      method: "POST",
      headers: buildAuthHeaders(bodyStr, processKey),
      body: bodyStr,
    },
  );

  const data: CreatePersonalAccidentPolicyResponse = await response.json();

  if (!response.ok || data?.process_result === false) {
    throw new Error(
      getApiErrorMessage(data, "Failed to create personal accident policy"),
    );
  }

  return data;
}