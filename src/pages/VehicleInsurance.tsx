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
import { ArrowLeft, Plus, Info, X, ImagePlus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export const VehicleInsurance = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const backRoute = '/vehicle-coverage-details';

  // Blue book image previews
  const [images, setImages] = useState<{ reg: string | null; namsari: string | null; details: string | null }>({
    reg: null,
    namsari: null,
    details: null,
  });

  const inputRef = {
    reg: useRef<HTMLInputElement>(null),
    namsari: useRef<HTMLInputElement>(null),
    details: useRef<HTMLInputElement>(null),
  };

  const handleImageChange = (key: 'reg' | 'namsari' | 'details', file: File | undefined) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImages(prev => ({ ...prev, [key]: url }));
  };

  const clearImage = (key: 'reg' | 'namsari' | 'details') => {
    setImages(prev => ({ ...prev, [key]: null }));
    if (inputRef[key].current) inputRef[key].current.value = '';
  };

  const steps = [
    { number: 1, label: 'Insurance Plan', status: 'completed' },
    { number: 2, label: 'Coverage Plan', status: 'completed' },
    { number: 3, label: 'Coverage Details', status: 'completed' },
    { number: 4, label: 'Vehicle Details', status: 'inProcess' },
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
            <Button variant="ghost" className="mb-4 gap-2" onClick={() => navigate(backRoute)}>
              <ArrowLeft className="w-4 h-4" /> Back
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
              {/* <Card className="p-4 max-w-sm">
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
              </Card> */}

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
                {/* Blue Book – Vehicle Registration */}
                {(['reg', 'namsari'] as const).map((key) => (
                  <div key={key}>
                    <Label>
                      {key === 'reg'
                        ? t('vehicleInsurance.blueBookVehicleReg')
                        : t('vehicleInsurance.blueBookNamsari')}{' '}
                      *
                    </Label>
                    <input
                      ref={inputRef[key]}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageChange(key, e.target.files?.[0])}
                    />
                    {/* Preview / placeholder area — click to pick */}
                    <div
                      onClick={() => inputRef[key].current?.click()}
                      className="mt-2 relative border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/50 cursor-pointer hover:bg-muted/80 transition-colors overflow-hidden"
                      style={{ minHeight: '160px' }}
                    >
                      {images[key] ? (
                        <>
                          <img
                            src={images[key]!}
                            alt="preview"
                            className="w-full h-full object-contain max-h-48 p-2"
                          />
                          {/* Remove button */}
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); clearImage(key); }}
                            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-muted-foreground py-8">
                          <ImagePlus className="w-10 h-10 opacity-40" />
                          <span className="text-xs">Click to upload image</span>
                        </div>
                      )}
                    </div>
                    <Button
                      type="button"
                      className="w-full mt-2 bg-primary hover:bg-primary/90 gap-2"
                      onClick={() => inputRef[key].current?.click()}
                    >
                      <Plus className="w-4 h-4" />
                      {images[key] ? 'Replace Image' : 'Upload Image'}
                    </Button>
                  </div>
                ))}

                {/* Blue Book – Vehicle Details (full width) */}
                <div className="md:col-span-2">
                  <Label>{t('vehicleInsurance.blueBookVehicleDetails')} *</Label>
                  <input
                    ref={inputRef.details}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageChange('details', e.target.files?.[0])}
                  />
                  <div
                    onClick={() => inputRef.details.current?.click()}
                    className="mt-2 relative border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/50 cursor-pointer hover:bg-muted/80 transition-colors overflow-hidden"
                    style={{ minHeight: '160px' }}
                  >
                    {images.details ? (
                      <>
                        <img
                          src={images.details}
                          alt="preview"
                          className="w-full h-full object-contain max-h-48 p-2"
                        />
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); clearImage('details'); }}
                          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-muted-foreground py-8">
                        <ImagePlus className="w-10 h-10 opacity-40" />
                        <span className="text-xs">Click to upload image</span>
                      </div>
                    )}
                  </div>
                  <Button
                    type="button"
                    className="w-full mt-2 bg-primary hover:bg-primary/90 gap-2"
                    onClick={() => inputRef.details.current?.click()}
                  >
                    <Plus className="w-4 h-4" />
                    {images.details ? 'Replace Image' : 'Upload Image'}
                  </Button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between pt-6">
                <Button variant="outline" className="gap-2 text-primary border-primary" onClick={() => navigate(backRoute)}>
                  <ArrowLeft className="w-4 h-4" />
                  {t('vehicleInsurance.back')}
                </Button>
                <Button size="lg" className="bg-primary hover:bg-primary/90" onClick={() => navigate('/motor-kyc-details')}>
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
