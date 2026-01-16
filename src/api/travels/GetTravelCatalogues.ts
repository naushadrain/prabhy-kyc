// ✅ GetTravelCatalogues.ts (complete working code)

import { buildSignatureForBody } from "../session/signature";
import { createSession } from "../session/sessionClient";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;
const USER_LOGIN_ID = import.meta.env.VITE_USER_LOGIN_ID as string;

async function makeAuthHeaders() {
  if (!API_BASE_URL || !USER_LOGIN_ID) {
    throw new Error("Missing env vars: VITE_API_BASE_URL / VITE_USER_LOGIN_ID");
  }

  const sessionProcessId = await createSession();
  const { unixTs, signature } = buildSignatureForBody("");
  const basicToken = btoa(`${USER_LOGIN_ID}:${sessionProcessId}`);

  return {
    "Content-Type": "application/json",
    "verify-signature": `${unixTs}.${signature}`,
    Authorization: `Basic ${basicToken}`,
    Accept: "*/*",
  };
}

export const getTravelCataloguesPlane = async () => {
  const headers = await makeAuthHeaders();

  const res = await fetch(
    `${API_BASE_URL}/v1/Travel/get-travel-plans?class_id=81`,
    { method: "GET", headers }
  );

  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const getTravelCataloguesArea = async (areaPlanId: string) => {
  const headers = await makeAuthHeaders();

  const res = await fetch(
    `${API_BASE_URL}/v1/Travel/get-travel-area?class_id=81&plan_id=${encodeURIComponent(
      areaPlanId
    )}`,
    { method: "GET", headers }
  );

  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const getTravelCataloguesPackage = async (
  areaId: string,
  areaPlanId: string
) => {
  const headers = await makeAuthHeaders();

  const res = await fetch(
    `${API_BASE_URL}/v1/Travel/get-travel-packages?class_id=81&area_id=${encodeURIComponent(
      areaId
    )}&area_plan_id=${encodeURIComponent(areaPlanId)}`,
    { method: "GET", headers }
  );

  if (!res.ok) throw new Error(await res.text());
  return res.json();
};


export async function getTravelPeriod(planId: string | number, days: string | number) {
  const headers = await makeAuthHeaders();

  const url =
    `${API_BASE_URL}/v1/Travel/get-travel-period?class_id=81&plan_id=${planId}&days=${days}`;

  const res = await fetch(url, { method: "GET", headers });

  if (!res.ok) throw new Error(await res.text());
  return res.json();
}