import z from "zod";
function parseISO(v: string) {
  const t = Date.parse(v);
  return Number.isFinite(t) ? new Date(t) : null;
}
function isValidISODate(v: string) {
  return !!parseISO(v);
}
const  formSchema = z.object({
  // Visible fields that need validation
  passport_number: z.string().min(1, "Passport number is required"),
  phone_number: z.string().min(10, "Phone number must be at least 10 digits"),
  country_code: z.string().min(1, "Country code is required"),
  have_children: z.boolean(),
  
  // Child info validation (only if have_children is true)
  child_info: z.array(z.object({
    children_name: z.string().min(1, "Child name is required"),
    children_dob: z.string().min(1, "Child DOB is required").refine(isValidISODate, "Invalid date"),
    children_passport: z.string().min(1, "Child passport is required"),
  })).default([]),
  
  // Hidden fields - no validation needed as they come from previous pages
  bank_code: z.string().optional(),
  department_id: z.string().optional(),
  class_id: z.string().optional(),
  payment_process: z.string().optional(),
  proposed_date: z.string().optional(),
  issued_date_ad: z.string().optional(),
  issued_date_bs: z.string().optional(),
  effective_date: z.string().optional(),
  expiry_date: z.string().optional(),
  date_of_birth_AD: z.string().optional(),
  age_band_id: z.string().optional(),
  travel_package_id: z.string().optional(),
  travel_area_id: z.string().optional(),
  travel_area_plan_id: z.string().optional(),
  period_id: z.string().optional(),
  currency_id: z.string().optional(),
  currency_rate: z.coerce.number().optional(),
  currency_premium: z.coerce.number().optional(),
  premium: z.coerce.number().optional(),
  currency_suminsured: z.coerce.number().optional(),
  total_suminsured: z.coerce.number().optional(),
  suminsured: z.coerce.number().optional(),
  premium_amount: z.coerce.number().optional(),
  taxable_amount: z.coerce.number().optional(),
  stamp_duty: z.coerce.number().optional(),
  vat_percent: z.coerce.number().optional(),
  vat_amount: z.coerce.number().optional(),
  total_amount: z.coerce.number().optional(),
}).superRefine((data, ctx) => {
  // Only validate child_info if have_children is true
  if (data.have_children && data.child_info.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["child_info"],
      message: "Please add at least 1 child (or turn off Have Children)",
    });
  }
});

export default formSchema;