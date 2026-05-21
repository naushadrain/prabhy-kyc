// CommercialVehicle/comprehensive/Comprehensive.tsx

import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
        icon: "🚚",
        title: "Normal Goods Carrying",
        description: "Comprehensive insurance for normal goods carrying vehicles.",
        badge: "Goods",
        to: "/motor/commercial-vehicle/comprehensive/normal-goods",
    },
    {
        data: "4",
        value: "Commercial Vehicle Hazardous Good Carrying Policy",
        icon: "⚠️",
        title: "Hazardous Goods Carrying",
        description: "Comprehensive insurance for hazardous goods carrying vehicles.",
        badge: "Hazard",
        to: "/motor/commercial-vehicle/comprehensive/hazardous-goods",
    },
    {
        data: "5",
        value: "Commercial Vehicle Passenger Carrying Policy",
        icon: "🚌",
        title: "Passenger Carrying",
        description: "Comprehensive insurance for passenger carrying vehicles.",
        badge: "Passenger",
        to: "/motor/commercial-vehicle/comprehensive/passenger-carrying",
    },
    {
        data: "6",
        value: "Taxi Policy",
        icon: "🚕",
        title: "Taxi Policy",
        description: "Comprehensive insurance for taxi and public hire vehicles.",
        badge: "Taxi",
        to: "/motor/commercial-vehicle/comprehensive/taxi",
    },
    {
        data: "7",
        value: "Tempo/E-Rikshwa Policy",
        icon: "🛺",
        title: "Tempo / E-Rikshaw",
        description: "Comprehensive insurance for tempo and e-rikshaw vehicles.",
        badge: "Tempo",
        to: "/motor/commercial-vehicle/comprehensive/tempo-e-rikshaw",
    },
    {
        data: "8",
        value: "Agriculture & Forestry Vehicle",
        icon: "🌾",
        title: "Agriculture & Forestry",
        description: "Comprehensive insurance for agriculture and forestry vehicles.",
        badge: "Agriculture",
        to: "/motor/commercial-vehicle/comprehensive/agriculture-forestry",
    },
    {
        data: "9",
        value: "Construction Equipment Vehicle",
        icon: "🚜",
        title: "Construction Equipment",
        description: "Comprehensive insurance for construction equipment vehicles.",
        badge: "Construction",
        to: "/motor/commercial-vehicle/comprehensive/construction-equipment",
    },
    // {
    //     data: "11",
    //     value: "Tractor & Power Trailer Policy",
    //     icon: "🚛",
    //     title: "Tractor & Power Trailer",
    //     description: "Comprehensive insurance for tractors and power trailers.",
    //     badge: "Tractor",
    //     to: "/motor/commercial-vehicle/comprehensive/tractor-power-trailer",
    // },
    
];

export const Comprehensive = () => {
    const navigate = useNavigate();

    const handleCategoryClick = (category: CommercialCategory) => {
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
            })
        );

        localStorage.removeItem("motor.coverageForm");
        localStorage.removeItem("motor.premiumResponse");

        navigate(category.to);
    };

    return (
        <>
            <div className="mb-8 flex items-center gap-3">
                <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100"
                    onClick={() => navigate("/motor/commercial-vehicle")}
                >
                    <ChevronLeft className="h-5 w-5 text-black" />
                </button>

                <div>
                    <h1 className="text-2xl font-bold text-black">
                        Comprehensive Commercial Vehicle
                    </h1>

                    <p className="mt-1 text-sm text-muted-foreground">
                        Select your commercial vehicle category to continue.
                    </p>
                </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {CATEGORIES.map((category) => (
                    <Card
                        key={category.data}
                        onClick={() => handleCategoryClick(category)}
                        className="group cursor-pointer overflow-hidden border-2 bg-white transition-all duration-200 hover:-translate-y-1 hover:border-primary hover:shadow-xl"
                    >
                        <CardContent className="p-5">
                            <div className="mb-4 flex items-start justify-between gap-3">
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-3xl transition group-hover:scale-105">
                                    {category.icon}
                                </div>

                                <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                                    {category.badge}
                                </span>
                            </div>

                            <h3 className="text-base font-bold text-foreground">
                                {category.title}
                            </h3>

                            <div className="mt-4 rounded-lg bg-muted/40 px-3 py-2">
                                <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">
                                    {category.description}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </>
    );
};

export default Comprehensive;