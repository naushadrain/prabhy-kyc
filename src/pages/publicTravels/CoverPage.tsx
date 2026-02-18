import React from "react";
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
import { Ban, LogIn, ChevronLeft } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import {
  getTravelCataloguesPlane,
  getTravelCataloguesArea,
  getTravelCataloguesPackage,
} from "@/api/travels/GetTravelCatalogues";

import logo from "@/assets/logo.png";

type CatalogueItem = { value: string; data: string };

type CoverageState = {
  planValue?: string;
  areaValue?: string;
  packageValue?: string;
};

export const TravelCoverage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  // State management
  const [planList, setPlanList] = React.useState<CatalogueItem[]>([]);
  const [planValue, setPlanValue] = React.useState<string>("");
  const [loadingPlans, setLoadingPlans] = React.useState<boolean>(true);
  const [planError, setPlanError] = React.useState<string | null>(null);

  const [areaList, setAreaList] = React.useState<CatalogueItem[]>([]);
  const [areaValue, setAreaValue] = React.useState<string>("");
  const [loadingAreas, setLoadingAreas] = React.useState<boolean>(false);
  const [areaError, setAreaError] = React.useState<string | null>(null);

  const [packageList, setPackageList] = React.useState<CatalogueItem[]>([]);
  const [packageValue, setPackageValue] = React.useState<string>("");
  const [loadingPackages, setLoadingPackages] = React.useState<boolean>(false);
  const [packageError, setPackageError] = React.useState<string | null>(null);

  // Load areas based on selected plan
  const loadAreas = React.useCallback(async (planId: string) => {
    if (!planId) return;
    
    try {
      setLoadingAreas(true);
      setAreaError(null);

      const res = await getTravelCataloguesArea(planId);
      const list = Array.isArray(res?.catalogue_list) ? res.catalogue_list : [];
      setAreaList(list);
    } catch (e: any) {
      setAreaError(e?.message ?? "Failed to load areas");
      setAreaList([]);
    } finally {
      setLoadingAreas(false);
    }
  }, []);

  // Load packages based on selected area and plan
  const loadPackages = React.useCallback(async (areaId: string, planId: string) => {
    if (!areaId || !planId) return;
    
    try {
      setLoadingPackages(true);
      setPackageError(null);

      const res = await getTravelCataloguesPackage(areaId, planId);
      const list = Array.isArray(res?.catalogue_list) ? res.catalogue_list : [];
      setPackageList(list);
    } catch (e: any) {
      setPackageError(e?.message ?? "Failed to load packages");
      setPackageList([]);
    } finally {
      setLoadingPackages(false);
    }
  }, []);

  // Initial load and restore from state/localStorage
  React.useEffect(() => {
    let mounted = true;

    const initializeData = async () => {
      try {
        setLoadingPlans(true);
        
        // Load plans
        const res = await getTravelCataloguesPlane();
        if (!mounted) return;
        
        const plans = Array.isArray(res?.catalogue_list) ? res.catalogue_list : [];
        setPlanList(plans);

        // Restore selections from location.state OR localStorage
        const state = (location.state || {}) as CoverageState;
        const savedState = localStorage.getItem("travel.coveragePlan");
        const parsedSaved = savedState ? JSON.parse(savedState) : {};

        const restoredPlan = state.planValue || parsedSaved.planValue || "";
        const restoredArea = state.areaValue || parsedSaved.areaValue || "";
        const restoredPackage = state.packageValue || parsedSaved.packageValue || "";

        setPlanValue(restoredPlan);
        setAreaValue(restoredArea);
        setPackageValue(restoredPackage);

        // Load dependent data if needed
        if (restoredPlan) {
          await loadAreas(restoredPlan);
        }

        if (restoredPlan && restoredArea) {
          await loadPackages(restoredArea, restoredPlan);
        }

      } catch (e: any) {
        if (!mounted) return;
        setPlanError(e?.message ?? "Failed to load plans");
      } finally {
        if (mounted) setLoadingPlans(false);
      }
    };

    initializeData();

    return () => {
      mounted = false;
    };
  }, [location.state, loadAreas, loadPackages]);

  // Handlers
  const onPlanChange = async (value: string) => {
    setPlanValue(value);
    setAreaValue("");
    setPackageValue("");
    setAreaList([]);
    setPackageList([]);
    
    if (value) {
      await loadAreas(value);
    }
    
    // Save to localStorage
    localStorage.setItem("travel.coveragePlan", JSON.stringify({
      planValue: value,
      areaValue: "",
      packageValue: "",
    }));
  };

  const onAreaChange = async (value: string) => {
    setAreaValue(value);
    setPackageValue("");
    setPackageList([]);
    
    if (value && planValue) {
      await loadPackages(value, planValue);
    }
    
    // Update localStorage
    const saved = JSON.parse(localStorage.getItem("travel.coveragePlan") || "{}");
    localStorage.setItem("travel.coveragePlan", JSON.stringify({
      ...saved,
      areaValue: value,
      packageValue: "",
    }));
  };

  const onPackageChange = (value: string) => {
    setPackageValue(value);
    
    // Update localStorage
    const saved = JSON.parse(localStorage.getItem("travel.coveragePlan") || "{}");
    localStorage.setItem("travel.coveragePlan", JSON.stringify({
      ...saved,
      packageValue: value,
    }));
  };

  const isNextDisabled = () => {
    return (
      loadingPlans ||
      loadingAreas ||
      loadingPackages ||
      !!planError ||
      !!areaError ||
      !!packageError ||
      !planValue ||
      !areaValue ||
      !packageValue
    );
  };

  const handleNext = () => {
    if (isNextDisabled()) return;

    const payload = { planValue, areaValue, packageValue };
    localStorage.setItem("travel.coveragePlan", JSON.stringify(payload));
    navigate("/travels", { state: payload });
  };

  const handleBack = () => navigate("/dashboard");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <img src={logo} alt="Prabhu Insurance" className="h-9 w-auto shrink-0" />
              <div className="hidden sm:block">
                <div className="text-sm font-semibold">Prabhu Insurance</div>
                <div className="text-xs text-muted-foreground">Travel Medical Insurance</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
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

      {/* Main Content */}
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          
          {/* Title */}
          <div className="mb-6">
            <h1 className="text-xl sm:text-2xl font-bold">
              Travel Medical Insurance Individual Plan
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Step 1 of 3: Select your coverage plan
            </p>
          </div>

          {/* Terms */}
          <div className="bg-secondary/20 rounded-lg p-5 sm:p-6 mb-6">
            <h2 className="text-base sm:text-lg font-semibold text-primary mb-3">
              Travel Medical Insurance Terms:
            </h2>
            <div className="space-y-1 text-sm">
              <p>• Maximum Age: 70 years</p>
              <p>• Maximum Travel Period: 180 days (6 months)</p>
              <p>• Toll-Free Support: 16600150050</p>
            </div>
          </div>

          {/* Error Messages */}
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

          {/* Selection Form */}
          <div className="space-y-6 mb-8">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Plan Selection */}
              <div>
                <Label htmlFor="plan">Plan</Label>
                <Select
                  value={planValue}
                  onValueChange={onPlanChange}
                  disabled={loadingPlans || !!planError}
                >
                  <SelectTrigger id="plan" className="mt-2">
                    <SelectValue 
                      placeholder={loadingPlans ? "Loading plans..." : "Select a plan"} 
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

              {/* Area Selection */}
              <div>
                <Label htmlFor="area">Area</Label>
                <Select
                  value={areaValue}
                  onValueChange={onAreaChange}
                  disabled={!planValue || loadingAreas || !!areaError}
                >
                  <SelectTrigger id="area" className="mt-2">
                    <SelectValue 
                      placeholder={
                        !planValue 
                          ? "Select plan first" 
                          : loadingAreas 
                          ? "Loading areas..." 
                          : "Select area"
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

            {/* Package Selection */}
            <div>
              <Label htmlFor="package">Package Type</Label>
              <Select
                value={packageValue}
                onValueChange={onPackageChange}
                disabled={!planValue || !areaValue || loadingPackages || !!packageError}
              >
                <SelectTrigger id="package" className="mt-2">
                  <SelectValue 
                    placeholder={
                      !planValue 
                        ? "Select plan first"
                        : !areaValue
                        ? "Select area first"
                        : loadingPackages
                        ? "Loading packages..."
                        : "Select package"
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
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8">
            <Button variant="outline" onClick={handleBack} type="button">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>

            <Button
              className="bg-primary hover:bg-primary/90 flex-1 sm:flex-none"
              onClick={handleNext}
              disabled={isNextDisabled()}
              type="button"
            >
              {isNextDisabled() && <Ban className="w-4 h-4 mr-2" />}
              Continue to Next Step
            </Button>
          </div>

          {/* Benefits */}
          <div className="bg-secondary/20 rounded-lg p-5 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-primary mb-4">
              Package Benefits Include:
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
              <p>✓ Personal Accident</p>
              <p>✓ Medical Expenses</p>
              <p>✓ Hospital Benefits</p>
              <p>✓ Loss of Baggage</p>
              <p>✓ Baggage Delay</p>
              <p>✓ Loss of Passport</p>
              <p>✓ Personal Liability</p>
              <p>✓ Travel Delay</p>
              <p>✓ Hijack Coverage</p>
              <p>✓ Cancellation</p>
              <p>✓ Emergency Return</p>
              <p>✓ Legal Expenses</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};