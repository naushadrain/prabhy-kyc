import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const fmt = (v: number | undefined | null) =>
  v != null
    ? v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "—";

export const VehicleCoverageDetailsSimple = () => {
  const navigate = useNavigate();

  const premiumData = (() => {
    try {
      return JSON.parse(localStorage.getItem("motor.premiumResponse") || "null");
    } catch {
      return null;
    }
  })();

  const coverageForm = (() => {
    try {
      return JSON.parse(localStorage.getItem("motor.coverageForm") || "null");
    } catch {
      return null;
    }
  })();

  const amount = premiumData?.amount_info;
  const hasData = !!amount;

  return (
    <div className="min-h-screen bg-background">
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <Button
            variant="ghost"
            className="mb-4 gap-2"
            onClick={() => navigate("/vehicle-coverage-plan-simple")}
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>

          <h1 className="text-2xl font-bold mb-8">
            Coverage Details — Third Party
          </h1>

          {!hasData && (
            <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-700 mb-6">
              <AlertCircle className="w-4 h-4 shrink-0" />
              No premium data found. Please go back and calculate first.
            </div>
          )}

          {hasData && (
            <div className="space-y-8">
              
              {/* Risk Details */}
                <div className="rounded-lg overflow-hidden border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-primary text-primary-foreground">
                        <th className="text-left px-5 py-3 font-semibold">Risk Description</th>
                        <th className="text-right px-5 py-3 font-semibold">Amount (NPR)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* <tr className="bg-background">
                        <td className="px-5 py-3 text-muted-foreground">Basic Premium</td>
                        <td className="px-5 py-3 text-right font-medium">{fmt(amount.premium_amount)}</td>
                      </tr> */}
                      <tr className="bg-muted/40">
                        <td className="px-5 py-3 text-muted-foreground">Third Party Liability</td>
                        <td className="px-5 py-3 text-right font-medium">{fmt(amount.tpl_amount)}</td>
                      </tr>
                      {/* <tr className="bg-background">
                        <td className="px-5 py-3 text-muted-foreground">Pool Contribution</td>
                        <td className="px-5 py-3 text-right font-medium">{fmt(amount.pool_amount)}</td>
                      </tr> */}
                      {premiumData.direct_discount_amount > 0 && (
                        <tr className="bg-muted/40">
                          <td className="px-5 py-3 text-muted-foreground">
                            Direct Discount ({premiumData.direct_discount_percent}%)
                          </td>
                          <td className="px-5 py-3 text-right font-medium text-red-600">
                            -{fmt(premiumData.direct_discount_amount)}
                          </td>
                        </tr>
                      )}
                      {/* <tr className="bg-muted/20 border-t">
                        <td className="px-5 py-3 font-semibold">Sum Insured</td>
                        <td className="px-5 py-3 text-right font-semibold">{fmt(amount.suminsured)}</td>
                      </tr> */}
                    </tbody>
                  </table>
                </div>

              {/* Premium Details */}
              <div>
                <h2 className="text-base font-semibold mb-3">Premium Details</h2>
                <div className="rounded-lg overflow-hidden border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-primary text-primary-foreground">
                        <th className="text-left px-5 py-3 font-semibold">Description</th>
                        <th className="text-right px-5 py-3 font-semibold">Amount (NPR)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* <tr className="bg-background">
                        <td className="px-5 py-3 text-muted-foreground">Net Premium</td>
                        <td className="px-5 py-3 text-right">{fmt(amount.premium_amount)}</td>
                      </tr> */}
                      <tr className="bg-muted/40">
                        <td className="px-5 py-3 text-muted-foreground">Taxable Amount</td>
                        <td className="px-5 py-3 text-right">{fmt(amount.taxable_amount)}</td>
                      </tr>
                      <tr className="bg-background">
                        <td className="px-5 py-3 text-muted-foreground">VAT ({amount.vat_percent}%)</td>
                        <td className="px-5 py-3 text-right">{fmt(amount.vat_amount)}</td>
                      </tr>
                      <tr className="bg-muted/40">
                        <td className="px-5 py-3 text-muted-foreground">Stamp Duty</td>
                        <td className="px-5 py-3 text-right">{fmt(amount.stamp_duty)}</td>
                      </tr>
                      {amount.pa_amount > 0 && (
                        <tr className="bg-background">
                          <td className="px-5 py-3 text-muted-foreground">PA Amount</td>
                          <td className="px-5 py-3 text-right">{fmt(amount.pa_amount)}</td>
                        </tr>
                      )}
                      <tr className="border-t-2 bg-primary/5">
                        <td className="px-5 py-4 font-bold text-primary">Total Payable Premium</td>
                        <td className="px-5 py-4 text-right font-bold text-primary text-base">
                          {fmt(amount.total_amount)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          <div className="flex mt-6 gap-2">
            <Button
              variant="outline"
              className="gap-2 text-primary border-primary"
              onClick={() => navigate("/vehicle-coverage-plan-simple")}
            >
              <ArrowLeft className="w-4 h-4" /> Go Back & Calculate
            </Button>
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 px-6"
              onClick={() => navigate("/")}
            >
              Home
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};
