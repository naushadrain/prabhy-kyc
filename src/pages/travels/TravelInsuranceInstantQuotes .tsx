import React, { useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { useLanguage } from "@/contexts/LanguageContext";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { ChevronLeft, Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { getTravelPremium } from "@/api/travels/GetTravelPeriod";
import {
  createTravelPolicy,
  type CreateTravelPolicyPayload,
} from "@/api/travels/CreateTravelPolicy";

/* ---------------- helpers ---------------- */

function todayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function parseISO(v: string) {
  const t = Date.parse(v);
  return Number.isFinite(t) ? new Date(t) : null;
}

function isValidISODate(v: string) {
  return !!parseISO(v);
}

type ApiErrorItem = { error_code?: string; error_message?: string };

function extractApiErrors(resp: any): string[] {
  const list: ApiErrorItem[] = Array.isArray(resp?.error_list) ? resp.error_list : [];
  const msgs = list
    .map((x) => String(x?.error_message ?? "").trim())
    .filter(Boolean);
  if (msgs.length) return msgs;

  const msg = String(resp?.message ?? resp?.msg ?? "").trim();
  return msg ? [msg] : [];
}

function tryParseJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function normalizeUnknownError(err: any): string[] {
  // createTravelPolicy might throw text JSON
  const msg = String(err?.message ?? err ?? "").trim();

  if (msg.startsWith("{") || msg.startsWith("[")) {
    const obj = tryParseJson(msg);
    if (obj) return extractApiErrors(obj);
  }

  // if error itself is object with error_list
  if (err && typeof err === "object") {
    const errs = extractApiErrors(err);
    if (errs.length) return errs;
  }

  return msg ? [msg] : ["Request failed"];
}

//  map server errors to form fields (NO JSON show, only input errors)
function mapServerErrorsToFields(
  messages: string[],
  setError: ReturnType<typeof useForm<any>>["setError"]
) {
  for (const m of messages) {
    const lower = m.toLowerCase();

    if (lower.includes("policy_info.proposed_date") || lower.includes("proposed date")) {
      setError("proposed_date", { type: "server", message: m });
      continue;
    }

    if (lower.includes("policy_info.issued_date_ad") || lower.includes("issued date")) {
      setError("issued_date_ad", { type: "server", message: m });
      continue;
    }

    if (lower.includes("policy_info.effective_date") || lower.includes("effective date")) {
      setError("effective_date", { type: "server", message: m });
      continue;
    }

    if (lower.includes("policy_info.expiry_date") || lower.includes("expiry date")) {
      setError("expiry_date", { type: "server", message: m });
      continue;
    }
  }
}

function SummaryRow({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b py-2 last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold">{String(value ?? "—")}</span>
    </div>
  );
}

/* ---------------- ZOD ---------------- */

const childSchema = z.object({
  children_name: z.string().min(1, "Child name is required"),
  children_dob: z.string().min(1, "Child DOB is required").refine(isValidISODate, "Invalid date"),
  children_passport: z.string().min(1, "Child passport is required"),
});

const formSchema = z
  .object({
    bank_code: z.string().min(1),

    department_id: z.string().min(1),
    class_id: z.string().min(1),

    payment_process: z.enum(["Full Payment", "Installment"]),

    proposed_date: z.string().min(1).refine(isValidISODate, "Invalid date"),
    issued_date_ad: z.string().min(1).refine(isValidISODate, "Invalid date"),
    issued_date_bs: z.string().min(1),

    effective_date: z.string().min(1).refine(isValidISODate, "Invalid date"),
    expiry_date: z.string().min(1).refine(isValidISODate, "Invalid date"),

    passport_number: z.string().min(1),
    date_of_birth_AD: z.string().min(1).refine(isValidISODate, "Invalid date"),
    phone_number: z.string().min(10, "Phone number is required"),

    age_band_id: z.string().min(1, "age_band_id missing (go back to Step-2)"),
    travel_package_id: z.string().min(1, "travel_package_id missing (go back to Step-1)"),
    travel_area_id: z.string().min(1, "travel_area_id missing (go back to Step-1)"),
    travel_area_plan_id: z.string().min(1, "travel_area_plan_id missing (go back to Step-1)"),
    period_id: z.string().min(1, "period_id missing (go back to Step-2)"),

    currency_id: z.string().min(1),

    currency_rate: z.coerce.number().nonnegative(),
    currency_premium: z.coerce.number().nonnegative(),
    premium: z.coerce.number().nonnegative(),
    currency_suminsured: z.coerce.number().nonnegative(),
    total_suminsured: z.coerce.number().nonnegative(),

    have_children: z.boolean(),
    country_code: z.string().min(1),

    suminsured: z.coerce.number().nonnegative(),
    premium_amount: z.coerce.number().nonnegative(),
    taxable_amount: z.coerce.number().nonnegative(),
    stamp_duty: z.coerce.number().nonnegative(),
    vat_percent: z.coerce.number().nonnegative(),
    vat_amount: z.coerce.number().nonnegative(),
    total_amount: z.coerce.number().nonnegative(),

    child_info: z.array(childSchema).default([]),
  })
  .superRefine((data, ctx) => {
    const today = parseISO(todayISO())!;
    const issuedAD = parseISO(data.issued_date_ad);
    const proposed = parseISO(data.proposed_date);
    const effective = parseISO(data.effective_date);
    const expiry = parseISO(data.expiry_date);

    //  Issued Date must be till Today (not future)
    if (issuedAD && issuedAD.getTime() > today.getTime()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["issued_date_ad"],
        message: "Issued Date (AD) cannot be in the future (must be till today)",
      });
    }

    //  Proposed Date must not be before Issued Date
    if (issuedAD && proposed && proposed.getTime() < issuedAD.getTime()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["proposed_date"],
        message: "Proposed Date must not be before Issued Date (AD)",
      });
    }

    //  Effective Date must not be before Issued Date
    if (issuedAD && effective && effective.getTime() < issuedAD.getTime()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["effective_date"],
        message: "Effective Date must not be before Issued Date (AD)",
      });
    }

    //  Expiry Date must be after Effective Date
    if (effective && expiry && expiry.getTime() <= effective.getTime()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["expiry_date"],
        message: "Expiry Date must be after Effective Date",
      });
    }

    if (data.have_children && data.child_info.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["child_info"],
        message: "Please add at least 1 child (or turn off Have Children)",
      });
    }
  });

type FormValues = z.infer<typeof formSchema>;

export const TravelInsuranceInstantQuotes = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    defaultValues: {
      bank_code: "1",
      department_id: "3",
      class_id: "81",
      payment_process: "Full Payment",

      proposed_date: "",
      issued_date_ad: "",
      issued_date_bs: "",
      effective_date: "",
      expiry_date: "",

      passport_number: "",
      date_of_birth_AD: "",
      phone_number: "",

      age_band_id: "",
      travel_package_id: "",
      travel_area_id: "",
      travel_area_plan_id: "",
      period_id: "",

      currency_id: "2",

      currency_rate: 0,
      currency_premium: 0,
      premium: 0,
      currency_suminsured: 0,
      total_suminsured: 0,

      have_children: false,
      country_code: "CA",

      suminsured: 0,
      premium_amount: 0,
      taxable_amount: 0,
      stamp_duty: 0,
      vat_percent: 0,
      vat_amount: 0,
      total_amount: 0,

      child_info: [],
    },
    mode: "onSubmit",
  });

  const haveChildren = watch("have_children");
  const issuedDateAD = watch("issued_date_ad");
  const effectiveDate = watch("effective_date");

  const classId = watch("class_id");
  const ageBandId = watch("age_band_id");
  const packageId = watch("travel_package_id");
  const areaId = watch("travel_area_id");
  const areaPlanId = watch("travel_area_plan_id");
  const periodId = watch("period_id");

  const { fields, append, remove } = useFieldArray({ control, name: "child_info" });

  const [premiumLoading, setPremiumLoading] = useState(false);
  const [premiumError, setPremiumError] = useState<string | null>(null);
  const [premiumSnapshot, setPremiumSnapshot] = useState<any>(null);

  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitBanner, setSubmitBanner] = useState<string>("");

  const lastPremiumKeyRef = React.useRef("");

  /* restore step values */
  React.useEffect(() => {
    try {
      const planRaw = localStorage.getItem("travel.coveragePlan");
      const detailsRaw = localStorage.getItem("travel.coverageDetails");

      const plan = planRaw ? JSON.parse(planRaw) : null;
      const details = detailsRaw ? JSON.parse(detailsRaw) : null;

      if (plan?.planValue) setValue("travel_area_plan_id", String(plan.planValue));
      if (plan?.areaValue) setValue("travel_area_id", String(plan.areaValue));
      if (plan?.packageValue) setValue("travel_package_id", String(plan.packageValue));

      if (details?.age_band_id) setValue("age_band_id", String(details.age_band_id));
      if (details?.period_id) setValue("period_id", String(details.period_id));

      if (details?.dob) setValue("date_of_birth_AD", String(details.dob));
      if (details?.phone_number) setValue("phone_number", String(details.phone_number));
      if (details?.passport_number) setValue("passport_number", String(details.passport_number));

      if (details?.travelFrom) {
        setValue("proposed_date", String(details.travelFrom));
        setValue("effective_date", String(details.travelFrom));
      }
      if (details?.travelTo) setValue("expiry_date", String(details.travelTo));
    } catch (e) {
      console.error("Restore failed:", e);
    }
  }, [setValue]);

  /* clear children if off */
  React.useEffect(() => {
    if (!haveChildren && fields.length > 0) {
      for (let i = fields.length - 1; i >= 0; i--) remove(i);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [haveChildren]);

 function round2(n: any) {
  const x = Number(n ?? 0);
  if (!Number.isFinite(x)) return 0;
  return Math.round((x + Number.EPSILON) * 100) / 100;
}

function applyPremium(resp: any) {
  setPremiumSnapshot(resp);

  //  always store with 2 decimals
  const rate = round2(resp?.rate);
  const currencyPremium = round2(resp?.currency_amount);
  const premiumNpr = round2(resp?.premium_in_npr);

  const currencySuminsured = round2(resp?.currency_suminsured);
  const suminsuredNpr = round2(resp?.suminsured_in_npr);

  const discountAmt = round2(resp?.direct_discount_amount);
  const taxableRaw = premiumNpr - discountAmt;
  const taxable = round2(taxableRaw > 0 ? taxableRaw : premiumNpr);

  const stamp = round2(resp?.stamp_duty);
  const vatPercent = round2(resp?.vat_percent);
  const vatAmount = round2(resp?.vat_amount);
  const total = round2(resp?.total_premium_with_vat);

  setValue("currency_rate", rate, { shouldValidate: true });
  setValue("currency_premium", currencyPremium, { shouldValidate: true });
  setValue("premium", premiumNpr, { shouldValidate: true });

  setValue("currency_suminsured", currencySuminsured, { shouldValidate: true });
  setValue("total_suminsured", suminsuredNpr, { shouldValidate: true });

  setValue("suminsured", suminsuredNpr, { shouldValidate: true });
  setValue("premium_amount", premiumNpr, { shouldValidate: true });

  //  FIX: taxable_amount only 2 decimals
  setValue("taxable_amount", taxable, { shouldValidate: true });

  setValue("stamp_duty", stamp, { shouldValidate: true });
  setValue("vat_percent", vatPercent, { shouldValidate: true });
  setValue("vat_amount", vatAmount, { shouldValidate: true });
  setValue("total_amount", total, { shouldValidate: true });

  // optional persist
  localStorage.setItem(
    "travel.premiumSnapshot",
    JSON.stringify({
      ...resp,
      rate,
      currency_amount: currencyPremium,
      premium_in_npr: premiumNpr,
      currency_suminsured: currencySuminsured,
      suminsured_in_npr: suminsuredNpr,
      direct_discount_amount: discountAmt,
      stamp_duty: stamp,
      vat_percent: vatPercent,
      vat_amount: vatAmount,
      total_premium_with_vat: total,
      taxable_amount: taxable,
    })
  );
}


  /* auto premium */
  React.useEffect(() => {
    let cancelled = false;

    async function run() {
      setPremiumError(null);

      if (!classId || !ageBandId || !packageId || !areaId || !areaPlanId || !periodId) return;

      const key = `${classId}|${ageBandId}|${packageId}|${areaId}|${areaPlanId}|${periodId}`;
      if (lastPremiumKeyRef.current === key) return;
      lastPremiumKeyRef.current = key;

      try {
        setPremiumLoading(true);

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

        applyPremium(resp);
      } catch (e: any) {
        if (!cancelled) setPremiumError(e?.message ?? "Failed to load premium");
        setPremiumSnapshot(null);
      } finally {
        if (!cancelled) setPremiumLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [classId, ageBandId, packageId, areaId, areaPlanId, periodId]);

  const onSubmit = async (v: FormValues) => {
    setSubmitBanner("");

    if (premiumError || !premiumSnapshot) {
      setSubmitBanner("Premium not loaded. Please fix premium first.");
      return;
    }

    try {
      setSubmitLoading(true);

      const payload: CreateTravelPolicyPayload = {
        client_info: { Bank_Code: String(v.bank_code) },
        policy_info: {
          department_id: String(v.department_id),
          class_id: String(v.class_id),
          payment_process: v.payment_process,
          proposed_date: v.proposed_date,
          issued_date_ad: v.issued_date_ad,
          issued_date_bs: v.issued_date_bs,
          effective_date: v.effective_date,
          expiry_date: v.expiry_date,
        },
        class_info: {
          class_id: String(v.class_id),
          passport_number: String(v.passport_number),
          date_of_birth_AD: v.date_of_birth_AD,
          phone_number: String(v.phone_number),

          age_band_id: String(v.age_band_id),
          travel_package_id: String(v.travel_package_id),
          travel_area_id: String(v.travel_area_id),
          travel_area_plan_id: String(v.travel_area_plan_id),
          period_id: String(v.period_id),

          currency_id: String(v.currency_id),

          currency_rate: Number(v.currency_rate),
          currency_premium: Number(v.currency_premium),
          premium: Number(v.premium),
          currency_suminsured: Number(v.currency_suminsured),
          total_suminsured: Number(v.total_suminsured),

          have_children: Boolean(v.have_children),
          country_code: String(v.country_code),
        },
        amount_info: {
          suminsured: Number(v.suminsured),
          premium_amount: Number(v.premium_amount),
          pa_amount: 0,
          tpl_amount: 0,
          pool_amount: 0,
          taxable_amount: Number(v.taxable_amount),
          stamp_duty: Number(v.stamp_duty),
          vat_percent: Number(v.vat_percent),
          vat_amount: Number(v.vat_amount),
          total_amount: Number(v.total_amount),
        },
        child_info: v.have_children
          ? v.child_info.map((c) => ({
              children_name: c.children_name,
              children_dob: c.children_dob,
              children_passport: c.children_passport,
            }))
          : [],
      };

      const resp = await createTravelPolicy(payload);

      const serverMessages = extractApiErrors(resp);
      if (resp?.process_result === false || serverMessages.length) {
        //  show errors on inputs only (no JSON)
        mapServerErrorsToFields(serverMessages, setError);
        setSubmitBanner("Please correct highlighted fields.");
        return;
      }

      //  success => reset + clear + redirect
      reset();
      localStorage.removeItem("travel.coveragePlan");
      localStorage.removeItem("travel.coverageDetails");
      localStorage.removeItem("travel.premiumSnapshot");

      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      const msgs = normalizeUnknownError(err);
      mapServerErrorsToFields(msgs, setError);
      setSubmitBanner("Please correct highlighted fields.");
    } finally {
      setSubmitLoading(false);
    }
  };

  function handleBack() {
    navigate("/travel-insurance-details");
  }

  const submitDisabled =
    submitLoading || premiumLoading || isSubmitting || !!premiumError || !premiumSnapshot;

  const minProposed = issuedDateAD || undefined;
  const maxIssued = todayISO();
  const minEffective = issuedDateAD || undefined;
  const minExpiry = effectiveDate || undefined;

  return (
    <div className="flex min-h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-8 bg-background">
          <div className="max-w-4xl mx-auto">
            <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 gap-2">
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <h1 className="text-2xl font-bold mb-6">Instant Quotes</h1>

            {/* only small banner - no JSON, no list */}
            {submitBanner && (
              <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {submitBanner}
              </div>
            )}

            {/* Premium Summary */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Premium Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {premiumLoading && <p className="text-sm text-muted-foreground">Loading premium...</p>}
                {premiumError && <p className="text-sm text-red-600">{premiumError}</p>}

                {!premiumLoading && !premiumError && premiumSnapshot && (
                  <>
                    <SummaryRow label="Currency" value={premiumSnapshot?.currency ?? "—"} />
                    <SummaryRow label="Rate" value={premiumSnapshot?.rate ?? 0} />
                    <SummaryRow label="Currency Premium" value={premiumSnapshot?.currency_amount ?? 0} />
                    <SummaryRow label="Premium in NPR" value={premiumSnapshot?.premium_in_npr ?? 0} />
                    <SummaryRow label="Currency Suminsured" value={premiumSnapshot?.currency_suminsured ?? 0} />
                    <SummaryRow label="Suminsured in NPR" value={premiumSnapshot?.suminsured_in_npr ?? 0} />
                    <SummaryRow label="VAT %" value={premiumSnapshot?.vat_percent ?? 0} />
                    <SummaryRow label="VAT Amount" value={premiumSnapshot?.vat_amount ?? 0} />
                    <SummaryRow label="Stamp Duty" value={premiumSnapshot?.stamp_duty ?? 0} />
                    <SummaryRow label="Total Premium with VAT" value={premiumSnapshot?.total_premium_with_vat ?? 0} />
                  </>
                )}
              </CardContent>
            </Card>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* POLICY INFO */}
              <Card>
                <CardHeader>
                  <CardTitle>Policy Info</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Payment Process *</Label>
                    <Controller
                      control={control}
                      name="payment_process"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="mt-2">
                            <SelectValue placeholder="Select payment process" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Full Payment">Full Payment</SelectItem>
                            <SelectItem value="Installment">Installment</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  <div>
                    <Label>Issued Date (BS) *</Label>
                    <Input className="mt-2" {...register("issued_date_bs")} placeholder="2082-09-03" />
                    {errors.issued_date_bs && <p className="mt-1 text-xs text-red-600">{errors.issued_date_bs.message}</p>}
                  </div>

                  <div>
                    <Label>Issued Date (AD) *</Label>
                    <Input type="date" className="mt-2" {...register("issued_date_ad")} max={maxIssued} />
                    {errors.issued_date_ad && <p className="mt-1 text-xs text-red-600">{errors.issued_date_ad.message}</p>}
                  </div>

                  <div>
                    <Label>Proposed Date *</Label>
                    <Input type="date" className="mt-2" {...register("proposed_date")} min={minProposed} />
                    {errors.proposed_date && <p className="mt-1 text-xs text-red-600">{errors.proposed_date.message}</p>}
                  </div>

                  <div>
                    <Label>Effective Date *</Label>
                    <Input type="date" className="mt-2" {...register("effective_date")} min={minEffective} />
                    {errors.effective_date && <p className="mt-1 text-xs text-red-600">{errors.effective_date.message}</p>}
                  </div>

                  <div>
                    <Label>Expiry Date *</Label>
                    <Input type="date" className="mt-2" {...register("expiry_date")} min={minExpiry} />
                    {errors.expiry_date && <p className="mt-1 text-xs text-red-600">{errors.expiry_date.message}</p>}
                  </div>
                </CardContent>
              </Card>

              {/* CLASS INFO */}
              <Card>
                <CardHeader>
                  <CardTitle>Class Info</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Passport Number *</Label>
                    <Input className="mt-2" {...register("passport_number")} />
                    {errors.passport_number && <p className="mt-1 text-xs text-red-600">{errors.passport_number.message}</p>}
                  </div>

                  <div>
                    <Label>Date of Birth (AD) *</Label>
                    <Input type="date" className="mt-2" {...register("date_of_birth_AD")} />
                    {errors.date_of_birth_AD && <p className="mt-1 text-xs text-red-600">{errors.date_of_birth_AD.message}</p>}
                  </div>

                  <div>
                    <Label>Phone Number *</Label>
                    <Input className="mt-2" {...register("phone_number")} />
                    {errors.phone_number && <p className="mt-1 text-xs text-red-600">{errors.phone_number.message}</p>}
                  </div>

                  <div>
                    <Label>Country Code *</Label>
                    <Input className="mt-2" {...register("country_code")} placeholder="CA" />
                    {errors.country_code && <p className="mt-1 text-xs text-red-600">{errors.country_code.message}</p>}
                  </div>

                  <div className="md:col-span-2 mt-2 flex items-center gap-3">
                    <Controller
                      control={control}
                      name="have_children"
                      render={({ field }) => (
                        <Switch id="have_children" checked={field.value} onCheckedChange={field.onChange} />
                      )}
                    />
                    <Label htmlFor="have_children">Have Children?</Label>
                  </div>

                  {errors.child_info && (
                    <p className="md:col-span-2 text-xs text-red-600">{errors.child_info.message as any}</p>
                  )}
                </CardContent>
              </Card>

              {/* CHILD INFO */}
              {haveChildren && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Child Info</CardTitle>
                      <Button
                        type="button"
                        variant="outline"
                        className="gap-2"
                        onClick={() => append({ children_name: "", children_dob: "", children_passport: "" })}
                      >
                        <Plus className="w-4 h-4" /> Add Child
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {fields.map((f, idx) => (
                      <div key={f.id} className="rounded-md border p-4">
                        <div className="flex justify-between items-center mb-3">
                          <p className="font-medium">Child #{idx + 1}</p>
                          <Button type="button" variant="ghost" onClick={() => remove(idx)}>
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>

                        <div className="grid md:grid-cols-3 gap-4">
                          <div>
                            <Label>Child Name *</Label>
                            <Input className="mt-2" {...register(`child_info.${idx}.children_name`)} />
                            {errors.child_info?.[idx]?.children_name && (
                              <p className="mt-1 text-xs text-red-600">{errors.child_info[idx]?.children_name?.message}</p>
                            )}
                          </div>

                          <div>
                            <Label>Child DOB *</Label>
                            <Input type="date" className="mt-2" {...register(`child_info.${idx}.children_dob`)} />
                            {errors.child_info?.[idx]?.children_dob && (
                              <p className="mt-1 text-xs text-red-600">{errors.child_info[idx]?.children_dob?.message}</p>
                            )}
                          </div>

                          <div>
                            <Label>Child Passport *</Label>
                            <Input className="mt-2" {...register(`child_info.${idx}.children_passport`)} />
                            {errors.child_info?.[idx]?.children_passport && (
                              <p className="mt-1 text-xs text-red-600">{errors.child_info[idx]?.children_passport?.message}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* hidden required fields */}
              <input type="hidden" {...register("bank_code")} />
              <input type="hidden" {...register("department_id")} />
              <input type="hidden" {...register("class_id")} />
              <input type="hidden" {...register("age_band_id")} />
              <input type="hidden" {...register("travel_package_id")} />
              <input type="hidden" {...register("travel_area_id")} />
              <input type="hidden" {...register("travel_area_plan_id")} />
              <input type="hidden" {...register("period_id")} />
              <input type="hidden" {...register("currency_id")} />

              <input type="hidden" {...register("currency_rate")} />
              <input type="hidden" {...register("currency_premium")} />
              <input type="hidden" {...register("premium")} />
              <input type="hidden" {...register("currency_suminsured")} />
              <input type="hidden" {...register("total_suminsured")} />
              <input type="hidden" {...register("suminsured")} />
              <input type="hidden" {...register("premium_amount")} />
              <input type="hidden" {...register("taxable_amount")} />
              <input type="hidden" {...register("stamp_duty")} />
              <input type="hidden" {...register("vat_percent")} />
              <input type="hidden" {...register("vat_amount")} />
              <input type="hidden" {...register("total_amount")} />

              {/* actions */}
              <div className="flex gap-4">
                <Button type="button" variant="outline" onClick={handleBack} className="gap-2">
                  <ChevronLeft className="w-4 h-4" />
                  BACK
                </Button>

                <Button type="submit" disabled={submitDisabled}>
                  {submitLoading ? "Submitting..." : "SUBMIT"}
                </Button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};
