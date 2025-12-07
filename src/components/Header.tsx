import { Bell, Settings, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { logoutCustomer } from '@/api/logoutClient';
import { useNavigate } from "react-router-dom";

export const Header = () => {
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate(); // ✅ hook at top-level

  const fullName = localStorage.getItem("customer_name") || "Guest User";
  const partyType = localStorage.getItem("party_type") || "INDIVIDUAL";
  const initial = fullName.charAt(0).toUpperCase();

  const LogoutHandler = async () => {
    try {
      await logoutCustomer();          // call API
    } catch (err) {
      console.error("Logout failed:", err);
      // optional: show toast / message
    } finally {
      // clear local auth data
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("otp_process_id");
      localStorage.removeItem("login_encrypt");
      localStorage.removeItem("otp_mobile");
      localStorage.removeItem("customer_name");
      localStorage.removeItem("party_type");

      navigate("/");                   // ✅ go to root page
    }
  };

  return (
    <header className="bg-background border-b border-border px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm">
        <Calendar className="w-4 h-4" />
        <span>
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon">
          <Bell className="w-5 h-5 text-primary" />
        </Button>

        <Button onClick={LogoutHandler}>
          LogOut
        </Button>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon">
              <Settings className="w-5 h-5 text-primary" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('settings.title')}</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <h3 className="text-sm font-medium mb-3">{t('settings.language')}</h3>
              <div className="flex gap-4">
                <Button
                  variant={language === 'en' ? 'default' : 'outline'}
                  onClick={() => setLanguage('en')}
                  className="flex-1"
                >
                  {t('settings.english')}
                </Button>
                <Button
                  variant={language === 'ne' ? 'default' : 'outline'}
                  onClick={() => setLanguage('ne')}
                  className="flex-1"
                >
                  {t('settings.nepali')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
            {initial}
          </div>
          <span className="text-sm font-medium">
            {`${fullName} (${partyType})`}
          </span>
        </div>
      </div>
    </header>
  );
};
