// src/pages/accident/AccidentInsurancePage.tsx

import {
    ChevronLeft,
    ShieldCheck,
    Users,
    UserRound,
    ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type AccidentPlan = {
    id: string;
    title: string;
    description: string;
    route: string;
    icon: "personal" | "group";
};

const accidentPlans: AccidentPlan[] = [
    {
        id: "personal-accident",
        title: "Personal Accident Insurance",
        description:
            "Individual accident coverage for death, disability, medical support, and personal protection.",
        route: "/accident-insurance/personal",
        icon: "personal",
    },
    {
        id: "group-personal-accident",
        title: "Group Personal Accident",
        description:
            "Accident protection for employees, members, or groups under one policy with flexible coverage.",
        route: "/accident-insurance/group-personal",
        icon: "group",
    },
];

export default function AccidentInsurancePage() {
    const navigate = useNavigate();

    const handlePlanClick = (plan: AccidentPlan) => {
        localStorage.setItem("accident.selectedPlan", JSON.stringify(plan));
        localStorage.setItem("accident.planId", plan.id);
        navigate(plan.route);
    };

    const renderIcon = (icon: AccidentPlan["icon"]) => {
        if (icon === "group") {
            return <Users className="h-8 w-8 text-primary" />;
        }

        return <UserRound className="h-8 w-8 text-primary" />;
    };

    return (
        <div className="min-h-screen">
            <div className="mx-auto max-w-6xl mt-8">
                <div className="mb-8 flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => navigate("/")}
                        className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100"
                    >
                        <ChevronLeft className="h-5 w-5 text-black" />
                    </button>

                    <div>
                        <h1 className="text-2xl font-bold text-black">
                            Accident Insurance
                        </h1>

                        <p className="mt-1 text-sm text-muted-foreground">
                            Select accident insurance plan and continue.
                        </p>
                    </div>
                </div>

                <div className="mb-6  ">
                    <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                            <ShieldCheck className="h-6 w-6 text-primary" />
                        </div>

                        <div>
                            <h2 className="text-lg font-semibold text-black">
                                Choose Accident Insurance Type
                            </h2>

                            <p className="mt-1 text-sm text-muted-foreground">
                                Continue with a personal accident policy for one
                                person, or choose group personal accident for
                                multiple members.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {accidentPlans.map((plan) => (
                        <Card
                            key={plan.id}
                            onClick={() => handlePlanClick(plan)}
                            className="group cursor-pointer border-2 transition-all hover:border-primary hover:shadow-lg"
                        >
                            <CardContent className="p-8">
                                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 transition-all group-hover:bg-primary/15">
                                    {renderIcon(plan.icon)}
                                </div>

                                
                                <h2 className="text-xl font-bold text-black">
                                    {plan.title}
                                </h2>

                                <p className="mt-3 min-h-[48px] text-sm leading-6 text-muted-foreground">
                                    {plan.description}
                                </p>

                                
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}