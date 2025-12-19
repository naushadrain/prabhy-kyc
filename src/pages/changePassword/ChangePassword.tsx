import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ChangePassword = () => {
  const { t } = useLanguage();

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-8">
          <div className="max-w-3xl">
            <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm mb-6 hover:text-primary">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>

            <h1 className="text-3xl font-bold mb-8">{t('password.change')}</h1>

            <div className="space-y-6">
              <div className="relative">
                <Input 
                  type="password"
                  placeholder={t('password.current')}
                  className="pr-10"
                />
                <Eye className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>

              <div className="relative">
                <Input 
                  type="password"
                  placeholder={t('password.new')}
                  className="pr-10"
                />
                <Eye className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>

              <div className="relative">
                <Input 
                  type="password"
                  placeholder={t('password.confirm')}
                  className="pr-10"
                />
                <Eye className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>

              <Button size="lg">
                {t('common.submit')}
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
