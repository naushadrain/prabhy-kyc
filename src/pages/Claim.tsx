import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ArrowRight } from 'lucide-react';

export const Claim = () => {
  const { t } = useLanguage();

  const steps = [
    { number: 1, label: t('claim.step1'), status: 'inProcess' },
    { number: 2, label: t('claim.step2'), status: 'pending' },
    { number: 3, label: t('claim.step3'), status: 'pending' },
    { number: 4, label: t('claim.step4'), status: 'pending' },
    { number: 5, label: t('claim.step5'), status: 'pending' },
  ];

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-8">
          {/* Stepper */}
          <div className="mb-12">
            <div className="flex items-center justify-between max-w-5xl mx-auto">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 mb-2 ${
                      step.status === 'inProcess' 
                        ? 'bg-primary border-primary text-primary-foreground' 
                        : 'border-muted bg-background text-muted-foreground'
                    }`}>
                      {step.number}
                    </div>
                    <span className="text-xs text-center max-w-[100px]">{step.label}</span>
                    <span className={`text-xs mt-1 ${
                      step.status === 'inProcess' ? 'text-primary' : 'text-secondary'
                    }`}>
                      {step.status === 'inProcess' ? t('claim.inProcess') : t('claim.pending')}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="flex-1 h-0.5 bg-border mx-2"></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="max-w-3xl">
            <h1 className="text-3xl font-bold mb-2">{t('claim.fileAClaim')}</h1>
            <p className="text-muted-foreground mb-8">{t('claim.completeForm')}</p>

            <div className="space-y-6">
              <div>
                <Label className="text-base font-semibold mb-4 block">
                  {t('claim.kycDetails')}
                </Label>
                <RadioGroup defaultValue="self" className="flex gap-6">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="self" id="self" />
                    <Label htmlFor="self">{t('claim.self')}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="others" id="others" />
                    <Label htmlFor="others">{t('claim.others')}</Label>
                  </div>
                </RadioGroup>
              </div>

              <Button size="lg" className="gap-2">
                {t('common.next')}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
