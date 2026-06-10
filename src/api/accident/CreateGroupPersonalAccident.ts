// src/api/accident/CreateGroupPersonalAccident.ts

import { buildSignatureForBody } from "../session/signature";
import { createSession } from "../session/sessionClient";
import { authFetch } from "../auth/authFetch";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;
const USER_LOGIN_ID = import.meta.env.VITE_USER_LOGIN_ID as string;

export type GroupPremiumPersonInfo = {
  suminsured: string;
};

export type GroupPersonalAccidentPremiumRequest = {
  class_id: string;
  total_suminsured: string;
  person_info: GroupPremiumPersonInfo[];
  get_direct_discount: "y" | "n";
  total_person: string;
};

export type GroupPersonalAccidentAmountInfo = {
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

export type GroupPersonalAccidentPremiumResponse = {
  policy_session_id: string;
  amount_info: GroupPersonalAccidentAmountInfo;
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

export type GroupPersonInfo = {
  person_code: string;
  person_name: string;
  dob: string;
  age: string;
  designation: string;
  suminsured: string;
  relationship_with_prosper: string;
  occupation_nature: string;
  nominee_name: string;
  nominee_relation: string;
};

export type CreateGroupPersonalAccidentPolicyPayload = {
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
    total_suminsured: string;
    is_bulk_insert: string;
    person_info: GroupPersonInfo[];
  };
};

export type CreateGroupPersonalAccidentPolicyResponse = {
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
  return data?.error_list?.[0]?.error_message || data?.message || fallback;
}

function buildSignedHeaders(bodyStr: string, processKey: string) {
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

/**
 * Public GPA premium calculation API
 * Endpoint:
 * POST /v1/Misc/get-gpa-premium
 */
export async function getGroupPersonalAccidentPremium(
  payload: GroupPersonalAccidentPremiumRequest,
): Promise<GroupPersonalAccidentPremiumResponse> {
  const fixedPayload: GroupPersonalAccidentPremiumRequest = {
    class_id: String(payload.class_id || "19"),
    total_suminsured: String(payload.total_suminsured || "0"),
    person_info: Array.isArray(payload.person_info)
      ? payload.person_info.map((person) => ({
          suminsured: String(person.suminsured || "0"),
        }))
      : [],
    get_direct_discount: payload.get_direct_discount === "y" ? "y" : "n",
    total_person: String(payload.total_person || payload.person_info?.length || "0"),
  };

  const bodyStr = JSON.stringify(fixedPayload);
  const processKey = await createSession();

  const response = await fetch(`${API_BASE_URL}/v1/Misc/get-gpa-premium`, {
    method: "POST",
    headers: buildSignedHeaders(bodyStr, processKey),
    body: bodyStr,
  });

  const data: GroupPersonalAccidentPremiumResponse = await response.json();

  if (!response.ok || data?.process_result === false) {
    throw new Error(
      getApiErrorMessage(data, "Failed to calculate group personal accident premium"),
    );
  }

  return data;
}

/**
 * Auth GPA policy creation API
 * Endpoint:
 * POST /v1/Misc/create-misc-gpa-policy
 */
export async function createGroupPersonalAccidentPolicy(
  payload: CreateGroupPersonalAccidentPolicyPayload,
): Promise<CreateGroupPersonalAccidentPolicyResponse> {
  const fixedPayload: CreateGroupPersonalAccidentPolicyPayload = {
    client_info: {
      Bank_Code: String(payload.client_info?.Bank_Code || "1"),
    },

    policy_info: {
      department_id: String(payload.policy_info?.department_id || "3"),
      class_id: String(payload.policy_info?.class_id || "19"),
      payment_process: payload.policy_info?.payment_process || "Full Payment",
      effective_date: payload.policy_info?.effective_date || "",
      expiry_date: payload.policy_info?.expiry_date || "",
    },

    policy_session_id: String(payload.policy_session_id || ""),

    class_info: {
      class_id: String(payload.class_info?.class_id || "19"),
      profession_id: String(payload.class_info?.profession_id || "2"),
      total_suminsured: String(payload.class_info?.total_suminsured || "0"),
      is_bulk_insert: payload.class_info?.is_bulk_insert || "",
      person_info: Array.isArray(payload.class_info?.person_info)
        ? payload.class_info.person_info.map((person) => ({
            person_code: String(person.person_code || ""),
            person_name: String(person.person_name || ""),
            dob: String(person.dob || ""),
            age: String(person.age || ""),
            designation: String(person.designation || ""),
            suminsured: String(person.suminsured || "0"),
            relationship_with_prosper: String(
              person.relationship_with_prosper || "",
            ),
            occupation_nature: String(person.occupation_nature || "user defined"),
            nominee_name: String(person.nominee_name || ""),
            nominee_relation: String(person.nominee_relation || ""),
          }))
        : [],
    },
  };

  const bodyStr = JSON.stringify(fixedPayload);
  const processKey = await createSession();

  const response = await authFetch(
    `${API_BASE_URL}/v1/Misc/create-misc-gpa-policy`,
    {
      method: "POST",
      headers: buildSignedHeaders(bodyStr, processKey),
      body: bodyStr,
    },
  );

  const data: CreateGroupPersonalAccidentPolicyResponse = await response.json();

  if (!response.ok || data?.process_result === false) {
    throw new Error(
      getApiErrorMessage(data, "Failed to create group personal accident policy"),
    );
  }

  return data;
}