// TravelInsuranceCoverage.tsx
import React, { useState, useEffect, useCallback } from "react";
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
  planLabel?: string;
};

export const TravelInsuranceCoverage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => navigate("/dashboard");

  const [planList, setPlanList] = useState<CatalogueItem[]>([]);
  const [planValue, setPlanValue] = useState<string>("");
  const [loadingPlans, setLoadingPlans] = useState<boolean>(true);
  const [planError, setPlanError] = useState<string | null>(null);

  const [areaList, setAreaList] = useState<CatalogueItem[]>([]);
  const [areaValue, setAreaValue] = useState<string>("");
  const [loadingAreas, setLoadingAreas] = useState<boolean>(false);
  const [areaError, setAreaError] = useState<string | null>(null);

  const [packageList, setPackageList] = useState<CatalogueItem[]>([]);
  const [packageValue, setPackageValue] = useState<string>("");
  const [loadingPackages, setLoadingPackages] = useState<boolean>(false);
  const [packageError, setPackageError] = useState<string | null>(null);

  const loadAreas = useCallback(async (planId: string) => {
    if (!planId) return;

    try {
      setLoadingAreas(true);
      setAreaError(null);
      const res = await getTravelCataloguesArea(planId);
      const list = Array.isArray(res?.catalogue_list) ? res.catalogue_list : [];
      setAreaList(list);
    } catch (e: any) {
      setAreaList([]);
      setAreaError(e?.message ?? "Failed to load areas");
    } finally {
      setLoadingAreas(false);
    }
  }, []);

  const loadPackages = useCallback(async (planId: string, areaId: string) => {
    if (!planId || !areaId) return;

    try {
      setLoadingPackages(true);
      setPackageError(null);
      const res = await getTravelCataloguesPackage(planId, areaId);
      const list = Array.isArray(res?.catalogue_list) ? res.catalogue_list : [];
      setPackageList(list);
    } catch (e: any) {
      setPackageList([]);
      setPackageError(e?.message ?? "Failed to load packages");
    } finally {
      setLoadingPackages(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const initializeData = async () => {
      try {
        setLoadingPlans(true);
        setPlanError(null);

        const res = await getTravelCataloguesPlane();
        if (!mounted) return;

        const plans = Array.isArray(res?.catalogue_list) ? res.catalogue_list : [];
        setPlanList(plans);

        const savedState = localStorage.getItem("travel.coveragePlan");
        let savedValues: CoverageState = {};

        if (savedState) {
          try {
            savedValues = JSON.parse(savedState);
          } catch (e) {
            console.error("Failed to parse saved state:", e);
          }
        }

        const state = (location.state || {}) as CoverageState;

        const restoredPlan = state.planValue || savedValues.planValue || "";
        const restoredArea = state.areaValue || savedValues.areaValue || "";
        const restoredPackage = state.packageValue || savedValues.packageValue || "";

        setPlanValue(restoredPlan);
        setAreaValue(restoredArea);
        setPackageValue(restoredPackage);

        if (restoredPlan) {
          await loadAreas(restoredPlan);
        }

        if (restoredPlan && restoredArea) {
          await loadPackages(restoredPlan, restoredArea);
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

  useEffect(() => {
    if (planValue || areaValue || packageValue) {
      const selectedPlan = planList.find((item) => item.value === planValue);

      localStorage.setItem(
        "travel.coveragePlan",
        JSON.stringify({
          planValue,
          areaValue,
          packageValue,
          planLabel: selectedPlan?.data || "",
        })
      );
    }
  }, [planValue, areaValue, packageValue, planList]);

  const onPlanChange = async (value: string) => {
    setPlanValue(value);
    setAreaValue("");
    setPackageValue("");
    setAreaList([]);
    setPackageList([]);
    setAreaError(null);
    setPackageError(null);

    if (value) {
      await loadAreas(value);
    }
  };

  const onAreaChange = async (value: string) => {
    setAreaValue(value);
    setPackageValue("");
    setPackageList([]);
    setPackageError(null);

    if (value && planValue) {
      await loadPackages(planValue, value);
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

    const selectedPlan = planList.find((item) => item.value === planValue);

    const coveragePlanPayload = {
      planValue,
      areaValue,
      packageValue,
      planLabel: selectedPlan?.data || "",
    };

    localStorage.setItem("travel.coveragePlan", JSON.stringify(coveragePlanPayload));
    navigate("/travel-insurance-details", { state: coveragePlanPayload });
  };

  const hasErrors = planError || areaError || packageError;

  return (
    <>
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

            <div className="space-y-6 mb-8">
              <div className="grid md:grid-cols-2 gap-4">
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
    </>
  );
};