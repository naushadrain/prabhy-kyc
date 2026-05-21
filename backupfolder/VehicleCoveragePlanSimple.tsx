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
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, Loader2, AlertCircle } from "lucide-react";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getMotorPremium } from "@/api/motor/getpremium";
import { toast } from "@/components/ui/sonner";

const CC_OPTIONS = [
  { value: "less_than_150", label: "Less than 150 CC", cc_value: "100" },
  { value: "150_to_250", label: "150 CC to 250 CC", cc_value: "200" },
  { value: "above_250", label: "Above 250 CC", cc_value: "300" },
];

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addOneYear(dateStr: string): string {
  const d = new Date(dateStr);
  d.setFullYear(d.getFullYear() + 1);
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export const VehicleCoveragePlanSimple = () => {
  const navigate = useNavigate();

  const [selectedCcRange, setSelectedCcRange] = useState("");
  const [effectiveDate, setEffectiveDate] = useState(todayISO());
  const [directDiscount, setDirectDiscount] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);

  const expiryDate = useMemo(() => addOneYear(effectiveDate), [effectiveDate]);

  // Get the numeric CC value based on selected range
  const getCcValue = () => {
    const selected = CC_OPTIONS.find(opt => opt.value === selectedCcRange);
    return selected ? selected.cc_value : "";
  };

  // Updated validation - now checks CC range selection
  const isFormValid = !!selectedCcRange && !!effectiveDate;

  const handleCalculate = async () => {
    setInlineError(null);

    if (!selectedCcRange) { 
      const msg = "Please select Cubic Capacity range"; 
      setInlineError(msg); 
      toast.error(msg); 
      return; 
    }

    const ccValue = getCcValue();
    const ccLabel = CC_OPTIONS.find(opt => opt.value === selectedCcRange)?.label || "";

    const payload = {
      class_id: "1",
      cover_type_id: "Third Party",
      is_government: "1",
      engine_capcity_cc: ccValue,
      driver_seat_capacity: "1",
      passenger_seat_capacity: "1",
      passanger_carrying_capacity: "2",
      compulsory_excess: "500",
      voluntary_excess: "500",
      vehicle_age_in_years: "0",
      vehicle_suminsured_amount: "0",
      calc_type: "p",
      noclaim_year: "0",
      is_tailor: "false",
    };

    setLoading(true);
    try {
      const response = await getMotorPremium(payload);

      if (response?.process_result === false) {
        const msg = response?.error_list?.[0]?.error_message || "Failed to calculate premium";
        setInlineError(msg);
        toast.error(msg);
        return;
      }

      localStorage.setItem("motor.premiumResponse", JSON.stringify(response));
      localStorage.setItem("motor.insurancePlan", "third-party");
      localStorage.setItem("motor.coverageForm", JSON.stringify({
        selectedCcRange,
        ccLabel,
        ccValue,
        effectiveDate,
        expiryDate,
        directDiscount,
      }));

      navigate("/vehicle-coverage-details-simple");
    } catch (err: any) {
      let msg = "Failed to calculate premium";
      try {
        const parsed = JSON.parse(err?.message || "");
        msg = parsed?.error_list?.[0]?.error_message || msg;
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

          <h1 className="text-2xl font-bold mb-2">Coverage Plan — Third Party</h1>
          <p className="text-sm text-muted-foreground mb-8">
            Fill in the details to calculate your premium
          </p>

          <Card className="mb-8">
            <CardContent className="pt-6 space-y-5">
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
              {inlineError && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  {inlineError}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => navigate("/vehicle-insurance-plan")}
              disabled={loading}
            >
              <ChevronLeft className="w-4 h-4" /> BACK
            </Button>
            <Button
              size="lg"
              className="px-8"
              onClick={handleCalculate}
              disabled={!isFormValid || loading}
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Calculating...</> : "CALCULATE"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};