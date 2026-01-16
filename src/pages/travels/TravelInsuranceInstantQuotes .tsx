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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { ChevronLeft, Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { getTravelPremium } from "@/api/travels/GetTravelPeriod";
import { createTravelPolicy, type CreateTravelPolicyPayload } from "@/api/travels/CreateTravelPolicy";

/* ---------------- ZOD (M required / O optional) ---------------- */

const childSchema = z.object({
  children_name: z.string().min(1, "Child name is required"),
  children_dob: z.string().min(1, "Child DOB is required"),
  children_passport: z.string().min(1, "Child passport is required"),
});

const formSchema = z
  .object({
    // required (M)
    bank_code: z.string().min(1, "Bank code is required"),

    department_id: z.string().min(1, "Department ID is required"),
    class_id: z.string().min(1, "Class ID is required"),
    payment_process: z.enum(["Full Payment", "Installment"]),
    proposed_date: z.string().min(1, "Proposed date is required"),
    issued_date_ad: z.string().min(1, "Issued date (AD) is required"),
    issued_date_bs: z.string().min(1, "Issued date (BS) is required"),
    effective_date: z.string().min(1, "Effective date is required"),
    expiry_date: z.string().min(1, "Expiry date is required"),

    passport_number: z.string().min(1, "Passport number is required"),
    date_of_birth_AD: z.string().min(1, "DOB (AD) is required"),
    phone_number: z.string().min(10, "Phone number is required"),

    age_band_id: z.string().min(1, "age_band_id missing (go back to Step-2)"),
    travel_package_id: z.string().min(1, "travel_package_id missing (go back to Step-1)"),
    travel_area_id: z.string().min(1, "travel_area_id missing (go back to Step-1)"),
    travel_area_plan_id: z.string().min(1, "travel_area_plan_id missing (go back to Step-1)"),
    period_id: z.string().min(1, "period_id missing (go back to Step-2)"),

    currency_id: z.string().min(1, "Currency ID is required"),

    // numeric required (filled by premium)
    currency_rate: z.coerce.number().nonnegative(),
    currency_premium: z.coerce.number().nonnegative(),
    premium: z.coerce.number().nonnegative(),
    currency_suminsured: z.coerce.number().nonnegative(),
    total_suminsured: z.coerce.number().nonnegative(),

    have_children: z.boolean(),
    country_code: z.string().min(1, "Country code is required"),

    suminsured: z.coerce.number().nonnegative(),
    premium_amount: z.coerce.number().nonnegative(),
    taxable_amount: z.coerce.number().nonnegative(),
    stamp_duty: z.coerce.number().nonnegative(),
    vat_percent: z.coerce.number().nonnegative(),
    vat_amount: z.coerce.number().nonnegative(),
    total_amount: z.coerce.number().nonnegative(),

    // optional / conditional (O)
    child_info: z.array(childSchema).default([]),
  })
  .superRefine((data, ctx) => {
    if (data.have_children && data.child_info.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["child_info"],
        message: "Please add at least 1 child (or turn off Have Children)",
      });
    }
  });

type FormValues = z.infer<typeof formSchema>;

function SummaryRow({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b py-2 last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold">{String(value ?? "—")}</span>
    </div>
  );
}

function extractApiError(resp: any) {
  return resp?.error_list?.[0]?.error_message || resp?.message || resp?.msg || null;
}

export const TravelInsuranceInstantQuotes = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
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

  const classId = watch("class_id");
  const ageBandId = watch("age_band_id");
  const packageId = watch("travel_package_id");
  const areaId = watch("travel_area_id");
  const areaPlanId = watch("travel_area_plan_id");
  const periodId = watch("period_id");

  const { fields, append, remove } = useFieldArray({
    control,
    name: "child_info",
  });

  // Premium states
  const [premiumLoading, setPremiumLoading] = React.useState(false);
  const [premiumError, setPremiumError] = React.useState<string | null>(null);
  const [premiumSnapshot, setPremiumSnapshot] = React.useState<any>(null);

  // Submit states
  const [submitLoading, setSubmitLoading] = React.useState(false);
  const [submitAlert, setSubmitAlert] = React.useState<null | { type: "success" | "error"; text: string }>(null);

  const lastPremiumKeyRef = React.useRef("");

  /* ---------------- Restore Step-1 + Step-2 ---------------- */
  React.useEffect(() => {
    try {
      const planRaw = localStorage.getItem("travel.coveragePlan");
      const detailsRaw = localStorage.getItem("travel.coverageDetails");

      const plan = planRaw ? JSON.parse(planRaw) : null;
      const details = detailsRaw ? JSON.parse(detailsRaw) : null;

      // Step-1 (coverage plan)
      if (plan?.planValue) setValue("travel_area_plan_id", String(plan.planValue));
      if (plan?.areaValue) setValue("travel_area_id", String(plan.areaValue));
      if (plan?.packageValue) setValue("travel_package_id", String(plan.packageValue));

      // Step-2 (coverage details)
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

  /* ---------------- clear children if off ---------------- */
  React.useEffect(() => {
    if (!haveChildren && fields.length > 0) {
      for (let i = fields.length - 1; i >= 0; i--) remove(i);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [haveChildren]);

  /* ---------------- apply premium -> set values (required M) ---------------- */
  function applyPremium(resp: any) {
    // store snapshot for read-only card
    setPremiumSnapshot(resp);

    // write values into form so Zod + submit payload works
    setValue("currency_rate", Number(resp?.rate ?? 0), { shouldValidate: true });
    setValue("currency_premium", Number(resp?.currency_amount ?? 0), { shouldValidate: true });
    setValue("premium", Number(resp?.premium_in_npr ?? 0), { shouldValidate: true });

    setValue("currency_suminsured", Number(resp?.currency_suminsured ?? 0), { shouldValidate: true });
    setValue("total_suminsured", Number(resp?.suminsured_in_npr ?? 0), { shouldValidate: true });

    setValue("suminsured", Number(resp?.suminsured_in_npr ?? 0), { shouldValidate: true });
    setValue("premium_amount", Number(resp?.premium_in_npr ?? 0), { shouldValidate: true });

    const taxable =
      Number(resp?.premium_in_npr ?? 0) - Number(resp?.direct_discount_amount ?? 0);

    setValue("taxable_amount", taxable > 0 ? taxable : Number(resp?.premium_in_npr ?? 0), { shouldValidate: true });

    setValue("stamp_duty", Number(resp?.stamp_duty ?? 0), { shouldValidate: true });
    setValue("vat_percent", Number(resp?.vat_percent ?? 0), { shouldValidate: true });
    setValue("vat_amount", Number(resp?.vat_amount ?? 0), { shouldValidate: true });

    setValue("total_amount", Number(resp?.total_premium_with_vat ?? 0), { shouldValidate: true });

    // persist optional
    localStorage.setItem("travel.premiumSnapshot", JSON.stringify(resp));
  }

  /* ---------------- auto fetch premium ---------------- */
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

        const err = extractApiError(resp);
        if (err) {
          setPremiumError(err);
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

  /* ---------------- SUBMIT: hit create_travel_policy ---------------- */
  const onSubmit = async (v: FormValues) => {
    setSubmitAlert(null);

    if (premiumError || !premiumSnapshot) {
      setSubmitAlert({ type: "error", text: "Premium not loaded. Please fix premium first." });
      return;
    }

    try {
      setSubmitLoading(true);

      const payload: CreateTravelPolicyPayload = {
        client_info: {
          Bank_Code: String(v.bank_code),
        },
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
        child_info: v.have_children ? v.child_info : [],
      };

      const resp = await createTravelPolicy(payload);

      const err = extractApiError(resp);
      if (resp?.process_result === false || err) {
        setSubmitAlert({ type: "error", text: err || "Policy creation failed." });
        window.alert(err || "Policy creation failed.");
        return;
      }

      setSubmitAlert({ type: "success", text: "Travel policy created successfully " });
      window.alert("Travel policy created successfully ");

      // optional: navigate success page
      // navigate("/travel-policy-success");
    } catch (e: any) {
      const msg = e?.message ?? "Request failed";
      setSubmitAlert({ type: "error", text: msg });
      window.alert(msg);
    } finally {
      setSubmitLoading(false);
    }
  };

  function handleBack() {
    navigate("/travel-insurance-details");
  }

  const submitDisabled =
    submitLoading || premiumLoading || isSubmitting || !!premiumError || !premiumSnapshot;
const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
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

            {/* Submit Alert */}
            {submitAlert && (
              <div
                className={`mb-6 rounded-lg border p-4 text-sm ${
                  submitAlert.type === "success"
                    ? "border-green-200 bg-green-50 text-green-700"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}
              >
                {submitAlert.text}
              </div>
            )}

            {/* Premium Summary Card (read-only) */}
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
                    {errors.payment_process && (
                      <p className="mt-1 text-xs text-red-600">{errors.payment_process.message}</p>
                    )}
                  </div>

                  <div>
                    <Label>Issued Date (BS) *</Label>
                    <Input className="mt-2" {...register("issued_date_bs")} placeholder="2082-09-03" />
                    {errors.issued_date_bs && <p className="mt-1 text-xs text-red-600">{errors.issued_date_bs.message}</p>}
                  </div>

                  <div>
                    <Label>Proposed Date *</Label>
                    <Input type="date" className="mt-2" {...register("proposed_date")} />
                    {errors.proposed_date && <p className="mt-1 text-xs text-red-600">{errors.proposed_date.message}</p>}
                  </div>

                  <div>
                    <Label>Issued Date (AD) *</Label>
                    <Input type="date" className="mt-2" {...register("issued_date_ad")} />
                    {errors.issued_date_ad && <p className="mt-1 text-xs text-red-600">{errors.issued_date_ad.message}</p>}
                  </div>

                  <div>
                    <Label>Effective Date *</Label>
                    <Input type="date" className="mt-2" {...register("effective_date")} />
                    {errors.effective_date && <p className="mt-1 text-xs text-red-600">{errors.effective_date.message}</p>}
                  </div>

                  <div>
                    <Label>Expiry Date *</Label>
                    <Input type="date" className="mt-2" {...register("expiry_date")} />
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

              {/* CHILD INFO (optional) */}
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
                    {fields.length === 0 && (
                      <p className="text-sm text-muted-foreground">No children added yet.</p>
                    )}

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
                              <p className="mt-1 text-xs text-red-600">
                                {errors.child_info[idx]?.children_name?.message}
                              </p>
                            )}
                          </div>

                          <div>
                            <Label>Child DOB *</Label>
                            <Input type="date" className="mt-2" {...register(`child_info.${idx}.children_dob`)} />
                            {errors.child_info?.[idx]?.children_dob && (
                              <p className="mt-1 text-xs text-red-600">
                                {errors.child_info[idx]?.children_dob?.message}
                              </p>
                            )}
                          </div>

                          <div>
                            <Label>Child Passport *</Label>
                            <Input className="mt-2" {...register(`child_info.${idx}.children_passport`)} />
                            {errors.child_info?.[idx]?.children_passport && (
                              <p className="mt-1 text-xs text-red-600">
                                {errors.child_info[idx]?.children_passport?.message}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Hidden required fields (from Step-1/2 + Premium) */}
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

              {/* ACTIONS */}
              <div className="flex gap-4">
                <Button type="button" variant="outline" onClick={handleBack} className="gap-2">
                  <ChevronLeft className="w-4 h-4" />
                  BACK
                </Button>

                <Button type="submit" disabled={submitDisabled}>
                  {submitLoading ? "Submitting..." : "SUBMIT"}
                </Button>
              </div>

              {/* Helpful messages */}
              {(errors.age_band_id ||
                errors.travel_package_id ||
                errors.travel_area_id ||
                errors.travel_area_plan_id ||
                errors.period_id) && (
                <p className="text-xs text-red-600">
                  Missing IDs from Step-1 / Step-2. Please go back and select required dropdowns.
                </p>
              )}
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};
