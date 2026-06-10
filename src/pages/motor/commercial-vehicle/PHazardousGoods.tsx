// CommercialVehicle/comprehensive/PHazardousGoodsPage.tsx

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
  ArrowRight,
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
  getZoneAbbreviations,
  getZoneLotNumbers,
  getVehicleKinds,
  getEmbossedStates,
  getEmbossedLotNumbers,
  getEmbossedVehicleKinds,
  type CatalogueItem,
} from "@/api/motor/getMotorCatalogue";

import {
  type GetPremiumResponse,
  type PremiumAmountInfo,
} from "@/types/getpremium";

import { toast } from "@/components/ui/sonner";
import { adIsoToBsYMD } from "@/zod/kycSchema";

type FileState = { file: File; preview: string } | null;

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

const manufacturers = [
  "Ashok Leyland",
  "Eicher",
  "Force",
  "Hino",
  "Isuzu",
  "Mahindra",
  "Swaraj Mazda",
  "Tata",
];

const motorCodes: Record<string, string> = {
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

export default function PHazardousGoodsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const currentStep = Number(searchParams.get("step")) || 1;

  const goToStep = (step: number) => {
    setSearchParams({ step: String(step) });
  };

  const [goodCarryingCapacity, setGoodCarryingCapacity] = useState("");
  const [noOfSeats, setNoOfSeats] = useState("5");
  const helperSeatCapacity = "1";

  const [sumInsured, setSumInsured] = useState("");
  const [yearOfManufacture, setYearOfManufacture] = useState("");
  const [compulsoryExcess, setCompulsoryExcess] = useState("500");
  const [voluntaryExcess, setVoluntaryExcess] = useState("");
  const [noClaimYear, setNoClaimYear] = useState("0");
  const [directDiscount, setDirectDiscount] = useState(true);

  const [regSystem, setRegSystem] = useState("zone");
  const [zone, setZone] = useState("");
  const [lotNo, setLotNo] = useState("");
  const [vehicleSymbol, setVehicleSymbol] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [registerDate, setRegisterDate] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [modelNumber, setModelNumber] = useState("");
  const [vehicleType, setVehicleType] = useState(
    "Hazardous Goods Carrying Vehicle",
  );
  const [chassisNo, setChassisNo] = useState("");
  const [engineNo, setEngineNo] = useState("");
  const [billbookNo, setBillbookNo] = useState("");
  const [billbookExpiry, setBillbookExpiry] = useState(addOneYear(todayISO()));

  const [billbookFront, setBillbookFront] = useState<FileState>(null);
  const [billbookBack, setBillbookBack] = useState<FileState>(null);

  const frontRef = useRef<HTMLInputElement>(null);
  const backRef = useRef<HTMLInputElement>(null);

  const [zoneList, setZoneList] = useState<CatalogueItem[]>([]);
  const [zoneLotList, setZoneLotList] = useState<CatalogueItem[]>([]);
  const [kindList, setKindList] = useState<CatalogueItem[]>([]);
  const [embossedStateList, setEmbossedStateList] = useState<CatalogueItem[]>(
    [],
  );
  const [embossedLotList, setEmbossedLotList] = useState<CatalogueItem[]>([]);
  const [embossedKindList, setEmbossedKindList] = useState<CatalogueItem[]>([]);
  const [catalogueLoading, setCatalogueLoading] = useState(false);

  const [premiumData, setPremiumData] = useState<GetPremiumResponse | null>(
    null,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [inlineError, setInlineError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years: string[] = [];

    for (let year = currentYear; year >= 1985; year--) {
      years.push(String(year));
    }

    return years;
  }, []);

  useEffect(() => {
    if (currentStep < 1 || currentStep > 4) {
      setSearchParams({ step: "1" });
    }
  }, [currentStep, setSearchParams]);

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
      } catch (error: any) {
        toast.error(error?.message || "Failed to load vehicle catalogues");
      } finally {
        if (mounted) setCatalogueLoading(false);
      }
    };

    loadCatalogues();

    return () => {
      mounted = false;
    };
  }, []);

  const zoneOptions = regSystem === "embossed" ? embossedStateList : zoneList;
  const lotOptions = regSystem === "embossed" ? embossedLotList : zoneLotList;
  const kindOptions = regSystem === "embossed" ? embossedKindList : kindList;

  const motorCode = motorCodes[manufacturer] || "";

  const billbookExpiryBS = useMemo(() => {
    if (!billbookExpiry) return "";

    try {
      return adIsoToBsYMD(billbookExpiry);
    } catch {
      return "";
    }
  }, [billbookExpiry]);

  const amount: PremiumAmountInfo | undefined = premiumData?.amount_info;

  const totalPremium = getValue(amount as any, [
    "total_amount",
    "total_premium",
    "payable_amount",
  ]);

  const policySessionId = String(premiumData?.policy_session_id || "");

  const clearError = (key: string) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleNumberInput = (
    value: string,
    setter: Dispatch<SetStateAction<string>>,
    errorKey: string,
  ) => {
    const cleanValue = value.replace(/\D/g, "");
    setter(cleanValue);
    clearError(errorKey);
  };

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};

    if (!goodCarryingCapacity.trim()) {
      newErrors.goodCarryingCapacity = "Good carrying capacity is required";
    }

    if (!noOfSeats.trim()) {
      newErrors.noOfSeats = "No of seats is required";
    }

    if (!sumInsured.trim()) {
      newErrors.sumInsured = "Sum insured is required";
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
      newErrors.noClaimYear = "No claim year is required";
    }

    return newErrors;
  };

  const handleCalculatePremium = async () => {
    setInlineError("");

    const validationErrors = validateStep1();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      toast.error("Please fill all required fields");
      return;
    }

    const vehicleAge = new Date().getFullYear() - Number(yearOfManufacture);

    const passengerSeatCapacity = Math.max(
      0,
      Number(noOfSeats) - 1 - Number(helperSeatCapacity),
    );

    const payload: GetPremiumRequestCV = {
      class_id: "4",
      cover_type_id: "Comprehensive",
      is_government: "1",
      good_carrying_capacity: goodCarryingCapacity,
      engine_capcity_cc: "12",
      driver_seat_capacity: "1",
      passenger_seat_capacity: String(passengerSeatCapacity),
      conductor_helper_seat_capacity: "1",
      compulsory_excess: compulsoryExcess,
      voluntary_excess: voluntaryExcess,
      vehicle_age_in_years: String(vehicleAge),
      vehicle_suminsured_amount: sumInsured,
      calc_type: "p",
      noclaim_year: noClaimYear,
      is_tailor: "false",
      get_direct_discount: directDiscount ? "y" : "n",
      vehicle_reg: regSystem === "embossed" ? "e" : "y",
      include_towing_charge: "false",
    } as GetPremiumRequestCV;

    try {
      setLoading(true);

      localStorage.setItem("motor.vehicleType", "commercial");
      localStorage.setItem("motor.insurancePlan", "comprehensive");
      localStorage.setItem("motor.selectedCommercialCategoryId", "4");

      localStorage.setItem(
        "motor.selectedCommercialCategory",
        JSON.stringify({
          data: "4",
          value: "Commercial Vehicle Hazardous Good Carrying Policy",
          additional_value: "CV",
          title: "Hazardous Goods Carrying Policy",
          route: "/commercial-vehicle/comprehensive/hazardous-goods",
        }),
      );

      localStorage.setItem(
        "motor.comprehensiveHazardousGoodsForm",
        JSON.stringify({
          categoryId: "4",
          categoryName: "Commercial Vehicle Hazardous Good Carrying Policy",
          goodCarryingCapacity,
          noOfSeatsIncludingDriver: noOfSeats,
          driverSeatCapacity: "1",
          conductorHelperSeatCapacity: "1",
          helper: "yes",
          helperSeatCapacity: "1",
          passengerSeatCapacity: String(passengerSeatCapacity),
          sumInsured,
          yearOfManufacture,
          vehicleAge,
          compulsoryExcess,
          voluntaryExcess,
          noClaimYear,
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
      goToStep(2);
    } catch (error: any) {
      const msg = error?.message || "Failed to calculate premium";
      setInlineError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const validateStep3 = () => {
    const newErrors: Record<string, string> = {};

    if (!zone) newErrors.zone = "Zone / State code is required";
    if (!lotNo) newErrors.lotNo = "Vehicle age code is required";
    if (!vehicleSymbol) newErrors.vehicleSymbol = "Vehicle type symbol is required";

    if (!vehicleNumber.trim()) {
      newErrors.vehicleNumber = "Vehicle number is required";
    } else if (!/^\d{1,4}$/.test(vehicleNumber.trim())) {
      newErrors.vehicleNumber = "Vehicle number must be 1-4 digits";
    }

    if (!registerDate) {
      newErrors.registerDate = "Registration date is required";
    } else if (
      yearOfManufacture &&
      new Date(registerDate).getFullYear() < Number(yearOfManufacture)
    ) {
      newErrors.registerDate = `Registration date must be after manufacture year (${yearOfManufacture})`;
    }

    if (!manufacturer) newErrors.manufacturer = "Manufacture company is required";
    if (!vehicleType.trim()) newErrors.vehicleType = "Vehicle type is required";
    if (!chassisNo.trim()) newErrors.chassisNo = "Chassis no is required";
    if (!engineNo.trim()) newErrors.engineNo = "Engine no is required";
    if (!billbookNo.trim()) newErrors.billbookNo = "Billbook number is required";

    if (!billbookExpiry) {
      newErrors.billbookExpiry = "Billbook expiry date is required";
    } else if (!billbookExpiryBS) {
      newErrors.billbookExpiry = "Invalid billbook expiry date";
    }

    if (!billbookFront) {
      newErrors.billbookFront = "Billbook front image is required";
    }

    if (!billbookBack) {
      newErrors.billbookBack = "Billbook back image is required";
    }

    return newErrors;
  };

  const handleStep3Next = () => {
    const validationErrors = validateStep3();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      toast.error("Please fill vehicle details and upload billbook documents");
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
        manufactureYear: yearOfManufacture,
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

    goToStep(4);
  };

  const handleFile = (file: File, setter: (value: FileState) => void) => {
    const preview = file.type.startsWith("image/")
      ? URL.createObjectURL(file)
      : "";

    setter({ file, preview });
  };

  const clearMotorStorage = () => {
    [
      "motor.premiumResponse",
      "motor.comprehensiveHazardousGoodsForm",
      "motor.vehicleDetail",
      "motor.insurancePlan",
      "motor.vehicleType",
      "motor.selectedCommercialCategory",
      "motor.selectedCommercialCategoryId",
    ].forEach((key) => localStorage.removeItem(key));
  };

  const handleSubmitPolicy = async () => {
    if (!premiumData || !policySessionId) {
      toast.error("Premium session missing. Please calculate premium again.");
      goToStep(1);
      return;
    }

    if (!billbookFront?.file || !billbookBack?.file) {
      toast.error("Billbook front and back are required.");
      goToStep(3);
      return;
    }

    try {
      setSubmitLoading(true);

      const frontUpload = await uploadVehicleFront(
        billbookNo || "billbook",
        billbookFront.file,
      );

      if (!frontUpload?.process_result || frontUpload?.uploaded_id == null) {
        toast.error(
          frontUpload?.error_list?.[0]?.error_message ||
            "Billbook front upload failed",
        );
        return;
      }

      const backUpload = await uploadVehicleBack(
        billbookNo || "billbook",
        billbookBack.file,
      );

      if (!backUpload?.process_result || backUpload?.uploaded_id == null) {
        toast.error(
          backUpload?.error_list?.[0]?.error_message ||
            "Billbook back upload failed",
        );
        return;
      }

      const vehicleAge =
        new Date().getFullYear() -
        Number(yearOfManufacture || new Date().getFullYear());

      const regNumber = `${zone} ${lotNo} ${vehicleSymbol} ${vehicleNumber}`.trim();

      const passengerSeatCapacity = Math.max(
        0,
        Number(noOfSeats) - 1 - Number(helperSeatCapacity),
      );

      const classInfo = {
        class_id: "4",
        cover_type_id: "Comprehensive",
        is_government: "1",

        vehicle_suminsured_amount: String(sumInsured || "0"),
        item_suminsured_amount: "0",
        suminsured_amount: String(sumInsured || "0"),

        voluntary_excess: String(voluntaryExcess || "0"),
        compulsory_excess: String(compulsoryExcess || "500"),

        item_description: "",
        manufacturing_company: manufacturer,
        manufacture_year: yearOfManufacture,
        registration_date: registerDate,
        vehicle_age_in_years: String(vehicleAge),

        driver_seat_capacity: "1",
        conductor_helper_seat_capacity: "1",
        passenger_seat_capacity: String(passengerSeatCapacity),
        passanger_carrying_capacity: String(noOfSeats),

        good_carrying_capacity: String(goodCarryingCapacity),
        good_carrying_capacity_ton: String(goodCarryingCapacity),

        engine_capcity_cc: "12",

        vehicle_type: vehicleType,
        chassis_number: chassisNo,
        engine_number: engineNo,
        model_number: modelNumber,

        vehicle_number: vehicleNumber,
        registration_number: regNumber,
        vehicle_num_zone_state: zone,
        vehicle_num_lot: lotNo,
        vehicle_num_kind: vehicleSymbol,
        vehicle_reg: regSystem === "embossed" ? "e" : "y",

        billbook_number: billbookNo,
        billbook_exp_date: billbookExpiry,
        billbook_exp_date_nep: billbookExpiryBS,
        billbook_front_id: String(frontUpload.uploaded_id),
        billbook_back_id: String(backUpload.uploaded_id),

        noclaim_year: String(noClaimYear || "0"),
        no_claim_discount_percent: "0",

        has_tailor: "n",
        tailor_amount: null,

        nep_vehicle_number: "",
        is_tmis_vehicle_register: "n",
        office_code: "",
        motor_model: "",
        motor_code: motorCode,
        is_diplomatic: "n",
        has_schedule: "n",
      } as unknown as CreateMotorPolicyPayload["class_info"];

      const payload: CreateMotorPolicyPayload = {
        client_info: {
          Bank_Code: "1",
        },
        policy_info: {
          department_id: "1",
          class_id: "4",
          payment_process: "Full Payment",
          effective_date: todayISO(),
          expiry_date: addOneYear(todayISO()),
        },
        policy_session_id: String(policySessionId),
        class_info: classInfo,
      };

      console.log("Create Hazardous Goods Policy Payload:", payload);

      const response = await createMotorPolicy(payload);

      const policyNo =
        response?.policy_no ||
        response?.policy_number ||
        response?.document_number ||
        "";

      toast.success(
        policyNo
          ? `Hazardous goods policy created successfully. Policy No: ${policyNo}`
          : "Hazardous goods policy created successfully",
      );

      clearMotorStorage();
      navigate("/my-draft-policy", { replace: true });
    } catch (error: any) {
      const msg =
        error?.data?.error_list?.[0]?.error_message ||
        error?.message ||
        "Failed to create hazardous goods policy";

      toast.error(msg);
    } finally {
      setSubmitLoading(false);
    }
  };

  const renderInputError = (key: string) =>
    errors[key] ? (
      <p className="mt-1 text-xs text-red-600">{errors[key]}</p>
    ) : null;

  const renderHeader = (
    title: string,
    description: string,
    backStep?: number,
  ) => (
    <div className="mb-8 flex items-center gap-3">
      <button
        type="button"
        onClick={() =>
          backStep
            ? goToStep(backStep)
            : navigate("/commercial-vehicle/comprehensive?step=2")
        }
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-white transition hover:bg-muted"
      >
        <ChevronLeft className="h-5 w-5 text-black" />
      </button>

      <div>
        <h1 className="text-2xl font-bold text-black">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <>
      {renderHeader(
        "Hazardous Goods Carrying Policy",
        "Step 1: Fill hazardous goods vehicle details to calculate comprehensive premium.",
      )}

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
                placeholder="Enter good carrying capacity, e.g. 5"
                value={goodCarryingCapacity}
                onChange={(e) =>
                  handleNumberInput(
                    e.target.value,
                    setGoodCarryingCapacity,
                    "goodCarryingCapacity",
                  )
                }
                className={`mt-2 ${
                  errors.goodCarryingCapacity ? "border-red-500" : ""
                }`}
              />

              {renderInputError("goodCarryingCapacity")}
            </div>

            <div>
              <Label htmlFor="noOfSeats">No of Seats Including Driver *</Label>

              <Input
                id="noOfSeats"
                type="text"
                inputMode="numeric"
                placeholder="Enter seats including driver, e.g. 5"
                value={noOfSeats}
                onChange={(e) =>
                  handleNumberInput(e.target.value, setNoOfSeats, "noOfSeats")
                }
                className={`mt-2 ${errors.noOfSeats ? "border-red-500" : ""}`}
              />

              {renderInputError("noOfSeats")}
            </div>

            <div>
              <input
                type="hidden"
                name="conductor_helper_seat_capacity"
                value="1"
              />

              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <Label className="text-sm font-medium text-green-700">
                  Helper / Conductor Seat
                </Label>

                <p className="mt-2 text-sm text-green-700">
                  Helper is selected by default and conductor/helper seat capacity
                  will be sent as 1.
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="sumInsured">Sum Insured *</Label>

              <Input
                id="sumInsured"
                type="text"
                inputMode="numeric"
                placeholder="Enter vehicle sum insured, e.g. 2000000"
                value={sumInsured}
                onChange={(e) =>
                  handleNumberInput(e.target.value, setSumInsured, "sumInsured")
                }
                className={`mt-2 ${errors.sumInsured ? "border-red-500" : ""}`}
              />

              {renderInputError("sumInsured")}
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
                  className={`mt-2 ${
                    errors.yearOfManufacture ? "border-red-500" : ""
                  }`}
                >
                  <SelectValue placeholder="Select manufacture year" />
                </SelectTrigger>

                <SelectContent>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {renderInputError("yearOfManufacture")}
            </div>

            <div>
              <Label htmlFor="compulsoryExcess">Compulsory Excess *</Label>

              <Input
                id="compulsoryExcess"
                type="text"
                value={compulsoryExcess}
                onChange={(e) =>
                  handleNumberInput(
                    e.target.value,
                    setCompulsoryExcess,
                    "compulsoryExcess",
                  )
                }
                placeholder="Enter compulsory excess, e.g. 500"
                className={`mt-2 ${
                  errors.compulsoryExcess ? "border-red-500" : ""
                }`}
              />

              {renderInputError("compulsoryExcess")}
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
                  className={`mt-2 ${
                    errors.voluntaryExcess ? "border-red-500" : ""
                  }`}
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

              {renderInputError("voluntaryExcess")}
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
                  className={`mt-2 ${
                    errors.noClaimYear ? "border-red-500" : ""
                  }`}
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

              {renderInputError("noClaimYear")}
            </div>

            <div
              onClick={() => setDirectDiscount((prev) => !prev)}
              className="inline-flex cursor-pointer items-center gap-3 rounded-lg border bg-muted/30 p-4"
            >
              <Switch
                id="directDiscount"
                checked={directDiscount}
                onCheckedChange={setDirectDiscount}
                onClick={(event) => event.stopPropagation()}
              />

              <Label htmlFor="directDiscount" className="cursor-pointer">
                Direct Discount
              </Label>
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
              className="gap-2 px-8"
              disabled={loading}
              onClick={handleCalculatePremium}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Calculating...
                </>
              ) : (
                <>
                  Calculate & Next
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );

  const renderStep2 = () => (
    <>
      {renderHeader(
        "Premium Calculation Details",
        "Step 2: Review hazardous goods comprehensive premium.",
        1,
      )}

      {!premiumData || !amount ? (
        <Card>
          <CardContent className="p-6 text-sm text-red-600">
            Premium response not found. Please calculate again.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-primary text-primary-foreground">
                    <th className="px-5 py-3 text-left">Description</th>
                    <th className="px-5 py-3 text-right">Amount</th>
                  </tr>
                </thead>

                <tbody>
                  <PremiumRow label="Sum Insured" value={amount.suminsured} />
                  <PremiumRow
                    label="Premium Amount"
                    value={amount.premium_amount}
                  />
                  <PremiumRow
                    label="Pool / RSD Amount"
                    value={amount.pool_amount}
                  />
                  <PremiumRow
                    label="Direct Discount"
                    value={premiumData.direct_discount_amount ?? 0}
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

                  <tr className="bg-primary/10">
                    <td className="px-5 py-4 font-bold text-primary">
                      Total Premium
                    </td>
                    <td className="px-5 py-4 text-right font-bold text-primary">
                      NPR {fmt(totalPremium)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex justify-between">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => goToStep(1)}
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>

              <Button className="gap-2 px-8" onClick={() => goToStep(3)}>
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );

  const renderUpload = (
    label: string,
    state: FileState,
    setter: (value: FileState) => void,
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
        className={`mt-2 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 text-center transition-colors ${
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
                setter(null);
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

      {renderInputError(errorKey)}
    </div>
  );

  const renderStep3 = () => (
    <>
      {renderHeader(
        "Vehicle Details & Billbook Upload",
        "Step 3: Enter vehicle registration details and upload billbook documents.",
        2,
      )}

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
            <CatalogueSelect
              label={regSystem === "zone" ? "Zone *" : "STATE Code *"}
              value={zone}
              options={zoneOptions}
              error={errors.zone}
              placeholder="Select state"
              onChange={(value) => {
                setZone(value);
                clearError("zone");
              }}
            />

            <CatalogueSelect
              label="Vehicle Age Code *"
              value={lotNo}
              options={lotOptions}
              error={errors.lotNo}
              placeholder="Select age"
              onChange={(value) => {
                setLotNo(value);
                clearError("lotNo");
              }}
            />

            <CatalogueSelect
              label="Types of Vehicles *"
              value={vehicleSymbol}
              options={kindOptions}
              error={errors.vehicleSymbol}
              placeholder="Select type"
              onChange={(value) => {
                setVehicleSymbol(value);
                clearError("vehicleSymbol");
              }}
            />

            <div>
              <Label className="text-xs">Vehicle Number *</Label>

              <Input
                className={`mt-1 ${errors.vehicleNumber ? "border-red-500" : ""}`}
                value={vehicleNumber}
                maxLength={4}
                inputMode="numeric"
                placeholder="0001 - 9999"
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 4);
                  setVehicleNumber(value);
                  clearError("vehicleNumber");
                }}
              />

              {renderInputError("vehicleNumber")}
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
                className={`mt-2 ${errors.registerDate ? "border-red-500" : ""}`}
                value={registerDate}
                onChange={(e) => {
                  setRegisterDate(e.target.value);
                  clearError("registerDate");
                }}
              />

              {renderInputError("registerDate")}
            </div>

            <div>
              <Label>Manufacture Company *</Label>

              <Select
                value={manufacturer}
                onValueChange={(value) => {
                  setManufacturer(value);
                  clearError("manufacturer");
                }}
              >
                <SelectTrigger
                  className={`mt-2 ${
                    errors.manufacturer ? "border-red-500" : ""
                  }`}
                >
                  <SelectValue placeholder="Select manufacturer" />
                </SelectTrigger>

                <SelectContent>
                  {manufacturers.map((item) => (
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

              {renderInputError("manufacturer")}
            </div>

            <TextInput
              label="Model Number"
              value={modelNumber}
              setValue={setModelNumber}
              placeholder="Enter model number, e.g. 407"
            />

            <TextInput
              label="Vehicle Type *"
              value={vehicleType}
              setValue={setVehicleType}
              placeholder="Enter vehicle type"
              error={errors.vehicleType}
              onClear={() => clearError("vehicleType")}
            />

            <TextInput
              label="Chassis No *"
              value={chassisNo}
              setValue={setChassisNo}
              placeholder="Enter chassis number"
              error={errors.chassisNo}
              onClear={() => clearError("chassisNo")}
            />

            <TextInput
              label="Engine No *"
              value={engineNo}
              setValue={setEngineNo}
              placeholder="Enter engine number"
              error={errors.engineNo}
              onClear={() => clearError("engineNo")}
            />

            <TextInput
              label="Billbook Number *"
              value={billbookNo}
              setValue={setBillbookNo}
              placeholder="Enter billbook number"
              error={errors.billbookNo}
              onClear={() => clearError("billbookNo")}
            />

            <div>
              <Label>Billbook Expiry Date (AD) *</Label>

              <Input
                type="date"
                className={`mt-2 ${
                  errors.billbookExpiry ? "border-red-500" : ""
                }`}
                value={billbookExpiry}
                min={todayISO()}
                onChange={(e) => {
                  setBillbookExpiry(e.target.value);
                  clearError("billbookExpiry");
                }}
              />

              {renderInputError("billbookExpiry")}
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
          <Label className="mb-4 block text-base font-semibold">
            Billbook Documents *
          </Label>

          <div className="grid gap-4 md:grid-cols-2">
            {renderUpload(
              "Billbook Front *",
              billbookFront,
              setBillbookFront,
              frontRef as React.RefObject<HTMLInputElement>,
              "billbookFront",
            )}

            {renderUpload(
              "Billbook Back *",
              billbookBack,
              setBillbookBack,
              backRef as React.RefObject<HTMLInputElement>,
              "billbookBack",
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" className="gap-2" onClick={() => goToStep(2)}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <Button size="lg" className="px-8" onClick={handleStep3Next}>
          Next
        </Button>
      </div>
    </>
  );

  const renderStep4 = () => (
    <>
      {renderHeader(
        "Review & Submit",
        "Step 4: Review hazardous goods policy details and create policy.",
        3,
      )}

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="bg-primary/5 pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-5 w-5" />
              Premium Input Summary
            </CardTitle>
          </CardHeader>

          <CardContent className="pt-4">
            <InfoRow
              label="Category"
              value="Commercial Vehicle Hazardous Goods Carrying Policy"
            />
            <InfoRow
              label="Good Carrying Capacity"
              value={`${goodCarryingCapacity} Ton`}
            />
            <InfoRow label="No of Seats" value={noOfSeats} />
            <InfoRow label="Helper" value="Yes" />
            <InfoRow label="Conductor / Helper Seat Capacity" value="1" />
            <InfoRow label="Sum Insured" value={`NPR ${fmt(sumInsured)}`} />
            <InfoRow label="Year of Manufacture" value={yearOfManufacture} />
            <InfoRow label="Voluntary Excess" value={voluntaryExcess} />
            <InfoRow label="No Claim Year" value={`${noClaimYear} Year`} />
            <InfoRow
              label="Direct Discount"
              value={directDiscount ? "Yes" : "No"}
            />
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
            <InfoRow
              label="Registration"
              value={`${zone} ${lotNo} ${vehicleSymbol} ${vehicleNumber}`}
            />
            <InfoRow label="Manufacturer" value={manufacturer} />
            <InfoRow label="Manufacture Year" value={yearOfManufacture} />
            <InfoRow label="Vehicle Type" value={vehicleType} />
            <InfoRow label="Model" value={modelNumber || "—"} />
            <InfoRow label="Chassis No" value={chassisNo} />
            <InfoRow label="Engine No" value={engineNo} />
            <InfoRow label="Billbook No" value={billbookNo} />
            <InfoRow label="Billbook Expiry AD" value={billbookExpiry} />
            <InfoRow label="Billbook Expiry BS" value={billbookExpiryBS} />
            <InfoRow label="Registration Date" value={registerDate} />
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
                <tbody>
                  <PremiumRow label="Sum Insured" value={amount.suminsured} />
                  <PremiumRow
                    label="Premium Amount"
                    value={amount.premium_amount}
                  />
                  <PremiumRow
                    label="Pool / RSD Amount"
                    value={amount.pool_amount}
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

                  <tr className="bg-primary/10">
                    <td className="px-5 py-4 font-bold text-primary">
                      Total Premium
                    </td>
                    <td className="px-5 py-4 text-right font-bold text-primary">
                      NPR {fmt(totalPremium)}
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
          onClick={() => goToStep(3)}
          disabled={submitLoading}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <Button
          size="lg"
          className="gap-2 px-8"
          disabled={submitLoading || !premiumData}
          onClick={handleSubmitPolicy}
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

  return (
    <div className="flex min-h-screen w-full bg-muted/30">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-h-screen flex-1 flex-col">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 md:p-6">
          <div className="mx-auto max-w-6xl">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
          </div>
        </main>
      </div>
    </div>
  );
}

function CatalogueSelect({
  label,
  value,
  options,
  error,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  options: CatalogueItem[];
  error?: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>

      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className={`mt-1 ${error ? "border-red-500" : ""}`}>
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

      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function TextInput({
  label,
  value,
  setValue,
  placeholder,
  error,
  onClear,
}: {
  label: string;
  value: string;
  setValue: Dispatch<SetStateAction<string>>;
  placeholder: string;
  error?: string;
  onClear?: () => void;
}) {
  return (
    <div>
      <Label>{label}</Label>

      <Input
        className={`mt-2 ${error ? "border-red-500" : ""}`}
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          setValue(e.target.value);
          onClear?.();
        }}
      />

      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function PremiumRow({
  label,
  value,
  isLess = false,
}: {
  label: string;
  value: number | string | null | undefined;
  isLess?: boolean;
}) {
  return (
    <tr className="border-b bg-background last:border-b-0">
      <td
        className={`px-5 py-3 ${
          isLess ? "text-red-600" : "text-muted-foreground"
        }`}
      >
        {isLess ? `Less : ${label}` : label}
      </td>

      <td
        className={`px-5 py-3 text-right font-medium ${
          isLess ? "text-red-600" : ""
        }`}
      >
        NPR {fmt(value)}
      </td>
    </tr>
  );
}