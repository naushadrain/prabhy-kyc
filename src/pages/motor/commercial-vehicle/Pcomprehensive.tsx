// CommercialVehicle/comprehensive/PComprehensivePage.tsx

import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";

import { Card } from "@/components/ui/card";

type CommercialCategory = {
    data: string;
    value: string;
    icon: string;
    title: string;
    description: string;
    badge: string;
    to: string;
};

const CATEGORIES: CommercialCategory[] = [
    {
        data: "3",
        value: "Commercial Vehicle Normal Good Carrying Policy",
        icon: "/normal-goods.svg",
        title: "Normal Goods Carrying",
        description: "Comprehensive insurance for normal goods carrying vehicles.",
        badge: "Goods",
        to: "/commercial-vehicle/comprehensive/normal-goods",
    },
    {
        data: "4",
        value: "Commercial Vehicle Hazardous Good Carrying Policy",
        icon: "/hazardous-svgrepo-com.svg",
        title: "Hazardous Goods Carrying",
        description: "Comprehensive insurance for hazardous goods carrying vehicles.",
        badge: "Hazard",
        to: "/commercial-vehicle/comprehensive/hazardous-goods",
    },
    {
        data: "5",
        value: "Commercial Vehicle Passenger Carrying Policy",
        icon: "/bus.svg",
        title: "Passenger Carrying",
        description: "Comprehensive insurance for passenger carrying vehicles.",
        badge: "Passenger",
        to: "/commercial-vehicle/comprehensive/passenger-carrying",
    },
    {
        data: "6",
        value: "Taxi Policy",
        icon: "/taxi-4-svgrepo-com.svg",
        title: "Taxi Policy",
        description: "Comprehensive insurance for taxi and public hire vehicles.",
        badge: "Taxi",
        to: "/commercial-vehicle/comprehensive/taxi",
    },
    {
        data: "7",
        value: "Tempo/E-Rikshwa Policy",
        icon: "/tempo.svg",
        title: "Tempo / E-Rikshaw",
        description: "Comprehensive insurance for tempo and e-rikshaw vehicles.",
        badge: "Tempo",
        to: "/commercial-vehicle/comprehensive/tempo-e-rikshaw",
    },
    {
        data: "9",
        value: "Construction Equipment Vehicle",
        icon: "/transportationwhite.svg",
        title: "Construction Equipment",
        description: "Comprehensive insurance for construction equipment vehicles.",
        badge: "Construction",
        to: "/commercial-vehicle/comprehensive/construction-equipment",
    },
];

export default function PComprehensivePage() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const currentStep = Number(searchParams.get("step")) || 2;

    const handleCategorySelect = (category: CommercialCategory) => {
        localStorage.setItem("motor.vehicleType", "commercial");
        localStorage.setItem("motor.insurancePlan", "comprehensive");

        localStorage.setItem(
            "motor.selectedCommercialCategory",
            JSON.stringify({
                data: category.data,
                value: category.value,
                additional_value: "CV",
                title: category.title,
                route: category.to,
            }),
        );

        localStorage.setItem("motor.selectedCommercialCategoryId", category.data);

        localStorage.removeItem("motor.coverageForm");
        localStorage.removeItem("motor.premiumResponse");
        localStorage.removeItem("motor.vehicleDetail");
        localStorage.removeItem("motor.billbookFrontName");
        localStorage.removeItem("motor.billbookBackName");

        sessionStorage.removeItem("motor.billbookFrontData");
        sessionStorage.removeItem("motor.billbookBackData");

        navigate(category.to);
    };

    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="flex min-w-0 flex-1 flex-col">
                <Header onMenuClick={() => setSidebarOpen(true)} />

                <main className="mx-auto flex max-w-5xl flex-1 justify-center px-4 py-8 sm:px-6 lg:px-8">
                    <div className="w-full max-w-6xl">
                        <div className="mb-8 flex items-start gap-3">
                            <button
                                type="button"
                                onClick={() => navigate("/commercial-vehicle")}
                                className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-white transition hover:bg-muted"
                            >
                                <ChevronLeft className="h-5 w-5 text-black" />
                            </button>

                            <div>
                                <h1 className="text-2xl font-bold text-black">
                                    Select Commercial Vehicle Category
                                </h1>

                                <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                                    Choose the commercial vehicle type to continue with
                                    comprehensive insurance premium calculation.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                            {CATEGORIES.map((category) => (
                                <Card
                                    key={category.data}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => handleCategorySelect(category)}
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter" || event.key === " ") {
                                            event.preventDefault();
                                            handleCategorySelect(category);
                                        }
                                    }}
                                    className="
                                        group flex h-[275px] cursor-pointer flex-col items-center justify-center
                                        rounded-md border border-gray-100 bg-white p-8 text-center shadow-sm
                                        transition-all duration-300 hover:-translate-y-1 hover:border-red-500 hover:shadow-xl
                                        focus:outline-none focus:ring-2 focus:ring-red-500/40
                                    "
                                >
                                    <div className="mb-10 flex items-center justify-center">
                                        <img
                                            src={category.icon}
                                            alt={category.title}
                                            className="
                                                h-28 w-28 object-contain transition-transform duration-300
                                                group-hover:scale-110
                                            "
                                            style={{
                                                filter:
                                                    "brightness(0) saturate(100%) invert(18%) sepia(97%) saturate(3205%) hue-rotate(348deg) brightness(96%) contrast(95%)",
                                            }}
                                        />
                                    </div>

                                    <h3 className="max-w-[260px] text-center text-lg font-extrabold uppercase leading-7 tracking-wide text-red-600">
                                        {category.title}
                                    </h3>
                                </Card>
                            ))}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}