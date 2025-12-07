// src/models/kyc.ts

export interface CustomerKycFormData {
    // Customer Name (Nepali / English)
    honour: string;
    firstNameNep: string;
    middleNameNep: string;
    lastNameNep: string;

    // Identification
    idType: string;
    idNo: string;
    issuedDistrict: string;
    issueDateAD: string; // "YYYY-MM-DD"
    issueDateBS: string; // "YYYY-MM-DD" or BS string

    // Address
    province: string;
    district: string;
    localLevel: string;
    wardNo: string;
    residenceCountry: string;

    // Contact
    mobile: string;
    email: string;

    // Relation
    fatherName: string;
    fatherCitizenshipNo: string;

    // Customer Information
    gender: "M" | "F" | "O" | "";
    dobAD: string;
    dobBS: string;
    occupation: string;

    // Risk / Political
    politicallyInvolved: boolean;
    partyInspectionCategory: string;
    riskFactors: string;

    // Images
    imageProfile: File | null;
    imageFront: File | null;
    imageBack: File | null;
    docType: string;
}
