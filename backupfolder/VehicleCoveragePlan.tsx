import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { getMotorPremium, type GetPremiumRequest } from "@/api/motor/getpremium";

const CATEGORIES = [
  { value: "1", label: "Motorcycle" },
  { value: "2", label: "Scooter" },
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
 { value: "500", label: "500" },
  { value: "1000", label: "1,000" },
  { value: "2000", label: "2,000" },
  // { value: "10000", label: "10,000"}
];

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function addOneYear(dateISO: string) {
  const d = new Date(dateISO);
  d.setFullYear(d.getFullYear() + 1);
  d.setDate(d.getDate() - 1);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export const VehicleCoveragePlan = () => {
  const navigate = useNavigate();

  const [category, setCategory] = useState("");
  const [yearOfManufacture, setYearOfManufacture] = useState("");
  const [selectedCcRange, setSelectedCcRange] = useState("");
  const [vehicleCost, setVehicleCost] = useState("");
  const [voluntaryExcess, setVoluntaryExcess] = useState("0");
  const paDriver = "500000";
  const noOfSeat = "2";
  const paPassenger = "500000";
  const [effectiveDate, setEffectiveDate] = useState(todayISO());
  const [coverStrikeDamage, setCoverStrikeDamage] = useState(true);
  const [noClaimYear, setNoClaimYear] = useState("0");
  const [directDiscount, setDirectDiscount] = useState(true);

  const expiryDate = useMemo(() => {
    return effectiveDate ? addOneYear(effectiveDate) : "";
  }, [effectiveDate]);

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

  // Handle vehicle cost input - only allow numbers
  const handleVehicleCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only digits (no -, +, e, E, or other special characters)
    if (value === "" || /^\d+$/.test(value)) {
      setVehicleCost(value);
    }
  };

  const isFormValid =
    !!category &&
    !!yearOfManufacture &&
    !!selectedCcRange &&
    !!vehicleCost.trim() &&
    Number(vehicleCost) > 0 &&
    !!effectiveDate;

  const [loading, setLoading] = useState(false);

  const handleCalculate = async () => {
    if (!isFormValid) return;

    const currentYear = new Date().getFullYear();
    const vehicleAge = currentYear - Number(yearOfManufacture);
    const ccValue = getCcValue();

    const payload: GetPremiumRequest = {
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
      is_directdiscount: directDiscount ? "y" : "n",
      vehicle_reg: "y",
    };

    try {
      setLoading(true);
      const resp = await getMotorPremium(payload);

      if (resp?.process_result === false) {
        const msg = resp?.error_list?.[0]?.error_message || "Failed to calculate premium";
        toast.error(msg);
        return;
      }

      localStorage.setItem("motor.premiumResponse", JSON.stringify(resp));
      localStorage.setItem("motor.insurancePlan", "comprehensive");

      navigate("/vehicle-coverage-details");
    } catch (err: any) {
      let msg = "Failed to calculate premium";
      try {
        const parsed = JSON.parse(err?.message || "");
        msg = parsed?.error_list?.[0]?.error_message || msg;
      } catch {
        msg = err?.message || msg;
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <Button
            variant="ghost"
            className="mb-4 gap-2"
            onClick={() => navigate("/vehicle-insurance-plan")}
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </Button>

          <h1 className="text-2xl font-bold mb-2">
            Coverage Plan — Comprehensive
          </h1>
          <p className="text-sm text-muted-foreground mb-8">
            Fill in your vehicle details to get an instant quote
          </p>

          <Card className="mb-8">
            <CardContent className="pt-6 space-y-5">
              {/* Row 1: Category + Year */}
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
                  <Select value={yearOfManufacture} onValueChange={setYearOfManufacture}>
                    <SelectTrigger id="year" className="mt-2">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((y) => (
                        <SelectItem key={y} value={y}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 2: CC Range + Vehicle Cost */}
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
                  <Label htmlFor="vehicleCost">Vehicle Cost (NPR) *</Label>
                  <Input
                    id="vehicleCost"
                    type="text"
                    inputMode="numeric"
                    pattern="\d*"
                    className="mt-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="Enter vehicle cost"
                    value={vehicleCost}
                    onChange={handleVehicleCostChange}
                  />
                </div>
              </div>

              {/* Row 3: Voluntary Excess + Compulsory Excess */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="voluntaryExcess">Voluntary Excess *</Label>
                  <Select value={voluntaryExcess} onValueChange={setVoluntaryExcess}>
                    <SelectTrigger id="voluntaryExcess" className="mt-2">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {(category === "2" ? VOLUNTARY_EXCESS_ID2 : VOLUNTARY_EXCESS_ID1).map((v) => (
                        <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>
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

              {/* Row 4: PA Driver + No of Seat */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="paDriver">P.A. to Driver</Label>
                  <Input id="paDriver" type="number" className="mt-2" value={paDriver} disabled />
                </div>
                <div>
                  <Label htmlFor="noOfSeat">No of Seat (Including Driver)</Label>
                  <Input id="noOfSeat" type="number" className="mt-2" value={noOfSeat} disabled />
                </div>
              </div>

              {/* Row 5: PA Passenger + Claim Discount Year */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="paPassenger">P.A. to Passenger</Label>
                  <Input id="paPassenger" type="number" className="mt-2" value={paPassenger} disabled />
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

              {/* Row 6: Effective Date + Expiry Date */}
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

              {/* Options */}
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

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => navigate("/vehicle-insurance-plan")}
            >
              <ChevronLeft className="w-4 h-4" />
              BACK
            </Button>
            <Button
              size="lg"
              className="px-8"
              disabled={!isFormValid || loading}
              onClick={handleCalculate}
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Calculating...</> : "CALCULATE"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};