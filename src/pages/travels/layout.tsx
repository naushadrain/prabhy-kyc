import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { getTravelStepsProtect } from "@/utils/travelStepsProtect";
import TravelStepperProtect from "@/components/common/TravelStepperProtect";

const stepMap: Record<string, number> = {
  "/travel-insurance-coverage": 1,
  "/travel-insurance-details": 2,
  "/travel-insurance-premium": 3,
  "/travel-insurance-instant-quotes": 4,
};

export default function ProtectedTravelLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const currentStep = stepMap[location.pathname] ?? 1;

  return (
    <div className="flex min-h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        {/* Stepper */}
        <div className="mx-auto w-full max-w-7xl sm:px-6 lg:px-8 pt-6">
          <TravelStepperProtect steps={getTravelStepsProtect(currentStep)} />
        </div>

        {/* Page content */}
        <main className="flex-1 p-8 bg-background">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
