import React, { useState, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ChevronLeft, AlertTriangle } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { getTravelAgeBands } from "@/api/travels/GetTravelAgeBands";
import { getTravelPeriod } from "@/api/travels/GetTravelCatalogues";

type AgeBandItem = {
  value: string;
  age_from: string;
  age_to: string;
};

type PeriodApiItem = { value: string; data: string };
type PeriodApiResponse = {
  class_id: number;
  total_data_no: number;
  catalogue_list: PeriodApiItem[];
  process_result: boolean;
};

type CoverageState = {
  planValue?: string;
  areaValue?: string;
  packageValue?: string;
};

export const TravelInsuranceDetails = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  const steps = [
    { number: 1, label: "Coverage Plan", status: "completed" as const },
    { number: 2, label: "Coverage Details", status: "inProcess" as const },
    { number: 3, label: "Instant Quotes", status: "pending" as const },
  ];

  // Store step-1 selections
  const [coverageState, setCoverageState] = React.useState<CoverageState>({
    planValue: "",
    areaValue: "",
    packageValue: "",
  });

  const planId = coverageState.planValue || "";

  function handleBack() {
    navigate("/travel-insurance-coverage", { state: coverageState });
  }

  // ---------------- helpers ----------------
  const todayStr = React.useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  // Calculate minimum DOB date (16 years ago from today)
  const minDobStr = React.useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 16);
    d.setHours(0, 0, 0, 0);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  function daysBetweenInclusive(fromISO: string, toISO: string) {
    const from = new Date(fromISO);
    const to = new Date(toISO);
    from.setHours(0, 0, 0, 0);
    to.setHours(0, 0, 0, 0);
    const diff = to.getTime() - from.getTime();
    if (diff < 0) return 0;
    return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
  }

  function calcAgeYears(dobISO: string) {
    const dob = new Date(dobISO);
    dob.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let a = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) a--;
    return Math.max(0, a);
  }

  function findAgeBandValue(bands: AgeBandItem[], ageYears: number) {
    for (const b of bands) {
      const from = Number(b.age_from);
      const to = Number(b.age_to);
      if (Number.isFinite(from) && Number.isFinite(to)) {
        if (ageYears >= from && ageYears <= to) return b.value;
      }
    }
    return "";
  }

  function matchPeriodByDays(items: PeriodApiItem[], days: number) {
    for (const it of items) {
      const m = String(it.data).match(/(\d+)\s*-\s*(\d+)/);
      if (!m) continue;
      const from = Number(m[1]);
      const to = Number(m[2]);
      if (Number.isFinite(from) && Number.isFinite(to)) {
        if (days >= from && days <= to) return it;
      }
    }
    return items[0] ?? null;
  }

  // ---------------- Step-2 Fields ----------------
  const [travelFrom, setTravelFrom] = React.useState("");
  const [travelTo, setTravelTo] = React.useState("");
  const [noOfDays, setNoOfDays] = React.useState<number | "">("");
  const [numberOfTravelers, setNumberOfTravelers] = React.useState<number>(1);

  const [travelFromError, setTravelFromError] = React.useState<string | null>(null);
  const [travelToError, setTravelToError] = React.useState<string | null>(null);

  const [dob, setDob] = React.useState("");
  const [age, setAge] = React.useState<number | "">("");
  const [dobError, setDobError] = React.useState<string | null>(null);

  const [passportNumber, setPassportNumber] = React.useState("");
  const [phoneNumber, setPhoneNumber] = React.useState("");

  const [periodId, setPeriodId] = React.useState<string>("");
  const [periodLoading, setPeriodLoading] = React.useState(false);
  const [periodError, setPeriodError] = React.useState<string | null>(null);
  const [periodResp, setPeriodResp] = React.useState<PeriodApiResponse | null>(null);
  const [periodSelectedLabel, setPeriodSelectedLabel] = React.useState<string>("");

  // ---------------- Age Bands API ----------------
  const [ageBandList, setAgeBandList] = React.useState<AgeBandItem[]>([]);
  const [ageBandValue, setAgeBandValue] = React.useState<string>("");
  const [ageBandError, setAgeBandError] = React.useState<string | null>(null);

  const [loadingAgeBands, setLoadingAgeBands] = React.useState(false);
  const [ageBandsError, setAgeBandsError] = React.useState<string | null>(null);

  // Load saved details from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("travel.coverageDetails");
      if (saved) {
        const parsed = JSON.parse(saved);
        setTravelFrom(parsed.travelFrom || "");
        setTravelTo(parsed.travelTo || "");
        setNoOfDays(parsed.noOfDays || "");
        setNumberOfTravelers(parsed.numberOfTravelers || 1);
        setDob(parsed.dob || "");
        setAge(parsed.age || "");
        setPeriodId(parsed.period_id || "");
        setAgeBandValue(parsed.age_band_id || "");
        setPhoneNumber(parsed.phone_number || "");
        setPassportNumber(parsed.passport_number || "");
      }
    } catch (error) {
      console.error("Error loading saved details:", error);
    }
  }, []);

  // Load Step-1 selected values from router state OR localStorage
  React.useEffect(() => {
    function loadCoverageState() {
      const st = (location.state || {}) as CoverageState;
      let ls: CoverageState = {};
      try {
        const raw = localStorage.getItem("travel.coveragePlan");
        if (raw) ls = JSON.parse(raw);
      } catch {
        // ignore
      }

      const merged: CoverageState = {
        planValue: st.planValue ?? ls.planValue ?? "",
        areaValue: st.areaValue ?? ls.areaValue ?? "",
        packageValue: st.packageValue ?? ls.packageValue ?? "",
      };

      setCoverageState(merged);
    }

    loadCoverageState();
  }, [location.state]);

  // Load Age Bands
  React.useEffect(() => {
    let mounted = true;

    async function loadAgeBands() {
      try {
        setLoadingAgeBands(true);
        setAgeBandsError(null);

        const res = await getTravelAgeBands();
        const list: AgeBandItem[] = Array.isArray(res?.travel_age_band_list)
          ? res.travel_age_band_list
          : [];

        if (!mounted) return;
        setAgeBandList(list);
        
        // If DOB already selected, recalculate age band
        if (dob) {
          const yrs = calcAgeYears(dob);
          const bandVal = findAgeBandValue(list, yrs);
          setAgeBandValue(bandVal);
          setAgeBandError(
            bandVal ? null : `Age ${yrs} is not allowed in available age bands`
          );
        }
      } catch (e: any) {
        if (!mounted) return;
        setAgeBandsError(e?.message ?? "Failed to load age bands");
      } finally {
        if (!mounted) return;
        setLoadingAgeBands(false);
      }
    }

    loadAgeBands();

    return () => {
      mounted = false;
    };
  }, []);

  // ---------------- handlers ----------------
  const onChangeTravelFrom = (v: string) => {
    setTravelFrom(v);
    setTravelFromError(null);

    setPeriodError(null);
    setPeriodId("");
    setPeriodSelectedLabel("");
    setPeriodResp(null);

    if (travelTo && v && travelTo < v) {
      setTravelTo("");
      setNoOfDays("");
      setTravelToError("Travel Period To must be same or after Travel Period From");
      return;
    }

    if (v && travelTo) {
      const d = daysBetweenInclusive(v, travelTo);
      setNoOfDays(d);
      setTravelToError(d > 180 ? "No of Days must be below 180 days" : null);
    } else {
      setNoOfDays("");
    }
  };

  const onChangeTravelTo = (v: string) => {
    setTravelTo(v);
    setTravelToError(null);

    setPeriodError(null);
    setPeriodId("");
    setPeriodSelectedLabel("");
    setPeriodResp(null);

    if (!travelFrom) {
      setTravelToError("Please select Travel Period From first");
      setNoOfDays("");
      return;
    }

    if (v < travelFrom) {
      setTravelToError("Travel Period To must be same or after Travel Period From");
      setNoOfDays("");
      return;
    }

    const d = daysBetweenInclusive(travelFrom, v);
    setNoOfDays(d);
    if (d > 180) setTravelToError("No of Days must be below 180 days");
  };

  const onChangeDob = (v: string) => {
    setDob(v);
    setDobError(null);
    setAgeBandError(null);

    if (!v) {
      setAge("");
      setAgeBandValue("");
      return;
    }

    // Check if date is in future
    if (v > todayStr) {
      setDobError("DOB cannot be in the future");
      setAge("");
      setAgeBandValue("");
      return;
    }

    // Check minimum age (16 years)
    if (v > minDobStr) {
      setDobError("You must be at least 16 years old");
      setAge("");
      setAgeBandValue("");
      return;
    }

    const yrs = calcAgeYears(v);
    setAge(yrs);

    if (ageBandList.length > 0) {
      const bandVal = findAgeBandValue(ageBandList, yrs);
      setAgeBandValue(bandVal);
      setAgeBandError(
        bandVal ? null : `Age ${yrs} is not allowed in available age bands`
      );
    } else {
      setAgeBandValue("");
    }
  };

  const onChangeNumberOfTravelers = (value: string) => {
    const numValue = parseInt(value) || 1;
    const clampedValue = Math.min(10, Math.max(1, numValue));
    setNumberOfTravelers(clampedValue);
  };

  // Call Period API when planId + noOfDays ready
  React.useEffect(() => {
    let cancelled = false;

    async function loadPeriod() {
      if (!planId) return;
      if (typeof noOfDays !== "number") return;
      if (noOfDays <= 0) return;
      if (noOfDays > 180) return;

      try {
        setPeriodLoading(true);
        setPeriodError(null);

        const resp: PeriodApiResponse = await getTravelPeriod(planId, noOfDays);

        if (cancelled) return;

        setPeriodResp(resp);

        const list = Array.isArray(resp?.catalogue_list) ? resp.catalogue_list : [];
        if (!resp?.process_result || list.length === 0) {
          setPeriodId("");
          setPeriodSelectedLabel("");
          setPeriodError("No period found for selected days");
          return;
        }

        const matched = matchPeriodByDays(list, noOfDays);
        if (!matched) {
          setPeriodId("");
          setPeriodSelectedLabel("");
          setPeriodError("No period matched for selected days");
          return;
        }

        setPeriodId(String(matched.value));
        setPeriodSelectedLabel(matched.data);
      } catch (e: any) {
        if (cancelled) return;
        setPeriodResp(null);
        setPeriodId("");
        setPeriodSelectedLabel("");
        setPeriodError(e?.message ?? "Failed to load travel period");
      } finally {
        if (!cancelled) setPeriodLoading(false);
      }
    }

    loadPeriod();

    return () => {
      cancelled = true;
    };
  }, [planId, noOfDays]);

  // Validate & Save & Navigate
  const onNext = () => {
    let ok = true;

    if (!travelFrom) {
      setTravelFromError("Please select Travel Period From");
      ok = false;
    } else if (travelFrom < todayStr) {
      setTravelFromError("Past date not allowed");
      ok = false;
    }

    if (!travelTo) {
      setTravelToError("Please select Travel Period To");
      ok = false;
    } else if (travelTo < todayStr) {
      setTravelToError("Past date not allowed");
      ok = false;
    } else if (travelFrom && travelTo < travelFrom) {
      setTravelToError("Travel Period To must be same or after Travel Period From");
      ok = false;
    }

    if (typeof noOfDays === "number" && noOfDays > 180) {
      setTravelToError("No of Days must be below 180 days");
      ok = false;
    }

    if (!dob) {
      setDobError("Please select DOB");
      ok = false;
    } else if (dob > todayStr) {
      setDobError("DOB cannot be in the future");
      ok = false;
    } else if (dob > minDobStr) {
      setDobError("You must be at least 16 years old");
      ok = false;
    }

    if (loadingAgeBands) {
      setAgeBandError("Age band loading... please wait");
      ok = false;
    } else if (ageBandsError) {
      setAgeBandError("Failed to load age bands");
      ok = false;
    } else if (!ageBandValue) {
      setAgeBandError("Age not allowed. Please check DOB.");
      ok = false;
    }

    if (!planId) {
      setPeriodError("Missing plan_id (go back and select plan)");
      ok = false;
    } else if (periodLoading) {
      setPeriodError("Loading travel period... please wait");
      ok = false;
    } else if (periodError) {
      ok = false;
    } else if (!periodId) {
      setPeriodError("Period not selected. Please re-check travel dates.");
      ok = false;
    }

    if (!ok) return;

    const coverageDetailsPayload = {
      travelFrom,
      travelTo,
      noOfDays,
      numberOfTravelers,
      dob,
      age,
      period_id: periodId,
      age_band_id: ageBandValue,
      phone_number: phoneNumber,
      passport_number: passportNumber,
    };

    localStorage.setItem("travel.coverageDetails", JSON.stringify(coverageDetailsPayload));
    navigate("/travel-insurance-instant-quotes");
  };

  const calculateDisabled =
    loadingAgeBands ||
    !!ageBandsError ||
    !!travelFromError ||
    !!travelToError ||
    !!dobError ||
    !!ageBandError ||
    periodLoading ||
    !!periodError ||
    !periodId;

  return (
    <div className="flex min-h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-8 bg-background">
          {/* Stepper */}
          <div className="mb-12">
            <div className="flex items-center justify-between max-w-4xl mx-auto">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                        step.status === "completed" || step.status === "inProcess"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {step.status === "completed" || step.status === "inProcess" ? "✓" : step.number}
                    </div>
                    <span className="text-xs text-center max-w-[120px] font-medium">
                      STEP {step.number}
                    </span>
                    <span
                      className={`text-xs mt-1 ${
                        step.status === "completed"
                          ? "text-green-600"
                          : step.status === "inProcess"
                          ? "text-primary"
                          : "text-orange-500"
                      }`}
                    >
                      {step.status === "completed"
                        ? "Completed"
                        : step.status === "inProcess"
                        ? "In Process"
                        : "Pending"}
                    </span>
                    <span className="text-xs text-center max-w-[120px] mt-1">{step.label}</span>
                  </div>
                  {index < steps.length - 1 && <div className="flex-1 h-0.5 bg-border mx-2"></div>}
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="max-w-4xl mx-auto">
            <Button variant="ghost" onClick={handleBack} className="mb-6 gap-2">
              <ChevronLeft className="w-4 h-4" /> Back to Step 1
            </Button>

            <h1 className="text-2xl font-bold mb-2">
              Travel Medical Insurance Individual Plan
            </h1>
            <p className="text-muted-foreground mb-6">Step 2 of 3: Enter your travel details</p>

            {/* Travel Period Section */}
            <div className="border rounded-lg p-6 mb-6">
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label htmlFor="travelFrom">Travel Period From</Label>
                  <Input
                    id="travelFrom"
                    type="date"
                    className="mt-2"
                    value={travelFrom}
                    onChange={(e) => onChangeTravelFrom(e.target.value)}
                    min={todayStr}
                  />
                  {travelFromError && <p className="mt-1 text-sm text-red-600">{travelFromError}</p>}
                </div>

                <div>
                  <Label htmlFor="travelTo">Travel Period To</Label>
                  <Input
                    id="travelTo"
                    type="date"
                    className="mt-2"
                    value={travelTo}
                    onChange={(e) => onChangeTravelTo(e.target.value)}
                    min={travelFrom || todayStr}
                    disabled={!travelFrom}
                  />
                  {travelToError && <p className="mt-1 text-sm text-red-600">{travelToError}</p>}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="noOfDays">No of Days</Label>
                  <Input
                    id="noOfDays"
                    type="number"
                    className="mt-2"
                    value={noOfDays}
                    readOnly
                  />
                  {periodLoading && <p className="text-xs mt-2 text-muted-foreground">Loading period...</p>}
                  {periodError && <p className="text-xs mt-2 text-red-600">{periodError}</p>}
                </div>

                <div>
                  <Label htmlFor="numberOfTravelers">Number of Travelers</Label>
                  <Input
                    id="numberOfTravelers"
                    type="number"
                    min="1"
                    max="10"
                    value={numberOfTravelers}
                    onChange={(e) => onChangeNumberOfTravelers(e.target.value)}
                    className="mt-2"
                  />
                </div>
              </div>
            </div>

            {/* KYC Section */}
            <div className="border rounded-lg p-6 mb-6">
              <Label className="mb-4 block font-semibold">KYC TYPE</Label>
              <RadioGroup defaultValue="self" className="mb-6">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="self" id="self" />
                    <Label htmlFor="self">Self</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="others" id="others" />
                    <Label htmlFor="others">Others</Label>
                  </div>
                </div>
              </RadioGroup>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input
                    id="dob"
                    type="date"
                    className="mt-2"
                    value={dob}
                    onChange={(e) => onChangeDob(e.target.value)}
                    max={todayStr}
                    min="1900-01-01"
                  />
                  {dobError && <p className="mt-1 text-sm text-red-600">{dobError}</p>}
                  {ageBandError && <p className="mt-1 text-sm text-red-600">{ageBandError}</p>}
                  {ageBandsError && <p className="mt-1 text-sm text-red-600">{ageBandsError}</p>}
                  {loadingAgeBands && (
                    <p className="mt-1 text-sm text-muted-foreground">Loading age bands...</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    className="mt-2"
                    value={age}
                    readOnly
                    placeholder="Auto calculated"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <Button variant="outline" onClick={handleBack} className="gap-2">
                <ChevronLeft className="w-4 h-4" />
                BACK
              </Button>

              <Button
                className="bg-primary hover:bg-primary/90"
                onClick={onNext}
                disabled={calculateDisabled}
              >
                NEXT
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};