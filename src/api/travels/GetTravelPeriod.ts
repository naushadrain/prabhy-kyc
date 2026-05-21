import { buildSignatureForBody } from "../session/signature";
import { createSession } from "../session/sessionClient";
import { authFetch } from "../auth/authFetch";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;
const USER_LOGIN_ID = import.meta.env.VITE_USER_LOGIN_ID as string;

export type GetPremiumRequest = {
  class_id: string | number;
  age_band_id: string | number;
  travel_package_id: string | number;
  travel_area_id: string | number;
  travel_area_plan_id: string | number;
  period_id: string | number;
};


async function safeCreateSession(): Promise<string> {
  const fn: any = createSession as any;
  try {
    return await fn(USER_LOGIN_ID);
  } catch {
    return await fn();
  }
}

export async function getTravelPremium(payload: GetPremiumRequest) {
  if (!API_BASE_URL || !USER_LOGIN_ID) {
    throw new Error("Missing env vars: VITE_API_BASE_URL / VITE_USER_LOGIN_ID");
  }

  const processKey = await safeCreateSession();

  const bodyStr = JSON.stringify({
    class_id: String(payload.class_id),
    age_band_id: String(payload.age_band_id),
    travel_package_id: String(payload.travel_package_id),
    travel_area_id: String(payload.travel_area_id),
    travel_area_plan_id: String(payload.travel_area_plan_id),
    period_id: String(payload.period_id),
  });

  //  debug: confirm body in console
  console.log("Premium Request Body:", bodyStr);

  const { unixTs, signature } = buildSignatureForBody(bodyStr);
  const basicToken = btoa(`${USER_LOGIN_ID}:${processKey}`);

  const res = await authFetch(`${API_BASE_URL}/v1/Travel/getpremium`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${basicToken}`,
      "verify-signature": `${unixTs}.${signature}`,
      "split-signature": `${unixTs}.${signature}`,
      Accept: "*/*",
    },
    body: bodyStr,
  });

  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as any;
}
