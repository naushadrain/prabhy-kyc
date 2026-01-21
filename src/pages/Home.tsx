import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { InsuranceCard } from '@/components/InsuranceCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { LogIn } from 'lucide-react';
import logo from '@/assets/logo.png';

export const Home = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-8 py-4 flex items-center justify-between">
        <div>
          <img
            src={logo}
            alt="Prabhu Insurance"
            className="h-12"
          />
        </div>
        <Link to="/login">
          <Button className="gap-2">
            <LogIn className="w-4 h-4" />
            {t('nav.login')}
          </Button>
        </Link>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-8 py-16">
        <h1 className="text-5xl font-bold text-center mb-16">
          {t('home.title').split('Insurance Policy')[0]}
          <span className="text-secondary">Insurance Policy</span>
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
          <InsuranceCard
            type="motor"
            title={t('insurance.motor')}
            subtitle={t('insurance.vehicle')}
            to="/vehicle-insurance"
          />
          <InsuranceCard
            type="travel"
            title={t('insurance.travel')}
            subtitle={t('insurance.travelIns')}
            to="/travel-coverage"
          />
          <InsuranceCard
            type="home"
            title={t('insurance.home')}
            subtitle={t('insurance.homeIns')}
            to="/home-insurance"
          />
        </div>
      </section>


      {/* Why Pick Us Section */}
      <section className="bg-accent py-20">
        <div className="max-w-7xl mx-auto px-8">
          <h2 className="text-4xl font-bold text-center mb-16">{t('home.whyPickUs')}</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-64 h-64 bg-blue-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                <div className="text-6xl">📋</div>
              </div>
              <h3 className="text-xl font-bold mb-3">{t('home.compareProduct')}</h3>
              <p className="text-sm text-muted-foreground px-4">
                {t('home.compareDesc')}
              </p>
            </div>

            <div className="text-center">
              <div className="w-64 h-64 bg-blue-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                <div className="text-6xl">💡</div>
              </div>
              <h3 className="text-xl font-bold mb-3">{t('home.simpleReliable')}</h3>
              <p className="text-sm text-muted-foreground px-4">
                {t('home.simpleDesc')}
              </p>
            </div>

            <div className="text-center">
              <div className="w-64 h-64 bg-blue-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                <div className="text-6xl">💰</div>
              </div>
              <h3 className="text-xl font-bold mb-3">{t('home.saveMoney')}</h3>
              <p className="text-sm text-muted-foreground px-4">
                {t('home.saveDesc')}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
