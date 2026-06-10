// src/pages/home/FirePropertyPage.tsx

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  getPropertyDescriptionCatalogue,
  getFireRiskTypeCatalogue,
  type HomeCatalogueItem,
} from "@/api/home/getCatlog";

import {
  getFirePropertyPremium,
  type FirePropertyLocationInfo,
  type FirePropertyPremiumRequest,
  type FirePropertyPremiumResponse,
} from "@/api/home/getFireHousePremium";

const inputClass =
  "mt-2 h-14 bg-white text-base text-black placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary";

function formatAmount(value: number | string | null | undefined) {
  const cleanValue = String(value ?? "0").replace(/,/g, "");
  const num = Number(cleanValue);

  if (!Number.isFinite(num)) {
    return "0.00";
  }

  return num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatInputAmount(value: string) {
  const cleanValue = value.replace(/[^\d]/g, "");

  if (!cleanValue) return "";

  return Number(cleanValue).toLocaleString("en-IN");
}

export default function FirePropertyPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2>(1);

  const [riskTypes, setRiskTypes] = useState<HomeCatalogueItem[]>([]);
  const [propertyDescriptions, setPropertyDescriptions] = useState<
    HomeCatalogueItem[]
  >([]);

  const [selectedDescription, setSelectedDescription] = useState("");
  const [fireRiskType, setFireRiskType] = useState("");
  const [sumInsured, setSumInsured] = useState("");

  const directDiscount = "yes";

  const [riskLoading, setRiskLoading] = useState(false);
  const [descriptionLoading, setDescriptionLoading] = useState(false);
  const [calculateLoading, setCalculateLoading] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [inlineError, setInlineError] = useState("");

  const [premiumResponse, setPremiumResponse] =
    useState<FirePropertyPremiumResponse | null>(null);

  const selectedDescriptionName = useMemo(() => {
    return (
      propertyDescriptions.find((item) => item.data === selectedDescription)
        ?.value || ""
    );
  }, [propertyDescriptions, selectedDescription]);

  const selectedRiskName = useMemo(() => {
    return riskTypes.find((item) => item.data === fireRiskType)?.value || "";
  }, [riskTypes, fireRiskType]);

  const clearError = (key: string) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  useEffect(() => {
    let cancelled = false;

    const loadRiskTypes = async () => {
      try {
        setInlineError("");
        setRiskLoading(true);

        const riskRes = await getFireRiskTypeCatalogue();

        if (cancelled) return;

        setRiskTypes(riskRes || []);
      } catch (error: any) {
        if (cancelled) return;

        setInlineError(error?.message || "Failed to load nature of risk");
      } finally {
        if (cancelled) return;

        setRiskLoading(false);
      }
    };

    loadRiskTypes();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!fireRiskType) {
      setPropertyDescriptions([]);
      setSelectedDescription("");
      return;
    }

    let cancelled = false;

    const loadPropertyDescription = async () => {
      try {
        setDescriptionLoading(true);
        setInlineError("");
        setSelectedDescription("");
        setPropertyDescriptions([]);
        clearError("selectedDescription");

        const descriptionRes =
          await getPropertyDescriptionCatalogue(fireRiskType);

        if (cancelled) return;

        setPropertyDescriptions(descriptionRes || []);
      } catch (error: any) {
        if (cancelled) return;

        setInlineError(
          error?.message || "Failed to load description of property",
        );
      } finally {
        if (cancelled) return;

        setDescriptionLoading(false);
      }
    };

    loadPropertyDescription();

    return () => {
      cancelled = true;
    };
  }, [fireRiskType]);

  const validateCalculate = () => {
    const newErrors: Record<string, string> = {};

    if (!fireRiskType) {
      newErrors.fireRiskType = "Nature of risk is required";
    }

    if (!selectedDescription) {
      newErrors.selectedDescription = "Property description is required";
    }

    if (!sumInsured.trim()) {
      newErrors.sumInsured = "Sum insured is required";
    } else if (!/^\d+$/.test(sumInsured) || Number(sumInsured) <= 0) {
      newErrors.sumInsured = "Enter valid sum insured amount";
    }

    return newErrors;
  };

  const buildPayload = (): FirePropertyPremiumRequest => {
    const locationInfo: FirePropertyLocationInfo[] = [
      {
        class_id: "62",
        fire_risk_type: fireRiskType,
        fire_property_description: selectedDescription,
        location_total_suminsured: sumInsured,
        construction_type: "1st Class Construction",

        near_premises_suminsured: "",
        building_suminsured: sumInsured,
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
    ];

    return {
      class_id: "62",
      include_rsd_charge: false,
      location_count: "1",
      total_suminsured: sumInsured,
      get_direct_discount: "y",
      location_info: locationInfo,
    };
  };

  const handleCalculate = async () => {
    setInlineError("");

    const validationErrors = validateCalculate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    const payload = buildPayload();

    try {
      setCalculateLoading(true);

      localStorage.setItem("firePropertyPayload", JSON.stringify(payload));

      localStorage.setItem(
        "firePropertyForm",
        JSON.stringify({
          selectedDescription,
          selectedDescriptionName,
          fireRiskType,
          selectedRiskName,
          sumInsured,
          directDiscount,
        }),
      );

      const response = await getFirePropertyPremium(payload);

      if (response?.process_result === false) {
        const msg =
          response?.error_list?.[0]?.error_message ||
          "Failed to calculate premium";

        setInlineError(msg);
        return;
      }

      localStorage.setItem(
        "firePropertyPremiumResponse",
        JSON.stringify(response),
      );

      setPremiumResponse(response);
      setStep(2);
    } catch (error: any) {
      const msg =
        error?.data?.error_list?.[0]?.error_message ||
        error?.response?.data?.error_list?.[0]?.error_message ||
        error?.message ||
        "Failed to calculate premium";

      setInlineError(msg);
    } finally {
      setCalculateLoading(false);
    }
  };

  if (step === 2) {
    const amount = premiumResponse?.amount_info;

    return (
      <div className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl rounded-md bg-white px-4 py-5 shadow-sm sm:px-5">
          <div className="mb-6 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100"
            >
              <ChevronLeft className="h-5 w-5 text-black" />
            </button>

            <div>
              <h1 className="text-xl font-bold text-black">
                Property Insurance Premium Details
              </h1>

              <p className="mt-1 text-sm text-muted-foreground">
                Review the premium amount, discount, VAT, stamp duty, and final
                payable amount.
              </p>
            </div>
          </div>

          {!premiumResponse || !amount ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Premium response not found. Please calculate again.
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-md border">
                <table className="w-full border-collapse text-sm">
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
                    <PremiumRow label="Sum Insured" value={amount.suminsured} />

                    <PremiumRow
                      label="Basic Premium Amount"
                      value={amount.premium_amount}
                    />

                    <PremiumRow label="RS/MD/ST" value={amount.pool_amount} />

                    <PremiumRow
                      label="Direct Discount"
                      value={premiumResponse.direct_discount_amount ?? 0}
                      isLess
                    />

                    <PremiumRow
                      label="Taxable Amount"
                      value={amount.taxable_amount}
                    />

                    <PremiumRow
                      label={`VAT (${amount.vat_percent ?? 13}%)`}
                      value={amount.vat_amount}
                    />

                    <PremiumRow label="Stamp Duty" value={amount.stamp_duty} />

                    <tr className="bg-[#b71319] text-white">
                      <td className="border-r border-white px-4 py-4 text-base font-bold">
                        Total Amount
                      </td>

                      <td className="px-4 py-4 text-right text-base font-bold">
                        {formatAmount(
                          premiumResponse.total_premium_with_vat ??
                            amount.total_amount,
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

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
                  onClick={() => navigate("/login")}
                >
                  Buy Policy
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl rounded-md bg-white px-4 py-5 shadow-sm sm:px-5">
        <div className="mb-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/home-insurance")}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100"
          >
            <ChevronLeft className="h-5 w-5 text-black" />
          </button>

          <div>
            <h1 className="text-xl font-bold text-black">
              Property Insurance
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Add property details and calculate premium.
            </p>
          </div>
        </div>

        {inlineError && (
          <div className="mb-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {inlineError}
          </div>
        )}

        <div className="rounded-3xl p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <CatalogueSelectField
              label="Nature of Risk *"
              id="fireRiskType"
              value={fireRiskType}
              placeholder={
                riskLoading
                  ? "Loading nature of risk..."
                  : "Select nature of risk"
              }
              options={riskTypes}
              error={errors.fireRiskType}
              disabled={riskLoading}
              onChange={(value) => {
                setFireRiskType(value);
                clearError("fireRiskType");
              }}
            />

            <CatalogueSelectField
              label="Description of Property *"
              id="selectedDescription"
              value={selectedDescription}
              placeholder={
                descriptionLoading
                  ? "Loading description..."
                  : fireRiskType
                    ? "Select description of property"
                    : "Select nature of risk first"
              }
              options={propertyDescriptions}
              error={errors.selectedDescription}
              disabled={!fireRiskType || descriptionLoading}
              onChange={(value) => {
                setSelectedDescription(value);
                clearError("selectedDescription");
              }}
            />

            <div>
              <Label htmlFor="sumInsured">Sum Insured *</Label>

              <Input
                id="sumInsured"
                type="text"
                inputMode="numeric"
                value={formatInputAmount(sumInsured)}
                onChange={(event) => {
                  const cleanValue = event.target.value.replace(/[^\d]/g, "");
                  setSumInsured(cleanValue);
                  clearError("sumInsured");
                }}
                onKeyDown={(event) => {
                  if (["-", "+", ".", "e", "E"].includes(event.key)) {
                    event.preventDefault();
                  }
                }}
                className={`${inputClass} ${
                  errors.sumInsured ? "border-red-500" : ""
                }`}
                placeholder="Please Enter Sum Insurance"
              />

              {errors.sumInsured && (
                <p className="mt-2 text-sm text-red-600">
                  {errors.sumInsured}
                </p>
              )}
            </div>

            <div className="flex items-end">
              <div className="mb-4 inline-flex cursor-not-allowed items-center gap-3">
                <Switch id="directDiscount" checked={true} disabled />

                <Label
                  htmlFor="directDiscount"
                  className="cursor-not-allowed text-sm font-medium text-muted-foreground"
                >
                  Direct Discount
                </Label>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 flex justify-between">
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
            onClick={handleCalculate}
            disabled={calculateLoading || riskLoading || descriptionLoading}
            className="gap-2 bg-[#f71920] px-8 py-6 text-base text-white hover:bg-[#d9151b]"
          >
            {calculateLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                CALCULATING...
              </>
            ) : (
              <>
                Calculate
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function CatalogueSelectField({
  label,
  id,
  value,
  placeholder,
  options,
  error,
  disabled,
  onChange,
}: {
  label: string;
  id: string;
  value: string;
  placeholder: string;
  options: HomeCatalogueItem[];
  error?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>

      <Select value={value} disabled={disabled} onValueChange={onChange}>
        <SelectTrigger
          id={id}
          className={`${inputClass} ${error ? "border-red-500" : ""}`}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>

        <SelectContent>
          {options.map((item) => (
            <SelectItem key={item.data} value={item.data}>
              {item.value}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}

function PremiumRow({
  label,
  value,
  isLess = false,
  textOnly = false,
}: {
  label: string;
  value: number | string | null | undefined;
  isLess?: boolean;
  textOnly?: boolean;
}) {
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