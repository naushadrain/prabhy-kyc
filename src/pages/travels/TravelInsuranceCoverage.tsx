import React, { useState, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
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
import { ChevronLeft, Ban } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  getTravelCataloguesPlane,
  getTravelCataloguesArea,
  getTravelCataloguesPackage,
} from "@/api/travels/GetTravelCatalogues";

type CatalogueItem = { value: string; data: string };

type CoverageState = {
  planValue?: string;
  areaValue?: string;
  packageValue?: string;
};

export const TravelInsuranceCoverage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  const handleBack = () => navigate("/dashboard");

  // Step status management
  const steps = [
    { number: 1, label: "Coverage Plan", status: "inProcess" },
    { number: 2, label: "Coverage Details", status: "pending" },
    { number: 3, label: "Instant Quotes", status: "pending" },
  ];

  // -------------------- PLAN --------------------
  const [planList, setPlanList] = useState<CatalogueItem[]>([]);
  const [planValue, setPlanValue] = useState<string>("");
  const [loadingPlans, setLoadingPlans] = useState<boolean>(true);
  const [planError, setPlanError] = useState<string | null>(null);

  // -------------------- AREA --------------------
  const [areaList, setAreaList] = useState<CatalogueItem[]>([]);
  const [areaValue, setAreaValue] = useState<string>("");
  const [loadingAreas, setLoadingAreas] = useState<boolean>(false);
  const [areaError, setAreaError] = useState<string | null>(null);

  // -------------------- PACKAGE --------------------
  const [packageList, setPackageList] = useState<CatalogueItem[]>([]);
  const [packageValue, setPackageValue] = useState<string>("");
  const [loadingPackages, setLoadingPackages] = useState<boolean>(false);
  const [packageError, setPackageError] = useState<string | null>(null);

  // Load areas
  const loadAreas = useCallback(async (areaPlanId: string) => {
    if (!areaPlanId) return;
    
    try {
      setLoadingAreas(true);
      setAreaError(null);
      const res = await getTravelCataloguesArea(areaPlanId);
      const list = Array.isArray(res?.catalogue_list) ? res.catalogue_list : [];
      setAreaList(list);
    } catch (e: any) {
      setAreaList([]);
      setAreaError(e?.message ?? "Failed to load areas");
    } finally {
      setLoadingAreas(false);
    }
  }, []);

  // Load packages
  const loadPackages = useCallback(async (areaId: string, areaPlanId: string) => {
    if (!areaId || !areaPlanId) return;
    
    try {
      setLoadingPackages(true);
      setPackageError(null);
      const res = await getTravelCataloguesPackage(areaId, areaPlanId);
      const list = Array.isArray(res?.catalogue_list) ? res.catalogue_list : [];
      setPackageList(list);
    } catch (e: any) {
      setPackageList([]);
      setPackageError(e?.message ?? "Failed to load packages");
    } finally {
      setLoadingPackages(false);
    }
  }, []);

  // Initial load and restore from localStorage/state
  useEffect(() => {
    let mounted = true;

    const initializeData = async () => {
      try {
        setLoadingPlans(true);
        
        // Load plans
        const res = await getTravelCataloguesPlane();
        if (!mounted) return;
        
        const plans = Array.isArray(res?.catalogue_list) ? res.catalogue_list : [];
        setPlanList(plans);

        // Try to get saved values from localStorage first
        const savedState = localStorage.getItem("travel.coveragePlan");
        let savedValues: CoverageState = {};
        
        if (savedState) {
          try {
            savedValues = JSON.parse(savedState);
          } catch (e) {
            console.error("Failed to parse saved state:", e);
          }
        }

        // Get values from location.state (if coming back from next page)
        const state = (location.state || {}) as CoverageState;

        // Determine which values to use (state overrides localStorage)
        const restoredPlan = state.planValue || savedValues.planValue || "";
        const restoredArea = state.areaValue || savedValues.areaValue || "";
        const restoredPackage = state.packageValue || savedValues.packageValue || "";

        // Set values
        setPlanValue(restoredPlan);
        setAreaValue(restoredArea);
        setPackageValue(restoredPackage);

        // Load dependent dropdowns if needed
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

  // Save to localStorage whenever values change
  useEffect(() => {
    if (planValue || areaValue || packageValue) {
      localStorage.setItem("travel.coveragePlan", JSON.stringify({
        planValue,
        areaValue,
        packageValue,
      }));
    }
  }, [planValue, areaValue, packageValue]);

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
  };

  const onAreaChange = async (value: string) => {
    setAreaValue(value);
    setPackageValue("");
    setPackageList([]);
    
    if (value && planValue) {
      await loadPackages(value, planValue);
    }
  };

  const onPackageChange = (value: string) => {
    setPackageValue(value);
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

    const coveragePlanPayload = {
      planValue,
      areaValue,
      packageValue,
    };

    localStorage.setItem("travel.coveragePlan", JSON.stringify(coveragePlanPayload));
    navigate("/travel-insurance-details", { state: coveragePlanPayload });
  };

  // Check if there are any errors to display
  const hasErrors = planError || areaError || packageError;

  return (
    <div className="flex min-h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-8 bg-background">
          {/* Stepper - Top of the page */}
          <div className="mb-12">
            <div className="flex items-center justify-between max-w-5xl mx-auto">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                        step.status === "inProcess"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {step.number}
                    </div>
                    <span className="text-xs text-center max-w-[120px] font-medium">
                      STEP {step.number}
                    </span>
                    <span
                      className={`text-xs mt-1 ${
                        step.status === "inProcess"
                          ? "text-primary"
                          : "text-orange-500"
                      }`}
                    >
                      {step.status === "inProcess"
                        ? "In Process"
                        : "Pending"}
                    </span>
                    <span className="text-xs text-center max-w-[120px] mt-1">
                      {step.label}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="flex-1 h-0.5 bg-border mx-2"></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="max-w-5xl mx-auto">
            <Button variant="ghost" onClick={handleBack} className="mb-6 gap-2">
              <ChevronLeft className="w-4 h-4" /> Back to Dashboard
            </Button>

            <h1 className="text-2xl font-bold mb-2">
              Travel Medical Insurance Individual Plan
            </h1>
            <p className="text-muted-foreground mb-8">
              Step 1 of 3: Select your coverage plan
            </p>

            {/* Errors - Display only once */}
            {hasErrors && (
              <div className="mb-6 space-y-2">
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

            <div className="bg-secondary/20 rounded-lg p-6 mb-8">
              <h2 className="text-lg font-semibold text-primary mb-3">
                Travel Medical Insurance Terms:
              </h2>
              <div className="space-y-1 text-sm">
                <p>• Maximum Age: 70 years</p>
                <p>• Maximum Travel Period: 180 days (6 months)</p>
                <p>• Toll-Free Support: 16600150050</p>
              </div>
            </div>

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

            {/* Action Buttons */}
            <div className="flex gap-4 mb-8">
              <Button 
                variant="outline" 
                onClick={handleBack} 
                className="gap-2 min-w-[100px]"
              >
                <ChevronLeft className="w-4 h-4" />
                BACK
              </Button>

              <Button
                className="bg-primary hover:bg-primary/90 gap-2 min-w-[100px]"
                onClick={onNext}
                disabled={nextDisabled}
                type="button"
              >
                {nextDisabled && <Ban className="w-4 h-4" />}
                NEXT
              </Button>
            </div>

            {/* Benefits List - Simple bullet points */}
            <div className="bg-secondary/20 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-primary mb-4">
                Package Benefits Include:
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                <p>A – Personal Accident</p>
                <p>B – Medical & Emergency Expenses</p>
                <p>C – Hospital Benefits</p>
                <p>D – Loss of Checked Baggage</p>
                <p>E – Delay of Checked Baggage</p>
                <p>F – Loss of Passport</p>
                <p>G – Personal Liability</p>
                <p>H – Travel Delay</p>
                <p>I – Hijack</p>
                <p>J – Cancellation & Curtailment</p>
                <p>K – Emergency Return Home</p>
                <p>L – Catastrophe</p>
                <p>M – Legal Expenses</p>
                <p>N – Repatriation of Family Member</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};