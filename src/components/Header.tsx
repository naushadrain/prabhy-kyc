import React from "react";
import { Bell, Settings, Calendar, Menu, User, LogOut, Lock, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { logoutCustomer } from "@/api/auth/login/logoutClient";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/sonner";

type HeaderProps = {
  onMenuClick?: () => void;
  title?: string;
};

export const Header: React.FC<HeaderProps> = ({ onMenuClick, title }) => {
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();

  const fullName = localStorage.getItem("customer_name") || "Guest User";
  const initial = (fullName?.trim()?.[0] || "G").toUpperCase();

  const [now, setNow] = React.useState(() => new Date());
  React.useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const LogoutHandler = async () => {
    try {
      await logoutCustomer();
      toast.success("Logged out successfully", {
        description: "You have been signed out. See you soon!",
      });
    } catch (err) {
      toast.error("Logout failed", {
        description: "Something went wrong. You have been signed out anyway.",
      });
    } finally {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("access_expires_at");
      localStorage.removeItem("otp_process_id");
      localStorage.removeItem("login_encrypt");
      localStorage.removeItem("otp_mobile");
      localStorage.removeItem("customer_name");
      localStorage.removeItem("party_type");
      setTimeout(() => navigate("/", { replace: true }), 1000);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-background border-b border-border shadow-sm">
      <div className="px-4 lg:px-6 py-3 flex items-center justify-between gap-3">
        {/* LEFT */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Hamburger only for mobile/tablet */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onMenuClick}
          >
            <Menu className="w-5 h-5" />
          </Button>
          {/* Date/time */}
          <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4 text-primary" />
            <span>
              {now.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
            <span className="text-muted-foreground/60">•</span>
            <span className="font-medium text-foreground">
              {now.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Notification Bell */}
          

          {/* Settings Dialog */}
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
                <h3 className="text-sm font-medium mb-3">{t("settings.language")}</h3>
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

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-accent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm ring-2 ring-primary/20">
                  {initial}
                </div>
                {/* Name + type (desktop only) */}
                <div className="hidden md:flex flex-col items-start leading-tight">
                  <span className="text-sm font-semibold truncate max-w-[120px]">{fullName}</span>
                  
                </div>
                <ChevronDown className="hidden md:block w-4 h-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                className="gap-2 cursor-pointer"
                onClick={() => navigate("/profile")}
              >
                <User className="w-4 h-4 text-primary" />
                <span>My Profile</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                className="gap-2 cursor-pointer"
                onClick={() => navigate("/change-password")}
              >
                <Lock className="w-4 h-4 text-primary" />
                <span>Change Password</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="gap-2 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                onClick={LogoutHandler}
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
