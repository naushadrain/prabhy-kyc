import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const TravelInsuranceCoverage = () => {
  const { t } = useLanguage();

  const steps = [
    { number: 1, label: 'Insurance Plan', status: 'completed' },
    { number: 2, label: 'Coverage Plan', status: 'inProcess' },
    { number: 3, label: 'Coverage Details', status: 'pending' },
    { number: 4, label: 'Instant Quotes', status: 'pending' },
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
                      step.status === 'completed' || step.status === 'inProcess'
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {step.status === 'completed' || step.status === 'inProcess' ? '✓' : step.number}
                    </div>
                    <span className="text-xs text-center max-w-[120px] font-medium">
                      STEP {step.number}
                    </span>
                    <span className={`text-xs mt-1 ${
                      step.status === 'completed' ? 'text-green-600' :
                      step.status === 'inProcess' ? 'text-primary' : 'text-orange-500'
                    }`}>
                      {step.status === 'completed' ? 'Completed' :
                       step.status === 'inProcess' ? t('claim.inProcess') : t('claim.pending')}
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

            <h1 className="text-2xl font-bold mb-2">Travel Medical Insurance Individual Plan</h1>
            <p className="text-muted-foreground mb-8">Fill up your form to get a quotes.</p>

            <div className="bg-secondary/20 rounded-lg p-6 mb-8">
              <h2 className="text-lg font-semibold text-primary mb-3">Travel Medical Insurance Term:</h2>
              <div className="space-y-1 text-sm">
                <p>Age Validation: 70(maximum)</p>
                <p>Travel period: 180 days (6months)</p>
                <p>For more information, please contact us at our Toll-Free number: 16600150050</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-8">
              <div>
                <Label>Class</Label>
                <Select>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="economy">Economy</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="first">First Class</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Plan And Area</Label>
                <Select>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asia">Asia</SelectItem>
                    <SelectItem value="europe">Europe</SelectItem>
                    <SelectItem value="worldwide">Worldwide</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mb-8">
              <Label>Package Type</Label>
              <Select>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="a">Package A</SelectItem>
                  <SelectItem value="b">Package B</SelectItem>
                  <SelectItem value="c">Package C</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-4 mb-8">
              <Button variant="outline" className="gap-2">
                <ChevronLeft className="w-4 h-4" /> BACK
              </Button>
              <Link to="/travel-insurance-details">
                <Button className="bg-primary hover:bg-primary/90">NEXT</Button>
              </Link>
            </div>

            <div className="bg-secondary/20 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-primary mb-4">Package Benefits Include:</h2>
              <div className="space-y-2 text-sm">
                <p>A – Personal Accident</p>
                <p>B – Medical & Emergency Expenses</p>
                <p>C – Hospital Benefits</p>
                <p>Similarly, The following benefits will be covered under A to I Package:</p>
                <p>D – Loss of Checked Baggage</p>
                <p>E – Delay of Checked Baggage</p>
                <p>F – Loss of Passport</p>
                <p>G – Personal Liability</p>
                <p>H – Travel Delay</p>
                <p>I – Hijack</p>
                <p>J – Cancellation & Curtailment</p>
                <p>K – Emergency Return Home if a close family member dies</p>
                <p>L – Catastrophe</p>
                <p>M – Legal Expenses</p>
                <p>N – Repatriation of family member travelling with the participant</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
