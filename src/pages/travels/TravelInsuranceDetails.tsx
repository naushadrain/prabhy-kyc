import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ChevronLeft, AlertTriangle } from 'lucide-react';

export const TravelInsuranceDetails = () => {
  const { t } = useLanguage();

  const steps = [
    { number: 1, label: 'Insurance Plan', status: 'completed' },
    { number: 2, label: 'Coverage Plan', status: 'completed' },
    { number: 3, label: 'Coverage Details', status: 'inProcess' },
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

            <h1 className="text-2xl font-bold mb-8">Travel Medical Insurance Individual Plan</h1>

            {/* Travel Period Section */}
            <div className="border-2 border-primary rounded-lg p-6 mb-6">
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label>Travel Period From</Label>
                  <Input type="date" className="mt-2" />
                </div>
                <div>
                  <Label>Travel Period To</Label>
                  <Input type="date" className="mt-2" />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label>No of Days</Label>
                  <Input type="number" className="mt-2" />
                </div>
                <div>
                  <Label>No of Travelers</Label>
                  <Select>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="4">4</SelectItem>
                      <SelectItem value="5+">5+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <Switch id="one-way" />
                <Label htmlFor="one-way">One Way Trip Charge</Label>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <Switch id="loading" />
                <Label htmlFor="loading">Loading Charge</Label>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-orange-700">Note: No of Days must be below 180 days</p>
              </div>
            </div>

            {/* KYC Section */}
            <div className="border-2 border-primary rounded-lg p-6 mb-6">
              <Label className="mb-4 block font-semibold">KYC TYPE</Label>
              <RadioGroup defaultValue="self" className="mb-6">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="self" id="self" />
                    <Label htmlFor="self">Self</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="others" id="others" />
                    <Label htmlFor="others">Others</Label>
                  </div>
                </div>
              </RadioGroup>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>DOB</Label>
                  <Input type="date" className="mt-2" />
                </div>
                <div>
                  <Label>Age</Label>
                  <Input type="number" className="mt-2" />
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button variant="outline" className="gap-2">
                <ChevronLeft className="w-4 h-4" /> BACK
              </Button>
              <Button className="bg-primary hover:bg-primary/90">CALCULATE</Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
