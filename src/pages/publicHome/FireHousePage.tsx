import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ArrowLeft,
  ArrowRight,
  Loader2,
  AlertCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import {
  getPropertyListCatalogue,
  type HomeCatalogueItem,
} from "@/api/home/getCatlog";

import {
  getFireHousePremium,
  type FireHousePremiumRequest,
  type FireHousePremiumResponse,
} from "@/api/home/getFireHousePremium";

const MAX_SUM_INSURED = 20000000;
const inputClass =
  "mt-2 bg-white text-black placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary";

export default function FireHousePage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [premiumResponse, setPremiumResponse] =
    useState<FireHousePremiumResponse | null>(null);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {currentStep === 1 && (
            <StepOne
              onSuccess={(response) => {
                setPremiumResponse(response);
                setCurrentStep(2);
              }}
            />
          )}

          {currentStep === 2 && (
            <StepTwo
              premiumResponse={premiumResponse}
              onBack={() => setCurrentStep(1)}
            />
          )}
        </div>
      </main>
    </div>
  );
}

/* ---------------- STEP 1 ---------------- */

function StepOne({
  onSuccess,
}: {
  onSuccess: (response: FireHousePremiumResponse) => void;
}) {
  const navigate = useNavigate();

  const [propertyList, setPropertyList] = useState<HomeCatalogueItem[]>([]);
  const [selectedProperty, setSelectedProperty] = useState("");
  const [sumInsured, setSumInsured] = useState("");

  const constructionType = "1st Class Construction";
  const includeRsdCharge = false;
  const directDiscount = true;

  const [propertyLoading, setPropertyLoading] = useState(false);
  const [calculateLoading, setCalculateLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [inlineError, setInlineError] = useState("");

  useEffect(() => {
    let cancelled = false;

    setPropertyLoading(true);
    setInlineError("");

    getPropertyListCatalogue()
      .then((list) => {
        if (!cancelled) {
          setPropertyList(list || []);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setInlineError(error?.message || "Failed to load property list");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setPropertyLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedPropertyItem = propertyList.find(
    (item) => item.data === selectedProperty,
  );

  const clearError = (name: string) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const formatInputAmount = (value: string) => {
    const cleanValue = value.replace(/[^\d]/g, "");

    if (!cleanValue) return "";

    return Number(cleanValue).toLocaleString("en-IN");
  };

  const getCleanAmount = (value: string) => {
    return value.replace(/[^\d]/g, "");
  };

  const handleSumInsuredChange = (value: string) => {
    const cleanValue = getCleanAmount(value);
    const amount = Number(cleanValue || 0);

    setSumInsured(cleanValue);
    clearError("sumInsured");

    if (amount > MAX_SUM_INSURED) {
      setErrors((prev) => ({
        ...prev,
        sumInsured: "Maximum sum insured allowed is NPR 2,00,00,000.",
      }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const sumInsuredAmount = Number(sumInsured || 0);

    if (!sumInsured.trim()) {
      newErrors.sumInsured = "Please enter sum insured amount.";
    } else if (!/^\d+$/.test(sumInsured) || sumInsuredAmount <= 0) {
      newErrors.sumInsured = "Please enter a valid sum insured amount.";
    } else if (sumInsuredAmount > MAX_SUM_INSURED) {
      newErrors.sumInsured = "Maximum sum insured allowed is NPR 2,00,00,000.";
    }

    return newErrors;
  };

  const handleCalculate = async () => {
    setInlineError("");

    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    const payload: FireHousePremiumRequest = {
      class_id: "63",
      location_count: "1",
      include_rsd_charge: includeRsdCharge,
      total_suminsured: sumInsured,
      get_direct_discount: "y",
      location_info: [
        {
          class_id: "62",
          location_total_suminsured: sumInsured,
          construction_type: constructionType,
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
      ],
    };

    try {
      setCalculateLoading(true);

      localStorage.setItem(
        "homeInsuranceSelectedProperty",
        JSON.stringify({
          data: selectedPropertyItem?.data || selectedProperty,
          value: selectedPropertyItem?.value || "",
          additional_value: selectedPropertyItem?.additional_value || "",
        }),
      );

      localStorage.setItem("homeInsurancePayload", JSON.stringify(payload));

      const response = await getFireHousePremium(payload);

      localStorage.setItem(
        "homeInsurancePremiumResponse",
        JSON.stringify(response),
      );

      onSuccess(response);
    } catch (error: any) {
      setInlineError(error?.message || "Failed to calculate premium");
    } finally {
      setCalculateLoading(false);
    }
  };

  return (
    <div className="rounded-md bg-white px-4 py-5 shadow-sm sm:px-5">
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate("/home-insurance")}
          className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-gray-100"
        >
          <ChevronLeft className="h-5 w-5 text-black" />
        </button>

        <div>
          <h1 className="text-lg font-bold text-black">Home Insurance</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter sum insured and calculate your fire house insurance premium.
          </p>
        </div>
      </div>

      {inlineError && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {inlineError}
        </div>
      )}

      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="sumInsured">Sum Insured *</Label>

            <Input
              id="sumInsured"
              type="text"
              inputMode="numeric"
              value={formatInputAmount(sumInsured)}
              onChange={(event) => handleSumInsuredChange(event.target.value)}
              onKeyDown={(event) => {
                if (["-", "+", ".", "e", "E"].includes(event.key)) {
                  event.preventDefault();
                }
              }}
              className={`${inputClass} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${errors.sumInsured ? "border-red-500" : ""
                }`}
              placeholder="Maximum NPR 2,00,00,000"
            />

            <div className="mt-1 flex items-center justify-between gap-2">
              <p
                className={`text-xs ${errors.sumInsured
                  ? "text-red-600"
                  : "text-muted-foreground"
                  }`}
              >
                {errors.sumInsured ||
                  "You can enter sum insured up to NPR 2,00,00,000."}
              </p>
            </div>
          </div>

          <div className="mt-4 inline-flex cursor-not-allowed items-center gap-3">
            <Switch id="directDiscount" checked={directDiscount} disabled />

            <Label
              htmlFor="directDiscount"
              className="cursor-not-allowed text-sm font-medium text-muted-foreground"
            >
              Direct Discount
            </Label>
          </div>
        </div>

        <div className="flex justify-between pt-2">
          <Button
            onClick={() => navigate("/home-insurance")}
            variant="outline"
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <Button
            onClick={handleCalculate}
            disabled={calculateLoading || propertyLoading}
            className="gap-2 bg-[#f71920] text-white hover:bg-[#d9151b]"
          >
            {calculateLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                CALCULATING...
              </>
            ) : (
              <>
                CALCULATE
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- STEP 2 ---------------- */

function StepTwo({
  onBack,
  premiumResponse,
}: {
  onBack: () => void;
  premiumResponse: FireHousePremiumResponse | null;
}) {
  const navigate = useNavigate();
  const amount = premiumResponse?.amount_info;

  return (
    <div className="rounded-md bg-white px-4 py-5 shadow-sm sm:px-5">
      <div className="mb-5 flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-gray-100"
        >
          <ChevronLeft className="h-5 w-5 text-black" />
        </button>

        <div>
          <h1 className="text-lg font-bold text-black">
            Premium Calculation Details
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review your home insurance premium calculation details before
            continuing.
          </p>
        </div>
      </div>

      {!premiumResponse || !amount ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Premium response not found. Please calculate again.
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-[#e91d25] text-white">
                <th className="border-r border-white px-4 py-3 text-left font-bold">
                  Particulars
                </th>

                <th className="px-4 py-3 text-right font-bold">Amount NPR </th>
              </tr>
            </thead>

            <tbody>
              <PremiumLineRow label="Sum Insured" value={amount.suminsured} />

              <PremiumLineRow
                label="Basic Premium"
                value={amount.premium_amount}
              />

              <PremiumLineRow
                label="RS/MD/ST"
                value={amount.pool_amount}
              />

              <PremiumLineRow
                label="Direct Discount"
                value={premiumResponse.direct_discount_amount || "0"}
                isLess
              />

              {/* <PremiumLineRow
                label="Taxable Amount"
                value={amount.taxable_amount}
                isSubTotal
              /> */}

              <PremiumLineRow
                label={`VAT (${amount.vat_percent || "13"}%)`}
                value={amount.vat_amount}
              />

              <PremiumLineRow label="Stamp Duty" value={amount.stamp_duty} />

              <tr className="bg-[#b71319] text-white">
                <td className="border-r border-white px-4 py-4 text-base font-bold">
                  Total Premium Amount
                </td>

                <td className="px-4 py-4 text-right text-base font-bold">
                  {formatAmount(premiumResponse.total_premium_with_vat)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-8 flex items-center justify-between">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <Button
          className="gap-2 bg-[#f71920] text-white hover:bg-[#d9151b]"
          onClick={() => navigate("/login")}
        >
          Buy Policy
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

/* ---------------- SMALL COMPONENTS ---------------- */

function PremiumLineRow({
  label,
  value,
  isLess = false,
  isSubTotal = false,
}: {
  label: string;
  value: number | string | null | undefined;
  isLess?: boolean;
  isSubTotal?: boolean;
}) {
  return (
    <tr className={`border-b ${isSubTotal ? "bg-muted/30" : "bg-[#fff7f3]"}`}>
      <td
        className={`border-r border-white px-4 py-3 ${isLess
          ? "font-medium text-red-600"
          : isSubTotal
            ? "font-semibold text-black"
            : "text-black"
          }`}
      >
        {isLess ? `Less : ${label}` : label}
      </td>

      <td
        className={`px-4 py-3 text-right ${isLess
          ? "font-medium text-red-600"
          : isSubTotal
            ? "font-semibold text-black"
            : "font-medium text-black"
          }`}
      >
        {isLess ? `(${formatAmount(value)})` : formatAmount(value)}
      </td>
    </tr>
  );
}

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