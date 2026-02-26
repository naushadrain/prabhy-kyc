// Types for Policy List
export interface Policy {
  created_date: string;
  effective_date: string;
  expiry_date: string;
  policy_number: string;
  document_number:string;
  expiry_status: string;
  total_premium: string;
  insured_name: string;
  product_name: string;
  payment_status: string;
  policy_status: string;
  policy_remarks: string;
  is_draft_policy: string;
}

export interface PolicyListResponse {
  class_id: number;
  total_data_no: number;
  policy_list: Policy[];
  process_result: boolean;
  error_list: any[];
}

// Types for Policy Details
export interface ScheduleItem {
  schedule_title: string;
  schedule_description: string;
  schedule_excess: string;
  travel_area_id: number;
  travel_plan: number;
  sequence_order: number;
}

export interface PolicyDetailResponse {
  class_id: number;
  no_of_days: number;
  branch_name_english: string;
  insured_person_name: string;
  insured_person_address: string;
  fiscal_year: string;
  old_policy_text: string;
  policy_number: string;
  off_alias: string;
  agent_alias: string;
  policy_issue_date: string;
  createdTime: string;
  effective_date: string;
  expiry_date: string;
  credit_no: string;
  stamp_duty: string;
  vat_amount: string;
  total_premium: string;
  have_children_info: string;
  is_draft_policy: string;
  dob: string;
  passport_no: string;
  phone_no: string;
  travel_plan_name: string;
  travel_plan: string;
  travel_area: string;
  country_name: string;
  premium: string;
  currency_name: string;
  currency_premium: string;
  schedule_list: ScheduleItem[];
  children_list: any[];
  process_result: boolean;
  error_list: any[];
}
