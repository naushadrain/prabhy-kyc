import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
/* ── Helpers ──────────────────────────────────────────────────── */
const fmt = (v: number | undefined | null) =>
  v != null ? v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—';

export const VehicleCoverageDetails = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const insurancePlan = localStorage.getItem('motor.insurancePlan') || 'comprehensive';
  const backRoute =
    insurancePlan === 'comprehensive'
      ? '/vehicle-coverage-plan'
      : '/vehicle-coverage-plan-simple';

  /* ── Read API response from localStorage ─────────────────────── */
  const premiumData = (() => {
    try {
      return JSON.parse(localStorage.getItem('motor.premiumResponse') || 'null');
    } catch {
      return null;
    }
  })();

  const amount = premiumData?.amount_info;
  const hasData = !!amount;
  /* ── Risk rows from API ──────────────────────────────────────── */
  const riskRows = hasData ? [
    { description: 'Basic Premium', amount: fmt(amount.premium_amount) },
    { description: 'Third Party Liability', amount: fmt(amount.tpl_amount) },
    { description: 'Pool Contribution', amount: fmt(amount.pool_amount) },
    ...(premiumData.direct_discount_amount > 0
      ? [{ description: `Direct Discount (${premiumData.direct_discount_percent}%)`, amount: `-${fmt(premiumData.direct_discount_amount)}` }]
      : []),
  ] : [];

  return (
    <div className="flex min-h-screen">
      <main className="flex-1 p-8 bg-background">
        {/* ── Content ─────────────────────────────────────── */}
        <div className="max-w-5xl mx-auto">
          <Button variant="ghost" className="mb-4 gap-2" onClick={() => navigate(backRoute)}>
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>

          <h1 className="text-2xl font-bold mb-8">Coverage Details</h1>

          {/* No data fallback */}
          {!hasData && (
            <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-700 mb-6">
              <AlertCircle className="w-4 h-4 shrink-0" />
              No premium data found. Please go back and calculate first.
            </div>
          )}

          {hasData && (
            <div className="space-y-8">

              {/* ── Risk Details ──────────────────────────── */}
              <div>
                <div className="rounded-lg overflow-hidden border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-primary text-primary-foreground">
                        <th className="text-left px-5 py-3 font-semibold">Risk Description</th>
                        <th className="text-right px-5 py-3 font-semibold">Amount (NPR)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {riskRows.map((row, i) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/40'}>
                          <td className="px-5 py-3 text-muted-foreground">{row.description}</td>
                          <td className={`px-5 py-3 text-right font-medium ${row.amount.startsWith('-') ? 'text-red-600' : ''}`}>
                            {row.amount}
                          </td>
                        </tr>
                      ))}
                      {/* Sum insured */}
                      <tr className="bg-muted/20 border-t">
                        <td className="px-5 py-3 font-semibold">Sum Insured</td>
                        <td className="px-5 py-3 text-right font-semibold">{fmt(amount.suminsured)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── Premium Details ──────────────────────── */}
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
                      <tr className="bg-background">
                        <td className="px-5 py-3 text-muted-foreground">Net Premium</td>
                        <td className="px-5 py-3 text-right">{fmt(amount.premium_amount)}</td>
                      </tr>
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

          {/* Fallback back button */}
          
          <div className='flex mt-6 gap-2'>
            
            <Button variant="outline" className="gap-2 text-primary border-primary" onClick={() => navigate(backRoute)}>
              <ArrowLeft className="w-4 h-4" /> Go Back & Calculate
            </Button>
          
            <Button
            size="lg"
            className="bg-primary hover:bg-primary/90 px-6"
            onClick={() => navigate('/')}
          >
            Home
          </Button>
          </div>
        </div>
      </main>
    </div>
  );
};
