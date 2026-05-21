import { BannerState} from "@/types/types";
import { KycFormValues } from "@/zod/kycSchema";
/* =========================
   Upload config
========================= */

const ALLOWED_MIME = ["image/png", "image/jpeg"];
const MAX_FILE_MB = 1;

/** REQUIRED */
const PHOTO_KEY = "Photo *";
const CTZ_FRONT_KEY = "Citizenship / Front *";
const CTZ_BACK_KEY = "Citizenship / Back *";

/** optional (will show only when checkbox + dropdown selected) */
const PASS_FRONT_KEY = "Passport / Front (Optional)";
const PASS_BACK_KEY = "Passport / Back (Optional)";
const NID_FRONT_KEY = "NID / Front (Optional)";
const NID_BACK_KEY = "NID / Back (Optional)";
const DL_FRONT_KEY = "Driving License / Front (Optional)";
const DL_BACK_KEY = "Driving License / Back (Optional)";

const REQUIRED_ATTACHMENTS = [PHOTO_KEY, CTZ_FRONT_KEY, CTZ_BACK_KEY] as const;

export function normalizeStatusText(s: any) {
  const v = String(s ?? "").trim();
  return v || "Unknown";
}

export function shouldShowStatusAlert(status: string) {
  const low = status.toLowerCase();
  if (!status || low === "unknown") return false;
  if (low === "kyc not completed") return false;
  return ["pending", "rejected", "approved", "verified"].includes(low);
}

export function buildStatusBanner(status: string): BannerState {
  if (!shouldShowStatusAlert(status)) return null;

  const low = status.toLowerCase();
  if (low === "pending") {
    return {
      type: "info",
      title: "KYC is under review",
      message: "We received your KYC. Our team is reviewing it. Editing is locked until a decision is made.",
    };
  }
  if (low === "rejected") {
    return {
      type: "error",
      title: "KYC needs correction",
      message: "Your KYC was rejected. Please correct the highlighted fields/documents and submit again.",
    };
  }
  if (low === "approved" || low === "verified") {
    return {
      type: "success",
      title: "KYC approved",
      // message: "Your KYC has been approved. You cannot edit or submit again.",
      message: "",
    };
  }
  return null;
}

export function isLockedByStatus(status: string) {
  const low = status.toLowerCase();
  return low === "pending" || low === "approved" || low === "verified";
}

/* =========================
   Prefill mappers (GET details)
========================= */
export function mapApiToFormValues(api: any, fallback: KycFormValues): KycFormValues {
  const root = api?.data ?? api;
  const d = root?.kyc_detail ?? root?.kycDetail ?? root;

  const name = d?.customer_Name ?? {};
  const id = d?.identification ?? {};
  const info = d?.customerInformation ?? {};
  const addr = d?.address ?? {};
  const contact = d?.contact ?? {};
  const rel = d?.relation ?? {};

  return {
    ...fallback,

    honour: name?.honour ?? fallback.honour,
    gender: info?.gender ?? fallback.gender,

    first_name: name?.first_Name ?? fallback.first_name,
    middle_name: name?.middle_Name ?? fallback.middle_name,
    last_name: name?.last_Name ?? fallback.last_name,

    first_name_nep: name?.first_Name_nep ?? fallback.first_name_nep,
    middle_name_nep: name?.middle_Name_nep ?? fallback.middle_name_nep,
    last_name_nep: name?.last_Name_nep ?? fallback.last_name_nep,

    id_type: id?.id_Type ?? fallback.id_type,
    id_no: id?.id_No ?? fallback.id_no,
    issued_district: id?.issued_District ?? fallback.issued_district,

    issue_date_ad: id?.issue_Date_AD ?? fallback.issue_date_ad,
    issue_date_bs: id?.issue_Date_BS ?? fallback.issue_date_bs,

    dob_ad: info?.date_Of_Birth_AD ?? fallback.dob_ad,
    dob_bs: info?.date_Of_Birth_BS ?? fallback.dob_bs,

    mobile: contact?.mobile ?? fallback.mobile,
    email: contact?.email ?? fallback.email,

    province: addr?.province ?? fallback.province,
    district: addr?.district ?? fallback.district,
    local_level: addr?.local_level ?? fallback.local_level,
    ward_no: addr?.ward_No ?? fallback.ward_no,

    tole: addr?.tole ?? fallback.tole,
    tole_nep: addr?.tole_nep ?? fallback.tole_nep,

    residence_country: addr?.residence_Country ?? fallback.residence_country,

    temp_address: addr?.temporary_Address ?? fallback.temp_address,
    temp_address_nep: addr?.temporary_Address_nep ?? fallback.temp_address_nep,

    father_name: rel?.father_Name ?? fallback.father_name,
    father_name_nep: rel?.father_Name_nep ?? fallback.father_name_nep,

    father_citizenship_no: rel?.father_citizenship_no ?? fallback.father_citizenship_no,
    father_citizenship_issued_district:
      rel?.father_citizenship_issued_district ?? fallback.father_citizenship_issued_district,

    occupation: info?.occupation ?? fallback.occupation,
    industry: info?.sub_Occupation ?? fallback.industry,

    politically_involved: Boolean(d?.politically_involved ?? fallback.politically_involved),
    party_inspection_category: d?.party_inspection_category ?? fallback.party_inspection_category,
    risk_factors: d?.risk_factors ?? fallback.risk_factors,

    doc_type: d?.doc_type ?? fallback.doc_type,

    // optional docs UI controls
    add_optional_docs: fallback.add_optional_docs,
    optional_doc_type: fallback.optional_doc_type,
  };
}

export function mapApiToExistingImages(api: any) {
  const root = api?.data ?? api;
  const img = root?.kyc_detail?.customer_image ?? root?.customer_image ?? {};

  const existing: Record<string, string | undefined> = {};

  existing[PHOTO_KEY] = img?.image_name_profile || img?.image_profile || img?.image_name_profile;

  existing[CTZ_FRONT_KEY] = img?.ctz_name_front || img?.ctz_front || img?.ctz_image_front;
  existing[CTZ_BACK_KEY] = img?.ctz_name_back || img?.ctz_back || img?.ctz_image_back;

  existing[PASS_FRONT_KEY] = img?.passport_name_front || img?.passport_front || img?.passport_image_front;
  existing[PASS_BACK_KEY] = img?.passport_name_back || img?.passport_back || img?.passport_image_back;

  existing[NID_FRONT_KEY] = img?.nid_name_front || img?.nid_front || img?.nid_image_front;
  existing[NID_BACK_KEY] = img?.nid_name_back || img?.nid_back || img?.nid_image_back;

  existing[DL_FRONT_KEY] = img?.dl_name_front || img?.dl_front || img?.driving_license_front;
  existing[DL_BACK_KEY] = img?.dl_name_back || img?.dl_back || img?.driving_license_back;

  return existing;
}