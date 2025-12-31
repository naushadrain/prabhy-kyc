type KycDetail = {
    kyc_detail: {
        branch_id: number;
        customer_Name: {
            honour?: string;
            first_Name?: string;
            middle_Name?: string;
            last_Name?: string;
            first_Name_nep?: string;
            middle_Name_nep?: string;
            last_Name_nep?: string;
        };
        identification: {
            id_Type?: string;
            id_No?: string;
            issued_District?: string;
            issue_Date_AD?: string;
            issue_Date_BS?: string;
        };
        customerInformation: {
            gender?: string;
            date_Of_Birth_AD?: string;
            date_Of_Birth_BS?: string;
            occupation?: string;
            sub_Occupation?: string;
        };
        address: {
            province?: string;
            district?: string;
            local_level?: string;
            ward_No?: string;
            residence_Country?: string;
            tole?: string;
            tole_nep?: string;
            temporary_Address?: string;
            temporary_Address_nep?: string;
            permanent_Address?: string;
            permanent_Address_nep?: string;
        };
        contact: {
            phone?: string;
            mobile?: string;
            fax?: string;
            email?: string;
        };
        relation: {
            father_Name?: string;
            father_Name_nep?: string;
        };
        customer_image: {
            image_name_profile?: string;
            ctz_name_front?: string;
            ctz_name_back?: string;
            passport_name_front?: string;
            passport_name_back?: string;
        };
        politically_Involved?: boolean;
    };
    kyc_status?: string;
    process_result?: boolean;
    error_list?: Array<{ error_code?: string; error_message?: string }>;
};

type FormState = {
    honour: string;
    first_Name: string;
    last_Name: string;
    first_Name_nep: string;
    middle_Name_nep: string;
    last_Name_nep: string;

    id_Type: string;
    id_No: string;
    issued_District: string;
    issue_Date_AD: string;
    issue_Date_BS: string;

    gender: string;
    date_Of_Birth_AD: string;
    date_Of_Birth_BS: string;
    occupation: string;
    sub_Occupation: string;

    province: string;
    district: string;
    local_level: string;
    ward_No: string;
    residence_Country: string;
    tole: string;
    tole_nep: string;
    permanent_Address: string;
    permanent_Address_nep: string;
    temporary_Address: string;
    temporary_Address_nep: string;

    mobile: string;
    email: string;

    father_Name: string;
    father_Name_nep: string;
};

export type { KycDetail, FormState };