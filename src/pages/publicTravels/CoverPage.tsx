import React, { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Ban, LogIn } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import {
  getTravelCataloguesPlane,
  getTravelCataloguesArea,
  getTravelCataloguesPackage,
} from "@/api/travels/GetTravelCatalogues";

import logo from "@/assets/logo.png";

type CatalogueItem = { value: string; data: string };

// type for router state
type CoverageState = {
  planValue?: string;
  areaValue?: string;
  packageValue?: string;
};

export const TravelCoverage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => navigate("/dashboard");

  const steps = [
    { number: 1, label: "Coverage Plan", status: "inProcess" as const },
    { number: 2, label: "Coverage Details", status: "pending" as const },
    { number: 3, label: "Instant Quotes", status: "pending" as const },
  ];

  // -------------------- PLAN --------------------
  const [planList, setPlanList] = React.useState<CatalogueItem[]>([]);
  const [planValue, setPlanValue] = React.useState<string>("");
  const [loadingPlans, setLoadingPlans] = React.useState<boolean>(true);
  const [planError, setPlanError] = React.useState<string | null>(null);

  // -------------------- AREA --------------------
  const [areaList, setAreaList] = React.useState<CatalogueItem[]>([]);
  const [areaValue, setAreaValue] = React.useState<string>("");
  const [loadingAreas, setLoadingAreas] = React.useState<boolean>(false);
  const [areaError, setAreaError] = React.useState<string | null>(null);

  // -------------------- PACKAGE --------------------
  const [packageList, setPackageList] = React.useState<CatalogueItem[]>([]);
  const [packageValue, setPackageValue] = React.useState<string>("");
  const [loadingPackages, setLoadingPackages] = React.useState<boolean>(false);
  const [packageError, setPackageError] = React.useState<string | null>(null);

  // -------------------- loaders --------------------
  const loadAreas = React.useCallback(async (areaPlanId: string) => {
    try {
      setLoadingAreas(true);
      setAreaError(null);

      const res = await getTravelCataloguesArea(areaPlanId);
      const list: CatalogueItem[] = Array.isArray(res?.catalogue_list)
        ? res.catalogue_list
        : [];

      setAreaList(list);
    } catch (e: any) {
      setAreaList([]);
      setAreaError(e?.message ?? "Failed to load areas");
    } finally {
      setLoadingAreas(false);
    }
  }, []);

  const loadPackages = React.useCallback(async (areaId: string, areaPlanId: string) => {
    try {
      setLoadingPackages(true);
      setPackageError(null);

      const res = await getTravelCataloguesPackage(areaId, areaPlanId);
      const list: CatalogueItem[] = Array.isArray(res?.catalogue_list)
        ? res.catalogue_list
        : [];

      setPackageList(list);
    } catch (e: any) {
      setPackageList([]);
      setPackageError(e?.message ?? "Failed to load packages");
    } finally {
      setLoadingPackages(false);
    }
  }, []);

  // -------------------- initial load + restore from router state --------------------
  React.useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoadingPlans(true);
        setPlanError(null);

        const res = await getTravelCataloguesPlane();
        const list: CatalogueItem[] = Array.isArray(res?.catalogue_list)
          ? res.catalogue_list
          : [];

        if (!mounted) return;

        setPlanList(list);

        // restore selections from location.state (when coming back)
        const state = (location.state || {}) as CoverageState;

        const restoredPlan = state.planValue ?? "";
        const restoredArea = state.areaValue ?? "";
        const restoredPackage = state.packageValue ?? "";

        // set restored values
        setPlanValue(restoredPlan);
        setAreaValue(restoredArea);
        setPackageValue(restoredPackage);

        // reload dependent lists so restored values appear in dropdown
        if (restoredPlan) {
          await loadAreas(restoredPlan);
        } else {
          setAreaList([]);
        }

        if (restoredPlan && restoredArea) {
          await loadPackages(restoredArea, restoredPlan);
        } else {
          setPackageList([]);
        }
      } catch (e: any) {
        if (!mounted) return;
        setPlanError(e?.message ?? "Failed to load plans");
      } finally {
        if (!mounted) return;
        setLoadingPlans(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [location.state, loadAreas, loadPackages]);

  // -------------------- handlers --------------------
  const onPlanChange = async (v: string) => {
    setPlanValue(v);

    // reset dependent dropdowns
    setAreaList([]);
    setAreaValue("");
    setAreaError(null);

    setPackageList([]);
    setPackageValue("");
    setPackageError(null);

    if (v) await loadAreas(v);
  };

  const onAreaChange = async (v: string) => {
    setAreaValue(v);

    // reset packages
    setPackageList([]);
    setPackageValue("");
    setPackageError(null);

    if (v && planValue) await loadPackages(v, planValue);
  };

  const nextDisabled =
    loadingPlans ||
    loadingAreas ||
    loadingPackages ||
    !!planError ||
    !!areaError ||
    !!packageError ||
    !planValue ||
    !areaValue ||
    !packageValue;

  const onNext = () => {
    if (nextDisabled) return;

    const coveragePlanPayload = { planValue, areaValue, packageValue };
    localStorage.setItem("travel.coveragePlan", JSON.stringify(coveragePlanPayload));

    navigate("/travels", { state: coveragePlanPayload }); // ✅ pass state to step-2
  };

  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ✅ Responsive Top Bar (NO back button here) */}
      <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between gap-3">
            {/* Left: Logo + optional brand text */}
            <div className="flex items-center gap-3 min-w-0">
              <img src={logo} alt="Prabhu Insurance" className="h-9 w-auto shrink-0" />
              <div className="hidden sm:block min-w-0">
                <div className="text-sm font-semibold leading-4 truncate">Prabhu Insurance</div>
                <div className="text-xs text-muted-foreground truncate">
                  Travel Medical Insurance
                </div>
              </div>
            </div>

            {/* Right: Login */}
            <div className="flex items-center gap-2 shrink-0">
              <Link to="/login">
                <Button size="sm" className="gap-2">
                  <LogIn className="h-4 w-4" />
                  <span className="hidden sm:inline">{t("nav.login")}</span>
                  <span className="sm:hidden">Login</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ✅ Main */}
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Stepper */}
          <div className="mb-8 sm:mb-10">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mb-2 ${
                        step.status === "inProcess"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {step.status === "inProcess" ? "✓" : step.number}
                    </div>

                    <span className="text-[10px] sm:text-xs text-center font-medium">
                      STEP {step.number}
                    </span>

                    <span
                      className={`text-[10px] sm:text-xs mt-1 ${
                        step.status === "inProcess" ? "text-primary" : "text-orange-500"
                      }`}
                    >
                      {step.status === "inProcess" ? t("claim.inProcess") : t("claim.pending")}
                    </span>

                    <span className="text-[10px] sm:text-xs text-center mt-1 max-w-[120px]">
                      {step.label}
                    </span>
                  </div>

                  {index < steps.length - 1 && (
                    <div className="flex-1 h-0.5 bg-border mx-2 sm:mx-3" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="mb-6">
            <h1 className="text-xl sm:text-2xl font-bold">
              Travel Medical Insurance Individual Plan
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Fill up your form to get a quote.
            </p>
          </div>

          {/* Travel Terms */}
          <div className="bg-secondary/20 rounded-lg p-5 sm:p-6 mb-6">
            <h2 className="text-base sm:text-lg font-semibold text-primary mb-3">
              Travel Medical Insurance Term:
            </h2>
            <div className="space-y-1 text-sm">
              <p>Age Validation: 70 (maximum)</p>
              <p>Travel period: 180 days (6 months)</p>
              <p>
                For more information, please contact us at our Toll-Free number: 16600150050
              </p>
            </div>
          </div>

          {/* Errors */}
          {(planError || areaError || packageError) && (
            <div className="space-y-3 mb-6">
              {planError && (
                <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {planError}
                </div>
              )}
              {areaError && (
                <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {areaError}
                </div>
              )}
              {packageError && (
                <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {packageError}
                </div>
              )}
            </div>
          )}

          {/* Form */}
          <form onSubmit={(e) => e.preventDefault()}>
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {/* Plan */}
              <div>
                <Label>Plan</Label>
                <Select
                  value={planValue}
                  onValueChange={onPlanChange}
                  disabled={loadingPlans || !!planError}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue
                      placeholder={loadingPlans ? "Loading..." : "Please select a plan"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {planList.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.data}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Area */}
              <div>
                <Label>Area</Label>
                <Select
                  value={areaValue}
                  onValueChange={onAreaChange}
                  disabled={!planValue || loadingAreas || !!areaError}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue
                      placeholder={
                        !planValue
                          ? "Please select the plan first"
                          : loadingAreas
                          ? "Loading..."
                          : "Please select an area"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {areaList.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.data}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Package */}
            <div className="mb-6">
              <Label>Package Type</Label>
              <Select
                value={packageValue}
                onValueChange={setPackageValue}
                disabled={!planValue || !areaValue || loadingPackages || !!packageError}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue
                    placeholder={
                      !planValue
                        ? "Please select the plan first"
                        : !areaValue
                        ? "Please select the area first"
                        : loadingPackages
                        ? "Loading..."
                        : "Please select a package"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {packageList.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.data}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8">
              <Button variant="outline" onClick={handleBack} type="button">
                Back
              </Button>

              <Button
                className="bg-primary hover:bg-primary/90"
                onClick={onNext}
                disabled={nextDisabled}
                type="button"
              >
                {nextDisabled && <Ban className="w-4 h-4 mr-2" />}
                Next
              </Button>
            </div>
          </form>

          {/* Benefits */}
          <div className="bg-secondary/20 rounded-lg p-5 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-primary mb-4">
              Package Benefits Include:
            </h2>
            <div className="space-y-2 text-sm">
              <p>A – Personal Accident</p>
              <p>B – Medical & Emergency Expenses</p>
              <p>C – Hospital Benefits</p>
              <p>Similarly, The following benefits will be covered under A to I Package:</p>
              <p>D – Loss of Checked Baggage</p>
              <p>E – Delay of Checked Baggage</p>
              <p>F – Loss of Passport</p>
              <p>G – Personal Liability</p>
              <p>H – Travel Delay</p>
              <p>I – Hijack</p>
              <p>J – Cancellation & Curtailment</p>
              <p>K – Emergency Return Home if a close family member dies</p>
              <p>L – Catastrophe</p>
              <p>M – Legal Expenses</p>
              <p>N – Repatriation of family member travelling with the participant</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
