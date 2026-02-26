// src/api/policy/policyList.ts

import { buildSignatureForBody } from "../session/signature";
import { createSession } from "../session/sessionClient";
import { getAccessToken } from "../auth/tokenStore";
import { PolicyDetailResponse, PolicyListResponse } from "@/types/policy/types";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;
const USER_LOGIN_ID = import.meta.env.VITE_USER_LOGIN_ID as string;


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

    const url = new URL(`${API_BASE_URL}/v1/Policy/get-policy-list?class_id=81`);
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
// src/api/policy/policyApi.ts

export async function getPolicyDetail(classId: number, doc_no: string): Promise<PolicyDetailResponse> {
  try {
    const accessToken = getAccessToken();

    if (!accessToken) {
      throw new Error("No access token found");
    }

    const processKey = await createSession(USER_LOGIN_ID);
    const { unixTs, signature } = buildSignatureForBody("");
    const basicToken = btoa(`${USER_LOGIN_ID}:${processKey}`);

    // Fix: Don't hardcode class_id=1 in the base URL
    const url = new URL(`${API_BASE_URL}/v1/Policy/get-policy-detail`);

    // Add query parameters properly
    url.searchParams.append('class_id', classId.toString());
    url.searchParams.append('doc_no', doc_no);

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
export async function printPolicyPdf(classId: number, doc_no: string): Promise<Blob> {
  try {
    const accessToken = getAccessToken();

    if (!accessToken) {
      throw new Error("No access token found");
    }

    const processKey = await createSession(USER_LOGIN_ID);
    const { unixTs, signature } = buildSignatureForBody("");
    const basicToken = btoa(`${USER_LOGIN_ID}:${processKey}`);

    const url = new URL(`${API_BASE_URL}/v1/Policy/print-policy-pdf?class_id=81&doc_no=${doc_no}`);
    url.searchParams.append('class_id', classId.toString());
    url.searchParams.append('doc_no', doc_no);

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