// CommercialVehicle/thirdparty/pages/TgoodsCarryingPage.tsx

import { useState } from "react";
import { ChevronLeft, Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
    getMotorPremiumCV,
    type GetPremiumRequestCV,
} from "@/api/motor/getpremium";

import { GetPremiumResponse, PremiumAmountInfo } from "@/types/getpremium";
import { toast } from "@/components/ui/sonner";
import { string } from "zod";

type RowType = "section" | "less" | "subtotal" | "total" | "normal";

type PremiumRow = {
    key: string;
    label: string;
    value?: number | string | null;
    type?: RowType;
};

const fmt = (value: number | string | null | undefined) => {
    const num = Number(value ?? 0);

    if (!Number.isFinite(num)) return "—";

    return num.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

const toNumber = (value: number | string | null | undefined) => {
    const num = Number(value ?? 0);
    return Number.isFinite(num) ? num : 0;
};

const getValue = (
    obj: Record<string, unknown> | null | undefined,
    keys: string[],
    fallback: number | string = 0
): number | string => {
    if (!obj) return fallback;

    for (const key of keys) {
        const value = obj[key];

        if (value !== undefined && value !== null && value !== "") {
            if (typeof value === "string" || typeof value === "number") {
                return value;
            }
        }
    }

    return fallback;
};

export default function TgoodsCarryingPage() {
    const navigate = useNavigate();

    const [step, setStep] = useState<1 | 2>(1);

    const [carryingCapacity, setCarryingCapacity] = useState("");
    const [noOfSeats, setNoOfSeats] = useState("2");

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [inlineError, setInlineError] = useState<string | null>(null);
    const [premiumData, setPremiumData] = useState<GetPremiumResponse | null>(null);

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!carryingCapacity.trim()) {
            newErrors.carryingCapacity = "Carrying capacity in ton is required";
        } else if (
            !/^\d+(\.\d+)?$/.test(carryingCapacity) ||
            Number(carryingCapacity) <= 0
        ) {
            newErrors.carryingCapacity = "Enter valid carrying capacity";
        }

        if (!noOfSeats.trim()) {
            newErrors.noOfSeats = "No of seats including driver is required";
        } else if (!/^\d+$/.test(noOfSeats) || Number(noOfSeats) <= 0) {
            newErrors.noOfSeats = "Enter valid seat number";
        }

        return newErrors;
    };

    const handleCalculate = async () => {
        setInlineError(null);

        const validationErrors = validate();
        setErrors(validationErrors);

        if (Object.keys(validationErrors).length > 0) {
            toast.error("Please fill all required fields");
            return;
        }

        const passengerSeatCapacity = Math.max(0, Number(noOfSeats) - 1);

        const payload: GetPremiumRequestCV = {
            class_id: "3",
            cover_type_id: "Third Party",
            is_government: "1",
            engine_capcity_cc: "12",
            driver_seat_capacity: "1",
            passenger_seat_capacity: String(passengerSeatCapacity),
            good_carrying_capacity: String(carryingCapacity),
            conductor_helper_seat_capacity: "0",
            compulsory_excess: "0",
            voluntary_excess: "0",
            vehicle_age_in_years: "0",
            vehicle_suminsured_amount: "0",
            calc_type: "p",
            noclaim_year: "0",
            is_tailor: "false",
            get_direct_discount: "n",
            vehicle_reg: "e",
            include_towing_charge: "false",
            include_personal_use_discount: "false",
        };

        try {
            setLoading(true);

            localStorage.setItem("motor.vehicleType", "commercial");
            localStorage.setItem("motor.insurancePlan", "third-party");

            localStorage.setItem(
                "motor.selectedCommercialCategory",
                JSON.stringify({
                    data: "3",
                    value: "Commercial Vehicle Normal Good Carrying Policy",
                    additional_value: "CV",
                    title: "Normal Goods Carrying",
                })
            );

            localStorage.setItem(
                "motor.thirdPartyNormalGoodsForm",
                JSON.stringify({
                    categoryId: "3",
                    categoryName: "Normal Goods Carrying",
                    good_carrying_capacity: Number(carryingCapacity),
                    noOfSeatsIncludingDriver: noOfSeats,
                    passengerSeatCapacity: String(passengerSeatCapacity),
                })
            );

            const response = await getMotorPremiumCV(payload);

            if (response?.process_result === false) {
                const msg =
                    response?.error_list?.[0]?.error_message ||
                    "Failed to calculate premium";

                setInlineError(msg);
                toast.error(msg);
                return;
            }

            setPremiumData(response);
            localStorage.setItem("motor.premiumResponse", JSON.stringify(response));
            setStep(2);
        } catch (error: any) {
            let msg = "Failed to calculate premium";

            try {
                msg =
                    JSON.parse(error?.message || "")?.error_list?.[0]
                        ?.error_message || msg;
            } catch {
                msg = error?.message || msg;
            }

            setInlineError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const amount: PremiumAmountInfo | undefined = premiumData?.amount_info;

    const thirdPartyPremium = getValue(amount as any, [
        "tpl_amount",
        "third_party_premium",
        "premium_amount",
    ]);

    const thirdPartyNcd = getValue(amount as any, [
        "tpl_no_claim_discount_amount",
        "third_party_no_claim_discount_amount",
        "third_party_ncd_amount",
        "no_claim_discount_amount",
    ]);

    const finalThirdPartyPremium =
        toNumber(thirdPartyPremium) - toNumber(thirdPartyNcd);

    const taxableAmount = getValue(amount as any, [
        "taxable_amount",
        "subtotal_amount",
    ]);

    const subTotal =
        toNumber(taxableAmount) > 0 ? taxableAmount : finalThirdPartyPremium;

    const vatPercent = getValue(amount as any, ["vat_percent"], 13);
    const vatAmount = getValue(amount as any, ["vat_amount"]);
    const stampDuty = getValue(amount as any, ["stamp_duty"]);

    const totalPremium = getValue(amount as any, [
        "total_amount",
        "total_premium",
        "payable_amount",
    ]);

    const premiumRows: PremiumRow[] = [
        {
            key: "section",
            label: "Third Party Premium Calculation",
            type: "section",
        },
        {
            key: "third_party_premium",
            label: "Basic Third Party Premium",
            value: thirdPartyPremium,
        },
        {
            key: "third_party_ncd",
            label: "Less : No Claim Discount",
            value: thirdPartyNcd,
            type: "less",
        },
        {
            key: "third_party_total",
            label: "Third Party Premium",
            value: finalThirdPartyPremium,
            type: "subtotal",
        },
        {
            key: "subtotal",
            label: "Sub Total",
            value: subTotal,
            type: "subtotal",
        },
        {
            key: "vat",
            label: `Add : VAT ${vatPercent}%`,
            value: vatAmount,
        },
        {
            key: "stamp",
            label: "Add : Stamp Duty",
            value: stampDuty,
        },
        {
            key: "total",
            label: "Total Premium",
            value: totalPremium,
            type: "total",
        },
    ];

    const getRowClass = (type?: RowType, index?: number) => {
        if (type === "section") return "bg-muted/70";
        if (type === "total") return "border-t-2 border-primary/30 bg-primary/10";
        if (type === "subtotal") return "bg-muted/30";
        return index && index % 2 === 0 ? "bg-background" : "bg-muted/10";
    };

    const getLabelClass = (type?: RowType) => {
        if (type === "section") return "font-bold text-foreground";
        if (type === "total") return "font-bold text-primary";
        if (type === "subtotal") return "font-semibold text-foreground";
        if (type === "less") return "text-red-600";
        return "text-muted-foreground";
    };

    const getValueClass = (type?: RowType) => {
        if (type === "section") return "font-bold text-foreground";
        if (type === "total") return "text-base font-bold text-primary";
        if (type === "subtotal") return "font-semibold text-foreground";
        if (type === "less") return "font-medium text-red-600";
        return "font-medium text-foreground";
    };

    if (step === 2 && premiumData) {
        return (
            <>
                <div className="mb-6 flex items-center gap-3">
                    <button
                        type="button"
                        className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100"
                        onClick={() => setStep(1)}
                    >
                        <ChevronLeft className="h-5 w-5 text-black" />
                    </button>

                    <div>
                        <h1 className="text-2xl font-bold text-black">
                            Normal Goods Carrying Premium Details
                        </h1>

                        <p className="mt-1 text-sm text-muted-foreground">
                            Third-party normal goods carrying insurance calculation detail.
                        </p>
                    </div>
                </div>

                <Card className="mb-6">
                    <CardContent className="pt-6">
                        <h2 className="mb-4 text-base font-semibold">
                            Selected Vehicle Details
                        </h2>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="rounded-lg border bg-muted/30 p-4">
                                <p className="text-xs text-muted-foreground">
                                    Carrying Capacity in Ton
                                </p>
                                <p className="mt-1 font-semibold">
                                    {carryingCapacity}
                                </p>
                            </div>

                            <div className="rounded-lg border bg-muted/30 p-4">
                                <p className="text-xs text-muted-foreground">
                                    No of Seats Including Driver
                                </p>
                                <p className="mt-1 font-semibold">
                                    {noOfSeats}
                                </p>
                            </div>

                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="overflow-hidden rounded-lg border">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-primary text-primary-foreground">
                                        <th className="px-5 py-3 text-left font-semibold">
                                            Description
                                        </th>

                                        <th className="px-5 py-3 text-right font-semibold">
                                            Amount (NPR)
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {premiumRows.map((row, index) => (
                                        <tr
                                            key={row.key}
                                            className={getRowClass(row.type, index)}
                                        >
                                            <td
                                                className={`px-5 py-3 ${getLabelClass(
                                                    row.type
                                                )}`}
                                            >
                                                {row.label}
                                            </td>

                                            <td
                                                className={`px-5 py-3 text-right ${getValueClass(
                                                    row.type
                                                )}`}
                                            >
                                                {row.type === "section"
                                                    ? ""
                                                    : fmt(row.value)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                <div className="mt-6 flex gap-3">
                    <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => setStep(1)}
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>

                    <Button
                        onClick={() =>
                            navigate("/motor/commercial-vehicle/third-party")
                        }
                    >
                        Change Category
                    </Button>
                </div>
            </>
        );
    }

    return (
        <>
            <div className="mb-8 flex items-center gap-3">
                <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100"
                    onClick={() => navigate("/motor/commercial-vehicle/third-party")}
                >
                    <ChevronLeft className="h-5 w-5 text-black" />
                </button>

                <div>
                    <h1 className="text-2xl font-bold text-black">
                        Normal Goods Carrying Policy
                    </h1>

                    <p className="mt-1 text-sm text-muted-foreground">
                        Third-party normal goods carrying vehicle insurance form.
                    </p>
                </div>
            </div>

            <Card className="max-w-6xl">
                <CardContent className="space-y-5 pt-6">
                        <h2 className="text-base font-semibold text-blue-800">
                            Third Party Normal Goods Carrying Insurance
                        </h2>
                    <div className="grid gap-5 md:grid-cols-2">
                        <div>
                            <Label htmlFor="carryingCapacity">
                                Carrying Capacity in Ton *
                            </Label>

                            <Input
                                id="carryingCapacity"
                                type="text"
                                inputMode="decimal"
                                placeholder="Enter carrying capacity, e.g. 5"
                                className={`mt-2 ${
                                    errors.carryingCapacity ? "border-red-500" : ""
                                }`}
                                value={carryingCapacity}
                                onChange={(e) => {
                                    const value = e.target.value;

                                    if (value === "" || /^\d*\.?\d*$/.test(value)) {
                                        setCarryingCapacity(value);
                                        setErrors((prev) => ({
                                            ...prev,
                                            carryingCapacity: "",
                                        }));
                                    }
                                }}
                            />

                            {errors.carryingCapacity && (
                                <p className="mt-1 text-xs text-red-600">
                                    {errors.carryingCapacity}
                                </p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="noOfSeats">
                                No of Seats Including Driver *
                            </Label>

                            <Input
                                id="noOfSeats"
                                type="text"
                                inputMode="numeric"
                                placeholder="Enter no of seats including driver"
                                className={`mt-2 ${
                                    errors.noOfSeats ? "border-red-500" : ""
                                }`}
                                value={noOfSeats}
                                onChange={(e) => {
                                    const value = e.target.value;

                                    if (value === "" || /^\d+$/.test(value)) {
                                        setNoOfSeats(value);
                                        setErrors((prev) => ({
                                            ...prev,
                                            noOfSeats: "",
                                        }));
                                    }
                                }}
                            />

                            {errors.noOfSeats && (
                                <p className="mt-1 text-xs text-red-600">
                                    {errors.noOfSeats}
                                </p>
                            )}
                        </div>
                    </div>

                    
                    <div className="flex justify-between pt-2">
                        <Button
                            variant="outline"
                            className="gap-2"
                            onClick={() =>
                                navigate("/motor/commercial-vehicle/third-party")
                            }
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </Button>

                        <Button
                            size="lg"
                            className="px-8"
                            disabled={loading}
                            onClick={handleCalculate}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Calculating...
                                </>
                            ) : (
                                "Calculate"
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </>
    );
}