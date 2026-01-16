import React from "react";
import { Bell, Settings, Calendar, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { logoutCustomer } from "@/api/auth/login/logoutClient";
import { useNavigate } from "react-router-dom";

type HeaderProps = {
  onMenuClick?: () => void; // ✅ for mobile sidebar toggle
  title?: string;           // optional title if you want
};

export const Header: React.FC<HeaderProps> = ({ onMenuClick, title }) => {
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();

  const fullName = localStorage.getItem("customer_name") || "Guest User";
  const partyType = localStorage.getItem("party_type") || "INDIVIDUAL";
  const initial = (fullName?.trim()?.[0] || "G").toUpperCase();

  // ✅ make time update every minute (optional)
  const [now, setNow] = React.useState(() => new Date());
  React.useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const LogoutHandler = async () => {
    try {
      await logoutCustomer(); // API call
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      // clear local auth data
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("access_expires_at");
      localStorage.removeItem("otp_process_id");
      localStorage.removeItem("login_encrypt");
      localStorage.removeItem("otp_mobile");
      localStorage.removeItem("customer_name");
      localStorage.removeItem("party_type");

      navigate("/", { replace: true });
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-background border-b border-border">
      <div className="px-4 lg:px-6 py-3 flex items-center justify-between gap-3">
        {/* LEFT */}
        <div className="flex items-center gap-3 min-w-0">
          {/* ✅ Hamburger only for mobile/tablet */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onMenuClick}
          >
            <Menu className="w-5 h-5" />
          </Button>

          {/* Optional page title */}
          {title && (
            <div className="hidden md:block font-semibold truncate">{title}</div>
          )}

          {/* Date/time (hide on very small screens) */}
          <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>
              {now.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Button variant="ghost" size="icon" type="button">
            <Bell className="w-5 h-5 text-primary" />
          </Button>

          <Button type="button" onClick={LogoutHandler}>
            LogOut
          </Button>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" type="button">
                <Settings className="w-5 h-5 text-primary" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("settings.title")}</DialogTitle>
              </DialogHeader>

              <div className="py-4">
                <h3 className="text-sm font-medium mb-3">
                  {t("settings.language")}
                </h3>

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant={language === "en" ? "default" : "outline"}
                    onClick={() => setLanguage("en")}
                    className="flex-1"
                  >
                    {t("settings.english")}
                  </Button>

                  <Button
                    type="button"
                    variant={language === "ne" ? "default" : "outline"}
                    onClick={() => setLanguage("ne")}
                    className="flex-1"
                  >
                    {t("settings.nepali")}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Profile */}
          <div className="hidden md:flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
              {initial}
            </div>
            <span className="text-sm font-medium">
              {`${fullName} (${partyType})`}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
