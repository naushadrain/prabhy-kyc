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

const CATEGORIES = [
  { value: "1", label: "Motorcycle" },
  { value: "2", label: "Scooter" },
];

const CC_OPTIONS = [
  { value: "less_than_150", label: "Less than 150 CC", cc_value: "100" },
  { value: "150_to_250", label: "150 CC to 250 CC", cc_value: "200" },
  { value: "above_250", label: "Above 250 CC", cc_value: "300" },
];

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

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

function addOneYear(dateISO: string): string {
  const d = new Date(dateISO);
  d.setFullYear(d.getFullYear() + 1);
  d.setDate(d.getDate() - 1);

  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

function getYearOptions(startYear = 1990): string[] {
  const currentYear = new Date().getFullYear();
  const years: string[] = [];

  for (let y = currentYear; y >= startYear; y--) {
    years.push(String(y));
  }

  return years;
}

const fmt = (v: number | string | undefined | null) => {
  const n = Number(v ?? 0);

  if (!Number.isFinite(n)) return "—";

  return n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-2 border-b last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right">{value ?? "—"}</span>
    </div>
  );
}

type FileState = { file: File; preview: string } | null;

export const TwoWhellerThirdPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentStep = Number(searchParams.get("step")) || 2;

  const goToStep = useCallback(
    (step: number) => {
      setSearchParams({ step: String(step) });
    },
    [setSearchParams],
  );

  const Step2CoveragePlan = () => {
    const savedCoverage = useMemo(() => {
      try {
        return JSON.parse(localStorage.getItem("motor.coverageForm") || "null");
      } catch {
        return null;
      }
    }, []);

    const [category, setCategory] = useState<string>(savedCoverage?.category || "");
    const [yearOfManufacture, setYearOfManufacture] = useState<string>(
      savedCoverage?.yearOfManufacture || "",
    );
    const [selectedCcRange, setSelectedCcRange] = useState<string>(
      savedCoverage?.selectedCcRange || "",
    );
    const [effectiveDate, setEffectiveDate] = useState<string>(
      savedCoverage?.effectiveDate || todayISO(),
    );
    const [directDiscount, setDirectDiscount] = useState<boolean>(
      savedCoverage?.directDiscount ?? true,
    );
    const [loading, setLoading] = useState(false);
    const [inlineError, setInlineError] = useState<string | null>(null);

    const manufactureYearOptions = useMemo(() => getYearOptions(1990), []);

    const expiryDate = useMemo(
      () => (effectiveDate ? addOneYear(effectiveDate) : ""),
      [effectiveDate],
    );

    const ccValue = useMemo(() => {
      return CC_OPTIONS.find((opt) => opt.value === selectedCcRange)?.cc_value || "";
    }, [selectedCcRange]);

    const isFormValid =
      !!category && !!yearOfManufacture && !!selectedCcRange && !!effectiveDate;

    const handleCalculate = async () => {
      setInlineError(null);

      if (!isFormValid) {
        const msg = "Please fill all required fields";
        setInlineError(msg);
        toast.error(msg);
        return;
      }

      const currentYear = new Date().getFullYear();
      const vehicleAge = Math.max(1, currentYear - Number(yearOfManufacture));

      const payload: GetPremiumRequestPV = {
        class_id: "1",
        cover_type_id: "Third Party",
        is_government: "1",
        engine_capcity_cc: ccValue,
        driver_seat_capacity: "1",
        passenger_seat_capacity: "1",
        passanger_carrying_capacity: "2",
        compulsory_excess: "500",
        voluntary_excess: "500",
        vehicle_age_in_years: String(vehicleAge),
        vehicle_suminsured_amount: "0",
        calc_type: "p",
        noclaim_year: "0",
        is_tailor: "false",
        get_direct_discount: directDiscount ? "y" : "n",
        tailor_amount: "546",
      };

      try {
        setLoading(true);

        const resp = await getMotorPremiumPV(payload);

        if (resp?.process_result === false) {
          const msg =
            resp?.error_list?.[0]?.error_message || "Failed to calculate premium";
          setInlineError(msg);
          toast.error(msg);
          return;
        }

        localStorage.setItem("motor.premiumResponse", JSON.stringify(resp));
        localStorage.setItem("motor.insurancePlan", "third-party");
        localStorage.setItem(
          "motor.coverageForm",
          JSON.stringify({
            category,
            yearOfManufacture,
            selectedCcRange,
            ccValue,
            vehicleCost: "0",
            voluntaryExcess: "500",
            effectiveDate,
            expiryDate,
            noClaimYear: "0",
            coverStrikeDamage: false,
            directDiscount,
          }),
        );

        goToStep(3);
      } catch (err: any) {
        let msg = "Failed to calculate premium";

        try {
          msg = JSON.parse(err?.message || "")?.error_list?.[0]?.error_message || msg;
        } catch {
          msg = err?.message || msg;
        }

        setInlineError(msg);
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
          onClick={() => navigate("/two-wheeler")}
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </Button>

        <h1 className="text-2xl font-bold mb-2">Coverage Plan — Third Party</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Fill in your vehicle details to get an instant quote
        </p>

        <Card className="mb-8">
          <CardContent className="pt-6 space-y-5">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select value={category} onValueChange={setCategory}>
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
                <Label htmlFor="yearOfManufacture">Year Of Manufacture *</Label>
                <Select
                  value={yearOfManufacture}
                  onValueChange={setYearOfManufacture}
                >
                  <SelectTrigger id="yearOfManufacture" className="mt-2">
                    <SelectValue placeholder="Select manufacture year" />
                  </SelectTrigger>
                  <SelectContent>
                    {manufactureYearOptions.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ccRange">Cubic Capacity *</Label>
                <Select value={selectedCcRange} onValueChange={setSelectedCcRange}>
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
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Expiry Date</Label>
                <Input type="date" className="mt-2" value={expiryDate} disabled />
              </div>

              <div className="flex items-center gap-3 pt-6">
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

            {inlineError && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{inlineError}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => navigate("/two-wheeler")}
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
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
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

  const renderStep3 = () => {
    const premiumData = (() => {
      try {
        return JSON.parse(localStorage.getItem("motor.premiumResponse") || "null");
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
          ...(Number(premiumData.direct_discount_amount || 0) > 0
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
        <Button variant="ghost" className="mb-4 gap-2" onClick={() => goToStep(2)}>
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
                      <tr key={i} className={i % 2 === 0 ? "bg-background" : "bg-muted/40"}>
                        <td className="px-5 py-3 text-muted-foreground">
                          {row.description}
                        </td>
                        <td
                          className={`px-5 py-3 text-right font-medium ${
                            row.amount.startsWith("-") ? "text-red-600" : ""
                          }`}
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
              <h2 className="text-base font-semibold mb-3">Premium Breakdown</h2>
              <div className="rounded-lg overflow-hidden border">
                <table className="w-full text-sm">
                  <tbody>
                    <tr className="bg-background">
                      <td className="px-5 py-3 text-muted-foreground">Net Premium</td>
                      <td className="px-5 py-3 text-right">
                        {fmt(amount.premium_amount)}
                      </td>
                    </tr>
                    <tr className="bg-muted/40">
                      <td className="px-5 py-3 text-muted-foreground">Taxable Amount</td>
                      <td className="px-5 py-3 text-right">
                        {fmt(amount.taxable_amount)}
                      </td>
                    </tr>
                    <tr className="bg-background">
                      <td className="px-5 py-3 text-muted-foreground">
                        VAT ({amount.vat_percent}%)
                      </td>
                      <td className="px-5 py-3 text-right">{fmt(amount.vat_amount)}</td>
                    </tr>
                    <tr className="bg-muted/40">
                      <td className="px-5 py-3 text-muted-foreground">Stamp Duty</td>
                      <td className="px-5 py-3 text-right">{fmt(amount.stamp_duty)}</td>
                    </tr>
                    {Number(amount.pa_amount || 0) > 0 && (
                      <tr className="bg-background">
                        <td className="px-5 py-3 text-muted-foreground">PA Amount</td>
                        <td className="px-5 py-3 text-right">{fmt(amount.pa_amount)}</td>
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
          <Button variant="outline" className="gap-2" onClick={() => goToStep(2)}>
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>

          {hasData && (
            <Button size="lg" className="px-6" onClick={() => goToStep(4)}>
              Next
            </Button>
          )}
        </div>
      </>
    );
  };

  const Step4VehicleDetails = () => {
    const savedVehicle = useMemo(() => {
      try {
        return JSON.parse(localStorage.getItem("motor.vehicleDetail") || "null");
      } catch {
        return null;
      }
    }, []);

    const savedCoverage = useMemo(() => {
      try {
        return JSON.parse(localStorage.getItem("motor.coverageForm") || "null");
      } catch {
        return null;
      }
    }, []);

    const manufactureYearOptions = useMemo(() => getYearOptions(1990), []);

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
    const [manufactureYear, setManufactureYear] = useState<string>(
      savedVehicle?.manufactureYear || savedCoverage?.yearOfManufacture || "",
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
    const [engineNo, setEngineNo] = useState<string>(savedVehicle?.engineNo || "");
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

    const [zoneList, setZoneList] = useState<CatalogueItem[]>([]);
    const [zoneLotList, setZoneLotList] = useState<CatalogueItem[]>([]);
    const [kindList, setKindList] = useState<CatalogueItem[]>([]);
    const [embossedStateList, setEmbossedStateList] = useState<CatalogueItem[]>([]);
    const [embossedLotList, setEmbossedLotList] = useState<CatalogueItem[]>([]);
    const [embossedKindList, setEmbossedKindList] = useState<CatalogueItem[]>([]);
    const [catalogueLoading, setCatalogueLoading] = useState(false);

    const registrationMinDate = useMemo(() => {
      return manufactureYear ? `${manufactureYear}-01-01` : "";
    }, [manufactureYear]);

    const registrationMaxDate = useMemo(() => todayISO(), []);

    const billbookExpiryBS = useMemo(() => {
      if (!billbookExpiry) return "";

      try {
        return adIsoToBsYMD(billbookExpiry);
      } catch {
        return "";
      }
    }, [billbookExpiry]);

    const motorCode = MOTOR_CODES[manufacturer] || "";

    const zoneOptions = regSystem === "embossed" ? embossedStateList : zoneList;
    const lotOptions = regSystem === "embossed" ? embossedLotList : zoneLotList;
    const kindOptions = regSystem === "embossed" ? embossedKindList : kindList;

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

          setZoneList(zones);
          setZoneLotList(zoneLots);
          setKindList(kinds);
          setEmbossedStateList(eStates);
          setEmbossedLotList(eLots);
          setEmbossedKindList(eKinds);
        } catch (e) {
          console.error("Failed to load motor catalogues:", e);
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
      const restoreFile = async (
        dataKey: string,
        nameKey: string,
        setter: (v: FileState) => void,
      ) => {
        const data = sessionStorage.getItem(dataKey);
        const name = localStorage.getItem(nameKey);

        if (!data || !name) return;

        try {
          const blob = await fetch(data).then((r) => r.blob());
          const file = new File([blob], name, { type: blob.type });

          setter({
            file,
            preview: blob.type.startsWith("image/") ? data : "",
          });
        } catch {
          // ignore restore error
        }
      };

      restoreFile("motor.billbookFrontData", "motor.billbookFrontName", setBlueBookFront);
      restoreFile("motor.billbookBackData", "motor.billbookBackName", setBlueBookBack);
    }, []);

    useEffect(() => {
      if (registerDate && registrationMinDate && registerDate < registrationMinDate) {
        setRegisterDate("");
        setErrors((p) => ({
          ...p,
          registerDate: `Registration Date must be from ${manufactureYear} to present only`,
        }));
      }
    }, [manufactureYear, registerDate, registrationMinDate]);

    const clearError = (key: string) => {
      setErrors((p) => {
        const n = { ...p };
        delete n[key];
        return n;
      });
    };

    const handleFile = (file: File, setter: (v: FileState) => void) => {
      const preview = file.type.startsWith("image/") ? URL.createObjectURL(file) : "";
      setter({ file, preview });
    };

    const removeFile = (setter: (v: FileState) => void) => setter(null);

    const validate = (): boolean => {
      const errs: Record<string, string> = {};

      if (!zone) errs.zone = "Zone is required";
      if (!lotNo) errs.lotNo = "Vehicle Age Code is required";
      if (!vehicleSymbol) errs.vehicleSymbol = "Vehicle Symbol is required";

      if (!vehicleNumber.trim()) {
        errs.vehicleNumber = "Vehicle Number is required";
      } else if (!/^\d{1,4}$/.test(vehicleNumber.trim())) {
        errs.vehicleNumber = "Vehicle Number must be 1-4 digits";
      }

      if (!manufactureYear) errs.manufactureYear = "Manufacture Year is required";
      if (!manufacturer) errs.manufacturer = "Manufacture Company is required";
      if (!vehicleType) errs.vehicleType = "Vehicle Type is required";
      if (!chassisNo.trim()) errs.chassisNo = "Chassis No is required";
      if (!engineNo.trim()) errs.engineNo = "Engine No is required";
      if (!billbookNo.trim()) errs.billbookNo = "Billbook Number is required";

      if (!registerDate) {
        errs.registerDate = "Registration Date is required";
      } else if (!/^\d{4}-\d{2}-\d{2}$/.test(registerDate)) {
        errs.registerDate = "Date must be in yyyy-MM-dd format";
      } else if (registrationMinDate && registerDate < registrationMinDate) {
        errs.registerDate = `Registration Date must be from ${manufactureYear} to present only`;
      } else if (registerDate > registrationMaxDate) {
        errs.registerDate = "Registration Date cannot be a future date";
      }

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
          manufactureYear,
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

      if (blueBookFront?.file) {
        localStorage.setItem("motor.billbookFrontName", blueBookFront.file.name);
      }

      if (blueBookBack?.file) {
        localStorage.setItem("motor.billbookBackName", blueBookBack.file.name);
      }

      const storeFile = (file: File, key: string) => {
        const reader = new FileReader();
        reader.onload = () => {
          sessionStorage.setItem(key, reader.result as string);
        };
        reader.readAsDataURL(file);
      };

      if (blueBookFront?.file) storeFile(blueBookFront.file, "motor.billbookFrontData");
      if (blueBookBack?.file) storeFile(blueBookBack.file, "motor.billbookBackData");

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
            const file = e.target.files?.[0];

            if (file) {
              handleFile(file, setter);
              clearError(errorKey);
            }

            e.target.value = "";
          }}
        />

        <div
          className={`mt-2 flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
            state
              ? "border-green-400 bg-green-50"
              : errors[errorKey]
                ? "border-red-400 bg-red-50/30"
                : "border-border hover:border-primary/50 hover:bg-muted/30"
          }`}
          onClick={() => ref.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();

            const file = e.dataTransfer.files?.[0];

            if (file) {
              handleFile(file, setter);
              clearError(errorKey);
            }
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
        <Button variant="ghost" className="mb-4 gap-2" onClick={() => goToStep(3)}>
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>

        <h1 className="text-2xl font-bold mb-2">Vehicle Details</h1>
        <p className="text-sm text-muted-foreground mb-4">
          Enter your vehicle registration and details
        </p>

        <div className="mb-6 flex justify-center">
          <div className="w-full max-w-md rounded-lg overflow-hidden border-4 border-blue-700">
            <div className="bg-white flex items-center justify-center gap-4 px-6 py-5">
              <span className="text-4xl font-black text-black">{zone || "—"}</span>
              <span className="text-3xl font-bold text-blue-700">{lotNo || "—"}</span>
              <span className="text-3xl font-bold text-black">
                {vehicleSymbol || "—"}
              </span>
              <span className="text-4xl font-black text-black tracking-widest">
                {vehicleNumber || "----"}
              </span>
            </div>

            <div className="grid grid-cols-4 bg-blue-700 text-white text-[9px] text-center py-1">
              <span>State Code</span>
              <span>Age Identifier</span>
              <span>Vehicle Type</span>
              <span>Vehicle Number</span>
            </div>
          </div>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6 space-y-5">
            <div>
              <Label className="flex items-center gap-2 mb-3">
                Choose Registration System{" "}
                <Info className="w-4 h-4 text-muted-foreground" />
              </Label>

              <RadioGroup
                value={regSystem}
                onValueChange={(v) => {
                  setRegSystem(v);
                  setZone("");
                  setLotNo("");
                  setVehicleSymbol("");
                }}
                className="flex flex-wrap gap-6"
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

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-xs">
                  {regSystem === "zone" ? "Zone *" : "STATE Code *"}
                </Label>

                <Select
                  value={zone}
                  onValueChange={(v) => {
                    setZone(v);
                    clearError("zone");
                  }}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder={catalogueLoading ? "Loading..." : "Select"} />
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
                  onValueChange={(v) => {
                    setLotNo(v);
                    clearError("lotNo");
                  }}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder={catalogueLoading ? "Loading..." : "Select"} />
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
                  onValueChange={(v) => {
                    setVehicleSymbol(v);
                    clearError("vehicleSymbol");
                  }}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder={catalogueLoading ? "Loading..." : "Select"} />
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
                    clearError("vehicleNumber");
                  }}
                  placeholder="0001 - 9999"
                />

                {fieldError("vehicleNumber")}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardContent className="pt-6 space-y-5">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Manufacture Year *</Label>

                <Select
                  value={manufactureYear}
                  onValueChange={(v) => {
                    setManufactureYear(v);

                    if (registerDate && registerDate < `${v}-01-01`) {
                      setRegisterDate("");
                    }

                    clearError("manufactureYear");
                    clearError("registerDate");
                  }}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select manufacture year" />
                  </SelectTrigger>
                  <SelectContent>
                    {manufactureYearOptions.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {fieldError("manufactureYear")}
              </div>

              <div>
                <Label>Registration Date *</Label>

                <Input
                  type="date"
                  className="mt-2"
                  value={registerDate}
                  min={registrationMinDate}
                  max={registrationMaxDate}
                  disabled={!manufactureYear}
                  onChange={(e) => {
                    const value = e.target.value;
                    setRegisterDate(value);

                    setErrors((p) => {
                      const n = { ...p };
                      delete n.registerDate;

                      if (registrationMinDate && value < registrationMinDate) {
                        n.registerDate = `Registration Date must be from ${manufactureYear} to present only`;
                      } else if (value > registrationMaxDate) {
                        n.registerDate = "Registration Date cannot be a future date";
                      }

                      return n;
                    });
                  }}
                />

                {manufactureYear && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Allowed registration date: {manufactureYear} to present
                  </p>
                )}

                {fieldError("registerDate")}
              </div>

              <div>
                <Label>Manufacture Company *</Label>

                <Select
                  value={manufacturer}
                  onValueChange={(v) => {
                    setManufacturer(v);
                    clearError("manufacturer");
                  }}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select company" />
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

              <div>
                <Label>Model Number</Label>
                <Input
                  className="mt-2"
                  value={modelNumber}
                  onChange={(e) => setModelNumber(e.target.value)}
                  placeholder="e.g. Pulsar"
                />
              </div>

              <div>
                <Label>Vehicle Type *</Label>

                <Select
                  value={vehicleType}
                  onValueChange={(v) => {
                    setVehicleType(v);
                    clearError("vehicleType");
                  }}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select vehicle type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Motorcycle">Motorcycle</SelectItem>
                    <SelectItem value="Scooter">Scooter</SelectItem>
                    <SelectItem value="Electric Bike">Electric Bike</SelectItem>
                  </SelectContent>
                </Select>

                {fieldError("vehicleType")}
              </div>

              <div>
                <Label>Chassis No *</Label>

                <Input
                  className="mt-2"
                  value={chassisNo}
                  onChange={(e) => {
                    setChassisNo(e.target.value);
                    clearError("chassisNo");
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
                    clearError("engineNo");
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
                    clearError("billbookNo");
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
                    clearError("billbookExpiry");
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
          <Button variant="outline" className="gap-2" onClick={() => goToStep(3)}>
            <ArrowLeft className="w-4 h-4" /> BACK
          </Button>

          <Button size="lg" className="px-8" onClick={handleNext}>
            NEXT
          </Button>
        </div>
      </>
    );
  };

  const Step5ReviewSubmit = () => {
    const [submitLoading, setSubmitLoading] = useState(false);
    const [successModal, setSuccessModal] = useState<{ policyNo?: string } | null>(
      null,
    );

    const coverageForm = useMemo(() => {
      try {
        return JSON.parse(localStorage.getItem("motor.coverageForm") || "null");
      } catch {
        return null;
      }
    }, []);

    const premiumData = useMemo(() => {
      try {
        return JSON.parse(localStorage.getItem("motor.premiumResponse") || "null");
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
      const mfgYear = Number(vd.manufactureYear || cf.yearOfManufacture);
      const vehicleAge = mfgYear > 0 ? Math.max(1, currentYear - mfgYear) : 1;
      const regNumber = `${vd.zone} ${vd.vehicleSymbol} ${vd.lotNo} ${vd.vehicleNumber}`;

      try {
        setSubmitLoading(true);

        let billbookFrontId = "";
        let billbookBackId = "";

        const frontData = sessionStorage.getItem("motor.billbookFrontData");
        const backData = sessionStorage.getItem("motor.billbookBackData");

        if (frontData) {
          const blob = await fetch(frontData).then((r) => r.blob());
          const file = new File([blob], "billbook_front.jpg", { type: blob.type });
          const res = await uploadVehicleFront(vd.billbookNo || "billbook", file);

          if (res.process_result && res.uploaded_id != null) {
            billbookFrontId = String(res.uploaded_id);
          } else {
            toast.error(
              res.error_list?.[0]?.error_message || "Billbook front upload failed",
            );
            return;
          }
        }

        if (backData) {
          const blob = await fetch(backData).then((r) => r.blob());
          const file = new File([blob], "billbook_back.jpg", { type: blob.type });
          const res = await uploadVehicleBack(vd.billbookNo || "billbook", file);

          if (res.process_result && res.uploaded_id != null) {
            billbookBackId = String(res.uploaded_id);
          } else {
            toast.error(
              res.error_list?.[0]?.error_message || "Billbook back upload failed",
            );
            return;
          }
        }

        const classInfo = {
          class_id: "1",
          cover_type_id: "Third Party",
          is_government: "1",

          vehicle_suminsured_amount: 0,
          item_suminsured_amount: 0,
          suminsured_amount: 0,

          voluntary_excess: Number(cf.voluntaryExcess || 500),
          compulsory_excess: 500,

          item_description: "",
          manufacturing_company: vd.manufacturer || "",
          manufacture_year: vd.manufactureYear || cf.yearOfManufacture || "",
          registration_date: vd.registerDate || "",
          vehicle_age_in_years: vehicleAge,

          driver_seat_capacity: 1,
          conductor_helper_seat_capacity: 0,
          passenger_seat_capacity: 1,
          passanger_carrying_capacity: 2,

          good_carrying_capacity: 0,
          engine_capcity_cc: cf.ccValue || "100",

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
        <Button variant="ghost" className="mb-4 gap-2" onClick={() => goToStep(4)}>
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>

        <h1 className="text-2xl font-bold mb-2">Review & Submit</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Please review your details before submitting
        </p>

        <Dialog open={!!successModal} onOpenChange={() => {}}>
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
          <Card>
            <CardHeader className="bg-primary/5 pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-5 w-5" /> Coverage Summary
              </CardTitle>
            </CardHeader>

            <CardContent className="pt-4">
              <InfoRow
                label="Plan Type"
                value={localStorage.getItem("motor.insurancePlan") || "—"}
              />

              {coverageForm && (
                <>
                  <InfoRow
                    label="Category"
                    value={
                      coverageForm.category === "1"
                        ? "Motorcycle"
                        : coverageForm.category === "2"
                          ? "Scooter"
                          : "—"
                    }
                  />
                  <InfoRow
                    label="Year of Manufacture"
                    value={coverageForm.yearOfManufacture}
                  />
                  <InfoRow
                    label="CC Range"
                    value={
                      coverageForm.selectedCcRange === "less_than_150"
                        ? "Less than 150 CC"
                        : coverageForm.selectedCcRange === "150_to_250"
                          ? "150 CC to 250 CC"
                          : "Above 250 CC"
                    }
                  />
                  <InfoRow label="Effective Date" value={coverageForm.effectiveDate} />
                  <InfoRow label="Expiry Date" value={coverageForm.expiryDate} />
                  <InfoRow
                    label="Direct Discount"
                    value={coverageForm.directDiscount ? "Yes" : "No"}
                  />
                </>
              )}
            </CardContent>
          </Card>

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
                    value={
                      `${vehicleDetail.zone || ""} ${vehicleDetail.lotNo || ""} ${
                        vehicleDetail.vehicleSymbol || ""
                      } ${vehicleDetail.vehicleNumber || ""}`.trim() || "—"
                    }
                  />
                  <InfoRow
                    label="Manufacture Year"
                    value={vehicleDetail.manufactureYear || coverageForm?.yearOfManufacture}
                  />
                  <InfoRow
                    label="Manufacturer"
                    value={vehicleDetail.manufacturer || "—"}
                  />
                  <InfoRow
                    label="Vehicle Type"
                    value={vehicleDetail.vehicleType || "—"}
                  />
                  <InfoRow label="Model" value={vehicleDetail.modelNumber || "—"} />
                  <InfoRow label="Chassis No" value={vehicleDetail.chassisNo || "—"} />
                  <InfoRow label="Engine No" value={vehicleDetail.engineNo || "—"} />
                  <InfoRow
                    label="Billbook No"
                    value={vehicleDetail.billbookNo || "—"}
                  />
                  <InfoRow
                    label="Billbook Expiry"
                    value={vehicleDetail.billbookExpiry || "—"}
                  />
                  <InfoRow
                    label="Registration Date"
                    value={vehicleDetail.registerDate || "—"}
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
                  <tbody>
                    <tr className="bg-background">
                      <td className="px-5 py-3 text-muted-foreground">Sum Insured</td>
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
                      <td className="px-5 py-3 text-muted-foreground">Stamp Duty</td>
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
          <Button variant="outline" className="gap-2" onClick={() => goToStep(4)}>
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

  switch (currentStep) {
    case 2:
      return <Step2CoveragePlan />;
    case 3:
      return renderStep3();
    case 4:
      return <Step4VehicleDetails />;
    case 5:
      return <Step5ReviewSubmit />;
    default:
      return <Step2CoveragePlan />;
  }
};