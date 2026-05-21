// CommercialVehicle/thirdparty/pages/TTractorPowerTrailerPage.tsx

import { useState } from "react";
import {
    AlertCircle,
    ArrowLeft,
    ChevronLeft,
    Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import {
    getMotorPremiumCV,
    type GetPremiumRequestCV,
} from "@/api/motor/getpremium";

import { GetPremiumResponse, PremiumAmountInfo } from "@/types/getpremium";
import { toast } from "@/components/ui/sonner";

type RowType = "normal" | "section" | "subtotal" | "total";

type PremiumRow = {
    key: string;
    label: string;
    value?: number | string | null;
    type?: RowType;
};

const yesNoOptions = [
    { label: "Yes", value: "yes" },
    { label: "No", value: "no" },
];

const fmt = (value: number | string | null | undefined) => {
    const cleanValue = String(value ?? "0").replace(/,/g, "");
    const num = Number(cleanValue);

    if (!Number.isFinite(num)) return "0.00";

    return num.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

const toNumber = (value: number | string | null | undefined) => {
    const cleanValue = String(value ?? "0").replace(/,/g, "");
    const num = Number(cleanValue);

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

export default function TTractorPowerTrailerPage() {
    const navigate = useNavigate();

    const [step, setStep] = useState<1 | 2>(1);

    // Only two visible input fields
    const [driverSeatNo, setDriverSeatNo] = useState("");
    const [helper, setHelper] = useState("");

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [inlineError, setInlineError] = useState<string | null>(null);
    const [premiumData, setPremiumData] = useState<GetPremiumResponse | null>(
        null
    );

    const clearError = (name: string) => {
        setErrors((prev) => ({
            ...prev,
            [name]: "",
        }));
    };

    const handleDriverSeatChange = (value: string) => {
        if (value === "" || /^\d+$/.test(value)) {
            setDriverSeatNo(value);
            clearError("driverSeatNo");
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!driverSeatNo.trim()) {
            newErrors.driverSeatNo = "Driver seat no is required";
        } else if (!/^\d+$/.test(driverSeatNo) || Number(driverSeatNo) <= 0) {
            newErrors.driverSeatNo = "Enter valid driver seat no";
        }

        if (!helper) {
            newErrors.helper = "Helper is required";
        }

        return newErrors;
    };

    const buildPayload = (): GetPremiumRequestCV => {
        const helperSeatCapacity = helper === "yes" ? "1" : "0";

        return {
            class_id: "11",
            cover_type_id: "Third Party",
            is_government: "1",

            // Hidden API fields
            good_carrying_capacity: "0",
            engine_capcity_cc: "12",

            // Visible input value sends here
            driver_seat_capacity: driverSeatNo,

            // Hidden default values
            passenger_seat_capacity: "1",
            conductor_helper_seat_capacity: helperSeatCapacity,

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
            include_rsd_charge: "false",
        } as any;
    };

    const handleCalculate = async () => {
        setInlineError(null);

        const validationErrors = validate();
        setErrors(validationErrors);

        if (Object.keys(validationErrors).length > 0) {
            toast.error("Please fill all required fields");
            return;
        }

        const payload = buildPayload();
        const helperSeatCapacity = helper === "yes" ? "1" : "0";

        try {
            setLoading(true);

            localStorage.setItem("motor.vehicleType", "commercial");
            localStorage.setItem("motor.insurancePlan", "third-party");

            localStorage.setItem(
                "motor.selectedCommercialCategory",
                JSON.stringify({
                    data: "11",
                    value: "Tractor & Power Trailer Policy",
                    additional_value: "CV",
                    title: "Tractor & Power Trailer Policy",
                })
            );

            localStorage.setItem(
                "motor.thirdPartyTractorPowerTrailerForm",
                JSON.stringify({
                    categoryId: "11",
                    categoryName: "Tractor & Power Trailer Policy",

                    driverSeatNo,
                    driverSeatCapacity: driverSeatNo,

                    helper,
                    helperSeatCapacity,

                    passengerSeatCapacity: "0",

                    payload,
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

            localStorage.setItem(
                "motor.premiumResponse",
                JSON.stringify(response)
            );

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

    const rsd = getValue(amount as any, ["rsd_amount", "rsd"]);

    const rsdRider = getValue(amount as any, [
        "rsd_rider_amount",
        "rsd_rider",
    ]);

    const rsdPassenger = getValue(amount as any, [
        "rsd_passenger_amount",
        "rsd_passenger",
    ]);

    const poolPremiumFromApi = getValue(amount as any, ["pool_amount"]);

    const poolPremium =
        toNumber(poolPremiumFromApi) > 0
            ? poolPremiumFromApi
            : toNumber(rsd) + toNumber(rsdRider) + toNumber(rsdPassenger);

    const taxableAmount = getValue(amount as any, [
        "taxable_amount",
        "subtotal_amount",
    ]);

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
            key: "third_party_section",
            label: "Third Party Premium Calculation",
            type: "section",
        },
        {
            key: "third_party_premium",
            label: "Third Party Premium",
            value: thirdPartyPremium,
        },
        {
            key: "pool_section",
            label: "Pool Premium Calculation",
            type: "section",
        },
        {
            key: "rsd",
            label: "Add : RSD",
            value: rsd,
        },
        {
            key: "rsd_rider",
            label: "Add : RSD Rider",
            value: rsdRider,
        },
        {
            key: "rsd_passenger",
            label: "Add : RSD Passenger",
            value: rsdPassenger,
        },
        {
            key: "pool_premium",
            label: "Pool Premium",
            value: poolPremium,
            type: "subtotal",
        },
        {
            key: "final_section",
            label: "Final Premium Calculation",
            type: "section",
        },
        {
            key: "taxable",
            label: "Taxable Amount",
            value: taxableAmount,
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

        return "text-muted-foreground";
    };

    const getValueClass = (type?: RowType) => {
        if (type === "section") return "font-bold text-foreground";
        if (type === "total") return "text-base font-bold text-primary";
        if (type === "subtotal") return "font-semibold text-foreground";

        return "font-medium text-foreground";
    };

    const helperSeatCapacity = helper === "yes" ? "1" : "0";

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
                            Tractor & Power Trailer Premium Details
                        </h1>

                        <p className="mt-1 text-sm text-muted-foreground">
                            Third-party premium calculation details.
                        </p>
                    </div>
                </div>

                <Card className="mb-6">
                    <CardContent className="pt-6">
                        <h2 className="mb-4 text-base font-semibold">
                            Selected Details
                        </h2>

                        <div className="grid gap-4 md:grid-cols-2">
                            <DetailCard
                                label="Driver Seat No"
                                value={driverSeatNo}
                            />

                            <DetailCard
                                label="Helper"
                                value={helper === "yes" ? "Yes" : "No"}
                            />

                            
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
                                            className={getRowClass(
                                                row.type,
                                                index
                                            )}
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
                    onClick={() =>
                        navigate("/motor/commercial-vehicle/third-party")
                    }
                >
                    <ChevronLeft className="h-5 w-5 text-black" />
                </button>

                <div>
                    <h1 className="text-2xl font-bold text-black">
                        Tractor & Power Trailer Third Party
                    </h1>

                    <p className="mt-1 text-sm text-muted-foreground">
                        Enter driver seat no and helper details to calculate
                        third-party premium.
                    </p>
                </div>
            </div>

            <Card className="max-w-5xl">
                <CardContent className="space-y-5 pt-6">
                    <div className="grid gap-5 md:grid-cols-2">
                        <div>
                            <Label htmlFor="driverSeatNo">
                                Driver Seat No *
                            </Label>

                            <Input
                                id="driverSeatNo"
                                type="text"
                                inputMode="numeric"
                                placeholder="Enter driver seat no"
                                value={driverSeatNo}
                                onChange={(event) =>
                                    handleDriverSeatChange(event.target.value)
                                }
                                className={`mt-2 ${
                                    errors.driverSeatNo ? "border-red-500" : ""
                                }`}
                            />

                            {errors.driverSeatNo && (
                                <p className="mt-1 text-xs text-red-600">
                                    {errors.driverSeatNo}
                                </p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="helper">Helper *</Label>

                            <Select
                                value={helper}
                                onValueChange={(value) => {
                                    setHelper(value);
                                    clearError("helper");
                                }}
                            >
                                <SelectTrigger
                                    id="helper"
                                    className={`mt-2 ${
                                        errors.helper ? "border-red-500" : ""
                                    }`}
                                >
                                    <SelectValue placeholder="Select helper" />
                                </SelectTrigger>

                                <SelectContent>
                                    {yesNoOptions.map((item) => (
                                        <SelectItem
                                            key={item.value}
                                            value={item.value}
                                        >
                                            {item.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {errors.helper && (
                                <p className="mt-1 text-xs text-red-600">
                                    {errors.helper}
                                </p>
                            )}
                        </div>
                    </div>

                   

                    {inlineError && (
                        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                            {inlineError}
                        </div>
                    )}

                    <div className="flex justify-between pt-2">
                        <Button
                            variant="outline"
                            className="gap-2"
                            onClick={() =>
                                navigate(
                                    "/motor/commercial-vehicle/third-party"
                                )
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

function DetailCard({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-lg border bg-muted/30 p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 font-semibold">{value}</p>
        </div>
    );
}