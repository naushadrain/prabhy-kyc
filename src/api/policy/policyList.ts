// src/api/policy/policyList.ts

import { buildSignatureForBody } from "../session/signature";
import { createSession } from "../session/sessionClient";
import { getAccessToken } from "../auth/tokenStore";
import { PolicyDetailResponse, PolicyListResponse } from "@/types/policy/types";
import { authFetch } from "../auth/authFetch";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;
const USER_LOGIN_ID = import.meta.env.VITE_USER_LOGIN_ID as string;


/**
 * Get policy list by class ID
 */
export async function getPolicyList(): Promise<PolicyListResponse> {
  try {
    const accessToken = getAccessToken();

    if (!accessToken) {
      throw new Error("No access token found");
    }

    const processKey = await createSession(USER_LOGIN_ID);
    const { unixTs, signature } = buildSignatureForBody("");
    const basicToken = btoa(`${USER_LOGIN_ID}:${processKey}`);

    const url = `${API_BASE_URL}/v1/Policy/get-policy-list`;

    const response = await authFetch(url.toString(), {
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
    console.error("Error authFetching policy list:", error);
    throw error;
  }
}

/**
 * Get policy details by policy number
 */
// src/api/policy/policyApi.ts

export async function getPolicyDetail(doc_no: string): Promise<PolicyDetailResponse> {
  const processKey = await createSession(USER_LOGIN_ID);
  const { unixTs, signature } = buildSignatureForBody("");
  const basicToken = btoa(`${USER_LOGIN_ID}:${processKey}`);

  const url = `${API_BASE_URL}/v1/Policy/get-policy-detail?doc_no=${doc_no}`;

  const response = await authFetch(url, {
    method: "GET",
    headers: {
      "X-Authorization": `Basic ${basicToken}`,
      "verify-signature": `${unixTs}.${signature}`,
      "split-signature": `${unixTs}.${signature}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return await response.json();
}

// src/api/policy/policyList.ts

/**
 * Print/Download policy PDF
 */
export async function printPolicyPdf(document_number: string): Promise<any> {
  const processKey = await createSession(USER_LOGIN_ID);
  const { unixTs, signature } = buildSignatureForBody("");
  const basicToken = btoa(`${USER_LOGIN_ID}:${processKey}`);

  const url = `${API_BASE_URL}/v1/Policy/policy-pdf-link?document_number=${encodeURIComponent(document_number)}`;

  const response = await authFetch(url, {
    method: "GET",
    headers: {
      "X-Authorization": `Basic ${basicToken}`,
      "verify-signature": `${unixTs}.${signature}`,
      "split-signature": `${unixTs}.${signature}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`PDF link request failed: ${response.status}`);
  }

  return await response.json();
}