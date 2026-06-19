import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { InsuranceCard } from "@/components/InsuranceCard";
import { useLanguage } from "@/contexts/LanguageContext";
import { LogIn } from "lucide-react";
import logo from "@/assets/logo.png";

export const Home = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const insurancePlans = [
    {
      id: "two-wheeler",
      title: "Two Wheeler",
      icon: "/motor.svg",
      route: "/motor/two-wheeler",
    },
    {
      id: "private",
      title: "Private Vehicle",
      icon: "/car-white.svg",
      route: "/motor/private-vehicle",
    },
    {
      id: "commercial",
      title: "Commercial Vehicle",
      icon: "/commercial.svg",
      route: "/motor/commercial-vehicle",
    },
    {
      id: "accident",
      title: " Accidental Insurance",
      icon: "/accident-white.svg",
      route: "/accident-insurance",
    },
    {
      id: "travel",
      title: "Travel Insurance",
      icon: "/travel-icon.svg",
      route: "/travel-coverage",
    },
    {
      id: "home",
      title: "House & Property Insurance",
      icon: "/Property-white.svg",
      route: "/home-insurance",
    },
    {
      id: "Burglary Housebreaking",
      title: "Burglary & Housebreaking Insurance",
      icon: "/burglary-housebreaking.svg",
      route: "/burglary-housebreaking",
    },
    {
      id: "cash",
      title: "Cash Insurance",
      icon: "/cash-insurance.svg",
      route: "/cash-insurance",
    },
    {
      id: "marine",
      title: "Marine Insurance",
      icon: "/marine-insurance.svg",
      route: "/marine-insurance",
    },
    {
      id: "agriculture",
      title: "Agriculture Insurance",
      icon: "/agriculture-insurance.svg",
      route: "/agriculture-insurance",
    }
  ];

  const handlePlanSelect = (planId: string, route: string) => {
    localStorage.setItem("motor.vehicleType", planId);
    navigate(route);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border px-8 py-4">
        <div>
          <img src={logo} alt="Prabhu Insurance" className="h-12" />
        </div>

        <Link to="/login">
          <Button className="gap-2">
            <LogIn className="h-4 w-4" />
            {t("nav.login")}
          </Button>
        </Link>
      </header>

      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-8 py-16">
        <h1 className="mb-16 text-center text-5xl font-bold">
          {t("home.title").split("Insurance Policy")[0]}
          <span className="text-red-500">Insurance Policy</span>
        </h1>

        <div className="mb-24 grid grid-cols-1 gap-8 md:grid-cols-3">
          {insurancePlans.map((plan) => (
            <InsuranceCard
              key={plan.id}
              icon={plan.icon}
              title={plan.title}
              onClick={() => handlePlanSelect(plan.id, plan.route)}
            />
          ))}
        </div>
      </section>

      {/* Why Pick Us Section */}
      <section className="bg-accent py-20">
        <div className="mx-auto max-w-7xl px-8">
          <h2 className="mb-16 text-center text-4xl font-bold">
            {t("home.whyPickUs")}
          </h2>

          <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-64 w-64 items-center justify-center rounded-full bg-blue-100">
                <div className="text-6xl">📋</div>
              </div>

              <h3 className="mb-3 text-xl font-bold">
                {t("home.compareProduct")}
              </h3>

              <p className="px-4 text-sm text-muted-foreground">
                {t("home.compareDesc")}
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-6 flex h-64 w-64 items-center justify-center rounded-full bg-blue-100">
                <div className="text-6xl">💡</div>
              </div>

              <h3 className="mb-3 text-xl font-bold">
                {t("home.simpleReliable")}
              </h3>

              <p className="px-4 text-sm text-muted-foreground">
                {t("home.simpleDesc")}
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-6 flex h-64 w-64 items-center justify-center rounded-full bg-blue-100">
                <div className="text-6xl">💰</div>
              </div>

              <h3 className="mb-3 text-xl font-bold">
                {t("home.saveMoney")}
              </h3>

              <p className="px-4 text-sm text-muted-foreground">
                {t("home.saveDesc")}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};