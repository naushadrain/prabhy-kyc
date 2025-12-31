// src/pages/kyc/KYCAdd.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { Upload, X, AlertCircle, CheckCircle2, Info } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// catalogue components
import { ProvinceDistrictMunicipality } from "./getcatalogue/ProvinceDistrictMunicipality";
import { Gender } from "./getcatalogue/Gender";
import { Honour } from "./getcatalogue/Honour";
import { IdentificationType } from "./getcatalogue/IdentificationType";
import { Occupation } from "./getcatalogue/Occupation";

// helpers
import { getDobMinMaxYMD, adIsoToBsYMD, isNepaliOnly } from "./validation/kycSchema";

// API
import { submitCustomerKyc, type CustomerKycFormEntity } from "@/api/kyc/customerKycClient";
import { kycStatus } from "@/api/kyc/kycStatus";
import { kycRejectForm } from "@/api/kyc/kycRejectForm";

/* =========================
   Upload config
========================= */
type UploadItem = { file: File; previewUrl: string };
const ALLOWED_MIME = ["image/png", "image/jpeg"];
const MAX_FILE_MB = 1;

/** ✅ REQUIRED: Profile + Citizenship front/back */
const PHOTO_KEY = "Photo *";
const CTZ_FRONT_KEY = "Citizenship / Front *";
const CTZ_BACK_KEY = "Citizenship / Back *";

/** optional */
const PASS_FRONT_KEY = "Passport / Front (Optional)";
const PASS_BACK_KEY = "Passport / Back (Optional)";
const NID_FRONT_KEY = "NID / Front (Optional)";
const NID_BACK_KEY = "NID / Back (Optional)";
const DL_FRONT_KEY = "Driving License / Front (Optional)";
const DL_BACK_KEY = "Driving License / Back (Optional)";

const attachments = [
  PHOTO_KEY,
  CTZ_FRONT_KEY,
  CTZ_BACK_KEY,
  PASS_FRONT_KEY,
  PASS_BACK_KEY,
  NID_FRONT_KEY,
  NID_BACK_KEY,
  DL_FRONT_KEY,
  DL_BACK_KEY,
] as const;

type BannerState =
  | { type: "info" | "success" | "error"; title: string; message: string; debug?: any }
  | null;

type ApiErrorItem = { error_code?: string; error_message?: string };

type DocType = "citizenship" | "passport" | "nid";

type StatusApi = {
  kyc_Status?: string; // backend uses this
  process_result?: boolean;
  error_list?: ApiErrorItem[];
};

type DetailApi = {
  kyc_status?: string;
  process_result?: boolean;
  error_list?: ApiErrorItem[];
  kyc_detail?: any;
};

function normalizeStatusText(s: any) {
  const v = String(s ?? "").trim();
  return v || "Unknown";
}

function shouldShowStatusAlert(status: string) {
  const low = status.toLowerCase();
  // ✅ per your rule: if "KYC not completed" or Unknown => DO NOT show alert
  if (!status || low === "unknown") return false;
  if (low === "kyc not completed") return false;
  return ["pending", "rejected", "approved", "verified"].includes(low);
}

function buildStatusBanner(status: string): BannerState {
  if (!shouldShowStatusAlert(status)) return null;

  const low = status.toLowerCase();

  if (low === "pending") {
    return {
      type: "info",
      title: "KYC is under review",
      message: "We received your KYC. Our team is reviewing it. Editing is locked until a decision is made.",
    };
  }

  if (low === "rejected") {
    return {
      type: "error",
      title: "KYC needs correction",
      message: "Your KYC was rejected. Please correct the highlighted fields/documents and submit again.",
    };
  }

  if (low === "approved" || low === "verified") {
    return {
      type: "success",
      title: "KYC approved",
      message: "Your KYC has been approved. You cannot edit or submit again.",
    };
  }

  return null;
}

function isLockedByStatus(status: string) {
  const low = status.toLowerCase();
  return low === "pending" || low === "approved" || low === "verified";
}

function normalizeNepaliTwoWords(input: string) {
  const cleaned = String(input ?? "")
    .replace(/\s+/g, " ")
    .trim();
  const parts = cleaned.split(" ").filter(Boolean);
  return { cleaned, parts };
}

function isStrictNepaliLettersOnly(s: string) {
  return /^[\u0900-\u097F\s]+$/.test(s); // Devanagari + spaces only
}

/* =========================
   Form type + schema
   ✅ Fixes your issue:
   - tole_nep is OPTIONAL (no forced error)
   - issue_date_bs & dob_bs optional (auto-filled from AD)
   - father_name_nep matches backend: Nepali only + EXACT 2 words
========================= */
type KycFormValues = {
  honour: string;
  gender: string;

  first_name: string;
  middle_name: string;
  last_name: string;

  first_name_nep: string;
  middle_name_nep: string;
  last_name_nep: string;

  id_type: string;
  id_no: string;
  issued_district: string;

  issue_date_ad: string; // yyyy-mm-dd
  issue_date_bs: string; // auto

  dob_ad: string;
  dob_bs: string; // auto

  mobile: string;
  email: string;

  province: string;
  district: string;
  local_level: string;
  ward_no: string;

  tole: string;
  tole_nep: string; // OPTIONAL
  residence_country: string;

  temp_address: string;
  temp_address_nep: string;

  father_name: string;
  father_name_nep: string; // REQUIRED (2 words nepali)
  father_citizenship_no: string;
  father_citizenship_issued_district: string;

  occupation: string;
  industry: string;

  politically_involved: boolean;
  party_inspection_category: string;
  risk_factors: string;

  doc_type: DocType;
};

const kycFormSchema: z.ZodType<KycFormValues> = z
  .object({
    honour: z.string().min(1, "Honour is required"),
    gender: z.string().min(1, "Gender is required"),

    first_name: z.string().min(1, "First name (English) is required"),
    middle_name: z.string().optional().default(""),
    last_name: z.string().min(1, "Last name (English) is required"),

    first_name_nep: z
      .string()
      .min(1, "पहिलो नाम (नेपाली) आवश्यक छ")
      .refine((v) => isNepaliOnly(v), "कृपया केवल नेपाली अक्षरहरू प्रयोग गर्नुहोस्।"),
    middle_name_nep: z.string().optional().default(""),
    last_name_nep: z
      .string()
      .min(1, "थर (नेपाली) आवश्यक छ")
      .refine((v) => isNepaliOnly(v), "कृपया केवल नेपाली अक्षरहरू प्रयोग गर्नुहोस्।"),

    id_type: z.string().min(1, "Identification Type is required"),
    id_no: z.string().min(1, "ID Number is required"),
    issued_district: z.string().min(1, "Issued District is required"),

    issue_date_ad: z.string().min(1, "Issue Date (A.D) is required"),
    issue_date_bs: z.string().optional().default(""),

    dob_ad: z.string().min(1, "Date of Birth (A.D) is required"),
    dob_bs: z.string().optional().default(""),

    mobile: z
      .string()
      .min(10, "Mobile must be 10 digits")
      .max(10, "Mobile must be 10 digits")
      .regex(/^\d{10}$/, "Mobile must be digits only"),
    email: z.string().email("Invalid email"),

    province: z.string().min(1, "Province is required"),
    district: z.string().min(1, "District is required"),
    local_level: z.string().min(1, "Local level is required"),
    ward_no: z.string().min(1, "Ward No is required").regex(/^\d+$/, "Ward No must be numeric"),

    tole: z.string().min(1, "Tole is required"),
    // ✅ OPTIONAL: if user types, must be Nepali; otherwise empty OK
    tole_nep: z
      .string()
      .optional()
      .default("")
      .refine((v) => !v || isNepaliOnly(v), "टोल (नेपालीमा) मा केवल नेपाली अक्षरहरू हुनुपर्छ।"),

    residence_country: z.string().min(1, "Residence Country is required"),

    temp_address: z.string().optional().default(""),
    temp_address_nep: z.string().optional().default(""),

    father_name: z.string().min(1, "Father Name is required"),
    father_name_nep: z
      .string()
      .min(1, "Father Name (नेपाली) is required")
      .superRefine((v, ctx) => {
        const { cleaned, parts } = normalizeNepaliTwoWords(v);
        if (!cleaned) return;
        if (!isStrictNepaliLettersOnly(cleaned)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Only Nepali letters are allowed." });
          return;
        }
        if (parts.length !== 2) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Must be exactly 2 words (e.g., राम थापा)." });
        }
      }),

    father_citizenship_no: z.string().optional().default(""),
    father_citizenship_issued_district: z.string().optional().default(""),

    occupation: z.string().min(1, "Occupation is required"),
    industry: z.string().optional().default(""),

    politically_involved: z.boolean().default(false),
    party_inspection_category: z.string().default("Low"),
    risk_factors: z.string().default("1"),

    doc_type: z.enum(["citizenship", "passport", "nid"]).default("citizenship"),
  })
  .transform((v) => ({
    ...v,
    // normalize spaces for Nepali names so backend doesn't fail on double spaces
    father_name_nep: normalizeNepaliTwoWords(v.father_name_nep).cleaned,
    // optional: normalize tole_nep spaces
    tole_nep: String(v.tole_nep ?? "").replace(/\s+/g, " ").trim(),
  }));

/* =========================
   Prefill mappers (GET details)
========================= */
function mapApiToFormValues(api: any, fallback: KycFormValues): KycFormValues {
  const root = api?.data ?? api;
  const d = root?.kyc_detail ?? root?.kycDetail ?? root;

  const name = d?.customer_Name ?? {};
  const id = d?.identification ?? {};
  const info = d?.customerInformation ?? {};
  const addr = d?.address ?? {};
  const contact = d?.contact ?? {};
  const rel = d?.relation ?? {};

  return {
    ...fallback,

    honour: name?.honour ?? fallback.honour,
    gender: info?.gender ?? fallback.gender,

    first_name: name?.first_Name ?? fallback.first_name,
    middle_name: name?.middle_Name ?? fallback.middle_name,
    last_name: name?.last_Name ?? fallback.last_name,

    first_name_nep: name?.first_Name_nep ?? fallback.first_name_nep,
    middle_name_nep: name?.middle_Name_nep ?? fallback.middle_name_nep,
    last_name_nep: name?.last_Name_nep ?? fallback.last_name_nep,

    id_type: id?.id_Type ?? fallback.id_type,
    id_no: id?.id_No ?? fallback.id_no,
    issued_district: id?.issued_District ?? fallback.issued_district,

    issue_date_ad: id?.issue_Date_AD ?? fallback.issue_date_ad,
    issue_date_bs: id?.issue_Date_BS ?? fallback.issue_date_bs,

    dob_ad: info?.date_Of_Birth_AD ?? fallback.dob_ad,
    dob_bs: info?.date_Of_Birth_BS ?? fallback.dob_bs,

    mobile: contact?.mobile ?? fallback.mobile,
    email: contact?.email ?? fallback.email,

    province: addr?.province ?? fallback.province,
    district: addr?.district ?? fallback.district,
    local_level: addr?.local_level ?? fallback.local_level,
    ward_no: addr?.ward_No ?? fallback.ward_no,

    tole: addr?.tole ?? fallback.tole,
    tole_nep: addr?.tole_nep ?? fallback.tole_nep,

    residence_country: addr?.residence_Country ?? fallback.residence_country,

    temp_address: addr?.temporary_Address ?? fallback.temp_address,
    temp_address_nep: addr?.temporary_Address_nep ?? fallback.temp_address_nep,

    father_name: rel?.father_Name ?? fallback.father_name,
    father_name_nep: rel?.father_Name_nep ?? fallback.father_name_nep,
    father_citizenship_no: rel?.father_citizenship_no ?? fallback.father_citizenship_no,
    father_citizenship_issued_district:
      rel?.father_citizenship_issued_district ?? fallback.father_citizenship_issued_district,

    occupation: info?.occupation ?? fallback.occupation,
    industry: info?.sub_Occupation ?? fallback.industry,

    politically_involved: Boolean(d?.politically_involved ?? fallback.politically_involved),
    party_inspection_category: d?.party_inspection_category ?? fallback.party_inspection_category,
    risk_factors: d?.risk_factors ?? fallback.risk_factors,

    doc_type: (d?.doc_type as DocType) || fallback.doc_type,
  };
}

function mapApiToExistingImages(api: any) {
  const root = api?.data ?? api;
  const img = root?.kyc_detail?.customer_image ?? root?.customer_image ?? {};

  const existing: Record<string, string | undefined> = {};

  existing[PHOTO_KEY] = img?.image_name_profile || img?.image_profile || img?.image_name_profile;

  existing[CTZ_FRONT_KEY] = img?.ctz_name_front || img?.ctz_front || img?.ctz_image_front;
  existing[CTZ_BACK_KEY] = img?.ctz_name_back || img?.ctz_back || img?.ctz_image_back;

  existing[PASS_FRONT_KEY] = img?.passport_name_front || img?.passport_front || img?.passport_image_front;
  existing[PASS_BACK_KEY] = img?.passport_name_back || img?.passport_back || img?.passport_image_back;

  existing[NID_FRONT_KEY] = img?.nid_name_front || img?.nid_front || img?.nid_image_front;
  existing[NID_BACK_KEY] = img?.nid_name_back || img?.nid_back || img?.nid_image_back;

  existing[DL_FRONT_KEY] = img?.dl_name_front || img?.dl_front || img?.driving_license_front;
  existing[DL_BACK_KEY] = img?.dl_name_back || img?.dl_back || img?.driving_license_back;

  return existing;
}

export const KYCAdd = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const redirectTimerRef = useRef<number | null>(null);
  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) window.clearTimeout(redirectTimerRef.current);
    };
  }, []);

  const { minDobAD, maxDobAD } = useMemo(() => getDobMinMaxYMD(), []);

  const [banner, setBanner] = useState<BannerState>(null);

  const [statusText, setStatusText] = useState<string>("Unknown");
  const [statusLoading, setStatusLoading] = useState(false);

  const [prefillLoading, setPrefillLoading] = useState(false);
  const [existingImages, setExistingImages] = useState<Record<string, string | undefined>>({});

  const locked = isLockedByStatus(statusText);
  const formDisabled = locked || statusLoading || prefillLoading;

  const defaultValues: KycFormValues = {
    honour: "",
    gender: "",
    first_name: "",
    middle_name: "",
    last_name: "",
    first_name_nep: "",
    middle_name_nep: "",
    last_name_nep: "",
    id_type: "",
    id_no: "",
    issued_district: "",
    issue_date_ad: "",
    issue_date_bs: "",
    dob_ad: "",
    dob_bs: "",
    mobile: "",
    email: "",
    province: "",
    district: "",
    local_level: "",
    ward_no: "",
    tole: "",
    tole_nep: "", // ✅ optional
    residence_country: "NEPAL",
    temp_address: "",
    temp_address_nep: "",
    father_name: "",
    father_name_nep: "",
    father_citizenship_no: "",
    father_citizenship_issued_district: "",
    occupation: "",
    industry: "",
    politically_involved: false,
    party_inspection_category: "Low",
    risk_factors: "1",
    doc_type: "citizenship",
  };

  const {
    register,
    watch,
    setValue,
    setError,
    clearErrors,
    reset,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<KycFormValues>({
    resolver: zodResolver(kycFormSchema),
    mode: "onSubmit", // ✅ prevents random “some fields missing” alerts while typing
    defaultValues,
  });

  /* =========================
     1) KYC STATUS (alert rules)
========================= */
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setStatusLoading(true);
        const res: StatusApi = await kycStatus();
        const st = normalizeStatusText(res?.kyc_Status);
        if (!mounted) return;
        setStatusText(st);
        setBanner(buildStatusBanner(st));
      } catch {
        if (!mounted) return;
        setStatusText("Unknown");
        setBanner(null);
      } finally {
        if (mounted) setStatusLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  /* =========================
     2) GET DETAILS (prefill values/images)
     - if user is new this may fail; ignore silently
========================= */
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setPrefillLoading(true);
        const res = await kycRejectForm();
        const meta: DetailApi = (res?.data ?? res) as any;
        if (!mounted) return;

        const mapped = mapApiToFormValues(meta, defaultValues);

        // ✅ ALWAYS derive BS from AD to avoid mismatch
        if (mapped.issue_date_ad) {
          try {
            mapped.issue_date_bs = adIsoToBsYMD(mapped.issue_date_ad);
          } catch {}
        }
        if (mapped.dob_ad) {
          try {
            mapped.dob_bs = adIsoToBsYMD(mapped.dob_ad);
          } catch {}
        }

        reset(mapped, { keepDefaultValues: true });
        clearErrors();

        setExistingImages(mapApiToExistingImages(meta));
      } catch {
        // ignore
      } finally {
        if (mounted) setPrefillLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reset, clearErrors]);

  /* =========================
     Auto convert AD → BS
========================= */
  const dobAD = watch("dob_ad");
  const issueAD = watch("issue_date_ad");

  useEffect(() => {
    if (!dobAD) return setValue("dob_bs", "", { shouldValidate: true });
    try {
      setValue("dob_bs", adIsoToBsYMD(dobAD), { shouldValidate: true });
    } catch {
      setValue("dob_bs", "", { shouldValidate: true });
    }
  }, [dobAD, setValue]);

  useEffect(() => {
    if (!issueAD) return setValue("issue_date_bs", "", { shouldValidate: true });
    try {
      setValue("issue_date_bs", adIsoToBsYMD(issueAD), { shouldValidate: true });
    } catch {
      setValue("issue_date_bs", "", { shouldValidate: true });
    }
  }, [issueAD, setValue]);

  /* =========================
     Nepali typing helper (UI-only)
========================= */
  const [npErrors, setNpErrors] = useState<Record<string, string>>({});
  const setNpError = (key: string, message?: string) => {
    setNpErrors((prev) => {
      const next = { ...prev };
      if (!message) delete next[key];
      else next[key] = message;
      return next;
    });
  };

  const nepaliInputHandler =
    (key: string) => (e: React.FormEvent<HTMLInputElement>) => {
      const v = e.currentTarget.value;
      if (!isNepaliOnly(v)) setNpError(key, "कृपया केवल नेपाली अक्षरहरू प्रयोग गर्नुहोस्।");
      else setNpError(key, undefined);
    };

  /* =========================
     Upload state + validation
========================= */
  const [uploads, setUploads] = useState<Record<string, UploadItem | null>>({});
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const openPicker = (key: string) => {
    if (formDisabled) return;
    inputRefs.current[key]?.click();
  };

  const setUploadError = (key: string, message?: string) => {
    setUploadErrors((prev) => {
      const next = { ...prev };
      if (!message) delete next[key];
      else next[key] = message;
      return next;
    });
  };

  const cleanupPreview = (key: string) => {
    const item = uploads[key];
    if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
  };

  const cleanupAllPreviews = () => {
    Object.values(uploads).forEach((u) => u?.previewUrl && URL.revokeObjectURL(u.previewUrl));
  };

  useEffect(() => {
    return () => cleanupAllPreviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const acceptFile = (key: string, file: File) => {
    if (!ALLOWED_MIME.includes(file.type)) {
      setUploadError(key, "Please select a valid image file (PNG or JPG/JPEG).");
      return;
    }
    const sizeMb = file.size / (1024 * 1024);
    if (sizeMb > MAX_FILE_MB) {
      setUploadError(key, `File is too large (${sizeMb.toFixed(2)} MB). Max ${MAX_FILE_MB} MB.`);
      return;
    }

    setUploadError(key, undefined);
    cleanupPreview(key);

    const previewUrl = URL.createObjectURL(file);
    setUploads((prev) => ({ ...prev, [key]: { file, previewUrl } }));
  };

  const onFileChange =
    (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      acceptFile(key, file);
      e.target.value = "";
    };

  const removeFile = (key: string) => {
    cleanupPreview(key);
    setUploads((prev) => ({ ...prev, [key]: null }));
    setUploadError(key, undefined);
  };

  const onDropFile =
    (key: string) => (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (formDisabled) return;
      const file = e.dataTransfer.files?.[0];
      if (!file) return;
      acceptFile(key, file);
    };

  const isRequiredDocKey = (k: string) => k === PHOTO_KEY || k === CTZ_FRONT_KEY || k === CTZ_BACK_KEY;

  /* =========================
     API error -> field mapper
     ✅ includes Father_Name_nep error
========================= */
  const applyApiErrorsToFields = (list: ApiErrorItem[] | undefined) => {
    if (!list?.length) return false;
    let mappedAny = false;

    for (const item of list) {
      const raw = item?.error_message || "";
      const msg = raw.toLowerCase();

      // common fields
      if (msg.includes("mobile")) {
        setError("mobile", { type: "server", message: raw });
        mappedAny = true;
        continue;
      }
      if (msg.includes("email")) {
        setError("email", { type: "server", message: raw });
        mappedAny = true;
        continue;
      }
      if (msg.includes("father_name_nep") || msg.includes("father_name_nep".replace("_", "")) || msg.includes("relation.father_name_nep")) {
        setError("father_name_nep", { type: "server", message: raw });
        mappedAny = true;
        continue;
      }

      // doc errors (backend messages vary)
      if (msg.includes("customer_image.image_profile")) {
        setUploadError(PHOTO_KEY, raw);
        mappedAny = true;
        continue;
      }
      if (msg.includes("customer_image.ctz_image_front")) {
        setUploadError(CTZ_FRONT_KEY, raw);
        mappedAny = true;
        continue;
      }
      if (msg.includes("customer_image.ctz_image_back")) {
        setUploadError(CTZ_BACK_KEY, raw);
        mappedAny = true;
        continue;
      }
    }

    return mappedAny;
  };

  const clearFormAfterSuccess = () => {
    cleanupAllPreviews();
    setUploads({});
    setUploadErrors({});
    setNpErrors({});
    clearErrors();
    reset(defaultValues);
  };

  /* =========================
     Submit
========================= */
  const onValidSubmit = async (values: KycFormValues) => {
    setBanner(null);

    if (locked) {
      setBanner({
        type: "info",
        title: "Submission locked",
        message: "You cannot submit while your KYC is under review or already approved.",
      });
      return;
    }

    // UI-only Nepali typing errors
    if (Object.keys(npErrors).length) {
      setBanner({ type: "error", title: "Validation error", message: "कृपया नेपाली फिल्डहरू सही गर्नुहोस्।" });
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // ✅ Required docs: profile + citizenship front/back
    const requiredDocKeys = [PHOTO_KEY, CTZ_FRONT_KEY, CTZ_BACK_KEY] as const;
    let docOk = true;

    for (const k of requiredDocKeys) {
      const hasNew = Boolean(uploads[k]?.file);
      const hasOld = Boolean(existingImages[k]);
      if (!hasNew && !hasOld) {
        setUploadError(k, "This document is required.");
        docOk = false;
      }
    }

    if (!docOk) {
      setBanner({ type: "error", title: "Upload error", message: "Please upload the required documents." });
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (Object.keys(uploadErrors).length) {
      setBanner({ type: "error", title: "Upload error", message: "Please fix document upload errors." });
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setBanner({ type: "info", title: "Submitting…", message: "Submitting your KYC. Please wait." });
    window.scrollTo({ top: 0, behavior: "smooth" });

    const payload: CustomerKycFormEntity = {
      honour: values.honour,

      first_name_nep: values.first_name_nep,
      middle_name_nep: values.middle_name_nep || "",
      last_name_nep: values.last_name_nep,

      first_name_eng: values.first_name,
      middle_name_eng: values.middle_name || "",
      last_name_eng: values.last_name,

      id_type: values.id_type,
      id_no: values.id_no,
      issued_district: values.issued_district,

      issue_date_ad: values.issue_date_ad || "",
      issue_date_bs: values.issue_date_bs || "",

      province: values.province,
      district: values.district,
      local_level: values.local_level,
      ward_no: values.ward_no,

      residence_country: values.residence_country || "NEPAL",
      mobile: values.mobile,
      email: values.email || "",

      father_name: values.father_name,
      father_name_nep: values.father_name_nep, // ✅ already normalized + validated (2 words)
      father_citizenship_no: values.father_citizenship_no || "",
      father_citizenship_issued_district: values.father_citizenship_issued_district || "",

      gender: values.gender,
      dob_ad: values.dob_ad,
      dob_bs: values.dob_bs || "",

      occupation: values.occupation || "",
      politically_involved: Boolean(values.politically_involved),
      party_inspection_category: values.party_inspection_category,
      risk_factors: values.risk_factors,

      doc_type: values.doc_type as DocType,

      // ✅ OPTIONAL field: send null/empty if not provided (backend-friendly)
      // If your API supports tole_nep separately, include it in your customerKycClient mapping.
      // (If your CustomerKycFormEntity has tole_nep, add it there too.)
      // tole_nep: values.tole_nep?.trim() ? values.tole_nep.trim() : null,

      // docs
      image_profile: uploads[PHOTO_KEY]?.file ?? null,
      ctz_front: uploads[CTZ_FRONT_KEY]?.file ?? null,
      ctz_back: uploads[CTZ_BACK_KEY]?.file ?? null,

      passport_front: uploads[PASS_FRONT_KEY]?.file ?? null,
      passport_back: uploads[PASS_BACK_KEY]?.file ?? null,
      nid_front: uploads[NID_FRONT_KEY]?.file ?? null,
      nid_back: uploads[NID_BACK_KEY]?.file ?? null,
    };

    try {
      const result = await submitCustomerKyc(payload, { debug: true });

      setBanner({
        type: "success",
        title: "Submitted successfully",
        message: result?.data?.message || "Your KYC has been submitted and is under review.",
      });

      clearFormAfterSuccess();

      if (redirectTimerRef.current) window.clearTimeout(redirectTimerRef.current);
      redirectTimerRef.current = window.setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 3000);
    } catch (e: any) {
      const apiErrorList: ApiErrorItem[] | undefined =
        e?.debug?.response_json?.error_list || e?.response?.data?.error_list;

      const genericMsg =
        apiErrorList?.[0]?.error_message ||
        e?.debug?.response_json?.message ||
        e?.message ||
        "KYC submission failed";

      applyApiErrorsToFields(apiErrorList);

      setBanner({
        type: "error",
        title: "Submission failed",
        message: genericMsg,
        debug: e?.debug,
      });
    } finally {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const onInvalidSubmit = () => {
    setBanner({
      type: "error",
      title: "Please fix the highlighted errors",
      message: "Some required fields are missing or invalid.",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const BannerIcon = banner?.type === "success" ? CheckCircle2 : banner?.type === "error" ? AlertCircle : Info;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />

        <main className="flex-1 p-6 md:p-8 bg-background">
          <form onSubmit={handleSubmit(onValidSubmit, onInvalidSubmit)} className="space-y-8">
            {/* ✅ alert rules applied here */}
            {banner && (
              <Alert
                className={
                  banner.type === "success"
                    ? "border-green-200 bg-green-50"
                    : banner.type === "error"
                      ? "border-red-200 bg-red-50"
                      : "border-blue-200 bg-blue-50"
                }
              >
                <div className="flex items-start gap-2">
                  <BannerIcon className="h-5 w-5 mt-0.5" />
                  <div className="w-full">
                    <AlertTitle className="font-semibold">{banner.title}</AlertTitle>
                    <AlertDescription className={`mt-1 text-sm ${banner.type === "error" ? "text-red-700" : ""}`}>
                      {banner.message}
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            )}

            {/* BASIC INFO */}
            <div>
              <h3 className="text-lg font-semibold mb-4">{t("kycAdd.basicInfo")}</h3>
              <div className={`grid md:grid-cols-3 gap-4 ${formDisabled ? "opacity-60 pointer-events-none" : ""}`}>
                <div>
                  <Honour
                    label={`${t("kycAdd.honour") || "Honour"} *`}
                    value={watch("honour")}
                    onChange={(v) => setValue("honour", v, { shouldValidate: true, shouldDirty: true })}
                  />
                  {errors.honour && <p className="text-xs text-red-500 mt-1">{errors.honour.message}</p>}
                </div>

                <div>
                  <Gender
                    label={`${t("kycAdd.gender") || "Gender"} *`}
                    value={watch("gender")}
                    onChange={(v) => setValue("gender", v, { shouldValidate: true, shouldDirty: true })}
                  />
                  {errors.gender && <p className="text-xs text-red-500 mt-1">{errors.gender.message}</p>}
                </div>

                <div />

                <div>
                  <Label>First Name (English) *</Label>
                  <Input className="mt-2" {...register("first_name")} />
                  {errors.first_name && <p className="text-xs text-red-500 mt-1">{errors.first_name.message}</p>}
                </div>

                <div>
                  <Label>Middle Name (English)</Label>
                  <Input className="mt-2" {...register("middle_name")} placeholder="optional" />
                </div>

                <div>
                  <Label>Last Name (English) *</Label>
                  <Input className="mt-2" {...register("last_name")} />
                  {errors.last_name && <p className="text-xs text-red-500 mt-1">{errors.last_name.message}</p>}
                </div>

                <div>
                  <Label>पहिलो नाम (नेपाली) *</Label>
                  <Input className="mt-2" {...register("first_name_nep")} onInput={nepaliInputHandler("first_name_nep")} />
                  {(errors.first_name_nep || npErrors.first_name_nep) && (
                    <p className="text-xs text-red-500 mt-1">{errors.first_name_nep?.message || npErrors.first_name_nep}</p>
                  )}
                </div>

                <div>
                  <Label>बीचको नाम (नेपाली)</Label>
                  <Input className="mt-2" {...register("middle_name_nep")} onInput={nepaliInputHandler("middle_name_nep")} placeholder="optional" />
                  {(errors.middle_name_nep || npErrors.middle_name_nep) && (
                    <p className="text-xs text-red-500 mt-1">{errors.middle_name_nep?.message || npErrors.middle_name_nep}</p>
                  )}
                </div>

                <div>
                  <Label>थर (नेपाली) *</Label>
                  <Input className="mt-2" {...register("last_name_nep")} onInput={nepaliInputHandler("last_name_nep")} />
                  {(errors.last_name_nep || npErrors.last_name_nep) && (
                    <p className="text-xs text-red-500 mt-1">{errors.last_name_nep?.message || npErrors.last_name_nep}</p>
                  )}
                </div>
              </div>
            </div>

            {/* IDENTIFICATION */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Identification</h3>
              <div className={`grid md:grid-cols-3 gap-4 ${formDisabled ? "opacity-60 pointer-events-none" : ""}`}>
                <div>
                  <IdentificationType
                    label="Identification Type *"
                    value={watch("id_type")}
                    onChange={(v) => setValue("id_type", v, { shouldValidate: true, shouldDirty: true })}
                  />
                  {errors.id_type && <p className="text-xs text-red-500 mt-1">{errors.id_type.message}</p>}
                </div>

                <div>
                  <Label>ID Number *</Label>
                  <Input className={`mt-2 ${errors.id_no ? "border-red-500 focus-visible:ring-red-500" : ""}`} {...register("id_no")} />
                  {errors.id_no && <p className="text-xs text-red-500 mt-1">{errors.id_no.message}</p>}
                </div>

                <div>
                  <Label>Issued District *</Label>
                  <Input className="mt-2" {...register("issued_district")} />
                  {errors.issued_district && <p className="text-xs text-red-500 mt-1">{errors.issued_district.message}</p>}
                </div>

                <div>
                  <Label>Issue Date (A.D) *</Label>
                  <Input type="date" className="mt-2" {...register("issue_date_ad")} />
                  {errors.issue_date_ad && <p className="text-xs text-red-500 mt-1">{errors.issue_date_ad.message}</p>}
                </div>

                <div>
                  <Label>Issue Date (B.S)</Label>
                  <Input className="mt-2" readOnly {...register("issue_date_bs")} placeholder="Auto from A.D" />
                  {errors.issue_date_bs && <p className="text-xs text-red-500 mt-1">{errors.issue_date_bs.message}</p>}
                </div>
              </div>
            </div>

            {/* CONTACT + DOB */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact & DOB</h3>
              <div className={`grid md:grid-cols-3 gap-4 ${formDisabled ? "opacity-60 pointer-events-none" : ""}`}>
                <div>
                  <Label>Mobile No *</Label>
                  <Input
                    className={`mt-2 ${errors.mobile ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                    inputMode="numeric"
                    {...register("mobile", { setValueAs: (v) => String(v ?? "").replace(/\D/g, "").slice(0, 10) })}
                  />
                  {errors.mobile && <p className="text-xs text-red-500 mt-1">{errors.mobile.message}</p>}
                </div>

                <div>
                  <Label>Email *</Label>
                  <Input type="email" className={`mt-2 ${errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}`} {...register("email")} />
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
                </div>

                <div>
                  <Label>Date of Birth (A.D) *</Label>
                  <Input type="date" className="mt-2" min={minDobAD} max={maxDobAD} {...register("dob_ad")} />
                  {errors.dob_ad && <p className="text-xs text-red-500 mt-1">{errors.dob_ad.message}</p>}
                </div>

                <div>
                  <Label>Date of Birth (B.S)</Label>
                  <Input className="mt-2" readOnly {...register("dob_bs")} />
                  {errors.dob_bs && <p className="text-xs text-red-500 mt-1">{errors.dob_bs.message}</p>}
                </div>
              </div>
            </div>

            {/* PERMANENT ADDRESS */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Permanent Address</h3>
              <div className={`${formDisabled ? "opacity-60 pointer-events-none" : ""}`}>
                <div className="grid md:grid-cols-3 gap-4">
                  <ProvinceDistrictMunicipality
                    value={{ province: watch("province"), district: watch("district"), local_level: watch("local_level") }}
                    onChange={(v) => {
                      setValue("province", v.province, { shouldValidate: true, shouldDirty: true });
                      setValue("district", v.district, { shouldValidate: true, shouldDirty: true });
                      setValue("local_level", v.local_level, { shouldValidate: true, shouldDirty: true });
                    }}
                  />

                  <div className="md:col-span-3 -mt-3">
                    {(errors.province || errors.district || errors.local_level) && (
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>{errors.province && <p className="text-xs text-red-500">{errors.province.message}</p>}</div>
                        <div>{errors.district && <p className="text-xs text-red-500">{errors.district.message}</p>}</div>
                        <div>{errors.local_level && <p className="text-xs text-red-500">{errors.local_level.message}</p>}</div>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label>Tole *</Label>
                    <Input className="mt-2" {...register("tole")} />
                    {errors.tole && <p className="text-xs text-red-500 mt-1">{errors.tole.message}</p>}
                  </div>

                  <div>
                    <Label>टोल (नेपालीमा) (Optional)</Label>
                    <Input className="mt-2" {...register("tole_nep")} onInput={nepaliInputHandler("tole_nep")} />
                    {(errors.tole_nep || npErrors.tole_nep) && (
                      <p className="text-xs text-red-500 mt-1">{errors.tole_nep?.message || npErrors.tole_nep}</p>
                    )}
                  </div>

                  <div>
                    <Label>Ward No *</Label>
                    <Input className="mt-2" inputMode="numeric" {...register("ward_no", { setValueAs: (v) => String(v ?? "").replace(/\D/g, "") })} />
                    {errors.ward_no && <p className="text-xs text-red-500 mt-1">{errors.ward_no.message}</p>}
                  </div>

                  <div>
                    <Label>Residence Country *</Label>
                    <Input className="mt-2" {...register("residence_country")} />
                    {errors.residence_country && <p className="text-xs text-red-500 mt-1">{errors.residence_country.message}</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* RELATION + OCCUPATION */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Relation</h3>
              <div className={`grid md:grid-cols-3 gap-4 ${formDisabled ? "opacity-60 pointer-events-none" : ""}`}>
                <div>
                  <Label>Father Name *</Label>
                  <Input className="mt-2" {...register("father_name")} />
                  {errors.father_name && <p className="text-xs text-red-500 mt-1">{errors.father_name.message}</p>}
                </div>

                <div>
                  <Label>Father Name (नेपाली) * (2 words)</Label>
                  <Input
                    className="mt-2"
                    {...register("father_name_nep", {
                      setValueAs: (v) => normalizeNepaliTwoWords(String(v ?? "")).cleaned,
                    })}
                    onBlur={(e) => {
                      const cleaned = normalizeNepaliTwoWords(e.target.value).cleaned;
                      setValue("father_name_nep", cleaned, { shouldValidate: true, shouldDirty: true });
                    }}
                    onInput={nepaliInputHandler("father_name_nep")}
                  />
                  {(errors.father_name_nep || npErrors.father_name_nep) && (
                    <p className="text-xs text-red-500 mt-1">{errors.father_name_nep?.message || npErrors.father_name_nep}</p>
                  )}
                </div>

                <div>
                  <Label>Father Citizenship No (Optional)</Label>
                  <Input className="mt-2" {...register("father_citizenship_no")} placeholder="optional" />
                </div>

                <div>
                  <Label>Father Citizenship Issued District (Optional)</Label>
                  <Input className="mt-2" {...register("father_citizenship_issued_district")} placeholder="optional" />
                </div>

                <div>
                  <Occupation
                    value={watch("occupation")}
                    onChange={(v) => setValue("occupation", v, { shouldDirty: true, shouldValidate: true })}
                  />
                  {errors.occupation && <p className="text-xs text-red-500 mt-1">{errors.occupation.message}</p>}
                </div>

                <div>
                  <Label>Industry (Optional)</Label>
                  <Input className="mt-2" {...register("industry")} placeholder="optional" />
                </div>
              </div>
            </div>

            {/* COMPLIANCE */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Compliance & Risk</h3>
              <div className={`grid md:grid-cols-2 gap-4 ${formDisabled ? "opacity-60 pointer-events-none" : ""}`}>
                <div className="flex items-center gap-2 mt-2">
                  <Checkbox
                    id="politically_involved"
                    checked={!!watch("politically_involved")}
                    onCheckedChange={(v) => setValue("politically_involved", v === true, { shouldDirty: true, shouldValidate: true })}
                  />
                  <Label htmlFor="politically_involved" className="cursor-pointer select-none">
                    Politically Involved?
                  </Label>
                </div>

                <div>
                  <Label>Document Type</Label>
                  <Select
                    value={watch("doc_type")}
                    onValueChange={(v) => setValue("doc_type", v as DocType, { shouldDirty: true, shouldValidate: true })}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="citizenship">Citizenship</SelectItem>
                      <SelectItem value="passport">Passport</SelectItem>
                      <SelectItem value="nid">NID</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.doc_type && <p className="text-xs text-red-500 mt-1">{errors.doc_type.message}</p>}
                </div>
              </div>
            </div>

            {/* UPLOADS */}
            <div>
              <h3 className="text-lg font-semibold mb-2">{t("kycAdd.attachments")}</h3>
              <p className="text-sm text-muted-foreground">
                {locked
                  ? "Uploads are locked while your KYC is under review/approved."
                  : "Required: Photo + Citizenship Front/Back. Others are optional."}
              </p>

              <div className={`space-y-4 mt-4 ${formDisabled ? "opacity-60 pointer-events-none" : ""}`}>
                {attachments.map((attachmentKey) => {
                  const item = uploads[attachmentKey] ?? null;
                  const err = uploadErrors[attachmentKey];
                  const existingUrl = existingImages[attachmentKey];

                  return (
                    <div key={attachmentKey} className="rounded-lg border p-4">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium">{attachmentKey}</p>
                          <p className="text-xs text-muted-foreground">PNG / JPG / JPEG (Max {MAX_FILE_MB}MB)</p>
                        </div>

                        <input
                          ref={(el) => (inputRefs.current[attachmentKey] = el)}
                          type="file"
                          accept="image/png,image/jpeg"
                          className="hidden"
                          onChange={onFileChange(attachmentKey)}
                        />

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-2 text-orange-500 border-orange-200 hover:bg-orange-50 w-fit"
                          onClick={() => openPicker(attachmentKey)}
                        >
                          <Upload className="w-4 h-4" />
                          {item ? "Change file" : existingUrl ? "Replace file" : "Click to upload"}
                        </Button>
                      </div>

                      <div
                        className="mt-3 rounded-lg border-2 border-dashed p-3 cursor-pointer hover:bg-muted/30 transition"
                        onClick={() => openPicker(attachmentKey)}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onDrop={onDropFile(attachmentKey)}
                        role="button"
                        tabIndex={0}
                      >
                        {!item ? (
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">Drop file here</p>
                              <p className="text-xs text-muted-foreground">
                                {existingUrl ? "Existing image loaded from API" : "or click to upload"}
                              </p>
                            </div>
                            <Upload className="h-5 w-5 text-muted-foreground" />
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <img src={item.previewUrl} alt="preview" className="h-16 w-16 rounded-md object-cover border" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{item.file.name}</p>
                              <p className="text-xs text-muted-foreground">{(item.file.size / (1024 * 1024)).toFixed(2)} MB</p>
                            </div>

                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                removeFile(attachmentKey);
                              }}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Remove
                            </Button>
                          </div>
                        )}

                        {!item && existingUrl && (
                          <div className="mt-3 flex items-center gap-3">
                            <img src={existingUrl} alt="api-existing" className="h-16 w-16 rounded-md object-cover border" />
                            <div className="text-xs text-muted-foreground break-all">Existing from API</div>
                          </div>
                        )}
                      </div>

                      {err && <p className="text-xs text-red-500 mt-2">{err}</p>}

                      {isRequiredDocKey(attachmentKey) && !uploads[attachmentKey]?.file && !existingImages[attachmentKey] && (
                        <p className="text-xs text-muted-foreground mt-2">This document is required.</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ✅ hide submit when Pending/Approved/Verified */}
            {!locked && (
              <div className="flex justify-end">
                <Button type="submit" size="lg" className="bg-primary hover:bg-primary/90" disabled={isSubmitting || statusLoading || prefillLoading}>
                  {isSubmitting ? "Submitting..." : t("common.submit")}
                </Button>
              </div>
            )}
          </form>
        </main>
      </div>
    </div>
  );
};
