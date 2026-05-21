// src/pages/travels/TravelInsuranceInstantQuotes.tsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";


import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/sonner";

import { ChevronLeft, Plus, Trash2, CheckCircle, AlertCircle, Upload, FileText } from "lucide-react";


import { getTravelPremium } from "@/api/travels/GetTravelPeriod";
import { createTravelPolicy, type CreateTravelPolicyPayload } from "@/api/travels/CreateTravelPolicy";
import {
  uploadPassportFront,
  uploadPassportBack,
  uploadChildPassportFront,
  uploadChildPassportBack,
} from "@/api/policy/uploadPolicyDoc";
import { CountrySelect } from "@/components/CountrySelect";
import formSchema from "@/zod/travelPolicy";
import { getUserInfo } from "@/api/userInfo/homePageIngo";
import { UsersInfo } from "@/types/gotohome";

/* ---------------- Constants ---------------- */

const TODAY_ISO = (() => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
})();

const DEFAULT_VALUES = {
  bank_code: "1",
  department_id: "3",
  class_id: "33",
  payment_process: "Full Payment",
  currency_id: "2",
  passport_number: "",
  phone_number: "",
  country_code: "",
  have_children: false,
  child_info: [],
};

/* ---------------- Types ---------------- */

interface ApiErrorItem {
  error_code?: string;
  error_message?: string;
}

interface PremiumSnapshot {
  currency?: string;
  rate?: number;
  currency_amount?: number;
  premium_in_npr?: number;
  currency_suminsured?: number;
  suminsured_in_npr?: number;
  vat_percent?: number;
  vat_amount?: number;
  stamp_duty?: number;
  total_premium_with_vat?: number;
  taxable_amount?: number;
  policy_session_id?: string;
  [key: string]: any;
}

// Stores the selected (not yet uploaded) file and its preview
interface PassportFiles {
  frontFile: File | null;
  frontPreview: string | null; // object URL for images; null for PDFs
  backFile: File | null;
  backPreview: string | null;
}

interface ChildFileState {
  frontFile: File | null;
  frontPreview: string | null;
  backFile: File | null;
  backPreview: string | null;
}

const emptyChildFile = (): ChildFileState => ({
  frontFile: null,
  frontPreview: null,
  backFile: null,
  backPreview: null,
});

type FormValues = z.infer<typeof formSchema>;

/* ---------------- Utilities ---------------- */

const extractApiErrors = (resp: any): string[] => {
  const list: ApiErrorItem[] = Array.isArray(resp?.error_list) ? resp.error_list : [];
  const msgs = list.map((x) => x?.error_message?.trim()).filter(Boolean);
  if (msgs.length) return msgs;
  const msg = resp?.message?.trim() || resp?.msg?.trim() || "";
  return msg ? [msg] : [];
};

const tryParseJson = (text: string) => {
  try { return JSON.parse(text); } catch { return null; }
};

const normalizeUnknownError = (err: any): string[] => {
  const msg = String(err?.message ?? err ?? "").trim();
  if (msg.startsWith("{") || msg.startsWith("[")) {
    const obj = tryParseJson(msg);
    if (obj) return extractApiErrors(obj);
  }
  if (err && typeof err === "object") {
    const errs = extractApiErrors(err);
    if (errs.length) return errs;
  }
  return msg ? [msg] : ["Request failed"];
};

const SummaryRow = React.memo(({ label, value }: { label: string; value: any }) => (
  <div className="flex items-center justify-between gap-3 border-b py-2 last:border-b-0">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className="text-sm font-semibold">{String(value ?? "—")}</span>
  </div>
));
SummaryRow.displayName = "SummaryRow";

/* ---------------- PassportUploadCard ---------------- */

interface PassportUploadCardProps {
  label: string;
  file: File | null;      // locally selected file (not yet uploaded)
  previewUrl: string | null;
  disabled: boolean;
  onFileChange: (file: File) => void;
}

const PassportUploadCard = ({
  label,
  file,
  previewUrl,
  disabled,
  onFileChange,
}: PassportUploadCardProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const selected = file !== null;
  const isPdf = file?.type === "application/pdf";

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (disabled) return;
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) onFileChange(dropped);
  };

  return (
    <div className="border rounded-lg p-4 space-y-2">
      <Label className="text-sm font-medium">{label}</Label>

      <div
        className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${selected
            ? "border-green-400 bg-green-50"
            : disabled
              ? "border-border opacity-50 cursor-not-allowed"
              : "border-border hover:border-primary/50 hover:bg-muted/30"
          }`}
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); }}
        onDrop={handleDrop}
      >
        {selected ? (
          <>
            {previewUrl ? (
              <img
                src={previewUrl}
                alt={label}
                className="w-full max-h-36 object-contain rounded"
              />
            ) : isPdf ? (
              <FileText className="w-10 h-10 text-green-600" />
            ) : (
              <CheckCircle className="w-8 h-8 text-green-500" />
            )}
            <p className="text-xs font-medium text-green-700 break-all px-1">
              {file!.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {(file!.size / 1024).toFixed(1)} KB — Click or drag to replace
            </p>
          </>
        ) : (
          <>
            <Upload className="w-8 h-8 text-muted-foreground" />
            <p className="text-xs font-medium">Click or drag & drop</p>
            <p className="text-xs text-muted-foreground">Images or PDF — max 5 MB</p>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFileChange(f);
          e.target.value = "";
        }}
      />
    </div>
  );
};

/* ---------------- Main Component ---------------- */

export const TravelInsuranceInstantQuotes = () => {
  const navigate = useNavigate();

  const [successModal, setSuccessModal] = useState<null | { title: string; text: string; policyNo?: string }>(null);
  const [userData, setUserData] = useState<UsersInfo | null>(null);
  const [premiumLoading, setPremiumLoading] = useState(false);
  const [premiumError, setPremiumError] = useState<string | null>(null);
  const [premiumSnapshot, setPremiumSnapshot] = useState<PremiumSnapshot | null>(null);
  const [allFormData, setAllFormData] = useState<Record<string, any>>({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [premiumSessionId, setPremiumSessionId] = useState<string>(
    () => localStorage.getItem("travel.policySessionId") || ""
  );

  // ── Main traveller passport files (local, not yet uploaded) ──
  const [passportFiles, setPassportFiles] = useState<PassportFiles>({
    frontFile: null,
    frontPreview: null,
    backFile: null,
    backPreview: null,
  });

  // ── Children passport files (index-matched to child_info fields) ──
  const [childFiles, setChildFiles] = useState<ChildFileState[]>([]);

  const lastPremiumKeyRef = useRef<string>("");
  const isMountedRef = useRef(true);

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: DEFAULT_VALUES,
    mode: "onSubmit",
  });

  const haveChildren = watch("have_children");
  const passportNumber = watch("passport_number");
  const { fields, append, remove } = useFieldArray({ control, name: "child_info" });

  /* ---------------- Data Fetching ---------------- */

  useEffect(() => {
    isMountedRef.current = true;
    const fetchUserInfo = async () => {
      try {
        const data = await getUserInfo();
        if (!isMountedRef.current || !data) return;
        setUserData(data);
        if (data.mobile_no) setValue("phone_number", data.mobile_no, { shouldValidate: true });
      } catch (error) {
        console.error("Failed to fetch user info:", error);
      }
    };
    fetchUserInfo();
    return () => { isMountedRef.current = false; };
  }, [setValue]);

  useEffect(() => {
    try {
      const plan = (() => { try { return JSON.parse(localStorage.getItem("travel.coveragePlan") || "null"); } catch { return null; } })();
      const details = (() => { try { return JSON.parse(localStorage.getItem("travel.coverageDetails") || "null"); } catch { return null; } })();
      const premium = (() => { try { return JSON.parse(localStorage.getItem("travel.premiumSnapshot") || "null"); } catch { return null; } })();

      const travelFrom = details?.travelFrom || TODAY_ISO;
      const effectiveDate = travelFrom < TODAY_ISO ? TODAY_ISO : travelFrom;

      const combinedData = {
        bank_code: "1",
        department_id: "3",
        class_id: "33",
        payment_process: "Full Payment",
        proposed_date: effectiveDate,
        issued_date_ad: TODAY_ISO,
        issued_date_bs: "",
        effective_date: effectiveDate,
        expiry_date: details?.travelTo || "",
        date_of_birth_AD: details?.dob || "",
        age_band_id: details?.age_band_id || "",
        period_id: details?.period_id || "",
        travel_package_id: plan?.packageValue || "",
        travel_area_id: plan?.areaValue || "",
        travel_area_plan_id: plan?.planValue || "",
        currency_id: "2",
        currency_rate: premium?.rate || 0,
        currency_premium: premium?.currency_amount || 0,
        premium: premium?.premium_in_npr || 0,
        currency_suminsured: premium?.currency_suminsured || 0,
        total_suminsured: premium?.suminsured_in_npr || 0,
        suminsured: premium?.suminsured_in_npr || 0,
        premium_amount: premium?.premium_in_npr || 0,
        taxable_amount: premium?.taxable_amount || 0,
        stamp_duty: premium?.stamp_duty || 0,
        vat_percent: premium?.vat_percent || 0,
        vat_amount: premium?.vat_amount || 0,
        total_amount: premium?.total_premium_with_vat || 0,
      };

      setAllFormData(combinedData);
      Object.entries(combinedData).forEach(([key, value]) => setValue(key as any, value));
      if (premium) {
        setPremiumSnapshot(premium);
        // Mark key so the premium useEffect doesn't re-fetch
        const restoredKey = `${combinedData.class_id}|${combinedData.age_band_id}|${combinedData.travel_package_id}|${combinedData.travel_area_id}|${combinedData.travel_area_plan_id}|${combinedData.period_id}`;
        lastPremiumKeyRef.current = restoredKey;

        if (premium.policy_session_id) {
          setPremiumSessionId(premium.policy_session_id);
        }
      }
      if (details?.passport_number) setValue("passport_number", String(details.passport_number));
    } catch (e) {
      console.error("Restore failed:", e);
    }
  }, [setValue]);

  useEffect(() => {
    if (!haveChildren && fields.length > 0) {
      for (let i = fields.length - 1; i >= 0; i--) remove(i);
      setChildFiles([]);
    }
  }, [haveChildren, fields.length, remove]);

  /* ---------------- File Select Handlers (no API call) ---------------- */

  const handleFrontFileSelect = (file: File) => {
    const preview = file.type.startsWith("image/") ? URL.createObjectURL(file) : null;
    setPassportFiles((prev) => ({ ...prev, frontFile: file, frontPreview: preview }));
  };

  const handleBackFileSelect = (file: File) => {
    const preview = file.type.startsWith("image/") ? URL.createObjectURL(file) : null;
    setPassportFiles((prev) => ({ ...prev, backFile: file, backPreview: preview }));
  };

  const handleChildFrontFileSelect = (idx: number, file: File) => {
    const preview = file.type.startsWith("image/") ? URL.createObjectURL(file) : null;
    setChildFiles((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], frontFile: file, frontPreview: preview };
      return next;
    });
  };

  const handleChildBackFileSelect = (idx: number, file: File) => {
    const preview = file.type.startsWith("image/") ? URL.createObjectURL(file) : null;
    setChildFiles((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], backFile: file, backPreview: preview };
      return next;
    });
  };

  /* ---------------- Child Management ---------------- */

  const handleAddChild = () => {
    append({ children_name: "", children_dob: "", children_passport: "" });
    setChildFiles((prev) => [...prev, emptyChildFile()]);
  };

  const handleRemoveChild = (idx: number) => {
    remove(idx);
    setChildFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  /* ---------------- Premium Calculation ---------------- */

  const classId = watch("class_id");
  const ageBandId = watch("age_band_id");
  const packageId = watch("travel_package_id");
  const areaId = watch("travel_area_id");
  const areaPlanId = watch("travel_area_plan_id");
  const periodId = watch("period_id");

  useEffect(() => {
    let cancelled = false;

    const fetchPremium = async () => {
      if (!classId || !ageBandId || !packageId || !areaId || !areaPlanId || !periodId) return;

      const key = `${classId}|${ageBandId}|${packageId}|${areaId}|${areaPlanId}|${periodId}`;
      if (lastPremiumKeyRef.current === key) return;
      lastPremiumKeyRef.current = key;
      setPremiumError(null);
      setPremiumLoading(true);

      try {
        const resp = await getTravelPremium({
          class_id: String(classId),
          age_band_id: String(ageBandId),
          travel_package_id: String(packageId),
          travel_area_id: String(areaId),
          travel_area_plan_id: String(areaPlanId),
          period_id: String(periodId),
        });
        if (cancelled) return;

        const errs = extractApiErrors(resp);
        if (errs.length) { setPremiumError(errs[0]); setPremiumSnapshot(null); return; }

        setPremiumSnapshot(resp);

        if (resp?.policy_session_id) {
          setPremiumSessionId(resp.policy_session_id);
          localStorage.setItem("travel.policySessionId", resp.policy_session_id);
        }

        const updates = {
          currency_rate: resp?.rate || 0,
          currency_premium: resp?.currency_amount || 0,
          premium: resp?.premium_in_npr || 0,
          currency_suminsured: resp?.currency_suminsured || 0,
          total_suminsured: resp?.suminsured_in_npr || 0,
          suminsured: resp?.suminsured_in_npr || 0,
          premium_amount: resp?.premium_in_npr || 0,
          taxable_amount: (resp?.premium_in_npr || 0) - (resp?.direct_discount_amount || 0),
          stamp_duty: resp?.stamp_duty || 0,
          vat_percent: resp?.vat_percent || 0,
          vat_amount: resp?.vat_amount || 0,
          total_amount: resp?.total_premium_with_vat || 0,
        };
        Object.entries(updates).forEach(([k, v]) => setValue(k as any, v, { shouldValidate: true }));
        localStorage.setItem("travel.premiumSnapshot", JSON.stringify(resp));
      } catch (e: any) {
        if (!cancelled) { setPremiumError(e?.message ?? "Failed to load premium"); setPremiumSnapshot(null); }
      } finally {
        if (!cancelled) setPremiumLoading(false);
      }
    };

    fetchPremium();
    return () => { cancelled = true; };
  }, [classId, ageBandId, packageId, areaId, areaPlanId, periodId, setValue]);

  /* ---------------- Form Submission ---------------- */

  const onSubmit = async (v: FormValues) => {
    if (!premiumSnapshot) { toast.error("Premium not loaded. Please try again."); return; }

    const rawEffective = (allFormData.effective_date || TODAY_ISO).slice(0, 10);
    const effectiveDate = rawEffective < TODAY_ISO ? TODAY_ISO : rawEffective;
    if (effectiveDate < TODAY_ISO) { toast.error("Effective Date must be today or a future date"); return; }

    // ── Validate files are selected ──
    if (!passportFiles.frontFile) {
      toast.error("Please select Passport Front image before submitting.");
      return;
    }
    if (!passportFiles.backFile) {
      toast.error("Please select Passport Back image before submitting.");
      return;
    }
    if (v.have_children && v.child_info.length > 0) {
      for (let i = 0; i < v.child_info.length; i++) {
        if (!childFiles[i]?.frontFile) {
          toast.error(`Please select Passport Front for Child #${i + 1}.`);
          return;
        }
        if (!childFiles[i]?.backFile) {
          toast.error(`Please select Passport Back for Child #${i + 1}.`);
          return;
        }
      }
    }

    setSubmitLoading(true);
    try {
      // ── Upload passport files now ──
      const frontRes = await uploadPassportFront(v.passport_number, passportFiles.frontFile);
      if (!frontRes.process_result || frontRes.uploaded_id == null) {
        toast.error(frontRes.error_list?.[0]?.error_message || "Passport Front upload failed");
        return;
      }

      const backRes = await uploadPassportBack(v.passport_number, passportFiles.backFile!);
      if (!backRes.process_result || backRes.uploaded_id == null) {
        toast.error(backRes.error_list?.[0]?.error_message || "Passport Back upload failed");
        return;
      }

      // ── Upload child passport files ──
      const uploadedChildren: { frontId: string; backId: string }[] = [];
      if (v.have_children && v.child_info.length > 0) {
        for (let i = 0; i < v.child_info.length; i++) {
          const childPassport = v.child_info[i].children_passport;

          const cfRes = await uploadChildPassportFront(childPassport, childFiles[i].frontFile!);
          if (!cfRes.process_result || cfRes.uploaded_id == null) {
            toast.error(cfRes.error_list?.[0]?.error_message || `Child #${i + 1} Passport Front upload failed`);
            return;
          }

          const cbRes = await uploadChildPassportBack(childPassport, childFiles[i].backFile!);
          if (!cbRes.process_result || cbRes.uploaded_id == null) {
            toast.error(cbRes.error_list?.[0]?.error_message || `Child #${i + 1} Passport Back upload failed`);
            return;
          }

          uploadedChildren.push({ frontId: String(cfRes.uploaded_id), backId: String(cbRes.uploaded_id) });
        }
      }

      // ── Build and submit policy ──
      const fullPayload: CreateTravelPolicyPayload = {
        client_info: { Bank_Code: String(allFormData.bank_code || "1") },

        policy_info: {
          department_id: String(allFormData.department_id || "3"),
          class_id: String(allFormData.class_id || "33"),
          payment_process: String(allFormData.payment_process || "Full Payment"),
          effective_date: effectiveDate,
          expiry_date: (allFormData.expiry_date || "").slice(0, 10),
        },

        class_info: {
          class_id: String(allFormData.class_id || "33"),
          passport_number: String(v.passport_number),
          date_of_birth_AD: String(allFormData.date_of_birth_AD || ""),
          phone_number: String(v.phone_number),
          age_band_id: String(allFormData.age_band_id || ""),
          travel_package_id: String(allFormData.travel_package_id || ""),
          travel_area_id: String(allFormData.travel_area_id || ""),
          travel_area_plan_id: String(allFormData.travel_area_plan_id || ""),
          period_id: String(allFormData.period_id || ""),
          currency_id: String(allFormData.currency_id || "2"),
          currency_rate: Number(allFormData.currency_rate || 0),
          currency_premium: Number(allFormData.currency_premium || 0),
          premium: Number(allFormData.premium || 0),
          currency_suminsured: Number(allFormData.currency_suminsured || 0),
          total_suminsured: Number(allFormData.total_suminsured || 0),
          have_children: Boolean(v.have_children),
          country_code: String(v.country_code),
          passport_front_id: String(frontRes.uploaded_id),
          passport_back_id: String(backRes.uploaded_id),
        },

        amount_info: {
          suminsured: Number(allFormData.suminsured || 0),
          premium_amount: Number(allFormData.premium_amount || 0),
          pa_amount: 0,
          tpl_amount: 0,
          pool_amount: 0,
          taxable_amount: Number(allFormData.taxable_amount || 0),
          stamp_duty: Number(allFormData.stamp_duty || 0),
          vat_percent: Number(allFormData.vat_percent || 0),
          vat_amount: Number(allFormData.vat_amount || 0),
          total_amount: Number(allFormData.total_amount || 0),
        },

        policy_session_id: premiumSessionId,

        child_info:
          v.have_children && v.child_info.length > 0
            ? v.child_info.map((c, idx) => ({
              children_name: c.children_name,
              children_dob: c.children_dob,
              children_passport: c.children_passport,
              children_passport_front_id: uploadedChildren[idx]?.frontId ?? null,
              children_passport_back_id: uploadedChildren[idx]?.backId ?? null,
            }))
            : [],
      };

      const resp = await createTravelPolicy(fullPayload);

      if (resp?.process_result === false) {
        toast.error(extractApiErrors(resp).join(", ") || "Failed to create policy");
        return;
      }

      const policyNo = resp?.policy_no || resp?.policy_number || resp?.data?.policy_no;
      setSuccessModal({ title: "Success!", text: "Travel policy created successfully.", policyNo });

      ["travel.coveragePlan", "travel.coverageDetails", "travel.premiumSnapshot", "travel.policySessionId"].forEach(
        (key) => localStorage.removeItem(key)
      );
    } catch (err: any) {
      console.error("Submission error:", err);
      if (err.data) {
        toast.error(extractApiErrors(err.data).join(", ") || err.message || "Failed to create policy");
      } else {
        toast.error(normalizeUnknownError(err).join(", ") || "Failed to create policy");
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleBack = useCallback(() => navigate("/travel-insurance-details"), [navigate]);

  // After success → go to //my-draft-policy
  const handleSuccessClose = useCallback(() => {
    setSuccessModal(null);
    navigate("/my-draft-policy", { replace: true });
  }, [navigate]);

  const submitDisabled = submitLoading || isSubmitting || !premiumSnapshot;

  /* ---------------- Render ---------------- */

  return (
    <>
            {/* Success Dialog */}
            <Dialog open={!!successModal} onOpenChange={() => { }}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-6 w-6" />
                    {successModal?.title}
                  </DialogTitle>
                </DialogHeader>
                <div className="py-4 text-center">
                  <p className="text-lg">{successModal?.text}</p>
                  {successModal?.policyNo && (
                    <p className="mt-2 font-bold">Policy Number: {successModal.policyNo}</p>
                  )}
                </div>
                <DialogFooter>
                  <Button onClick={handleSuccessClose} className="w-full">View My Policies</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>



            {/* Hidden fields */}
            {Object.keys(DEFAULT_VALUES).map((key) => (
              <input key={key} type="hidden" {...register(key as any)} />
            ))}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

              {/* ── Additional Information ── */}
              <Card>
                <CardHeader><CardTitle>Additional Information</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Passport Number *</Label>
                      <Input className="mt-2" {...register("passport_number")} placeholder="Enter passport number" />
                      {errors.passport_number && (
                        <p className="mt-1 text-xs text-red-600">{errors.passport_number.message}</p>
                      )}
                    </div>

                    <div>
                      <Label>Phone Number *</Label>
                      <Input
                        className="mt-2"
                        {...register("phone_number")}
                        placeholder={userData?.mobile_no || "Enter phone number"}
                        defaultValue={userData?.mobile_no}
                      />
                      {errors.phone_number && (
                        <p className="mt-1 text-xs text-red-600">{errors.phone_number.message}</p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <CountrySelect
                        register={register("country_code")}
                        error={errors.country_code}
                        required={true}
                        label="Country Code"
                      />
                    </div>
                  </div>

                  {/* Passport Upload — files stored locally; uploaded on Submit */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-base font-semibold">Passport Upload *</Label>
                      {!passportNumber.trim() && (
                        <span className="text-xs text-amber-600 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Enter passport number first
                        </span>
                      )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <PassportUploadCard
                        label="Passport Front"
                        file={passportFiles.frontFile}
                        previewUrl={passportFiles.frontPreview}
                        disabled={!passportNumber.trim()}
                        onFileChange={handleFrontFileSelect}
                      />
                      <PassportUploadCard
                        label="Passport Back"
                        file={passportFiles.backFile}
                        previewUrl={passportFiles.backPreview}
                        disabled={!passportNumber.trim()}
                        onFileChange={handleBackFileSelect}
                      />
                    </div>
                  </div>

                  {/* Have Children toggle */}
                  <div className="flex items-center gap-3 pt-2">
                    <Controller
                      control={control}
                      name="have_children"
                      render={({ field }) => (
                        <Switch id="have_children" checked={field.value} onCheckedChange={field.onChange} />
                      )}
                    />
                    <Label htmlFor="have_children">Have Children?</Label>
                  </div>
                </CardContent>
              </Card>

              {/* ── Child Information ── */}
              {haveChildren && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Child Information</CardTitle>
                      <Button type="button" variant="outline" className="gap-2" onClick={handleAddChild}>
                        <Plus className="w-4 h-4" /> Add Child
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {fields.map((field, idx) => {
                      const cf = childFiles[idx];
                      const childPassportVal = watch(`child_info.${idx}.children_passport`);
                      const childPassportReady = !!childPassportVal?.trim();

                      return (
                        <div key={field.id} className="rounded-md border p-4 space-y-4">
                          {/* Child header */}
                          <div className="flex justify-between items-center">
                            <p className="font-semibold">Child #{idx + 1}</p>
                            <Button type="button" variant="ghost" onClick={() => handleRemoveChild(idx)}>
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>

                          {/* Child fields */}
                          <div className="grid md:grid-cols-3 gap-4">
                            <div>
                              <Label>Child Name *</Label>
                              <Input
                                className="mt-2"
                                {...register(`child_info.${idx}.children_name`)}
                                placeholder="Enter child name"
                              />
                              {errors.child_info?.[idx]?.children_name && (
                                <p className="mt-1 text-xs text-red-600">
                                  {errors.child_info[idx]?.children_name?.message}
                                </p>
                              )}
                            </div>

                            <div>
                              <Label>Child DOB *</Label>
                              <Input
                                type="date"
                                className="mt-2"
                                {...register(`child_info.${idx}.children_dob`)}
                              />
                              {errors.child_info?.[idx]?.children_dob && (
                                <p className="mt-1 text-xs text-red-600">
                                  {errors.child_info[idx]?.children_dob?.message}
                                </p>
                              )}
                            </div>

                            <div>
                              <Label>Child Passport *</Label>
                              <Input
                                className="mt-2"
                                {...register(`child_info.${idx}.children_passport`)}
                                placeholder="Enter passport number"
                              />
                              {errors.child_info?.[idx]?.children_passport && (
                                <p className="mt-1 text-xs text-red-600">
                                  {errors.child_info[idx]?.children_passport?.message}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Child Passport Upload */}
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <Label className="text-sm font-semibold">Passport Upload *</Label>
                              {!childPassportReady && (
                                <span className="text-xs text-amber-600 flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" /> Enter passport number first
                                </span>
                              )}
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                              <PassportUploadCard
                                label="Passport Front"
                                file={cf?.frontFile ?? null}
                                previewUrl={cf?.frontPreview ?? null}
                                disabled={!childPassportReady}
                                onFileChange={(file) => handleChildFrontFileSelect(idx, file)}
                              />
                              <PassportUploadCard
                                label="Passport Back"
                                file={cf?.backFile ?? null}
                                previewUrl={cf?.backPreview ?? null}
                                disabled={!childPassportReady}
                                onFileChange={(file) => handleChildBackFileSelect(idx, file)}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {fields.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No children added. Click "Add Child" to add one.
                      </p>
                    )}

                    {errors.child_info && (
                      <p className="text-xs text-red-600">{errors.child_info.message as string}</p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* ── Actions ── */}
              <div className="flex gap-4">
                <Button type="button" variant="outline" onClick={handleBack} className="gap-2">
                  <ChevronLeft className="w-4 h-4" /> BACK
                </Button>
                <Button
                  type="submit"
                  disabled={submitDisabled || !!successModal}
                  className="flex-1"
                >
                  {submitLoading ? "Submitting..." : "Submit Policy"}
                </Button>
              </div>

            </form>
    </>
  );
};
