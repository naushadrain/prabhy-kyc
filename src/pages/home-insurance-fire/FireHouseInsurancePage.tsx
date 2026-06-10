// src/pages/home-insurance/FireHouseInsurancePage.tsx

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle,
  Home,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  getFireHousePremium,
  createFireHousePolicy,
  type FireHousePremiumRequest,
  type FireHousePremiumResponse,
  type CreateFireHousePolicyPayload,
} from "@/api/fire/fireHousePolicy";

import {
  getPropertyListCatalogue,
  getProvinceCatalogue,
  getDistrictCatalogue,
  getLocalLevelCatalogue,
  type HomeCatalogueItem,
} from "@/api/home/getCatlog";

type FireHouseForm = {
  propertyList: string;
  effectiveDate: string;
  expiryDate: string;

  province: string;
  district: string;
  localLevel: string;
  tole: string;
  wardNo: string;
  houseNo: string;

  constructionType: string;
  buildingFloor: string;
  buildingUtilization: string;
  buildingSuminsured: string;
  buildingRemarks: string;

  includeRsdCharge: boolean;
  directDiscount: boolean;
};

const constructionOptions = [
  {
    label: "1st Class Construction",
    value: "1st Class Construction",
  },
  {
    label: "2nd Class Construction",
    value: "2nd Class Construction",
  },
  {
    label: "3rd Class Construction",
    value: "3rd Class Construction",
  },
];

const buildingUtilizationOptions = [
  {
    label: "Residential",
    value: "Residential",
  },
  {
    label: "Commercial",
    value: "Commercial",
  },
  {
    label: "Residential / Commercial",
    value: "Residential / Commercial",
  },
  {
    label: "Office",
    value: "Office",
  },
  {
    label: "Shop",
    value: "Shop",
  },
  {
    label: "Godown",
    value: "Godown",
  },
];

function todayISO(): string {
  const d = new Date();

  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(d.getDate()).padStart(2, "0")}`;
}

function addOneYear(dateISO: string): string {
  const d = new Date(dateISO || todayISO());

  d.setFullYear(d.getFullYear() + 1);
  d.setDate(d.getDate() - 1);

  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatAmount(value: number | string | null | undefined): string {
  const cleanValue = String(value ?? "0").replace(/,/g, "");
  const num = Number(cleanValue);

  if (!Number.isFinite(num)) return "0.00";

  return num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function cleanNumber(value: string): string {
  return value.replace(/[^\d]/g, "");
}

function getCatalogueName(list: HomeCatalogueItem[], id: string): string {
  return (
    list.find((item) => String(item.data) === String(id))?.value ||
    id ||
    "—"
  );
}

function PremiumRow({
  label,
  value,
  isLess = false,
  textOnly = false,
}: {
  label: string;
  value: number | string;
  isLess?: boolean;
  textOnly?: boolean;
}) {
  return (
    <tr className="border-b bg-[#fff7f3] last:border-b-0">
      <td
        className={`border-r border-white px-4 py-3 ${isLess ? "text-red-600" : "text-black"
          }`}
      >
        {label}
      </td>

      <td
        className={`px-4 py-3 text-right font-medium ${isLess ? "text-red-600" : "text-black"
          }`}
      >
        {textOnly ? value : `NPR ${formatAmount(value)}`}
      </td>
    </tr>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div className="flex justify-between gap-4 border-b py-2 last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium">{value || "—"}</span>
    </div>
  );
}

function CatalogueSelectField({
  label,
  value,
  placeholder,
  options,
  loading,
  disabled,
  error,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  options: HomeCatalogueItem[];
  loading?: boolean;
  disabled?: boolean;
  error?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>

      <Select
        value={value}
        disabled={disabled || loading}
        onValueChange={onChange}
      >
        <SelectTrigger
          className={`mt-2 h-12 bg-white ${error ? "border-red-500 text-red-500" : ""
            }`}
        >
          <SelectValue placeholder={loading ? "Loading..." : placeholder} />
        </SelectTrigger>

        <SelectContent>
          {options.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              No data found
            </div>
          ) : (
            options.map((item) => (
              <SelectItem key={String(item.data)} value={String(item.data)}>
                {item.value}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>

      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function SimpleSelectField({
  label,
  value,
  placeholder,
  options,
  error,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  options: { label: string; value: string }[];
  error?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>

      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          className={`mt-2 h-12 bg-white ${error ? "border-red-500 text-red-500" : ""
            }`}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>

        <SelectContent>
          {options.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

const defaultForm: FireHouseForm = {
  propertyList: "",
  effectiveDate: todayISO(),
  expiryDate: addOneYear(todayISO()),

  province: "",
  district: "",
  localLevel: "",
  tole: "",
  wardNo: "",
  houseNo: "",

  constructionType: "",
  buildingFloor: "",
  buildingUtilization: "",
  buildingSuminsured: "",
  buildingRemarks: "",

  includeRsdCharge: false,
  directDiscount: true,
};

export default function FireHouseInsurancePage() {
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [propertyList, setPropertyList] = useState<HomeCatalogueItem[]>([]);
  const [provinceList, setProvinceList] = useState<HomeCatalogueItem[]>([]);
  const [districtList, setDistrictList] = useState<HomeCatalogueItem[]>([]);
  const [localLevelList, setLocalLevelList] = useState<HomeCatalogueItem[]>([]);

  const [propertyLoading, setPropertyLoading] = useState(false);
  const [provinceLoading, setProvinceLoading] = useState(false);
  const [districtLoading, setDistrictLoading] = useState(false);
  const [localLevelLoading, setLocalLevelLoading] = useState(false);

  const [form, setForm] = useState<FireHouseForm>(() => {
    try {
      return (
        JSON.parse(localStorage.getItem("fire.house.form") || "null") ||
        defaultForm
      );
    } catch {
      return defaultForm;
    }
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [inlineError, setInlineError] = useState("");
  const [premiumLoading, setPremiumLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [premiumResponse, setPremiumResponse] =
    useState<FireHousePremiumResponse | null>(() => {
      try {
        return JSON.parse(
          localStorage.getItem("fire.house.premiumResponse") || "null",
        );
      } catch {
        return null;
      }
    });

  const amount = premiumResponse?.amount_info;

  const filteredDistrictList = useMemo(() => {
    if (!form.province) return [];

    return districtList.filter(
      (item) => String(item.additional_value || "") === String(form.province),
    );
  }, [districtList, form.province]);

  const filteredLocalLevelList = useMemo(() => {
    if (!form.district) return [];

    return localLevelList.filter(
      (item) => String(item.additional_value || "") === String(form.district),
    );
  }, [localLevelList, form.district]);

  const selectedPropertyName = useMemo(() => {
    return getCatalogueName(propertyList, form.propertyList);
  }, [propertyList, form.propertyList]);

  const selectedProvinceName = useMemo(() => {
    return getCatalogueName(provinceList, form.province);
  }, [provinceList, form.province]);

  const selectedDistrictName = useMemo(() => {
    return getCatalogueName(districtList, form.district);
  }, [districtList, form.district]);

  const selectedLocalLevelName = useMemo(() => {
    return getCatalogueName(localLevelList, form.localLevel);
  }, [localLevelList, form.localLevel]);

  const totalSuminsured = useMemo(() => {
    return String(Number(form.buildingSuminsured || 0));
  }, [form.buildingSuminsured]);

  useEffect(() => {
    let cancelled = false;

    setPropertyLoading(true);
    setInlineError("");

    getPropertyListCatalogue()
      .then((list) => {
        if (cancelled) return;
        setPropertyList(list || []);
      })
      .catch((error) => {
        if (cancelled) return;
        setInlineError(error?.message || "Failed to load property list");
      })
      .finally(() => {
        if (cancelled) return;
        setPropertyLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    setProvinceLoading(true);
    setInlineError("");

    getProvinceCatalogue()
      .then((list) => {
        if (cancelled) return;
        setProvinceList(list || []);
      })
      .catch((error) => {
        if (cancelled) return;
        setInlineError(error?.message || "Failed to load province list");
      })
      .finally(() => {
        if (cancelled) return;
        setProvinceLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!form.province) {
      setDistrictList([]);
      return;
    }

    let cancelled = false;

    setDistrictLoading(true);
    setInlineError("");

    getDistrictCatalogue()
      .then((list) => {
        if (cancelled) return;
        setDistrictList(list || []);
      })
      .catch((error) => {
        if (cancelled) return;
        setInlineError(error?.message || "Failed to load district list");
      })
      .finally(() => {
        if (cancelled) return;
        setDistrictLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [form.province]);

  useEffect(() => {
    if (!form.district) {
      setLocalLevelList([]);
      return;
    }

    let cancelled = false;

    setLocalLevelLoading(true);
    setInlineError("");

    getLocalLevelCatalogue()
      .then((list) => {
        if (cancelled) return;
        setLocalLevelList(list || []);
      })
      .catch((error) => {
        if (cancelled) return;
        setInlineError(error?.message || "Failed to load local level list");
      })
      .finally(() => {
        if (cancelled) return;
        setLocalLevelLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [form.district]);

  const update = <K extends keyof FireHouseForm>(
    key: K,
    value: FireHouseForm[K],
  ) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };

      if (key === "effectiveDate") {
        next.expiryDate = addOneYear(String(value));
      }

      if (key === "province") {
        next.district = "";
        next.localLevel = "";
        setDistrictList([]);
        setLocalLevelList([]);
      }

      if (key === "district") {
        next.localLevel = "";
        setLocalLevelList([]);
      }

      return next;
    });

    setErrors((prev) => {
      const next = { ...prev };
      delete next[key as string];

      if (key === "province") {
        delete next.district;
        delete next.localLevel;
      }

      if (key === "district") {
        delete next.localLevel;
      }

      return next;
    });
  };

  const validateStep1 = () => {
    const e: Record<string, string> = {};

    if (!form.propertyList) {
      e.propertyList = "Please select property list";
    }

    if (!form.effectiveDate) {
      e.effectiveDate = "Effective date is required";
    }

    if (!form.expiryDate) {
      e.expiryDate = "Expiry date is required";
    }

    if (!form.buildingSuminsured.trim()) {
      e.buildingSuminsured = "Sum insured is required";
    } else if (Number(form.buildingSuminsured) <= 0) {
      e.buildingSuminsured = "Enter valid sum insured";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep3 = () => {
    const e: Record<string, string> = {};

    if (!form.province) {
      e.province = "Please select province";
    }

    if (!form.district) {
      e.district = "Please select district";
    }

    if (!form.localLevel) {
      e.localLevel = "Please select local level";
    }

    if (!form.constructionType) {
      e.constructionType = "Please select construction type";
    }

    if (!form.buildingFloor.trim()) {
      e.buildingFloor = "Building floor is required";
    }

    if (!form.buildingUtilization) {
      e.buildingUtilization = "Please select building utilization";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const buildPremiumPayload = (): FireHousePremiumRequest => {
    return {
      class_id: "63",
      include_rsd_charge: form.includeRsdCharge,
      total_suminsured: totalSuminsured,
      get_direct_discount: form.directDiscount ? "y" : "n",
      location_info: [
        {
          class_id: "63",
          location_total_suminsured: totalSuminsured,
          construction_type: form.constructionType || "1st Class Construction",

          near_premises_suminsured: "",
          building_suminsured: totalSuminsured,
          plant_machinery_suminsured: "",
          raw_materials_suminsured: "",
          work_in_progress_suminsured: "",
          finished_goods_suminsured: "",
          semi_finished_goods_suminsured: "",
          furniture_suminsured: "",
          cash_gold_suminsured: "",
          maps_frame_suminsured: "",
          others_suminsured: "",
        },
      ],
    };
  };

  const handleCalculatePremium = async () => {
    setInlineError("");

    if (!validateStep1()) return;

    const payload = buildPremiumPayload();

    try {
      setPremiumLoading(true);

      localStorage.setItem("fire.house.form", JSON.stringify(form));
      localStorage.setItem("fire.house.premiumPayload", JSON.stringify(payload));

      const response = await getFireHousePremium(payload);

      localStorage.setItem(
        "fire.house.premiumResponse",
        JSON.stringify(response),
      );

      setPremiumResponse(response);
      setStep(2);

      toast.success("Fire house premium calculated successfully");
    } catch (error: any) {
      setInlineError(error?.message || "Failed to calculate fire house premium");
    } finally {
      setPremiumLoading(false);
    }
  };

  const buildCreatePayload = (): CreateFireHousePolicyPayload => {
    if (!premiumResponse?.policy_session_id) {
      throw new Error("policy_session_id missing. Please calculate premium again.");
    }

    return {
      client_info: {
        Bank_Code: "1",
      },

      policy_info: {
        department_id: "2",
        class_id: "63",
        payment_process: "Full Payment",
        effective_date: form.effectiveDate,
        expiry_date: form.expiryDate,
      },

      policy_session_id: premiumResponse.policy_session_id,

      class_info: {
        class_id: "63",
        total_suminsured: totalSuminsured,
        location_count: "1",
        include_rsd_charge: form.includeRsdCharge,

        location_info: [
          {
            province: selectedProvinceName,
            district: selectedDistrictName,
            local_level: selectedLocalLevelName,
            tole: form.tole,
            ward_no: form.wardNo,
            house_no: form.houseNo,

            construction_type: form.constructionType,
            place_of_nature: "",
            property_nature: selectedPropertyName,
            building_description: selectedPropertyName,
            building_floor: form.buildingFloor,
            house_owner: "",

            near_premises_utilization: "",
            near_premises_suminsured: "",
            near_premises_remarks: "",

            building_utilization: form.buildingUtilization,
            building_suminsured: totalSuminsured,
            building_remarks: form.buildingRemarks,

            plant_machinery_utilization: "",
            plant_machinery_suminsured: "",
            plant_machinery_remarks: "",

            raw_materials_utilization: "",
            raw_materials_suminsured: "",
            raw_materials_remarks: "",

            work_in_progress_utilization: "",
            work_in_progress_suminsured: "",
            work_in_progress_remarks: "",

            finished_goods_utilization: "",
            finished_goods_suminsured: "",
            finished_goods_remarks: "",

            semi_finished_goods_utilization: "",
            semi_finished_goods_suminsured: "",
            semi_finished_goods_remarks: "",

            furniture_utilization: "",
            furniture_suminsured: "",
            furniture_remarks: "",

            cash_gold_utilization: "",
            cash_gold_suminsured: "",
            cash_gold_remarks: "",

            maps_frame_utilization: "",
            maps_frame_suminsured: "",
            maps_frame_remarks: "",

            others_utilization: "",
            others_suminsured: "",
            others_remarks: "",

            location_total_suminsured: totalSuminsured,
          },
        ],
      },
    };
  };

  const handleCreatePolicy = async () => {
    setInlineError("");

    if (!validateStep3()) return;

    if (!premiumResponse?.policy_session_id) {
      setInlineError("Policy session missing. Please calculate premium again.");
      setStep(1);
      return;
    }

    try {
      setSubmitLoading(true);

      localStorage.setItem("fire.house.form", JSON.stringify(form));

      const payload = buildCreatePayload();
      const response = await createFireHousePolicy(payload);

      const policyNo =
        response?.policy_no ||
        response?.policy_number ||
        response?.document_number ||
        "";

      toast.success(
        policyNo
          ? `Fire house policy created successfully. Policy No: ${policyNo}`
          : "Fire house policy created successfully",
      );

      localStorage.removeItem("fire.house.form");
      localStorage.removeItem("fire.house.premiumPayload");
      localStorage.removeItem("fire.house.premiumResponse");

      navigate("/my-draft-policy");
    } catch (error: any) {
      setInlineError(
        error?.data?.error_list?.[0]?.error_message ||
        error?.message ||
        "Failed to create fire house policy",
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  const fieldError = (key: keyof FireHouseForm) =>
    errors[key] ? (
      <p className="mt-1 text-xs text-red-600">{errors[key]}</p>
    ) : null;

  return (
    <div>
      <div className="mb-8 flex items-start gap-3">
        <button
          type="button"
          onClick={() => {
            if (step === 1) navigate("/home-insurances");
            if (step === 2) setStep(1);
            if (step === 3) setStep(2);
          }}
          className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-white hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5 text-black" />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <Home className="h-6 w-6 text-primary" />

            <h1 className="text-2xl font-bold text-black">
              House Insurance
            </h1>
          </div>

          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
            Calculate fire house premium and create fire house policy.
          </p>
        </div>
      </div>

      {inlineError && (
        <div className="mb-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{inlineError}</span>
        </div>
      )}

      {step === 1 && (
        <Card>
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-5 w-5" />
              Premium Calculation
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6 pt-6">
            <div className="grid gap-5 md:grid-cols-2">
              <CatalogueSelectField
                label="Property List *"
                value={form.propertyList}
                placeholder="Please select property list"
                options={propertyList}
                loading={propertyLoading}
                error={errors.propertyList}
                onChange={(value) => update("propertyList", value)}
              />

              <div>
                <Label>Sum Insured *</Label>

                <Input
                  value={form.buildingSuminsured}
                  inputMode="numeric"
                  onChange={(e) =>
                    update("buildingSuminsured", cleanNumber(e.target.value))
                  }
                  className={`mt-2 h-12 ${errors.buildingSuminsured ? "border-red-500" : ""
                    }`}
                  placeholder="Enter sum insured"
                />

                {fieldError("buildingSuminsured")}
              </div>

              <div>
                <Label>Effective Date *</Label>

                <Input
                  type="date"
                  min={todayISO()}
                  value={form.effectiveDate}
                  onChange={(e) => update("effectiveDate", e.target.value)}
                  className={`mt-2 h-12 ${errors.effectiveDate ? "border-red-500" : ""
                    }`}
                />

                {fieldError("effectiveDate")}
              </div>

              <div>
                <Label>Expiry Date *</Label>

                <Input
                  type="date"
                  value={form.expiryDate}
                  disabled
                  className="mt-2 h-12"
                />

                {fieldError("expiryDate")}
              </div>

              <div
                onClick={() => update("directDiscount", !form.directDiscount)}
                className="inline-flex cursor-pointer items-center gap-3 mt-4"
              >
                <Switch
                  checked={form.directDiscount}
                  onCheckedChange={(checked) =>
                    update("directDiscount", checked)
                  }
                  onClick={(event) => event.stopPropagation()}
                />

                <Label className="cursor-pointer text-sm font-medium">
                  Direct Discount
                </Label>
              </div>
            </div>
            <div className="mt-5 bg-[#fff0e8] px-4 py-4 text-lg text-red-500">
              Note: The sum insured property cannot exceed Rs. 2 crore.
            </div>
            <div className="flex justify-between pt-3">
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() => navigate("/home-insurance")}
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>

              <Button
                type="button"
                size="lg"
                disabled={premiumLoading || propertyLoading}
                onClick={handleCalculatePremium}
                className="gap-2 bg-[#f71920] px-8 text-white hover:bg-[#d9151b]"
              >
                {premiumLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Calculating...
                  </>
                ) : (
                  <>
                    Calculate
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <>
          {!premiumResponse || !amount ? (
            <Card>
              <CardContent className="p-6 text-sm text-red-600">
                Premium response not found. Please calculate again.
              </CardContent>
            </Card>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full min-w-[650px] border-collapse text-sm">
                <thead>
                  <tr className="bg-[#e91d25] text-white">
                    <th className="border-r border-white px-4 py-3 text-left font-bold">
                      Particulars
                    </th>

                    <th className="px-4 py-3 text-right font-bold">
                      Amount NPR
                    </th>
                  </tr>
                </thead>

                <tbody>
                  <PremiumRow
                    label="Process Result"
                    value={premiumResponse.process_result ? "Success" : "Failed"}
                    textOnly
                  />

                  <PremiumRow
                    label="Property List"
                    value={selectedPropertyName}
                    textOnly
                  />

                  <PremiumRow
                    label="Effective Date"
                    value={form.effectiveDate}
                    textOnly
                  />

                  <PremiumRow
                    label="Expiry Date"
                    value={form.expiryDate}
                    textOnly
                  />

                  <PremiumRow label="Sum Insured" value={amount.suminsured} />

                  <PremiumRow
                    label="Premium Amount"
                    value={amount.premium_amount}
                  />
                  <PremiumRow label="RS/MD/ST" value={amount.pool_amount} />

                  <PremiumRow
                    label={`Direct Discount (${premiumResponse.direct_discount_percent ?? 0
                      }%)`}
                    value={premiumResponse.direct_discount_amount ?? 0}
                    isLess
                  />

                  <PremiumRow
                    label="Taxable Amount"
                    value={amount.taxable_amount}
                  />

                  <PremiumRow
                    label={`VAT (${amount.vat_percent}%)`}
                    value={amount.vat_amount}
                  />

                  <PremiumRow label="Stamp Duty" value={amount.stamp_duty} />

                  <tr className="bg-[#b71319] text-white">
                    <td className="border-r border-white px-4 py-4 text-base font-bold">
                      Total Premium With VAT
                    </td>

                    <td className="px-4 py-4 text-right text-base font-bold">
                      NPR{" "}
                      {formatAmount(
                        premiumResponse.total_premium_with_vat ||
                        amount.total_amount,
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-8 flex justify-between">
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={() => setStep(1)}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>

            <Button
              type="button"
              className="gap-2 bg-[#f71920] text-white hover:bg-[#d9151b]"
              onClick={() => setStep(3)}
              disabled={!premiumResponse}
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}

      {step === 3 && (
        <Card>
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Complete Policy Details
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6 pt-6">
            <div className="grid gap-5 md:grid-cols-2">
              <CatalogueSelectField
                label="Province / State *"
                value={form.province}
                placeholder="Please select province"
                options={provinceList}
                loading={provinceLoading}
                error={errors.province}
                onChange={(value) => update("province", value)}
              />

              <CatalogueSelectField
                label="District *"
                value={form.district}
                placeholder={
                  form.province
                    ? "Please select district"
                    : "Please select province first"
                }
                options={filteredDistrictList}
                loading={districtLoading}
                disabled={!form.province}
                error={errors.district}
                onChange={(value) => update("district", value)}
              />

              <CatalogueSelectField
                label="Local Level *"
                value={form.localLevel}
                placeholder={
                  form.district
                    ? "Please select local level"
                    : "Please select district first"
                }
                options={filteredLocalLevelList}
                loading={localLevelLoading}
                disabled={!form.district}
                error={errors.localLevel}
                onChange={(value) => update("localLevel", value)}
              />

              <div>
                <Label>Tole</Label>

                <Input
                  value={form.tole}
                  onChange={(e) => update("tole", e.target.value)}
                  className="mt-2 h-12"
                  placeholder="Enter tole"
                />
              </div>

              <div>
                <Label>Ward No</Label>

                <Input
                  value={form.wardNo}
                  inputMode="numeric"
                  onChange={(e) => update("wardNo", cleanNumber(e.target.value))}
                  className="mt-2 h-12"
                  placeholder="Enter ward no"
                />
              </div>

              <div>
                <Label>House No</Label>

                <Input
                  value={form.houseNo}
                  onChange={(e) => update("houseNo", e.target.value)}
                  className="mt-2 h-12"
                  placeholder="Enter house no"
                />
              </div>

              <SimpleSelectField
                label="Construction Type *"
                value={form.constructionType}
                placeholder="Please select construction type"
                options={constructionOptions}
                error={errors.constructionType}
                onChange={(value) => update("constructionType", value)}
              />

              <div>
                <Label>Building Floor *</Label>

                <Input
                  value={form.buildingFloor}
                  inputMode="numeric"
                  onChange={(e) =>
                    update("buildingFloor", cleanNumber(e.target.value))
                  }
                  className={`mt-2 h-12 ${errors.buildingFloor ? "border-red-500" : ""
                    }`}
                  placeholder="Enter building floor"
                />

                {fieldError("buildingFloor")}
              </div>

              <SimpleSelectField
                label="Building Utilization *"
                value={form.buildingUtilization}
                placeholder="Please select building utilization"
                options={buildingUtilizationOptions}
                error={errors.buildingUtilization}
                onChange={(value) => update("buildingUtilization", value)}
              />

              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label className="font-medium">Include RSD Charge</Label>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Sends include_rsd_charge:{" "}
                      {form.includeRsdCharge ? "true" : "false"}
                    </p>
                  </div>

                  <Switch
                    checked={form.includeRsdCharge}
                    onCheckedChange={(checked) =>
                      update("includeRsdCharge", checked)
                    }
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <Label>Building Remarks</Label>

                <Textarea
                  value={form.buildingRemarks}
                  onChange={(e) => update("buildingRemarks", e.target.value)}
                  className="mt-2 min-h-24"
                  placeholder="Enter remarks"
                />
              </div>
            </div>



            <div className="flex justify-between pt-3">
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() => setStep(2)}
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>

              <Button
                type="button"
                size="lg"
                disabled={submitLoading || !premiumResponse}
                onClick={handleCreatePolicy}
                className="gap-2 bg-[#f71920] px-8 text-white hover:bg-[#d9151b]"
              >
                {submitLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Create Policy
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}