import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, MapPin } from 'lucide-react';
import { useState } from 'react';

export const KYCAddCorporate = () => {
  const { t } = useLanguage();

  const steps = [
    { number: 1, label: t('kycCorporate.step1'), status: 'completed' },
    { number: 2, label: t('kycCorporate.step2'), status: 'inProcess' },
    { number: 3, label: t('kycCorporate.step3'), status: 'pending' },
    { number: 4, label: t('kycCorporate.step4'), status: 'pending' },
    { number: 5, label: t('kycCorporate.step5'), status: 'pending' },
  ];
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  return (
    <div className="flex min-h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-8 bg-background">
          {/* Stepper */}
          <div className="mb-8">
            <div className="flex items-center justify-between max-w-5xl mx-auto">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${step.status === 'completed'
                        ? 'bg-green-500 text-white'
                        : step.status === 'inProcess'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                      {step.number}
                    </div>
                    <span className="text-xs text-center max-w-[100px] font-medium">{step.label}</span>
                    <span className={`text-xs mt-1 ${step.status === 'completed' ? 'text-green-500' : step.status === 'inProcess' ? 'text-primary' : 'text-orange-500'
                      }`}>
                      {step.status === 'completed' ? t('kycCorporate.completed') : step.status === 'inProcess' ? t('claim.inProcess') : t('claim.pending')}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="flex-1 h-0.5 bg-border mx-2"></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* KYC Form */}
          <div className="max-w-6xl mx-auto">
            <Tabs defaultValue="self" className="w-full">
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-5 h-5" />
                  <h2 className="text-lg font-semibold">{t('kycCorporate.kycCategory')}</h2>
                </div>
                <TabsList className="grid w-full max-w-md grid-cols-2">
                  <TabsTrigger value="self">{t('kycCorporate.self')}</TabsTrigger>
                  <TabsTrigger value="others">{t('kycCorporate.others')}</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="self" className="space-y-8">
                {/* Basic Information */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <User className="w-5 h-5" />
                    <h2 className="text-lg font-semibold">{t('kycCorporate.basicInformation')}</h2>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="fullName">{t('kycCorporate.fullName')} *</Label>
                      <Input id="fullName" className="mt-2" />
                    </div>
                    <div>
                      <Label htmlFor="fullNameNepali">{t('kycCorporate.fullNameNepali')}</Label>
                      <Input id="fullNameNepali" className="mt-2" />
                    </div>
                    <div>
                      <Label htmlFor="occupation">{t('kycCorporate.occupation')} *</Label>
                      <Select>
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="business">Business</SelectItem>
                          <SelectItem value="service">Service</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="incomeSource">{t('kycCorporate.incomeSource')} *</Label>
                      <Select>
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="business">Business</SelectItem>
                          <SelectItem value="salary">Salary</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="turnover">{t('kycCorporate.expectedAnnualTurnover')} *</Label>
                      <Input id="turnover" className="mt-2" />
                    </div>
                    <div>
                      <Label htmlFor="contactPerson">{t('kycCorporate.contactPerson')} *</Label>
                      <Input id="contactPerson" className="mt-2" />
                    </div>

                    <div>
                      <Label htmlFor="email">{t('kycCorporate.emailAddress')} *</Label>
                      <Input id="email" type="email" className="mt-2" />
                    </div>
                    <div>
                      <Label htmlFor="phone">{t('kycCorporate.phoneNo')} *</Label>
                      <Input id="phone" type="tel" className="mt-2" />
                    </div>
                    <div>
                      <Label htmlFor="mobile">{t('kycCorporate.mobileNo')} *</Label>
                      <Input id="mobile" type="tel" className="mt-2" />
                    </div>

                    <div>
                      <Label htmlFor="panVat">{t('kycCorporate.panVatNo')} *</Label>
                      <Input id="panVat" className="mt-2" />
                    </div>
                    <div>
                      <Label htmlFor="issueDate">{t('kycCorporate.issueDate')} *</Label>
                      <Input id="issueDate" type="date" className="mt-2" />
                    </div>
                    <div>
                      <Label htmlFor="issueDateBS">{t('kycCorporate.issueDateBS')} *</Label>
                      <Input id="issueDateBS" className="mt-2" />
                    </div>

                    <div>
                      <Label htmlFor="registrationNo">{t('kycCorporate.registrationNo')} *</Label>
                      <Input id="registrationNo" className="mt-2" />
                    </div>
                    <div>
                      <Label htmlFor="regDate">{t('kycCorporate.regDate')} *</Label>
                      <Input id="regDate" type="date" className="mt-2" />
                    </div>
                    <div>
                      <Label htmlFor="regDateBS">{t('kycCorporate.regDateBS')} *</Label>
                      <Input id="regDateBS" className="mt-2" />
                    </div>

                    <div>
                      <Label htmlFor="regOffice">{t('kycCorporate.regOffice')} *</Label>
                      <Input id="regOffice" className="mt-2" />
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="w-5 h-5" />
                    <h2 className="text-lg font-semibold">{t('kycCorporate.address')}</h2>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="country">{t('kycCorporate.country')} *</Label>
                      <Select>
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="nepal">Nepal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="province">{t('kycCorporate.province')} *</Label>
                      <Select>
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Province 1</SelectItem>
                          <SelectItem value="2">Province 2</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="district">{t('kycCorporate.district')} *</Label>
                      <Select>
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="kathmandu">Kathmandu</SelectItem>
                          <SelectItem value="lalitpur">Lalitpur</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="municipality">{t('kycCorporate.municipality')} *</Label>
                      <Input id="municipality" className="mt-2" />
                    </div>
                    <div>
                      <Label htmlFor="wardNo">{t('kycCorporate.wardNo')} *</Label>
                      <Input id="wardNo" type="number" defaultValue="0" className="mt-2" />
                    </div>
                    <div>
                      <Label htmlFor="area">{t('kycCorporate.area')} *</Label>
                      <Select>
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="area1">Area 1</SelectItem>
                          <SelectItem value="area2">Area 2</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="address">{t('kycCorporate.addressField')} *</Label>
                      <Input id="address" className="mt-2" />
                    </div>
                    <div>
                      <Label htmlFor="addressNepali">{t('kycCorporate.addressNepali')}</Label>
                      <Input id="addressNepali" className="mt-2" />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between pt-4">
                  <Button variant="outline" className="gap-2">
                    {t('kycCorporate.back')}
                  </Button>
                  <Button className="bg-primary hover:bg-primary/90">
                    {t('kycCorporate.continue')}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="others">
                <div className="text-center py-12 text-muted-foreground">
                  {t('kycCorporate.others')}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
};
