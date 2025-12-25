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
    if (!value?.trim()) return true;
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
 * Zod schema (export)
 * ========================= */
export const kycSchema = z
    .object({
        honour: z.string().min(1, "Please select honour"),
        gender: z.string().min(1, "Please select gender"),

        first_name: z.string().trim().min(1, "First name is required"),
        middle_name: z.string().trim().optional().or(z.literal("")),
        last_name: z.string().trim().min(1, "Last name is required"),

        first_name_nep: z
            .string()
            .trim()
            .min(1, "कृपया पहिलो नाम (नेपालीमा) लेख्नुहोस्")
            .refine(isNepaliOnly, "कृपया केवल नेपाली अक्षरहरू प्रयोग गर्नुहोस्।"),
        middle_name_nep: z
            .string()
            .trim()
            .optional()
            .or(z.literal(""))
            .refine(isNepaliOnly, "कृपया केवल नेपाली अक्षरहरू प्रयोग गर्नुहोस्।"),
        last_name_nep: z
            .string()
            .trim()
            .min(1, "कृपया थर (नेपालीमा) लेख्नुहोस्")
            .refine(isNepaliOnly, "कृपया केवल नेपाली अक्षरहरू प्रयोग गर्नुहोस्।"),

        id_type: z.string().min(1, "Please select Identification Type"),
        id_no: z.string().trim().min(1, "Identification number is required"),
        issued_district: z.string().trim().min(1, "Issued district is required"),

        issue_date_ad: z.string().optional().or(z.literal("")),
        issue_date_bs: z.string().optional().or(z.literal("")),

        dob_ad: z.string().min(1, "Please select Date of Birth (A.D)"),
        dob_bs: z.string().optional().or(z.literal("")),

        mobile: z
            .string()
            .trim()
            .min(1, "Mobile number is required")
            .regex(/^[0-9]{10}$/, "Enter a valid 10-digit mobile number"),
        email: z
            .string()
            .trim()
            .optional()
            .or(z.literal(""))
            .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Enter a valid email"),

        province: z.string().min(1, "Please select province"),
        district: z.string().min(1, "Please select district"),
        local_level: z.string().min(1, "Please select municipality/local level"),

        ward_no: z.string().trim().min(1, "Ward number is required"),
        tole: z.string().trim().min(1, "Tole is required"),
        tole_nep: z
            .string()
            .trim()
            .min(1, "कृपया टोल (नेपालीमा) लेख्नुहोस्")
            .refine(isNepaliOnly, "कृपया केवल नेपाली अक्षरहरू प्रयोग गर्नुहोस्।"),

        residence_country: z.string().trim().optional().or(z.literal("NEPAL")),

        temp_address: z.string().trim().optional().or(z.literal("")),
        temp_address_nep: z
            .string()
            .trim()
            .optional()
            .or(z.literal(""))
            .refine(isNepaliOnly, "कृपया केवल नेपाली अक्षरहरू प्रयोग गर्नुहोस्।"),

        father_name: z.string().trim().min(1, "Father name is required"),
        father_name_nep: z
            .string()
            .trim()
            .min(1, "बुवाको नाम (नेपालीमा) आवश्यक छ")
            .refine(isNepaliOnly, "कृपया केवल नेपाली अक्षरहरू प्रयोग गर्नुहोस्।"),
        father_citizenship_no: z.string().trim().optional().or(z.literal("")),
        father_citizenship_issued_district: z.string().trim().optional().or(z.literal("")),

        occupation: z.string().trim().optional().or(z.literal("")),
        industry: z.string().trim().optional().or(z.literal("")),

        politically_involved: z.boolean().optional().default(false),
        party_inspection_category: z.string().optional().default("Low"),
        risk_factors: z.string().optional().default("1"),
        doc_type: z.string().optional().default("citizenship"),
    })
    .superRefine((val, ctx) => {
        // ✅ DOB age validation 16–60
        if (val.dob_ad) {
            const dob = parseISOToLocalDate(val.dob_ad);
            const age = calcAge(dob);

            if (age < MIN_AGE) {
                ctx.addIssue({ code: "custom", path: ["dob_ad"], message: `Minimum age is ${MIN_AGE} years` });
            }
            if (age > MAX_AGE) {
                ctx.addIssue({ code: "custom", path: ["dob_ad"], message: `Maximum age is ${MAX_AGE} years` });
            }

            // ✅ AD -> BS match (if BS is present)
            try {
                const bs = NepaliDate.fromAD(dob).format("YYYY-MM-DD");
                if (val.dob_bs && bs !== val.dob_bs) {
                    ctx.addIssue({ code: "custom", path: ["dob_bs"], message: "A.D and B.S do not match (please reselect A.D)" });
                }
            } catch { }
        }

        // ✅ Issue Date AD -> BS match (if both present)
        if (val.issue_date_ad) {
            try {
                const issueAD = parseISOToLocalDate(val.issue_date_ad);
                const bsIssue = NepaliDate.fromAD(issueAD).format("YYYY-MM-DD");
                if (val.issue_date_bs && bsIssue !== val.issue_date_bs) {
                    ctx.addIssue({ code: "custom", path: ["issue_date_bs"], message: "Issue Date A.D and B.S do not match" });
                }
            } catch { }
        }
    });

export type KycFormValues = z.infer<typeof kycSchema>;
