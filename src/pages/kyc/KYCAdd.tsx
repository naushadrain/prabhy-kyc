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

// catalogue components
import { ProvinceDistrictMunicipality } from "./getcatalogue/ProvinceDistrictMunicipality";
import { Gender } from "./getcatalogue/Gender";
import { Honour } from "./getcatalogue/Honour";
import { IdentificationType } from "./getcatalogue/IdentificationType";
import { Occupation } from "./getcatalogue/Occupation";

// schema + helpers
import {
  kycSchema,
  type KycFormValues,
  getDobMinMaxYMD,
  adIsoToBsYMD,
  isNepaliOnly,
} from "./validation/kycSchema";

// ✅ API
import { submitCustomerKyc, type CustomerKycFormEntity } from "@/api/kyc/customerKycClient";

// ✅ inside component
const navigate = useNavigate();
const redirectTimerRef = useRef<number | null>(null);

// ✅ cleanup on unmount (recommended)
useEffect(() => {
  return () => {
    if (redirectTimerRef.current) window.clearTimeout(redirectTimerRef.current);
  };
}, []);
/* =========================
   Upload config
========================= */
type UploadItem = { file: File; previewUrl: string };
const ALLOWED_MIME = ["image/png", "image/jpeg"];
const MAX_FILE_MB = 1;

/** ✅ IMPORTANT: Use the same keys everywhere (UI, uploads state, payload mapping) */
const PHOTO_KEY = "Photo *";
const CTZ_FRONT_KEY = "Citizenship / Front (Optional)";
const CTZ_BACK_KEY = "Citizenship / Back (Optional)";
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

export const KYCAdd = () => {
  const { t } = useLanguage();
  const { minDobAD, maxDobAD } = useMemo(() => getDobMinMaxYMD(), []);
  const [banner, setBanner] = useState<BannerState>(null);

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
  };

  /* =========================
     RHF + Zod
  ========================= */
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
    mode: "onChange",
    defaultValues,
  });

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
     Upload state + validation (client-side)
  ========================= */
  const [uploads, setUploads] = useState<Record<string, UploadItem | null>>({});
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const openPicker = (key: string) => inputRefs.current[key]?.click();

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
    Object.entries(uploads).forEach(([k, u]) => {
      if (u?.previewUrl) URL.revokeObjectURL(u.previewUrl);
      // keep it simple; state reset happens separately
    });
  };

  useEffect(() => {
    return () => {
      cleanupAllPreviews();
    };
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
      const file = e.dataTransfer.files?.[0];
      if (!file) return;
      acceptFile(key, file);
    };

  /* =========================
     API error -> field error mapper
  ========================= */
  const applyApiErrorsToFields = (list: ApiErrorItem[] | undefined) => {
    if (!list?.length) return false;

    let mappedAny = false;

    for (const item of list) {
      const msg = (item?.error_message || "").toLowerCase();

      // ✅ Your example: "Duplicate Passport/Citizen Number 1214322452"
      if (msg.includes("duplicate") && (msg.includes("passport") || msg.includes("citizen") || msg.includes("citizenship"))) {
        setError("id_no", { type: "server", message: item.error_message || "Duplicate document number" });
        mappedAny = true;
        continue;
      }

      // other common mappings (optional)
      if (msg.includes("mobile")) {
        setError("mobile", { type: "server", message: item.error_message || "Invalid mobile" });
        mappedAny = true;
        continue;
      }
      if (msg.includes("email")) {
        setError("email", { type: "server", message: item.error_message || "Invalid email" });
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

    // ✅ extra client side: nepali helper errors
    if (Object.keys(npErrors).length) {
      setBanner({
        type: "error",
        title: "Validation error",
        message: "कृपया नेपाली फिल्डहरू सही गर्नुहोस्।",
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // ✅ Photo required (client-side)
    if (!uploads[PHOTO_KEY]?.file) {
      setUploadError(PHOTO_KEY, "Profile photo is required.");
      setBanner({
        type: "error",
        title: "Upload error",
        message: "Please upload the required profile photo.",
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // ✅ any upload invalid → block submit
    if (Object.keys(uploadErrors).length) {
      setBanner({
        type: "error",
        title: "Upload error",
        message: "Please fix document upload errors.",
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setBanner({ type: "info", title: "Submitting…", message: "Submitting your KYC. Please wait." });
    window.scrollTo({ top: 0, behavior: "smooth" });

    // ✅ map values to API entity
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

      issue_date_ad: values.issue_date_ad,
      issue_date_bs: values.issue_date_bs,

      province: values.province,
      district: values.district,
      local_level: values.local_level,
      ward_no: values.ward_no,

      residence_country: values.residence_country || "NEPAL",
      mobile: values.mobile,
      email: values.email,

      father_name: values.father_name,
      father_name_nep: values.father_name_nep,
      father_citizenship_no: values.father_citizenship_no || "",
      father_citizenship_issued_district: values.father_citizenship_issued_district || "",

      gender: values.gender,
      dob_ad: values.dob_ad,
      dob_bs: values.dob_bs,

      occupation: values.occupation || "",
      politically_involved: !!values.politically_involved,
      party_inspection_category: values.party_inspection_category,
      risk_factors: values.risk_factors,

      doc_type: values.doc_type as "citizenship" | "passport" | "nid",

      // uploads
      image_profile: uploads[PHOTO_KEY]?.file ?? null,
      ctz_front: uploads[CTZ_FRONT_KEY]?.file ?? null,
      ctz_back: uploads[CTZ_BACK_KEY]?.file ?? null,
      passport_front: uploads[PASS_FRONT_KEY]?.file ?? null,
      passport_back: uploads[PASS_BACK_KEY]?.file ?? null,
      nid_front: uploads[NID_FRONT_KEY]?.file ?? null,
      nid_back: uploads[NID_BACK_KEY]?.file ?? null,
      // dl_front: uploads[DL_FRONT_KEY]?.file ?? null,
      // dl_back: uploads[DL_BACK_KEY]?.file ?? null,
    };

    try {
      const result = await submitCustomerKyc(payload, { debug: true });

      setBanner({
        type: "success",
        title: "Your KYC information has been submitted and under review.",
        message: result?.data?.message || "Your KYC information has been submitted and under review.",
      });

      // ✅ clear form + uploads AFTER SUCCESS
      clearFormAfterSuccess();
      // TODO: navigate to kyc list page after a delay to dashboard
      // navigate("/dashboard");
      // ✅ redirect to dashboard after 3 seconds
      if (redirectTimerRef.current) window.clearTimeout(redirectTimerRef.current);

      redirectTimerRef.current = window.setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 3000);

    } catch (e: any) {
      // try to extract API error list
      const apiErrorList: ApiErrorItem[] | undefined =
        e?.debug?.response_json?.error_list || e?.response?.data?.error_list;

      const genericMsg =
        apiErrorList?.[0]?.error_message ||
        e?.debug?.response_json?.message ||
        e?.message ||
        "KYC submission failed";

      // ✅ show error on related input (id_no, mobile, email etc.)
      const mapped = applyApiErrorsToFields(apiErrorList);

      // ✅ banner always
      setBanner({
        type: "error",
        title: "Your KYC submission has been disapproved due to the following reason(s):",
        message: genericMsg,
        debug: e?.debug,
      });

      // if not mapped, at least show a general “form” error near top (already done)
      // and keep user data as-is (so they can fix & resubmit)
      if (!mapped) {
        // optional: focus/scroll to top; RHF doesn't auto focus without Controller
      }
    } finally {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const onInvalidSubmit = () => {
    setBanner({
      type: "error",
      title: "Please fix the form errors",
      message: "Some required fields are missing or invalid. Check red messages below.",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const BannerIcon =
    banner?.type === "success" ? CheckCircle2 : banner?.type === "error" ? AlertCircle : Info;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />

        <main className="flex-1 p-6 md:p-8 bg-background">
          <form onSubmit={handleSubmit(onValidSubmit, onInvalidSubmit)} className="space-y-8">
            {/* TOP BANNER */}
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
                    <AlertDescription
                      className={`mt-1 text-sm ${banner.type === "error" ? "text-red-700" : ""}`}
                    >
                      {banner.message}
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            )}

            {/* BASIC INFO */}
            <div>
              <h3 className="text-lg font-semibold mb-4">{t("kycAdd.basicInfo")}</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Honour
                    label={t("kycAdd.honour") || "Honour"}
                    value={watch("honour")}
                    onChange={(v) => setValue("honour", v, { shouldValidate: true, shouldDirty: true })}
                  />
                  {errors.honour && <p className="text-xs text-red-500 mt-1">{errors.honour.message}</p>}
                </div>

                <div>
                  <Gender
                    label={t("kycAdd.gender") || "Gender"}
                    value={watch("gender")}
                    onChange={(v) => setValue("gender", v, { shouldValidate: true, shouldDirty: true })}
                  />
                  {errors.gender && <p className="text-xs text-red-500 mt-1">{errors.gender.message}</p>}
                </div>

                <div />

                <div>
                  <Label>{t("kycAdd.firstName")} (English) *</Label>
                  <Input className="mt-2" {...register("first_name")} />
                  {errors.first_name && <p className="text-xs text-red-500 mt-1">{errors.first_name.message}</p>}
                </div>

                <div>
                  <Label>{t("kycAdd.middleName")} (English)</Label>
                  <Input className="mt-2" {...register("middle_name")} placeholder="optional" />
                </div>

                <div>
                  <Label>{t("kycAdd.lastName")} (English) *</Label>
                  <Input className="mt-2" {...register("last_name")} />
                  {errors.last_name && <p className="text-xs text-red-500 mt-1">{errors.last_name.message}</p>}
                </div>

                <div>
                  <Label>{t("kycAdd.firstName")} (नेपालीमा) *</Label>
                  <Input className="mt-2" {...register("first_name_nep")} onInput={nepaliInputHandler("first_name_nep")} />
                  {(errors.first_name_nep || npErrors.first_name_nep) && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.first_name_nep?.message || npErrors.first_name_nep}
                    </p>
                  )}
                </div>

                <div>
                  <Label>{t("kycAdd.middleName")} (नेपालीमा)</Label>
                  <Input
                    className="mt-2"
                    {...register("middle_name_nep")}
                    onInput={nepaliInputHandler("middle_name_nep")}
                    placeholder="optional"
                  />
                  {(errors.middle_name_nep || npErrors.middle_name_nep) && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.middle_name_nep?.message || npErrors.middle_name_nep}
                    </p>
                  )}
                </div>

                <div>
                  <Label>{t("kycAdd.lastName")} (नेपालीमा) *</Label>
                  <Input className="mt-2" {...register("last_name_nep")} onInput={nepaliInputHandler("last_name_nep")} />
                  {(errors.last_name_nep || npErrors.last_name_nep) && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.last_name_nep?.message || npErrors.last_name_nep}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* IDENTIFICATION */}
            <div>
              <h3 className="text-lg font-semibold mb-4">{t("kycAdd.identification") || "Identification"}</h3>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <IdentificationType
                    label={t("kycAdd.idType") || "Identification Type"}
                    value={watch("id_type")}
                    onChange={(v) => setValue("id_type", v, { shouldValidate: true, shouldDirty: true })}
                  />
                  {errors.id_type && <p className="text-xs text-red-500 mt-1">{errors.id_type.message}</p>}
                </div>

                <div>
                  <Label>{t("kycAdd.idNumber") || "ID Number"} *</Label>
                  <Input
                    className={`mt-2 ${errors.id_no ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                    {...register("id_no")}
                  />
                  {/* ✅ This will show Zod OR API error (setError) */}
                  {errors.id_no && <p className="text-xs text-red-500 mt-1">{errors.id_no.message}</p>}
                </div>

                <div>
                  <Label>{t("kycAdd.idIssueDistrict") || "Issued District"} *</Label>
                  <Input className="mt-2" {...register("issued_district")} />
                  {errors.issued_district && <p className="text-xs text-red-500 mt-1">{errors.issued_district.message}</p>}
                </div>

                <div>
                  <Label>{t("kycAdd.idIssueDate") || "Issue Date (A.D)"} *</Label>
                  <Input type="date" className="mt-2" {...register("issue_date_ad")} />
                  {errors.issue_date_ad && <p className="text-xs text-red-500 mt-1">{errors.issue_date_ad.message}</p>}
                </div>

                <div>
                  <Label>{t("kycAdd.idIssueDateBS") || "Issue Date (B.S)"} *</Label>
                  <Input className="mt-2" readOnly {...register("issue_date_bs")} placeholder="Auto from A.D" />
                  {errors.issue_date_bs && <p className="text-xs text-red-500 mt-1">{errors.issue_date_bs.message}</p>}
                </div>
              </div>
            </div>

            {/* CONTACT + DOB */}
            <div>
              <h3 className="text-lg font-semibold mb-4">{t("kycAdd.contact") || "Contact & DOB"}</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label>{t("auth.mobileNo")} *</Label>
                  <Input
                    className={`mt-2 ${errors.mobile ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                    inputMode="numeric"
                    {...register("mobile", {
                      setValueAs: (v) => String(v ?? "").replace(/\D/g, "").slice(0, 10),
                    })}
                  />
                  {errors.mobile && <p className="text-xs text-red-500 mt-1">{errors.mobile.message}</p>}
                </div>

                <div>
                  <Label>{t("kycAdd.email") || "Email"} *</Label>
                  <Input
                    type="email"
                    className={`mt-2 ${errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                    {...register("email")}
                  />
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
                </div>

                <div>
                  <Label>{t("kycAdd.dateOfBirthAd") || "Date of Birth (A.D)"} *</Label>
                  <Input type="date" className="mt-2" min={minDobAD} max={maxDobAD} {...register("dob_ad")} />
                  {errors.dob_ad && <p className="text-xs text-red-500 mt-1">{errors.dob_ad.message}</p>}
                </div>

                <div>
                  <Label>{t("kycAdd.dateOfBirth") || "Date of Birth (B.S)"} *</Label>
                  <Input className="mt-2" readOnly {...register("dob_bs")} />
                  {errors.dob_bs && <p className="text-xs text-red-500 mt-1">{errors.dob_bs.message}</p>}
                </div>
              </div>
            </div>

            {/* PERMANENT ADDRESS */}
            <div>
              <h3 className="text-lg font-semibold mb-4">{t("kycAdd.permanentAddress")}</h3>

              <div className="grid md:grid-cols-3 gap-4">
                <ProvinceDistrictMunicipality
                  value={{
                    province: watch("province"),
                    district: watch("district"),
                    local_level: watch("local_level"),
                  }}
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
                  <Label>{t("kycAdd.tole")} *</Label>
                  <Input className="mt-2" {...register("tole")} />
                  {errors.tole && <p className="text-xs text-red-500 mt-1">{errors.tole.message}</p>}
                </div>

                <div>
                  <Label>टोल (नेपालीमा) *</Label>
                  <Input className="mt-2" {...register("tole_nep")} onInput={nepaliInputHandler("tole_nep")} />
                  {(errors.tole_nep || npErrors.tole_nep) && (
                    <p className="text-xs text-red-500 mt-1">{errors.tole_nep?.message || npErrors.tole_nep}</p>
                  )}
                </div>

                <div>
                  <Label>{t("kycAdd.wardNumber")} *</Label>
                  <Input
                    className="mt-2"
                    inputMode="numeric"
                    {...register("ward_no", {
                      setValueAs: (v) => String(v ?? "").replace(/\D/g, ""),
                    })}
                  />
                  {errors.ward_no && <p className="text-xs text-red-500 mt-1">{errors.ward_no.message}</p>}
                </div>

                <div>
                  <Label>{t("kycAdd.residenceCountry") || "Residence Country"} *</Label>
                  <Input className="mt-2" {...register("residence_country")} />
                  {errors.residence_country && <p className="text-xs text-red-500 mt-1">{errors.residence_country.message}</p>}
                </div>
              </div>
            </div>

            {/* RELATION + OCCUPATION */}
            <div>
              <h3 className="text-lg font-semibold mb-4">{t("kycAdd.relation") || "Relation"}</h3>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label>{t("kycAdd.fatherName") || "Father Name"} *</Label>
                  <Input className="mt-2" {...register("father_name")} />
                  {errors.father_name && <p className="text-xs text-red-500 mt-1">{errors.father_name.message}</p>}
                </div>

                <div>
                  <Label>{t("kycAdd.fatherNameNep") || "Father Name (नेपाली)"} *</Label>
                  <Input className="mt-2" {...register("father_name_nep")} onInput={nepaliInputHandler("father_name_nep")} />
                  {(errors.father_name_nep || npErrors.father_name_nep) && (
                    <p className="text-xs text-red-500 mt-1">{errors.father_name_nep?.message || npErrors.father_name_nep}</p>
                  )}
                </div>

                <div>
                  <Label>{t("kycAdd.fatherCitizenshipNo") || "Father Citizenship No"}</Label>
                  <Input className="mt-2" {...register("father_citizenship_no")} placeholder="optional" />
                </div>

                <div>
                  <Label>{t("kycAdd.fatherCitizenshipIssuedDistrict") || "Issued District"}</Label>
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
                  <Label>{t("kycAdd.industry") || "Industry"}</Label>
                  <Input className="mt-2" {...register("industry")} placeholder="optional" />
                </div>
              </div>
            </div>

            {/* COMPLIANCE */}
            <div>
              <h3 className="text-lg font-semibold mb-4">{t("kycAdd.compliance") || "Compliance & Risk"}</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2 mt-2">
                  <Checkbox
                    id="politically_involved"
                    checked={!!watch("politically_involved")}
                    onCheckedChange={(v) =>
                      setValue("politically_involved", v === true, { shouldDirty: true, shouldValidate: true })
                    }
                  />
                  <Label htmlFor="politically_involved" className="cursor-pointer select-none">
                    {t("kycAdd.politicallyInvolved") || "Politically Involved?"}
                  </Label>
                </div>

                <div>
                  <Label>{t("kycAdd.docType") || "Document Type"} *</Label>
                  <Select
                    value={watch("doc_type")}
                    onValueChange={(v) => setValue("doc_type", v as any, { shouldDirty: true, shouldValidate: true })}
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
              <p className="text-sm text-muted-foreground">Upload the required profile photo. Other documents are optional.</p>

              <div className="space-y-4 mt-4">
                {attachments.map((attachmentKey) => {
                  const item = uploads[attachmentKey] ?? null;
                  const err = uploadErrors[attachmentKey];

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
                          {item ? "Change file" : "Click to upload"}
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
                              <p className="text-xs text-muted-foreground">or click to upload</p>
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
                      </div>

                      {err && <p className="text-xs text-red-500 mt-2">{err}</p>}

                      {attachmentKey === PHOTO_KEY && !uploads[PHOTO_KEY]?.file && (
                        <p className="text-xs text-muted-foreground mt-2">Profile photo is required.</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SUBMIT */}
            <div className="flex justify-end">
              <Button type="submit" size="lg" className="bg-primary hover:bg-primary/90" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : t("common.submit")}
              </Button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
};
