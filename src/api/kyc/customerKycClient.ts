// src/api/kyc/customerKycClient.ts
import { authFetch } from "../auth/authFetch";
import { buildSignatureForBody } from "../session/signature";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

export type CustomerKycFormEntity = {
  honour: string;

  first_name_eng: string;
  middle_name_eng?: string;
  last_name_eng: string;

  first_name_nep: string;
  middle_name_nep?: string;
  last_name_nep: string;

  id_type: string;
  id_no: string;
  issued_district: string;
  issue_date_ad?: string;
  issue_date_bs?: string;

  province: string;
  district: string;
  local_level: string;
  ward_no: string;
  residence_country?: string;

  tole?: string;
  tole_nep?: string;

  mobile: string;
  email?: string;

  father_name: string;
  father_name_nep: string;
  father_citizenship_no?: string;
  father_citizenship_issued_district?: string;

  gender: string;
  dob_ad: string;
  dob_bs: string;
  occupation?: string;

  politically_involved?: boolean;
  party_inspection_category?: string;
  risk_factors?: string;

  doc_type: "citizenship" | "passport" | "nid";

  // Files (optional)
  image_profile?: File | null;
  ctz_front?: File | null;
  ctz_back?: File | null;
  passport_front?: File | null;
  passport_back?: File | null;
  nid_front?: File | null;
  nid_back?: File | null;
};

function appendIfPresent(fd: FormData, key: string, value: unknown) {
  if (value === undefined || value === null) return;
  const s = String(value);
  // if you want to send empty strings too, remove this check:
  if (s === "") return;
  fd.append(key, s);
}

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
  form: CustomerKycFormEntity,
  opts?: { debug?: boolean }
) {
  if (!API_BASE_URL) throw new Error("VITE_API_BASE_URL is not set");

  // authFetch handles access_token + auto-refresh on 401

  //  IMPORTANT: Postman style for form-data uses empty body in signature
  const { unixTs, signature } = buildSignatureForBody("");
  const verifySignature = `${unixTs}.${signature}`;

  const fd = new FormData();

  // =========================
  // FORM entity -> API dotted keys (MATCH POSTMAN)
  // =========================

  // Customer Name
  appendIfPresent(fd, "Customer_Name.Honour", form.honour);
  appendIfPresent(fd, "Customer_Name.First_Name", form.first_name_eng);
  appendIfPresent(fd, "Customer_Name.Middle_Name", form.middle_name_eng ?? "");
  appendIfPresent(fd, "Customer_Name.Last_Name", form.last_name_eng);

  appendIfPresent(fd, "Customer_Name.First_Name_nep", form.first_name_nep);
  appendIfPresent(fd, "Customer_Name.Middle_Name_nep", form.middle_name_nep ?? "");
  appendIfPresent(fd, "Customer_Name.Last_Name_nep", form.last_name_nep);

  // Identification
  appendIfPresent(fd, "Identification.Id_Type", form.id_type);
  appendIfPresent(fd, "Identification.Id_No", form.id_no);
  appendIfPresent(fd, "Identification.Issued_District", form.issued_district);
  appendIfPresent(fd, "Identification.Issue_Date_AD", form.issue_date_ad ?? "");
  appendIfPresent(fd, "Identification.Issue_Date_BS", form.issue_date_bs ?? "");

  // Address
  appendIfPresent(fd, "Address.Province", form.province);
  appendIfPresent(fd, "Address.District", form.district);
  appendIfPresent(fd, "Address.Local_level", form.local_level);
  appendIfPresent(fd, "Address.Ward_No", form.ward_no);
  appendIfPresent(fd, "Address.Residence_Country", form.residence_country || "NEPAL");
  appendIfPresent(fd, "Address.Tole", form.tole ?? "");
  appendIfPresent(fd, "Address.Tole_nep", form.tole_nep ?? "");

  // Contact
  appendIfPresent(fd, "Contact.Mobile", form.mobile);
  appendIfPresent(fd, "Contact.Email", form.email ?? "");

  // Relation
  appendIfPresent(fd, "Relation.Father_Name", form.father_name);
  appendIfPresent(fd, "Relation.Father_Name_nep", form.father_name_nep);
  appendIfPresent(fd, "Relation.Father_Citizenship_No", form.father_citizenship_no ?? "");
  appendIfPresent(fd, "Relation.Father_Citizenship_Issued_District", form.father_citizenship_issued_district ?? "");

  // Customer Information
  appendIfPresent(fd, "CustomerInformation.Gender", form.gender);
  appendIfPresent(fd, "CustomerInformation.Date_Of_Birth_AD", form.dob_ad);
  appendIfPresent(fd, "CustomerInformation.Date_Of_Birth_BS", form.dob_bs);
  appendIfPresent(fd, "CustomerInformation.Occupation", form.occupation ?? "");

  // Politically involved
  appendIfPresent(fd, "Politically_Involved", form.politically_involved ? "true" : "false");

  // These keys in your Postman screenshots are PascalCase:
  appendIfPresent(fd, "Party_Inspection_Category", form.party_inspection_category ?? "");
  appendIfPresent(fd, "Risk_Factors", form.risk_factors ?? "");

  // Documents
  appendIfPresent(fd, "customer_image.doc_type", form.doc_type);

  // Files
  appendIfFile(fd, "customer_image.image_profile", form.image_profile);

  if (form.doc_type === "citizenship") {
    appendIfFile(fd, "customer_image.ctz_image_front", form.ctz_front);
    appendIfFile(fd, "customer_image.ctz_image_back", form.ctz_back);
  } else if (form.doc_type === "passport") {
    appendIfFile(fd, "customer_image.passport_image_front", form.passport_front);
    appendIfFile(fd, "customer_image.passport_image_back", form.passport_back);
  } else if (form.doc_type === "nid") {
    appendIfFile(fd, "customer_image.nid_image_front", form.nid_front);
    appendIfFile(fd, "customer_image.nid_image_back", form.nid_back);
  }

  const url = `${API_BASE_URL}/v1/CustomerKyc/customer-kyc`;

  const res = await authFetch(url, {
    method: "POST",
    headers: {
      "verify-signature": verifySignature,
      Accept: "*/*",
      // DO NOT set "Content-Type" for FormData
      // DO NOT set Authorization — authFetch handles it + auto-refreshes on 401
    },
    body: fd,
  });

  const rawText = await res.text();
  let json: any = {};
  try {
    json = rawText ? JSON.parse(rawText) : {};
  } catch {
    json = {};
  }

  const debug = {
    url,
    status: res.status,
    ok: res.ok,
    used_headers: {
      "verify-signature": `${unixTs}.${String(signature).slice(0, 10)}...`,
    },
    request_form_data: formDataToDebug(fd),
    response_json: json,
    response_text: rawText,
  };

  if (json?.process_result === false || (Array.isArray(json?.error_list) && json.error_list.length)) {
    const msg =
      json?.error_list?.[0]?.error_message ||
      json?.message ||
      "KYC failed (process_result=false)";
    const err: any = new Error(msg);
    err.debug = debug;
    throw err;
  }

  if (!res.ok) {
    const msg = json?.message || rawText || `KYC error ${res.status}`;
    const err: any = new Error(msg);
    err.debug = debug;
    throw err;
  }

  return opts?.debug ? { data: json, debug } : json;
}
