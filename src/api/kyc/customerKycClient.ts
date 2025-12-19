// src/api/customerKycClient.ts
import { buildSignatureForBody } from "../session/signature";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export type CustomerKycPayload = {
    honour: string;
    first_name_nep: string;
    middle_name_nep: string;
    last_name_nep: string;

    id_type: string;
    id_no: string;
    issued_district: string;
    issue_date_ad: string;
    issue_date_bs: string;

    province_name: string;
    district_name: string;
    local_level_name: string;
    ward_no: string;
    residence_country: string;

    mobile: string;
    email: string;

    father_name: string;
    father_name_nep: string;
    father_citizenship_no: string;
    father_citizenship_issued_district: string;

    gender_code: string;
    dob_ad: string;
    dob_bs: string;
    occupation: string;

    politically_involved: boolean;

    doc_type: "citizenship" | "passport" | "nid";
    image_profile?: File | null;
    ctz_front?: File | null;
    ctz_back?: File | null;
    passport_front?: File | null;
    passport_back?: File | null;
    nid_front?: File | null;
    nid_back?: File | null;
};

function appendIfFile(fd: FormData, key: string, file?: File | null) {
    if (file instanceof File) fd.append(key, file);
}

function formDataToDebug(fd: FormData) {
    const out: Record<string, any> = {};
    for (const [k, v] of fd.entries()) {
        out[k] = v instanceof File ? `File(name=${v.name}, size=${v.size})` : v;
    }
    return out;
}

export async function submitCustomerKyc(
    payload: CustomerKycPayload,
    opts?: { debug?: boolean }
) {
    if (!API_BASE_URL) throw new Error("VITE_API_BASE_URL is not set");

    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) throw new Error("Not logged in. Please login first.");

    const fd = new FormData();

    fd.append("Customer_Name.Honour", payload.honour);
    fd.append("Customer_Name.First_Name_nep", payload.first_name_nep);
    fd.append("Customer_Name.Middle_Name_nep", payload.middle_name_nep);
    fd.append("Customer_Name.Last_Name_nep", payload.last_name_nep);

    fd.append("Identification.Id_Type", payload.id_type);
    fd.append("Identification.Id_No", payload.id_no);
    fd.append("Identification.Issued_District", payload.issued_district);
    fd.append("Identification.Issue_Date_AD", payload.issue_date_ad);
    fd.append("Identification.Issue_Date_BS", payload.issue_date_bs);

    fd.append("Address.Province", payload.province_name);
    fd.append("Address.District", payload.district_name);
    fd.append("Address.Local_level", payload.local_level_name);
    fd.append("Address.Ward_No", payload.ward_no);
    fd.append("Address.Residence_Country", payload.residence_country || "NEPAL");

    fd.append("Contact.Mobile", payload.mobile);
    fd.append("Contact.Email", payload.email);

    fd.append("Relation.Father_Name", payload.father_name);
    fd.append("Relation.Father_Name_nep", payload.father_name_nep);
    fd.append("Relation.Father_Citizenship_No", payload.father_citizenship_no);
    fd.append("Relation.Father_Citizenship_Issued_District", payload.father_citizenship_issued_district);

    fd.append("CustomerInformation.Gender", payload.gender_code);
    fd.append("CustomerInformation.Date_Of_Birth_AD", payload.dob_ad);
    fd.append("CustomerInformation.Date_Of_Birth_BS", payload.dob_bs);
    fd.append("CustomerInformation.Occupation", payload.occupation);

    fd.append("Politically_Involved", String(payload.politically_involved));

    fd.append("customer_image.doc_type", payload.doc_type);
    appendIfFile(fd, "customer_image.image_profile", payload.image_profile);
    appendIfFile(fd, "customer_image.ctz_image_front", payload.ctz_front);
    appendIfFile(fd, "customer_image.ctz_image_back", payload.ctz_back);
    appendIfFile(fd, "customer_image.passport_image_front", payload.passport_front);
    appendIfFile(fd, "customer_image.passport_image_back", payload.passport_back);
    appendIfFile(fd, "customer_image.nid_image_front", payload.nid_front);
    appendIfFile(fd, "customer_image.nid_image_back", payload.nid_back);

    const { unixTs, signature } = buildSignatureForBody("");

    const res = await fetch(`${API_BASE_URL}/v1/CustomerKyc/customer-kyc`, {
        method: "POST",
        headers: {
            "verify-signature": `${unixTs}.${signature}`,
            Authorization: `Bearer ${accessToken}`,
        },
        body: fd,
    });

    // ✅ read response safely
    const rawText = await res.text();
    let json: any = {};
    try {
        json = rawText ? JSON.parse(rawText) : {};
    } catch {
        json = {};
    }

    const debug = {
        url: `${API_BASE_URL}/v1/CustomerKyc/customer-kyc`,
        status: res.status,
        ok: res.ok,
        request_form_data: formDataToDebug(fd),
        response_json: json,
        response_text: rawText,
    };

    if (!res.ok) {
        const msg = json?.error_list?.[0]?.error_message || json?.message || `KYC error ${res.status}`;
        const err = new Error(msg) as any;
        err.debug = debug;
        throw err;
    }

    // return both data + debug when you want
    if (opts?.debug) return { data: json, debug };
    return json;
}
