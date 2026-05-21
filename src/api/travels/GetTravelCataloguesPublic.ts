import { buildSignatureForBody } from "../session/signature";
import { createSession } from "../session/sessionClient";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;
const USER_LOGIN_ID = import.meta.env.VITE_USER_LOGIN_ID as string;

type TravelPremiumPayload = {
  class_id: string | number;
  age_band_id: string | number;
  travel_package_id: string | number;
  travel_area_id: string | number;
  travel_area_plan_id: string | number;
  period_id: string | number;
};

type PeriodApiItem = {
  value: string;
  data: string;
};

type ApiErrorItem = {
  error_code?: string;
  error_message?: string;
};

export type TravelPeriodResponse = {
  class_id: number;
  total_data_no?: number;
  catalogue_list?: PeriodApiItem[];
  process_result: boolean;
  error_list?: ApiErrorItem[];
};

async function makeAuthHeaders(body = "") {
  if (!API_BASE_URL || !USER_LOGIN_ID) {
    throw new Error("Missing env vars: VITE_API_BASE_URL / VITE_USER_LOGIN_ID");
  }

  const sessionProcessId = await createSession();
  const { unixTs, signature } = buildSignatureForBody(body);
  const basicToken = btoa(`${USER_LOGIN_ID}:${sessionProcessId}`);

  return {
    "Content-Type": "application/json",
    "verify-signature": `${unixTs}.${signature}`,
    Authorization: `Basic ${basicToken}`,
    Accept: "*/*",
  };
}

function extractApiErrorMessage(resp: TravelPeriodResponse) {
  if (Array.isArray(resp?.error_list) && resp.error_list.length > 0) {
    return resp.error_list
      .map((item) => item?.error_message)
      .filter(Boolean)
      .join(", ");
  }
  return "Failed to load travel period";
}

export const getTravelCataloguesPlane = async () => {
  const headers = await makeAuthHeaders();

  const res = await fetch(
    `${API_BASE_URL}/v1/Travel/get-travel-plans?class_id=33`,
    { method: "GET", headers }
  );

  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const getTravelCataloguesArea = async (areaPlanId: string) => {
  const headers = await makeAuthHeaders();

  const res = await fetch(
    `${API_BASE_URL}/v1/Travel/get-travel-area?class_id=33&plan_id=${encodeURIComponent(areaPlanId)}`,
    { method: "GET", headers }
  );

  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const getTravelCataloguesPackage = async (
  areaId: string,
  areaPlanId: string,
  plan_id:string
) => {
  const headers = await makeAuthHeaders();

  const res = await fetch(
    `${API_BASE_URL}/v1/Travel/get-travel-packages?class_id=33&area_id=${encodeURIComponent(areaId)}&area_plan_id=${encodeURIComponent(areaPlanId)}&plan_id=${encodeURIComponent(plan_id)}`,
    { method: "GET", headers }
  );

  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export async function getTravelPeriod(
  planId: string | number,
  days: string | number,
  area_id: string | number,
  package_id: string | number
): Promise<TravelPeriodResponse> {
  const headers = await makeAuthHeaders();

  const url = `${API_BASE_URL}/v1/Travel/get-travel-period?class_id=33&plan_id=${encodeURIComponent(
    String(planId)
  )}&days=${encodeURIComponent(String(days))}&area_id=${encodeURIComponent(
    String(area_id)
  )}&package_id=${encodeURIComponent(String(package_id))}`;

  const res = await fetch(url, { method: "GET", headers });

  if (!res.ok) throw new Error(await res.text());

  const data: TravelPeriodResponse = await res.json();

  if (!data?.process_result) {
    throw new Error(extractApiErrorMessage(data));
  }

  return data;
}

export async function getTravelAgeBandsPublic() {
  const headers = await makeAuthHeaders();

  const res = await fetch(
    `${API_BASE_URL}/v1/Travel/get-travel-age-bands?class_id=33`,
    { method: "GET", headers }
  );

  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getTravelPremium(payload: TravelPremiumPayload) {
  const requestBody = JSON.stringify(payload);
  const headers = await makeAuthHeaders(requestBody);

  const res = await fetch(`${API_BASE_URL}/v1/Travel/getpremium`, {
    method: "POST",
    headers,
    body: requestBody,
  });

  if (!res.ok) throw new Error(await res.text());
  return res.json();
}