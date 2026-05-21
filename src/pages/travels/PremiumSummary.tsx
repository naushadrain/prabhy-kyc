import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTravelPremium } from "@/api/travels/GetTravelPeriod";

type CoverageState = {
  planValue?: string;
  areaValue?: string;
  packageValue?: string;
  planLabel?: string;
};

type CoverageDetailsState = {
  travelFrom?: string;
  travelTo?: string;
  noOfDays?: number;
  numberOfTravelers?: number;
  dob?: string;
  age?: number;
  period_id?: string;
  age_band_id?: string;
  phone_number?: string;
  passport_number?: string;
};

type PremiumSnapshot = {
  currency?: string;
  rate?: number;
  currency_amount?: number;
  premium_in_npr?: number;
  currency_suminsured?: number;
  suminsured_in_npr?: number;
  vat_percent?: number;
  vat_amount?: number;
  stamp_duty?: number;
  total_premium_with_vat?: number;
  taxable_amount?: number;
  direct_discount_amount?: number;
  policy_session_id?: string;
  error_list?: { error_code?: string; error_message?: string }[];
  process_result?: boolean;
  [key: string]: any;
};

const SummaryRow = ({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) => (
  <div className="flex items-center justify-between gap-3 border-b py-2 last:border-b-0">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className="text-sm font-semibold">{value ?? "—"}</span>
  </div>
);

const extractApiErrors = (resp: any): string[] => {
  const list = Array.isArray(resp?.error_list) ? resp.error_list : [];
  const msgs = list.map((x: any) => x?.error_message?.trim()).filter(Boolean);
  if (msgs.length) return msgs;

  const msg = resp?.message?.trim() || resp?.msg?.trim() || "";
  return msg ? [msg] : [];
};

export const PremiumSummaryPage = () => {
  const navigate = useNavigate();

  const [coverageState, setCoverageState] = useState<CoverageState>({
    planValue: "",
    areaValue: "",
    packageValue: "",
    planLabel: "",
  });

  const [coverageDetails, setCoverageDetails] = useState<CoverageDetailsState>({
    travelFrom: "",
    travelTo: "",
    noOfDays: 0,
    numberOfTravelers: 1,
    dob: "",
    age: 0,
    period_id: "",
    age_band_id: "",
    phone_number: "",
    passport_number: "",
  });

  const [premiumLoading, setPremiumLoading] = useState<boolean>(true);
  const [premiumError, setPremiumError] = useState<string | null>(null);
  const [premiumSnapshot, setPremiumSnapshot] = useState<PremiumSnapshot | null>(null);

  const lastPremiumKeyRef = useRef<string>("");

  useEffect(() => {
    try {
      const savedCoverage = localStorage.getItem("travel.coveragePlan");
      const savedDetails = localStorage.getItem("travel.coverageDetails");

      let parsedCoverage: CoverageState = {};
      let parsedDetails: CoverageDetailsState = {};

      if (savedCoverage) {
        parsedCoverage = JSON.parse(savedCoverage);
        setCoverageState(parsedCoverage);
      }

      if (savedDetails) {
        parsedDetails = JSON.parse(savedDetails);
        setCoverageDetails(parsedDetails);
      }
    } catch (error) {
      console.error("Failed to load saved travel data:", error);
      setPremiumError("Failed to load saved travel data");
      setPremiumLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchPremium = async () => {
      const classId = "33";
      const ageBandId = coverageDetails.age_band_id || "";
      const packageId = coverageState.packageValue || "";
      const areaId = coverageState.areaValue || "";
      const areaPlanId = coverageState.planValue || "";
      const periodId = coverageDetails.period_id || "";

      if (!classId || !ageBandId || !packageId || !areaId || !areaPlanId || !periodId) {
        if (
          coverageState.planValue ||
          coverageState.areaValue ||
          coverageState.packageValue ||
          coverageDetails.period_id ||
          coverageDetails.age_band_id
        ) {
          setPremiumError("Missing data required for premium calculation");
          setPremiumLoading(false);
        }
        return;
      }

      const key = `${classId}|${ageBandId}|${packageId}|${areaId}|${areaPlanId}|${periodId}`;
      if (lastPremiumKeyRef.current === key) return;
      lastPremiumKeyRef.current = key;

      try {
        setPremiumLoading(true);
        setPremiumError(null);

        const resp = await getTravelPremium({
          class_id: String(classId),
          age_band_id: String(ageBandId),
          travel_package_id: String(packageId),
          travel_area_id: String(areaId),
          travel_area_plan_id: String(areaPlanId),
          period_id: String(periodId),
        });

        if (cancelled) return;

        const errs = extractApiErrors(resp);
        if (errs.length) {
          setPremiumSnapshot(null);
          setPremiumError(errs[0]);
          return;
        }

        if (resp?.process_result === false) {
          setPremiumSnapshot(null);
          setPremiumError("Failed to calculate premium");
          return;
        }

        setPremiumSnapshot(resp);
        localStorage.setItem("travel.premiumSnapshot", JSON.stringify(resp));

        if (resp?.policy_session_id) {
          localStorage.setItem("travel.policySessionId", resp.policy_session_id);
        }
      } catch (error: any) {
        if (cancelled) return;
        console.error("Premium calculation failed:", error);
        setPremiumSnapshot(null);
        setPremiumError(error?.message ?? "Failed to calculate premium");
      } finally {
        if (!cancelled) {
          setPremiumLoading(false);
        }
      }
    };

    fetchPremium();

    return () => {
      cancelled = true;
    };
  }, [coverageState, coverageDetails]);

  function handleBack() {
    navigate("/travel-insurance-details", { state: coverageState });
  }

  function handleNext() {
    navigate("/travel-insurance-instant-quotes", { state: coverageState });
  }

  return (
    <>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Premium Summary</CardTitle>
              </CardHeader>

              <CardContent className="space-y-1">
                {premiumLoading && (
                  <p className="text-sm text-muted-foreground">Loading premium...</p>
                )}

                {premiumError && (
                  <p className="text-sm text-red-600">{premiumError}</p>
                )}

                {!premiumLoading && !premiumError && premiumSnapshot && (
                  <>
                    <SummaryRow
                      label="Currency"
                      value={premiumSnapshot.currency ?? "NPR"}
                    />
                    <SummaryRow
                      label="Rate"
                      value={premiumSnapshot.rate ?? 0}
                    />
                    <SummaryRow
                      label="Currency Amount"
                      value={premiumSnapshot.currency_amount ?? 0}
                    />
                    <SummaryRow
                      label="Premium in NPR"
                      value={premiumSnapshot.premium_in_npr ?? 0}
                    />
                    <SummaryRow
                      label="Currency Suminsured"
                      value={premiumSnapshot.currency_suminsured ?? 0}
                    />
                    <SummaryRow
                      label="Suminsured in NPR"
                      value={premiumSnapshot.suminsured_in_npr ?? 0}
                    />
                    <SummaryRow
                      label="Taxable Amount"
                      value={premiumSnapshot.taxable_amount ?? 0}
                    />
                    <SummaryRow
                      label="VAT %"
                      value={premiumSnapshot.vat_percent ?? 0}
                    />
                    <SummaryRow
                      label="VAT Amount"
                      value={premiumSnapshot.vat_amount ?? 0}
                    />
                    <SummaryRow
                      label="Stamp Duty"
                      value={premiumSnapshot.stamp_duty ?? 0}
                    />
                    <SummaryRow
                      label="Total Premium"
                      value={premiumSnapshot.total_premium_with_vat ?? 0}
                    />
                  </>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button variant="outline" onClick={handleBack} className="gap-2">
                <ChevronLeft className="w-4 h-4" />
                BACK
              </Button>

              <Button
                onClick={handleNext}
                disabled={premiumLoading || !!premiumError || !premiumSnapshot}
              >
                NEXT
              </Button>
            </div>
    </>
  );
};