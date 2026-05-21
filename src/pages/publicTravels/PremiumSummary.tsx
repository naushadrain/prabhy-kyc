import React, { useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";

import { Button } from "@/components/ui/button";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";


import { ChevronLeft } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

import { getTravelPremium } from "@/api/travels/GetTravelCataloguesPublic";
function parseISO(v: string) {
  const t = Date.parse(v);
  return Number.isFinite(t) ? new Date(t) : null;
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

function SummaryRow({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b py-2 last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold">{String(value ?? "—")}</span>
    </div>
  );
}

export const PremiumSummary = () => {
  const navigate = useNavigate();
  const location = useLocation();

  //  SUCCESS dialog/banner state
  const [successModal, setSuccessModal] = useState<null | { title: string; text: string }>(null);
  const {
    control,
    watch,
    setValue,

    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      bank_code: "1",
      department_id: "3",
      class_id: "33",
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
  const lastPremiumKeyRef = React.useRef("");

  /* restore step values from router state */
  React.useEffect(() => {
    const st = (location.state || {}) as any;
    if (!st) return;

    if (st.planValue) setValue("travel_area_plan_id", String(st.planValue));
    if (st.areaValue) setValue("travel_area_id", String(st.areaValue));
    if (st.packageValue) setValue("travel_package_id", String(st.packageValue));

    if (st.age_band_id) setValue("age_band_id", String(st.age_band_id));
    if (st.period_id) setValue("period_id", String(st.period_id));

    if (st.dob) setValue("date_of_birth_AD", String(st.dob));
    if (st.phone_number) setValue("phone_number", String(st.phone_number));
    if (st.passport_number) setValue("passport_number", String(st.passport_number));

    if (st.travelFrom) {
      setValue("proposed_date", String(st.travelFrom));
      setValue("effective_date", String(st.travelFrom));
    }
    if (st.travelTo) setValue("expiry_date", String(st.travelTo));
  }, [location.state, setValue]);

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

  type CoverageState = {
    planValue?: string;
    areaValue?: string;
    packageValue?: string;
  };
  const [coverageState, setCoverageState] = React.useState<CoverageState>({
    planValue: "",
    areaValue: "",
    packageValue: "",
  });
  function handleBack() {
    navigate("/travels", { state: coverageState });
  }
  return (
    <>
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
              <SummaryRow label="VAT %" value={premiumSnapshot?.vat_percent ?? 0} />
              <SummaryRow label="VAT Amount" value={premiumSnapshot?.vat_amount ?? 0} />
              <SummaryRow label="Stamp Duty" value={premiumSnapshot?.stamp_duty ?? 0} />
              <SummaryRow label="Direct Discount Percent" value={premiumSnapshot?.direct_discount_percent ?? 0} />
              <SummaryRow label="Total Premium with VAT" value={premiumSnapshot?.total_premium_with_vat ?? 0} />
            </>
          )}
        </CardContent>
      </Card>
      <div className="flex gap-4">
        <Button variant="outline" onClick={handleBack} className="gap-2">
          <ChevronLeft className="w-4 h-4" />
          BACK
        </Button>

        <Button onClick={() => navigate("/")}>
          HOME
        </Button>
      </div>
    </>
  );
};
