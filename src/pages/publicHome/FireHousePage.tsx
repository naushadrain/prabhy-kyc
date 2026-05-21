import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  LogIn,
  ChevronLeft,
  ArrowLeft,
  ArrowRight,
  Loader2,
  AlertCircle,
} from "lucide-react";

import logo from "@/assets/logo.png";
import { useLanguage } from "@/contexts/LanguageContext";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  getPropertyListCatalogue,
  type HomeCatalogueItem,
} from "@/api/home/getCatlog";

import {
  getFireHousePremium,
  type FireHousePremiumRequest,
  type FireHousePremiumResponse,
} from "@/api/home/getFireHousePremium";

export default function FireHousePage() {
  const { t } = useLanguage();

  const [currentStep, setCurrentStep] = useState(1);
  const [premiumResponse, setPremiumResponse] =
    useState<FireHousePremiumResponse | null>(null);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      

      <main className="flex-1 bg-[#fbf4f2]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
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
  const [propertyList, setPropertyList] = useState<HomeCatalogueItem[]>([]);

  const [selectedProperty, setSelectedProperty] = useState("");
  const [sumInsured, setSumInsured] = useState("");

  const [constructionType] = useState("1st Class Construction");
  const [includeRsdCharge] = useState(false);

  const [propertyLoading, setPropertyLoading] = useState(false);
  const [calculateLoading, setCalculateLoading] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [inlineError, setInlineError] = useState("");

  const MAX_SUM_INSURED = 20000000; // 2 crore
  
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
    (item) => item.data === selectedProperty
  );

  const clearError = (name: string) => {
    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const handleSumInsuredChange = (value: string) => {
    const cleanValue = value.replace(/[^\d]/g, "");

    setSumInsured(cleanValue);
    clearError("sumInsured");
  };

  const validate = () => {
  const newErrors: Record<string, string> = {};

  const sumInsuredAmount = Number(sumInsured || 0);

  if (!selectedProperty) {
    newErrors.selectedProperty = "Property list is required";
  }

  if (!sumInsured.trim()) {
    newErrors.sumInsured = "Sum insured is required";
  } else if (!/^\d+$/.test(sumInsured) || sumInsuredAmount <= 0) {
    newErrors.sumInsured = "Enter valid sum insured";
  } else if (sumInsuredAmount > MAX_SUM_INSURED) {
    newErrors.sumInsured =
      "sum insured must not be greater than 2 crore";
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
  get_direct_discount:"y",
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
        })
      );

      localStorage.setItem("homeInsurancePayload", JSON.stringify(payload));

      const response = await getFireHousePremium(payload);

      localStorage.setItem(
        "homeInsurancePremiumResponse",
        JSON.stringify(response)
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
          className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-gray-100"
        >
          <ChevronLeft className="h-5 w-5 text-black" />
        </button>

        <div>
          <h1 className="text-lg font-bold text-black">Home Insurance</h1>
          
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
            <Label htmlFor="propertyList">Property Lists *</Label>

            <Select
              value={selectedProperty}
              disabled={propertyLoading}
              onValueChange={(value) => {
                setSelectedProperty(value);
                clearError("selectedProperty");
              }}
            >
              <SelectTrigger
                id="propertyList"
                className={`mt-2 ${errors.selectedProperty ? "border-red-500" : ""
                  }`}
              >
                <SelectValue
                  placeholder={
                    propertyLoading ? "Loading property list..." : "Select Property"
                  }
                />
              </SelectTrigger>

              <SelectContent>
                {propertyList.map((item) => (
                  <SelectItem key={item.data} value={item.data}>
                    {item.value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {errors.selectedProperty && (
              <p className="mt-1 text-xs text-red-600">
                {errors.selectedProperty}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="sumInsured">Sum Insured *</Label>

            <Input
              id="sumInsured"
              type="text"
              inputMode="numeric"
              value={sumInsured}
              onChange={(e) => handleSumInsuredChange(e.target.value)}
              className={`mt-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${errors.sumInsured ? "border-red-500" : ""
                }`}
              placeholder="Enter sum insured, e.g. 1000000"
            />

            {errors.sumInsured && (
              <p className="mt-1 text-xs text-red-600">
                {errors.sumInsured}
              </p>
            )}
          </div>
        </div>
        <div className="flex justify-between pt-2">
          <Button variant="outline">Back</Button>

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
  const amount = premiumResponse?.amount_info;

  return (
    <div className="rounded-md bg-white px-4 py-5 shadow-sm sm:px-5">
      <div className="mb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-gray-100"
        >
          <ChevronLeft className="h-5 w-5 text-black" />
        </button>

        <h1 className="text-lg font-bold text-black">
          Premium Calculation Details
        </h1>
      </div>

      {!premiumResponse || !amount ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Premium response not found. Please calculate again.
        </div>
      ) : (
        <>
          <div>
            <h2 className="mb-2 text-sm font-semibold text-black">
              Risk Details
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-[#f71920] text-white">
                    <th className="border-r border-white/70 px-3 py-2 text-left text-xs font-bold">
                      Risk Description
                    </th>
                    <th className="border-r border-white/70 px-3 py-2 text-left text-xs font-bold">
                      Risk Rate
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-bold">
                      Risk Amount
                    </th>
                  </tr>
                </thead>

                <tbody>
                  <RiskRow
                    title="Basic Premium"
                    rate="-"
                    amount={amount.premium_amount}
                  />

                  <RiskRow
                    title="PA Amount"
                    rate="-"
                    amount={amount.pa_amount}
                  />

                  <RiskRow
                    title="TPL Amount"
                    rate="-"
                    amount={amount.tpl_amount}
                  />

                  <RiskRow
                    title="Pool / RSD Amount"
                    rate="-"
                    amount={amount.pool_amount}
                  />

                  <RiskRow
                    title="Direct Discount"
                    rate={`${premiumResponse.direct_discount_percent || "0"}%`}
                    amount={premiumResponse.direct_discount_amount || "0"}
                  />
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-3">
            <h2 className="mb-2 text-sm font-semibold text-black">
              Premium Details
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-[#f71920] text-white">
                    <th className="border-r border-white/70 px-3 py-2 text-left text-xs font-bold">
                      Sum Insured
                    </th>
                    <th className="border-r border-white/70 px-3 py-2 text-left text-xs font-bold">
                      Basic Premium
                    </th>
                    <th className="border-r border-white/70 px-3 py-2 text-left text-xs font-bold">
                      Pool Amount
                    </th>
                    <th className="border-r border-white/70 px-3 py-2 text-left text-xs font-bold">
                      Taxable Amount
                    </th>
                    <th className="border-r border-white/70 px-3 py-2 text-left text-xs font-bold">
                      VAT Amount
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-bold">
                      Sub Total Amount
                    </th>
                  </tr>
                </thead>

                <tbody>
                  <tr className="bg-[#fff7f3]">
                    <PremiumCell value={amount.suminsured} />
                    <PremiumCell value={amount.premium_amount} />
                    <PremiumCell value={amount.pool_amount} />
                    <PremiumCell value={amount.taxable_amount} />
                    <PremiumCell value={amount.vat_amount} />
                    <PremiumCell value={amount.total_amount} />
                  </tr>
                </tbody>
              </table>

              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-[#f71920] text-white">
                    <th className="w-[41%] border-r border-white/70 px-3 py-2 text-left text-xs font-bold">
                      Stamp Amount
                    </th>

                    <th className="px-3 py-2 text-left text-xs font-bold">
                      Total Premium Amount
                    </th>
                  </tr>
                </thead>

                <tbody>
                  <tr className="bg-[#fff7f3]">
                    <PremiumCell value={amount.stamp_duty} />

                    <PremiumCell
                      value={premiumResponse.total_premium_with_vat}
                    />
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <div className="mt-5 flex items-center justify-between">
        <Button
          variant="outline"
          onClick={onBack}
          className="gap-2 border-blue-500 text-blue-500 hover:bg-blue-50 hover:text-blue-600"
        >
          <ArrowLeft className="h-4 w-4" />
          BACK
        </Button>

        <Button className="gap-2 bg-[#f71920] text-white hover:bg-[#d9151b]">
          NEXT
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

/* ---------------- SMALL COMPONENTS ---------------- */

function RiskRow({
  title,
  rate,
  amount,
}: {
  title: string;
  rate: string;
  amount: number | string;
}) {
  return (
    <tr className="bg-[#fff7f3]">
      <td className="border-r border-white px-3 py-2 text-center">{title}</td>
      <td className="border-r border-white px-3 py-2 text-center">{rate}</td>
      <td className="px-3 py-2 text-center">{formatAmount(amount)}</td>
    </tr>
  );
}

function PremiumCell({ value }: { value: number | string }) {
  return (
    <td className="border-r border-white px-3 py-2 text-center">
      {formatAmount(value)}
    </td>
  );
}

function formatAmount(value: number | string | null | undefined) {
  const num = Number(value ?? 0);

  if (!Number.isFinite(num)) {
    return "0.00";
  }

  return num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}