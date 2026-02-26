
/**
 * Request payload for creating a travel policy
 * Based on Postman collection structure
 */
export interface CreateTravelPolicyPayload {
  client_info: {
    Bank_Code: string;
  };

  policy_info: {
    department_id: string;
    class_id: string;
    payment_process: string;
    effective_date: string; // ISO 8601 format: "2026-02-27"
    expiry_date: string; // ISO 8601 format: "2026-03-12"
    proposed_date?: string;
    issued_date_ad?: string;
    issued_date_bs?: string;
  };

  class_info: {
    class_id: string;
    passport_number: string;
    date_of_birth_AD: string; // ISO 8601 format: "2005-12-18"
    phone_number: string;
    age_band_id: string;
    travel_package_id: string;
    travel_area_id: string;
    travel_area_plan_id: string;
    period_id: string;
    currency_id: string;
    currency_rate: number;
    currency_premium: number;
    premium: number;
    currency_suminsured: number;
    total_suminsured: number;
    have_children: boolean;
    country_code: string; // ISO 3166-1 alpha-2 code: "PH"
    passport_front_id?: string | number;
    passport_back_id?: string | number;
  };

  amount_info: {
    suminsured: number;
    premium_amount: number;
    pa_amount: number;
    tpl_amount: number;
    pool_amount: number;
    taxable_amount: number;
    stamp_duty: number;
    vat_percent: number;
    vat_amount: number;
    total_amount: number;
  };

  policy_session_id?: string;

  child_info?: Array<{
    children_name: string;
    children_dob: string; // ISO 8601 format: "2010-01-15"
    children_passport: string;
    children_passport_front_id?: string | number;
    children_passport_back_id?: string | number;
  }>;
}

// Example usage with your data:
const example: CreateTravelPolicyPayload = {
  client_info: {
    Bank_Code: "1"
  },
  policy_info: {
    department_id: "3",
    class_id: "81",
    payment_process: "Full Payment",
    effective_date: "2026-02-27",
    expiry_date: "2026-03-12"
  },
  class_info: {
    class_id: "81",
    passport_number: "12341234",
    date_of_birth_AD: "2005-12-18",
    phone_number: "9840789960",
    age_band_id: "1",
    travel_package_id: "4",
    travel_area_id: "6",
    travel_area_plan_id: "4",
    period_id: "2",
    currency_id: "2",
    currency_rate: 0, // number
    currency_premium: 0, // number
    premium: 0, // number
    currency_suminsured: 0, // number
    total_suminsured: 0, // number
    have_children: true,
    country_code: "PH",
    passport_front_id: "16",
    passport_back_id: "17"
  },
  amount_info: {
    suminsured: 0, // number
    premium_amount: 0, // number
    pa_amount: 0,
    tpl_amount: 0,
    pool_amount: 0,
    taxable_amount: 0, // number
    stamp_duty: 0, // number
    vat_percent: 0, // number
    vat_amount: 0, // number
    total_amount: 0 // number
  },
  policy_session_id: "session-id-value",
  child_info: [
    {
      children_name: "Alice",
      children_dob: "2010-01-15",
      children_passport: "P123456",
      children_passport_front_id: "11",
      children_passport_back_id: "12"
    },
    {
      children_name: "Bob",
      children_dob: "2012-05-20",
      children_passport: "P654321",
      children_passport_front_id: "14",
      children_passport_back_id: "13"
    }
  ]
};
/**
 * Response from create travel policy API
 */
export interface CreateTravelPolicyResponse {
  process_result: boolean;
  policy_no?: string;
  policy_number?: string;
  message?: string;
  error_list?: Array<{
    error_code?: string;
    error_message?: string;
  }>;
  data?: {
    policy_no?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

/**
 * Premium calculation response
 */
export interface PremiumCalculationResponse {
  currency?: string;
  rate?: number;
  currency_amount?: number;
  premium_in_npr?: number;
  currency_suminsured?: number;
  suminsured_in_npr?: number;
  vat_percent?: number;
  vat_amount?: number;
  stamp_duty?: number;
  total_premium_with_vat?: number;
  taxable_amount?: number;
  direct_discount_amount?: number;
  [key: string]: any;
}