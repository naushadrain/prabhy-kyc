import React from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { ChevronLeft, LogIn } from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import logo from "@/assets/logo.png";

import { getTravelAgeBands } from "@/api/travels/GetTravelAgeBands";
import { getTravelPeriod } from "@/api/travels/GetTravelCatalogues";

// ---------------- types ----------------
type AgeBandItem = { value: string; age_from: string; age_to: string };

type PeriodApiItem = { value: string; data: string };
type PeriodApiResponse = {
  class_id: number;
  total_data_no: number;
  catalogue_list: PeriodApiItem[];
  process_result: boolean;
};

type CoverageState = {
  planValue?: string;   // plan_id
  areaValue?: string;
  packageValue?: string;
};

// ---------------- helpers ----------------
function todayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

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

export default function TravelInsuranceDetails() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const steps = [
    { number: 1, label: "Coverage Plan", status: "completed" as const },
    { number: 2, label: "Coverage Details", status: "inProcess" as const },
    { number: 3, label: "Instant Quotes", status: "pending" as const },
  ];

  // ✅ Load Step-1 state (router OR localStorage)
  const [coverageState, setCoverageState] = React.useState<CoverageState>({
    planValue: "",
    areaValue: "",
    packageValue: "",
  });

  React.useEffect(() => {
    const st = (location.state || {}) as CoverageState;

    let ls: CoverageState = {};
    try {
      const raw = localStorage.getItem("travel.coveragePlan");
      if (raw) ls = JSON.parse(raw);
    } catch {}

    const merged: CoverageState = {
      planValue: st.planValue ?? ls.planValue ?? "",
      areaValue: st.areaValue ?? ls.areaValue ?? "",
      packageValue: st.packageValue ?? ls.packageValue ?? "",
    };

    setCoverageState(merged);

    // ✅ persist for refresh safety
    localStorage.setItem("travel.coveragePlan", JSON.stringify(merged));
  }, [location.state]);

  const planId = coverageState.planValue || "";
  const todayStr = React.useMemo(() => todayISO(), []);

  function handleBack() {
    // ✅ ALWAYS go back to Step-1 with state
    navigate("/travel-insurance-coverage", { state: coverageState });
  }

  // ---------------- Step-2 Fields ----------------
  const [travelFrom, setTravelFrom] = React.useState("");
  const [travelTo, setTravelTo] = React.useState("");
  const [noOfDays, setNoOfDays] = React.useState<number | "">("");

  const [travelFromError, setTravelFromError] = React.useState<string | null>(null);
  const [travelToError, setTravelToError] = React.useState<string | null>(null);

  const [dob, setDob] = React.useState("");
  const [age, setAge] = React.useState<number | "">("");
  const [dobError, setDobError] = React.useState<string | null>(null);

  const [passportNumber, setPassportNumber] = React.useState("");
  const [phoneNumber, setPhoneNumber] = React.useState("");

  // period
  const [periodId, setPeriodId] = React.useState<string>("");
  const [periodLoading, setPeriodLoading] = React.useState(false);
  const [periodError, setPeriodError] = React.useState<string | null>(null);

  // age bands
  const [ageBandList, setAgeBandList] = React.useState<AgeBandItem[]>([]);
  const [ageBandValue, setAgeBandValue] = React.useState<string>("");
  const [ageBandError, setAgeBandError] = React.useState<string | null>(null);

  const [loadingAgeBands, setLoadingAgeBands] = React.useState(false);
  const [ageBandsError, setAgeBandsError] = React.useState<string | null>(null);

  // Load age bands
  React.useEffect(() => {
    let mounted = true;

    async function loadAgeBands() {
      try {
        setLoadingAgeBands(true);
        setAgeBandsError(null);

        const res = await getTravelAgeBands();
        const list: AgeBandItem[] = Array.isArray(res?.travel_age_band_list) ? res.travel_age_band_list : [];

        if (!mounted) return;
        setAgeBandList(list);
      } catch (e: any) {
        if (!mounted) return;
        setAgeBandsError(e?.message ?? "Failed to load age bands");
      } finally {
        if (mounted) setLoadingAgeBands(false);
      }
    }

    loadAgeBands();
    return () => {
      mounted = false;
    };
  }, []);

  // handlers
  const onChangeTravelFrom = (v: string) => {
    setTravelFrom(v);
    setTravelFromError(null);

    setPeriodError(null);
    setPeriodId("");

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

    if (v > todayStr) {
      setDobError("DOB cannot be in the future");
      setAge("");
      setAgeBandValue("");
      return;
    }

    const yrs = calcAgeYears(v);
    setAge(yrs);

    if (ageBandList.length > 0) {
      const bandVal = findAgeBandValue(ageBandList, yrs);
      setAgeBandValue(bandVal);
      setAgeBandError(bandVal ? null : `Age ${yrs} is not allowed in available age bands`);
    } else {
      setAgeBandValue("");
    }
  };

  // Load period when planId + days ready
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

        const list = Array.isArray(resp?.catalogue_list) ? resp.catalogue_list : [];
        if (!resp?.process_result || list.length === 0) {
          setPeriodId("");
          setPeriodError("No period found for selected days");
          return;
        }

        const matched = matchPeriodByDays(list, noOfDays);
        if (!matched) {
          setPeriodId("");
          setPeriodError("No period matched for selected days");
          return;
        }

        setPeriodId(String(matched.value));
      } catch (e: any) {
        if (cancelled) return;
        setPeriodId("");
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

    const payload = {
      travelFrom,
      travelTo,
      noOfDays,
      dob,
      age,
      period_id: periodId,
      age_band_id: ageBandValue,
      phone_number: phoneNumber,
      passport_number: passportNumber,
    };

    localStorage.setItem("travel.coverageDetails", JSON.stringify(payload));
    navigate("/premium-summary");
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
    <div className="min-h-screen bg-background">
      {/* ✅ Top bar */}
      <header className="border-b bg-white">
        <div className="px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <img src={logo} alt="Prabhu Insurance" className="h-10 w-auto" />

          <Link to="/login">
            <Button className="gap-2">
              <LogIn className="h-4 w-4" />
              {t("nav.login")}
            </Button>
          </Link>
        </div>
      </header>

      <main className="p-6 md:p-8">
        {/* ✅ Stepper */}
        <div className="mb-10">
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
                  <span className="text-xs font-medium">STEP {step.number}</span>
                  <span className="text-xs mt-1">
                    {step.status === "completed"
                      ? "Completed"
                      : step.status === "inProcess"
                      ? t("claim.inProcess")
                      : t("claim.pending")}
                  </span>
                  <span className="text-xs mt-1 text-center">{step.label}</span>
                </div>
                {index < steps.length - 1 && <div className="flex-1 h-0.5 bg-border mx-2" />}
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* ✅ Back arrow goes to coverage page */}
          <Button variant="ghost" onClick={handleBack} className="mb-6 gap-2">
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>

          <h1 className="text-2xl font-bold mb-8">Travel Medical Insurance Individual Plan</h1>

          {/* Travel Period */}
          <div className="border rounded-lg p-6 mb-6">
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <Label>Travel Period From</Label>
                <Input
                  type="date"
                  className="mt-2"
                  value={travelFrom}
                  onChange={(e) => onChangeTravelFrom(e.target.value)}
                  min={todayStr}
                />
                {travelFromError && <p className="mt-1 text-sm text-red-600">{travelFromError}</p>}
              </div>

              <div>
                <Label>Travel Period To</Label>
                <Input
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
                <Label>No of Days</Label>
                <Input type="number" className="mt-2" value={noOfDays} readOnly />
                {periodLoading && <p className="text-xs mt-2 text-muted-foreground">Loading period...</p>}
                {periodError && <p className="text-xs mt-2 text-red-600">{periodError}</p>}
              </div>

              <div>
                <Label>No of Travelers</Label>
                <Select>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select travelers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="4">4</SelectItem>
                    <SelectItem value="5+">5+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* KYC TYPE */}
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
                <Label>DOB</Label>
                <Input
                  type="date"
                  className="mt-2"
                  value={dob}
                  onChange={(e) => onChangeDob(e.target.value)}
                  max={todayStr}
                />
                {dobError && <p className="mt-1 text-sm text-red-600">{dobError}</p>}
                {ageBandError && <p className="mt-1 text-sm text-red-600">{ageBandError}</p>}
                {ageBandsError && <p className="mt-1 text-sm text-red-600">{ageBandsError}</p>}
                {loadingAgeBands && <p className="mt-1 text-sm text-muted-foreground">Loading age bands...</p>}
              </div>

              <div>
                <Label>Age</Label>
                <Input type="number" className="mt-2" value={age} readOnly placeholder="Auto" />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Button variant="outline" onClick={handleBack} className="gap-2">
              <ChevronLeft className="w-4 h-4" />
              BACK
            </Button>

            <Button onClick={onNext} disabled={calculateDisabled}>
              NEXT
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
