import React, { useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import logo from "@/assets/logo.png";
import { useLanguage } from "@/contexts/LanguageContext";

import { Button } from "@/components/ui/button";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";


import { ChevronLeft, LogIn, Plus, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { getTravelPremium } from "@/api/travels/GetTravelPeriod";
import {
  createTravelPolicy,
  type CreateTravelPolicyPayload,
} from "@/api/travels/CreateTravelPolicy";

/* ---------------- helpers ---------------- */



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
}

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



export const PremiumSummary = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  //  SUCCESS dialog/banner state
  const [successModal, setSuccessModal] = useState<null | { title: string; text: string }>(null);

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
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

    setValue("taxable_amount", taxable, { shouldValidate: true });

    setValue("stamp_duty", stamp, { shouldValidate: true });
    setValue("vat_percent", vatPercent, { shouldValidate: true });
    setValue("vat_amount", vatAmount, { shouldValidate: true });
    setValue("total_amount", total, { shouldValidate: true });

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
    submitLoading || premiumLoading || isSubmitting || !!premiumError || !premiumSnapshot;
  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <img src={logo} alt="Prabhu Insurance" className="h-9 w-auto shrink-0" />
              <div className="hidden sm:block min-w-0">
                <div className="text-sm font-semibold leading-4 truncate">Prabhu Insurance</div>
                <div className="text-xs text-muted-foreground truncate">
                  Travel Medical Insurance
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link to="/login">
                <Button size="sm" className="gap-2">
                  <LogIn className="h-4 w-4" />
                  <span className="hidden sm:inline">{t("nav.login")}</span>
                  <span className="sm:hidden">Login</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>
        <main className="flex-1 p-8 bg-background">
          <div className="max-w-4xl mx-auto">
            <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 gap-2">
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <h1 className="text-2xl font-bold mb-6">Instant Quotes</h1>

            {/*  TOP SUCCESS ALERT (with OK button) */}
            {successModal && (
              <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">{successModal.title}</div>
                    <div className="mt-1">{successModal.text}</div>
                  </div>
                  <Button
                    type="button"
                    onClick={() => {
                      setSuccessModal(null);
                      navigate("/dashboard", { replace: true });
                    }}
                  >
                    OK
                  </Button>
                </div>
              </div>
            )}

            {/* small error banner */}
            {submitBanner && !successModal && (
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
          </div>
        </main>
      </div>
  );
};
