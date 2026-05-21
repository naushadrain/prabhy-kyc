import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import {
  getTravelPeriod,
  getTravelAgeBandsPublic,
  TravelPeriodResponse,
} from "@/api/travels/GetTravelCataloguesPublic";

type AgeBandItem = {
  value: string;
  age_from: string;
  age_to: string;
};

type PeriodApiItem = {
  value: string;
  data: string;
};

type CoverageState = {
  planValue?: string;
  areaValue?: string;
  packageValue?: string;
};

const STORAGE_KEY = "travelInsurance.details";

function saveToStorage(data: Record<string, any>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

function loadFromStorage(): Record<string, any> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

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
  const navigate = useNavigate();
  const location = useLocation();

  const [coverageState, setCoverageState] = React.useState<CoverageState>({
    planValue: "",
    areaValue: "",
    packageValue: "",
  });

  // Restore from localStorage on mount
  const saved = React.useMemo(() => loadFromStorage(), []);

  const [travelFrom, setTravelFrom] = React.useState(saved?.travelFrom ?? "");
  const [travelTo, setTravelTo] = React.useState(saved?.travelTo ?? "");
  const [noOfDays, setNoOfDays] = React.useState<number | "">(saved?.noOfDays ?? "");
  const [numberOfTravelers, setNumberOfTravelers] = React.useState<number>(saved?.numberOfTravelers ?? 1);

  const [travelFromError, setTravelFromError] = React.useState<string | null>(null);
  const [travelToError, setTravelToError] = React.useState<string | null>(null);

  const [dob, setDob] = React.useState(saved?.dob ?? "");
  const [age, setAge] = React.useState<number | "">(saved?.age ?? "");
  const [dobError, setDobError] = React.useState<string | null>(null);

  const [passportNumber, setPassportNumber] = React.useState(saved?.passportNumber ?? "");
  const [phoneNumber, setPhoneNumber] = React.useState(saved?.phoneNumber ?? "");

  const [periodId, setPeriodId] = React.useState<string>(saved?.periodId ?? "");
  const [periodLoading, setPeriodLoading] = React.useState(false);
  const [periodError, setPeriodError] = React.useState<string | null>(null);

  const [ageBandList, setAgeBandList] = React.useState<AgeBandItem[]>([]);
  const [ageBandValue, setAgeBandValue] = React.useState<string>(saved?.ageBandValue ?? "");
  const [ageBandError, setAgeBandError] = React.useState<string | null>(null);

  const [loadingAgeBands, setLoadingAgeBands] = React.useState(false);
  const [ageBandsError, setAgeBandsError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const st = (location.state || {}) as CoverageState;
    setCoverageState({
      planValue: st.planValue ?? "",
      areaValue: st.areaValue ?? "",
      packageValue: st.packageValue ?? "",
    });
  }, [location.state]);

  const planId = coverageState.planValue || "";
  const areaId = coverageState.areaValue || "";
  const packageId = coverageState.packageValue || "";
  const todayStr = React.useMemo(() => todayISO(), []);

  // Save form data to localStorage whenever it changes
  React.useEffect(() => {
    saveToStorage({
      travelFrom,
      travelTo,
      noOfDays,
      numberOfTravelers,
      dob,
      age,
      passportNumber,
      phoneNumber,
      periodId,
      ageBandValue,
    });
  }, [travelFrom, travelTo, noOfDays, numberOfTravelers, dob, age, passportNumber, phoneNumber, periodId, ageBandValue]);

  function handleBack() {
    navigate("/travel-coverage", { state: coverageState });
  }

  React.useEffect(() => {
    let mounted = true;

    async function loadAgeBands() {
      try {
        setLoadingAgeBands(true);
        setAgeBandsError(null);

        const res = await getTravelAgeBandsPublic();
        const list: AgeBandItem[] = Array.isArray(res?.travel_age_band_list)
          ? res.travel_age_band_list
          : [];

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

  // Re-evaluate age band when ageBandList loads after DOB was already selected
  React.useEffect(() => {
    if (ageBandList.length === 0 || !dob) return;
    const yrs = calcAgeYears(dob);
    if (yrs < 16) return;
    const bandVal = findAgeBandValue(ageBandList, yrs);
    setAgeBandValue(bandVal);
    setAgeBandError(bandVal ? null : `Age ${yrs} is not allowed in available age bands`);
  }, [ageBandList, dob]);

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
      setTravelToError(null);
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

    if (yrs < 16) {
      setDobError("Minimum age is 16 years");
      setAge(yrs);
      setAgeBandValue("");
      return;
    }

    setAge(yrs);

    if (ageBandList.length > 0) {
      const bandVal = findAgeBandValue(ageBandList, yrs);
      setAgeBandValue(bandVal);
      setAgeBandError(bandVal ? null : `Age ${yrs} is not allowed in available age bands`);
    } else {
      setAgeBandValue("");
    }
  };

  const onChangeNumberOfTravelers = (value: string) => {
    const numValue = parseInt(value) || 1;
    const clampedValue = Math.min(10, Math.max(1, numValue));
    setNumberOfTravelers(clampedValue);
  };

  React.useEffect(() => {
    let cancelled = false;

    async function loadPeriod() {
      if (!planId || !areaId || !packageId) return;
      if (typeof noOfDays !== "number") return;
      if (noOfDays <= 0) return;

      try {
        setPeriodLoading(true);
        setPeriodError(null);
        setPeriodId("");

        const resp: TravelPeriodResponse = await getTravelPeriod(
          planId,
          noOfDays,
          areaId,
          packageId
        );

        if (cancelled) return;

        const list = Array.isArray(resp?.catalogue_list) ? resp.catalogue_list : [];

        if (list.length === 0) {
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
  }, [planId, areaId, packageId, noOfDays]);

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

    if (!dob) {
      setDobError("Please select DOB");
      ok = false;
    } else {
      const yrs = calcAgeYears(dob);
      if (yrs < 16) {
        setDobError("Minimum age is 16 years");
        ok = false;
      }
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

    if (!planId || !areaId || !packageId) {
      setPeriodError("Missing plan, area, or package selection. Please go back.");
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

    navigate("/premium-summary", {
      state: {
        ...coverageState,
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
      },
    });
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
    <>
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
                {periodLoading && (
                  <p className="text-xs mt-2 text-muted-foreground">Loading period...</p>
                )}
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

          <div className="border rounded-lg p-6 mb-6">
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

          <div className="flex gap-4">
            <Button variant="outline" onClick={handleBack} className="gap-2">
              <ChevronLeft className="w-4 h-4" />
              BACK
            </Button>

            <Button onClick={onNext} disabled={calculateDisabled}>
              NEXT
            </Button>
          </div>
    </>
  );
}
