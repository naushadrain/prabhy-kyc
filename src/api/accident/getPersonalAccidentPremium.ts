// src/api/accident/getPersonalAccidentPremium.ts

import { buildSignatureForBody } from "../session/signature";
import { createSession } from "../session/sessionClient";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;
const USER_LOGIN_ID = import.meta.env.VITE_USER_LOGIN_ID as string;

export type PersonalAccidentPremiumRequest = {
    class_id: string;
    suminsured: string;
    total_suminsured: string;
    get_direct_discount: "y" | "n";
};

export type PersonalAccidentAmountInfo = {
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

export type PersonalAccidentPremiumResponse = {
    policy_session_id: string;
    amount_info: PersonalAccidentAmountInfo;
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

function getApiErrorMessage(data: any, fallback: string): string {
    return data?.error_list?.[0]?.error_message || data?.message || fallback;
}

function buildPublicHeaders(bodyStr: string, processKey: string) {
    const { unixTs, signature } = buildSignatureForBody(bodyStr);
    const basicToken = btoa(`${USER_LOGIN_ID}:${processKey}`);

    return {
        "Content-Type": "application/json",
        Accept: "*/*",
        Authorization: `Basic ${basicToken}`,
        "X-Basic-Authorization": `Basic ${basicToken}`,
        "verify-signature": `${unixTs}.${signature}`,
        "split-signature": `${unixTs}.${signature}`,
    };
}

export async function getPersonalAccidentPremium(
    payload: PersonalAccidentPremiumRequest
): Promise<PersonalAccidentPremiumResponse> {
    const fixedPayload: PersonalAccidentPremiumRequest = {
        class_id: String(payload.class_id || "18"),
        suminsured: String(payload.suminsured || "0"),
        total_suminsured: String(payload.total_suminsured || "0"),
        get_direct_discount: payload.get_direct_discount === "y" ? "y" : "n",
    };

    const bodyStr = JSON.stringify(fixedPayload);
    const processKey = await createSession();

    const response = await fetch(`${API_BASE_URL}/v1/Misc/get-pa-premium`, {
        method: "POST",
        headers: buildPublicHeaders(bodyStr, processKey),
        body: bodyStr,
    });

    const data: PersonalAccidentPremiumResponse = await response.json();

    if (!response.ok || data?.process_result === false) {
        throw new Error(
            getApiErrorMessage(data, "Failed to calculate personal accident premium")
        );
    }

    return data;
}