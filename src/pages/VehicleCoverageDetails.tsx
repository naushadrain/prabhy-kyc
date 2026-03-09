import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const VehicleCoverageDetails = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const insurancePlan = localStorage.getItem('motor.insurancePlan') || 'comprehensive';
  const backRoute =
    insurancePlan === 'comprehensive'
      ? '/vehicle-coverage-plan'
      : '/vehicle-coverage-plan-simple';

  const steps = [
    { number: 1, label: 'Insurance Plan',   status: 'completed' },
    { number: 2, label: 'Coverage Plan',    status: 'completed' },
    { number: 3, label: 'Coverage Details', status: 'inProcess' },
    { number: 4, label: 'Vehicle Details',  status: 'pending'   },
    { number: 5, label: 'KYC Details',      status: 'pending'   },
  ];

  // Placeholder premium data (replace with real API data when ready)
  const riskRows = [
    { description: 'Third Party Insurance', amount: '1,900.00' },
  ];

  const premiumRow = {
    netPremium:      '1,900.00',
    vatablePremium:  '1,900.00',
    vatAmount:       '247.00',
    stamp:           '10',
    totalPayable:    '2,157.00',
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-8 bg-background">
          {/* ── Stepper ─────────────────────────────────────── */}
          <div className="mb-12">
            <div className="flex items-center justify-between max-w-5xl mx-auto">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 text-sm font-bold ${
                        step.status === 'completed'
                          ? 'bg-green-500 text-white'
                          : step.status === 'inProcess'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {step.status === 'completed' ? '✓' : step.number}
                    </div>
                    <span className="text-xs text-center max-w-[100px] font-medium">
                      STEP {step.number}
                    </span>
                    <span
                      className={`text-xs mt-1 ${
                        step.status === 'completed'
                          ? 'text-green-500'
                          : step.status === 'inProcess'
                          ? 'text-primary'
                          : 'text-orange-500'
                      }`}
                    >
                      {step.status === 'completed'
                        ? 'Completed'
                        : step.status === 'inProcess'
                        ? t('claim.inProcess')
                        : t('claim.pending')}
                    </span>
                    <span className="text-xs text-center max-w-[100px] mt-1">
                      {step.label}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="flex-1 h-0.5 bg-border mx-2" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── Content ─────────────────────────────────────── */}
          <div className="max-w-5xl mx-auto">
            <Button
              variant="ghost"
              className="mb-4 gap-2"
              onClick={() => navigate(backRoute)}
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>

            <h1 className="text-2xl font-bold mb-8">Coverage Details</h1>

            <div className="space-y-8">
              {/* ── Risk Details ──────────────────────────────── */}
              <div>
                <h2 className="text-base font-semibold mb-3">Risk Details</h2>
                <div className="rounded-lg overflow-hidden border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-primary text-primary-foreground">
                        <th className="text-left px-5 py-3 font-semibold">
                          Risk Description
                        </th>
                        <th className="text-right px-5 py-3 font-semibold">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {riskRows.map((row, i) => (
                        <tr
                          key={i}
                          className={i % 2 === 0 ? 'bg-background' : 'bg-muted/40'}
                        >
                          <td className="px-5 py-3 text-center text-muted-foreground">
                            {row.description}
                          </td>
                          <td className="px-5 py-3 text-right font-medium">
                            {row.amount}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── Premium Details ───────────────────────────── */}
              <div>
                <h2 className="text-base font-semibold mb-3">Premium Details</h2>
                <div className="rounded-lg overflow-hidden border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-primary text-primary-foreground">
                        <th className="text-left px-5 py-3 font-semibold">
                          Net Premium
                        </th>
                        <th className="text-left px-5 py-3 font-semibold">
                          Vatable Premium
                        </th>
                        <th className="text-left px-5 py-3 font-semibold">
                          Vat Amount
                        </th>
                        <th className="text-left px-5 py-3 font-semibold">
                          Stamp
                        </th>
                        <th className="text-left px-5 py-3 font-semibold">
                          Total Payable Premium
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="bg-background">
                        <td className="px-5 py-3">{premiumRow.netPremium}</td>
                        <td className="px-5 py-3">{premiumRow.vatablePremium}</td>
                        <td className="px-5 py-3">{premiumRow.vatAmount}</td>
                        <td className="px-5 py-3">{premiumRow.stamp}</td>
                        <td className="px-5 py-3 font-semibold text-primary">
                          {premiumRow.totalPayable}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── Action Buttons ───────────────────────────── */}
              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  className="gap-2 text-primary border-primary"
                  onClick={() => navigate(backRoute)}
                >
                  <ArrowLeft className="w-4 h-4" />
                  BACK
                </Button>
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90 px-10"
                  onClick={() => navigate('/vehicle-insurance')}
                >
                  PROCEED
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
