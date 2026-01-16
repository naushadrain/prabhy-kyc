import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { useLanguage } from '@/contexts/LanguageContext';
import { InsuranceCard } from '@/components/InsuranceCard';
import { useState } from 'react';

export const BuyPolicies = () => {
  const { t } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  return (
    <div className="flex min-h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-8 bg-background">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-4xl font-bold text-center mb-12">
              {t('buyPolicies.title').split('Insurance Policy')[0]}
              <span className="text-primary/60">Insurance Policy</span>
            </h1>

            <div className="grid md:grid-cols-3 gap-6">
              <InsuranceCard
                type="motor"
                title={t('buyPolicies.motor')}
                subtitle={t('insurance.vehicle')}
                to="/motor-insurance-plan"
              />
              <InsuranceCard
                type="travel"
                title={t('buyPolicies.travel')}
                subtitle={t('insurance.travelIns')}
                to="/travel-insurance"
              />
              <InsuranceCard
                type="home"
                title={t('buyPolicies.home')}
                subtitle={t('insurance.homeIns')}
                to="/home-insurance"
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
