// src/api/home/getCatlog.ts

import { buildSignatureForBody } from "../session/signature";
import { createSession } from "../session/sessionClient";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;
const USER_LOGIN_ID = import.meta.env.VITE_USER_LOGIN_ID as string;

export type HomeCatalogueItem = {
    data: string;
    value: string;
    additional_value?: string;
};

export type HomeCatalogueResponse = {
    process_result: boolean;
    total_data_no?: number;
    catalogue_list: HomeCatalogueItem[];
    error_list?: {
        error_code?: string;
        error_message?: string;
    }[];
    message?: string;
};

async function requestHomeCatalogue(url: string): Promise<HomeCatalogueItem[]> {
    const bodyStr = "";

    const processKey = await createSession();

    const { unixTs, signature } = buildSignatureForBody(bodyStr);

    const basicToken = btoa(`${USER_LOGIN_ID}:${processKey}`);

    const response = await fetch(url, {
        method: "GET",
        headers: {
            Accept: "*/*",

            Authorization: `Basic ${basicToken}`,
            "X-Basic-Authorization": `Basic ${basicToken}`,

            "verify-signature": `${unixTs}.${signature}`,
            "split-signature": `${unixTs}.${signature}`,
        },
    });

    const data: HomeCatalogueResponse = await response.json();

    if (!response.ok || data?.process_result === false) {
        throw new Error(
            data?.error_list?.[0]?.error_message ||
                data?.message ||
                "Failed to load catalogue"
        );
    }

    return data?.catalogue_list || [];
}

// GET {{host}}/v1/catalogue/getcatalogue?catalogue_type=36
export async function getPropertyListCatalogue(): Promise<HomeCatalogueItem[]> {
    const url = `${API_BASE_URL}/v1/catalogue/getcatalogue?catalogue_type=36`;

    return requestHomeCatalogue(url);
}

// GET {{host}}/v1/catalogue/getcatalogue?catalogue_type=38
export async function getFireRiskTypeCatalogue(): Promise<HomeCatalogueItem[]> {
    const url = `${API_BASE_URL}/v1/catalogue/getcatalogue?catalogue_type=38`;

    return requestHomeCatalogue(url);
}

// GET {{host}}/v1/catalogue/getcatalogue?catalogue_type=35&id={id}
export async function getPropertyDescriptionCatalogue(
    id: string | number
): Promise<HomeCatalogueItem[]> {
    const url = `${API_BASE_URL}/v1/catalogue/getcatalogue?catalogue_type=35&id=10`;

    return requestHomeCatalogue(url);
}