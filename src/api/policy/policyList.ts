// src/api/policy/policyList.ts

import { buildSignatureForBody } from "../session/signature";
import { createSession } from "../session/sessionClient";
import { getAccessToken } from "../auth/tokenStore";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;
const USER_LOGIN_ID = import.meta.env.VITE_USER_LOGIN_ID as string;

// Types for Policy List
export interface Policy {
  created_date: string;
  effective_date: string;
  expiry_date: string;
  policy_number: string;
  expiry_status: string;
  total_premium: string;
  insured_name: string;
  product_name: string;
  payment_status: string;
  policy_status: string;
  policy_remarks: string;
  is_draft_policy: string;
}

export interface PolicyListResponse {
  class_id: number;
  total_data_no: number;
  policy_list: Policy[];
  process_result: boolean;
  error_list: any[];
}

// Types for Policy Details
export interface ScheduleItem {
  schedule_title: string;
  schedule_description: string;
  schedule_excess: string;
  travel_area_id: number;
  travel_plan: number;
  sequence_order: number;
}

export interface PolicyDetailResponse {
  class_id: number;
  no_of_days: number;
  branch_name_english: string;
  insured_person_name: string;
  insured_person_address: string;
  fiscal_year: string;
  old_policy_text: string;
  policy_number: string;
  off_alias: string;
  agent_alias: string;
  policy_issue_date: string;
  createdTime: string;
  effective_date: string;
  expiry_date: string;
  credit_no: string;
  stamp_duty: string;
  vat_amount: string;
  total_premium: string;
  have_children_info: string;
  is_draft_policy: string;
  dob: string;
  passport_no: string;
  phone_no: string;
  travel_plan_name: string;
  travel_plan: string;
  travel_area: string;
  country_name: string;
  premium: string;
  currency_name: string;
  currency_premium: string;
  schedule_list: ScheduleItem[];
  children_list: any[];
  process_result: boolean;
  error_list: any[];
}

/**
 * Get policy list by class ID
 */
export async function getPolicyList(classId: number = 81): Promise<PolicyListResponse> {
  try {
    const accessToken = getAccessToken();
    
    if (!accessToken) {
      throw new Error("No access token found");
    }

    const processKey = await createSession(USER_LOGIN_ID);
    const { unixTs, signature } = buildSignatureForBody("");
    const basicToken = btoa(`${USER_LOGIN_ID}:${processKey}`);

    const url = new URL(`${API_BASE_URL}/v1/Policy/get-policy-list`);
    url.searchParams.append('class_id', classId.toString());

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "X-Authorization": `Basic ${basicToken}`,
        "verify-signature": `${unixTs}.${signature}`,
        "split-signature": `${unixTs}.${signature}`,
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching policy list:", error);
    throw error;
  }
}

/**
 * Get policy details by policy number
 */
export async function getPolicyDetail(classId: number, policyNo: string): Promise<PolicyDetailResponse> {
  try {
    const accessToken = getAccessToken();
    
    if (!accessToken) {
      throw new Error("No access token found");
    }

    const processKey = await createSession(USER_LOGIN_ID);
    const { unixTs, signature } = buildSignatureForBody("");
    const basicToken = btoa(`${USER_LOGIN_ID}:${processKey}`);

    const url = new URL(`${API_BASE_URL}/v1/Policy/get-policy-detail`);
    url.searchParams.append('class_id', classId.toString());
    url.searchParams.append('doc_no', policyNo);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "X-Authorization": `Basic ${basicToken}`,
        "verify-signature": `${unixTs}.${signature}`,
        "split-signature": `${unixTs}.${signature}`,
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching policy detail:", error);
    throw error;
  }
}

// src/api/policy/policyList.ts

/**
 * Print/Download policy PDF
 */
export async function printPolicyPdf(classId: number, policyNo: string): Promise<Blob> {
  try {
    const accessToken = getAccessToken();
    
    if (!accessToken) {
      throw new Error("No access token found");
    }

    const processKey = await createSession(USER_LOGIN_ID);
    const { unixTs, signature } = buildSignatureForBody("");
    const basicToken = btoa(`${USER_LOGIN_ID}:${processKey}`);

    const url = new URL(`${API_BASE_URL}/v1/Policy/print-policy-pdf`);
    url.searchParams.append('class_id', classId.toString());
    url.searchParams.append('doc_no', policyNo);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "X-Authorization": `Basic ${basicToken}`,
        "verify-signature": `${unixTs}.${signature}`,
        "split-signature": `${unixTs}.${signature}`,
        "Accept": "application/pdf",
      },
    });

    if (!response.ok) {
      throw new Error(`PDF download failed: ${response.status}`);
    }

    return await response.blob();
  } catch (error) {
    console.error("Error printing policy PDF:", error);
    throw error;
  }
}