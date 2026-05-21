import { useState } from "react";
import { Outlet, useSearchParams } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import MotorStepper from "@/components/common/MotorStepper";
import { getMotorSteps } from "@/utils/motorSteps";

export default function ProtectedMotorLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const currentStep = Number(searchParams.get("step")) || 1;

  return (
    <div className="flex min-h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        {/* Stepper */}
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 pt-6">
          <MotorStepper steps={getMotorSteps(currentStep)} />
        </div>

        {/* Page content */}
        <main className="flex-1 p-8 bg-background">
          <div className="max-w-5xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
