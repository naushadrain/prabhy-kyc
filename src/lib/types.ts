export type CustomerKycFormEntity = {
    // ===== Customer Name =====
    honour: string;
    first_name_eng: string;
    middle_name_eng?: string;
    last_name_eng: string;

    first_name_nep: string;
    middle_name_nep?: string;
    last_name_nep: string;

    // ===== Identification =====
    id_type: string;
    id_no: string;
    issued_district: string;
    issue_date_ad?: string;
    issue_date_bs?: string;

    // ===== Address =====
    province: string;
    district: string;
    local_level: string;
    ward_no: string;
    residence_country?: string;
    tole?: string;
    tole_nep?: string;

    // ===== Contact =====
    mobile: string;
    email?: string;

    // ===== Relation =====
    father_name: string;
    father_name_nep: string;
    father_citizenship_no?: string;
    father_citizenship_issued_district?: string;

    // ===== Customer Information =====
    gender: string;
    dob_ad: string;
    dob_bs: string;
    occupation?: string;

    politically_involved?: boolean;

    // ===== Documents =====
    doc_type: "citizenship" | "passport" | "nid";

    // Files
    image_profile?: File | null;
    ctz_front?: File | null;
    ctz_back?: File | null;
    passport_front?: File | null;
    passport_back?: File | null;
    nid_front?: File | null;
    nid_back?: File | null;
};