// src/api/fire/fireHousePolicy.ts

import { buildSignatureForBody } from "../session/signature";
import { createSession } from "../session/sessionClient";
import { authFetch } from "../auth/authFetch";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;
const USER_LOGIN_ID = import.meta.env.VITE_USER_LOGIN_ID as string;

export type FireHousePremiumLocationInfo = {
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
    total_suminsured: string;
    get_direct_discount: "y" | "n";
    location_info: FireHousePremiumLocationInfo[];
};

export type FireHouseAmountInfo = {
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

export type FireHousePremiumResponse = {
    policy_session_id: string;
    amount_info: FireHouseAmountInfo;
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

export type FireHouseCreateLocationInfo = {
    province: string;
    district: string;
    local_level: string;
    tole: string;
    ward_no: string;
    house_no: string;

    construction_type: string;
    place_of_nature: string;
    property_nature: string;
    building_description: string;
    building_floor: string;
    house_owner: string;

    near_premises_utilization: string;
    near_premises_suminsured: string;
    near_premises_remarks: string;

    building_utilization: string;
    building_suminsured: string;
    building_remarks: string;

    plant_machinery_utilization: string;
    plant_machinery_suminsured: string;
    plant_machinery_remarks: string;

    raw_materials_utilization: string;
    raw_materials_suminsured: string;
    raw_materials_remarks: string;

    work_in_progress_utilization: string;
    work_in_progress_suminsured: string;
    work_in_progress_remarks: string;

    finished_goods_utilization: string;
    finished_goods_suminsured: string;
    finished_goods_remarks: string;

    semi_finished_goods_utilization: string;
    semi_finished_goods_suminsured: string;
    semi_finished_goods_remarks: string;

    furniture_utilization: string;
    furniture_suminsured: string;
    furniture_remarks: string;

    cash_gold_utilization: string;
    cash_gold_suminsured: string;
    cash_gold_remarks: string;

    maps_frame_utilization: string;
    maps_frame_suminsured: string;
    maps_frame_remarks: string;

    others_utilization: string;
    others_suminsured: string;
    others_remarks: string;

    location_total_suminsured: string;
};

export type CreateFireHousePolicyPayload = {
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
        total_suminsured: string;
        location_count: string;
        include_rsd_charge: boolean;
        location_info: FireHouseCreateLocationInfo[];
    };
};

export type CreateFireHousePolicyResponse = {
    process_result: boolean;
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

function getApiErrorMessage(data: any, fallback: string): string {
    return data?.error_list?.[0]?.error_message || data?.message || fallback;
}

function buildSignedHeaders(bodyStr: string, processKey: string) {
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

export async function getFireHousePremium(
    payload: FireHousePremiumRequest,
): Promise<FireHousePremiumResponse> {
    const fixedPayload: FireHousePremiumRequest = {
        class_id: String(payload.class_id || "63"),
        include_rsd_charge: Boolean(payload.include_rsd_charge),
        total_suminsured: String(payload.total_suminsured || "0"),
        get_direct_discount: payload.get_direct_discount === "y" ? "y" : "n",
        location_info: Array.isArray(payload.location_info)
            ? payload.location_info.map((item) => ({
                  class_id: String(item.class_id || "63"),
                  location_total_suminsured: String(
                      item.location_total_suminsured || "0",
                  ),
                  construction_type: String(item.construction_type || ""),
                  near_premises_suminsured: String(
                      item.near_premises_suminsured || "",
                  ),
                  building_suminsured: String(item.building_suminsured || ""),
                  plant_machinery_suminsured: String(
                      item.plant_machinery_suminsured || "",
                  ),
                  raw_materials_suminsured: String(
                      item.raw_materials_suminsured || "",
                  ),
                  work_in_progress_suminsured: String(
                      item.work_in_progress_suminsured || "",
                  ),
                  finished_goods_suminsured: String(
                      item.finished_goods_suminsured || "",
                  ),
                  semi_finished_goods_suminsured: String(
                      item.semi_finished_goods_suminsured || "",
                  ),
                  furniture_suminsured: String(item.furniture_suminsured || ""),
                  cash_gold_suminsured: String(item.cash_gold_suminsured || ""),
                  maps_frame_suminsured: String(item.maps_frame_suminsured || ""),
                  others_suminsured: String(item.others_suminsured || ""),
              }))
            : [],
    };

    const bodyStr = JSON.stringify(fixedPayload);
    const processKey = await createSession();

    const response = await fetch(`${API_BASE_URL}/v1/Fire/get-house-premium`, {
        method: "POST",
        headers: buildSignedHeaders(bodyStr, processKey),
        body: bodyStr,
    });

    let data: FireHousePremiumResponse;

    try {
        data = await response.json();
    } catch {
        throw new Error("Invalid response from fire house premium API");
    }

    if (!response.ok || data?.process_result === false) {
        throw new Error(
            getApiErrorMessage(data, "Failed to calculate fire house premium"),
        );
    }

    return data;
}

export async function createFireHousePolicy(
    payload: CreateFireHousePolicyPayload,
): Promise<CreateFireHousePolicyResponse> {
    const fixedPayload: CreateFireHousePolicyPayload = {
        client_info: {
            Bank_Code: String(payload.client_info?.Bank_Code || "1"),
        },

        policy_info: {
            department_id: String(payload.policy_info?.department_id || "2"),
            class_id: String(payload.policy_info?.class_id || "63"),
            payment_process: payload.policy_info?.payment_process || "Full Payment",
            effective_date: payload.policy_info?.effective_date || "",
            expiry_date: payload.policy_info?.expiry_date || "",
        },

        policy_session_id: String(payload.policy_session_id || ""),

        class_info: {
            class_id: String(payload.class_info?.class_id || "63"),
            total_suminsured: String(payload.class_info?.total_suminsured || "0"),
            location_count: String(
                payload.class_info?.location_count ||
                    payload.class_info?.location_info?.length ||
                    "1",
            ),
            include_rsd_charge: Boolean(payload.class_info?.include_rsd_charge),
            location_info: Array.isArray(payload.class_info?.location_info)
                ? payload.class_info.location_info.map((item) => ({
                      province: String(item.province || ""),
                      district: String(item.district || ""),
                      local_level: String(item.local_level || ""),
                      tole: String(item.tole || ""),
                      ward_no: String(item.ward_no || ""),
                      house_no: String(item.house_no || ""),

                      construction_type: String(item.construction_type || ""),
                      place_of_nature: String(item.place_of_nature || ""),
                      property_nature: String(item.property_nature || ""),
                      building_description: String(
                          item.building_description || "",
                      ),
                      building_floor: String(item.building_floor || ""),
                      house_owner: String(item.house_owner || ""),

                      near_premises_utilization: String(
                          item.near_premises_utilization || "",
                      ),
                      near_premises_suminsured: String(
                          item.near_premises_suminsured || "",
                      ),
                      near_premises_remarks: String(
                          item.near_premises_remarks || "",
                      ),

                      building_utilization: String(
                          item.building_utilization || "",
                      ),
                      building_suminsured: String(item.building_suminsured || ""),
                      building_remarks: String(item.building_remarks || ""),

                      plant_machinery_utilization: String(
                          item.plant_machinery_utilization || "",
                      ),
                      plant_machinery_suminsured: String(
                          item.plant_machinery_suminsured || "",
                      ),
                      plant_machinery_remarks: String(
                          item.plant_machinery_remarks || "",
                      ),

                      raw_materials_utilization: String(
                          item.raw_materials_utilization || "",
                      ),
                      raw_materials_suminsured: String(
                          item.raw_materials_suminsured || "",
                      ),
                      raw_materials_remarks: String(
                          item.raw_materials_remarks || "",
                      ),

                      work_in_progress_utilization: String(
                          item.work_in_progress_utilization || "",
                      ),
                      work_in_progress_suminsured: String(
                          item.work_in_progress_suminsured || "",
                      ),
                      work_in_progress_remarks: String(
                          item.work_in_progress_remarks || "",
                      ),

                      finished_goods_utilization: String(
                          item.finished_goods_utilization || "",
                      ),
                      finished_goods_suminsured: String(
                          item.finished_goods_suminsured || "",
                      ),
                      finished_goods_remarks: String(
                          item.finished_goods_remarks || "",
                      ),

                      semi_finished_goods_utilization: String(
                          item.semi_finished_goods_utilization || "",
                      ),
                      semi_finished_goods_suminsured: String(
                          item.semi_finished_goods_suminsured || "",
                      ),
                      semi_finished_goods_remarks: String(
                          item.semi_finished_goods_remarks || "",
                      ),

                      furniture_utilization: String(
                          item.furniture_utilization || "",
                      ),
                      furniture_suminsured: String(item.furniture_suminsured || ""),
                      furniture_remarks: String(item.furniture_remarks || ""),

                      cash_gold_utilization: String(
                          item.cash_gold_utilization || "",
                      ),
                      cash_gold_suminsured: String(item.cash_gold_suminsured || ""),
                      cash_gold_remarks: String(item.cash_gold_remarks || ""),

                      maps_frame_utilization: String(
                          item.maps_frame_utilization || "",
                      ),
                      maps_frame_suminsured: String(
                          item.maps_frame_suminsured || "",
                      ),
                      maps_frame_remarks: String(item.maps_frame_remarks || ""),

                      others_utilization: String(item.others_utilization || ""),
                      others_suminsured: String(item.others_suminsured || ""),
                      others_remarks: String(item.others_remarks || ""),

                      location_total_suminsured: String(
                          item.location_total_suminsured || "0",
                      ),
                  }))
                : [],
        },
    };

    const bodyStr = JSON.stringify(fixedPayload);
    const processKey = await createSession();

    const response = await authFetch(
        `${API_BASE_URL}/v1/Fire/create-fire-house-policy`,
        {
            method: "POST",
            headers: buildSignedHeaders(bodyStr, processKey),
            body: bodyStr,
        },
    );

    let data: CreateFireHousePolicyResponse;

    try {
        data = await response.json();
    } catch {
        throw new Error("Invalid response from create fire house policy API");
    }

    if (!response.ok || data?.process_result === false) {
        throw new Error(
            getApiErrorMessage(data, "Failed to create fire house policy"),
        );
    }

    return data;
}