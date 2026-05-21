// src/api/policy/uploadPolicyDoc.ts
import { authFetch } from "../auth/authFetch";
import { buildSignatureForBody } from "../session/signature";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

export interface UploadPolicyDocResponse {
  process_result: boolean;
  uploaded_id?: number;   // API returns "uploaded_id" (number), e.g. 61
  error_list?: { error_message: string }[];
  [key: string]: unknown;
}

/**
 * Base upload function.
 *
 * FormData sent to API:
 *   class_id    = "1"               (static)
 *   doc_id_type = "UBB"             (static)
 *   doc_type    = docType           e.g. "Passport", "Vehicle"
 *   doc_id      = docId             e.g. "PF", "PB", "CPF", "CPB", "VF", "VB"
 *   image_id    = unique per upload  {timestamp}{random}
 *   image_file  = file blob
 */
export async function uploadPolicyDocument(
  docType: string,
  docId: string,
  identifier: string,  // passportNo | vehicleNo — plain doc identifier
  imageFile: File
): Promise<UploadPolicyDocResponse> {
  if (!API_BASE_URL) throw new Error("Missing env var: VITE_API_BASE_URL");

  // For multipart/form-data, signature body is always empty string
  const { unixTs, signature } = buildSignatureForBody("");
  const verifySignature = `${unixTs}.${signature}`;

  // image_id — numeric only, unique per upload.
  const uniqueImageId = String(Date.now()) + String(Math.floor(Math.random() * 10000)).padStart(4, "0");

  const formData = new FormData();
  formData.append("class_id",    "1");
  formData.append("doc_id_type", "UBB");
  formData.append("doc_type",    docType);
  formData.append("doc_id",      docId);
  formData.append("image_id",    uniqueImageId);
  formData.append("image_file",  imageFile);

  const res = await authFetch(`${API_BASE_URL}/v1/Policy/upload-policy-doc`, {
    method: "POST",
    headers: {
      "verify-signature": verifySignature,
      Accept: "*/*",
      // DO NOT set Content-Type — browser sets multipart boundary automatically
      // DO NOT set Authorization — authFetch handles it + auto-refreshes on 401
    },
    body: formData,
  });

  const rawText = await res.text();
  let responseData: UploadPolicyDocResponse = { process_result: false };
  try {
    responseData = rawText ? JSON.parse(rawText) : { process_result: false };
  } catch {
    responseData = { process_result: false };
  }

  if (res.status === 401) throw new Error("401 Unauthorized — token invalid or expired");

  if (!res.ok) {
    throw {
      status: res.status,
      data: responseData,
      message:
        responseData?.error_list?.[0]?.error_message ||
        rawText ||
        `HTTP error ${res.status}`,
    };
  }

  return responseData;
}

/* ─────────────────────────────────────────────────────────────────────────────
 *  Named helpers
 *  doc_id mapping:
 *    PF  = Passport Front        (main traveller)
 *    PB  = Passport Back         (main traveller)
 *    CPF = Child Passport Front
 *    CPB = Child Passport Back
 *    VF  = Vehicle Front
 *    VB  = Vehicle Back
 * ───────────────────────────────────────────────────────────────────────────── */

/** Main traveller — Passport Front */
export const uploadPassportFront = (passportNo: string, file: File) =>
  uploadPolicyDocument("Passport", "PF", passportNo, file);

/** Main traveller — Passport Back */
export const uploadPassportBack = (passportNo: string, file: File) =>
  uploadPolicyDocument("Passport", "PB", passportNo, file);

/** Child — Passport Front */
export const uploadChildPassportFront = (passportNo: string, file: File) =>
  uploadPolicyDocument("Passport", "CPF", passportNo, file);

/** Child — Passport Back */
export const uploadChildPassportBack = (passportNo: string, file: File) =>
  uploadPolicyDocument("Passport", "CPB", passportNo, file);

/** Vehicle — Front */
export const uploadVehicleFront = (vehicleNo: string, file: File) =>
  uploadPolicyDocument("Vehicle", "VF", vehicleNo, file);

/** Vehicle — Back */
export const uploadVehicleBack = (vehicleNo: string, file: File) =>
  uploadPolicyDocument("Vehicle", "VB", vehicleNo, file);
