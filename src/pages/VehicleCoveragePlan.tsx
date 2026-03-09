import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const VehicleCoveragePlan = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const steps = [
    { number: 1, label: 'Insurance Plan', status: 'completed' },
    { number: 2, label: 'Coverage Plan', status: 'completed' },
    { number: 3, label: 'Coverage Details', status: 'inProcess' },
    { number: 4, label: 'Vehicle Details', status: 'pending' },
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
                      step.status === 'completed' 
                        ? 'bg-green-500 text-white' 
                        : step.status === 'inProcess'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {step.status === 'completed' ? '✓' : step.number}
                    </div>
                    <span className="text-xs text-center max-w-[100px] font-medium">
                      STEP {step.number}
                    </span>
                    <span className={`text-xs mt-1 ${
                      step.status === 'completed' ? 'text-green-500' :
                      step.status === 'inProcess' ? 'text-primary' : 'text-orange-500'
                    }`}>
                      {step.status === 'completed' ? 'Completed' :
                       step.status === 'inProcess' ? t('claim.inProcess') : t('claim.pending')}
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

          {/* Form */}
          <div className="max-w-5xl mx-auto">
            <Button variant="ghost" className="mb-4 gap-2" onClick={() => navigate('/vehicle-insurance-plan')}>
              <ChevronLeft className="w-4 h-4" /> Back
            </Button>

            <h1 className="text-2xl font-bold mb-8">Coverage Plan — Comprehensive</h1>

            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Category *</Label>
                  <Select>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="two-wheeler">Two Wheeler</SelectItem>
                      <SelectItem value="four-wheeler">Four Wheeler</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Year Of Manufacture *</Label>
                  <Select>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2024">2024</SelectItem>
                      <SelectItem value="2023">2023</SelectItem>
                      <SelectItem value="2022">2022</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Cubic Capacity (cc) / KW *</Label>
                  <Input className="mt-2" />
                </div>
                <div>
                  <Label>Vehicle Cost *</Label>
                  <Input className="mt-2" />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Voluntary Excess *</Label>
                  <Select>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0</SelectItem>
                      <SelectItem value="5000">5000</SelectItem>
                      <SelectItem value="10000">10000</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-orange-600 mt-1">
                    The sum of money you decide to bear towards an insurance claim for which you gain certain % of premium discount.
                  </p>
                </div>
                <div>
                  <Label>Compulsary Excess</Label>
                  <Input className="mt-2" disabled />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>P.A. to Driver</Label>
                  <Input defaultValue="500000" className="mt-2" />
                </div>
                <div>
                  <Label>No of Seat (Including Driver)</Label>
                  <Input defaultValue="2" className="mt-2" />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>P.A. to Passenger</Label>
                  <Input defaultValue="500000" className="mt-2" />
                </div>
                <div>
                  <Label>Effective Date *</Label>
                  <Input type="date" defaultValue="2025-10-29" className="mt-2" />
                </div>
              </div>

              <div>
                <Label>Expiry Date</Label>
                <Input type="date" defaultValue="2026-10-28" className="mt-2" disabled />
              </div>

              {/* Checkboxes and Switches */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="strike" className="w-4 h-4" defaultChecked />
                  <Label htmlFor="strike" className="cursor-pointer">
                    Would you like to cover for strike damage?
                  </Label>
                  <div className="w-4 h-4 bg-muted rounded-full flex items-center justify-center text-xs cursor-help">
                    ?
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Label>Are you eligible for the No Claim Discount?</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">No</span>
                    <input type="checkbox" className="w-4 h-4" />
                    <span className="text-sm">Yes</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Label>Would you prefer a direct discount?</Label>
                  <Switch defaultChecked />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between pt-6">
                <Button variant="outline" className="gap-2 text-primary border-primary" onClick={() => navigate('/vehicle-insurance-plan')}>
                  <ChevronLeft className="w-4 h-4" />
                  BACK
                </Button>
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-8" onClick={() => navigate('/vehicle-coverage-details')}>
                  NEXT
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
