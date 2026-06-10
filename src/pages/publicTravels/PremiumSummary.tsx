import React from "react";
import { useForm, useFieldArray } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { ArrowRight, ChevronLeft } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

import { getTravelPremium } from "@/api/travels/GetTravelCataloguesPublic";

type DirectDiscountValue = "y" | "n";

type ApiErrorItem = {
  error_code?: string;
  error_message?: string;
};

type CoverageState = {
  planValue?: string;
  areaValue?: string;
  packageValue?: string;
};

type TravelPremiumRowProps = {
  label: string;
  value: number | string | null | undefined;
  isLess?: boolean;
  textOnly?: boolean;
};

function extractApiErrors(resp: any): string[] {
  const list: ApiErrorItem[] = Array.isArray(resp?.error_list)
    ? resp.error_list
    : [];

  const msgs = list
    .map((item) => String(item?.error_message ?? "").trim())
    .filter(Boolean);

  if (msgs.length) return msgs;

  const msg = String(resp?.message ?? resp?.msg ?? "").trim();

  return msg ? [msg] : [];
}

function formatAmount(value: number | string | null | undefined) {
  const cleanValue = String(value ?? "0").replace(/,/g, "");
  const num = Number(cleanValue);

  if (!Number.isFinite(num)) return "0.00";

  return num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function TravelPremiumRow({
  label,
  value,
  isLess = false,
  textOnly = false,
}: TravelPremiumRowProps) {
  return (
    <tr className="border-b bg-[#fff7f3] last:border-b-0">
      <td
        className={`border-r border-white px-4 py-3 ${
          isLess ? "text-red-600" : "text-black"
        }`}
      >
        {isLess ? `Less : ${label}` : label}
      </td>

      <td
        className={`px-4 py-3 text-right font-medium ${
          isLess ? "text-red-600" : "text-black"
        }`}
      >
        {textOnly
          ? value
          : isLess
            ? `(${formatAmount(value)})`
            : formatAmount(value)}
      </td>
    </tr>
  );
}

export const PremiumSummary = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    control,
    watch,
    setValue,
  } = useForm({
    defaultValues: {
      bank_code: "1",
      department_id: "3",
      class_id: "33",
      get_direct_discount: "y" as DirectDiscountValue,
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
  const getDirectDiscount = watch("get_direct_discount") as DirectDiscountValue;

  const { fields, remove } = useFieldArray({
    control,
    name: "child_info",
  });

  const [premiumLoading, setPremiumLoading] = React.useState(false);
  const [premiumError, setPremiumError] = React.useState<string | null>(null);
  const [premiumSnapshot, setPremiumSnapshot] = React.useState<any>(null);

  const lastPremiumKeyRef = React.useRef("");

  React.useEffect(() => {
    const st = (location.state || {}) as any;

    if (!st) return;

    setValue("class_id", "33");
    setValue(
      "get_direct_discount",
      (st.get_direct_discount === "n" ? "n" : "y") as DirectDiscountValue,
    );

    if (st.planValue) setValue("travel_area_plan_id", String(st.planValue));
    if (st.areaValue) setValue("travel_area_id", String(st.areaValue));
    if (st.packageValue) setValue("travel_package_id", String(st.packageValue));

    if (st.age_band_id) setValue("age_band_id", String(st.age_band_id));
    if (st.period_id) setValue("period_id", String(st.period_id));

    if (st.dob) setValue("date_of_birth_AD", String(st.dob));
    if (st.phone_number) setValue("phone_number", String(st.phone_number));

    if (st.passport_number) {
      setValue("passport_number", String(st.passport_number));
    }

    if (st.travelFrom) {
      setValue("proposed_date", String(st.travelFrom));
      setValue("effective_date", String(st.travelFrom));
    }

    if (st.travelTo) {
      setValue("expiry_date", String(st.travelTo));
    }
  }, [location.state, setValue]);

  React.useEffect(() => {
    if (!haveChildren && fields.length > 0) {
      for (let index = fields.length - 1; index >= 0; index--) {
        remove(index);
      }
    }
  }, [haveChildren, fields.length, remove]);

  function round2(value: any) {
    const num = Number(value ?? 0);

    if (!Number.isFinite(num)) return 0;

    return Math.round((num + Number.EPSILON) * 100) / 100;
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

    setValue("currency_suminsured", currencySuminsured, {
      shouldValidate: true,
    });

    setValue("total_suminsured", suminsuredNpr, {
      shouldValidate: true,
    });

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
      }),
    );
  }

  React.useEffect(() => {
    let cancelled = false;

    async function run() {
      setPremiumError(null);

      if (
        !classId ||
        !ageBandId ||
        !packageId ||
        !areaId ||
        !areaPlanId ||
        !periodId
      ) {
        return;
      }

      const key = `${classId}|${ageBandId}|${packageId}|${areaId}|${areaPlanId}|${periodId}|${getDirectDiscount}`;

      if (lastPremiumKeyRef.current === key) return;

      lastPremiumKeyRef.current = key;

      try {
        setPremiumLoading(true);

        const payload = {
          class_id: "33",
          age_band_id: String(ageBandId),
          travel_package_id: String(packageId),
          travel_area_id: String(areaId),
          travel_area_plan_id: String(areaPlanId),
          period_id: String(periodId),
          get_direct_discount: getDirectDiscount === "n" ? "n" : "y",
        } satisfies {
          class_id: string;
          age_band_id: string;
          travel_package_id: string;
          travel_area_id: string;
          travel_area_plan_id: string;
          period_id: string;
          get_direct_discount: DirectDiscountValue;
        };

        console.log("Travel Premium Payload:", payload);

        const resp = await getTravelPremium(payload);

        if (cancelled) return;

        const errs = extractApiErrors(resp);

        if (errs.length) {
          setPremiumError(errs[0]);
          setPremiumSnapshot(null);
          return;
        }

        applyPremium(resp);
      } catch (error: any) {
        if (!cancelled) {
          setPremiumError(error?.message ?? "Failed to load premium");
        }

        setPremiumSnapshot(null);
      } finally {
        if (!cancelled) {
          setPremiumLoading(false);
        }
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [
    classId,
    ageBandId,
    packageId,
    areaId,
    areaPlanId,
    periodId,
    getDirectDiscount,
  ]);

  const [coverageState] = React.useState<CoverageState>({
    planValue: "",
    areaValue: "",
    packageValue: "",
  });

  function handleBack() {
    navigate("/travels", { state: coverageState });
  }

  return (
    <>
      <Card className="mb-6 border-0 shadow-none">
        <CardContent className="p-0">
          {premiumLoading && (
            <p className="text-sm text-muted-foreground">
              Loading premium...
            </p>
          )}

          {premiumError && (
            <p className="text-sm text-red-600">{premiumError}</p>
          )}

          {!premiumLoading && !premiumError && premiumSnapshot && (
            <div className="overflow-hidden rounded-md border">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-[#e91d25] text-white">
                    <th className="border-r border-white px-4 py-3 text-left font-bold">
                      Travel Premium Details
                    </th>

                    <th className="px-4 py-3 text-right font-bold">
                      Amount NPR
                    </th>
                  </tr>
                </thead>

                <tbody>
                  <TravelPremiumRow
                    label="Rate"
                    value={premiumSnapshot?.rate ?? 0}
                  />

                  <TravelPremiumRow
                    label="Currency Premium"
                    value={premiumSnapshot?.currency_amount ?? 0}
                  />

                  <TravelPremiumRow
                    label="Premium in NPR"
                    value={premiumSnapshot?.premium_in_npr ?? 0}
                  />

                  <TravelPremiumRow
                    label="Currency Sum Insured"
                    value={premiumSnapshot?.currency_suminsured ?? 0}
                  />

                  <TravelPremiumRow
                    label="Sum Insured in NPR"
                    value={premiumSnapshot?.suminsured_in_npr ?? 0}
                  />

                  <TravelPremiumRow
                    label="Direct Discount Amount"
                    value={premiumSnapshot?.direct_discount_amount ?? 0}
                    isLess
                  />

                  <TravelPremiumRow
                    label="Stamp Duty"
                    value={premiumSnapshot?.stamp_duty ?? 0}
                  />

                  <tr className="bg-[#b71319] text-white">
                    <td className="border-r border-white px-4 py-4 text-base font-bold">
                      Total Premium
                    </td>

                    <td className="px-4 py-4 text-right text-base font-bold">
                      {formatAmount(
                        premiumSnapshot?.total_premium_with_vat ?? 0,
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-8 flex justify-between">
        <Button variant="outline" onClick={handleBack} className="gap-2">
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>

        <Button
          type="button"
          className="gap-2 bg-[#f71920] text-white hover:bg-[#d9151b]"
          onClick={() => navigate("/login")}
        >
          Buy Policy
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </>
  );
};