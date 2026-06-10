import { buildSignatureForBody } from "../session/signature";
import { authFetch } from "../auth/authFetch";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;
const USER_LOGIN_ID = import.meta.env.VITE_USER_LOGIN_ID as string;

type ApiValue = string | number | null;

export type CreateMotorPolicyPayload = {
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
    cover_type_id: string;
    is_government: string;

    vehicle_suminsured_amount: ApiValue;
    item_suminsured_amount: ApiValue;
    suminsured_amount: ApiValue;

    voluntary_excess: ApiValue;
    compulsory_excess: ApiValue;

    item_description: string;
    manufacturing_company: string;
    manufacture_year: string;
    registration_date: string;
    vehicle_age_in_years: ApiValue;

    driver_seat_capacity: ApiValue;
    conductor_helper_seat_capacity: ApiValue;
    passenger_seat_capacity: ApiValue;
    passanger_carrying_capacity: ApiValue;

    good_carrying_capacity: ApiValue;
    good_carrying_capacity_ton?: ApiValue;

    engine_capcity_cc: string;
    vehicle_type: string;
    chassis_number: string;
    engine_number: string;
    model_number: string;

    vehicle_number: string;
    registration_number: string;
    vehicle_num_zone_state: string;
    vehicle_num_lot: string;
    vehicle_num_kind: string;
    vehicle_reg: string;

    billbook_number: string;
    billbook_exp_date: string;
    billbook_exp_date_nep: string;
    billbook_front_id: string;
    billbook_back_id: string;

    noclaim_year: string;
    no_claim_discount_percent: string;

    has_tailor: string;
    tailor_amount: ApiValue;

    nep_vehicle_number: string;
    is_tmis_vehicle_register: string;
    office_code: string;
    motor_model: string;
    motor_code: string;
    is_diplomatic: string;
    has_schedule: string;
  };
};

export type CreateMotorPolicyResponse = {
  process_result?: boolean;
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

export async function createMotorPolicy(
  payload: CreateMotorPolicyPayload,
): Promise<CreateMotorPolicyResponse> {
  if (!API_BASE_URL) throw new Error("Missing env var: VITE_API_BASE_URL");
  if (!USER_LOGIN_ID) throw new Error("Missing env var: VITE_USER_LOGIN_ID");

  if (!payload.policy_session_id?.trim()) {
    throw new Error(
      "policy_session_id is missing. Please recalculate the premium first.",
    );
  }

  if (
    payload.class_info.conductor_helper_seat_capacity === undefined ||
    payload.class_info.conductor_helper_seat_capacity === null ||
    payload.class_info.conductor_helper_seat_capacity === ""
  ) {
    throw new Error(
      "Conductor/Helper seat number is required in class_info.conductor_helper_seat_capacity",
    );
  }

  const sessionId = payload.policy_session_id;
  const basicToken = btoa(`${USER_LOGIN_ID}:${sessionId}`);

  const body = {
    client_info: payload.client_info,
    policy_info: payload.policy_info,
    policy_session_id: sessionId,
    class_info: payload.class_info,
  };

  const bodyStr = JSON.stringify(body);

  console.log("[createMotorPolicy] body:", body);

  const { unixTs, signature } = buildSignatureForBody(bodyStr);

  const res = await authFetch(`${API_BASE_URL}/v1/Motor/create-motor-policy`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Authorization": `Basic ${basicToken}`,
      "verify-signature": `${unixTs}.${signature}`,
      "split-signature": `${unixTs}.${signature}`,
      Accept: "*/*",
    },
    body: bodyStr,
  });

  const rawText = await res.text();

  let responseData: CreateMotorPolicyResponse | null = null;

  try {
    responseData = rawText ? JSON.parse(rawText) : null;
  } catch {
    responseData = null;
  }

  if (responseData?.process_result === false) {
    const errors = responseData?.error_list || [];

    throw {
      status: res.status,
      data: responseData,
      message:
        errors
          .map((error) => error?.error_message)
          .filter(Boolean)
          .join(", ") || "Motor policy creation failed",
    };
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

  return responseData || {};
}