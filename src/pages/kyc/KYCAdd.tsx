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

import { Upload, X, AlertCircle, CheckCircle2, Info, FileImage } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// catalogue components
import { ProvinceDistrictMunicipality } from "./getcatalogue/ProvinceDistrictMunicipality";
import { Gender } from "./getcatalogue/Gender";
import { Honour } from "./getcatalogue/Honour";
import { IdentificationType } from "./getcatalogue/IdentificationType";
import { Occupation } from "./getcatalogue/Occupation";
import { NEPAL_DISTRICTS_77 } from "@/lib/district";
// schema + helpers
import {
  kycSchema,
  type KycFormValues,
  type OptionalDocType,
  getDobMinMaxYMD,
  adIsoToBsYMD,
  normalizeSpaces,
} from "@/zod/kycSchema";
// API
import { submitCustomerKyc, type CustomerKycFormEntity } from "@/api/kyc/customerKycClient";
import { kycStatus } from "@/api/kyc/kycStatus";
import { kycRejectForm } from "@/api/kyc/kycRejectForm";
import { getUserInfo } from "@/api/userInfo/homePageIngo";
import { UsersInfo } from "@/types/gotohome";

import type {
  BannerState,
  ApiErrorItem,
  KycNote,
  StatusApi,
  DetailApi,
  UploadItem,
} from "@/types/types";
import {
  normalizeStatusText,
  buildStatusBanner,
  isLockedByStatus,
  mapApiToFormValues,
  mapApiToExistingImages,
} from "@/utils/addKyc";
 export const  KYCAdd = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const ALLOWED_MIME = ["image/png", "image/jpeg"];
const MAX_FILE_MB = 1;

/** REQUIRED */
const PHOTO_KEY = "Photo *";
const CTZ_FRONT_KEY = "Citizenship / Front *";
const CTZ_BACK_KEY = "Citizenship / Back *";

/** optional (will show only when checkbox + dropdown selected) */
const PASS_FRONT_KEY = "Passport / Front (Optional)";
const PASS_BACK_KEY = "Passport / Back (Optional)";
const NID_FRONT_KEY = "NID / Front (Optional)";
const NID_BACK_KEY = "NID / Back (Optional)";
const DL_FRONT_KEY = "Driving License / Front (Optional)";
const DL_BACK_KEY = "Driving License / Back (Optional)";

const REQUIRED_ATTACHMENTS = [PHOTO_KEY, CTZ_FRONT_KEY, CTZ_BACK_KEY] as const;

  const redirectTimerRef = useRef<number | null>(null);
  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) window.clearTimeout(redirectTimerRef.current);
    };
  }, []);

  const { minDobAD, maxDobAD } = useMemo(() => getDobMinMaxYMD(), []);

  const [banner, setBanner] = useState<BannerState>(null);

  const [statusText, setStatusText] = useState<string>("Unknown");
  const [statusNotes, setStatusNotes] = useState<KycNote[]>([]);
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

    id_type: "Citizenship",
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
    tole_nep: "",

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

    add_optional_docs: false,
    optional_doc_type: undefined,
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
    resolver: zodResolver(kycSchema),
    mode: "onSubmit",
    defaultValues,
  });

  // watch optional doc controls
  const addOptionalDocs = !!watch("add_optional_docs");
  const optionalDocType = watch("optional_doc_type");

  /* =========================
     1) KYC STATUS (alert rules) + NOTE LIST
========================= */
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setStatusLoading(true);
        const res: StatusApi = await kycStatus();

        const st = normalizeStatusText(res?.kyc_Status);
        const notes = Array.isArray(res?.note_List) ? res.note_List : [];

        if (!mounted) return;
        setStatusText(st);
        setBanner(buildStatusBanner(st));
        setStatusNotes(notes);
      } catch {
        if (!mounted) return;
        setStatusText("Unknown");
        setBanner(null);
        setStatusNotes([]);
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

        // ALWAYS derive BS from AD to avoid mismatch
        if (mapped.issue_date_ad) {
          try {
            mapped.issue_date_bs = adIsoToBsYMD(mapped.issue_date_ad);
          } catch { }
        }
        if (mapped.dob_ad) {
          try {
            mapped.dob_bs = adIsoToBsYMD(mapped.dob_ad);
          } catch { }
        }

        // normalize father_name_nep spaces
        mapped.father_name_nep = normalizeSpaces(mapped.father_name_nep);

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
     Upload state + validation
========================= */
  const [uploads, setUploads] = useState<Record<string, UploadItem | null>>({});
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

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

  const openPicker = (key: string) => {
    if (formDisabled) return;
    inputRefs.current[key]?.click();
  };

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
========================= */
  const applyApiErrorsToFields = (list: ApiErrorItem[] | undefined) => {
    if (!list?.length) return false;
    let mappedAny = false;

    for (const item of list) {
      const raw = item?.error_message || "";
      const msg = raw.toLowerCase();

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
      if (msg.includes("father_name_nep") || msg.includes("relation.father_name_nep")) {
        setError("father_name_nep", { type: "server", message: raw });
        mappedAny = true;
        continue;
      }

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
    clearErrors();
    reset(defaultValues);
  };

  /* =========================
     Visible attachments (Required + Optional by dropdown)
========================= */
  const visibleAttachments = useMemo(() => {
    const base = [...REQUIRED_ATTACHMENTS] as string[];

    if (!addOptionalDocs) return base;
    if (!optionalDocType) return base;

    if (optionalDocType === "passport") return [...base, PASS_FRONT_KEY, PASS_BACK_KEY];
    if (optionalDocType === "nid") return [...base, NID_FRONT_KEY, NID_BACK_KEY];
    if (optionalDocType === "driving_license") return [...base, DL_FRONT_KEY, DL_BACK_KEY];

    return base;
  }, [addOptionalDocs, optionalDocType]);

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

    // Required docs
    let docOk = true;

    for (const k of REQUIRED_ATTACHMENTS) {
      const hasNew = Boolean(uploads[k]?.file);
      const hasOld = Boolean(existingImages[k]);
      if (!hasNew && !hasOld) {
        setUploadError(k, "This document is required.");
        docOk = false;
      }
    }

    // Optional docs become REQUIRED only if user enabled optional-docs checkbox
    if (values.add_optional_docs && values.optional_doc_type) {
      const requiredOptKeys =
        values.optional_doc_type === "passport"
          ? [PASS_FRONT_KEY, PASS_BACK_KEY]
          : values.optional_doc_type === "nid"
            ? [NID_FRONT_KEY, NID_BACK_KEY]
            : [DL_FRONT_KEY, DL_BACK_KEY];

      for (const k of requiredOptKeys) {
        const hasNew = Boolean(uploads[k]?.file);
        const hasOld = Boolean(existingImages[k]);
        if (!hasNew && !hasOld) {
          setUploadError(k, "This document is required when optional documents are enabled.");
          docOk = false;
        }
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

    // Keep payload type-safe but allow extra optional doc fields
    const payload: CustomerKycFormEntity & {
      dl_front?: File | null;
      dl_back?: File | null;
    } = {
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

      tole: values.tole,
      // if your API supports tole_nep, add it in CustomerKycFormEntity and send it:
      // tole_nep: values.tole_nep?.trim() || "",

      residence_country: values.residence_country || "NEPAL",
      mobile: values.mobile,
      email: values.email || "",

      father_name: values.father_name,
      father_name_nep: normalizeSpaces(values.father_name_nep),

      father_citizenship_no: values.father_citizenship_no || "",
      father_citizenship_issued_district: values.father_citizenship_issued_district || "",

      gender: values.gender,
      dob_ad: values.dob_ad,
      dob_bs: values.dob_bs || "",

      occupation: values.occupation || "",
      politically_involved: Boolean(values.politically_involved),
      party_inspection_category: values.party_inspection_category,
      risk_factors: values.risk_factors,

      doc_type: values.doc_type,

      // docs
      image_profile: uploads[PHOTO_KEY]?.file ?? null,
      ctz_front: uploads[CTZ_FRONT_KEY]?.file ?? null,
      ctz_back: uploads[CTZ_BACK_KEY]?.file ?? null,

      passport_front: uploads[PASS_FRONT_KEY]?.file ?? null,
      passport_back: uploads[PASS_BACK_KEY]?.file ?? null,

      nid_front: uploads[NID_FRONT_KEY]?.file ?? null,
      nid_back: uploads[NID_BACK_KEY]?.file ?? null,

      // optional if your backend supports
      dl_front: uploads[DL_FRONT_KEY]?.file ?? null,
      dl_back: uploads[DL_BACK_KEY]?.file ?? null,
    };

    try {
      const result = await submitCustomerKyc(payload, { debug: true });

      const successMsg = result?.data?.message || "Your KYC has been submitted and is under review.";
      setBanner({ type: "success", title: "Submitted successfully", message: successMsg });
      toast.success(successMsg);

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

      toast.error(genericMsg);
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
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
 const [userData, setUserData] = useState<UsersInfo | null>(null);

  /* =========================
     3) GET USER INFO (prefill user details)
========================= */
useEffect(() => {
  let mounted = true;

  const fetchUserInfo = async () => {
    try {
      const data = await getUserInfo();
      
      if (!mounted || !data) return;

      console.log("User Info Data:", data);
      setUserData(data);

      // Update form fields with user data
      // Only set if fields are empty (don't override existing KYC data)
      
      if (data.customer_first_name && !watch("first_name")) {
        setValue("first_name", data.customer_first_name, { shouldValidate: true });
      }
      
      if (data.customer_middle_name && !watch("middle_name")) {
        setValue("middle_name", data.customer_middle_name, { shouldValidate: true });
      }
      
      if (data.customer_last_name && !watch("last_name")) {
        setValue("last_name", data.customer_last_name, { shouldValidate: true });
      }

      // Nepali names
      if (data.customer_first_name_nep && !watch("first_name_nep")) {
        setValue("first_name_nep", data.customer_first_name_nep, { shouldValidate: true });
      }
      
      if (data.customer_middle_name_nep && !watch("middle_name_nep")) {
        setValue("middle_name_nep", data.customer_middle_name_nep, { shouldValidate: true });
      }
      
      if (data.customer_last_name_nep && !watch("last_name_nep")) {
        setValue("last_name_nep", data.customer_last_name_nep, { shouldValidate: true });
      }

      // Contact info
      if (data.mobile_no && !watch("mobile")) {
        setValue("mobile", data.mobile_no, { shouldValidate: true });
      }
      

    } catch (error) {
      console.error("Failed to fetch user info:", error);
    }
  };

  fetchUserInfo();

  return () => {
    mounted = false;
  };
}, [setValue, watch]); // Dependencies

  return (
    <div className="flex min-h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-6 md:p-8 bg-background">
          <form onSubmit={handleSubmit(onValidSubmit, onInvalidSubmit)} className="space-y-8">
            {/*  alert rules applied here */}
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

            {/*  show API note_List */}
            {!!statusNotes.length && (
              <div className="rounded-lg border p-4 bg-muted/20">
                <div className="font-semibold mb-2">KYC Notes</div>
                <div className="space-y-2">
                  {statusNotes
                    .slice()
                    .reverse()
                    .map((n, idx) => (
                      <div key={idx} className="rounded-md border bg-white p-3">
                        <div className="text-sm font-medium">{n.note_Type || "Note"}</div>
                        <div className="text-sm text-muted-foreground mt-1">{n.comments || "-"}</div>
                        <div className="text-xs text-muted-foreground mt-2">{n.date_Posted || "-"}</div>
                      </div>
                    ))}
                </div>
              </div>
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
                  <Input className="mt-2" {...register("first_name_nep")} />
                  {errors.first_name_nep && <p className="text-xs text-red-500 mt-1">{errors.first_name_nep.message}</p>}
                </div>

                <div>
                  <Label>बीचको नाम (नेपाली)</Label>
                  <Input className="mt-2" {...register("middle_name_nep")} placeholder="optional" />
                  {errors.middle_name_nep && <p className="text-xs text-red-500 mt-1">{errors.middle_name_nep.message}</p>}
                </div>

                <div>
                  <Label>थर (नेपाली) *</Label>
                  <Input className="mt-2" {...register("last_name_nep")} />
                  {errors.last_name_nep && <p className="text-xs text-red-500 mt-1">{errors.last_name_nep.message}</p>}
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

                {/*  Replace your Issued District input with this */}
                <div>
                  <Label>Issued District *</Label>

                  <Select
                    value={watch("issued_district") || ""}
                    onValueChange={(v) =>
                      setValue("issued_district", v, { shouldValidate: true, shouldDirty: true })
                    }
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select district" />
                    </SelectTrigger>

                    <SelectContent className="max-h-72">
                      {NEPAL_DISTRICTS_77.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {errors.issued_district && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.issued_district.message}
                    </p>
                  )}
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
                    {...register("mobile", { setValueAs: (v) => String(v ?? "").replace(/\D/g, "").slice(0, 10) })} readOnly
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
                    <Input className="mt-2" {...register("tole_nep")} />
                    {errors.tole_nep && <p className="text-xs text-red-500 mt-1">{errors.tole_nep.message}</p>}
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
                      setValueAs: (v) => normalizeSpaces(String(v ?? "")),
                    })}
                  />
                  {errors.father_name_nep && <p className="text-xs text-red-500 mt-1">{errors.father_name_nep.message}</p>}
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
                  <Occupation value={watch("occupation")} onChange={(v) => setValue("occupation", v, { shouldDirty: true, shouldValidate: true })} />
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
                  <Select value={watch("doc_type")} onValueChange={(v) => setValue("doc_type", v as any, { shouldDirty: true, shouldValidate: true })}>
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
                {locked ? "Uploads are locked while your KYC is under review/approved." : "Required: Photo + Citizenship Front/Back."}
              </p>

              {/* hidden register so zod can validate these fields */}
              <input type="hidden" {...register("add_optional_docs")} />
              <input type="hidden" {...register("optional_doc_type")} />

              {/*  Optional docs checkbox + dropdown */}
              {!locked && (
                <div className="mt-4 rounded-lg border p-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="add_optional_docs"
                      checked={addOptionalDocs}
                      onCheckedChange={(v) => {
                        const checked = v === true;
                        setValue("add_optional_docs", checked, { shouldDirty: true, shouldValidate: true });
                        if (!checked) {
                          setValue("optional_doc_type", undefined, { shouldDirty: true, shouldValidate: true });

                          // clear optional upload errors when disabled
                          [PASS_FRONT_KEY, PASS_BACK_KEY, NID_FRONT_KEY, NID_BACK_KEY, DL_FRONT_KEY, DL_BACK_KEY].forEach((k) => {
                            setUploadError(k, undefined);
                          });
                        }
                      }}
                    />
                    <Label htmlFor="add_optional_docs" className="cursor-pointer">
                      Add optional documents?
                    </Label>
                  </div>

                  {addOptionalDocs && (
                    <div className="mt-3 max-w-sm">
                      <Label>Optional Document Type *</Label>
                      <Select
                        value={(optionalDocType as OptionalDocType | undefined) ?? ""}
                        onValueChange={(v) => setValue("optional_doc_type", v as OptionalDocType, { shouldDirty: true, shouldValidate: true })}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Select optional document" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="passport">Passport</SelectItem>
                          <SelectItem value="nid">NID</SelectItem>
                          <SelectItem value="driving_license">Driving License</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.optional_doc_type && <p className="text-xs text-red-500 mt-1">{errors.optional_doc_type.message}</p>}
                      <p className="text-xs text-muted-foreground mt-2">
                        If you enable this, the selected optional document Front/Back becomes required.
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 ${formDisabled ? "opacity-60 pointer-events-none" : ""}`}>
                {visibleAttachments.map((attachmentKey) => {
                  const item = uploads[attachmentKey] ?? null;
                  const err = uploadErrors[attachmentKey];
                  const existingUrl = existingImages[attachmentKey];
                  const hasFile = !!item;
                  const hasExisting = !hasFile && !!existingUrl;

                  return (
                    <div key={attachmentKey} className="border rounded-lg p-4 space-y-2">
                      <p className="text-sm font-medium">{attachmentKey}</p>

                      <input
                        ref={(el) => (inputRefs.current[attachmentKey] = el)}
                        type="file"
                        accept="image/png,image/jpeg"
                        className="hidden"
                        onChange={onFileChange(attachmentKey)}
                      />

                      <div
                        className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                          hasFile
                            ? "border-green-400 bg-green-50"
                            : hasExisting
                            ? "border-blue-300 bg-blue-50/30"
                            : "border-border hover:border-primary/50 hover:bg-muted/30"
                        }`}
                        onClick={() => openPicker(attachmentKey)}
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        onDrop={onDropFile(attachmentKey)}
                      >
                        {hasFile ? (
                          <>
                            {item.previewUrl ? (
                              <img
                                src={item.previewUrl}
                                alt="preview"
                                className="w-full max-h-36 object-contain rounded"
                              />
                            ) : (
                              <CheckCircle2 className="w-8 h-8 text-green-500" />
                            )}
                            <p className="text-xs font-medium text-green-700 break-all px-1">
                              {item.file.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {(item.file.size / 1024).toFixed(1)} KB — Click or drag to replace
                            </p>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 gap-1"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeFile(attachmentKey); }}
                            >
                              <X className="h-3 w-3" /> Remove
                            </Button>
                          </>
                        ) : hasExisting ? (
                          <>
                            <img
                              src={existingUrl}
                              alt="existing"
                              className="w-full max-h-36 object-contain rounded"
                            />
                            <p className="text-xs text-muted-foreground">Existing — click to replace</p>
                          </>
                        ) : (
                          <>
                            <Upload className="w-8 h-8 text-muted-foreground" />
                            <p className="text-xs font-medium">Click or drag & drop</p>
                            <p className="text-xs text-muted-foreground">PNG / JPG — max {MAX_FILE_MB} MB</p>
                          </>
                        )}
                      </div>

                      {err && <p className="text-xs text-red-500 mt-1">{err}</p>}
                      {isRequiredDocKey(attachmentKey) && !hasFile && !hasExisting && (
                        <p className="text-xs text-muted-foreground">Required</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* hide submit when Pending/Approved/Verified */}
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
