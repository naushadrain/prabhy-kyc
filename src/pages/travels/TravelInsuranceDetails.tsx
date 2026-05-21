// src/pages/travels/TravelInsuranceDetails.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { getTravelAgeBands } from "@/api/travels/GetTravelAgeBands";
import { getTravelPeriod } from "@/api/travels/GetTravelCatalogues";

type AgeBandItem = {
  value: string;
  data:string;
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
  planLabel?: string;
};

export const TravelInsuranceDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [coverageState, setCoverageState] = useState<CoverageState>({
    planValue: "",
    areaValue: "",
    packageValue: "",
    planLabel: "",
  });

  const planId = coverageState.planValue || "";
  const areaId = coverageState.areaValue || "";
  const packageId = coverageState.packageValue || "";

  const isAnnualStudentPlan = useMemo(() => {
    return (coverageState.planLabel || "")
      .toLowerCase()
      .includes("annual student plan");
  }, [coverageState.planLabel]);

  const maxAllowedDays = isAnnualStudentPlan ? 366 : 180;

  function handleBack() {
    navigate("/travel-insurance-coverage", { state: coverageState });
  }

  const todayStr = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const minDobStr = useMemo(() => {
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

  const [travelFrom, setTravelFrom] = useState("");
  const [travelTo, setTravelTo] = useState("");
  const [noOfDays, setNoOfDays] = useState<number | "">("");
  const [numberOfTravelers, setNumberOfTravelers] = useState<number>(1);

  const [travelFromError, setTravelFromError] = useState<string | null>(null);
  const [travelToError, setTravelToError] = useState<string | null>(null);

  const [dob, setDob] = useState("");
  const [age, setAge] = useState<number | "">("");
  const [dobError, setDobError] = useState<string | null>(null);

  const [passportNumber, setPassportNumber] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const [periodId, setPeriodId] = useState<string>("");
  const [periodLoading, setPeriodLoading] = useState(false);
  const [periodError, setPeriodError] = useState<string | null>(null);
  const [periodResp, setPeriodResp] = useState<PeriodApiResponse | null>(null);
  const [periodSelectedLabel, setPeriodSelectedLabel] = useState<string>("");

  const [ageBandList, setAgeBandList] = useState<AgeBandItem[]>([]);
  const [ageBandValue, setAgeBandValue] = useState<string>("");
  const [ageBandError, setAgeBandError] = useState<string | null>(null);

  const [loadingAgeBands, setLoadingAgeBands] = useState(false);
  const [ageBandsError, setAgeBandsError] = useState<string | null>(null);

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

  useEffect(() => {
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
        planLabel: st.planLabel ?? ls.planLabel ?? "",
      };

      setCoverageState(merged);
    }

    loadCoverageState();
  }, [location.state]);

  useEffect(() => {
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
  }, [dob]);

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
      setTravelToError(
        d > maxAllowedDays
          ? `No of Days must be below ${maxAllowedDays} days`
          : null
      );
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

    if (d > maxAllowedDays) {
      setTravelToError(`No of Days must be below ${maxAllowedDays} days`);
    }
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

  useEffect(() => {
    let cancelled = false;

    async function loadPeriod() {
      if (!planId) return;
      if (!areaId) return;
      if (!packageId) return;
      if (typeof noOfDays !== "number") return;
      if (noOfDays <= 0) return;
      if (noOfDays > maxAllowedDays) return;

      try {
        setPeriodLoading(true);
        setPeriodError(null);

        const resp: PeriodApiResponse = await getTravelPeriod(
          planId,
          noOfDays,
          areaId,
          packageId
        );

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
  }, [planId, areaId, packageId, noOfDays, maxAllowedDays]);

  const onNext = () => {
    let ok = true;

    if (!travelFrom) {
      setTravelFromError("Please select Travel Period From");
      ok = false;
    } else if (travelFrom < tomorrowStr) {
      setTravelFromError("Today's or past dates are not allowed");
      ok = false;
    }

    if (!travelTo) {
      setTravelToError("Please select Travel Period To");
      ok = false;
    } else if (travelTo < tomorrowStr) {
      setTravelToError("Today's or past dates are not allowed");
      ok = false;
    } else if (travelFrom && travelTo < travelFrom) {
      setTravelToError("Travel Period To must be same or after Travel Period From");
      ok = false;
    }

    if (typeof noOfDays === "number" && noOfDays > maxAllowedDays) {
      setTravelToError(`No of Days must be below ${maxAllowedDays} days`);
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
    } else if (!areaId) {
      setPeriodError("Missing area_id (go back and select area)");
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

    localStorage.setItem(
      "travel.coverageDetails",
      JSON.stringify(coverageDetailsPayload)
    );
    navigate("/travel-insurance-premium");
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
            <h1 className="text-2xl font-bold mb-2">
              Travel Medical Insurance Individual Plan
            </h1>

            <div className="border rounded-lg p-6 mb-6">
              <div className="mb-4 text-sm text-muted-foreground">
                Maximum allowed days for this plan: {maxAllowedDays}
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label htmlFor="travelFrom">Travel Period From</Label>
                  <Input
                    id="travelFrom"
                    type="date"
                    className="mt-2"
                    value={travelFrom}
                    onChange={(e) => onChangeTravelFrom(e.target.value)}
                    min={tomorrowStr}
                  />
                  {travelFromError && (
                    <p className="mt-1 text-sm text-red-600">{travelFromError}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="travelTo">Travel Period To</Label>
                  <Input
                    id="travelTo"
                    type="date"
                    className="mt-2"
                    value={travelTo}
                    onChange={(e) => onChangeTravelTo(e.target.value)}
                    min={travelFrom || tomorrowStr}
                    disabled={!travelFrom}
                  />
                  {travelToError && (
                    <p className="mt-1 text-sm text-red-600">{travelToError}</p>
                  )}
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
                    <p className="text-xs mt-2 text-muted-foreground">
                      Loading period...
                    </p>
                  )}
                  {periodError && (
                    <p className="text-xs mt-2 text-red-600">{periodError}</p>
                  )}
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
                    min="1900-01-01"
                  />
                  {dobError && (
                    <p className="mt-1 text-sm text-red-600">{dobError}</p>
                  )}
                  {ageBandError && (
                    <p className="mt-1 text-sm text-red-600">{ageBandError}</p>
                  )}
                  {ageBandsError && (
                    <p className="mt-1 text-sm text-red-600">{ageBandsError}</p>
                  )}
                  {loadingAgeBands && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      Loading age bands...
                    </p>
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

              <Button
                className="bg-primary hover:bg-primary/90"
                onClick={onNext}
                disabled={calculateDisabled}
              >
                NEXT
              </Button>
            </div>
    </>
  );
};