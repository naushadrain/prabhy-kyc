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
// Allow Devanagari + space + common Nepali punctuation
export const NEPALI_REGEX = /^[\u0900-\u097F\s।,.'"-]+$/;

export function normalizeSpaces(input: string) {
  return String(input ?? "").replace(/\s+/g, " ").trim();
}

export function isNepaliOnly(value: string) {
  const v = normalizeSpaces(value);
  if (!v) return true; // empty allowed for optional nepali fields
  return NEPALI_REGEX.test(v);
}

export function isStrictNepaliLettersOnly(value: string) {
  const v = normalizeSpaces(value);
  if (!v) return false;
  return /^[\u0900-\u097F\s]+$/.test(v); // only letters + spaces
}

export function isNepaliTwoWords(value: string) {
  const v = normalizeSpaces(value);
  if (!v) return false;
  if (!isStrictNepaliLettersOnly(v)) return false;
  const parts = v.split(" ").filter(Boolean);
  return parts.length === 2;
}

/** =========================
 * Date helpers
 * ========================= */

// safer date parse for "YYYY-MM-DD" (avoids timezone shift)
export function parseISOToLocalDate(iso: string) {
  const [y, m, d] = String(iso ?? "").split("-").map(Number);
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

// Optional string that also accepts ""
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

// Required Nepali TWO WORDS (backend requirement)
const requiredNepaliTwoWords = (msg: string) =>
  z
    .string()
    .transform((v) => normalizeSpaces(v))
    .refine((v) => v.length > 0, msg)
    .refine(isStrictNepaliLettersOnly, "कृपया केवल नेपाली अक्षरहरू प्रयोग गर्नुहोस्।")
    .refine(isNepaliTwoWords, "कृपया दुई शब्दमा (जस्तै: राम बहादुर) लेख्नुहोस्।");

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

export const OptionalDocTypeEnum = z.enum(["passport", "nid", "driving_license"]);
export type OptionalDocType = z.infer<typeof OptionalDocTypeEnum>;

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

    issue_date_ad: z.string().trim().min(1, "Please select Issue Date (A.D)"),
    issue_date_bs: z.string().trim().optional().or(z.literal("")), // auto-filled

    dob_ad: z.string().trim().min(1, "Please select Date of Birth (A.D)"),
    dob_bs: z.string().trim().optional().or(z.literal("")), // auto-filled

    mobile: mobileSchema,
    email: z.string().trim().min(1, "Email is required").email("Enter a valid email"),

    province: z.string().min(1, "Please select province"),
    district: z.string().min(1, "Please select district"),
    local_level: z.string().min(1, "Please select municipality/local level"),

    ward_no: wardNoSchema,

    tole: z.string().trim().min(1, "Tole is required"),
    tole_nep: optionalNepaliText, //  optional

    residence_country: z.string().trim().min(1, "Residence country is required").default("NEPAL"),

    temp_address: optionalText,
    temp_address_nep: optionalNepaliText,

    father_name: z.string().trim().min(1, "Father name is required"),
    father_name_nep: requiredNepaliTwoWords("बुवाको नाम (नेपालीमा) आवश्यक छ"),

    father_citizenship_no: optionalText,
    father_citizenship_issued_district: optionalText,

    occupation: optionalText,
    industry: optionalText,

    politically_involved: z.boolean().optional().default(false),

    party_inspection_category: z.string().trim().optional().default("Low"),

    risk_factors: z
      .string()
      .trim()
      .regex(/^\d+$/, "Risk factors must be numeric")
      .optional()
      .default("1"),

    doc_type: z.enum(["citizenship", "passport", "nid"]).default("citizenship"),

    /**  Optional uploads UI controls */
    add_optional_docs: z.boolean().optional().default(false),
    optional_doc_type: OptionalDocTypeEnum.optional(),
  })
  .superRefine((val, ctx) => {
    // Optional-doc logic
    if (val.add_optional_docs && !val.optional_doc_type) {
      ctx.addIssue({
        code: "custom",
        path: ["optional_doc_type"],
        message: "Please select optional document type",
      });
    }

    // DOB age validation 16–60 + AD->BS match
    if (val.dob_ad) {
      try {
        const dob = parseISOToLocalDate(val.dob_ad);
        const age = calcAge(dob);

        if (age < MIN_AGE) {
          ctx.addIssue({ code: "custom", path: ["dob_ad"], message: `Minimum age is ${MIN_AGE} years` });
        }
        if (age > MAX_AGE) {
          ctx.addIssue({ code: "custom", path: ["dob_ad"], message: `Maximum age is ${MAX_AGE} years` });
        }

        const bs = NepaliDate.fromAD(dob).format("YYYY-MM-DD");
        if (!val.dob_bs) {
          ctx.addIssue({ code: "custom", path: ["dob_bs"], message: "Date of Birth (B.S) is required (auto from A.D)" });
        } else if (bs !== val.dob_bs) {
          ctx.addIssue({ code: "custom", path: ["dob_bs"], message: "A.D and B.S do not match (please reselect A.D)" });
        }
      } catch {
        ctx.addIssue({ code: "custom", path: ["dob_ad"], message: "Invalid Date of Birth (A.D)" });
      }
    }

    // Issue Date AD->BS match
    if (val.issue_date_ad) {
      try {
        const issueAD = parseISOToLocalDate(val.issue_date_ad);
        const bsIssue = NepaliDate.fromAD(issueAD).format("YYYY-MM-DD");

        if (!val.issue_date_bs) {
          ctx.addIssue({ code: "custom", path: ["issue_date_bs"], message: "Issue Date (B.S) is required (auto from A.D)" });
        } else if (bsIssue !== val.issue_date_bs) {
          ctx.addIssue({ code: "custom", path: ["issue_date_bs"], message: "Issue Date A.D and B.S do not match" });
        }
      } catch {
        ctx.addIssue({ code: "custom", path: ["issue_date_ad"], message: "Invalid Issue Date (A.D)" });
      }
    }
  });

export type KycFormValues = z.infer<typeof kycSchema>;
