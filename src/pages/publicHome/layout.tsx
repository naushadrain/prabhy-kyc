import { Outlet, useLocation, Link } from "react-router-dom";
import { LogIn } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";


export default function PublicHomeLayout() {
  const { t } = useLanguage();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Fixed header */}
      <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between gap-3">
            <Link to="/">
            <div className="flex items-center gap-3 min-w-0">
              <img src={logo} alt="Prabhu Insurance" className="h-9 w-auto shrink-0" />
              
            </div>
            </Link>

            <div className="flex items-center gap-2 shrink-0">
              <Link to="/login">
                <Button size="sm" className="gap-2">
                  <LogIn className="h-4 w-4" />
                  <span className="hidden sm:inline">{t("nav.login")}</span>
                  <span className="sm:hidden">Login</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>
      {/* Page content */}
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
