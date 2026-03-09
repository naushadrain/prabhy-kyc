import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const HomePremiumDetails = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const steps = [
    { number: 1, label: t('homeInsurance.step1'), status: 'completed' },
    { number: 2, label: t('homeInsurance.step2'), status: 'inProcess' },
    { number: 3, label: t('homeInsurance.step3'), status: 'pending' },
    { number: 4, label: t('homeInsurance.step4'), status: 'pending' },
  ];

  // Placeholder data — replace with real API response
  const riskRows = [
    { description: 'Basic premium',   rate: '0.4', amount: '0.02'  },
    { description: 'Minimum Premium', rate: '0',   amount: '99.98' },
  ];

  const premium = {
    basicPremium:    '100.00',
    rsdAmount:       '0.00',
    directDiscount:  '0.00',
    netAmount:       '100.00',
    vatAmount:       '13.00',
    subTotal:        '113.00',
    stampAmount:     '20',
    totalPremium:    '133.00',
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-8 bg-background">
          {/* ── Stepper ─────────────────────────────────────── */}
          <div className="mb-12">
            <div className="flex items-center justify-between max-w-4xl mx-auto">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 text-sm font-bold ${
                      step.status === 'completed'
                        ? 'bg-green-500 text-white'
                        : step.status === 'inProcess'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {step.status === 'completed' ? '✓' : step.number}
                    </div>
                    <span className="text-xs text-center max-w-[120px] font-medium">
                      STEP {step.number}
                    </span>
                    <span className={`text-xs mt-1 ${
                      step.status === 'completed'
                        ? 'text-green-500'
                        : step.status === 'inProcess'
                        ? 'text-primary'
                        : 'text-orange-500'
                    }`}>
                      {step.status === 'completed'
                        ? 'Completed'
                        : step.status === 'inProcess'
                        ? t('claim.inProcess')
                        : t('claim.pending')}
                    </span>
                    <span className="text-xs text-center max-w-[120px] mt-1">{step.label}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="flex-1 h-0.5 bg-border mx-2" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── Content ─────────────────────────────────────── */}
          <div className="max-w-4xl mx-auto">
            <Button
              variant="ghost"
              className="mb-4 gap-2"
              onClick={() => navigate('/home-insurance')}
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </Button>

            <h1 className="text-2xl font-bold mb-8">Premium Calculation Details</h1>

            <div className="space-y-8">
              {/* ── Risk Details ──────────────────────────────── */}
              <div>
                <h2 className="text-base font-semibold mb-3">Risk Details</h2>
                <div className="rounded-lg overflow-hidden border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-primary text-primary-foreground">
                        <th className="text-left px-5 py-3 font-semibold">Risk Description</th>
                        <th className="text-left px-5 py-3 font-semibold">Risk Rate</th>
                        <th className="text-left px-5 py-3 font-semibold">Risk Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {riskRows.map((row, i) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                          <td className="px-5 py-3 text-center text-muted-foreground">{row.description}</td>
                          <td className="px-5 py-3 text-center">{row.rate}</td>
                          <td className="px-5 py-3 text-center">{row.amount}</td>
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
                    {/* Row 1 — main premium columns */}
                    <thead>
                      <tr className="bg-primary text-primary-foreground">
                        <th className="text-left px-5 py-3 font-semibold">Basic Premium</th>
                        <th className="text-left px-5 py-3 font-semibold">RSD Amount</th>
                        <th className="text-left px-5 py-3 font-semibold">Direct Discount</th>
                        <th className="text-left px-5 py-3 font-semibold">Net Amount</th>
                        <th className="text-left px-5 py-3 font-semibold">Vat Amount</th>
                        <th className="text-left px-5 py-3 font-semibold">Sub Total Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="bg-background border-b">
                        <td className="px-5 py-3">{premium.basicPremium}</td>
                        <td className="px-5 py-3">{premium.rsdAmount}</td>
                        <td className="px-5 py-3">{premium.directDiscount}</td>
                        <td className="px-5 py-3">{premium.netAmount}</td>
                        <td className="px-5 py-3">{premium.vatAmount}</td>
                        <td className="px-5 py-3">{premium.subTotal}</td>
                      </tr>

                      {/* Row 2 — stamp + total (red header row) */}
                      <tr className="bg-primary text-primary-foreground">
                        <td colSpan={3} className="px-5 py-3 font-semibold">Stamp Amount</td>
                        <td colSpan={3} className="px-5 py-3 font-semibold">Total Premium Amount</td>
                      </tr>
                      <tr className="bg-background">
                        <td colSpan={3} className="px-5 py-3">{premium.stampAmount}</td>
                        <td colSpan={3} className="px-5 py-3 font-semibold text-primary">
                          {premium.totalPremium}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── Action Buttons ───────────────────────────── */}
              <div className="flex justify-between pt-2">
                <Button
                  variant="outline"
                  className="gap-2 text-primary border-primary"
                  onClick={() => navigate('/home-insurance')}
                >
                  <ChevronLeft className="w-4 h-4" />
                  BACK
                </Button>
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90 gap-2 px-8"
                  onClick={() => navigate('/home-insurance-kyc')}
                >
                  NEXT <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
