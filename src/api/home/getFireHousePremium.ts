// src/api/home/getFireHousePremium.ts

import { buildSignatureForBody } from "../session/signature";
import { createSession } from "../session/sessionClient";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;
const USER_LOGIN_ID = import.meta.env.VITE_USER_LOGIN_ID as string;
export type FirePropertyLocationInfo = {
    class_id: string;
    fire_risk_type: string;
    fire_property_description: string;
    location_total_suminsured: string;
    construction_type: string;

    near_premises_suminsured: string;
    building_suminsured: string;
    plant_machinery_suminsured: string;
    raw_materials_suminsured: string;
    work_in_progress_suminsured: string;
    finished_goods_suminsured: string;
    semi_finished_goods_suminsured: string;
    furniture_suminsured: string;
    cash_gold_suminsured: string;
    maps_frame_suminsured: string;
    others_suminsured: string;
};

export type FirePropertyPremiumRequest = {
    class_id: string;
    include_rsd_charge: boolean;
    location_count: string;
    total_suminsured: string;
    get_direct_discount: string;
    location_info: FirePropertyLocationInfo[];
};
export type FireAmountInfo = {
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

export type FirePremiumResponse = {
    policy_session_id: string;
    amount_info: FireAmountInfo;
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

/* =========================
   FIRE HOUSE TYPES
========================= */

export type FireHouseLocationInfo = {
    class_id: string;
    location_total_suminsured: string;
    construction_type: string;

    near_premises_suminsured: string;
    building_suminsured: string;
    plant_machinery_suminsured: string;
    raw_materials_suminsured: string;
    work_in_progress_suminsured: string;
    finished_goods_suminsured: string;
    semi_finished_goods_suminsured: string;
    furniture_suminsured: string;
    cash_gold_suminsured: string;
    maps_frame_suminsured: string;
    others_suminsured: string;
};

export type FireHousePremiumRequest = {
    class_id: string;
    include_rsd_charge: boolean;
    location_count: string;
    total_suminsured: string;

    // Direct discount for fire house
    get_direct_discount?: string;

    location_info: FireHouseLocationInfo[];
};

export type FireHousePremiumResponse = FirePremiumResponse;

/* =========================
   FIRE PROPERTY TYPES
========================= */



export type FirePropertyPremiumResponse = FirePremiumResponse;

/* =========================
   COMMON POST REQUEST
========================= */

async function postFirePremium<TResponse>(
    endpoint: string,
    payload: unknown,
    errorMessage: string
): Promise<TResponse> {
    const bodyStr = JSON.stringify(payload);

    const processKey = await createSession();

    const { unixTs, signature } = buildSignatureForBody(bodyStr);

    const basicToken = btoa(`${USER_LOGIN_ID}:${processKey}`);

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "*/*",

            Authorization: `Basic ${basicToken}`,
            "X-Basic-Authorization": `Basic ${basicToken}`,

            "verify-signature": `${unixTs}.${signature}`,
            "split-signature": `${unixTs}.${signature}`,
        },
        body: bodyStr,
    });

    const data = await response.json();

    if (!response.ok || data?.process_result === false) {
        throw new Error(
            data?.error_list?.[0]?.error_message ||
                data?.message ||
                errorMessage
        );
    }

    return data as TResponse;
}

/* =========================
   FIRE HOUSE API
   POST /v1/Fire/get-house-premium
========================= */

export async function getFireHousePremium(
    payload: FireHousePremiumRequest
): Promise<FireHousePremiumResponse> {
    return postFirePremium<FireHousePremiumResponse>(
        "/v1/Fire/get-house-premium",
        payload,
        "Failed to calculate fire house premium"
    );
}

/* =========================
   FIRE PROPERTY API
   POST /v1/Fire/get-property-premium
========================= */

export async function getFirePropertyPremium(
    payload: FirePropertyPremiumRequest
): Promise<FirePropertyPremiumResponse> {
    return postFirePremium<FirePropertyPremiumResponse>(
        "/v1/Fire/get-property-premium",
        payload,
        "Failed to calculate Property Insurance premium"
    );
}