import React, { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";

import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { useLanguage } from "@/contexts/LanguageContext";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, XCircle, CheckCircle2 } from "lucide-react";

import { kycRejectForm } from "@/api/kyc/kycRejectForm";
import { ProvinceDistrictMunicipality } from "./getcatalogue/ProvinceDistrictMunicipality";
import { Occupation } from "./getcatalogue/Occupation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { KycDetail, FormState } from "@/lib/kycTypes";
import {
  submitCustomerKyc,
  type CustomerKycFormEntity,
} from "@/api/kyc/customerKycClient";

const MB_1 = 1024 * 1024;

/** ---------------- Helpers ---------------- */
function buildInitialForm(data?: KycDetail | null): FormState {
  const d = data?.kyc_detail;
  const name = d?.customer_Name;
  const id = d?.identification;
  const info = d?.customerInformation;
  const addr = d?.address;
  const contact = d?.contact;
  const rel = d?.relation;

  return {
    honour: name?.honour ?? "",
    first_Name: name?.first_Name ?? "",
    last_Name: name?.last_Name ?? "",
    first_Name_nep: name?.first_Name_nep ?? "",
    middle_Name_nep: name?.middle_Name_nep ?? "",
    last_Name_nep: name?.last_Name_nep ?? "",

    id_Type: id?.id_Type ?? "",
    id_No: id?.id_No ?? "",
    issued_District: id?.issued_District ?? "",
    issue_Date_AD: id?.issue_Date_AD ?? "",
    issue_Date_BS: id?.issue_Date_BS ?? "",

    gender: info?.gender ?? "",
    date_Of_Birth_AD: info?.date_Of_Birth_AD ?? "",
    date_Of_Birth_BS: info?.date_Of_Birth_BS ?? "",
    occupation: info?.occupation ?? "",
    sub_Occupation: info?.sub_Occupation ?? "",

    province: addr?.province ?? "",
    district: addr?.district ?? "",
    local_level: addr?.local_level ?? "",
    ward_No: addr?.ward_No ?? "",
    residence_Country: addr?.residence_Country ?? "",
    tole: addr?.tole ?? "",
    tole_nep: addr?.tole_nep ?? "",
    permanent_Address: addr?.permanent_Address ?? "",
    permanent_Address_nep: addr?.permanent_Address_nep ?? "",
    temporary_Address: addr?.temporary_Address ?? "",
    temporary_Address_nep: addr?.temporary_Address_nep ?? "",

    mobile: contact?.mobile ?? "",
    email: contact?.email ?? "",

    father_Name: rel?.father_Name ?? "",
    father_Name_nep: rel?.father_Name_nep ?? "",
  };
}

function formatApiErrors(list?: KycDetail["error_list"]) {
  if (!list || !Array.isArray(list) || list.length === 0) return [];
  return list
    .map((e) => {
      const code = e?.error_code ? `[${e.error_code}] ` : "";
      const msg = e?.error_message ?? "";
      return `${code}${msg}`.trim();
    })
    .filter(Boolean);
}

function InlineError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <div className="text-xs text-destructive flex items-center gap-2 mt-1">
      <XCircle className="h-4 w-4" />
      {msg}
    </div>
  );
}

/** ---------- Single image dropzone ---------- */
type DropzoneProps = {
  label: string;
  existingUrl?: string;
  value: File | null;
  error?: string;
  onChange: (file: File | null) => void;
};

function SingleImageDropzone({
  label,
  existingUrl,
  value,
  error,
  onChange,
}: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);

  const previewUrl = useMemo(() => {
    if (!value) return "";
    return URL.createObjectURL(value);
  }, [value]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const pickFile = () => inputRef.current?.click();

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    onChange(file);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0] ?? null;
    onChange(file);
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>

      <div
        className={[
          "rounded-xl border p-4 cursor-pointer select-none",
          dragging ? "border-primary bg-primary/5" : "bg-background",
          error ? "border-destructive" : "",
        ].join(" ")}
        role="button"
        tabIndex={0}
        onClick={pickFile}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") pickFile();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onInputChange}
        />

        <div className="text-sm opacity-80">Drop image here or click (max 1MB)</div>

        <div className="mt-3 rounded-lg overflow-hidden border bg-muted">
          {value ? (
            <img
              src={previewUrl}
              className="h-44 w-full object-cover"
              alt={`${label}-preview`}
            />
          ) : existingUrl ? (
            <img
              src={existingUrl}
              className="h-44 w-full object-cover"
              alt={`${label}-existing`}
            />
          ) : (
            <div className="h-44 w-full" />
          )}
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="text-xs opacity-70 truncate">
            {value
              ? `${value.name} • ${(value.size / 1024).toFixed(0)} KB`
              : existingUrl
                ? "Existing image loaded"
                : "No image selected"}
          </div>

          {value && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
            >
              Remove
            </Button>
          )}
        </div>
      </div>

      <InlineError msg={error} />
    </div>
  );
}

/** ---------------- ZOD ---------------- */
// allow empty string for optional
const optStr = z.string().optional().or(z.literal(""));

const adDate = z
  .string()
  .min(1, "AD date is required")
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use AD format: YYYY-MM-DD");

const bsDate = z
  .string()
  .min(1, "BS date is required")
  .regex(/^\d{4}[-/]\d{2}[-/]\d{2}$/, "Use BS format: YYYY-MM-DD (or YYYY/MM/DD)");

const Schema = z
  .object({
    honour: optStr,

    first_Name: z.string().min(1, "First name (English) is required"),
    last_Name: z.string().min(1, "Last name (English) is required"),

    first_Name_nep: z.string().min(1, "First name (Nepali) is required"),
    middle_Name_nep: optStr,
    last_Name_nep: z.string().min(1, "Last name (Nepali) is required"),

    id_Type: z.string().min(1, "ID type is required"),
    id_No: z.string().min(1, "ID number is required"),
    issued_District: z.string().min(1, "Issued district is required"),
    issue_Date_AD: optStr.or(adDate).optional(),
    issue_Date_BS: optStr.or(bsDate).optional(),

    gender: z.string().min(1, "Gender is required"),
    date_Of_Birth_AD: adDate,
    date_Of_Birth_BS: bsDate,

    occupation: z.string().min(1, "Occupation is required").optional().or(z.literal("")),
    sub_Occupation: optStr,

    province: z.string().min(1, "Province is required"),
    district: z.string().min(1, "District is required"),
    local_level: z.string().min(1, "Municipality/Local level is required"),
    ward_No: z.string().min(1, "Ward no is required"),

    residence_Country: optStr,
    tole: optStr,
    tole_nep: optStr,

    permanent_Address: optStr,
    permanent_Address_nep: optStr,
    temporary_Address: optStr,
    temporary_Address_nep: optStr,

    mobile: z.string().min(7, "Mobile is required"),
    email: z.union([z.literal(""), z.string().email("Invalid email")]).optional(),

    father_Name: z.string().min(1, "Father name is required"),
    father_Name_nep: z.string().min(1, "Father name (Nepali) is required"),

    docType: z.enum(["citizenship", "passport", "nid"]),
    images: z.object({
      profile: z.any().optional(),
      ctzFront: z.any().optional(),
      ctzBack: z.any().optional(),
      passportFront: z.any().optional(),
      passportBack: z.any().optional(),
      nidFront: z.any().optional(),
      nidBack: z.any().optional(),
    }),
  })
  .superRefine((v, ctx) => {
    const isFile = (x: any) => x instanceof File;

    // Require ONLY the docType required docs (dropdown removed but docType exists internally)
    if (v.docType === "citizenship") {
      if (!isFile(v.images.ctzFront)) {
        ctx.addIssue({ code: "custom", path: ["images", "ctzFront"], message: "Citizenship front image is required" });
      }
      if (!isFile(v.images.ctzBack)) {
        ctx.addIssue({ code: "custom", path: ["images", "ctzBack"], message: "Citizenship back image is required" });
      }
    }

    if (v.docType === "passport") {
      if (!isFile(v.images.passportFront)) {
        ctx.addIssue({ code: "custom", path: ["images", "passportFront"], message: "Passport front image is required" });
      }
      if (!isFile(v.images.passportBack)) {
        ctx.addIssue({ code: "custom", path: ["images", "passportBack"], message: "Passport back image is required" });
      }
    }

    if (v.docType === "nid") {
      if (!isFile(v.images.nidFront)) {
        ctx.addIssue({ code: "custom", path: ["images", "nidFront"], message: "NID front image is required" });
      }
      if (!isFile(v.images.nidBack)) {
        ctx.addIssue({ code: "custom", path: ["images", "nidBack"], message: "NID back image is required" });
      }
    }
  });

type FieldErrors = Partial<Record<keyof FormState, string>>;
type ImgErrors = Partial<
  Record<
    | "profile"
    | "ctzFront"
    | "ctzBack"
    | "passportFront"
    | "passportBack"
    | "nidFront"
    | "nidBack",
    string
  >
>;

function mapApiErrorsToFields(error_list: any[] | undefined) {
  const img: ImgErrors = {};
  const top: string[] = [];

  (error_list || []).forEach((e) => {
    const msg = String(e?.error_message || "");
    const m = msg.toLowerCase();

    if (m.includes("customer_image.ctz_image_front")) img.ctzFront = msg;
    else if (m.includes("customer_image.ctz_image_back")) img.ctzBack = msg;
    else if (m.includes("customer_image.passport_image_front")) img.passportFront = msg;
    else if (m.includes("customer_image.passport_image_back")) img.passportBack = msg;
    else if (m.includes("customer_image.nid_image_front")) img.nidFront = msg;
    else if (m.includes("customer_image.nid_image_back")) img.nidBack = msg;
    else if (m.includes("customer_image.image_profile")) img.profile = msg;
    else top.push(msg);
  });

  return { img, top };
}

type DocType = "citizenship" | "passport" | "nid";

/** infer docType from API images (dropdown removed) */
function inferDocTypeFromApi(img: any): DocType {
  // priority: passport > nid > citizenship (adjust if your backend prefers differently)
  if (img?.passport_name_front || img?.passport_name_back) return "passport";
  if (img?.nid_name_front || img?.nid_name_back || img?.nid_front || img?.nid_back) return "nid";
  if (img?.ctz_name_front || img?.ctz_name_back) return "citizenship";
  return "citizenship";
}

export default function ResubmitKycForm() {
  const { t } = useLanguage();

  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [apiResponse, setApiResponse] = useState<KycDetail | null>(null);

  const [form, setForm] = useState<FormState>(() => buildInitialForm(null));
  const initialSnapshot = useRef<FormState>(buildInitialForm(null));

  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [submitErrorsList, setSubmitErrorsList] = useState<KycDetail["error_list"]>([]);

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // ✅ dropdown removed, docType is internal only (inferred from API)
  const [docType, setDocType] = useState<DocType>("citizenship");

  // images
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [ctzFrontFile, setCtzFrontFile] = useState<File | null>(null);
  const [ctzBackFile, setCtzBackFile] = useState<File | null>(null);
  const [passportFrontFile, setPassportFrontFile] = useState<File | null>(null);
  const [passportBackFile, setPassportBackFile] = useState<File | null>(null);
  const [nidFrontFile, setNidFrontFile] = useState<File | null>(null);
  const [nidBackFile, setNidBackFile] = useState<File | null>(null);

  const [imgErrors, setImgErrors] = useState<ImgErrors>({});

  // Load rejected form
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setApiError("");

        const res = await kycRejectForm();
        const data: KycDetail = (res as any)?.data ?? (res as any);
        if (!mounted) return;

        setApiResponse(data);

        const nextInitial = buildInitialForm(data);
        initialSnapshot.current = nextInitial;
        setForm(nextInitial);

        // ✅ infer docType from API images; no dropdown
        const img = data?.kyc_detail?.customer_image;
        setDocType(inferDocTypeFromApi(img));
      } catch (e: any) {
        if (!mounted) return;
        setApiError(e?.message || "Failed to load rejected KYC data");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const apiErrors = useMemo(() => formatApiErrors(apiResponse?.error_list), [apiResponse]);
  const submitErrors = useMemo(() => formatApiErrors(submitErrorsList), [submitErrorsList]);

  const onTextChange =
    (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((p) => ({ ...p, [key]: e.target.value }));
      setFieldErrors((p) => ({ ...p, [key]: undefined }));
    };

  // 1MB validation helper
  const validateAndSetImage =
    (key: keyof ImgErrors, setter: (f: File | null) => void) =>
      (file: File | null) => {
        setImgErrors((p) => ({ ...p, [key]: undefined }));

        if (!file) {
          setter(null);
          return;
        }
        if (!file.type.startsWith("image/")) {
          setImgErrors((p) => ({ ...p, [key]: "Only image files are allowed." }));
          setter(null);
          return;
        }
        if (file.size > MB_1) {
          setImgErrors((p) => ({ ...p, [key]: "Max file size is 1MB." }));
          setter(null);
          return;
        }
        setter(file);
      };

  /** ZOD validate & set errors */
  const validateWithZod = () => {
    setSubmitError("");
    setSubmitErrorsList([]);
    setSubmitSuccess("");

    const input = {
      ...form,
      docType,
      images: {
        profile: profileFile,
        ctzFront: ctzFrontFile,
        ctzBack: ctzBackFile,
        passportFront: passportFrontFile,
        passportBack: passportBackFile,
        nidFront: nidFrontFile,
        nidBack: nidBackFile,
      },
    };

    const parsed = Schema.safeParse(input);

    const nextFieldErrors: FieldErrors = {};
    const nextImgErrors: ImgErrors = {};

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const path = issue.path.join(".");
        const msg = issue.message;

        if (path === "images.ctzFront") nextImgErrors.ctzFront = msg;
        else if (path === "images.ctzBack") nextImgErrors.ctzBack = msg;
        else if (path === "images.passportFront") nextImgErrors.passportFront = msg;
        else if (path === "images.passportBack") nextImgErrors.passportBack = msg;
        else if (path === "images.nidFront") nextImgErrors.nidFront = msg;
        else if (path === "images.nidBack") nextImgErrors.nidBack = msg;
        else {
          const k = issue.path[0] as keyof FormState;
          nextFieldErrors[k] = msg;
        }
      }

      setFieldErrors(nextFieldErrors);
      setImgErrors((p) => ({ ...p, ...nextImgErrors }));

      setSubmitError("Please fix validation errors before submitting.");
      return false;
    }

    setFieldErrors({});
    return true;
  };

  /** map FormState -> CustomerKycFormEntity */
  const toCustomerEntity = (): CustomerKycFormEntity => ({
    honour: form.honour,

    first_name_eng: form.first_Name,
    middle_name_eng: "",
    last_name_eng: form.last_Name,

    first_name_nep: form.first_Name_nep,
    middle_name_nep: form.middle_Name_nep || "",
    last_name_nep: form.last_Name_nep,

    id_type: form.id_Type,
    id_no: form.id_No,
    issued_district: form.issued_District,
    issue_date_ad: form.issue_Date_AD || "",
    issue_date_bs: form.issue_Date_BS || "",

    province: form.province,
    district: form.district,
    local_level: form.local_level,
    ward_no: form.ward_No,
    residence_country: form.residence_Country || "NEPAL",

    tole: form.tole || "",
    tole_nep: form.tole_nep || "",

    mobile: form.mobile,
    email: form.email || "",

    father_name: form.father_Name,
    father_name_nep: form.father_Name_nep,
    father_citizenship_no: "",
    father_citizenship_issued_district: "",

    gender: form.gender,
    dob_ad: form.date_Of_Birth_AD,
    dob_bs: form.date_Of_Birth_BS,
    occupation: form.occupation || "",

    politically_involved: false,
    party_inspection_category: "",
    risk_factors: "",

    // ✅ doc_type still required by API; user can't change now
    doc_type: docType,

    image_profile: profileFile,

    ctz_front: docType === "citizenship" ? ctzFrontFile : null,
    ctz_back: docType === "citizenship" ? ctzBackFile : null,

    passport_front: docType === "passport" ? passportFrontFile : null,
    passport_back: docType === "passport" ? passportBackFile : null,

    nid_front: docType === "nid" ? nidFrontFile : null,
    nid_back: docType === "nid" ? nidBackFile : null,
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const ok = validateWithZod();
    if (!ok) return;

    setSubmitLoading(true);
    setSubmitError("");
    setSubmitErrorsList([]);
    setSubmitSuccess("");

    try {
      const entity = toCustomerEntity();
      const res = await submitCustomerKyc(entity, { debug: true });
      console.log("SUBMIT OK:", res);
      setSubmitSuccess("KYC submitted successfully.");
    } catch (err: any) {
      console.error("SUBMIT FAIL:", err);

      const apiList =
        err?.debug?.response_json?.error_list ||
        err?.response_json?.error_list ||
        [];

      setSubmitError(err?.message || "Submit failed");
      if (Array.isArray(apiList)) setSubmitErrorsList(apiList);

      const { img } = mapApiErrorsToFields(apiList);
      if (Object.keys(img).length) {
        setImgErrors((p) => ({ ...p, ...img }));
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  const onReset = () => {
    setForm(initialSnapshot.current);

    setProfileFile(null);
    setCtzFrontFile(null);
    setCtzBackFile(null);
    setPassportFrontFile(null);
    setPassportBackFile(null);
    setNidFrontFile(null);
    setNidBackFile(null);

    setImgErrors({});
    setFieldErrors({});

    setSubmitError("");
    setSubmitErrorsList([]);
    setSubmitSuccess("");
  };

  const img = apiResponse?.kyc_detail?.customer_image;

  const requiredLabel = (type: DocType) => (docType === type ? "required" : "optional");

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Header />

        <main className="flex-1 p-8">
          <h1 className="text-4xl font-bold mb-8">
            <span className="text-secondary">Re-submit KYC Form</span>
          </h1>

          {/* ✅ inferred docType info (no dropdown) */}
          <div className="mb-4 text-sm opacity-80">
            Document Type (auto from rejected KYC):{" "}
            <span className="font-semibold uppercase">{docType}</span>
          </div>

          {submitSuccess && (
            <Alert className="mb-6 bg-emerald-50 border-emerald-500">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <AlertDescription className="text-emerald-700">{submitSuccess}</AlertDescription>
            </Alert>
          )}

          {submitError && (
            <Alert className="mb-6 bg-destructive/10 border-destructive">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <AlertDescription className="text-destructive">{submitError}</AlertDescription>
            </Alert>
          )}

          {submitErrors.length > 0 && (
            <Alert className="mb-6 bg-destructive/10 border-destructive">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <AlertDescription className="text-destructive">
                <div className="font-medium mb-2">Submit Errors</div>
                <ul className="list-disc pl-5 space-y-1">
                  {submitErrors.map((msg, i) => (
                    <li key={i}>{msg}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {apiError && (
            <Alert className="mb-6 bg-destructive/10 border-destructive">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <AlertDescription className="text-destructive">{apiError}</AlertDescription>
            </Alert>
          )}

          {apiErrors.length > 0 && (
            <Alert className="mb-6 bg-destructive/10 border-destructive">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <AlertDescription className="text-destructive">
                <div className="font-medium mb-2">API Errors</div>
                <ul className="list-disc pl-5 space-y-1">
                  {apiErrors.map((msg, i) => (
                    <li key={i}>{msg}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {loading && <div className="mb-6 text-sm opacity-70">Loading rejected KYC data...</div>}

          <Card className="mb-8">
            <CardContent className="space-y-8">
              <form onSubmit={onSubmit} className="space-y-8">
                {/* Your form sections... (UNCHANGED) */}
                {/* Name */}
                <div>
                  <div className="text-sm font-semibold mb-3 mt-4">Your Information</div>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Honour</Label>
                      <Input value={form.honour} onChange={onTextChange("honour")} />
                      <InlineError msg={fieldErrors.honour} />
                    </div>

                    <div className="space-y-2">
                      <Label>First Name (English)</Label>
                      <Input
                        value={form.first_Name}
                        onChange={onTextChange("first_Name")}
                        className={fieldErrors.first_Name ? "border-destructive" : ""}
                      />
                      <InlineError msg={fieldErrors.first_Name} />
                    </div>

                    <div className="space-y-2">
                      <Label>Last Name (English)</Label>
                      <Input
                        value={form.last_Name}
                        onChange={onTextChange("last_Name")}
                        className={fieldErrors.last_Name ? "border-destructive" : ""}
                      />
                      <InlineError msg={fieldErrors.last_Name} />
                    </div>

                    <div className="space-y-2">
                      <Label>First Name (Nepali)</Label>
                      <Input
                        value={form.first_Name_nep}
                        onChange={onTextChange("first_Name_nep")}
                        className={fieldErrors.first_Name_nep ? "border-destructive" : ""}
                      />
                      <InlineError msg={fieldErrors.first_Name_nep} />
                    </div>

                    <div className="space-y-2">
                      <Label>Middle Name (Nepali)</Label>
                      <Input
                        value={form.middle_Name_nep}
                        onChange={onTextChange("middle_Name_nep")}
                        className={fieldErrors.middle_Name_nep ? "border-destructive" : ""}
                      />
                      <InlineError msg={fieldErrors.middle_Name_nep} />
                    </div>

                    <div className="space-y-2">
                      <Label>Last Name (Nepali)</Label>
                      <Input
                        value={form.last_Name_nep}
                        onChange={onTextChange("last_Name_nep")}
                        className={fieldErrors.last_Name_nep ? "border-destructive" : ""}
                      />
                      <InlineError msg={fieldErrors.last_Name_nep} />
                    </div>
                  </div>
                </div>

                {/* Identification */}
                <div>
                  <div className="text-sm font-semibold mb-3">Identification</div>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>ID Type</Label>
                      <Input
                        value={form.id_Type}
                        onChange={onTextChange("id_Type")}
                        className={fieldErrors.id_Type ? "border-destructive" : ""}
                      />
                      <InlineError msg={fieldErrors.id_Type} />
                    </div>

                    <div className="space-y-2">
                      <Label>ID No</Label>
                      <Input
                        value={form.id_No}
                        onChange={onTextChange("id_No")}
                        className={fieldErrors.id_No ? "border-destructive" : ""}
                      />
                      <InlineError msg={fieldErrors.id_No} />
                    </div>

                    <div className="space-y-2">
                      <Label>Issued District</Label>
                      <Input
                        value={form.issued_District}
                        onChange={onTextChange("issued_District")}
                        className={fieldErrors.issued_District ? "border-destructive" : ""}
                      />
                      <InlineError msg={fieldErrors.issued_District} />
                    </div>

                    <div className="space-y-2">
                      <Label>Issue Date (AD)</Label>
                      <Input
                        placeholder="YYYY-MM-DD"
                        value={form.issue_Date_AD}
                        onChange={onTextChange("issue_Date_AD")}
                        className={fieldErrors.issue_Date_AD ? "border-destructive" : ""}
                      />
                      <InlineError msg={fieldErrors.issue_Date_AD} />
                    </div>

                    <div className="space-y-2">
                      <Label>Issue Date (BS)</Label>
                      <Input
                        placeholder="YYYY-MM-DD"
                        value={form.issue_Date_BS}
                        onChange={onTextChange("issue_Date_BS")}
                        className={fieldErrors.issue_Date_BS ? "border-destructive" : ""}
                      />
                      <InlineError msg={fieldErrors.issue_Date_BS} />
                    </div>
                  </div>
                </div>

                {/* Customer Information */}
                <div>
                  <div className="text-sm font-semibold mb-3">Customer Information</div>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Gender</Label>
                      <Select
                        value={form.gender}
                        onValueChange={(v) => {
                          setForm((p) => ({ ...p, gender: v }));
                          setFieldErrors((p) => ({ ...p, gender: undefined }));
                        }}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="M">Male</SelectItem>
                          <SelectItem value="F">Female</SelectItem>
                          <SelectItem value="T">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <InlineError msg={fieldErrors.gender} />
                    </div>

                    <div className="space-y-2">
                      <Label>Date of Birth (AD)</Label>
                      <Input
                        placeholder="YYYY-MM-DD"
                        value={form.date_Of_Birth_AD}
                        onChange={onTextChange("date_Of_Birth_AD")}
                        className={fieldErrors.date_Of_Birth_AD ? "border-destructive" : ""}
                      />
                      <InlineError msg={fieldErrors.date_Of_Birth_AD} />
                    </div>

                    <div className="space-y-2">
                      <Label>Date of Birth (BS)</Label>
                      <Input
                        placeholder="YYYY-MM-DD"
                        value={form.date_Of_Birth_BS}
                        onChange={onTextChange("date_Of_Birth_BS")}
                        className={fieldErrors.date_Of_Birth_BS ? "border-destructive" : ""}
                      />
                      <InlineError msg={fieldErrors.date_Of_Birth_BS} />
                    </div>

                    <div className="space-y-2">
                      <Occupation
                        value={form.occupation}
                        onChange={(v) => {
                          setForm((p) => ({ ...p, occupation: v }));
                          setFieldErrors((p) => ({ ...p, occupation: undefined }));
                        }}
                      />
                      <InlineError msg={fieldErrors.occupation} />
                    </div>

                    <div className="space-y-2">
                      <Label>Sub Occupation</Label>
                      <Input
                        value={form.sub_Occupation}
                        onChange={onTextChange("sub_Occupation")}
                      />
                      <InlineError msg={fieldErrors.sub_Occupation} />
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <div className="text-sm font-semibold mb-3">Address</div>
                  <div className="grid md:grid-cols-3 gap-4">
                    <ProvinceDistrictMunicipality
                      value={{
                        province: form.province,
                        district: form.district,
                        local_level: form.local_level,
                      }}
                      onChange={(v) =>
                        setForm((p) => ({
                          ...p,
                          province: v.province,
                          district: v.district,
                          local_level: v.local_level,
                        }))
                      }
                    />
                    <InlineError msg={fieldErrors.province || fieldErrors.district || fieldErrors.local_level} />

                    <div className="space-y-2">
                      <Label>Ward No</Label>
                      <Input
                        value={form.ward_No}
                        onChange={onTextChange("ward_No")}
                        className={fieldErrors.ward_No ? "border-destructive" : ""}
                      />
                      <InlineError msg={fieldErrors.ward_No} />
                    </div>
                  </div>
                </div>

                {/* Contact */}
                <div>
                  <div className="text-sm font-semibold mb-3">Contact</div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Mobile</Label>
                      <Input
                        value={form.mobile}
                        onChange={onTextChange("mobile")}
                        className={fieldErrors.mobile ? "border-destructive" : ""}
                      />
                      <InlineError msg={fieldErrors.mobile} />
                    </div>

                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        value={form.email}
                        onChange={onTextChange("email")}
                        className={fieldErrors.email ? "border-destructive" : ""}
                      />
                      <InlineError msg={fieldErrors.email} />
                    </div>
                  </div>
                </div>

                {/* Relation */}
                <div>
                  <div className="text-sm font-semibold mb-3">Relation</div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Father Name</Label>
                      <Input
                        value={form.father_Name}
                        onChange={onTextChange("father_Name")}
                        className={fieldErrors.father_Name ? "border-destructive" : ""}
                      />
                      <InlineError msg={fieldErrors.father_Name} />
                    </div>

                    <div className="space-y-2">
                      <Label>Father Name (Nepali)</Label>
                      <Input
                        value={form.father_Name_nep}
                        onChange={onTextChange("father_Name_nep")}
                        className={fieldErrors.father_Name_nep ? "border-destructive" : ""}
                      />
                      <InlineError msg={fieldErrors.father_Name_nep} />
                    </div>
                  </div>
                </div>

                {/* ✅ Images (ALL SHOWN ALWAYS, existing API urls included) */}
                <div className="grid md:grid-cols-3 gap-4">
                  <SingleImageDropzone
                    label={`Profile Image (${requiredLabel(docType)} for your current doc type)`}
                    existingUrl={img?.image_name_profile}
                    value={profileFile}
                    error={imgErrors.profile}
                    onChange={validateAndSetImage("profile", setProfileFile)}
                  />

                  <SingleImageDropzone
                    label={`Citizenship Front (${requiredLabel("citizenship")})`}
                    existingUrl={img?.ctz_name_front}
                    value={ctzFrontFile}
                    error={imgErrors.ctzFront}
                    onChange={validateAndSetImage("ctzFront", setCtzFrontFile)}
                  />
                  <SingleImageDropzone
                    label={`Citizenship Back (${requiredLabel("citizenship")})`}
                    existingUrl={img?.ctz_name_back}
                    value={ctzBackFile}
                    error={imgErrors.ctzBack}
                    onChange={validateAndSetImage("ctzBack", setCtzBackFile)}
                  />

                  <SingleImageDropzone
                    label={`Passport Front (${requiredLabel("passport")})`}
                    existingUrl={img?.passport_name_front}
                    value={passportFrontFile}
                    error={imgErrors.passportFront}
                    onChange={validateAndSetImage("passportFront", setPassportFrontFile)}
                  />
                  <SingleImageDropzone
                    label={`Passport Back (${requiredLabel("passport")})`}
                    existingUrl={img?.passport_name_back}
                    value={passportBackFile}
                    error={imgErrors.passportBack}
                    onChange={validateAndSetImage("passportBack", setPassportBackFile)}
                  />

                 
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button type="submit" className="sm:w-auto w-full" disabled={submitLoading}>
                    {submitLoading ? "Submitting..." : "Submit"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onReset}
                    className="sm:w-auto w-full"
                    disabled={submitLoading}
                  >
                    Reset
                  </Button>
                </div>
              </form>

              <div className="text-xs opacity-70">
                KYC Status: {apiResponse?.kyc_status ?? "Unknown"}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
