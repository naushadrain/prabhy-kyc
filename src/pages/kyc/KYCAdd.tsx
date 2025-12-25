// src/pages/kyc/KYCAdd.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { useLanguage } from "@/contexts/LanguageContext";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  submitCustomerKyc,
  type CustomerKycFormEntity,
} from "@/api/kyc/customerKycClient";

type UploadItem = { file: File; previewUrl: string };
const ALLOWED_MIME = ["image/png", "image/jpeg"];
const MAX_FILE_MB = 1;

type BannerState =
  | { type: "info" | "success" | "error"; title: string; message: string; debug?: any }
  | null;

export const KYCAdd = () => {
  const { t } = useLanguage();

  const attachments = ["Photo", "Citizenship / Front", "Citizenship / Back"];
  const { minDobAD, maxDobAD } = useMemo(() => getDobMinMaxYMD(), []);

  const [banner, setBanner] = useState<BannerState>(null);

  const {
    register,
    watch,
    setValue,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<KycFormValues>({
    resolver: zodResolver(kycSchema),
    mode: "onChange",
    defaultValues: {
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
    },
  });

  // auto AD -> BS
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

  // Nepali typing helper
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

  // Upload state
  const [uploads, setUploads] = useState<Record<string, UploadItem | null>>({});
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const openPicker = (key: string) => inputRefs.current[key]?.click();

  const cleanupPreview = (key: string) => {
    const item = uploads[key];
    if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
  };

  useEffect(() => {
    return () => {
      Object.values(uploads).forEach((u) => u?.previewUrl && URL.revokeObjectURL(u.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setUploadError = (key: string, message?: string) => {
    setUploadErrors((prev) => {
      const next = { ...prev };
      if (!message) delete next[key];
      else next[key] = message;
      return next;
    });
  };

  const acceptFile = (key: string, file: File) => {
    if (!ALLOWED_MIME.includes(file.type)) {
      setUploadError(key, "Please select a valid image file (PNG or JPG/JPEG)");
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

  // Submit handlers
  const onValidSubmit = async (values: KycFormValues) => {
    if (Object.keys(npErrors).length) {
      setBanner({ type: "error", title: "Validation error", message: "कृपया नेपाली फिल्डहरू सही गर्नुहोस्।" });
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

    // ✅ correct mapping (includes English names)
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
      // to_tole: values.tole || "",
      residence_country: values.residence_country || "NEPAL",
      mobile: values.mobile,
      email: values.email || "",
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
      image_profile: uploads["Photo"]?.file ?? null,
      ctz_front: uploads["Citizenship / Front"]?.file ?? null,
      ctz_back: uploads["Citizenship / Back"]?.file ?? null,
      passport_front: uploads["Passport"]?.file ?? null,
    };


    try {
      const result = await submitCustomerKyc(payload, { debug: true });

      setBanner({
        type: "success",
        title: "KYC submitted successfully",
        message: result?.data?.message || "KYC submitted successfully.",
        debug: result?.debug,
      });

      console.log("KYC success:", result);

      // optional: clear form + uploads after success
      // reset();
      // setUploads({});
    } catch (e: any) {
      const msg =
        e?.debug?.response_json?.error_list?.[0]?.error_message ||
        e?.debug?.response_json?.message ||
        e?.message ||
        "KYC submission failed";

      setBanner({
        type: "error",
        title: "KYC submission failed",
        message: msg,
        debug: e?.debug,
      });

      // console.error("KYC error debug:", e?.debug || e);
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

        <main className="flex-1 p-8 bg-background">
          <Tabs defaultValue="self" className="w-full max-w-6xl">
            <TabsList className="bg-muted mb-6">
              <TabsTrigger
                value="self"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {t("claim.self")}
              </TabsTrigger>
              <TabsTrigger value="others" className="data-[state=active]:bg-background">
                {t("claim.others")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="self" className="space-y-8">
              <form onSubmit={handleSubmit(onValidSubmit, onInvalidSubmit)} className="space-y-8">
                {/* ✅ TOP MESSAGE */}
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
                        <AlertDescription className="mt-1">{banner.message}</AlertDescription>
                        {banner.debug ? (
                          <p className="mt-2 text-xs text-muted-foreground">
                            Debug available in console (DevTools).
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </Alert>
                )}

                {/* ---------------- BASIC INFO ---------------- */}
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

                    <div>
                      <Label>{t("kycAdd.firstName")} (English) *</Label>
                      <Input className="mt-2" {...register("first_name")} />
                      {errors.first_name && <p className="text-xs text-red-500 mt-1">{errors.first_name.message}</p>}
                    </div>

                    <div>
                      <Label>{t("kycAdd.middleName")} (English)</Label>
                      <Input className="mt-2" {...register("middle_name")} />
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
                      <Input className="mt-2" {...register("middle_name_nep")} onInput={nepaliInputHandler("middle_name_nep")} />
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

                {/* ---------------- IDENTIFICATION ---------------- */}
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
                      <Input className="mt-2" {...register("id_no")} />
                      {errors.id_no && <p className="text-xs text-red-500 mt-1">{errors.id_no.message}</p>}
                    </div>

                    <div>
                      <Label>{t("kycAdd.idIssueDistrict") || "Issued District"} *</Label>
                      <Input className="mt-2" {...register("issued_district")} />
                      {errors.issued_district && <p className="text-xs text-red-500 mt-1">{errors.issued_district.message}</p>}
                    </div>

                    <div>
                      <Label>{t("kycAdd.idIssueDate") || "Issue Date"} (A.D)</Label>
                      <Input type="date" className="mt-2" {...register("issue_date_ad")} />
                    </div>

                    <div>
                      <Label>{t("kycAdd.idIssueDateBS") || "Issue Date"} (B.S)</Label>
                      <Input className="mt-2" readOnly {...register("issue_date_bs")} />
                      {errors.issue_date_bs && <p className="text-xs text-red-500 mt-1">{errors.issue_date_bs.message}</p>}
                    </div>
                  </div>
                </div>

                {/* ---------------- CONTACT + DOB ---------------- */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">{t("kycAdd.contact") || "Contact & DOB"}</h3>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label>{t("auth.mobileNo")} *</Label>
                      <Input className="mt-2" {...register("mobile")} />
                      {errors.mobile && <p className="text-xs text-red-500 mt-1">{errors.mobile.message}</p>}
                    </div>

                    <div>
                      <Label>{t("kycAdd.email") || "Email"}</Label>
                      <Input type="email" className="mt-2" {...register("email")} />
                      {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
                    </div>

                    <div>
                      <Label>{t("kycAdd.dateOfBirthAd") || "Date of Birth"} (A.D)</Label>
                      <Input type="date" className="mt-2" min={minDobAD} max={maxDobAD} {...register("dob_ad")} />
                      {errors.dob_ad && <p className="text-xs text-red-500 mt-1">{errors.dob_ad.message}</p>}
                    </div>

                    <div>
                      <Label>{t("kycAdd.dateOfBirth") || "Date of Birth"} (B.S)</Label>
                      <Input className="mt-2" readOnly {...register("dob_bs")} />
                      {errors.dob_bs && <p className="text-xs text-red-500 mt-1">{errors.dob_bs.message}</p>}
                    </div>
                  </div>
                </div>

                {/* ---------------- PERMANENT ADDRESS ---------------- */}
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
                      <Input className="mt-2" {...register("ward_no")} />
                      {errors.ward_no && <p className="text-xs text-red-500 mt-1">{errors.ward_no.message}</p>}
                    </div>

                    <div>
                      <Label>{t("kycAdd.residenceCountry") || "Residence Country"}</Label>
                      <Input className="mt-2" {...register("residence_country")} />
                    </div>
                  </div>
                </div>

                {/* ---------------- RELATION + OCCUPATION ---------------- */}
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
                      <Input className="mt-2" {...register("father_citizenship_no")} />
                    </div>

                    <div>
                      <Label>{t("kycAdd.fatherCitizenshipIssuedDistrict") || "Issued District"}</Label>
                      <Input className="mt-2" {...register("father_citizenship_issued_district")} />
                    </div>

                    <div>
                      <Occupation
                        value={watch("occupation")}
                        onChange={(v) => setValue("occupation", v, { shouldDirty: true, shouldValidate: true })}
                      />
                    </div>

                    <div>
                      <Label>{t("kycAdd.industry") || "Industry"}</Label>
                      <Input className="mt-2" {...register("industry")} />
                    </div>
                  </div>
                </div>

                {/* ---------------- COMPLIANCE ---------------- */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">{t("kycAdd.compliance") || "Compliance & Risk"}</h3>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2 mt-2">
                      <Checkbox
                        checked={!!watch("politically_involved")}
                        onCheckedChange={(v) =>
                          setValue("politically_involved", v === true, { shouldDirty: true, shouldValidate: true })
                        }
                      />
                      <Label>{t("kycAdd.politicallyInvolved") || "Politically Involved?"}</Label>
                    </div>

                    <div>
                      <Label>{t("kycAdd.docType") || "Document Type"}</Label>
                      <Select value={watch("doc_type")} onValueChange={(v) => setValue("doc_type", v as any, { shouldDirty: true })}>
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

                {/* ---------------- UPLOADS ---------------- */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">{t("kycAdd.attachments")}</h3>
                  <p className="text-sm text-blue-500 mb-4">{t("kycAdd.doYouWantToAttach")}</p>

                  <div className="space-y-4">
                    {attachments.map((attachment) => {
                      const item = uploads[attachment] ?? null;
                      const err = uploadErrors[attachment];

                      return (
                        <div key={attachment} className="rounded-lg border p-4">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium">{attachment}</p>
                              <p className="text-xs text-muted-foreground">
                                PNG / JPG / JPEG (Max {MAX_FILE_MB}MB)
                              </p>
                            </div>

                            <input
                              ref={(el) => (inputRefs.current[attachment] = el)}
                              type="file"
                              accept="image/png,image/jpeg"
                              className="hidden"
                              onChange={onFileChange(attachment)}
                            />

                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="gap-2 text-orange-500 border-orange-200 hover:bg-orange-50 w-fit"
                              onClick={() => openPicker(attachment)}
                            >
                              <Upload className="w-4 h-4" />
                              {item ? "Change file" : t("kycAdd.clickToUpload")}
                            </Button>
                          </div>

                          <div
                            className="mt-3 rounded-lg border-2 border-dashed p-3 cursor-pointer hover:bg-muted/30 transition"
                            onClick={() => openPicker(attachment)}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            onDrop={onDropFile(attachment)}
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
                                <img
                                  src={item.previewUrl}
                                  alt="preview"
                                  className="h-16 w-16 rounded-md object-cover border"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{item.file.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {(item.file.size / (1024 * 1024)).toFixed(2)} MB
                                  </p>
                                </div>

                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    removeFile(attachment);
                                  }}
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Remove
                                </Button>
                              </div>
                            )}
                          </div>

                          {err && <p className="text-xs text-red-500 mt-2">{err}</p>}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" size="lg" className="bg-primary hover:bg-primary/90" disabled={isSubmitting}>
                    {isSubmitting ? "Submitting..." : t("common.submit")}
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="others">
              <p className="text-center text-muted-foreground py-12">{t("kycAdd.others")} form content</p>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};
