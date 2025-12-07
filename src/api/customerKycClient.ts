// src/api/customerKycClient.ts
import { CustomerKycFormData } from "@/models/kyc";
import { buildSignatureForBody } from "@/api/signature"; // you already use this elsewhere

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

export async function submitCustomerKyc(values: CustomerKycFormData) {
    if (!API_BASE_URL) throw new Error("VITE_API_BASE_URL is not set");

    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) throw new Error("Not authenticated");

    const form = new FormData();

    // 🔹 Map to form-data keys exactly like Postman screenshot

    // Customer_Name.*
    form.append("Customer_Name.Honour", values.honour);
    if (values.firstNameNep) form.append("Customer_Name.First_Name_nep", values.firstNameNep);
    if (values.middleNameNep) form.append("Customer_Name.Middle_Name_nep", values.middleNameNep);
    if (values.lastNameNep) form.append("Customer_Name.Last_Name_nep", values.lastNameNep);

    // Identification.*
    form.append("Identification.Id_Type", values.idType);
    form.append("Identification.Id_No", values.idNo);
    form.append("Identification.Issued_District", values.issuedDistrict);
    form.append("Identification.Issue_Date_AD", values.issueDateAD);
    form.append("Identification.Issue_Date_BS", values.issueDateBS);

    // Address.*
    form.append("Address.Province", values.province);
    form.append("Address.District", values.district);
    form.append("Address.Local_level", values.localLevel);
    form.append("Address.Ward_No", values.wardNo);
    form.append("Address.Residence_Country", values.residenceCountry);

    // Contact.*
    form.append("Contact.Mobile", values.mobile);
    form.append("Contact.Email", values.email);

    // Relation.*
    form.append("Relation.Father_Name", values.fatherName);
    form.append("Relation.Father_Citizenship_No", values.fatherCitizenshipNo);

    // CustomerInformation.*
    form.append("CustomerInformation.Gender", values.gender);
    form.append("CustomerInformation.Date_Of_Birth_AD", values.dobAD);
    form.append("CustomerInformation.Date_Of_Birth_BS", values.dobBS);
    form.append("CustomerInformation.Occupation", values.occupation);

    // Risk / Political
    form.append("Politically_Involved", String(values.politicallyInvolved));
    form.append("Party_Inspection_Category", values.partyInspectionCategory);
    form.append("Risk_Factors", values.riskFactors);

    // Images – only append if not null
    if (values.imageProfile) {
        form.append("customer_image.image_profile", values.imageProfile);
    }
    if (values.imageFront) {
        form.append("customer_image.image_front", values.imageFront);
    }
    if (values.imageBack) {
        form.append("customer_image.image_back", values.imageBack);
    }
    form.append("customer_image.doc_type", values.docType);

    // 🔐 Signature: body is form-data, but Postman uses raw body = "" → jsonBody = ""
    const jsonBody = "";
    const { unixTs, signature } = buildSignatureForBody(jsonBody);

    const res = await fetch(`${API_BASE_URL}/v1/CustomerKyc/customer-kyc`, {
        method: "POST",
        headers: {
            // ⚠️ Do NOT set Content-Type manually; browser will set multipart boundary
            "verify-signature": `${unixTs}.${signature}`,
            Authorization: `Bearer ${accessToken}`,
        },
        body: form,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || (data?.process_result === false && data?.error_list?.length)) {
        const msg =
            data?.error_list?.[0]?.error_message ||
            `KYC error ${res.status}`;
        throw new Error(msg);
    }

    return data;
}
