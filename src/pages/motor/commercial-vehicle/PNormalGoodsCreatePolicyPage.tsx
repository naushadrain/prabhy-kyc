import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Car,
  CheckCircle,
  ChevronLeft,
  FileText,
  Loader2,
  Upload,
  X,
} from "lucide-react";

import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import MotorStepper from "@/components/common/MotorStepper";
import { getMotorSteps } from "@/utils/motorSteps";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import {
  getMotorPremiumCV,
  type GetPremiumRequestCV,
} from "@/api/motor/getpremium";

import {
  createMotorPolicy,
  type CreateMotorPolicyPayload,
} from "@/api/motor/createMotorPolicy";

import {
  uploadVehicleFront,
  uploadVehicleBack,
} from "@/api/policy/uploadPolicyDoc";

import {
  getVehicleAgeBands,
  getZoneAbbreviations,
  getZoneLotNumbers,
  getVehicleKinds,
  getEmbossedStates,
  getEmbossedLotNumbers,
  getEmbossedVehicleKinds,
  type CatalogueItem,
} from "@/api/motor/getMotorCatalogue";

import { type GetPremiumResponse, type PremiumAmountInfo } from "@/types/getpremium";
import { toast } from "@/components/ui/sonner";
import { adIsoToBsYMD } from "@/zod/kycSchema";

type RowType = "normal" | "section" | "less" | "subtotal" | "total";

type PremiumRowType = {
  key: string;
  label: string;
  value?: number | string | null;
  type?: RowType;
};

type FileState = { file: File; preview: string } | null;

const yesNoOptions = [
  { label: "Yes", value: "yes" },
  { label: "No", value: "no" },
];

const voluntaryExcessOptions = [
  { label: "1,000", value: "1000" },
  { label: "2,000", value: "2000" },
  { label: "5,000", value: "5000" },
  { label: "10,000", value: "10000" },
];

const noClaimYearOptions = [
  { label: "0 Year", value: "0" },
  { label: "1 Year", value: "1" },
  { label: "2 Years", value: "2" },
  { label: "3 Years", value: "3" },
  { label: "4 Years", value: "4" },
  { label: "5 Years", value: "5" },
];

const MANUFACTURERS = [
  "Ashok Leyland",
  "Eicher",
  "Force",
  "Hino",
  "Isuzu",
  "Mahindra",
  "Swaraj Mazda",
  "Tata",
];

const MOTOR_CODES: Record<string, string> = {
  "Ashok Leyland": "ash",
  Eicher: "eic",
  Force: "frc",
  Hino: "hno",
  Isuzu: "isz",
  Mahindra: "mhd",
  "Swaraj Mazda": "smz",
  Tata: "tat",
};

const fmt = (value: number | string | null | undefined) => {
  const cleanValue = String(value ?? "0").replace(/,/g, "");
  const num = Number(cleanValue);

  if (!Number.isFinite(num)) return "0.00";

  return num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const toNumber = (value: number | string | null | undefined) => {
  const cleanValue = String(value ?? "0").replace(/,/g, "");
  const num = Number(cleanValue);
  return Number.isFinite(num) ? num : 0;
};

const todayISO = () => {
  const d = new Date();

  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(d.getDate()).padStart(2, "0")}`;
};

const addOneYear = (dateISO: string) => {
  const d = new Date(dateISO || todayISO());

  d.setFullYear(d.getFullYear() + 1);
  d.setDate(d.getDate() - 1);

  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(d.getDate()).padStart(2, "0")}`;
};

const getValue = (
  obj: Record<string, unknown> | null | undefined,
  keys: string[],
  fallback: number | string = 0,
): number | string => {
  if (!obj) return fallback;

  for (const key of keys) {
    const value = obj[key];

    if (value !== undefined && value !== null && value !== "") {
      if (typeof value === "string" || typeof value === "number") {
        return value;
      }
    }
  }

  return fallback;
};

const normalizeIntAmount = (value: string | number | null | undefined) => {
  const cleanValue = String(value ?? "0").replace(/,/g, "");
  const numberValue = Number(cleanValue);

  if (!Number.isFinite(numberValue)) return "0";

  return String(Math.trunc(numberValue));
};

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex justify-between gap-4 border-b py-2 last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium">{value ?? "—"}</span>
    </div>
  );
}

function DetailCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border bg-muted/30 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}

export default function PNormalGoodsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const currentStep = Number(searchParams.get("step")) || 3;

  const goToStep = (step: number) => {
    setSearchParams({ step: String(step) });
  };

  const [goodCarryingCapacity, setGoodCarryingCapacity] = useState("");
  const [noOfSeats, setNoOfSeats] = useState("5");
  const [helper, setHelper] = useState("yes");

  const [sumInsured, setSumInsured] = useState("");
  const [yearOfManufacture, setYearOfManufacture] = useState("");
  const [compulsoryExcess, setCompulsoryExcess] = useState("500");
  const [compulsoryLoading, setCompulsoryLoading] = useState(false);

  const [voluntaryExcess, setVoluntaryExcess] = useState("");
  const [noClaimYear, setNoClaimYear] = useState("0");
  const [towingCharge, setTowingCharge] = useState("no");
  const [directDiscount, setDirectDiscount] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [premiumData, setPremiumData] = useState<GetPremiumResponse | null>(() => {
    try {
      return JSON.parse(localStorage.getItem("motor.premiumResponse") || "null");
    } catch {
      return null;
    }
  });

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years: string[] = [];

    for (let year = currentYear; year >= 1985; year--) {
      years.push(String(year));
    }

    return years;
  }, []);

  const clearError = (name: string) => {
    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const handleNumberInput = (
    value: string,
    setter: Dispatch<SetStateAction<string>>,
    errorKey: string,
  ) => {
    if (value === "" || /^\d+$/.test(value)) {
      setter(value);
      clearError(errorKey);
    }
  };

  useEffect(() => {
    if (!yearOfManufacture) {
      setCompulsoryExcess("500");
      return;
    }

    const currentYear = new Date().getFullYear();
    const vehicleAge = currentYear - Number(yearOfManufacture);

    if (!Number.isFinite(vehicleAge) || vehicleAge < 0) {
      setCompulsoryExcess("500");
      return;
    }

    let cancelled = false;

    setCompulsoryLoading(true);

    getVehicleAgeBands("02", String(vehicleAge))
      .then((list) => {
        if (cancelled) return;

        const first = list?.[0];

        const amount =
          first?.additional_value || first?.data || first?.value || "500";

        setCompulsoryExcess(normalizeIntAmount(amount));
        clearError("compulsoryExcess");
      })
      .catch((error) => {
        if (cancelled) return;

        setCompulsoryExcess("500");
        toast.error(error?.message || "Failed to load compulsory excess");
      })
      .finally(() => {
        if (!cancelled) setCompulsoryLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [yearOfManufacture]);

  const validatePremium = () => {
    const newErrors: Record<string, string> = {};

    if (!goodCarryingCapacity.trim()) {
      newErrors.goodCarryingCapacity = "Good carrying capacity is required";
    } else if (
      !/^\d+$/.test(goodCarryingCapacity) ||
      Number(goodCarryingCapacity) <= 0
    ) {
      newErrors.goodCarryingCapacity = "Enter valid good carrying capacity";
    }

    if (!noOfSeats.trim()) {
      newErrors.noOfSeats = "No of seats including driver is required";
    } else if (!/^\d+$/.test(noOfSeats) || Number(noOfSeats) <= 0) {
      newErrors.noOfSeats = "Enter valid no of seats";
    }

    if (!helper) newErrors.helper = "Helper is required";

    if (!sumInsured.trim()) {
      newErrors.sumInsured = "Sum insured is required";
    } else if (!/^\d+$/.test(sumInsured) || Number(sumInsured) <= 0) {
      newErrors.sumInsured = "Enter valid sum insured";
    }

    if (!yearOfManufacture) {
      newErrors.yearOfManufacture = "Year of manufacture is required";
    }

    if (!compulsoryExcess.trim()) {
      newErrors.compulsoryExcess = "Compulsory excess is required";
    }

    if (!voluntaryExcess) {
      newErrors.voluntaryExcess = "Voluntary excess is required";
    }

    if (!noClaimYear) {
      newErrors.noClaimYear = "No claim discount is required";
    }

    return newErrors;
  };

  const handleCalculate = async () => {
    setInlineError(null);

    const validationErrors = validatePremium();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      toast.error("Please fill all required fields");
      return;
    }

    const currentYear = new Date().getFullYear();
    const vehicleAge = currentYear - Number(yearOfManufacture);
    const helperSeatCapacity = "1";

    const passengerSeatCapacity = Math.max(
      0,
      Number(noOfSeats) - 1 - Number(helperSeatCapacity),
    );

    const payload: GetPremiumRequestCV = {
      class_id: "3",
      cover_type_id: "Comprehensive",
      is_government: "1",
      good_carrying_capacity: goodCarryingCapacity,
      engine_capcity_cc: "12",
      driver_seat_capacity: "1",
      passenger_seat_capacity: String(passengerSeatCapacity),
      conductor_helper_seat_capacity: helperSeatCapacity,
      compulsory_excess: compulsoryExcess,
      voluntary_excess: voluntaryExcess,
      vehicle_age_in_years: String(vehicleAge),
      vehicle_suminsured_amount: sumInsured,
      calc_type: "p",
      noclaim_year: noClaimYear,
      is_tailor: "false",
      get_direct_discount: directDiscount ? "y" : "n",
      vehicle_reg: "e",
      include_towing_charge: towingCharge === "yes" ? "true" : "false",
    } as GetPremiumRequestCV;

    try {
      setLoading(true);

      localStorage.setItem("motor.vehicleType", "commercial");
      localStorage.setItem("motor.insurancePlan", "comprehensive");
      localStorage.setItem("motor.selectedCommercialCategoryId", "3");

      localStorage.setItem(
        "motor.selectedCommercialCategory",
        JSON.stringify({
          data: "3",
          value: "Commercial Vehicle Normal Good Carrying Policy",
          additional_value: "CV",
          title: "Normal Goods Carrying Policy",
          route: "/commercial-vehicle/comprehensive/normal-goods",
        }),
      );

      localStorage.setItem(
        "motor.comprehensiveNormalGoodsForm",
        JSON.stringify({
          categoryId: "3",
          categoryName: "Commercial Vehicle Normal Good Carrying Policy",
          goodCarryingCapacity,
          noOfSeatsIncludingDriver: noOfSeats,
          driverSeatCapacity: "1",
          passengerSeatCapacity: String(passengerSeatCapacity),
          helper,
          helperSeatCapacity,
          sumInsured,
          yearOfManufacture,
          vehicleAge,
          compulsoryExcess,
          voluntaryExcess,
          noClaimYear,
          towingCharge,
          directDiscount,
          payload,
        }),
      );

      const response = await getMotorPremiumCV(payload);

      if (response?.process_result === false) {
        const msg =
          response?.error_list?.[0]?.error_message ||
          "Failed to calculate premium";

        setInlineError(msg);
        toast.error(msg);
        return;
      }

      setPremiumData(response);

      localStorage.setItem("motor.premiumResponse", JSON.stringify(response));

      toast.success("Premium calculated successfully");
      goToStep(4);
    } catch (error: any) {
      const msg = error?.message || "Failed to calculate premium";

      setInlineError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const amount: PremiumAmountInfo | undefined = premiumData?.amount_info;

  const ownDamagePremium = getValue(amount as any, [
    "premium_amount",
    "own_damage_premium",
    "od_premium",
  ]);

  const oldVehicleCharge = getValue(amount as any, ["old_vehicle_charge"]);

  const voluntaryExcessAmount = getValue(amount as any, [
    "voluntary_excess_amount",
    "voluntary_excess_discount",
  ]);

  const noClaimDiscount = getValue(amount as any, [
    "no_claim_discount_amount",
    "ncd_amount",
  ]);

  const directDiscountAmount = getValue(premiumData as any, [
    "direct_discount_amount",
  ]);

  const basicPremiumFromApi = getValue(amount as any, ["basic_premium"]);

  const basicPremium =
    toNumber(basicPremiumFromApi) > 0
      ? basicPremiumFromApi
      : toNumber(ownDamagePremium) +
      toNumber(oldVehicleCharge) -
      toNumber(voluntaryExcessAmount) -
      toNumber(noClaimDiscount) -
      toNumber(directDiscountAmount);

  const thirdPartyPremium = getValue(amount as any, [
    "tpl_amount",
    "third_party_premium",
  ]);

  const poolPremium = getValue(amount as any, ["pool_amount"]);

  const taxableAmount = getValue(amount as any, [
    "taxable_amount",
    "subtotal_amount",
  ]);

  const subTotalABC =
    toNumber(taxableAmount) > 0
      ? taxableAmount
      : toNumber(basicPremium) + toNumber(thirdPartyPremium) + toNumber(poolPremium);

  const vatPercent = getValue(amount as any, ["vat_percent"], 13);
  const vatAmount = getValue(amount as any, ["vat_amount"]);
  const stampDuty = getValue(amount as any, ["stamp_duty"]);

  const totalPremium = getValue(amount as any, [
    "total_amount",
    "total_premium",
    "payable_amount",
  ]);

  const premiumRows: PremiumRowType[] = [
    { key: "premium", label: "Premium", value: ownDamagePremium },
    { key: "old_vehicle_charge", label: "Add : Old Vehicle Charge", value: oldVehicleCharge },
    { key: "voluntary_excess", label: "Less : Voluntary Excess", value: voluntaryExcessAmount, type: "less" },
    { key: "no_claim_discount", label: "Less : No Claim Discount", value: noClaimDiscount, type: "less" },
    { key: "direct_discount", label: "Less : Direct Discount", value: directDiscountAmount, type: "less" },
    { key: "basic_premium", label: "Basic Premium", value: basicPremium, type: "subtotal" },
    { key: "third_party_section", label: "Third Party Premium Calculation", type: "section" },
    { key: "third_party_premium", label: "Third Party Premium", value: thirdPartyPremium },
    { key: "pool_section", label: "Pool Premium Calculation", type: "section" },
    { key: "pool_premium", label: "Pool Premium", value: poolPremium, type: "subtotal" },
    { key: "final_section", label: "Final Premium Calculation", type: "section" },
    { key: "subtotal_abc", label: "Sub Total", value: subTotalABC, type: "subtotal" },
    { key: "vat", label: `Add : VAT ${vatPercent}%`, value: vatAmount },
    { key: "stamp", label: "Add : Stamp Duty", value: stampDuty },
    { key: "total", label: "Total Premium", value: totalPremium, type: "total" },
  ];

  const getRowClass = (type?: RowType, index?: number) => {
    if (type === "section") return "bg-muted/70";
    if (type === "total") return "border-t-2 border-primary/30 bg-primary/10";
    if (type === "subtotal") return "bg-muted/30";

    return index && index % 2 === 0 ? "bg-background" : "bg-muted/10";
  };

  const getLabelClass = (type?: RowType) => {
    if (type === "section") return "font-bold text-foreground";
    if (type === "total") return "font-bold text-primary";
    if (type === "subtotal") return "font-semibold text-foreground";
    if (type === "less") return "text-red-600";

    return "text-muted-foreground";
  };

  const getValueClass = (type?: RowType) => {
    if (type === "section") return "font-bold text-foreground";
    if (type === "total") return "text-base font-bold text-primary";
    if (type === "subtotal") return "font-semibold text-foreground";
    if (type === "less") return "font-medium text-red-600";

    return "font-medium";
  };

  const renderStep3 = () => (
    <>
      <div className="mb-8 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate("/commercial-vehicle/comprehensive?step=2")}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-white transition hover:bg-muted"
        >
          <ChevronLeft className="h-5 w-5 text-black" />
        </button>

        <div>
          <h1 className="text-2xl font-bold text-black">
            Normal Goods Carrying Policy
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Fill normal goods vehicle details to calculate comprehensive premium.
          </p>
        </div>
      </div>

      <Card className="bg-white">
        <CardContent className="space-y-5 pt-6">
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <Label htmlFor="goodCarryingCapacity">
                Good Carrying Capacity in Ton *
              </Label>

              <Input
                id="goodCarryingCapacity"
                type="text"
                inputMode="numeric"
                placeholder="Enter good carrying capacity in ton"
                value={goodCarryingCapacity}
                onChange={(event) =>
                  handleNumberInput(
                    event.target.value,
                    setGoodCarryingCapacity,
                    "goodCarryingCapacity",
                  )
                }
                className={`mt-2 ${errors.goodCarryingCapacity ? "border-red-500" : ""}`}
              />

              {errors.goodCarryingCapacity && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.goodCarryingCapacity}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="yearOfManufacture">Year of Manufacture *</Label>

              <Select
                value={yearOfManufacture}
                onValueChange={(value) => {
                  setYearOfManufacture(value);
                  clearError("yearOfManufacture");
                }}
              >
                <SelectTrigger
                  id="yearOfManufacture"
                  className={`mt-2 ${errors.yearOfManufacture ? "border-red-500" : ""}`}
                >
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>

                <SelectContent>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {errors.yearOfManufacture && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.yearOfManufacture}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="noOfSeats">No of Seats Including Driver *</Label>

              <Input
                id="noOfSeats"
                type="text"
                inputMode="numeric"
                placeholder="Enter no of seats including driver"
                value={noOfSeats}
                onChange={(event) =>
                  handleNumberInput(event.target.value, setNoOfSeats, "noOfSeats")
                }
                className={`mt-2 ${errors.noOfSeats ? "border-red-500" : ""}`}
              />

              {errors.noOfSeats && (
                <p className="mt-1 text-xs text-red-600">{errors.noOfSeats}</p>
              )}
            </div>

            <div>
              <Label htmlFor="helper">Helper *</Label>

              <Select
                value={helper}
                onValueChange={(value) => {
                  setHelper(value);
                  clearError("helper");
                }}
              >
                <SelectTrigger
                  id="helper"
                  className={`mt-2 ${errors.helper ? "border-red-500" : ""}`}
                >
                  <SelectValue placeholder="Select helper" />
                </SelectTrigger>

                <SelectContent>
                  {yesNoOptions.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {errors.helper && (
                <p className="mt-1 text-xs text-red-600">{errors.helper}</p>
              )}
            </div>

            <div>
              <Label htmlFor="sumInsured">Sum Insured *</Label>

              <Input
                id="sumInsured"
                type="text"
                inputMode="numeric"
                placeholder="Enter vehicle sum insured"
                value={sumInsured}
                onChange={(event) =>
                  handleNumberInput(event.target.value, setSumInsured, "sumInsured")
                }
                className={`mt-2 ${errors.sumInsured ? "border-red-500" : ""}`}
              />

              {errors.sumInsured && (
                <p className="mt-1 text-xs text-red-600">{errors.sumInsured}</p>
              )}
            </div>



            <div>
              <Label htmlFor="compulsoryExcess">Compulsory Excess *</Label>

              <Input
                id="compulsoryExcess"
                type="text"
                value={compulsoryLoading ? "Loading..." : compulsoryExcess}
                disabled
                readOnly
                className={`mt-2 cursor-not-allowed bg-muted ${errors.compulsoryExcess ? "border-red-500" : ""
                  }`}
              />

              <p className="mt-1 text-xs text-muted-foreground">
                Auto calculated from year of manufacture.
              </p>

              {errors.compulsoryExcess && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.compulsoryExcess}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="voluntaryExcess">Voluntary Excess *</Label>

              <Select
                value={voluntaryExcess}
                onValueChange={(value) => {
                  setVoluntaryExcess(value);
                  clearError("voluntaryExcess");
                }}
              >
                <SelectTrigger
                  id="voluntaryExcess"
                  className={`mt-2 ${errors.voluntaryExcess ? "border-red-500" : ""}`}
                >
                  <SelectValue placeholder="Select voluntary excess" />
                </SelectTrigger>

                <SelectContent>
                  {voluntaryExcessOptions.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {errors.voluntaryExcess && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.voluntaryExcess}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="noClaimYear">No Claim Discount Year *</Label>

              <Select
                value={noClaimYear}
                onValueChange={(value) => {
                  setNoClaimYear(value);
                  clearError("noClaimYear");
                }}
              >
                <SelectTrigger
                  id="noClaimYear"
                  className={`mt-2 ${errors.noClaimYear ? "border-red-500" : ""}`}
                >
                  <SelectValue placeholder="Select no claim year" />
                </SelectTrigger>

                <SelectContent>
                  {noClaimYearOptions.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {errors.noClaimYear && (
                <p className="mt-1 text-xs text-red-600">{errors.noClaimYear}</p>
              )}
            </div>

            <div>
              <Label htmlFor="towingCharge">Include Towing Charge?</Label>

              <Select value={towingCharge} onValueChange={setTowingCharge}>
                <SelectTrigger id="towingCharge" className="mt-2">
                  <SelectValue placeholder="Select towing charge" />
                </SelectTrigger>

                <SelectContent>
                  {yesNoOptions.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="flex items-center gap-3 pt-2">
                <Switch
                  id="directDiscount"
                  checked={directDiscount}
                  onCheckedChange={setDirectDiscount}
                />

                <Label htmlFor="directDiscount" className="cursor-pointer">
                  Direct discount
                </Label>
              </div>
            </div>
          </div>

          {inlineError && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {inlineError}
            </div>
          )}

          <div className="flex justify-between pt-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => navigate("/commercial-vehicle/comprehensive?step=2")}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>

            <Button
              size="lg"
              className="px-8"
              disabled={loading || compulsoryLoading}
              onClick={handleCalculate}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Calculating...
                </>
              ) : (
                "Calculate & Next"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );

  const renderStep4 = () => (
    <Step4VehicleDetails
      goToStep={goToStep}
      manufactureYearFromPremium={yearOfManufacture}
    />
  );

  const renderStep5 = () => (
    <Step5ReviewSubmit
      goToStep={goToStep}
      premiumRows={premiumRows}
      amount={amount}
      premiumData={premiumData}
      totalPremium={totalPremium}
    />
  );

  return (
    <div className="flex min-h-screen w-full bg-muted/30">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-h-screen flex-1 flex-col">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 md:p-6">
          <div className="mx-auto max-w-6xl">
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
            {currentStep === 5 && renderStep5()}
          </div>
        </main>
      </div>
    </div>
  );
}

function Step4VehicleDetails({
  goToStep,
  manufactureYearFromPremium,
}: {
  goToStep: (step: number) => void;
  manufactureYearFromPremium: string;
}) {
  const savedVehicle = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("motor.vehicleDetail") || "null");
    } catch {
      return null;
    }
  }, []);

  const savedCoverage = useMemo(() => {
    try {
      return JSON.parse(
        localStorage.getItem("motor.comprehensiveNormalGoodsForm") || "null",
      );
    } catch {
      return null;
    }
  }, []);

  const manufactureYear =
    Number(savedVehicle?.manufactureYear || savedCoverage?.yearOfManufacture || manufactureYearFromPremium || 0);

  const [regSystem, setRegSystem] = useState<string>(
    savedVehicle?.regSystem || "zone",
  );
  const [zone, setZone] = useState<string>(savedVehicle?.zone || "");
  const [lotNo, setLotNo] = useState<string>(savedVehicle?.lotNo || "");
  const [vehicleSymbol, setVehicleSymbol] = useState<string>(
    savedVehicle?.vehicleSymbol || "",
  );
  const [vehicleNumber, setVehicleNumber] = useState<string>(
    savedVehicle?.vehicleNumber || "",
  );
  const [registerDate, setRegisterDate] = useState<string>(
    savedVehicle?.registerDate || "",
  );
  const [manufacturer, setManufacturer] = useState<string>(
    savedVehicle?.manufacturer || "",
  );
  const [modelNumber, setModelNumber] = useState<string>(
    savedVehicle?.modelNumber || "",
  );
  const [vehicleType, setVehicleType] = useState<string>(
    savedVehicle?.vehicleType || "Goods Carrying Vehicle",
  );
  const [chassisNo, setChassisNo] = useState<string>(
    savedVehicle?.chassisNo || "",
  );
  const [engineNo, setEngineNo] = useState<string>(
    savedVehicle?.engineNo || "",
  );
  const [billbookNo, setBillbookNo] = useState<string>(
    savedVehicle?.billbookNo || "",
  );
  const [billbookExpiry, setBillbookExpiry] = useState<string>(
    savedVehicle?.billbookExpiry || addOneYear(todayISO()),
  );

  const [blueBookFront, setBlueBookFront] = useState<FileState>(null);
  const [blueBookBack, setBlueBookBack] = useState<FileState>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const frontRef = useRef<HTMLInputElement>(null);
  const backRef = useRef<HTMLInputElement>(null);

  const [zoneList, setZoneList] = useState<CatalogueItem[]>([]);
  const [zoneLotList, setZoneLotList] = useState<CatalogueItem[]>([]);
  const [kindList, setKindList] = useState<CatalogueItem[]>([]);
  const [embossedStateList, setEmbossedStateList] = useState<CatalogueItem[]>([]);
  const [embossedLotList, setEmbossedLotList] = useState<CatalogueItem[]>([]);
  const [embossedKindList, setEmbossedKindList] = useState<CatalogueItem[]>([]);
  const [catalogueLoading, setCatalogueLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadCatalogues = async () => {
      try {
        setCatalogueLoading(true);

        const [zones, zoneLots, kinds, eStates, eLots, eKinds] =
          await Promise.all([
            getZoneAbbreviations(),
            getZoneLotNumbers(),
            getVehicleKinds(),
            getEmbossedStates(),
            getEmbossedLotNumbers(),
            getEmbossedVehicleKinds(),
          ]);

        if (!mounted) return;

        setZoneList(zones || []);
        setZoneLotList(zoneLots || []);
        setKindList(kinds || []);
        setEmbossedStateList(eStates || []);
        setEmbossedLotList(eLots || []);
        setEmbossedKindList(eKinds || []);
      } catch (error) {
        console.error("Failed to load motor catalogues:", error);
        toast.error("Failed to load vehicle catalogues");
      } finally {
        if (mounted) setCatalogueLoading(false);
      }
    };

    loadCatalogues();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const frontData = sessionStorage.getItem("motor.billbookFrontData");
    const frontName = localStorage.getItem("motor.billbookFrontName");

    if (frontData && frontName) {
      fetch(frontData)
        .then((r) => r.blob())
        .then((blob) => {
          const file = new File([blob], frontName, { type: blob.type });

          setBlueBookFront({
            file,
            preview: blob.type.startsWith("image/") ? frontData : "",
          });
        })
        .catch(() => { });
    }

    const backData = sessionStorage.getItem("motor.billbookBackData");
    const backName = localStorage.getItem("motor.billbookBackName");

    if (backData && backName) {
      fetch(backData)
        .then((r) => r.blob())
        .then((blob) => {
          const file = new File([blob], backName, { type: blob.type });

          setBlueBookBack({
            file,
            preview: blob.type.startsWith("image/") ? backData : "",
          });
        })
        .catch(() => { });
    }
  }, []);

  const zoneOptions = regSystem === "embossed" ? embossedStateList : zoneList;
  const lotOptions = regSystem === "embossed" ? embossedLotList : zoneLotList;
  const kindOptions = regSystem === "embossed" ? embossedKindList : kindList;

  const billbookExpiryBS = useMemo(() => {
    if (!billbookExpiry) return "";

    try {
      return adIsoToBsYMD(billbookExpiry);
    } catch {
      return "";
    }
  }, [billbookExpiry]);

  const motorCode = MOTOR_CODES[manufacturer] || "";

  const fieldError = (key: string) =>
    errors[key] ? (
      <p className="mt-1 text-xs text-red-500">{errors[key]}</p>
    ) : null;

  const clearVehicleError = (key: string) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleFile = (file: File, setter: (v: FileState) => void) => {
    const preview = file.type.startsWith("image/")
      ? URL.createObjectURL(file)
      : "";

    setter({ file, preview });
  };

  const removeFile = (setter: (v: FileState) => void) => setter(null);

  const validate = () => {
    const errs: Record<string, string> = {};

    if (!zone) errs.zone = "Zone / State code is required";
    if (!lotNo) errs.lotNo = "Vehicle age code is required";
    if (!vehicleSymbol) errs.vehicleSymbol = "Vehicle type symbol is required";

    if (!vehicleNumber.trim()) {
      errs.vehicleNumber = "Vehicle number is required";
    } else if (!/^\d{1,4}$/.test(vehicleNumber.trim())) {
      errs.vehicleNumber = "Vehicle number must be 1-4 digits";
    }

    if (!registerDate) {
      errs.registerDate = "Registration date is required";
    } else if (manufactureYear && new Date(registerDate).getFullYear() < manufactureYear) {
      errs.registerDate = `Registration date must be after manufacture year (${manufactureYear})`;
    }

    if (!manufacturer) errs.manufacturer = "Manufacture company is required";
    if (!vehicleType.trim()) errs.vehicleType = "Vehicle type is required";
    if (!chassisNo.trim()) errs.chassisNo = "Chassis no is required";
    if (!engineNo.trim()) errs.engineNo = "Engine no is required";
    if (!billbookNo.trim()) errs.billbookNo = "Billbook number is required";

    if (!billbookExpiry) {
      errs.billbookExpiry = "Billbook expiry date is required";
    } else if (!billbookExpiryBS) {
      errs.billbookExpiry = "Invalid billbook expiry date";
    }

    if (!blueBookFront) errs.blueBookFront = "Billbook front image is required";
    if (!blueBookBack) errs.blueBookBack = "Billbook back image is required";

    setErrors(errs);

    return Object.keys(errs).length === 0;
  };

  const storeFile = (file: File, key: string) => {
    const reader = new FileReader();

    reader.onload = () => {
      sessionStorage.setItem(key, reader.result as string);
    };

    reader.readAsDataURL(file);
  };

  const handleNext = () => {
    if (!validate()) {
      toast.error("Please fix the highlighted errors");
      return;
    }

    localStorage.setItem(
      "motor.vehicleDetail",
      JSON.stringify({
        regSystem,
        zone,
        lotNo,
        vehicleSymbol,
        vehicleNumber: vehicleNumber.trim(),
        registerDate,
        manufacturer,
        manufactureYear: String(manufactureYear || ""),
        modelNumber,
        motorCode,
        vehicleType,
        chassisNo,
        engineNo,
        billbookNo,
        billbookExpiry,
        billbookExpiryBS,
      }),
    );

    if (blueBookFront?.file) {
      localStorage.setItem("motor.billbookFrontName", blueBookFront.file.name);
      storeFile(blueBookFront.file, "motor.billbookFrontData");
    }

    if (blueBookBack?.file) {
      localStorage.setItem("motor.billbookBackName", blueBookBack.file.name);
      storeFile(blueBookBack.file, "motor.billbookBackData");
    }

    goToStep(5);
  };

  const renderUpload = (
    label: string,
    state: FileState,
    setter: (v: FileState) => void,
    ref: React.RefObject<HTMLInputElement>,
    errorKey: string,
  ) => (
    <div>
      <Label className="text-sm font-medium">{label}</Label>

      <input
        ref={ref}
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];

          if (f) {
            handleFile(f, setter);
            clearVehicleError(errorKey);
          }

          e.target.value = "";
        }}
      />

      <div
        className={`mt-2 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 text-center transition-colors ${state
          ? "border-green-400 bg-green-50"
          : errors[errorKey]
            ? "border-red-400 bg-red-50/30"
            : "border-border hover:border-primary/50 hover:bg-muted/30"
          }`}
        onClick={() => ref.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();

          const f = e.dataTransfer.files?.[0];

          if (f) {
            handleFile(f, setter);
            clearVehicleError(errorKey);
          }
        }}
      >
        {state ? (
          <>
            {state.preview && (
              <img
                src={state.preview}
                alt="preview"
                className="max-h-32 w-full rounded object-contain"
              />
            )}

            <p className="break-all text-xs font-medium text-green-700">
              {state.file.name}
            </p>

            <p className="text-xs text-muted-foreground">
              {(state.file.size / 1024).toFixed(1)} KB
            </p>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1 text-red-600"
              onClick={(e) => {
                e.stopPropagation();
                removeFile(setter);
              }}
            >
              <X className="h-3 w-3" />
              Remove
            </Button>
          </>
        ) : (
          <>
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="text-xs font-medium">Click or drag & drop</p>
            <p className="text-xs text-muted-foreground">Images or PDF</p>
          </>
        )}
      </div>

      {errors[errorKey] && (
        <p className="mt-1 text-xs text-red-500">{errors[errorKey]}</p>
      )}
    </div>
  );

  return (
    <>
      <Button
        variant="ghost"
        className="mb-4 gap-2"
        onClick={() => goToStep(3)}
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <h1 className="mb-2 text-2xl font-bold">Vehicle Details</h1>

      <p className="mb-4 text-sm text-muted-foreground">
        Enter your normal goods vehicle registration details.
      </p>

      <div className="mb-6 flex justify-center">
        <div className="w-full max-w-md overflow-hidden rounded-lg border-4 border-blue-700">
          <div className="flex items-center justify-center gap-4 bg-white px-6 py-5">
            <span className="text-4xl font-black text-black">{zone || "—"}</span>
            <span className="text-3xl font-bold text-blue-700">
              {lotNo || "—"}
            </span>
            <span className="text-3xl font-bold text-black">
              {vehicleSymbol || "—"}
            </span>
            <span className="text-4xl font-black tracking-widest text-black">
              {vehicleNumber || "----"}
            </span>
          </div>

          <div className="grid grid-cols-4 bg-blue-700 py-1 text-center text-[9px] text-white">
            <span>State Code</span>
            <span>Age Identifier</span>
            <span>Vehicle Type</span>
            <span>Vehicle Number</span>
          </div>
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="space-y-5 pt-6">
          <div>
            <Label className="mb-3 flex items-center gap-2">
              Choose Registration System
            </Label>

            <RadioGroup
              value={regSystem}
              onValueChange={(value) => {
                setRegSystem(value);
                setZone("");
                setLotNo("");
                setVehicleSymbol("");
              }}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="zone" id="zone-sys" />
                <Label htmlFor="zone-sys">Zone System</Label>
              </div>

              <div className="flex items-center space-x-2">
                <RadioGroupItem value="province" id="province-sys" />
                <Label htmlFor="province-sys">Province System</Label>
              </div>

              <div className="flex items-center space-x-2">
                <RadioGroupItem value="embossed" id="embossed-sys" />
                <Label htmlFor="embossed-sys">Embossed System</Label>
              </div>
            </RadioGroup>
          </div>

          {catalogueLoading && (
            <p className="text-sm text-muted-foreground">
              Loading vehicle catalogues...
            </p>
          )}

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <Label className="text-xs">
                {regSystem === "zone" ? "Zone *" : "STATE Code *"}
              </Label>

              <Select
                value={zone}
                onValueChange={(value) => {
                  setZone(value);
                  clearVehicleError("zone");
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>

                <SelectContent>
                  {zoneOptions.map((item) => (
                    <SelectItem key={item.data} value={item.data}>
                      {item.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {fieldError("zone")}
            </div>

            <div>
              <Label className="text-xs">Vehicle Age Code *</Label>

              <Select
                value={lotNo}
                onValueChange={(value) => {
                  setLotNo(value);
                  clearVehicleError("lotNo");
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>

                <SelectContent>
                  {lotOptions.map((item) => (
                    <SelectItem key={item.data} value={item.data}>
                      {item.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {fieldError("lotNo")}
            </div>

            <div>
              <Label className="text-xs">Types of Vehicles *</Label>

              <Select
                value={vehicleSymbol}
                onValueChange={(value) => {
                  setVehicleSymbol(value);
                  clearVehicleError("vehicleSymbol");
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>

                <SelectContent>
                  {kindOptions.map((item) => (
                    <SelectItem key={item.data} value={item.data}>
                      {item.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {fieldError("vehicleSymbol")}
            </div>

            <div>
              <Label className="text-xs">Vehicle Number *</Label>

              <Input
                className="mt-1"
                value={vehicleNumber}
                maxLength={4}
                inputMode="numeric"
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 4);
                  setVehicleNumber(value);
                  clearVehicleError("vehicleNumber");
                }}
                placeholder="0001 - 9999"
              />

              {fieldError("vehicleNumber")}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardContent className="space-y-5 pt-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Registration Date *</Label>

              <Input
                type="date"
                className="mt-2"
                value={registerDate}
                onChange={(e) => {
                  setRegisterDate(e.target.value);
                  clearVehicleError("registerDate");
                }}
              />

              {fieldError("registerDate")}
            </div>

            <div>
              <Label>Manufacture Company *</Label>

              <Select
                value={manufacturer}
                onValueChange={(value) => {
                  setManufacturer(value);
                  clearVehicleError("manufacturer");
                }}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select manufacturer" />
                </SelectTrigger>

                <SelectContent>
                  {MANUFACTURERS.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {manufacturer && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Motor Code: {motorCode || "—"}
                </p>
              )}

              {fieldError("manufacturer")}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Model Number</Label>

              <Input
                className="mt-2"
                value={modelNumber}
                onChange={(e) => setModelNumber(e.target.value)}
                placeholder="e.g. 407"
              />
            </div>

            <div>
              <Label>Vehicle Type *</Label>

              <Input
                className="mt-2"
                value={vehicleType}
                onChange={(e) => {
                  setVehicleType(e.target.value);
                  clearVehicleError("vehicleType");
                }}
                placeholder="Goods Carrying Vehicle"
              />

              {fieldError("vehicleType")}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Chassis No *</Label>

              <Input
                className="mt-2"
                value={chassisNo}
                onChange={(e) => {
                  setChassisNo(e.target.value);
                  clearVehicleError("chassisNo");
                }}
              />

              {fieldError("chassisNo")}
            </div>

            <div>
              <Label>Engine No *</Label>

              <Input
                className="mt-2"
                value={engineNo}
                onChange={(e) => {
                  setEngineNo(e.target.value);
                  clearVehicleError("engineNo");
                }}
              />

              {fieldError("engineNo")}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Billbook Number *</Label>

              <Input
                className="mt-2"
                value={billbookNo}
                onChange={(e) => {
                  setBillbookNo(e.target.value);
                  clearVehicleError("billbookNo");
                }}
              />

              {fieldError("billbookNo")}
            </div>

            <div>
              <Label>Billbook Expiry Date (AD) *</Label>

              <Input
                type="date"
                className="mt-2"
                value={billbookExpiry}
                min={todayISO()}
                onChange={(e) => {
                  setBillbookExpiry(e.target.value);
                  clearVehicleError("billbookExpiry");
                }}
              />

              {fieldError("billbookExpiry")}
            </div>
          </div>

          <div>
            <Label>Billbook Expiry Date (BS)</Label>

            <Input
              className="mt-2"
              value={billbookExpiryBS}
              readOnly
              placeholder="Auto calculated"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <Label className="mb-4 block text-base font-semibold">
            Billbook Documents *
          </Label>

          <div className="grid gap-4 md:grid-cols-2">
            {renderUpload(
              "Billbook Front *",
              blueBookFront,
              setBlueBookFront,
              frontRef as React.RefObject<HTMLInputElement>,
              "blueBookFront",
            )}

            {renderUpload(
              "Billbook Back *",
              blueBookBack,
              setBlueBookBack,
              backRef as React.RefObject<HTMLInputElement>,
              "blueBookBack",
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" className="gap-2" onClick={() => goToStep(3)}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <Button size="lg" className="px-8" onClick={handleNext}>
          Next
        </Button>
      </div>
    </>
  );
}

function Step5ReviewSubmit({
  goToStep,
  premiumRows,
  amount,
  premiumData,
  totalPremium,
}: {
  goToStep: (step: number) => void;
  premiumRows: PremiumRowType[];
  amount?: PremiumAmountInfo;
  premiumData: GetPremiumResponse | null;
  totalPremium: number | string;
}) {
  const navigate = useNavigate();

  const [submitLoading, setSubmitLoading] = useState(false);
  const [successResponse, setSuccessResponse] = useState<any>(null);

  const coverageForm = useMemo(() => {
    try {
      return JSON.parse(
        localStorage.getItem("motor.comprehensiveNormalGoodsForm") || "null",
      );
    } catch {
      return null;
    }
  }, []);

  const vehicleDetail = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("motor.vehicleDetail") || "null");
    } catch {
      return null;
    }
  }, []);

  const policySessionId = String(premiumData?.policy_session_id || "");
  const clearMotorStorage = () => {
    [
      "motor.premiumResponse",
      "motor.comprehensiveNormalGoodsForm",
      "motor.vehicleDetail",
      "motor.insurancePlan",
      "motor.vehicleType",
      "motor.selectedCommercialCategory",
      "motor.selectedCommercialCategoryId",
      "motor.billbookFrontName",
      "motor.billbookBackName",
    ].forEach((key) => localStorage.removeItem(key));

    ["motor.billbookFrontData", "motor.billbookBackData"].forEach((key) =>
      sessionStorage.removeItem(key),
    );
  };

  const handleSubmit = async () => {
    if (!premiumData || !coverageForm || !vehicleDetail) {
      toast.error("Missing data. Please complete all previous steps.");
      return;
    }

    if (!policySessionId) {
      toast.error("policy_session_id missing. Please recalculate premium.");
      goToStep(3);
      return;
    }

    try {
      setSubmitLoading(true);
      setSuccessResponse(null);

      let billbookFrontId = "";
      let billbookBackId = "";

      const frontData = sessionStorage.getItem("motor.billbookFrontData");
      const backData = sessionStorage.getItem("motor.billbookBackData");

      if (!frontData || !backData) {
        toast.error("Billbook front and back images are required.");
        goToStep(4);
        return;
      }

      const frontBlob = await fetch(frontData).then((response) => response.blob());

      const frontFile = new File([frontBlob], "billbook_front.jpg", {
        type: frontBlob.type || "image/jpeg",
      });

      const frontUpload = await uploadVehicleFront(
        vehicleDetail.billbookNo || "billbook",
        frontFile,
      );

      if (frontUpload?.process_result && frontUpload?.uploaded_id != null) {
        billbookFrontId = String(frontUpload.uploaded_id);
      } else {
        toast.error(
          frontUpload?.error_list?.[0]?.error_message ||
          "Billbook front upload failed",
        );
        return;
      }

      const backBlob = await fetch(backData).then((response) => response.blob());

      const backFile = new File([backBlob], "billbook_back.jpg", {
        type: backBlob.type || "image/jpeg",
      });

      const backUpload = await uploadVehicleBack(
        vehicleDetail.billbookNo || "billbook",
        backFile,
      );

      if (backUpload?.process_result && backUpload?.uploaded_id != null) {
        billbookBackId = String(backUpload.uploaded_id);
      } else {
        toast.error(
          backUpload?.error_list?.[0]?.error_message ||
          "Billbook back upload failed",
        );
        return;
      }

      const helperSeatCapacity = coverageForm.helper === "yes" ? "1" : "0";

      const currentYear = new Date().getFullYear();

      const manufactureYear = Number(
        vehicleDetail.manufactureYear || coverageForm.yearOfManufacture || 0,
      );

      const vehicleAge =
        manufactureYear > 0 ? Math.max(1, currentYear - manufactureYear) : 1;

      const regNumber = `${vehicleDetail.zone || ""} ${vehicleDetail.lotNo || ""
        } ${vehicleDetail.vehicleSymbol || ""} ${vehicleDetail.vehicleNumber || ""
        }`.trim();

      const classInfo: CreateMotorPolicyPayload["class_info"] = {
        class_id: "3",
        cover_type_id: "Comprehensive",
        is_government: "1",

        vehicle_suminsured_amount: String(coverageForm.sumInsured || "0"),
        item_suminsured_amount: "0",
        suminsured_amount: String(coverageForm.sumInsured || "0"),

        voluntary_excess: String(coverageForm.voluntaryExcess || "0"),
        compulsory_excess: String(coverageForm.compulsoryExcess || "500"),

        item_description: "",
        manufacturing_company: vehicleDetail.manufacturer || "",
        manufacture_year:
          vehicleDetail.manufactureYear ||
          coverageForm.yearOfManufacture ||
          "",
        registration_date: vehicleDetail.registerDate || "",
        vehicle_age_in_years: String(vehicleAge),

        driver_seat_capacity: "1",
        conductor_helper_seat_capacity: helperSeatCapacity,
        passenger_seat_capacity: String(
          coverageForm.passengerSeatCapacity || "0",
        ),
        passanger_carrying_capacity: String(
          coverageForm.noOfSeatsIncludingDriver || "0",
        ),

        good_carrying_capacity: String(
          coverageForm.goodCarryingCapacity || "0",
        ),
        good_carrying_capacity_ton: String(
          coverageForm.goodCarryingCapacity || "0",
        ),

        engine_capcity_cc: "12",

        vehicle_type: vehicleDetail.vehicleType || "Goods Carrying Vehicle",
        chassis_number: vehicleDetail.chassisNo || "",
        engine_number: vehicleDetail.engineNo || "",
        model_number: vehicleDetail.modelNumber || "",

        vehicle_number: vehicleDetail.vehicleNumber || "",
        registration_number: regNumber,
        vehicle_num_zone_state: vehicleDetail.zone || "",
        vehicle_num_lot: String(vehicleDetail.lotNo || ""),
        vehicle_num_kind: vehicleDetail.vehicleSymbol || "",
        vehicle_reg: vehicleDetail.regSystem === "embossed" ? "e" : "y",

        billbook_number: vehicleDetail.billbookNo || "",
        billbook_exp_date: vehicleDetail.billbookExpiry || "",
        billbook_exp_date_nep: vehicleDetail.billbookExpiryBS || "",
        billbook_front_id: billbookFrontId,
        billbook_back_id: billbookBackId,

        noclaim_year: String(coverageForm.noClaimYear || "0"),
        no_claim_discount_percent: "0",

        has_tailor: "n",
        tailor_amount: null,

        nep_vehicle_number: "",
        is_tmis_vehicle_register: "n",
        office_code: "",
        motor_model: "",
        motor_code: vehicleDetail.motorCode || "",
        is_diplomatic: "n",
        has_schedule: "n",
      };

      const payload: CreateMotorPolicyPayload = {
        client_info: {
          Bank_Code: "1",
        },
        policy_info: {
          department_id: "1",
          class_id: "3",
          payment_process: "Full Payment",
          effective_date: todayISO(),
          expiry_date: addOneYear(todayISO()),
        },
        policy_session_id: policySessionId,
        class_info: classInfo,
      };

      console.log("Create Motor Policy Payload:", payload);

      const response = await createMotorPolicy(payload);

      setSuccessResponse(response);

      const policyNo =
        response?.policy_no ||
        response?.policy_number ||
        response?.document_number ||
        "";

      toast.success(
        policyNo
          ? `Normal goods policy created successfully. Policy No: ${policyNo}`
          : "Normal goods policy created successfully",
      );

      clearMotorStorage();

      navigate("/my-draft-policy", { replace: true });
    } catch (error: any) {
      const msg =
        error?.data?.error_list?.[0]?.error_message ||
        error?.message ||
        "Failed to create normal goods policy";

      toast.error(msg);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleGoToDraftPolicy = () => {
    clearMotorStorage();
    navigate("/my-draft-policy", { replace: true });
  };

  return (
    <>
      <Button
        variant="ghost"
        className="mb-4 gap-2"
        onClick={() => goToStep(4)}
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <h1 className="mb-2 text-2xl font-bold">Review & Submit</h1>

      <p className="mb-6 text-sm text-muted-foreground">
        Please review your normal goods comprehensive policy before submitting.
      </p>


      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="bg-primary/5 pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-5 w-5" />
              Premium Input Summary
            </CardTitle>
          </CardHeader>

          <CardContent className="pt-4">
            {coverageForm ? (
              <>
                <InfoRow
                  label="Category"
                  value="Commercial Vehicle Normal Goods Carrying Policy"
                />
                <InfoRow
                  label="Good Carrying Capacity"
                  value={`${coverageForm.goodCarryingCapacity} Ton`}
                />
                <InfoRow
                  label="No of Seats"
                  value={coverageForm.noOfSeatsIncludingDriver}
                />
                <InfoRow label="Helper" value={coverageForm.helper} />
                <InfoRow
                  label="Sum Insured"
                  value={`NPR ${fmt(coverageForm.sumInsured)}`}
                />
                <InfoRow
                  label="Year of Manufacture"
                  value={coverageForm.yearOfManufacture}
                />
                <InfoRow
                  label="Voluntary Excess"
                  value={coverageForm.voluntaryExcess}
                />
                <InfoRow
                  label="No Claim Year"
                  value={`${coverageForm.noClaimYear} Year`}
                />
                <InfoRow
                  label="Direct Discount"
                  value={coverageForm.directDiscount ? "Yes" : "No"}
                />
              </>
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No coverage data found
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="bg-primary/5 pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Car className="h-5 w-5" />
              Vehicle Details
            </CardTitle>
          </CardHeader>

          <CardContent className="pt-4">
            {vehicleDetail ? (
              <>
                <InfoRow
                  label="Registration"
                  value={`${vehicleDetail.zone || ""} ${vehicleDetail.lotNo || ""
                    } ${vehicleDetail.vehicleSymbol || ""} ${vehicleDetail.vehicleNumber || ""
                    }`.trim()}
                />
                <InfoRow
                  label="Manufacture Company"
                  value={vehicleDetail.manufacturer}
                />
                <InfoRow
                  label="Manufacture Year"
                  value={vehicleDetail.manufactureYear}
                />
                <InfoRow
                  label="Vehicle Type"
                  value={vehicleDetail.vehicleType}
                />
                <InfoRow label="Model" value={vehicleDetail.modelNumber || "—"} />
                <InfoRow label="Chassis No" value={vehicleDetail.chassisNo} />
                <InfoRow label="Engine No" value={vehicleDetail.engineNo} />
                <InfoRow label="Billbook No" value={vehicleDetail.billbookNo} />
                <InfoRow
                  label="Billbook Expiry"
                  value={vehicleDetail.billbookExpiry}
                />
                <InfoRow
                  label="Registration Date"
                  value={vehicleDetail.registerDate}
                />
              </>
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No vehicle details found
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {amount && (
        <Card className="mb-8">
          <CardHeader className="bg-primary/5 pb-3">
            <CardTitle className="text-base">Premium Breakdown</CardTitle>
          </CardHeader>

          <CardContent className="pt-4">
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-primary text-primary-foreground">
                    <th className="px-5 py-3 text-left font-semibold">
                      Description
                    </th>
                    <th className="px-5 py-3 text-right font-semibold">
                      Amount (NPR)
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {premiumRows.map((row, index) => (
                    <tr
                      key={row.key}
                      className={
                        row.type === "section"
                          ? "bg-muted/70"
                          : row.type === "total"
                            ? "border-t-2 border-primary/30 bg-primary/10"
                            : row.type === "subtotal"
                              ? "bg-muted/30"
                              : index % 2 === 0
                                ? "bg-background"
                                : "bg-muted/10"
                      }
                    >
                      <td className="px-5 py-3">{row.label}</td>
                      <td className="px-5 py-3 text-right">
                        {row.type === "section" ? "" : fmt(row.value)}
                      </td>
                    </tr>
                  ))}

                  <tr className="border-t-2 bg-primary/5">
                    <td className="px-5 py-4 font-bold text-primary">
                      Total Premium
                    </td>
                    <td className="px-5 py-4 text-right text-base font-bold text-primary">
                      {fmt(totalPremium)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between">
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => goToStep(4)}
          disabled={submitLoading}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <Button
          size="lg"
          className="gap-2 px-8"
          disabled={submitLoading || !premiumData || !vehicleDetail || !!successResponse}
          onClick={handleSubmit}
        >
          {submitLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4" />
              Submit Policy
            </>
          )}
        </Button>
      </div>
    </>
  );
}