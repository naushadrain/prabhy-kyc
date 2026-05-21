import { buildSignatureForBody } from "../session/signature";
import { createSession } from "../session/sessionClient";
import { GetPremiumResponse, PremiumAmountInfo } from "@/types/getpremium";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;
const USER_LOGIN_ID = import.meta.env.VITE_USER_LOGIN_ID as string;

export type GetPremiumRequestPV = {
    class_id: string;
    cover_type_id: string;
    is_government: string;
    engine_capcity_cc: string;
    driver_seat_capacity: string;
    passenger_seat_capacity: string;
    conductor_helper_seat_capacity?: string;
    compulsory_excess: string;
    voluntary_excess: string;
    vehicle_age_in_years: string;
    vehicle_suminsured_amount: string;
    calc_type: string;
    noclaim_year: string;
    is_tailor: string;
    get_direct_discount?: string;
    vehicle_reg?: string;
    include_towing_charge?: string;
    include_personal_use_discount?: string;
    tailor_amount?: string;
    passanger_carrying_capacity?:string;
};
export type GetPremiumRequestCV = {
    class_id: string;
    cover_type_id: string;
    is_government: string;
    good_carrying_capacity?: string;
    engine_capcity_cc: string;
    driver_seat_capacity: string;
    passenger_seat_capacity: string;
    conductor_helper_seat_capacity?: string;
    compulsory_excess: string;
    voluntary_excess: string;
    vehicle_age_in_years: string;
    vehicle_suminsured_amount: string;
    calc_type: string;
    noclaim_year: string;
    is_tailor: string;
    get_direct_discount?: string;
    vehicle_reg?: string;
    include_towing_charge?: string;
    include_personal_use_discount?: string;
};

export async function getMotorPremiumPV(payload: GetPremiumRequestPV) {
    if (!API_BASE_URL || !USER_LOGIN_ID) {
        throw new Error("Missing env vars: VITE_API_BASE_URL / VITE_USER_LOGIN_ID");
    }

    const processKey = await createSession(USER_LOGIN_ID);

    const bodyStr = JSON.stringify({
        class_id: payload.class_id,
        cover_type_id: payload.cover_type_id,
        is_government: payload.is_government,
        engine_capcity_cc: payload.engine_capcity_cc,
        driver_seat_capacity: payload.driver_seat_capacity,
        passenger_seat_capacity: payload.passenger_seat_capacity,
        conductor_helper_seat_capacity: payload.conductor_helper_seat_capacity,
        compulsory_excess: payload.compulsory_excess,
        voluntary_excess: payload.voluntary_excess,
        vehicle_age_in_years: payload.vehicle_age_in_years,
        vehicle_suminsured_amount: payload.vehicle_suminsured_amount,
        calc_type: payload.calc_type,
        noclaim_year: payload.noclaim_year,
        is_tailor: payload.is_tailor,
        get_direct_discount: payload.get_direct_discount,
        vehicle_reg: payload.vehicle_reg,
        include_towing_charge: payload.include_towing_charge,
        include_personal_use_discount: payload.include_personal_use_discount,
    });

    const { unixTs, signature } = buildSignatureForBody(bodyStr);
    const basicToken = btoa(`${USER_LOGIN_ID}:${processKey}`);

    const res = await fetch(`${API_BASE_URL}/v1/Motor/getpremium`, {
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
    return (await res.json()) as GetPremiumResponse;
}

export async function getMotorPremiumCV(payload: GetPremiumRequestCV) {
    if (!API_BASE_URL || !USER_LOGIN_ID) {
        throw new Error("Missing env vars: VITE_API_BASE_URL / VITE_USER_LOGIN_ID");
    }

    const processKey = await createSession(USER_LOGIN_ID);

    const bodyStr = JSON.stringify({
        class_id: payload.class_id,
        cover_type_id: payload.cover_type_id,
        is_government: payload.is_government,
        good_carrying_capacity: payload.good_carrying_capacity ?? 0,
        engine_capcity_cc: payload.engine_capcity_cc,
        driver_seat_capacity: payload.driver_seat_capacity,
        passenger_seat_capacity: payload.passenger_seat_capacity,
        conductor_helper_seat_capacity: payload.conductor_helper_seat_capacity,
        compulsory_excess: payload.compulsory_excess,
        voluntary_excess: payload.voluntary_excess,
        vehicle_age_in_years: payload.vehicle_age_in_years,
        vehicle_suminsured_amount: payload.vehicle_suminsured_amount,
        calc_type: payload.calc_type,
        noclaim_year: payload.noclaim_year,
        is_tailor: payload.is_tailor,
        get_direct_discount: payload.get_direct_discount,
        vehicle_reg: payload.vehicle_reg,
        include_towing_charge: payload.include_towing_charge,
        include_personal_use_discount: payload.include_personal_use_discount,
    });

    const { unixTs, signature } = buildSignatureForBody(bodyStr);
    const basicToken = btoa(`${USER_LOGIN_ID}:${processKey}`);

    const res = await fetch(`${API_BASE_URL}/v1/Motor/getpremium`, {
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
