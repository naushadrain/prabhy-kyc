// src/pages/home/HomeInsurancePage.tsx

import { Link } from "react-router-dom";
import { Flame, Building2, ArrowRight, Home } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function HomeInsurancePage() {
    const insuranceCards = [
        {
            title: "Fire House",
            description:
                "Calculate fire insurance premium for house or residential building.",
            icon: Home,
            path: "/home-insurance/fire-house",
            badge: "House Insurance",
        },
        {
            title: "Fire Property",
            description:
                "Calculate fire insurance premium for property, stock, furniture, machinery, and other assets.",
            icon: Building2,
            path: "/home-insurance/fire-property",
            badge: "Property Insurance",
        },
    ];

    return (
        <div className="min-h-screen bg-[#fbf4f2] px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">
                <div className="mb-8">
                    <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-2 text-sm font-medium text-red-600">
                        <Flame className="h-4 w-4" />
                        Fire Insurance
                    </div>

                    <h1 className="mt-4 text-3xl font-bold text-black">
                        Home Insurance
                    </h1>

                    <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                        Choose insurance type to continue with premium calculation.
                    </p>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                    {insuranceCards.map((item) => {
                        const Icon = item.icon;

                        return (
                            <Link key={item.title} to={item.path}>
                                <Card className="group h-full cursor-pointer border bg-white transition-all hover:-translate-y-1 hover:border-red-200 hover:shadow-lg">
                                    <CardContent className="p-6">
                                        <div className="mb-5 flex items-start justify-between gap-4">
                                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 transition group-hover:bg-red-600 group-hover:text-white">
                                                <Icon className="h-7 w-7" />
                                            </div>

                                            <span className="rounded-full bg-[#fff7f3] px-3 py-1 text-xs font-medium text-red-600">
                                                {item.badge}
                                            </span>
                                        </div>

                                        <h2 className="text-xl font-bold text-black">
                                            {item.title}
                                        </h2>

                                        <p className="mt-2 min-h-[48px] text-sm leading-6 text-muted-foreground">
                                            {item.description}
                                        </p>

                                    </CardContent>
                                </Card>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}