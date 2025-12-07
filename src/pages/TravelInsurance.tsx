import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card } from '@/components/ui/card';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export const TravelInsurance = () => {
  const { t } = useLanguage();

  const steps = [
    { number: 1, label: 'Insurance Plan', status: 'inProcess' },
    { number: 2, label: 'Coverage Plan', status: 'pending' },
    { number: 3, label: 'Coverage Details', status: 'pending' },
    { number: 4, label: 'Instant Quotes', status: 'pending' },
  ];

  const insurancePlans = [
    { id: 'individual', title: 'Individual', icon: '👔' },
    { id: 'student', title: 'Student Plan', icon: '🎓' },
  ];

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-8 bg-background">
          {/* Stepper */}
          <div className="mb-12">
            <div className="flex items-center justify-between max-w-4xl mx-auto">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                      step.status === 'inProcess' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {step.status === 'inProcess' ? '✓' : step.number}
                    </div>
                    <span className="text-xs text-center max-w-[120px] font-medium">
                      STEP {step.number}
                    </span>
                    <span className={`text-xs mt-1 ${
                      step.status === 'inProcess' ? 'text-primary' : 'text-orange-500'
                    }`}>
                      {step.status === 'inProcess' ? t('claim.inProcess') : t('claim.pending')}
                    </span>
                    <span className="text-xs text-center max-w-[120px] mt-1">{step.label}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="flex-1 h-0.5 bg-border mx-2"></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="max-w-4xl mx-auto">
            <Button variant="ghost" className="mb-6 gap-2">
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <h1 className="text-3xl font-bold mb-2">Travel Medical Insurance</h1>
            <p className="text-muted-foreground mb-8">Select the insurance plan that best suits you.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
              {insurancePlans.map((plan) => (
                <Link key={plan.id} to="/travel-insurance-coverage">
                  <Card className="p-8 hover:shadow-lg transition-all cursor-pointer h-full text-center">
                    <h3 className="text-lg font-bold mb-8">{plan.title}</h3>
                    <div className="flex items-center justify-center py-8">
                      <div className="text-7xl opacity-80">{plan.icon}</div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
