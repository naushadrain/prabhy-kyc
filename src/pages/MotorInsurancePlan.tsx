import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card } from '@/components/ui/card';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { refreshToken } from '@/api/session/refreshTokenClient';
export const MotorInsurancePlan = () => {
  const { t } = useLanguage();

  const steps = [
    { number: 1, label: 'Insurance Plan', status: 'inProcess' },
    { number: 2, label: 'Coverage Plan', status: 'pending' },
    { number: 3, label: 'Coverage Details', status: 'pending' },
    { number: 4, label: 'Instant Quotes', status: 'pending' },
    { number: 5, label: 'Proceed to Pay', status: 'pending' },
  ];

  const insurancePlans = [
    { id: 'two-wheeler', title: 'Two Wheeler', icon: '🏍️' },
    { id: 'private', title: 'Private Vehicle', icon: '🚗' },
    { id: 'commercial', title: 'Commercial Vehicle', icon: '🚚' },
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
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${step.status === 'inProcess'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                      }`}>
                      {step.status === 'inProcess' ? '✓' : step.number}
                    </div>
                    <span className="text-xs text-center max-w-[120px] font-medium">
                      STEP {step.number}
                    </span>
                    <span className={`text-xs mt-1 ${step.status === 'inProcess' ? 'text-primary' : 'text-orange-500'
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
          <div className="max-w-5xl mx-auto">
            <Button variant="ghost" className="mb-6 gap-2">
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <h1 className="text-3xl font-bold mb-2">Motor Insurance</h1>
            <p className="text-muted-foreground mb-8">Choose your Insurance Plan</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {insurancePlans.map((plan) => (
                <Link key={plan.id} to="/vehicle-insurance">
                  <Card className="p-8 hover:shadow-lg transition-all cursor-pointer h-full text-center">
                    <h3 className="text-lg font-bold mb-8">{plan.title}</h3>
                    <div className="flex items-center justify-center py-8">
                      <div className="text-7xl opacity-80">{plan.icon}</div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>

            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold mb-3">What is Motor Insurance?</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Vehicle insurance (also known as car insurance, motor insurance, or auto insurance) is insurance for cars, trucks, motorcycles, and other road vehicles. Its primary use is to provide financial protection against physical damage or bodily injury resulting from traffic collisions and against liability that could also arise from incidents in a vehicle. Vehicle insurance may additionally offer financial protection against theft of the vehicle, and against damage to the vehicle sustained from events other than traffic collisions, such as keying, weather or natural disasters, and damage sustained by colliding with stationary objects. The specific terms of vehicle insurance vary with legal regulations in each region.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold mb-3">Why do you need Motor Insurance?</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  In many jurisdictions, it is compulsory to have vehicle insurance before using or keeping a motor vehicle on public roads. Most jurisdictions relate insurance to both the car and the driver; however, the degree of each varies greatly.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Several jurisdictions have experimented with a 'pay-as-you-drive' insurance plan which utilizes either a tracking device in the vehicle or vehicle diagnostics. This would address issues of uninsured motorists by providing additional options and also charge based on the miles (kilometers) driven, which could theoretically increase the efficiency of the insurance, through streamlined collection.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
