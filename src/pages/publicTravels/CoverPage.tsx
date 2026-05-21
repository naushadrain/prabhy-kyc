import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Ban, ChevronLeft } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  getTravelCataloguesPlane,
  getTravelCataloguesArea,
  getTravelCataloguesPackage,
} from "@/api/travels/GetTravelCataloguesPublic";

type CatalogueItem = { value: string; data: string };

type CoverageState = {
  planValue?: string;
  areaValue?: string;
  packageValue?: string;
};

export const TravelCoverage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const pageState = (location.state || {}) as CoverageState;

  const [planList, setPlanList] = React.useState<CatalogueItem[]>([]);
  const [planValue, setPlanValue] = React.useState<string>(pageState.planValue || "");
  const [loadingPlans, setLoadingPlans] = React.useState<boolean>(true);
  const [planError, setPlanError] = React.useState<string | null>(null);

  const [areaList, setAreaList] = React.useState<CatalogueItem[]>([]);
  const [areaValue, setAreaValue] = React.useState<string>(pageState.areaValue || "");
  const [loadingAreas, setLoadingAreas] = React.useState<boolean>(false);
  const [areaError, setAreaError] = React.useState<string | null>(null);

  const [packageList, setPackageList] = React.useState<CatalogueItem[]>([]);
  const [packageValue, setPackageValue] = React.useState<string>(pageState.packageValue || "");
  const [loadingPackages, setLoadingPackages] = React.useState<boolean>(false);
  const [packageError, setPackageError] = React.useState<string | null>(null);

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

  const loadPackages = React.useCallback(async (areaId: string, planId: string) => {
    if (!areaId || !planId) return;

    try {
      setLoadingPackages(true);
      setPackageError(null);

      const res = await getTravelCataloguesPackage(areaId, planId,planId);
      const list = Array.isArray(res?.catalogue_list) ? res.catalogue_list : [];
      setPackageList(list);
    } catch (e: any) {
      setPackageError(e?.message ?? "Failed to load packages");
      setPackageList([]);
    } finally {
      setLoadingPackages(false);
    }
  }, []);

  React.useEffect(() => {
    let mounted = true;

    const initializeData = async () => {
      try {
        setLoadingPlans(true);
        setPlanError(null);

        const res = await getTravelCataloguesPlane();
        if (!mounted) return;

        const plans = Array.isArray(res?.catalogue_list) ? res.catalogue_list : [];
        setPlanList(plans);

        const restoredPlan = pageState.planValue || "";
        const restoredArea = pageState.areaValue || "";
        const restoredPackage = pageState.packageValue || "";

        if (restoredPlan) {
          await loadAreas(restoredPlan);
        }

        if (restoredPlan && restoredArea) {
          await loadPackages(restoredArea, restoredPlan);
        }

        if (mounted) {
          setPlanValue(restoredPlan);
          setAreaValue(restoredArea);
          setPackageValue(restoredPackage);
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
  }, [pageState.planValue, pageState.areaValue, pageState.packageValue, loadAreas, loadPackages]);

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

    navigate("/travels", {
      state: {
        planValue,
        areaValue,
        packageValue,
      },
    });
  };

  const handleBack = () => {
    navigate("/dashboard");
  };

  return (
    <>
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
                    <SelectValue placeholder={loadingPlans ? "Loading plans..." : "Select a plan"} />
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

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8">
            <Button variant="outline" onClick={handleBack} type="button">
              <ChevronLeft className="w-4 h-4" />
              Back
            </Button>

            <Button
              className="bg-primary hover:bg-primary/90 flex-1 sm:flex-none"
              onClick={handleNext}
              disabled={isNextDisabled()}
              type="button"
            >
              {isNextDisabled() && <Ban className="w-4 h-4 mr-2" />}
              Continue
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