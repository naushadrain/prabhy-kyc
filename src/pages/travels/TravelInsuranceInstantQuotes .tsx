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

import { ChevronLeft, Plus, Trash2, CheckCircle, AlertCircle } from "lucide-react";

import { getTravelPremium } from "@/api/travels/GetTravelPeriod";
import { createTravelPolicy, type CreateTravelPolicyPayload } from "@/api/travels/CreateTravelPolicy";
import { uploadPolicyDocument } from "@/api/policy/uploadPolicyDoc";
import { CountrySelect } from "@/components/CountrySelect";
import formSchema from "@/zod/travelPolicy";
import { getUserInfo } from "@/api/userInfo/homePageIngo";
import { UsersInfo } from "@/types/gotohome";

/* ---------------- Constants & Helpers ---------------- */

const TODAY_ISO = (() => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split('T')[0];
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

interface DocumentIds {
  passportFrontId?: string;
  passportBackId?: string;
  childDocuments?: Record<string, { frontId?: string; backId?: string }>;
}

type FormValues = z.infer<typeof formSchema>;

/* ---------------- Utility Functions ---------------- */

const extractApiErrors = (resp: any): string[] => {
  const list: ApiErrorItem[] = Array.isArray(resp?.error_list) ? resp.error_list : [];
  const msgs = list
    .map((x) => x?.error_message?.trim())
    .filter(Boolean);
  
  if (msgs.length) return msgs;
  
  const msg = resp?.message?.trim() || resp?.msg?.trim() || "";
  return msg ? [msg] : [];
};

const tryParseJson = (text: string) => {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
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

SummaryRow.displayName = 'SummaryRow';

/* ---------------- Main Component ---------------- */

export const TravelInsuranceInstantQuotes = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // UI States
  const [successModal, setSuccessModal] = useState<null | { title: string; text: string; policyNo?: string }>(null);
  const [submitBanner, setSubmitBanner] = useState<string>("");
  
  // Data States
  const [userData, setUserData] = useState<UsersInfo | null>(null);
  const [premiumLoading, setPremiumLoading] = useState(false);
  const [premiumError, setPremiumError] = useState<string | null>(null);
  const [premiumSnapshot, setPremiumSnapshot] = useState<PremiumSnapshot | null>(null);
  const [allFormData, setAllFormData] = useState<Record<string, any>>({});
  const [submitLoading, setSubmitLoading] = useState(false);

  // Document upload states
  const [documentIds, setDocumentIds] = useState<DocumentIds>({});
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const lastPremiumKeyRef = useRef<string>("");
  const isMountedRef = useRef(true);

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    reset,
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

  // Fetch user info on mount
  useEffect(() => {
    isMountedRef.current = true;
    
    const fetchUserInfo = async () => {
      try {
        const data = await getUserInfo();
        if (!isMountedRef.current || !data) return;

        console.log("User Info Data:", data);
        setUserData(data);

        if (data.mobile_no) {
          setValue("phone_number", data.mobile_no, { shouldValidate: true });
        }
      } catch (error) {
        console.error("Failed to fetch user info:", error);
      }
    };

    fetchUserInfo();

    return () => {
      isMountedRef.current = false;
    };
  }, [setValue]);

  // Load data from localStorage
  useEffect(() => {
    try {
      const planRaw = localStorage.getItem("travel.coveragePlan");
      const detailsRaw = localStorage.getItem("travel.coverageDetails");
      const premiumSnapshotRaw = localStorage.getItem("travel.premiumSnapshot");

      const plan = planRaw ? JSON.parse(planRaw) : null;
      const details = detailsRaw ? JSON.parse(detailsRaw) : null;
      const premium = premiumSnapshotRaw ? JSON.parse(premiumSnapshotRaw) : null;

      // Validate dates - ensure effective date is not before today
      const travelFrom = details?.travelFrom || TODAY_ISO;
      const effectiveDate = travelFrom < TODAY_ISO ? TODAY_ISO : travelFrom;

      const combinedData = {
        // Policy info
        bank_code: "1",
        department_id: "3",
        class_id: "81",
        payment_process: "Full Payment",
        
        // Dates from details - with validation
        proposed_date: effectiveDate,
        issued_date_ad: TODAY_ISO, // Must be today
        issued_date_bs: "",
        effective_date: effectiveDate, // Must be today or future
        expiry_date: details?.travelTo || "",
        
        // Class info from details
        date_of_birth_AD: details?.dob || "",
        age_band_id: details?.age_band_id || "",
        period_id: details?.period_id || "",
        
        // Plan info
        travel_package_id: plan?.packageValue || "",
        travel_area_id: plan?.areaValue || "",
        travel_area_plan_id: plan?.planValue || "",
        
        // Currency
        currency_id: "2",
        
        // Premium data
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

      // Set all hidden fields
      Object.entries(combinedData).forEach(([key, value]) => {
        setValue(key as any, value);
      });

      if (premium) {
        setPremiumSnapshot(premium);
      }

      if (details?.passport_number) {
        setValue("passport_number", String(details.passport_number));
      }

    } catch (e) {
      console.error("Restore failed:", e);
    }
  }, [setValue]);

  // Clear children when toggled off
  useEffect(() => {
    if (!haveChildren && fields.length > 0) {
      for (let i = fields.length - 1; i >= 0; i--) remove(i);
    }
  }, [haveChildren, fields.length, remove]);

  /* ---------------- Document Upload Handler ---------------- */

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!passportNumber) {
      setUploadError("Please enter passport number first");
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const response = await uploadPolicyDocument(
        "81",
        "Passport",
        "PB",
        file,
        passportNumber,
      );

      if (response.process_result && response.image_id) {
        setDocumentIds(prev => ({
          ...prev,
          passportBackId: response.image_id
        }));
        
        e.target.value = '';
        setSubmitBanner("Document uploaded successfully");
        setTimeout(() => setSubmitBanner(""), 3000);
      } else {
        const errorMsg = response.error_list?.[0]?.error_message || 'Upload failed';
        setUploadError(errorMsg);
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      setUploadError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
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
        if (errs.length) {
          setPremiumError(errs[0]);
          setPremiumSnapshot(null);
          return;
        }

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

        Object.entries(updates).forEach(([key, value]) => {
          setValue(key as any, value, { shouldValidate: true });
        });

        localStorage.setItem("travel.premiumSnapshot", JSON.stringify(resp));
      } catch (e: any) {
        if (!cancelled) {
          setPremiumError(e?.message ?? "Failed to load premium");
          setPremiumSnapshot(null);
        }
      } finally {
        if (!cancelled) setPremiumLoading(false);
      }
    };

    fetchPremium();

    return () => {
      cancelled = true;
    };
  }, [classId, ageBandId, packageId, areaId, areaPlanId, periodId, setValue]);

  /* ---------------- Form Submission ---------------- */

  const validateDocuments = (): string | null => {
    if (!documentIds.passportBackId) {
      return "Please upload passport document";
    }
    return null;
  };

  const onSubmit = async (v: FormValues) => {
    setSubmitBanner("");

    // Validate document upload
    const docError = validateDocuments();
    if (docError) {
      setSubmitBanner(docError);
      return;
    }

    if (!premiumSnapshot) {
      setSubmitBanner("Premium not loaded. Please try again.");
      return;
    }

    // Validate dates
    const effectiveDate = allFormData.effective_date || TODAY_ISO;
    if (effectiveDate < TODAY_ISO) {
      setSubmitBanner("Effective Date must be today or a future date");
      return;
    }

    setSubmitLoading(true);

    try {
      const policySessionId = `SESS_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      const fullPayload: CreateTravelPolicyPayload = {
        client_info: { Bank_Code: String(allFormData.bank_code || "1") },
        
        policy_info: {
          department_id: String(allFormData.department_id || "3"),
          class_id: String(allFormData.class_id || "81"),
          payment_process: String(allFormData.payment_process || "Full Payment"),
          proposed_date: String(effectiveDate),
          issued_date_ad: String(TODAY_ISO),
          issued_date_bs: String(allFormData.issued_date_bs || ""),
          effective_date: String(effectiveDate),
          expiry_date: String(allFormData.expiry_date || ""),
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

        
        child_info: v.have_children && v.child_info.length > 0
          ? v.child_info.map((c) => ({
              children_name: c.children_name,
              children_dob: c.children_dob,
              children_passport: c.children_passport,
            }))
          : [],
      };

      const resp = await createTravelPolicy(fullPayload);
      
      // Check for API errors
      if (resp?.process_result === false) {
        const errorMessages = extractApiErrors(resp);
        setSubmitBanner(errorMessages.join(", ") || "Failed to create policy");
        return;
      }

      // Success
      const policyNo = resp?.policy_no || resp?.policy_number || resp?.data?.policy_no;
      setSuccessModal({
        title: "Success!",
        text: "Travel policy created successfully.",
        policyNo: policyNo,
      });

      // Clear localStorage
      ["travel.coveragePlan", "travel.coverageDetails", "travel.premiumSnapshot"].forEach(
        key => localStorage.removeItem(key)
      );
      
    } catch (err: any) {
      console.error("Submission error:", err);
      
      // Handle structured error from API
      if (err.data) {
        const errorMessages = extractApiErrors(err.data);
        setSubmitBanner(errorMessages.join(", ") || err.message || "Failed to create policy");
      } else {
        const msgs = normalizeUnknownError(err);
        setSubmitBanner(msgs.join(", ") || "Failed to create policy");
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleBack = useCallback(() => {
    navigate("/travel-insurance-details");
  }, [navigate]);

  const handleSuccessClose = useCallback(() => {
    setSuccessModal(null);
    navigate("/dashboard", { replace: true });
  }, [navigate]);

  const submitDisabled = submitLoading || isSubmitting || !premiumSnapshot || !documentIds.passportBackId;

  return (
    <div className="flex min-h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-8 bg-background">
          <div className="max-w-4xl mx-auto">
            <Button variant="ghost" onClick={handleBack} className="mb-6 gap-2">
              <ChevronLeft className="w-4 h-4" />
              Back
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
                  <Button onClick={handleSuccessClose} className="w-full">
                    Go to Dashboard
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Error banner */}
            {submitBanner && !successModal && (
              <Alert className="mb-6 bg-red-50 border-red-200">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-600">
                  {submitBanner}
                </AlertDescription>
              </Alert>
            )}

            {/* Premium Summary */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Premium Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {premiumLoading && (
                  <p className="text-sm text-muted-foreground">Loading premium...</p>
                )}
                {premiumError && (
                  <p className="text-sm text-red-600">{premiumError}</p>
                )}
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
            {Object.keys(DEFAULT_VALUES).map(key => (
              <input key={key} type="hidden" {...register(key as any)} />
            ))}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Additional Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Additional Information</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Passport Number *</Label>
                    <Input 
                      className="mt-2" 
                      {...register("passport_number")} 
                      placeholder="Enter passport number"
                    />
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

                  <div>
                    <CountrySelect
                      register={register("country_code")}
                      error={errors.country_code}
                      required={true}
                      label="Country Code"
                    />
                  </div>

                  {/* Document Upload */}
                  <div>
                    <Label>Password upload *</Label>
                    <Input 
                      className="mt-2" 
                      type="file"
                      onChange={handleFileUpload}
                      disabled={uploading || !passportNumber}
                      accept="image/*,.pdf"
                    />
                    {uploading && (
                      <p className="mt-1 text-xs text-blue-600">Uploading...</p>
                    )}
                    {uploadError && (
                      <p className="mt-1 text-xs text-red-600">{uploadError}</p>
                    )}
                    {documentIds.passportBackId && (
                      <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" /> Uploaded successfully
                      </p>
                    )}
                    {!passportNumber && (
                      <p className="mt-1 text-xs text-amber-600">Enter passport number first</p>
                    )}
                  </div>

                  <div className="md:col-span-2 mt-2 flex items-center gap-3">
                    <Controller
                      control={control}
                      name="have_children"
                      render={({ field }) => (
                        <Switch 
                          id="have_children" 
                          checked={field.value} 
                          onCheckedChange={field.onChange} 
                        />
                      )}
                    />
                    <Label htmlFor="have_children">Have Children?</Label>
                  </div>
                </CardContent>
              </Card>

              {/* Child Information */}
              {haveChildren && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Child Information</CardTitle>
                      <Button
                        type="button"
                        variant="outline"
                        className="gap-2"
                        onClick={() => append({ 
                          children_name: "", 
                          children_dob: "", 
                          children_passport: "" 
                        })}
                      >
                        <Plus className="w-4 h-4" /> Add Child
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {fields.map((field, idx) => (
                      <div key={field.id} className="rounded-md border p-4">
                        <div className="flex justify-between items-center mb-3">
                          <p className="font-medium">Child #{idx + 1}</p>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            onClick={() => remove(idx)}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>

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
                      </div>
                    ))}

                    {errors.child_info && (
                      <p className="text-xs text-red-600">{errors.child_info.message as string}</p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <div className="flex gap-4">
                <Button type="button" variant="outline" onClick={handleBack} className="gap-2">
                  <ChevronLeft className="w-4 h-4" />
                  BACK
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
          </div>
        </main>
      </div>
    </div>
  );
};