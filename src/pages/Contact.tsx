import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Phone, Mail, MapPin } from 'lucide-react';
import { Facebook, Instagram } from 'lucide-react';
import { useState } from 'react';

export const Contact = () => {
  const { t } = useLanguage();
const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  return (
    <div className="flex min-h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-2">{t('contact.title')}</h1>
            <p className="text-muted-foreground">{t('contact.subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Left Side - Contact Info */}
            <div>
              <h2 className="text-2xl font-bold mb-2">{t('contact.info')}</h2>
              <p className="text-sm text-muted-foreground mb-8">{t('contact.infoDesc')}</p>

              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5" />
                  <div>
                    <div>977-1-5199220, 5199226</div>
                    <div className="text-sm text-muted-foreground">Fax: 977-1-5199247</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5" />
                  <span>info@prabhuinsurance.com</span>
                </div>

                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5" />
                  <span>P.O.Box 10811, Tinkune, Kathmandu, Nepal</span>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <a href="#" className="w-10 h-10 bg-foreground text-background rounded flex items-center justify-center hover:opacity-80">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-foreground text-background rounded flex items-center justify-center hover:opacity-80">
                  <Instagram className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Right Side - Contact Form */}
            <div className="space-y-4">
              <Input placeholder={`${t('contact.firstName')}*`} />
              <Input placeholder={`${t('contact.lastName')}*`} />
              <Input placeholder={`${t('contact.email')}*`} type="email" />
              <Input placeholder={`${t('contact.phoneNumber')}*`} />
              <Textarea 
                placeholder={`${t('contact.message')}*`} 
                className="min-h-[150px]"
              />
              <Button size="lg" className="w-full">
                {t('common.sendMessage')}
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
