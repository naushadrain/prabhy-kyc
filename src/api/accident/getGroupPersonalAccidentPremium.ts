// src/api/accident/getGroupPersonalAccidentPremium.ts

import { buildSignatureForBody } from "../session/signature";
import { createSession } from "../session/sessionClient";
import { authFetch } from "../auth/authFetch";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;
const USER_LOGIN_ID = import.meta.env.VITE_USER_LOGIN_ID as string;

export type GroupPremiumPersonInfo = {
    suminsured: string;
};

export type GroupPersonalAccidentPremiumRequest = {
    class_id: string;
    total_suminsured: string;
    person_info: GroupPremiumPersonInfo[];
    get_direct_discount: "y" | "n";
    total_person: string;
};

export type GroupPersonalAccidentAmountInfo = {
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

export type GroupPersonalAccidentPremiumResponse = {
    policy_session_id: string;
    amount_info: GroupPersonalAccidentAmountInfo;
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

function buildAuthHeaders(bodyStr: string, processKey: string) {
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

export async function getGroupPersonalAccidentPremium(
    payload: GroupPersonalAccidentPremiumRequest
): Promise<GroupPersonalAccidentPremiumResponse> {
    const bodyStr = JSON.stringify(payload);
    const processKey = await createSession();

    const response = await authFetch(`${API_BASE_URL}/v1/Misc/get-gpa-premium`, {
        method: "POST",
        headers: buildAuthHeaders(bodyStr, processKey),
        body: bodyStr,
    });

    const data: GroupPersonalAccidentPremiumResponse = await response.json();

    if (!response.ok || data?.process_result === false) {
        throw new Error(
            getApiErrorMessage(
                data,
                "Failed to calculate group personal accident premium"
            )
        );
    }

    return data;
}