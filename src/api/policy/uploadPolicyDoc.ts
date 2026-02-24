// src/api/policy/uploadPolicyDoc.ts
import { buildSignatureForBody } from "../session/signature";
import { createSession } from "../session/sessionClient";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;
const USER_LOGIN_ID = import.meta.env.VITE_USER_LOGIN_ID as string;

function getAccessToken() {
  return localStorage.getItem("access_token");
}

export async function uploadPolicyDocument(
  classId: string,
  docType: string,
  docIdType: 'PF' | 'PB',
  imageFile: File,
  imageId?: string,
  customImageName?: string
) {
  if (!API_BASE_URL) throw new Error("Missing env var: VITE_API_BASE_URL");

  // Create FormData
  const formData = new FormData();
  formData.append("class_id", classId);
  formData.append("doc_type", docType);
  formData.append("doc_id_type", docIdType);
  
  if (imageId) {
    formData.append("image_id", imageId);
  }
  
  // Use custom image name or generate one
  const imageName = customImageName || `${docIdType}_${imageId || 'doc'}_${Date.now()}`;
  formData.append("image_name", imageName);
  formData.append("image_file", imageFile);

  // Get session
  const sessionProcessId = await createSession();
  
  // IMPORTANT: Build signature string in the format the backend expects
  // Based on your screenshot, the fields are: class_id, doc_type, doc_id_type, image_id, image_name
  // The signature should be built from these fields in the SAME ORDER as they appear in the request
  const signatureFields = [
    `class_id=${classId}`,
    `doc_type=${docType}`,
    `doc_id_type=${docIdType}`,
    `image_id=${imageId || ''}`,
    `image_name=${imageName}`
  ];
  
  // Join with '&' to create a query string-like format
  const signatureString = signatureFields.join('&');
  
  console.log("Signature string:", signatureString);
  
  // Build signature using the same function used elsewhere in your app
  const { unixTs, signature } = buildSignatureForBody(signatureString);
  
  const basicToken = btoa(`${USER_LOGIN_ID}:${sessionProcessId}`);
  const accessToken = getAccessToken();

  const headers = {
    "verify-signature": `${unixTs}.${signature}`,
    "split-signature": `${unixTs}.${signature}`,
    "Authorization": `Bearer ${accessToken}`,
    "x-gateway-auth": `Basic ${basicToken}`,
    "Accept": "*/*",
    // Don't set Content-Type for FormData
  };

  console.log("Upload Headers:", {
    "verify-signature": headers["verify-signature"],
    "split-signature": headers["split-signature"],
  });

  const res = await fetch(`${API_BASE_URL}/v1/Policy/upload-policy-doc`, {
    method: "POST",
    headers,
    body: formData,
  });

  const responseText = await res.text();
  console.log("Upload Response:", responseText);
  
  let responseData;
  try {
    responseData = responseText ? JSON.parse(responseText) : {};
  } catch {
    responseData = { message: responseText };
  }

  if (!res.ok) {
    throw {
      status: res.status,
      data: responseData,
      message: responseData?.message || `HTTP error ${res.status}`
    };
  }

  return responseData;
}