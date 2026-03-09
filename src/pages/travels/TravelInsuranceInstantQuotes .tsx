// src/pages/travels/TravelInsuranceInstantQuotes.tsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";

import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { useLanguage } from "@/contexts/LanguageContext";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { ChevronLeft, Plus, Trash2, CheckCircle, AlertCircle, Upload } from "lucide-react";

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
  class_id: "81",
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
  [key: string]: any;
}

// Tracks uploaded_id (number) returned from upload API for main traveller
interface PassportDocIds {
  passportFrontId: number | null;
  passportFrontPreview: string | null;  // object URL for image preview
  passportBackId: number | null;
  passportBackPreview: string | null;
}

// Tracks uploaded_id (number) returned from upload API for each child
interface ChildDocState {
  frontId: number | null;
  frontPreview: string | null;
  backId: number | null;
  backPreview: string | null;
  uploadingFront: boolean;
  uploadingBack: boolean;
  errorFront: string | null;
  errorBack: string | null;
}

const emptyChildDoc = (): ChildDocState => ({
  frontId: null,
  frontPreview: null,
  backId: null,
  backPreview: null,
  uploadingFront: false,
  uploadingBack: false,
  errorFront: null,
  errorBack: null,
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

/* ---------------- PassportUploadCard (shared) ---------------- */

interface PassportUploadCardProps {
  label: string;
  uploaded: boolean;
  uploading: boolean;
  error: string | null;
  imageId: number | null;
  previewUrl: string | null;
  disabled: boolean;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const PassportUploadCard = ({
  label,
  uploaded,
  uploading,
  error,
  imageId,
  previewUrl,
  disabled,
  onFileChange,
}: PassportUploadCardProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="border rounded-lg p-4 space-y-2">
      <Label className="text-sm font-medium">{label}</Label>

      <div
        className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg p-2 text-center cursor-pointer transition-colors ${
          uploaded
            ? "border-green-400 bg-green-50"
            : disabled
            ? "border-border opacity-50 cursor-not-allowed"
            : "border-border hover:border-primary/50 hover:bg-muted/30"
        }`}
        onClick={() => !disabled && !uploading && inputRef.current?.click()}
      >
        {uploaded ? (
          <>
            {previewUrl ? (
              <img
                src={previewUrl}
                alt={label}
                className="w-full max-h-36 object-contain rounded"
              />
            ) : (
              <CheckCircle className="w-8 h-8 text-green-500" />
            )}
            <p className="text-xs font-medium text-green-700">
              Uploaded {imageId != null ? `(ID: ${imageId})` : ""}
            </p>
          </>
        ) : uploading ? (
          <>
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-muted-foreground">Uploading...</p>
          </>
        ) : (
          <>
            <Upload className="w-8 h-8 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Click to browse</p>
            <p className="text-xs text-muted-foreground">Images or PDF, max 5MB</p>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        onChange={onFileChange}
        disabled={disabled || uploading}
      />

      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {error}
        </p>
      )}
    </div>
  );
};

/* ---------------- Main Component ---------------- */

export const TravelInsuranceInstantQuotes = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [successModal, setSuccessModal] = useState<null | { title: string; text: string; policyNo?: string }>(null);
  const [submitBanner, setSubmitBanner] = useState<string>("");
  const [userData, setUserData] = useState<UsersInfo | null>(null);
  const [premiumLoading, setPremiumLoading] = useState(false);
  const [premiumError, setPremiumError] = useState<string | null>(null);
  const [premiumSnapshot, setPremiumSnapshot] = useState<PremiumSnapshot | null>(null);
  const [allFormData, setAllFormData] = useState<Record<string, any>>({});
  const [submitLoading, setSubmitLoading] = useState(false);

  // ── Main traveller passport upload state ──
  const [passportDocs, setPassportDocs] = useState<PassportDocIds>({
    passportFrontId: null,
    passportFrontPreview: null,
    passportBackId: null,
    passportBackPreview: null,
  });
  const [uploadingFront, setUploadingFront] = useState(false);
  const [uploadingBack, setUploadingBack] = useState(false);
  const [uploadErrorFront, setUploadErrorFront] = useState<string | null>(null);
  const [uploadErrorBack, setUploadErrorBack] = useState<string | null>(null);

  // ── Children passport upload state (index-matched to child_info fields) ──
  const [childDocs, setChildDocs] = useState<ChildDocState[]>([]);

  const lastPremiumKeyRef = useRef<string>("");
  const isMountedRef = useRef(true);

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
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
        class_id: "81",
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
      if (premium) setPremiumSnapshot(premium);
      if (details?.passport_number) setValue("passport_number", String(details.passport_number));
    } catch (e) {
      console.error("Restore failed:", e);
    }
  }, [setValue]);

  useEffect(() => {
    if (!haveChildren && fields.length > 0) {
      for (let i = fields.length - 1; i >= 0; i--) remove(i);
      setChildDocs([]);
    }
  }, [haveChildren, fields.length, remove]);

  /* ---------------- Main Traveller Upload Handlers ---------------- */

  const handleFrontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!passportNumber.trim()) { setUploadErrorFront("Enter passport number first"); return; }

    const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : null;

    setUploadingFront(true);
    setUploadErrorFront(null);
    try {
      const res = await uploadPassportFront(passportNumber, file);
      if (res.process_result && res.uploaded_id != null) {
        setPassportDocs((prev) => ({
          ...prev,
          passportFrontId: res.uploaded_id!,
          passportFrontPreview: previewUrl,
        }));
      } else {
        setUploadErrorFront(res.error_list?.[0]?.error_message || "Upload failed");
      }
    } catch (err: any) {
      setUploadErrorFront(err.message || "Upload failed");
    } finally {
      setUploadingFront(false);
      e.target.value = "";
    }
  };

  const handleBackUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!passportNumber.trim()) { setUploadErrorBack("Enter passport number first"); return; }

    const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : null;

    setUploadingBack(true);
    setUploadErrorBack(null);
    try {
      const res = await uploadPassportBack(passportNumber, file);
      if (res.process_result && res.uploaded_id != null) {
        setPassportDocs((prev) => ({
          ...prev,
          passportBackId: res.uploaded_id!,
          passportBackPreview: previewUrl,
        }));
      } else {
        setUploadErrorBack(res.error_list?.[0]?.error_message || "Upload failed");
      }
    } catch (err: any) {
      setUploadErrorBack(err.message || "Upload failed");
    } finally {
      setUploadingBack(false);
      e.target.value = "";
    }
  };

  /* ---------------- Child Upload Helpers ---------------- */

  const updateChildDoc = (idx: number, patch: Partial<ChildDocState>) => {
    setChildDocs((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch };
      return next;
    });
  };

  // Upload child passport front → stores image_id as children_passport_front_id
  const handleChildFrontUpload = async (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const childPassport = getValues(`child_info.${idx}.children_passport`);
    if (!childPassport?.trim()) {
      updateChildDoc(idx, { errorFront: "Enter child passport number first" });
      return;
    }

    const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : null;

    updateChildDoc(idx, { uploadingFront: true, errorFront: null });
    try {
      const res = await uploadChildPassportFront(childPassport, file);
      if (res.process_result && res.uploaded_id != null) {
        updateChildDoc(idx, { frontId: res.uploaded_id!, frontPreview: previewUrl });
      } else {
        updateChildDoc(idx, { errorFront: res.error_list?.[0]?.error_message || "Upload failed" });
      }
    } catch (err: any) {
      updateChildDoc(idx, { errorFront: err.message || "Upload failed" });
    } finally {
      updateChildDoc(idx, { uploadingFront: false });
      e.target.value = "";
    }
  };

  // Upload child passport back → stores image_id as children_passport_back_id
  const handleChildBackUpload = async (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const childPassport = getValues(`child_info.${idx}.children_passport`);
    if (!childPassport?.trim()) {
      updateChildDoc(idx, { errorBack: "Enter child passport number first" });
      return;
    }

    const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : null;

    updateChildDoc(idx, { uploadingBack: true, errorBack: null });
    try {
      const res = await uploadChildPassportBack(childPassport, file);
      if (res.process_result && res.uploaded_id != null) {
        updateChildDoc(idx, { backId: res.uploaded_id!, backPreview: previewUrl });
      } else {
        updateChildDoc(idx, { errorBack: res.error_list?.[0]?.error_message || "Upload failed" });
      }
    } catch (err: any) {
      updateChildDoc(idx, { errorBack: err.message || "Upload failed" });
    } finally {
      updateChildDoc(idx, { uploadingBack: false });
      e.target.value = "";
    }
  };

  const handleAddChild = () => {
    append({ children_name: "", children_dob: "", children_passport: "" });
    setChildDocs((prev) => [...prev, emptyChildDoc()]);
  };

  const handleRemoveChild = (idx: number) => {
    remove(idx);
    setChildDocs((prev) => prev.filter((_, i) => i !== idx));
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
    setSubmitBanner("");

    if (!premiumSnapshot) { setSubmitBanner("Premium not loaded. Please try again."); return; }

    // Always take only YYYY-MM-DD (strip any time component), then floor to today
    const rawEffective = (allFormData.effective_date || TODAY_ISO).slice(0, 10);
    const effectiveDate = rawEffective < TODAY_ISO ? TODAY_ISO : rawEffective;
    if (effectiveDate < TODAY_ISO) { setSubmitBanner("Effective Date must be today or a future date"); return; }

    // ── Passport upload validation (compulsory) ──
    if (!passportDocs.passportFrontId) {
      setSubmitBanner("Please upload Passport Front image before submitting.");
      return;
    }
    if (!passportDocs.passportBackId) {
      setSubmitBanner("Please upload Passport Back image before submitting.");
      return;
    }

    // ── Child passport upload validation (compulsory for each child added) ──
    if (v.have_children && v.child_info.length > 0) {
      for (let i = 0; i < v.child_info.length; i++) {
        if (!childDocs[i]?.frontId) {
          setSubmitBanner(`Please upload Passport Front for Child #${i + 1}.`);
          return;
        }
        if (!childDocs[i]?.backId) {
          setSubmitBanner(`Please upload Passport Back for Child #${i + 1}.`);
          return;
        }
      }
    }

    setSubmitLoading(true);
    try {
      const fullPayload: CreateTravelPolicyPayload = {
        client_info: { Bank_Code: String(allFormData.bank_code || "1") },

        policy_info: {
          department_id: String(allFormData.department_id || "3"),
          class_id: String(allFormData.class_id || "81"),
          payment_process: String(allFormData.payment_process || "Full Payment"),
          effective_date: effectiveDate,
          expiry_date: (allFormData.expiry_date || "").slice(0, 10),
        },

        class_info: {
          class_id: String(allFormData.class_id || "81"),
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
          // Validated above — both are guaranteed to be non-null here
          passport_front_id: passportDocs.passportFrontId != null ? String(passportDocs.passportFrontId) : null,
          passport_back_id:  passportDocs.passportBackId  != null ? String(passportDocs.passportBackId)  : null,
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

        policy_session_id: "", // overridden inside createTravelPolicy with a fresh session

        child_info:
          v.have_children && v.child_info.length > 0
            ? v.child_info.map((c, idx) => ({
                children_name: c.children_name,
                children_dob: c.children_dob,
                children_passport: c.children_passport,
                // Validated above — both are guaranteed to be non-null here
                children_passport_front_id: childDocs[idx]?.frontId != null ? String(childDocs[idx].frontId) : null,
                children_passport_back_id:  childDocs[idx]?.backId  != null ? String(childDocs[idx].backId)  : null,
              }))
            : [],
      };

      const resp = await createTravelPolicy(fullPayload);

      if (resp?.process_result === false) {
        setSubmitBanner(extractApiErrors(resp).join(", ") || "Failed to create policy");
        return;
      }

      const policyNo = resp?.policy_no || resp?.policy_number || resp?.data?.policy_no;
      setSuccessModal({ title: "Success!", text: "Travel policy created successfully.", policyNo });

      ["travel.coveragePlan", "travel.coverageDetails", "travel.premiumSnapshot"].forEach(
        (key) => localStorage.removeItem(key)
      );
    } catch (err: any) {
      console.error("Submission error:", err);
      if (err.data) {
        setSubmitBanner(extractApiErrors(err.data).join(", ") || err.message || "Failed to create policy");
      } else {
        setSubmitBanner(normalizeUnknownError(err).join(", ") || "Failed to create policy");
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleBack = useCallback(() => navigate("/travel-insurance-details"), [navigate]);
  const handleSuccessClose = useCallback(() => {
    setSuccessModal(null);
    navigate("/dashboard", { replace: true });
  }, [navigate]);

  // Passport uploads validated inside onSubmit (not here) so error banners show clearly
  const submitDisabled = submitLoading || isSubmitting || !premiumSnapshot;

  /* ---------------- Render ---------------- */

  return (
    <div className="flex min-h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-8 bg-background">
          <div className="max-w-4xl mx-auto">
            <Button variant="ghost" onClick={handleBack} className="mb-6 gap-2">
              <ChevronLeft className="w-4 h-4" /> Back
            </Button>

            <h1 className="text-2xl font-bold mb-6">Instant Quotes</h1>

            {/* Success Dialog */}
            <Dialog open={!!successModal} onOpenChange={() => {}}>
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
                  <Button onClick={handleSuccessClose} className="w-full">Go to Dashboard</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Error banner */}
            {submitBanner && !successModal && (
              <Alert className="mb-6 bg-red-50 border-red-200">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-600">{submitBanner}</AlertDescription>
              </Alert>
            )}

            {/* Premium Summary */}
            <Card className="mb-6">
              <CardHeader><CardTitle>Premium Summary</CardTitle></CardHeader>
              <CardContent className="space-y-1">
                {premiumLoading && <p className="text-sm text-muted-foreground">Loading premium...</p>}
                {premiumError && <p className="text-sm text-red-600">{premiumError}</p>}
                {!premiumLoading && !premiumError && premiumSnapshot && (
                  <>
                    <SummaryRow label="Currency" value={premiumSnapshot.currency ?? "NPR"} />
                    <SummaryRow label="Rate" value={premiumSnapshot.rate ?? 0} />
                    <SummaryRow label="Premium in NPR" value={premiumSnapshot.premium_in_npr ?? 0} />
                    <SummaryRow label="Suminsured in NPR" value={premiumSnapshot.suminsured_in_npr ?? 0} />
                    <SummaryRow label="VAT %" value={premiumSnapshot.vat_percent ?? 0} />
                    <SummaryRow label="VAT Amount" value={premiumSnapshot.vat_amount ?? 0} />
                    <SummaryRow label="Stamp Duty" value={premiumSnapshot.stamp_duty ?? 0} />
                    <SummaryRow label="Total Premium" value={premiumSnapshot.total_premium_with_vat ?? 0} />
                  </>
                )}
              </CardContent>
            </Card>

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

                  {/* Passport Upload */}
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
                        uploaded={passportDocs.passportFrontId != null}
                        uploading={uploadingFront}
                        error={uploadErrorFront}
                        imageId={passportDocs.passportFrontId}
                        previewUrl={passportDocs.passportFrontPreview}
                        disabled={!passportNumber.trim()}
                        onFileChange={handleFrontUpload}
                      />
                      <PassportUploadCard
                        label="Passport Back"
                        uploaded={passportDocs.passportBackId != null}
                        uploading={uploadingBack}
                        error={uploadErrorBack}
                        imageId={passportDocs.passportBackId}
                        previewUrl={passportDocs.passportBackPreview}
                        disabled={!passportNumber.trim()}
                        onFileChange={handleBackUpload}
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
                      const doc = childDocs[idx];
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
                                uploaded={doc?.frontId != null}
                                uploading={doc?.uploadingFront ?? false}
                                error={doc?.errorFront ?? null}
                                imageId={doc?.frontId ?? null}
                                previewUrl={doc?.frontPreview ?? null}
                                disabled={!childPassportReady}
                                onFileChange={(e) => handleChildFrontUpload(idx, e)}
                              />
                              <PassportUploadCard
                                label="Passport Back"
                                uploaded={doc?.backId != null}
                                uploading={doc?.uploadingBack ?? false}
                                error={doc?.errorBack ?? null}
                                imageId={doc?.backId ?? null}
                                previewUrl={doc?.backPreview ?? null}
                                disabled={!childPassportReady}
                                onFileChange={(e) => handleChildBackUpload(idx, e)}
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
                <Button type="submit" disabled={submitDisabled || !!successModal} className="flex-1">
                  {submitLoading ? "Submitting..." : "Submit Policy"}
                </Button>
              </div>

            </form>
          </div>
        </main>
      </div>
    </div>
  );
};
