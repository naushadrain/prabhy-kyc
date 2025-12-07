import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { InsuranceCard } from '@/components/InsuranceCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const Dashboard = () => {
  const { t } = useLanguage();
  const fullName = localStorage.getItem("customer_name") || "Guest User";
  const partyType = localStorage.getItem("party_type") || "INDIVIDUAL";
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-8">
          <h1 className="text-4xl font-bold mb-8">
            {t('home.title').split('Insurance Policy')[0]}
            <span className="text-secondary">Insurance Policy</span>
          </h1>
  

          <Alert className="mb-8 bg-destructive/10 border-destructive">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive">
              {t('dashboard.kycNotVerified')}
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <InsuranceCard
              type="motor"
              title={t('insurance.motor')}
              subtitle={t('insurance.vehicle')}
            />
            <InsuranceCard
              type="travel"
              title={t('insurance.travel')}
              subtitle={t('insurance.travelIns')}
            />
            <InsuranceCard
              type="home"
              title={t('insurance.home')}
              subtitle={t('insurance.homeIns')}
            />
          </div>
        </main>
      </div>
    </div>
  );
};
