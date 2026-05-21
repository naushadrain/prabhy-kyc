import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ChevronLeft,
  ArrowLeft,
  Loader2,
  Upload,
  X,
  Info,
  AlertCircle,
  Car,
  DollarSign,
  FileText,
  CheckCircle,
} from "lucide-react";
import { toast } from "@/components/ui/sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import {
  getMotorPremiumPV,
  type GetPremiumRequestPV,
} from "@/api/motor/getpremium";
import {
  createMotorPolicy,
  type CreateMotorPolicyPayload,
} from "@/api/motor/createMotorPolicy";
import {
  uploadVehicleFront,
  uploadVehicleBack,
} from "@/api/policy/uploadPolicyDoc";
import { adIsoToBsYMD } from "@/zod/kycSchema";
import {
  type CatalogueItem,
  getZoneAbbreviations,
  getZoneLotNumbers,
  getVehicleKinds,
  getEmbossedStates,
  getEmbossedLotNumbers,
  getEmbossedVehicleKinds,
} from "@/api/motor/getMotorCatalogue";

/* ──────────────────────────────────────────────────────────────────────────────
   Constants
   ────────────────────────────────────────────────────────────────────────────── */

const CATEGORIES = [
  { value: "1", label: "Motorcycle Policy" },
  { value: "2", label: "Private Vehicle Policy" },
];

const CC_OPTIONS = [
  { value: "less_than_150", label: "Less than 150 CC", cc_value: "100" },
  { value: "150_to_250", label: "150 CC to 250 CC", cc_value: "200" },
  { value: "above_250", label: "Above 250 CC", cc_value: "300" },
];

const VOLUNTARY_EXCESS_ID1 = [
  { value: "500", label: "500" },
  { value: "1000", label: "1,000" },
  { value: "2000", label: "2,000" },
];
const VOLUNTARY_EXCESS_ID2 = [
  { value: "1000", label: "1,000" },
  { value: "2000", label: "2,000" },
  { value: "5000", label: "5,000" },
  { value: "10000", label: "10,000" },
];

// Hardcoded fallback removed — catalogues fetched from API in Step 4
const MANUFACTURERS = [
  "Honda",
  "Yamaha",
  "Bajaj",
  "TVS",
  "Hero",
  "Suzuki",
  "Royal Enfield",
  "KTM",
];
const MOTOR_CODES: Record<string, string> = {
  Honda: "hnd",
  Yamaha: "ymh",
  Bajaj: "bpj",
  TVS: "tvs",
  Hero: "hro",
  Suzuki: "szk",
  "Royal Enfield": "re",
  KTM: "ktm",
};

/* ──────────────────────────────────────────────────────────────────────────────
   Helpers
   ────────────────────────────────────────────────────────────────────────────── */

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addOneYear(dateISO: string): string {
  const d = new Date(dateISO);
  d.setFullYear(d.getFullYear() + 1);
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const fmt = (v: number | string | undefined | null) => {
  const n = Number(v ?? 0);
  if (!Number.isFinite(n)) return "\u2014";
  return n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between py-2 border-b last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value ?? "\u2014"}</span>
    </div>
  );
}

type FileState = { file: File; preview: string } | null;

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════════════════════ */

export const TwoWhellerPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentStep = Number(searchParams.get("step")) || 1;

  const goToStep = useCallback(
    (step: number) => {
      setSearchParams({ step: String(step) });
    },
    [setSearchParams],
  );

  /* ────────────────────────────────────────────────────────────────────────────
     STEP 1 — Insurance Type
     ──────────────────────────────────────────────────────────────────────────── */

  const renderStep1 = () => {
    const vehicleType =
      localStorage.getItem("motor.vehicleType") || "two-wheeler";
    const planTitle =
      vehicleType === "two-wheeler"
        ? "Two Wheeler Plan"
        : vehicleType === "private"
          ? "Two Wheeler Plan"
          : "Commercial Vehicle Plan";

    const handlePlanSelect = (planType: "comprehensive" | "third-party") => {
      localStorage.setItem("motor.insurancePlan", planType);
      goToStep(2);
    };

    return (
      <>
        <Button
          variant="ghost"
          className="mb-4 gap-2"
          onClick={() => navigate("/dashboard")}
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </Button>

        <h1 className="text-2xl font-bold mb-2">{planTitle}</h1>
        <p className="text-muted-foreground mb-8">
          Select the insurance plan that best suits you.
        </p>

        <div className="grid md:grid-cols-2 gap-6 max-w-3xl">
          <Card
            className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary"
            onClick={() => handlePlanSelect("comprehensive")}
          >
            <h3 className="text-lg font-bold mb-2 text-center">
              Comprehensive Insurance
            </h3>
            <div className="flex justify-center my-8">
              <div className="w-32 h-32 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <path
                    d="M50 10 L65 25 L65 50 L50 60 L35 50 L35 25 Z"
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="2"
                  />
                  <circle cx="50" cy="35" r="8" fill="hsl(var(--primary))" />
                  <path
                    d="M42 42 L42 50 L58 50 L58 42"
                    fill="hsl(var(--primary))"
                  />
                </svg>
              </div>
            </div>
            <p className="text-xs text-center text-muted-foreground">
              Covers all damages including you and other third-party damages.
            </p>
          </Card>

          <Card
            className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary"
            onClick={() => navigate('/two-wheeler/third-party')}
          >
            <h3 className="text-lg font-bold mb-2 text-center">
              Third Party Insurance
            </h3>
            <div className="flex justify-center my-8">
              <div className="w-32 h-32 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <path
                    d="M50 10 L65 25 L65 50 L50 60 L35 50 L35 25 Z"
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="2"
                  />
                  <path
                    d="M42 32 L48 38 L58 28"
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M40 45 L40 52 L60 52 L60 45"
                    fill="hsl(var(--primary))"
                  />
                </svg>
              </div>
            </div>
            <p className="text-xs text-center text-muted-foreground">
              All third-party damages are covered.
            </p>
          </Card>
        </div>

        <div className="mt-8 space-y-4 max-w-3xl">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-700">
              All third-party damages are covered.
            </p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-700">
              Covers all damages including you and other third-party damages.
            </p>
          </div>
        </div>
      </>
    );
  };

  /* ────────────────────────────────────────────────────────────────────────────
     STEP 2 — Coverage Plan (Comprehensive with CC Dropdown)
     ──────────────────────────────────────────────────────────────────────────── */

  const Step2CoveragePlan = () => {
    const savedCoverage = useMemo(() => {
      try {
        return JSON.parse(
          localStorage.getItem("motor.coverageForm") || "null",
        );
      } catch {
        return null;
      }
    }, []);

    const [category, setCategory] = useState<string>(
      savedCoverage?.category || "",
    );
    const [yearOfManufacture, setYearOfManufacture] = useState<string>(
      savedCoverage?.yearOfManufacture || "",
    );
    const [selectedCcRange, setSelectedCcRange] = useState<string>(
      savedCoverage?.selectedCcRange || "",
    );
    const [vehicleCost, setVehicleCost] = useState<string>(
      savedCoverage?.vehicleCost || "",
    );
    const [voluntaryExcess, setVoluntaryExcess] = useState<string>(
      savedCoverage?.voluntaryExcess || "0",
    );
    const paDriver = "500000";
    const noOfSeat = "2";
    const paPassenger = "500000";
    const [effectiveDate, setEffectiveDate] = useState<string>(
      savedCoverage?.effectiveDate || todayISO(),
    );
    const [coverStrikeDamage, setCoverStrikeDamage] = useState<boolean>(
      savedCoverage?.coverStrikeDamage ?? true,
    );
    const [noClaimYear, setNoClaimYear] = useState<string>(
      savedCoverage?.noClaimYear || "0",
    );
    const [directDiscount, setDirectDiscount] = useState<boolean>(
      savedCoverage?.directDiscount ?? true,
    );
    const [loading, setLoading] = useState(false);

    const expiryDate = useMemo(
      () => (effectiveDate ? addOneYear(effectiveDate) : ""),
      [effectiveDate],
    );

    const years = useMemo(() => {
      const list: string[] = [];
      for (let y = 2026; y >= 1985; y--) list.push(String(y));
      return list;
    }, []);

    // Get the numeric CC value based on selected range
    const getCcValue = () => {
      const selected = CC_OPTIONS.find(opt => opt.value === selectedCcRange);
      return selected ? selected.cc_value : "";
    };

    const isFormValid =
      !!category &&
      !!yearOfManufacture &&
      !!selectedCcRange &&
      !!vehicleCost.trim() &&
      Number(vehicleCost) > 0 &&
      !!effectiveDate;

    const handleCalculate = async () => {
      if (!isFormValid) return;

      const currentYear = new Date().getFullYear();
      const vehicleAge = currentYear - Number(yearOfManufacture);
      const ccValue = getCcValue();

      const payload: GetPremiumRequestPV = {
        class_id: "1",
        cover_type_id: "Comprehensive",
        is_government: "1",
        engine_capcity_cc: ccValue,
        driver_seat_capacity: "1",
        passenger_seat_capacity: String(Math.max(0, Number(noOfSeat) - 1)),
        passanger_carrying_capacity: noOfSeat,
        compulsory_excess: "500",
        voluntary_excess: voluntaryExcess,
        vehicle_age_in_years: String(vehicleAge),
        vehicle_suminsured_amount: vehicleCost,
        calc_type: "p",
        noclaim_year: noClaimYear,
        is_tailor: "false",
        get_direct_discount: directDiscount ? "y" : "n",
        vehicle_reg: "e",
        tailor_amount: "",

      };

      try {
        setLoading(true);
        const resp = await getMotorPremiumPV(payload);

        if (resp?.process_result === false) {
          toast.error(
            resp?.error_list?.[0]?.error_message ||
            "Failed to calculate premium",
          );
          return;
        }

        localStorage.setItem("motor.premiumResponse", JSON.stringify(resp));
        localStorage.setItem("motor.insurancePlan", "comprehensive");
        localStorage.setItem(
          "motor.coverageForm",
          JSON.stringify({
            category,
            yearOfManufacture,
            selectedCcRange,
            ccValue,
            vehicleCost,
            voluntaryExcess,
            effectiveDate,
            expiryDate,
            noClaimYear,
            coverStrikeDamage,
            directDiscount,
          }),
        );

        goToStep(3);
      } catch (err: any) {
        let msg = "Failed to calculate premium";
        try {
          msg =
            JSON.parse(err?.message || "")?.error_list?.[0]?.error_message ||
            msg;
        } catch {
          msg = err?.message || msg;
        }
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };

    return (
      <>
        <Button
          variant="ghost"
          className="mb-4 gap-2"
          onClick={() => goToStep(1)}
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </Button>

        <h1 className="text-2xl font-bold mb-2">
          Coverage Plan &mdash; Comprehensive
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          Fill in your vehicle details to get an instant quote
        </p>

        <Card className="mb-8">
          <CardContent className="pt-6 space-y-5">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={category}
                  onValueChange={(v) => {
                    setCategory(v);
                    setVoluntaryExcess("");
                  }}
                >
                  <SelectTrigger id="category" className="mt-2">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="year">Year Of Manufacture *</Label>
                <Select
                  value={yearOfManufacture}
                  onValueChange={setYearOfManufacture}
                >
                  <SelectTrigger id="year" className="mt-2">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((y) => (
                      <SelectItem key={y} value={y}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ccRange">Cubic Capacity *</Label>
                <Select
                  value={selectedCcRange}
                  onValueChange={setSelectedCcRange}
                >
                  <SelectTrigger id="ccRange" className="mt-2">
                    <SelectValue placeholder="Select CC range" />
                  </SelectTrigger>
                  <SelectContent>
                    {CC_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="vehicleCost">Vehicle Cost (NPR) *</Label>
                <Input
                  id="vehicleCost"
                  type="text"
                  inputMode="numeric"
                  className="mt-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="Enter vehicle cost"
                  value={vehicleCost}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "" || /^\d+$/.test(value)) {
                      setVehicleCost(value);
                    }
                  }}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="voluntaryExcess">Voluntary Excess *</Label>
                <Select
                  value={voluntaryExcess}
                  onValueChange={setVoluntaryExcess}
                >
                  <SelectTrigger id="voluntaryExcess" className="mt-2">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {(category === "2"
                      ? VOLUNTARY_EXCESS_ID2
                      : VOLUNTARY_EXCESS_ID1
                    ).map((v) => (
                      <SelectItem key={v.value} value={v.value}>
                        {v.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-orange-600 mt-1">
                  The sum you bear towards a claim for a premium discount.
                </p>
              </div>
              <div>
                <Label>Compulsory Excess</Label>
                <Input className="mt-2" value="500" disabled />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>P.A. to Driver</Label>
                <Input
                  type="number"
                  className="mt-2"
                  value={paDriver}
                  disabled
                />
              </div>
              <div>
                <Label>No of Seat (Including Driver)</Label>
                <Input
                  type="number"
                  className="mt-2"
                  value={noOfSeat}
                  disabled
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>P.A. to Passenger</Label>
                <Input
                  type="number"
                  className="mt-2"
                  value={paPassenger}
                  disabled
                />
              </div>
              <div>
                <Label htmlFor="noClaimYear">Claim Discount Year</Label>
                <Select value={noClaimYear} onValueChange={setNoClaimYear}>
                  <SelectTrigger id="noClaimYear" className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["0", "1", "2", "3", "4", "5", "6"].map((y) => (
                      <SelectItem key={y} value={y}>
                        {y} {y === "1" ? "Year" : "Years"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="effectiveDate">Effective Date *</Label>
                <Input
                  id="effectiveDate"
                  type="date"
                  className="mt-2"
                  value={effectiveDate}
                  min={todayISO()}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                />
              </div>
              <div>
                <Label>Expiry Date</Label>
                <Input type="date" className="mt-2" value={expiryDate} disabled />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 pt-2">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="strikeDamage"
                  checked={coverStrikeDamage}
                  onCheckedChange={(v) => setCoverStrikeDamage(!!v)}
                />
                <Label htmlFor="strikeDamage" className="cursor-pointer">
                  Cover for strike damage?
                </Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  id="directDiscount"
                  checked={directDiscount}
                  onCheckedChange={setDirectDiscount}
                />
                <Label htmlFor="directDiscount" className="cursor-pointer">
                  Direct discount?
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => goToStep(1)}
          >
            <ChevronLeft className="w-4 h-4" /> BACK
          </Button>
          <Button
            size="lg"
            className="px-8"
            disabled={!isFormValid || loading}
            onClick={handleCalculate}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />{" "}
                Calculating...
              </>
            ) : (
              "CALCULATE"
            )}
          </Button>
        </div>
      </>
    );
  };

  /* ────────────────────────────────────────────────────────────────────────────
     STEP 3 — Premium Details
     ──────────────────────────────────────────────────────────────────────────── */

  const renderStep3 = () => {
    const premiumData = (() => {
      try {
        return JSON.parse(
          localStorage.getItem("motor.premiumResponse") || "null",
        );
      } catch {
        return null;
      }
    })();

    const amount = premiumData?.amount_info;
    const hasData = !!amount;

    const riskRows = hasData
      ? [
        {
          description: "Basic Premium",
          amount: fmt(amount.premium_amount),
        },
        {
          description: "Third Party Liability",
          amount: fmt(amount.tpl_amount),
        },
        {
          description: "Pool Contribution",
          amount: fmt(amount.pool_amount),
        },
        ...(premiumData.direct_discount_amount > 0
          ? [
            {
              description: `Direct Discount (${premiumData.direct_discount_percent}%)`,
              amount: `-${fmt(premiumData.direct_discount_amount)}`,
            },
          ]
          : []),
      ]
      : [];

    return (
      <>
        <Button
          variant="ghost"
          className="mb-4 gap-2"
          onClick={() => goToStep(2)}
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>

        <h1 className="text-2xl font-bold mb-8">Premium Details</h1>

        {!hasData && (
          <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-700 mb-6">
            <AlertCircle className="w-4 h-4 shrink-0" />
            No premium data found. Please go back and calculate first.
          </div>
        )}

        {hasData && (
          <div className="space-y-8">
            <div>
              <h2 className="text-base font-semibold mb-3">Risk Details</h2>
              <div className="rounded-lg overflow-hidden border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-primary text-primary-foreground">
                      <th className="text-left px-5 py-3 font-semibold">
                        Risk Description
                      </th>
                      <th className="text-right px-5 py-3 font-semibold">
                        Amount (NPR)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {riskRows.map((row, i) => (
                      <tr
                        key={i}
                        className={
                          i % 2 === 0 ? "bg-background" : "bg-muted/40"
                        }
                      >
                        <td className="px-5 py-3 text-muted-foreground">
                          {row.description}
                        </td>
                        <td
                          className={`px-5 py-3 text-right font-medium ${row.amount.startsWith("-") ? "text-red-600" : ""}`}
                        >
                          {row.amount}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-muted/20 border-t">
                      <td className="px-5 py-3 font-semibold">Sum Insured</td>
                      <td className="px-5 py-3 text-right font-semibold">
                        {fmt(amount.suminsured)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h2 className="text-base font-semibold mb-3">
                Premium Breakdown
              </h2>
              <div className="rounded-lg overflow-hidden border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-primary text-primary-foreground">
                      <th className="text-left px-5 py-3 font-semibold">
                        Description
                      </th>
                      <th className="text-right px-5 py-3 font-semibold">
                        Amount (NPR)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-background">
                      <td className="px-5 py-3 text-muted-foreground">
                        Net Premium
                      </td>
                      <td className="px-5 py-3 text-right">
                        {fmt(amount.premium_amount)}
                      </td>
                    </tr>
                    <tr className="bg-muted/40">
                      <td className="px-5 py-3 text-muted-foreground">
                        Taxable Amount
                      </td>
                      <td className="px-5 py-3 text-right">
                        {fmt(amount.taxable_amount)}
                      </td>
                    </tr>
                    <tr className="bg-background">
                      <td className="px-5 py-3 text-muted-foreground">
                        VAT ({amount.vat_percent}%)
                      </td>
                      <td className="px-5 py-3 text-right">
                        {fmt(amount.vat_amount)}
                      </td>
                    </tr>
                    <tr className="bg-muted/40">
                      <td className="px-5 py-3 text-muted-foreground">
                        Stamp Duty
                      </td>
                      <td className="px-5 py-3 text-right">
                        {fmt(amount.stamp_duty)}
                      </td>
                    </tr>
                    {amount.pa_amount > 0 && (
                      <tr className="bg-background">
                        <td className="px-5 py-3 text-muted-foreground">
                          PA Amount
                        </td>
                        <td className="px-5 py-3 text-right">
                          {fmt(amount.pa_amount)}
                        </td>
                      </tr>
                    )}
                    <tr className="border-t-2 bg-primary/5">
                      <td className="px-5 py-4 font-bold text-primary">
                        Total Payable Premium
                      </td>
                      <td className="px-5 py-4 text-right font-bold text-primary text-base">
                        {fmt(amount.total_amount)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        <div className="flex mt-6 gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => goToStep(2)}
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          {hasData && (
            <Button
              size="lg"
              className="px-6"
              onClick={() => goToStep(4)}
            >
              Next
            </Button>
          )}
        </div>
      </>
    );
  };

  /* ────────────────────────────────────────────────────────────────────────────
     STEP 4 — Vehicle Details
     ──────────────────────────────────────────────────────────────────────────── */

  const Step4VehicleDetails = () => {
    const savedVehicle = useMemo(() => {
      try {
        return JSON.parse(
          localStorage.getItem("motor.vehicleDetail") || "null",
        );
      } catch {
        return null;
      }
    }, []);

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
      savedVehicle?.vehicleType || "",
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

    const [errors, setErrors] = useState<Record<string, string>>({});

    const [blueBookFront, setBlueBookFront] = useState<FileState>(null);
    const [blueBookBack, setBlueBookBack] = useState<FileState>(null);

    const frontRef = useRef<HTMLInputElement>(null);
    const backRef = useRef<HTMLInputElement>(null);

    // Catalogue data from API
    const [zoneList, setZoneList] = useState<CatalogueItem[]>([]);
    const [zoneLotList, setZoneLotList] = useState<CatalogueItem[]>([]);
    const [kindList, setKindList] = useState<CatalogueItem[]>([]);
    const [embossedStateList, setEmbossedStateList] = useState<CatalogueItem[]>([]);
    const [embossedLotList, setEmbossedLotList] = useState<CatalogueItem[]>([]);
    const [embossedKindList, setEmbossedKindList] = useState<CatalogueItem[]>([]);
    const [catalogueLoading, setCatalogueLoading] = useState(false);

    useEffect(() => {
      let mounted = true;
      (async () => {
        try {
          setCatalogueLoading(true);
          const [zones, zoneLots, kinds, eStates, eLots, eKinds] = await Promise.all([
            getZoneAbbreviations(),
            getZoneLotNumbers(),
            getVehicleKinds(),
            getEmbossedStates(),
            getEmbossedLotNumbers(),
            getEmbossedVehicleKinds(),
          ]);
          if (!mounted) return;
          setZoneList(zones);
          setZoneLotList(zoneLots);
          setKindList(kinds);
          setEmbossedStateList(eStates);
          setEmbossedLotList(eLots);
          setEmbossedKindList(eKinds);
        } catch (e) {
          console.error("Failed to load motor catalogues:", e);
        } finally {
          if (mounted) setCatalogueLoading(false);
        }
      })();
      return () => { mounted = false; };
    }, []);

    // Derive dropdown options based on registration system
    const zoneOptions = regSystem === "embossed" ? embossedStateList : zoneList;
    const lotOptions = regSystem === "embossed" ? embossedLotList : zoneLotList;
    const kindOptions = regSystem === "embossed" ? embossedKindList : kindList;

    // Restore file previews from sessionStorage on mount
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

    const billbookExpiryBS = useMemo(() => {
      if (!billbookExpiry) return "";
      try {
        return adIsoToBsYMD(billbookExpiry);
      } catch {
        return "";
      }
    }, [billbookExpiry]);

    const motorCode = MOTOR_CODES[manufacturer] || "";

    const handleFile = (file: File, setter: (v: FileState) => void) => {
      const preview = file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : "";
      setter({ file, preview });
    };

    const removeFile = (setter: (v: FileState) => void) => setter(null);

    // Get manufacture year from coverage form for registration date validation
    const savedCoverage = useMemo(() => {
      try { return JSON.parse(localStorage.getItem("motor.coverageForm") || "null"); } catch { return null; }
    }, []);
    const manufactureYear = Number(savedCoverage?.yearOfManufacture || 0);

    const validate = (): boolean => {
      const errs: Record<string, string> = {};

      if (!zone) errs.zone = "Zone is required";
      if (!lotNo.trim()) errs.lotNo = "Lot No is required";
      else if (!/^[a-zA-Z0-9]{1,3}$/.test(lotNo.trim())) errs.lotNo = "Lot No must be 1-3 characters";
      if (!vehicleSymbol) errs.vehicleSymbol = "Vehicle Symbol is required";
      if (!vehicleNumber.trim())
        errs.vehicleNumber = "Vehicle Number is required";
      else if (!/^\d{1,4}$/.test(vehicleNumber.trim()))
        errs.vehicleNumber = "Vehicle Number must be 1-4 digits";
      if (!manufacturer) errs.manufacturer = "Manufacturer is required";
      if (vehicleType) errs.vehicleType = "Vehicle Type is required";
      if (!chassisNo.trim()) errs.chassisNo = "Chassis No is required";
      if (!engineNo.trim()) errs.engineNo = "Engine No is required";
      if (!billbookNo.trim()) errs.billbookNo = "Billbook Number is required";

      // Registration date must be after manufacture year
      if (!registerDate) {
        errs.registerDate = "Registration Date is required";
      } else if (!/^\d{4}-\d{2}-\d{2}$/.test(registerDate)) {
        errs.registerDate = "Date must be in yyyy-MM-dd format";
      } else if (manufactureYear && new Date(registerDate).getFullYear() < manufactureYear) {
        errs.registerDate = `Registration Date must be after Manufacture Year (${manufactureYear})`;
      }

      // Billbook expiry must be yyyy-MM-dd and convertible to BS
      if (!billbookExpiry) {
        errs.billbookExpiry = "Billbook Expiry Date is required";
      } else if (!/^\d{4}-\d{2}-\d{2}$/.test(billbookExpiry)) {
        errs.billbookExpiry = "Date must be in yyyy-MM-dd format";
      } else if (!billbookExpiryBS) {
        errs.billbookExpiry = "Invalid date — cannot convert to BS";
      }

      if (!blueBookFront) errs.blueBookFront = "Billbook front image is required";
      if (!blueBookBack) errs.blueBookBack = "Billbook back image is required";

      setErrors(errs);
      return Object.keys(errs).length === 0;
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

      if (blueBookFront?.file)
        localStorage.setItem(
          "motor.billbookFrontName",
          blueBookFront.file.name,
        );
      if (blueBookBack?.file)
        localStorage.setItem("motor.billbookBackName", blueBookBack.file.name);

      const storeFile = (file: File, key: string) => {
        const reader = new FileReader();
        reader.onload = () => {
          sessionStorage.setItem(key, reader.result as string);
        };
        reader.readAsDataURL(file);
      };
      if (blueBookFront?.file)
        storeFile(blueBookFront.file, "motor.billbookFrontData");
      if (blueBookBack?.file)
        storeFile(blueBookBack.file, "motor.billbookBackData");

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
              setErrors((p) => {
                const n = { ...p };
                delete n[errorKey];
                return n;
              });
            }
            e.target.value = "";
          }}
        />
        <div
          className={`mt-2 flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${state
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
            if (f) handleFile(f, setter);
          }}
        >
          {state ? (
            <>
              {state.preview && (
                <img
                  src={state.preview}
                  alt="preview"
                  className="w-full max-h-32 object-contain rounded"
                />
              )}
              <p className="text-xs font-medium text-green-700 break-all">
                {state.file.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {(state.file.size / 1024).toFixed(1)} KB
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-red-600 gap-1"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(setter);
                }}
              >
                <X className="h-3 w-3" /> Remove
              </Button>
            </>
          ) : (
            <>
              <Upload className="w-8 h-8 text-muted-foreground" />
              <p className="text-xs font-medium">Click or drag & drop</p>
              <p className="text-xs text-muted-foreground">Images or PDF</p>
            </>
          )}
        </div>
        {errors[errorKey] && (
          <p className="text-xs text-red-500 mt-1">{errors[errorKey]}</p>
        )}
      </div>
    );

    const fieldError = (key: string) =>
      errors[key] ? (
        <p className="text-xs text-red-500 mt-1">{errors[key]}</p>
      ) : null;

    return (
      <>
        <h1 className="text-2xl font-bold mb-2">Vehicle Details</h1>
        <p className="text-sm text-muted-foreground mb-4">Enter your vehicle registration and details</p>

        {/* Dynamic Number Plate */}
        <div className="mb-6 flex justify-center">
          <div className="w-full max-w-md rounded-lg overflow-hidden border-4 border-blue-700">
            <div className="bg-white flex items-center justify-center gap-4 px-6 py-5">
              <span className="text-4xl font-black text-black">{zone || "—"}</span>
              <span className="text-3xl font-bold text-blue-700">{lotNo || "—"}</span>
              <span className="text-3xl font-bold text-black">{vehicleSymbol || "—"}</span>
              <span className="text-4xl font-black text-black tracking-widest">{vehicleNumber || "----"}</span>
            </div>
            <div className="grid grid-cols-4 bg-blue-700 text-white text-[9px] text-center py-1">
              <span>State Code</span>
              <span>Age Identifier</span>
              <span>Vehicle Type</span>
              <span>Vehicle Number</span>
            </div>
          </div>
        </div>

        {/* Registration */}
        <Card className="mb-6">
          <CardContent className="pt-6 space-y-5">
            <div>
              <Label className="flex items-center gap-2 mb-3">
                Choose Registration System{" "}
                <Info className="w-4 h-4 text-muted-foreground" />
              </Label>
              <RadioGroup
                value={regSystem}
                onValueChange={(v) => { setRegSystem(v); setZone(""); setLotNo(""); setVehicleSymbol(""); }}
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
              <p className="text-sm text-muted-foreground">Loading vehicle catalogues...</p>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-xs">{regSystem === "embossed" ? "STATE Code *" : regSystem === "zone" ? "Zone *" : "STATE Code *"}</Label>
                <Select
                  value={zone}
                  onValueChange={(v) => {
                    setZone(v);
                    setErrors((p) => { const n = { ...p }; delete n.zone; return n; });
                  }}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder={catalogueLoading ? "Loading..." : "Select"} />
                  </SelectTrigger>
                  <SelectContent>
                    {zoneOptions.map((item) => (
                      <SelectItem key={item.data} value={item.data}>{item.value}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldError("zone")}
              </div>

              <div>
                <Label className="text-xs">Vehicle Age Code *</Label>
                <Select
                  value={lotNo}
                  onValueChange={(v) => {
                    setLotNo(v);
                    setErrors((p) => { const n = { ...p }; delete n.lotNo; return n; });
                  }}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder={catalogueLoading ? "Loading..." : "Select"} />
                  </SelectTrigger>
                  <SelectContent>
                    {lotOptions.map((item) => (
                      <SelectItem key={item.data} value={item.data}>{item.value}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldError("lotNo")}
              </div>

              <div>
                <Label className="text-xs">Types of Vehicles *</Label>
                <Select
                  value={vehicleSymbol}
                  onValueChange={(v) => {
                    setVehicleSymbol(v);
                    setErrors((p) => { const n = { ...p }; delete n.vehicleSymbol; return n; });
                  }}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder={catalogueLoading ? "Loading..." : "Select"} />
                  </SelectTrigger>
                  <SelectContent>
                    {kindOptions.map((item) => (
                      <SelectItem key={item.data} value={item.data}>{item.value}</SelectItem>
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
                    const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                    setVehicleNumber(v);
                    setErrors((p) => { const n = { ...p }; delete n.vehicleNumber; return n; });
                  }}
                  placeholder="0001 - 9999"
                />
                {fieldError("vehicleNumber")}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Info */}
        <Card className="mb-6">
          <CardContent className="pt-6 space-y-5">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Registration Date *</Label>
                <Input
                  type="date"
                  className="mt-2"
                  value={registerDate}
                  onChange={(e) => {
                    setRegisterDate(e.target.value);
                    setErrors((p) => { const n = { ...p }; delete n.registerDate; return n; });
                  }}
                />
                {fieldError("registerDate")}
              </div>
              <div>
                <Label>Manufacture Company *</Label>
                <Select
                  value={manufacturer}
                  onValueChange={(v) => {
                    setManufacturer(v);
                    setErrors((p) => {
                      const n = { ...p };
                      delete n.manufacturer;
                      return n;
                    });
                  }}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {MANUFACTURERS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {manufacturer && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Motor Code: {motorCode}
                  </p>
                )}
                {fieldError("manufacturer")}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Model Number</Label>
                <Input
                  className="mt-2"
                  value={modelNumber}
                  onChange={(e) => setModelNumber(e.target.value)}
                  placeholder="e.g. Pulsar"
                />
              </div>
              {/* <div>
                <Label>Vehicle Type *</Label>
                <Select value={vehicleType} onValueChange={(v) => { setVehicleType(v); setErrors((p) => { const n = { ...p }; delete n.vehicleType; return n; }); }}>
                  <SelectTrigger className="mt-2"><SelectValue placeholder="Select vehicle type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Motorcycle">Motorcycle</SelectItem>
                    <SelectItem value="Scooter">Scooter</SelectItem>
                    <SelectItem value="Electric Bike">Electric Bike</SelectItem>
                  </SelectContent>
                </Select>
                {fieldError("vehicleType")}
              </div> */}
              <div>
                <Label>Chassis No *</Label>
                <Input
                  className="mt-2"
                  value={chassisNo}
                  onChange={(e) => {
                    setChassisNo(e.target.value);
                    setErrors((p) => {
                      const n = { ...p };
                      delete n.chassisNo;
                      return n;
                    });
                  }}
                />
                {fieldError("chassisNo")}
              </div>

            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Engine No *</Label>
                <Input
                  className="mt-2"
                  value={engineNo}
                  onChange={(e) => {
                    setEngineNo(e.target.value);
                    setErrors((p) => {
                      const n = { ...p };
                      delete n.engineNo;
                      return n;
                    });
                  }}
                />
                {fieldError("engineNo")}
              </div>
              <div>
                <Label>Billbook Number *</Label>
                <Input
                  className="mt-2"
                  value={billbookNo}
                  onChange={(e) => {
                    setBillbookNo(e.target.value);
                    setErrors((p) => {
                      const n = { ...p };
                      delete n.billbookNo;
                      return n;
                    });
                  }}
                />
                {fieldError("billbookNo")}
              </div>

            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Billbook Expiry Date (AD) *</Label>
                <Input
                  type="date"
                  className="mt-2"
                  value={billbookExpiry}
                  min={todayISO()}
                  onChange={(e) => {
                    setBillbookExpiry(e.target.value);
                    setErrors((p) => {
                      const n = { ...p };
                      delete n.billbookExpiry;
                      return n;
                    });
                  }}
                />
                {fieldError("billbookExpiry")}
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
            </div>
          </CardContent>
        </Card>

        {/* Billbook Uploads */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <Label className="text-base font-semibold mb-4 block">
              Billbook Documents *
            </Label>
            <div className="grid md:grid-cols-2 gap-4">
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
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => goToStep(3)}
          >
            <ArrowLeft className="w-4 h-4" /> BACK
          </Button>
          <Button size="lg" className="px-8" onClick={handleNext}>
            NEXT
          </Button>
        </div>
      </>
    );
  };

  /* ────────────────────────────────────────────────────────────────────────────
     STEP 5 — Review & Submit
     ──────────────────────────────────────────────────────────────────────────── */

  const Step5ReviewSubmit = () => {
    const [submitLoading, setSubmitLoading] = useState(false);
    const [successModal, setSuccessModal] = useState<{
      policyNo?: string;
    } | null>(null);

    const coverageForm = useMemo(() => {
      try {
        return JSON.parse(
          localStorage.getItem("motor.coverageForm") || "null",
        );
      } catch {
        return null;
      }
    }, []);

    const premiumData = useMemo(() => {
      try {
        return JSON.parse(
          localStorage.getItem("motor.premiumResponse") || "null",
        );
      } catch {
        return null;
      }
    }, []);

    const vehicleDetail = useMemo(() => {
      try {
        return JSON.parse(
          localStorage.getItem("motor.vehicleDetail") || "null",
        );
      } catch {
        return null;
      }
    }, []);

    const amount = premiumData?.amount_info;
    const policySessionId = premiumData?.policy_session_id || "";

    const handleSubmit = async () => {
      if (!premiumData || !coverageForm || !vehicleDetail) {
        toast.error("Missing data. Please complete all previous steps.");
        return;
      }

      if (!policySessionId) {
        toast.error("policy_session_id missing. Please recalculate premium.");
        return;
      }

      const vd = vehicleDetail;
      const cf = coverageForm;
      const currentYear = new Date().getFullYear();
      const mfgYear = Number(cf.yearOfManufacture);
      const vehicleAge = mfgYear > 0 ? Math.max(1, currentYear - mfgYear) : 1;
      const regNumber = `${vd.zone} ${vd.vehicleSymbol} ${vd.lotNo} ${vd.vehicleNumber}`;

      try {
        setSubmitLoading(true);

        // Upload billbook images
        let billbookFrontId = "";
        let billbookBackId = "";

        const frontData = sessionStorage.getItem("motor.billbookFrontData");
        const backData = sessionStorage.getItem("motor.billbookBackData");

        if (frontData) {
          const blob = await fetch(frontData).then((r) => r.blob());
          const file = new File([blob], "billbook_front.jpg", {
            type: blob.type,
          });
          const res = await uploadVehicleFront(vd.billbookNo || "billbook", file);
          if (res.process_result && res.uploaded_id != null) {
            billbookFrontId = String(res.uploaded_id);
          } else {
            toast.error(
              res.error_list?.[0]?.error_message ||
              "Billbook front upload failed",
            );
            return;
          }
        }

        if (backData) {
          const blob = await fetch(backData).then((r) => r.blob());
          const file = new File([blob], "billbook_back.jpg", {
            type: blob.type,
          });
          const res = await uploadVehicleBack(vd.billbookNo || "billbook", file);
          if (res.process_result && res.uploaded_id != null) {
            billbookBackId = String(res.uploaded_id);
          } else {
            toast.error(
              res.error_list?.[0]?.error_message ||
              "Billbook back upload failed",
            );
            return;
          }
        }

        // Build payload
        const classInfo = {
          class_id: "1",
          cover_type_id: "Comprehensive",
          is_government: "1",

          vehicle_suminsured_amount: Number(cf.vehicleCost || 0),
          item_suminsured_amount: 0,
          suminsured_amount: Number(cf.vehicleCost || 0),

          voluntary_excess: Number(cf.voluntaryExcess || 500),
          compulsory_excess: 500,

          item_description: "",
          manufacturing_company: vd.manufacturer || "",
          manufacture_year: cf.yearOfManufacture || "",
          registration_date: vd.registerDate || "",
          vehicle_age_in_years: vehicleAge,

          driver_seat_capacity: 1,
          conductor_helper_seat_capacity: 0,
          passenger_seat_capacity: 1,
          passanger_carrying_capacity: 2,

          good_carrying_capacity: 0,
          engine_capcity_cc: cf.ccValue || "",

          vehicle_type: vd.vehicleType || "Scooter",
          chassis_number: vd.chassisNo || "",
          engine_number: vd.engineNo || "",
          model_number: vd.modelNumber || "",

          vehicle_number: vd.vehicleNumber || "",
          registration_number: regNumber,
          vehicle_num_zone_state: vd.zone || "",
          vehicle_num_lot: String(vd.lotNo || ""),
          vehicle_num_kind: vd.vehicleSymbol || "",
          vehicle_reg: vd.regSystem === "embossed" ? "e" : "y",

          billbook_number: vd.billbookNo || "",
          billbook_exp_date: vd.billbookExpiry || "",
          billbook_exp_date_nep: vd.billbookExpiryBS || "",
          billbook_front_id: billbookFrontId,
          billbook_back_id: billbookBackId,

          noclaim_year: cf.noClaimYear || "0",
          no_claim_discount_percent: "0",

          has_tailor: "n",
          tailor_amount: null,

          nep_vehicle_number: "",
          is_tmis_vehicle_register: "n",
          office_code: "",
          motor_model: "",
          motor_code: vd.motorCode || "",
          is_diplomatic: "n",
          has_schedule: "n",
        };

        const payload = {
          client_info: { Bank_Code: "1" },
          policy_info: {
            department_id: "1",
            class_id: "1",
            payment_process: "Full Payment",
            effective_date: cf.effectiveDate || "",
            expiry_date: cf.expiryDate || "",
          },
          policy_session_id: policySessionId,
          class_info: classInfo,
        };

        const resp = await createMotorPolicy(payload as CreateMotorPolicyPayload);

        const policyNo =
          resp?.policy_no || resp?.policy_number || resp?.document_number || "";
        setSuccessModal({ policyNo });

        // Clean up storage
        [
          "motor.premiumResponse",
          "motor.coverageForm",
          "motor.vehicleDetail",
          "motor.insurancePlan",
          "motor.billbookFrontName",
          "motor.billbookBackName",
        ].forEach((key) => localStorage.removeItem(key));
        ["motor.billbookFrontData", "motor.billbookBackData"].forEach((key) =>
          sessionStorage.removeItem(key),
        );
      } catch (err: any) {
        const msg =
          err?.data?.error_list?.[0]?.error_message ||
          err?.message ||
          "Failed to create motor policy";
        toast.error(msg);
      } finally {
        setSubmitLoading(false);
      }
    };

    const handleSuccessClose = () => {
      setSuccessModal(null);
      navigate("/my-draft-policy", { replace: true });
    };

    return (
      <>
        <Button
          variant="ghost"
          className="mb-4 gap-2"
          onClick={() => goToStep(4)}
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>

        <h1 className="text-2xl font-bold mb-2">Review & Submit</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Please review your details before submitting
        </p>

        {/* Success Dialog */}
        <Dialog open={!!successModal} onOpenChange={() => { }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-6 w-6" /> Policy Created!
              </DialogTitle>
            </DialogHeader>
            <div className="py-4 text-center">
              <p className="text-lg">Motor policy created successfully.</p>
              {successModal?.policyNo && (
                <p className="mt-2 font-bold">
                  Policy Number: {successModal.policyNo}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button onClick={handleSuccessClose} className="w-full">
                View My Policies
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Coverage Summary */}
          <Card>
            <CardHeader className="bg-primary/5 pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-5 w-5" /> Coverage Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <InfoRow
                label="Plan Type"
                value={localStorage.getItem("motor.insurancePlan") || "\u2014"}
              />
              {coverageForm && (
                <>
                  <InfoRow
                    label="Category"
                    value={
                      coverageForm.category === "1"
                        ? "Motorcycle"
                        : "Private Vehicle"
                    }
                  />
                  <InfoRow
                    label="Year of Manufacture"
                    value={coverageForm.yearOfManufacture}
                  />
                  <InfoRow label="CC Range" value={
                    coverageForm.selectedCcRange === "less_than_150" ? "Less than 150 CC" :
                      coverageForm.selectedCcRange === "150_to_250" ? "150 CC to 250 CC" :
                        "Above 250 CC"
                  } />
                  <InfoRow
                    label="Vehicle Cost"
                    value={`NPR ${fmt(coverageForm.vehicleCost)}`}
                  />
                  <InfoRow
                    label="Voluntary Excess"
                    value={coverageForm.voluntaryExcess}
                  />
                  <InfoRow
                    label="Effective Date"
                    value={coverageForm.effectiveDate}
                  />
                  <InfoRow
                    label="Expiry Date"
                    value={coverageForm.expiryDate}
                  />
                  <InfoRow
                    label="Claim Discount Year"
                    value={`${coverageForm.noClaimYear} Years`}
                  />
                  <InfoRow
                    label="Direct Discount"
                    value={coverageForm.directDiscount ? "Yes" : "No"}
                  />
                </>
              )}
            </CardContent>
          </Card>

          {/* Vehicle Details */}
          <Card>
            <CardHeader className="bg-primary/5 pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Car className="h-5 w-5" /> Vehicle Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {vehicleDetail ? (
                <>
                  <InfoRow
                    label="Registration"
                    value={`${vehicleDetail.zone || ""} ${vehicleDetail.lotNo || ""} ${vehicleDetail.vehicleSymbol || ""} ${vehicleDetail.vehicleNumber || ""}`.trim() || "—"}
                  />
                  <InfoRow
                    label="Manufacturer"
                    value={vehicleDetail.manufacturer}
                  />
                  <InfoRow
                    label="Vehicle Type"
                    value={vehicleDetail.vehicleType || "—"}
                  />
                  <InfoRow
                    label="Model"
                    value={vehicleDetail.modelNumber || "\u2014"}
                  />
                  <InfoRow
                    label="Chassis No"
                    value={vehicleDetail.chassisNo}
                  />
                  <InfoRow label="Engine No" value={vehicleDetail.engineNo} />
                  <InfoRow
                    label="Billbook No"
                    value={vehicleDetail.billbookNo || "\u2014"}
                  />
                  <InfoRow
                    label="Billbook Expiry"
                    value={vehicleDetail.billbookExpiry || "\u2014"}
                  />
                  <InfoRow
                    label="Registration Date"
                    value={vehicleDetail.registerDate || "\u2014"}
                  />
                </>
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No vehicle details found
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Premium Breakdown */}
        {amount && (
          <Card className="mb-8">
            <CardHeader className="bg-primary/5 pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <DollarSign className="h-5 w-5" /> Premium Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="rounded-lg overflow-hidden border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-primary text-primary-foreground">
                      <th className="text-left px-5 py-3 font-semibold">
                        Description
                      </th>
                      <th className="text-right px-5 py-3 font-semibold">
                        Amount (NPR)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-background">
                      <td className="px-5 py-3 text-muted-foreground">
                        Sum Insured
                      </td>
                      <td className="px-5 py-3 text-right font-medium">
                        {fmt(amount.suminsured)}
                      </td>
                    </tr>
                    <tr className="bg-muted/40">
                      <td className="px-5 py-3 text-muted-foreground">
                        Premium Amount
                      </td>
                      <td className="px-5 py-3 text-right font-medium">
                        {fmt(amount.premium_amount)}
                      </td>
                    </tr>
                    {Number(amount.tpl_amount) > 0 && (
                      <tr className="bg-background">
                        <td className="px-5 py-3 text-muted-foreground">
                          Third Party Liability
                        </td>
                        <td className="px-5 py-3 text-right font-medium">
                          {fmt(amount.tpl_amount)}
                        </td>
                      </tr>
                    )}
                    <tr className="bg-muted/40">
                      <td className="px-5 py-3 text-muted-foreground">
                        Taxable Amount
                      </td>
                      <td className="px-5 py-3 text-right font-medium">
                        {fmt(amount.taxable_amount)}
                      </td>
                    </tr>
                    <tr className="bg-background">
                      <td className="px-5 py-3 text-muted-foreground">
                        VAT ({amount.vat_percent}%)
                      </td>
                      <td className="px-5 py-3 text-right font-medium">
                        {fmt(amount.vat_amount)}
                      </td>
                    </tr>
                    <tr className="bg-muted/40">
                      <td className="px-5 py-3 text-muted-foreground">
                        Stamp Duty
                      </td>
                      <td className="px-5 py-3 text-right font-medium">
                        {fmt(amount.stamp_duty)}
                      </td>
                    </tr>
                    <tr className="border-t-2 bg-primary/5">
                      <td className="px-5 py-4 font-bold text-primary">
                        Total Premium
                      </td>
                      <td className="px-5 py-4 text-right font-bold text-primary text-base">
                        {fmt(amount.total_amount)}
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
          >
            <ArrowLeft className="w-4 h-4" /> BACK
          </Button>
          <Button
            size="lg"
            className="px-8 gap-2"
            disabled={submitLoading || !premiumData || !vehicleDetail}
            onClick={handleSubmit}
          >
            {submitLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" /> SUBMIT POLICY
              </>
            )}
          </Button>
        </div>
      </>
    );
  };

  /* ────────────────────────────────────────────────────────────────────────────
     RENDER — step router
     ──────────────────────────────────────────────────────────────────────────── */

  switch (currentStep) {
    case 1:
      return renderStep1();
    case 2:
      return <Step2CoveragePlan />;
    case 3:
      return renderStep3();
    case 4:
      return <Step4VehicleDetails />;
    case 5:
      return <Step5ReviewSubmit />;
    default:
      return renderStep1();
  }
};