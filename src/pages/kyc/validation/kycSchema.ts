// src/pages/kyc/validation/kycSchema.ts
import { z } from "zod";
import NepaliDate from "nepali-date-converter";

/** =========================
 * Constants
 * ========================= */
export const MIN_AGE = 16;
export const MAX_AGE = 60;

/** =========================
 * Nepali Unicode Validation
 * ========================= */
export const NEPALI_REGEX = /^[\u0900-\u097F\s।,.'"-]+$/;

export function isNepaliOnly(value: string) {
  if (!value?.trim()) return true; // empty allowed for optional nepali fields
  return NEPALI_REGEX.test(value.trim());
}

/** =========================
 * Date helpers
 * ========================= */

// safer date parse for "YYYY-MM-DD" (avoids timezone shift)
export function parseISOToLocalDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function calcAge(dob: Date) {
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

export function toYMD(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// For input min/max (DOB only)
export function getDobMinMaxYMD() {
  const today = new Date();
  const max = new Date(today.getFullYear() - MIN_AGE, today.getMonth(), today.getDate()); // youngest allowed
  const min = new Date(today.getFullYear() - MAX_AGE, today.getMonth(), today.getDate()); // oldest allowed
  return { minDobAD: toYMD(min), maxDobAD: toYMD(max) };
}

// Convert AD(ISO) -> BS(YYYY-MM-DD)
export function adIsoToBsYMD(iso: string) {
  const ad = parseISOToLocalDate(iso);
  return NepaliDate.fromAD(ad).format("YYYY-MM-DD");
}

/** =========================
 * Small helpers for schema
 * ========================= */

// Optional string that also accepts "" (does not block submit)
const optionalText = z.string().trim().optional().or(z.literal(""));

// Optional Nepali text that also accepts "" and validates only if not empty
const optionalNepaliText = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .refine(isNepaliOnly, "कृपया केवल नेपाली अक्षरहरू प्रयोग गर्नुहोस्।");

// Required Nepali text
const requiredNepaliText = (msg: string) =>
  z
    .string()
    .trim()
    .min(1, msg)
    .refine(isNepaliOnly, "कृपया केवल नेपाली अक्षरहरू प्रयोग गर्नुहोस्।");

// Ward number (string in form) must be digits and >= 1
const wardNoSchema = z
  .string()
  .trim()
  .min(1, "Ward number is required")
  .regex(/^\d+$/, "Ward number must be numeric")
  .refine((v) => Number(v) >= 1, "Ward number must be at least 1");

// Mobile (Nepal) – 10 digits, starts with 97/98
const mobileSchema = z
  .string()
  .trim()
  .min(1, "Mobile number is required")
  .regex(/^\d{10}$/, "Mobile number must be exactly 10 digits")
  .refine((v) => v.startsWith("97") || v.startsWith("98"), "Mobile must start with 97 or 98");

/** =========================
 * Zod schema (export)
 * ========================= */
export const kycSchema = z
  .object({
    honour: z.string().min(1, "Please select honour"),
    gender: z.string().min(1, "Please select gender"),

    first_name: z.string().trim().min(1, "First name is required"),
    middle_name: optionalText,
    last_name: z.string().trim().min(1, "Last name is required"),

    first_name_nep: requiredNepaliText("कृपया पहिलो नाम (नेपालीमा) लेख्नुहोस्"),
    middle_name_nep: optionalNepaliText,
    last_name_nep: requiredNepaliText("कृपया थर (नेपालीमा) लेख्नुहोस्"),

    id_type: z.string().min(1, "Please select Identification Type"),
    id_no: z.string().trim().min(1, "Identification number is required"),
    issued_district: z.string().trim().min(1, "Issued district is required"),

    // ✅ Your UI shows * , so make these required
    issue_date_ad: z.string().trim().min(1, "Please select Issue Date (A.D)"),
    issue_date_bs: z.string().trim().min(1, "Issue Date (B.S) is required"),

    dob_ad: z.string().trim().min(1, "Please select Date of Birth (A.D)"),
    // ✅ Your UI shows * , so required (auto-filled)
    dob_bs: z.string().trim().min(1, "Date of Birth (B.S) is required"),

    mobile: mobileSchema,

    // ✅ Your UI shows Email * in KYCAdd, so required email:
    email: z.string().trim().min(1, "Email is required").email("Enter a valid email"),

    province: z.string().min(1, "Please select province"),
    district: z.string().min(1, "Please select district"),
    local_level: z.string().min(1, "Please select municipality/local level"),

    ward_no: wardNoSchema,

    tole: z.string().trim().min(1, "Tole is required"),
    tole_nep: requiredNepaliText("कृपया टोल (नेपालीमा) लेख्नुहोस्"),

    // If you want to allow editing, keep required but default is "NEPAL"
    residence_country: z.string().trim().min(1, "Residence country is required").default("NEPAL"),

    temp_address: optionalText,
    temp_address_nep: optionalNepaliText,

    father_name: z.string().trim().min(1, "Father name is required"),
    father_name_nep: requiredNepaliText("बुवाको नाम (नेपालीमा) आवश्यक छ"),

    father_citizenship_no: optionalText,
    father_citizenship_issued_district: optionalText,

    occupation: optionalText,
    industry: optionalText,

    politically_involved: z.boolean().optional().default(false),

    // keep flexible, but you can switch to enum if your API expects exact values
    party_inspection_category: z.string().trim().optional().default("Low"),

    // allow digits only (since you use "1")
    risk_factors: z
      .string()
      .trim()
      .regex(/^\d+$/, "Risk factors must be numeric")
      .optional()
      .default("1"),

    // ✅ Make doc_type enum (matches your Select)
    doc_type: z.enum(["citizenship", "passport", "nid"]).default("citizenship"),
  })
  .superRefine((val, ctx) => {
    // ✅ DOB age validation 16–60
    if (val.dob_ad) {
      try {
        const dob = parseISOToLocalDate(val.dob_ad);
        const age = calcAge(dob);

        if (age < MIN_AGE) {
          ctx.addIssue({
            code: "custom",
            path: ["dob_ad"],
            message: `Minimum age is ${MIN_AGE} years`,
          });
        }
        if (age > MAX_AGE) {
          ctx.addIssue({
            code: "custom",
            path: ["dob_ad"],
            message: `Maximum age is ${MAX_AGE} years`,
          });
        }

        // ✅ AD -> BS match
        const bs = NepaliDate.fromAD(dob).format("YYYY-MM-DD");
        if (val.dob_bs && bs !== val.dob_bs) {
          ctx.addIssue({
            code: "custom",
            path: ["dob_bs"],
            message: "A.D and B.S do not match (please reselect A.D)",
          });
        }
      } catch {
        // invalid DOB AD format
        ctx.addIssue({
          code: "custom",
          path: ["dob_ad"],
          message: "Invalid Date of Birth (A.D)",
        });
      }
    }

    // ✅ Issue Date AD -> BS match
    if (val.issue_date_ad) {
      try {
        const issueAD = parseISOToLocalDate(val.issue_date_ad);
        const bsIssue = NepaliDate.fromAD(issueAD).format("YYYY-MM-DD");
        if (val.issue_date_bs && bsIssue !== val.issue_date_bs) {
          ctx.addIssue({
            code: "custom",
            path: ["issue_date_bs"],
            message: "Issue Date A.D and B.S do not match",
          });
        }
      } catch {
        ctx.addIssue({
          code: "custom",
          path: ["issue_date_ad"],
          message: "Invalid Issue Date (A.D)",
        });
      }
    }
  });

export type KycFormValues = z.infer<typeof kycSchema>;
