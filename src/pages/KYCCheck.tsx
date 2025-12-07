import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, ArrowLeft } from 'lucide-react';

export const KYCCheck = () => {
  const { t } = useLanguage();

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-8 bg-background">
          <div className="max-w-2xl">
            <Button variant="ghost" className="mb-6 gap-2">
              <ArrowLeft className="w-4 h-4" />
            </Button>

            <h1 className="text-3xl font-bold mb-8">{t('kycCheck.title')}</h1>

            <div className="space-y-4">
              <div>
                <Label htmlFor="mobile">{t('kycCheck.mobileNumber')} *</Label>
                <Input id="mobile" type="tel" className="mt-2" />
              </div>

              <Button className="bg-primary hover:bg-primary/90 gap-2">
                <Search className="w-4 h-4" />
                {t('myPolicies.search')}
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
