// CommercialVehicle/thirdparty/pages/TTempoErikshawPage.tsx

import { useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  getMotorPremiumCV,
  type GetPremiumRequestCV,
} from "@/api/motor/getpremium";

import { GetPremiumResponse, PremiumAmountInfo } from "@/types/getpremium";
import { toast } from "@/components/ui/sonner";

type RowType = "normal" | "section" | "total";

type PremiumRow = {
  key: string;
  label: string;
  value?: number | string | null;
  type?: RowType;
};

const ccOptions = [
  {
    label: "Up to 350 CC",
    value: "up_to_350",
    apiValue: "350",
  },
  {
    label: "Above 350 CC",
    value: "above_350",
    apiValue: "400",
  },
];

const seatOptions = [
  { label: "1 Seat", value: "1" },
  { label: "2 Seats", value: "2" },
  { label: "3 Seats", value: "3" },
  { label: "4 Seats", value: "4" },
  { label: "5 Seats", value: "5" },
  { label: "6 Seats", value: "6" },
];

const yesNoOptions = [
  { label: "Yes", value: "yes" },
  { label: "No", value: "no" },
];

const fmt = (value: number | string | null | undefined) => {
  const cleanValue = String(value ?? "0").replace(/,/g, "");
  const num = Number(cleanValue);

  if (!Number.isFinite(num)) return "0.00";

  return num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const safeValue = (value: unknown, fallback: number | string = 0) => {
  if (value !== undefined && value !== null && value !== "") {
    if (typeof value === "string" || typeof value === "number") {
      return value;
    }
  }

  return fallback;
};

export default function TTempoErikshawPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2>(1);

  const [vehicleCc, setVehicleCc] = useState("");
  const [noOfSeats, setNoOfSeats] = useState("5");
  const [helper, setHelper] = useState("no");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);

  const [premiumData, setPremiumData] = useState<GetPremiumResponse | null>(
    null,
  );

  const selectedCcOption = useMemo(() => {
    return ccOptions.find((item) => item.value === vehicleCc);
  }, [vehicleCc]);

  const clearError = (name: string) => {
    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!vehicleCc) {
      newErrors.vehicleCc = "Vehicle CC is required";
    }

    if (!noOfSeats) {
      newErrors.noOfSeats = "No of seats including driver is required";
    }

    if (!helper) {
      newErrors.helper = "Helper is required";
    }

    return newErrors;
  };

  const handleCalculate = async () => {
    setInlineError(null);

    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      toast.error("Please fill all required fields");
      return;
    }

    const helperSeatCapacity = helper === "yes" ? "1" : "0";

    const passengerSeatCapacity = Math.max(
      0,
      Number(noOfSeats) - 1 - Number(helperSeatCapacity),
    );

    const payload: GetPremiumRequestCV = {
      class_id: "7",
      cover_type_id: "Third Party",
      is_government: "1",
      good_carrying_capacity: null,
      engine_capcity_cc: selectedCcOption?.apiValue || "350",
      driver_seat_capacity: "1",
      passenger_seat_capacity: String(passengerSeatCapacity),
      conductor_helper_seat_capacity: helperSeatCapacity,
      compulsory_excess: "0",
      voluntary_excess: "0",
      vehicle_age_in_years: "0",
      vehicle_suminsured_amount: "0",
      calc_type: "p",
      noclaim_year: "0",
      is_tailor: "false",
      get_direct_discount: "n",
      vehicle_reg: "e",
      include_towing_charge: "false",
      include_personal_use_discount: "false",
    };

    try {
      setLoading(true);

      localStorage.setItem("motor.vehicleType", "commercial");
      localStorage.setItem("motor.insurancePlan", "third-party");

      localStorage.setItem(
        "motor.selectedCommercialCategory",
        JSON.stringify({
          data: "7",
          value: "Tempo/E-Rikshwa Policy",
          additional_value: "CV",
          title: "Tempo / E-Rikshaw Policy",
        }),
      );

      localStorage.setItem(
        "motor.thirdPartyTempoErikshawForm",
        JSON.stringify({
          categoryId: "7",
          categoryName: "Tempo/E-Rikshwa Policy",
          vehicleCc,
          vehicleCcLabel: selectedCcOption?.label || "",
          engine_capcity_cc: selectedCcOption?.apiValue || "350",
          noOfSeatsIncludingDriver: noOfSeats,
          driverSeatCapacity: "1",
          passengerSeatCapacity: String(passengerSeatCapacity),
          helper,
          helperSeatCapacity,
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
      setStep(2);
    } catch (error: any) {
      let msg = "Failed to calculate premium";

      try {
        msg =
          JSON.parse(error?.message || "")?.error_list?.[0]?.error_message ||
          msg;
      } catch {
        msg = error?.message || msg;
      }

      setInlineError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const amount: PremiumAmountInfo | undefined = premiumData?.amount_info;

  const premiumRows: PremiumRow[] = [
    {
      key: "section",
      label: "Third Party Premium Calculation",
      type: "section",
    },
    {
      key: "tpl_amount",
      label: "Third Party Premium as per CC",
      value: safeValue(amount?.tpl_amount),
    },
    {
      key: "pa_amount",
      label: "Driver/Passenger Premium",
      value: safeValue(amount?.pa_amount),
    },
    {
      key: "vat_amount",
      label: "VAT Amount",
      value: safeValue(amount?.vat_amount),
    },
    {
      key: "stamp_duty",
      label: "Stamp Duty",
      value: safeValue(amount?.stamp_duty),
    },
    {
      key: "total_premium_with_vat",
      label: "Total Amount",
      value: safeValue(
        (premiumData as Record<string, unknown> | null)
          ?.total_premium_with_vat ?? amount?.total_amount,
      ),
      type: "total",
    },
  ];

  if (step === 2 && premiumData) {
    return (
      <>
        <div className="mb-6 flex items-center gap-3">
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100"
            onClick={() => setStep(1)}
          >
            <ChevronLeft className="h-5 w-5 text-black" />
          </button>

          <div>
            <h1 className="text-2xl font-bold text-black">
              Tempo / E-Rikshaw Premium Details
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Third-party tempo / e-rikshaw insurance calculation detail.
            </p>
          </div>
        </div>

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
              {premiumRows.map((row) => {
                if (row.type === "section") {
                  return (
                    <tr key={row.key} className="border-b bg-[#fff7f3]">
                      <td
                        colSpan={2}
                        className="px-4 py-3 font-bold text-black"
                      >
                        {row.label}
                      </td>
                    </tr>
                  );
                }

                if (row.type === "total") {
                  return (
                    <tr key={row.key} className="bg-[#b71319] text-white">
                      <td className="border-r border-white px-4 py-4 text-base font-bold">
                        {row.label}
                      </td>

                      <td className="px-4 py-4 text-right text-base font-bold">
                        {fmt(row.value)}
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr
                    key={row.key}
                    className="border-b bg-[#fff7f3] last:border-b-0"
                  >
                    <td className="border-r border-white px-4 py-3 text-black">
                      {row.label}
                    </td>

                    <td className="px-4 py-3 text-right font-medium text-black">
                      {fmt(row.value)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-8 flex items-center justify-between gap-3">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setStep(1)}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <Button
            className="gap-2 bg-[#f71920] text-white hover:bg-[#d9151b]"
            onClick={() =>
              navigate("/login")
            }
          >
            Buy Policy
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="mb-8 flex items-center gap-3">
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100"
          onClick={() =>
            navigate("/motor/commercial-vehicle/third-party")
          }
        >
          <ChevronLeft className="h-5 w-5 text-black" />
        </button>

        <div>
          <h1 className="text-2xl font-bold text-black">
            Tempo / E-Rikshaw Third Party
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Fill tempo / e-rikshaw details to calculate third-party premium.
          </p>
        </div>
      </div>

      <Card className="max-w-5xl">
        <CardContent className="space-y-5 pt-6">
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <Label htmlFor="vehicleCc">Vehicle CC *</Label>

              <Select
                value={vehicleCc}
                onValueChange={(value) => {
                  setVehicleCc(value);
                  clearError("vehicleCc");
                }}
              >
                <SelectTrigger
                  id="vehicleCc"
                  className={`mt-2 ${
                    errors.vehicleCc ? "border-red-500" : ""
                  }`}
                >
                  <SelectValue placeholder="Select Vehicle CC" />
                </SelectTrigger>

                <SelectContent>
                  {ccOptions.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {errors.vehicleCc && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.vehicleCc}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="noOfSeats">
                No of Seats Including Driver *
              </Label>

              <Select
                value={noOfSeats}
                onValueChange={(value) => {
                  setNoOfSeats(value);
                  clearError("noOfSeats");
                }}
              >
                <SelectTrigger
                  id="noOfSeats"
                  className={`mt-2 ${
                    errors.noOfSeats ? "border-red-500" : ""
                  }`}
                >
                  <SelectValue placeholder="Select no of seats" />
                </SelectTrigger>

                <SelectContent>
                  {seatOptions.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {errors.noOfSeats && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.noOfSeats}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="helper">Helper / Conductor *</Label>

              <Select
                value={helper}
                onValueChange={(value) => {
                  setHelper(value);
                  clearError("helper");
                }}
              >
                <SelectTrigger
                  id="helper"
                  className={`mt-2 ${
                    errors.helper ? "border-red-500" : ""
                  }`}
                >
                  <SelectValue placeholder="Select helper / conductor" />
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
                <p className="mt-1 text-xs text-red-600">
                  {errors.helper}
                </p>
              )}
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
              onClick={() =>
                navigate("/motor/commercial-vehicle/third-party")
              }
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>

            <Button
              size="lg"
              className="gap-2 bg-[#f71920] px-8 text-white hover:bg-[#d9151b]"
              disabled={loading}
              onClick={handleCalculate}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
    </>
  );
}