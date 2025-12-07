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
import { ArrowLeft, Plus, Info } from 'lucide-react';
import { Card } from '@/components/ui/card';

export const VehicleInsurance = () => {
  const { t } = useLanguage();

  const steps = [
    { number: 1, label: t('vehicleInsurance.step1'), status: 'completed' },
    { number: 2, label: t('vehicleInsurance.step2'), status: 'completed' },
    { number: 3, label: t('vehicleInsurance.step3'), status: 'completed' },
    { number: 4, label: t('vehicleInsurance.step4'), status: 'inProcess' },
    { number: 5, label: t('vehicleInsurance.step5'), status: 'pending' },
  ];

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
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
            <Button variant="ghost" className="mb-4 gap-2">
              <ArrowLeft className="w-4 h-4" />
            </Button>

            <h1 className="text-2xl font-bold mb-8">{t('vehicleInsurance.title')}</h1>

            <div className="space-y-6">
              {/* Radio Group */}
              <div className="flex items-center gap-4">
                <Label className="flex items-center gap-2">
                  {t('vehicleInsurance.chooseSystem')}
                  <Info className="w-4 h-4 text-muted-foreground" />
                </Label>
              </div>

              <RadioGroup defaultValue="zone" className="flex gap-6">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="zone" id="zone" />
                  <Label htmlFor="zone">{t('vehicleInsurance.zoneSystem')}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="province" id="province" />
                  <Label htmlFor="province">{t('vehicleInsurance.provinceSystem')}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="embossed" id="embossed" />
                  <Label htmlFor="embossed">{t('vehicleInsurance.embossedSystem')}</Label>
                </div>
              </RadioGroup>

              {/* Vehicle Number Plate Display */}
              <Card className="p-4 max-w-sm">
                <div className="bg-primary text-primary-foreground text-center font-bold text-2xl py-4 rounded">
                  बा २५ प २३८६
                </div>
                <div className="grid grid-cols-3 gap-2 mt-2 text-xs text-center">
                  <div>
                    <div className="font-semibold">Zone</div>
                    <div>बा (Ba)</div>
                  </div>
                  <div>
                    <div className="font-semibold">Lot Type</div>
                    <div>प (Pa)</div>
                  </div>
                  <div>
                    <div className="font-semibold">Vehicle Type</div>
                    <div>Bike / Car</div>
                  </div>
                  <div className="col-span-3">
                    <div className="font-semibold">Lot No</div>
                    <div>25</div>
                  </div>
                </div>
              </Card>

              {/* Form Fields */}
              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <Label>{t('vehicleInsurance.zone')} *</Label>
                  <Select>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ba">बा (Ba)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t('vehicleInsurance.lotNo')} *</Label>
                  <Input className="mt-2" />
                </div>
                <div>
                  <Label>{t('vehicleInsurance.vehicleSymbol')} *</Label>
                  <Select>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pa">प (Pa)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t('vehicleInsurance.vehicleNumber')}</Label>
                  <Input className="mt-2" />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>{t('vehicleInsurance.registerDate')}</Label>
                  <Input type="date" className="mt-2" placeholder="Register Date" />
                </div>
                <div>
                  <Label>{t('vehicleInsurance.manufactureCompany')} *</Label>
                  <Select>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="honda">Honda</SelectItem>
                      <SelectItem value="yamaha">Yamaha</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t('vehicleInsurance.model')} *</Label>
                  <Select>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2020">2020</SelectItem>
                      <SelectItem value="2021">2021</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t('vehicleInsurance.vehicleType')} *</Label>
                  <Select>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bike">Bike</SelectItem>
                      <SelectItem value="car">Car</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t('vehicleInsurance.chasisNo')} *</Label>
                  <Input className="mt-2" />
                </div>
                <div>
                  <Label>{t('vehicleInsurance.engineNo')} *</Label>
                  <Input className="mt-2" />
                </div>
              </div>

              {/* File Uploads */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label>{t('vehicleInsurance.blueBookVehicleReg')} *</Label>
                  <div className="mt-2 border-2 border-dashed rounded-lg p-12 flex items-center justify-center bg-muted/50">
                    <div className="text-center">
                      <div className="w-24 h-24 mx-auto mb-4 bg-muted rounded flex items-center justify-center">
                        <div className="w-16 h-16 bg-background rounded"></div>
                      </div>
                    </div>
                  </div>
                  <Button className="w-full mt-2 bg-primary hover:bg-primary/90">
                    <Plus className="w-4 h-4 mr-2" />
                  </Button>
                </div>

                <div>
                  <Label>{t('vehicleInsurance.blueBookNamsari')} *</Label>
                  <div className="mt-2 border-2 border-dashed rounded-lg p-12 flex items-center justify-center bg-muted/50">
                    <div className="text-center">
                      <div className="w-24 h-24 mx-auto mb-4 bg-muted rounded flex items-center justify-center">
                        <div className="w-16 h-16 bg-background rounded"></div>
                      </div>
                    </div>
                  </div>
                  <Button className="w-full mt-2 bg-primary hover:bg-primary/90">
                    <Plus className="w-4 h-4 mr-2" />
                  </Button>
                </div>

                <div className="md:col-span-2">
                  <Label>{t('vehicleInsurance.blueBookVehicleDetails')} *</Label>
                  <div className="mt-2 border-2 border-dashed rounded-lg p-12 flex items-center justify-center bg-muted/50">
                    <div className="text-center">
                      <div className="w-24 h-24 mx-auto mb-4 bg-muted rounded flex items-center justify-center">
                        <div className="w-16 h-16 bg-background rounded"></div>
                      </div>
                    </div>
                  </div>
                  <Button className="w-full mt-2 bg-primary hover:bg-primary/90">
                    <Plus className="w-4 h-4 mr-2" />
                  </Button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between pt-6">
                <Button variant="outline" className="gap-2 text-primary border-primary">
                  <ArrowLeft className="w-4 h-4" />
                  {t('vehicleInsurance.back')}
                </Button>
                <Button size="lg" className="bg-primary hover:bg-primary/90">
                  {t('common.next')}
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
