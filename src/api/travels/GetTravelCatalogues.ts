import { buildSignatureForBody } from "../session/signature";
import { createSession } from "../session/sessionClient";
import { authFetch } from "../auth/authFetch";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;
const USER_LOGIN_ID = import.meta.env.VITE_USER_LOGIN_ID as string;

async function makeSignedHeaders() {
  if (!API_BASE_URL || !USER_LOGIN_ID) {
    throw new Error("Missing env vars: VITE_API_BASE_URL / VITE_USER_LOGIN_ID");
  }

  const sessionProcessId = await createSession();
  const { unixTs, signature } = buildSignatureForBody("");
  const basicToken = btoa(`${USER_LOGIN_ID}:${sessionProcessId}`);

  return {
    "Content-Type": "application/json",
    "verify-signature": `${unixTs}.${signature}`,
    "X-Basic-Authorization": `Basic ${basicToken}`,
    Accept: "*/*",
  };
}

export const getTravelCataloguesPlane = async () => {
  const headers = await makeSignedHeaders();

  const res = await authFetch(
    `${API_BASE_URL}/v1/Travel/get-travel-plans?class_id=33`,
    {
      method: "GET",
      headers,
    }
  );

  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const getTravelCataloguesArea = async (planId: string) => {
  const headers = await makeSignedHeaders();

  const res = await authFetch(
    `${API_BASE_URL}/v1/Travel/get-travel-area?class_id=33&plan_id=${encodeURIComponent(planId)}`,
    {
      method: "GET",
      headers,
    }
  );

  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const getTravelCataloguesPackage = async (
  planId: string,
  areaId: string,
  
) => {
  const headers = await makeSignedHeaders();

  const res = await authFetch(
    `${API_BASE_URL}/v1/Travel/get-travel-packages?class_id=33&plan_id=${encodeURIComponent(planId)}&area_id=${encodeURIComponent(areaId)}`,
    {
      method: "GET",
      headers,
    }
  );

  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export async function getTravelPeriod(
  planId: string | number,
  days: string | number,
  area_id: string | number,
  package_id:string | number
) {
  const headers = await makeSignedHeaders();

  const url = `${API_BASE_URL}/v1/Travel/get-travel-period?class_id=33&plan_id=${planId}&days=${days}&area_id=${area_id}&package_id=${package_id}`;

  const res = await authFetch(url, {
    method: "GET",
    headers,
  });

  if (!res.ok) throw new Error(await res.text());
  return res.json();
}