import { useState } from "react";
import { Outlet, useSearchParams } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function PCommercialVehiclePage() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const handlePlanSelect = (planType: "comprehensive" | "third-party") => {
        localStorage.setItem("motor.vehicleType", "commercial");
        localStorage.setItem("motor.insurancePlan", planType);

        localStorage.removeItem("motor.selectedCommercialCategory");
        localStorage.removeItem("motor.coverageForm");
        localStorage.removeItem("motor.premiumResponse");

        if (planType === "comprehensive") {
            navigate("/commercial-vehicle/comprehensive");
        } else {
            navigate("/commercial-vehicle/third-party");
        }
    };
    return (
        <div className="flex min-h-screen">
            <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className="flex-1 flex flex-col">
                <Header onMenuClick={() => setSidebarOpen(true)} />
                {/* Page Content */}
                <main className="flex flex-1 items-start justify-center bg-background px-4 py-8 sm:px-6 lg:px-8">
                    <div className="w-full max-w-5xl">
                        <div className="mb-8 flex items-start gap-3">
                            <button
                                type="button"
                                className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-white transition hover:bg-muted"
                                onClick={() => navigate("/dashboard")}
                            >
                                <ChevronLeft className="h-5 w-5 text-black" />
                            </button>

                            <div>
                                <h1 className="text-2xl font-bold text-black">
                                    Commercial Vehicle Plan
                                </h1>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    Select insurance type to continue.
                                </p>
                            </div>
                        </div>

                        <div className="mx-auto grid w-full max-w-6xl gap-6 md:grid-cols-2">
                            <Card
                                className="cursor-pointer border-2 p-6 transition-all hover:-translate-y-1 hover:border-primary hover:shadow-xl"
                                onClick={() => handlePlanSelect("comprehensive")}
                            >
                                <h3 className="mb-2 text-center text-lg font-bold">
                                    Comprehensive Insurance
                                </h3>

                                <div className="my-8 flex justify-center">
                                    <div className="flex h-32 w-32 items-center justify-center rounded-full bg-primary/10">
                                        <svg viewBox="0 0 100 100" className="h-full w-full p-6">
                                            <path
                                                d="M50 10 L65 25 L65 50 L50 60 L35 50 L35 25 Z"
                                                fill="none"
                                                stroke="hsl(var(--primary))"
                                                strokeWidth="2"
                                            />

                                            <circle
                                                cx="50"
                                                cy="35"
                                                r="8"
                                                fill="hsl(var(--primary))"
                                            />

                                            <path
                                                d="M42 42 L42 50 L58 50 L58 42"
                                                fill="hsl(var(--primary))"
                                            />
                                        </svg>
                                    </div>
                                </div>

                                <p className="text-center text-xs text-muted-foreground">
                                    Covers own damage and third-party damages.
                                </p>
                            </Card>

                            <Card
                                className="cursor-pointer border-2 p-6 transition-all hover:-translate-y-1 hover:border-primary hover:shadow-xl"
                                onClick={() => handlePlanSelect("third-party")}
                            >
                                <h3 className="mb-2 text-center text-lg font-bold">
                                    Third Party Insurance
                                </h3>

                                <div className="my-8 flex justify-center">
                                    <div className="flex h-32 w-32 items-center justify-center rounded-full bg-primary/10">
                                        <svg viewBox="0 0 100 100" className="h-full w-full p-6">
                                            <path
                                                d="M50 10 L65 25 L65 50 L50 60 L35 50 L35 25 Z"
                                                fill="none"
                                                stroke="hsl(var(--primary))"
                                                strokeWidth="2"
                                            />

                                            <path
                                                d="M42 32 L48 38 L58 28"
                                                fill="none"
                                                stroke="hsl(var(--primary))"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />

                                            <path
                                                d="M40 45 L40 52 L60 52 L60 45"
                                                fill="hsl(var(--primary))"
                                            />
                                        </svg>
                                    </div>
                                </div>

                                <p className="text-center text-xs text-muted-foreground">
                                    Covers only third-party damages.
                                </p>
                            </Card>
                        </div>

                        <div className="mx-auto mt-8 grid w-full max-w-6xl gap-4 md:grid-cols-2">
                            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                                <p className="text-sm text-green-700">
                                    Comprehensive insurance covers own damage and third-party damage.
                                </p>
                            </div>

                            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                                <p className="text-sm text-blue-700">
                                    Third-party insurance covers third-party damage only.
                                </p>
                            </div>
                        </div>
                    </div>
                </main>

            </div>
        </div>
    )
}