// src/pages/KYCAdd.tsx
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import locationData from "@/data/nepal_location.json";
import { useEffect, useMemo, useState } from "react";
import NepaliDate from "nepali-date-converter";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { submitCustomerKyc } from "@/api/customerKycClient";

// ✅ Regex
const NEPALI_ONLY = /^[\u0900-\u097F\s\-.'’]+$/;
const EN_ONLY = /^[A-Za-z\s\-.'’]+$/;
const MOBILE_10 = /^[0-9]{10}$/;

function isValidYMD(dateStr: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const d = new Date(dateStr);
  return !Number.isNaN(d.getTime());
}

function calcAge(dob: Date) {
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

// ✅ optional File schema (Vite/browser)
const optionalFile = z
  .any()
  .optional()
  .refine((f) => f == null || f instanceof File, "Invalid file");

const kycSchema = z
  .object({
    // ---- Basic ----
    honour: z.string().min(1, "शीर्षक छान्नुहोस्"), // Mr. / Ms. / Other

    first_name_nep: z.string().trim().min(1, "पहिलो नाम अनिवार्य छ").regex(NEPALI_ONLY, "कृपया नेपाली मात्र लेख्नुहोस्").max(30),
    middle_name_nep: z.string().trim().min(1, "बिचको नाम अनिवार्य छ").regex(NEPALI_ONLY, "कृपया नेपाली मात्र लेख्नुहोस्").max(30),
    last_name_nep: z.string().trim().min(1, "थर अनिवार्य छ").regex(NEPALI_ONLY, "कृपया नेपाली मात्र लेख्नुहोस्").max(30),

    gender_code: z.string().min(1, "लिङ्ग छान्नुहोस्"), // M/F/O
    marital_status: z.string().min(1, "वैवाहिक स्थिति छान्नुहोस्"),

    mobile: z.string().trim().min(1, "मोबाइल नम्बर अनिवार्य छ").regex(MOBILE_10, "१० अङ्कको मोबाइल नम्बर लेख्नुहोस्"),
    email: z.string().trim().min(1, "इमेल अनिवार्य छ").email("सही इमेल लेख्नुहोस्"),

    dob_ad: z.string().min(1, "जन्म मिति (A.D) अनिवार्य छ").refine(isValidYMD, "जन्म मिति (A.D) सही छैन"),
    dob_bs: z.string().optional(),

    // ---- Permanent Address (IDs) ----
    province_id: z.string().min(1, "प्रदेश छान्नुहोस्"),
    district_id: z.string().min(1, "जिल्ला छान्नुहोस्"),
    municipality_id: z.string().min(1, "पालिका छान्नुहोस्"),

    ward_no: z
      .string()
      .trim()
      .min(1, "वडा नम्बर अनिवार्य छ")
      .regex(/^[0-9]{1,2}$/, "वडा नम्बर १–९९")
      .refine((v) => {
        const n = Number(v);
        return n >= 1 && n <= 99;
      }, "वडा नम्बर १–९९"),

    // optional address text (not sent to API in your current payload)
    tole_en: z.string().trim().optional().refine((v) => !v || EN_ONLY.test(v), "English अक्षर मात्र लेख्नुहोस् (A-Z)"),
    tole_np: z.string().trim().optional().refine((v) => !v || NEPALI_ONLY.test(v), "कृपया नेपाली मात्र लेख्नुहोस्"),

    // ---- Temporary Address ----
    same_address: z.boolean().default(false),
    temp_address_en: z.string().trim().optional(),
    temp_address_np: z.string().trim().optional(),

    // ---- Others ----
    occupation: z.string().min(1, "पेशा छान्नुहोस्"),
    income_source: z.string().optional(),
    kyc_classification: z.string().optional(),

    politically_involved: z.boolean().default(false),

    // ---- Identification ----
    id_type: z.enum(["Citizenship", "Passport", "NID"]).default("Citizenship"),
    id_no: z.string().trim().min(1, "ID नम्बर अनिवार्य छ").max(30),
    issued_district: z.string().trim().min(1, "जारी जिल्ला अनिवार्य छ"),
    issue_date_ad: z.string().min(1, "जारी मिति अनिवार्य छ").refine(isValidYMD, "जारी मिति सही छैन"),
    issue_date_bs: z.string().optional(),

    // ---- Relation ----
    father_name: z.string().trim().min(1, "Father name (English) अनिवार्य छ").regex(EN_ONLY, "English अक्षर मात्र लेख्नुहोस्").max(60),
    father_name_nep: z.string().trim().min(1, "बुवाको नाम (नेपाली) अनिवार्य छ").regex(NEPALI_ONLY, "कृपया नेपाली मात्र लेख्नुहोस्").max(60),
    father_citizenship_no: z.string().trim().min(1, "Father citizenship no अनिवार्य छ").max(30),
    father_citizenship_issued_district: z.string().trim().min(1, "Father citizenship issued district अनिवार्य छ").max(60),

    // ---- Attachments ----
    doc_type: z.enum(["citizenship", "passport", "nid"]).default("citizenship"),
    image_profile: optionalFile, // ✅ NOT required
    ctz_front: optionalFile,
    ctz_back: optionalFile,
    passport_front: optionalFile,
    passport_back: optionalFile,
    nid_front: optionalFile,
    nid_back: optionalFile,
  })
  .superRefine((val, ctx) => {
    // ✅ Age check 16–60
    const dob = new Date(val.dob_ad);
    const age = calcAge(dob);
    if (age < 16) ctx.addIssue({ code: "custom", path: ["dob_ad"], message: "उमेर कम्तीमा १६ वर्ष हुनुपर्छ" });
    if (age > 60) ctx.addIssue({ code: "custom", path: ["dob_ad"], message: "उमेर ६० वर्षभन्दा बढी हुन हुँदैन" });

    // ✅ AD -> BS match for DOB
    try {
      const bs = NepaliDate.fromAD(dob).format("YYYY-MM-DD");
      if (val.dob_bs && bs !== val.dob_bs) {
        ctx.addIssue({ code: "custom", path: ["dob_bs"], message: "A.D र B.S मिलेन (फेरि A.D छान्नुहोस्)" });
      }
    } catch {
      // ok (optional)
    }

    // ✅ AD -> BS match for issue date
    try {
      const bsIssue = NepaliDate.fromAD(new Date(val.issue_date_ad)).format("YYYY-MM-DD");
      if (val.issue_date_bs && bsIssue !== val.issue_date_bs) {
        ctx.addIssue({ code: "custom", path: ["issue_date_bs"], message: "Issue Date A.D र B.S मिलेन" });
      }
    } catch {
      // ok (optional)
    }

    // ✅ Temporary address required when not same
    if (!val.same_address) {
      if (!val.temp_address_en || val.temp_address_en.trim().length < 2) {
        ctx.addIssue({ code: "custom", path: ["temp_address_en"], message: "अस्थायी ठेगाना (English) अनिवार्य छ" });
      }
      if (!val.temp_address_np || val.temp_address_np.trim().length < 2) {
        ctx.addIssue({ code: "custom", path: ["temp_address_np"], message: "अस्थायी ठेगाना (नेपाली) अनिवार्य छ" });
      } else if (!NEPALI_ONLY.test(val.temp_address_np.trim())) {
        ctx.addIssue({ code: "custom", path: ["temp_address_np"], message: "कृपया नेपाली मात्र लेख्नुहोस्" });
      }
    }
  });

type FormValues = z.infer<typeof kycSchema>;

export const KYCAdd = () => {
  const { t } = useLanguage();
  const [apiError, setApiError] = useState<string>("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors, isValid, isSubmitting, submitCount },
  } = useForm<FormValues>({
    resolver: zodResolver(kycSchema),
    mode: "onChange",
    defaultValues: {
      honour: "",
      first_name_nep: "",
      middle_name_nep: "",
      last_name_nep: "",
      gender_code: "",
      marital_status: "",
      mobile: "",
      email: "",
      dob_ad: "",
      dob_bs: "",

      province_id: "",
      district_id: "",
      municipality_id: "",
      ward_no: "",
      tole_en: "",
      tole_np: "",

      same_address: false,
      temp_address_en: "",
      temp_address_np: "",

      occupation: "",
      income_source: "",
      kyc_classification: "",
      politically_involved: false,

      id_type: "Citizenship",
      id_no: "",
      issued_district: "",
      issue_date_ad: "",
      issue_date_bs: "",

      father_name: "",
      father_name_nep: "",
      father_citizenship_no: "",
      father_citizenship_issued_district: "",

      doc_type: "citizenship",
      image_profile: undefined,
      ctz_front: undefined,
      ctz_back: undefined,
      passport_front: undefined,
      passport_back: undefined,
      nid_front: undefined,
      nid_back: undefined,
    },
  });

  // Location lists
  const provinces = (locationData as any).provinceList ?? [];
  const provinceId = watch("province_id");
  const districtId = watch("district_id");
  const sameAddress = watch("same_address");
  const docType = watch("doc_type");
  const dobAD = watch("dob_ad");
  const issueAD = watch("issue_date_ad");

  const districts = useMemo(() => {
    if (!provinceId) return [];
    return provinces.find((p: any) => p.id === Number(provinceId))?.districtList || [];
  }, [provinceId, provinces]);

  const municipalities = useMemo(() => {
    if (!districtId) return [];
    return districts.find((d: any) => d.id === Number(districtId))?.municipalityList || [];
  }, [districtId, districts]);

  const provinceName = useMemo(() => provinces.find((p: any) => p.id === Number(provinceId))?.name ?? "", [provinces, provinceId]);
  const districtName = useMemo(() => districts.find((d: any) => d.id === Number(districtId))?.name ?? "", [districts, districtId]);
  const municipalityName = useMemo(
    () => municipalities.find((m: any) => m.id === Number(watch("municipality_id")) )?.name ?? "",
    [municipalities, watch]
  );

  // DOB AD -> BS auto
  useEffect(() => {
    if (!dobAD || !isValidYMD(dobAD)) {
      setValue("dob_bs", "", { shouldValidate: true });
      return;
    }
    try {
      const bsFormatted = NepaliDate.fromAD(new Date(dobAD)).format("YYYY-MM-DD");
      setValue("dob_bs", bsFormatted, { shouldValidate: true });
    } catch {
      setValue("dob_bs", "", { shouldValidate: true });
    }
  }, [dobAD, setValue]);

  // Issue Date AD -> BS auto
  useEffect(() => {
    if (!issueAD || !isValidYMD(issueAD)) {
      setValue("issue_date_bs", "", { shouldValidate: true });
      return;
    }
    try {
      const bsFormatted = NepaliDate.fromAD(new Date(issueAD)).format("YYYY-MM-DD");
      setValue("issue_date_bs", bsFormatted, { shouldValidate: true });
    } catch {
      setValue("issue_date_bs", "", { shouldValidate: true });
    }
  }, [issueAD, setValue]);

  // When same address checked, clear temp fields
  useEffect(() => {
    if (sameAddress) {
      setValue("temp_address_en", "", { shouldValidate: true });
      setValue("temp_address_np", "", { shouldValidate: true });
    }
  }, [sameAddress, setValue]);

  const onSubmit = async (data: FormValues) => {
    setApiError("");

    // ✅ map doc_type -> id_type (if you want them tied together)
    const idType = data.doc_type === "passport" ? "Passport" : data.doc_type === "nid" ? "NID" : "Citizenship";

    try {
      const resp = await submitCustomerKyc({
        honour: data.honour,
        first_name_nep: data.first_name_nep,
        middle_name_nep: data.middle_name_nep,
        last_name_nep: data.last_name_nep,

        id_type: idType,
        id_no: data.id_no,
        issued_district: data.issued_district,
        issue_date_ad: data.issue_date_ad,
        issue_date_bs: data.issue_date_bs || "",

        province_name: provinceName,
        district_name: districtName,
        local_level_name: municipalityName,
        ward_no: data.ward_no,
        residence_country: "NEPAL",

        mobile: data.mobile,
        email: data.email,

        father_name: data.father_name,
        father_name_nep: data.father_name_nep,
        father_citizenship_no: data.father_citizenship_no,
        father_citizenship_issued_district: data.father_citizenship_issued_district,

        gender_code: data.gender_code, // M/F/O
        dob_ad: data.dob_ad,
        dob_bs: data.dob_bs || "",
        occupation: data.occupation,

        politically_involved: !!data.politically_involved,

        doc_type: data.doc_type,

        // ✅ files optional
        image_profile: (data.image_profile as File) || null,
        ctz_front: (data.ctz_front as File) || null,
        ctz_back: (data.ctz_back as File) || null,
        passport_front: (data.passport_front as File) || null,
        passport_back: (data.passport_back as File) || null,
        nid_front: (data.nid_front as File) || null,
        nid_back: (data.nid_back as File) || null,
      });

      console.log("✅ KYC API Response:", resp);
      alert("✅ KYC submitted successfully!");
    } catch (e: any) {
      console.error(e);
      setApiError(e?.message || "KYC submit failed");
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />

        <main className="flex-1 p-8 bg-background">
          <Tabs defaultValue="self" className="w-full max-w-6xl">
            <TabsList className="bg-muted mb-6">
              <TabsTrigger value="self" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                {t("claim.self")}
              </TabsTrigger>
              <TabsTrigger value="others" className="data-[state=active]:bg-background">
                {t("claim.others")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="self" className="space-y-8">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                {apiError && (
                  <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {apiError}
                  </div>
                )}

                {/* Basic */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">{t("kycAdd.basicInfo")}</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label>Name Title *</Label>
                      <Controller
                        control={control}
                        name="honour"
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className="mt-2">
                              <SelectValue placeholder="Select Honorific" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Mr.">Mr.</SelectItem>
                              <SelectItem value="Ms.">Ms.</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.honour && <p className="text-sm text-red-500 mt-1">{errors.honour.message}</p>}
                    </div>

                    <div>
                      <Label>First Name (नेपाली) *</Label>
                      <Input className="mt-2" lang="ne" placeholder="नेपालीमा लेख्नुहोस्" {...register("first_name_nep")} />
                      {errors.first_name_nep && <p className="text-sm text-red-500 mt-1">{errors.first_name_nep.message}</p>}
                    </div>

                    <div>
                      <Label>Middle Name (नेपाली) *</Label>
                      <Input className="mt-2" lang="ne" placeholder="नेपालीमा लेख्नुहोस्" {...register("middle_name_nep")} />
                      {errors.middle_name_nep && <p className="text-sm text-red-500 mt-1">{errors.middle_name_nep.message}</p>}
                    </div>

                    <div>
                      <Label>थर (नेपाली) *</Label>
                      <Input className="mt-2" lang="ne" placeholder="नेपालीमा लेख्नुहोस्" {...register("last_name_nep")} />
                      {errors.last_name_nep && <p className="text-sm text-red-500 mt-1">{errors.last_name_nep.message}</p>}
                    </div>

                    <div>
                      <Label>{t("kycAdd.gender")} *</Label>
                      <Controller
                        control={control}
                        name="gender_code"
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className="mt-2">
                              <SelectValue placeholder="Select Gender" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="M">Male</SelectItem>
                              <SelectItem value="F">Female</SelectItem>
                              <SelectItem value="O">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.gender_code && <p className="text-sm text-red-500 mt-1">{errors.gender_code.message}</p>}
                    </div>

                    <div>
                      <Label>{t("kycAdd.maritalStatus")} *</Label>
                      <Controller
                        control={control}
                        name="marital_status"
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className="mt-2">
                              <SelectValue placeholder="Select Marital Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="single">Single</SelectItem>
                              <SelectItem value="married">Married</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.marital_status && <p className="text-sm text-red-500 mt-1">{errors.marital_status.message}</p>}
                    </div>

                    <div>
                      <Label>{t("auth.mobileNo")} *</Label>
                      <Input type="tel" className="mt-2" autoComplete="off" placeholder="98XXXXXXXX" {...register("mobile")} />
                      {errors.mobile && <p className="text-sm text-red-500 mt-1">{errors.mobile.message}</p>}
                    </div>

                    <div>
                      <Label>{t("kycAdd.email")} *</Label>
                      <Input type="email" className="mt-2" placeholder="Email" {...register("email")} />
                      {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>}
                    </div>

                    <div>
                      <Label>Date of Birth (A.D) *</Label>
                      <Input type="date" className="mt-2" {...register("dob_ad")} />
                      {errors.dob_ad && <p className="text-sm text-red-500 mt-1">{errors.dob_ad.message}</p>}
                    </div>

                    <div>
                      <Label>Date of Birth (B.S)</Label>
                      <Input className="mt-2" readOnly placeholder="Auto from A.D" {...register("dob_bs")} />
                      {errors.dob_bs && <p className="text-sm text-red-500 mt-1">{errors.dob_bs.message}</p>}
                    </div>
                  </div>
                </div>

                {/* Permanent Address */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">{t("kycAdd.permanentAddress")}</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label>{t("kycAdd.province")} *</Label>
                      <Controller
                        control={control}
                        name="province_id"
                        render={({ field }) => (
                          <Select
                            value={field.value}
                            onValueChange={(v) => {
                              field.onChange(v);
                              setValue("district_id", "", { shouldValidate: true });
                              setValue("municipality_id", "", { shouldValidate: true });
                            }}
                          >
                            <SelectTrigger className="mt-2">
                              <SelectValue placeholder="Province" />
                            </SelectTrigger>
                            <SelectContent>
                              {provinces.map((p: any) => (
                                <SelectItem key={p.id} value={String(p.id)}>
                                  {p.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.province_id && <p className="text-sm text-red-500 mt-1">{errors.province_id.message}</p>}
                    </div>

                    <div>
                      <Label>{t("kycAdd.district")} *</Label>
                      <Controller
                        control={control}
                        name="district_id"
                        render={({ field }) => (
                          <Select
                            value={field.value}
                            onValueChange={(v) => {
                              field.onChange(v);
                              setValue("municipality_id", "", { shouldValidate: true });
                            }}
                            disabled={!provinceId}
                          >
                            <SelectTrigger className="mt-2">
                              <SelectValue placeholder="District" />
                            </SelectTrigger>
                            <SelectContent>
                              {districts.map((d: any) => (
                                <SelectItem key={d.id} value={String(d.id)}>
                                  {d.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.district_id && <p className="text-sm text-red-500 mt-1">{errors.district_id.message}</p>}
                    </div>

                    <div>
                      <Label>{t("kycAdd.municipality")} *</Label>
                      <Controller
                        control={control}
                        name="municipality_id"
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange} disabled={!districtId}>
                            <SelectTrigger className="mt-2">
                              <SelectValue placeholder="Municipality" />
                            </SelectTrigger>
                            <SelectContent>
                              {municipalities.map((m: any) => (
                                <SelectItem key={m.id} value={String(m.id)}>
                                  {m.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.municipality_id && <p className="text-sm text-red-500 mt-1">{errors.municipality_id.message}</p>}
                    </div>

                    <div>
                      <Label>{t("kycAdd.wardNumber")} *</Label>
                      <Input className="mt-2" placeholder="Ward no" {...register("ward_no")} />
                      {errors.ward_no && <p className="text-sm text-red-500 mt-1">{errors.ward_no.message}</p>}
                    </div>
                  </div>
                </div>

                {/* Temporary Address */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">{t("kycAdd.temporaryAddress")}</h3>
                  <div className="flex items-center space-x-2 mb-4">
                    <Controller
                      control={control}
                      name="same_address"
                      render={({ field }) => (
                        <Checkbox id="sameAddress" checked={!!field.value} onCheckedChange={(v) => field.onChange(Boolean(v))} />
                      )}
                    />
                    <Label htmlFor="sameAddress">{t("kycAdd.sameAsPermanent")}</Label>
                  </div>

                  {!sameAddress && (
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>Temporary address (English) *</Label>
                        <Input className="mt-2" placeholder="Temporary address" {...register("temp_address_en")} />
                        {errors.temp_address_en && <p className="text-sm text-red-500 mt-1">{errors.temp_address_en.message}</p>}
                      </div>
                      <div>
                        <Label>अस्थायी ठेगाना (नेपाली) *</Label>
                        <Input className="mt-2" lang="ne" placeholder="नेपाली ठेगाना" {...register("temp_address_np")} />
                        {errors.temp_address_np && <p className="text-sm text-red-500 mt-1">{errors.temp_address_np.message}</p>}
                      </div>
                    </div>
                  )}
                </div>

                {/* Identification + Relation */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Identification & Relation</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label>Document Type *</Label>
                      <Controller
                        control={control}
                        name="doc_type"
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className="mt-2">
                              <SelectValue placeholder="Select Document Type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="citizenship">Citizenship</SelectItem>
                              <SelectItem value="passport">Passport</SelectItem>
                              <SelectItem value="nid">NID</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.doc_type && <p className="text-sm text-red-500 mt-1">{errors.doc_type.message}</p>}
                    </div>

                    <div>
                      <Label>ID No *</Label>
                      <Input className="mt-2" placeholder="ID Number" {...register("id_no")} />
                      {errors.id_no && <p className="text-sm text-red-500 mt-1">{errors.id_no.message}</p>}
                    </div>

                    <div>
                      <Label>Issued District *</Label>
                      <Input className="mt-2" placeholder="Issued District" {...register("issued_district")} />
                      {errors.issued_district && <p className="text-sm text-red-500 mt-1">{errors.issued_district.message}</p>}
                    </div>

                    <div>
                      <Label>Issue Date (A.D) *</Label>
                      <Input type="date" className="mt-2" {...register("issue_date_ad")} />
                      {errors.issue_date_ad && <p className="text-sm text-red-500 mt-1">{errors.issue_date_ad.message}</p>}
                    </div>

                    <div>
                      <Label>Issue Date (B.S)</Label>
                      <Input className="mt-2" readOnly placeholder="Auto from A.D" {...register("issue_date_bs")} />
                      {errors.issue_date_bs && <p className="text-sm text-red-500 mt-1">{errors.issue_date_bs.message}</p>}
                    </div>

                    <div className="md:col-span-3 mt-2">
                      <div className="flex items-center gap-2">
                        <Controller
                          control={control}
                          name="politically_involved"
                          render={({ field }) => (
                            <Checkbox checked={!!field.value} onCheckedChange={(v) => field.onChange(Boolean(v))} />
                          )}
                        />
                        <Label>Politically involved?</Label>
                      </div>
                    </div>

                    <div>
                      <Label>Father Name (English) *</Label>
                      <Input className="mt-2" placeholder="Father Name" {...register("father_name")} />
                      {errors.father_name && <p className="text-sm text-red-500 mt-1">{errors.father_name.message}</p>}
                    </div>

                    <div>
                      <Label>बुवाको नाम (नेपाली) *</Label>
                      <Input className="mt-2" lang="ne" placeholder="नेपालीमा लेख्नुहोस्" {...register("father_name_nep")} />
                      {errors.father_name_nep && <p className="text-sm text-red-500 mt-1">{errors.father_name_nep.message}</p>}
                    </div>

                    <div>
                      <Label>Father Citizenship No *</Label>
                      <Input className="mt-2" placeholder="Citizenship No" {...register("father_citizenship_no")} />
                      {errors.father_citizenship_no && <p className="text-sm text-red-500 mt-1">{errors.father_citizenship_no.message}</p>}
                    </div>

                    <div>
                      <Label>Father Citizenship Issued District *</Label>
                      <Input className="mt-2" placeholder="Issued District" {...register("father_citizenship_issued_district")} />
                      {errors.father_citizenship_issued_district && (
                        <p className="text-sm text-red-500 mt-1">{errors.father_citizenship_issued_district.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Others */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">{t("kycAdd.others")}</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label>{t("kycAdd.occupation")} *</Label>
                      <Controller
                        control={control}
                        name="occupation"
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className="mt-2">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="business">Business</SelectItem>
                              <SelectItem value="service">Service</SelectItem>
                              <SelectItem value="student">Student</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.occupation && <p className="text-sm text-red-500 mt-1">{errors.occupation.message}</p>}
                    </div>
                  </div>
                </div>

                {/* Attachments (ALL OPTIONAL) */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">{t("kycAdd.attachments")}</h3>
                  <p className="text-sm text-muted-foreground mb-4">All uploads are optional.</p>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Profile Photo (optional)</Label>
                      <Input
                        type="file"
                        accept="image/*"
                        className="mt-2"
                        onChange={(e) => setValue("image_profile", e.target.files?.[0] ?? null, { shouldValidate: true })}
                      />
                      {errors.image_profile && <p className="text-sm text-red-500 mt-1">{String(errors.image_profile.message)}</p>}
                    </div>

                    {docType === "citizenship" && (
                      <>
                        <div>
                          <Label>Citizenship Front (optional)</Label>
                          <Input type="file" accept="image/*" className="mt-2"
                            onChange={(e) => setValue("ctz_front", e.target.files?.[0] ?? null, { shouldValidate: true })}
                          />
                        </div>
                        <div>
                          <Label>Citizenship Back (optional)</Label>
                          <Input type="file" accept="image/*" className="mt-2"
                            onChange={(e) => setValue("ctz_back", e.target.files?.[0] ?? null, { shouldValidate: true })}
                          />
                        </div>
                      </>
                    )}

                    {docType === "passport" && (
                      <>
                        <div>
                          <Label>Passport Front (optional)</Label>
                          <Input type="file" accept="image/*" className="mt-2"
                            onChange={(e) => setValue("passport_front", e.target.files?.[0] ?? null, { shouldValidate: true })}
                          />
                        </div>
                        <div>
                          <Label>Passport Back (optional)</Label>
                          <Input type="file" accept="image/*" className="mt-2"
                            onChange={(e) => setValue("passport_back", e.target.files?.[0] ?? null, { shouldValidate: true })}
                          />
                        </div>
                      </>
                    )}

                    {docType === "nid" && (
                      <>
                        <div>
                          <Label>NID Front (optional)</Label>
                          <Input type="file" accept="image/*" className="mt-2"
                            onChange={(e) => setValue("nid_front", e.target.files?.[0] ?? null, { shouldValidate: true })}
                          />
                        </div>
                        <div>
                          <Label>NID Back (optional)</Label>
                          <Input type="file" accept="image/*" className="mt-2"
                            onChange={(e) => setValue("nid_back", e.target.files?.[0] ?? null, { shouldValidate: true })}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {submitCount > 0 && !isValid && (
                  <p className="text-sm text-red-500">Please fix the errors in the form before submitting.</p>
                )}

                <div className="flex justify-end">
                  <Button type="submit" size="lg" className="bg-primary hover:bg-primary/90" disabled={!isValid || isSubmitting}>
                    {isSubmitting ? "Submitting..." : "Submit"}
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
