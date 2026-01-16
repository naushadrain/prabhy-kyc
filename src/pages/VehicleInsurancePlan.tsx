import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronLeft } from 'lucide-react';
import { useState } from 'react';

export const VehicleInsurancePlan = () => {
  const { t } = useLanguage();

  const steps = [
    { number: 1, label: 'Insurance Plan', status: 'inProcess' },
    { number: 2, label: 'Coverage Plan', status: 'pending' },
    { number: 3, label: 'Coverage Details', status: 'pending' },
    { number: 4, label: 'Vehicles Details', status: 'pending' },
    { number: 5, label: 'KYC Details', status: 'pending' },
  ];
const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  return (
    <div className="flex min-h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-8 bg-background">
          {/* Stepper */}
          <div className="mb-12">
            <div className="flex items-center justify-between max-w-5xl mx-auto">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                      step.status === 'inProcess'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {step.number}
                    </div>
                    <span className="text-xs text-center max-w-[100px] font-medium">
                      STEP {step.number}
                    </span>
                    <span className={`text-xs mt-1 ${
                      step.status === 'inProcess' ? 'text-primary' : 'text-orange-500'
                    }`}>
                      {step.status === 'inProcess' ? t('claim.inProcess') : t('claim.pending')}
                    </span>
                    <span className="text-xs text-center max-w-[100px] mt-1">{step.label}</span>
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
            <Button variant="ghost" className="mb-4 gap-2">
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <h1 className="text-2xl font-bold mb-8">Two Wheeler Plan</h1>
            <p className="text-muted-foreground mb-8">Select the insurance plan that best suits you.</p>

            <div className="grid md:grid-cols-2 gap-6 max-w-3xl">
              {/* Comprehensive Insurance */}
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary">
                <h3 className="text-lg font-bold mb-2 text-center">Comprehensive Insurance</h3>
                <div className="flex justify-center my-8">
                  <div className="w-32 h-32 flex items-center justify-center">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <path d="M50 10 L65 25 L65 50 L50 60 L35 50 L35 25 Z" fill="none" stroke="hsl(var(--primary))" strokeWidth="2"/>
                      <circle cx="50" cy="35" r="8" fill="hsl(var(--primary))"/>
                      <path d="M42 42 L42 50 L58 50 L58 42" fill="hsl(var(--primary))"/>
                      <line x1="30" y1="20" x2="30" y2="20" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round"/>
                      <line x1="70" y1="20" x2="70" y2="20" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round"/>
                      <line x1="30" y1="70" x2="30" y2="70" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round"/>
                      <line x1="70" y1="70" x2="70" y2="70" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                </div>
              </Card>

              {/* Third Party Insurance */}
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary">
                <h3 className="text-lg font-bold mb-2 text-center">Third Party Insurance</h3>
                <div className="flex justify-center my-8">
                  <div className="w-32 h-32 flex items-center justify-center">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <path d="M50 10 L65 25 L65 50 L50 60 L35 50 L35 25 Z" fill="none" stroke="hsl(var(--primary))" strokeWidth="2"/>
                      <path d="M42 32 L48 38 L58 28" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M40 45 L40 52 L60 52 L60 45" fill="hsl(var(--primary))"/>
                      <line x1="30" y1="20" x2="30" y2="20" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round"/>
                      <line x1="70" y1="20" x2="70" y2="20" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round"/>
                      <line x1="30" y1="70" x2="30" y2="70" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round"/>
                      <line x1="70" y1="70" x2="70" y2="70" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                </div>
              </Card>
            </div>

            {/* Info boxes */}
            <div className="mt-8 space-y-4 max-w-3xl">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700">All third-party damages are covered.</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-700">Covers all damages including you and other third-party damages.</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
