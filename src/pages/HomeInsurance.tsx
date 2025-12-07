import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ChevronLeft, ArrowRight } from 'lucide-react';

export const HomeInsurance = () => {
  const { t } = useLanguage();

  const steps = [
    { number: 1, label: t('homeInsurance.step1'), status: 'inProcess' },
    { number: 2, label: t('homeInsurance.step2'), status: 'pending' },
    { number: 3, label: t('homeInsurance.step3'), status: 'pending' },
    { number: 4, label: t('homeInsurance.step4'), status: 'pending' },
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

          {/* Form */}
          <div className="max-w-4xl mx-auto">
            <Button variant="ghost" className="mb-4 gap-2">
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <h1 className="text-2xl font-bold mb-8">{t('homeInsurance.title')}</h1>

            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>{t('homeInsurance.propertyLists')} *</Label>
                  <Select>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Building" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="building">Building</SelectItem>
                      <SelectItem value="content">Content</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t('homeInsurance.sumInsured')} *</Label>
                  <Input type="number" defaultValue="7" className="mt-2" />
                </div>
                <div>
                  <Label>{t('homeInsurance.effectiveDate')} *</Label>
                  <Input type="date" defaultValue="2025-10-31" className="mt-2" />
                </div>
                <div>
                  <Label>{t('homeInsurance.expiryDate')}</Label>
                  <Input type="date" defaultValue="2026-10-30" className="mt-2" disabled />
                </div>
              </div>

              <div className="border border-primary rounded-lg p-4 space-y-4">
                <div>
                  <Label className="text-primary">{t('homeInsurance.propertyLists')} *</Label>
                  <Select>
                    <SelectTrigger className="mt-2 border-primary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="building">Building</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-destructive mt-1">This value is required!</p>
                </div>

                <div>
                  <Label>{t('homeInsurance.propertyDescription')}</Label>
                  <Input defaultValue="Assumenda vero sed t" className="mt-2" />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>{t('homeInsurance.sumInsured')} *</Label>
                    <Input type="number" defaultValue="41" className="mt-2" />
                  </div>
                </div>

                <Button className="bg-green-600 hover:bg-green-700">
                  {t('homeInsurance.addPropertyList')}
                </Button>
              </div>

              {/* Table */}
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-primary hover:bg-primary">
                      <TableHead className="text-primary-foreground font-bold">
                        {t('homeInsurance.propertyLists')}
                      </TableHead>
                      <TableHead className="text-primary-foreground font-bold">
                        {t('homeInsurance.sumInsured')}
                      </TableHead>
                      <TableHead className="text-primary-foreground font-bold">
                        {t('claimTracking.action')}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Building</TableCell>
                      <TableCell>7.00</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                    <TableRow className="bg-primary hover:bg-primary">
                      <TableCell className="text-primary-foreground font-bold">
                        {t('homeInsurance.total')}
                      </TableCell>
                      <TableCell className="text-primary-foreground font-bold">7.00</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-sm text-orange-700">{t('homeInsurance.note')}</p>
              </div>

              <div className="flex justify-end">
                <Button size="lg" className="bg-primary hover:bg-primary/90 gap-2">
                  {t('common.next')} <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
