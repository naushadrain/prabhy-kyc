// CommercialVehicle/comprehensive/pages/CtaxiPage.tsx

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, Loader2, AlertCircle, ArrowLeft } from "lucide-react";
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
import { getVehicleAgeBands } from "@/api/motor/getMotorCatalogue";
import { GetPremiumResponse, PremiumAmountInfo } from "@/types/getpremium";
import { toast } from "@/components/ui/sonner";
import { Switch } from "@/components/ui/switch";

type CcOption = {
    label: string;
    value: string;
    apiValue: string;
};

type RowType = "normal" | "section" | "less" | "subtotal" | "total";

type PremiumRow = {
    key: string;
    label: string;
    value?: number | string | null;
    type?: RowType;
};

const vehicleCcOptions: CcOption[] = [
    {
        label: "Less than 1000 CC",
        value: "less_than_1000",
        apiValue: "900",
    },
    {
        label: "1000 CC to 1600 CC",
        value: "1000_to_1600",
        apiValue: "1300",
    },
    {
        label: "Above 1600 CC",
        value: "above_1600",
        apiValue: "1700",
    },
];

const voluntaryExcessOptions = [
    { label: "1,000", value: "1000" },
    { label: "2,000", value: "2000" },
    { label: "5,000", value: "5000" },
    { label: "10,000", value: "10000" },
];

const noClaimYearOptions = [
    { label: "0 Year", value: "0" },
    { label: "1 Year", value: "1" },
    { label: "2 Years", value: "2" },
    { label: "3 Years", value: "3" },
    { label: "4 Years", value: "4" },
    { label: "5 Years", value: "5" },
];

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

export default function CtaxiPage() {
    const navigate = useNavigate();

    const [step, setStep] = useState<1 | 2>(1);

    const [vehicleCc, setVehicleCc] = useState("");
    const [noOfSeats, setNoOfSeats] = useState("5");

    const [yearOfManufacture, setYearOfManufacture] = useState("");
    const [vehicleCost, setVehicleCost] = useState("");

    const [compulsoryExcess, setCompulsoryExcess] = useState("500");
    const [compulsoryLoading, setCompulsoryLoading] = useState(false);

    const [voluntaryExcess, setVoluntaryExcess] = useState("");
    const [noClaimYear, setNoClaimYear] = useState("0");

    const [rsdTerrorismRisk, setRsdTerrorismRisk] = useState("no");
    const [towingCharge, setTowingCharge] = useState("no");
    const [directDiscount, setDirectDiscount] = useState("yes");

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [inlineError, setInlineError] = useState<string | null>(null);
    const [premiumData, setPremiumData] = useState<GetPremiumResponse | null>(null);

    const selectedCcOption = useMemo(() => {
        return vehicleCcOptions.find((item) => item.value === vehicleCc);
    }, [vehicleCc]);

    const yearOptions = useMemo(() => {
        const currentYear = new Date().getFullYear();
        const years: string[] = [];

        for (let year = currentYear; year >= 1985; year--) {
            years.push(String(year));
        }

        return years;
    }, []);

    const clearError = (name: string) => {
        setErrors((prev) => ({
            ...prev,
            [name]: "",
        }));
    };

    useEffect(() => {
        if (!yearOfManufacture) {
            setCompulsoryExcess("500");
            return;
        }

        const currentYear = new Date().getFullYear();
        const vehicleAge = currentYear - Number(yearOfManufacture);

        if (!Number.isFinite(vehicleAge) || vehicleAge < 0) {
            setCompulsoryExcess("500");
            return;
        }

        let cancelled = false;

        setCompulsoryLoading(true);

        getVehicleAgeBands("02", String(vehicleAge))
            .then((list) => {
                if (cancelled) return;

                const first = list?.[0];

                const amount =
                    first?.additional_value ||
                    first?.data ||
                    first?.value ||
                    "500";

                setCompulsoryExcess(String(amount));
                clearError("compulsoryExcess");
            })
            .catch((error) => {
                if (cancelled) return;

                setCompulsoryExcess("500");
                toast.error(error?.message || "Failed to load compulsory excess");
            })
            .finally(() => {
                if (!cancelled) {
                    setCompulsoryLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [yearOfManufacture]);

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!vehicleCc) {
            newErrors.vehicleCc = "Vehicle CC is required";
        }

        if (!noOfSeats.trim()) {
            newErrors.noOfSeats = "No of seats including driver is required";
        } else if (!/^\d+$/.test(noOfSeats) || Number(noOfSeats) <= 0) {
            newErrors.noOfSeats = "Enter valid no of seats";
        }

        if (!yearOfManufacture) {
            newErrors.yearOfManufacture = "Year of manufacture is required";
        }

        if (!vehicleCost.trim()) {
            newErrors.vehicleCost = "Vehicle cost is required";
        } else if (!/^\d+$/.test(vehicleCost) || Number(vehicleCost) <= 0) {
            newErrors.vehicleCost = "Enter valid vehicle cost";
        }

        if (!compulsoryExcess.trim()) {
            newErrors.compulsoryExcess = "Compulsory excess is required";
        } else if (
            !/^\d+(\.\d+)?$/.test(compulsoryExcess) ||
            Number(compulsoryExcess) < 0
        ) {
            newErrors.compulsoryExcess = "Enter valid compulsory excess";
        }

        if (!voluntaryExcess) {
            newErrors.voluntaryExcess = "Voluntary excess is required";
        }

        if (!noClaimYear) {
            newErrors.noClaimYear = "No claim year is required";
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

        const currentYear = new Date().getFullYear();
        const vehicleAge = currentYear - Number(yearOfManufacture);
        const passengerSeatCapacity = Math.max(0, Number(noOfSeats) - 1);
        const ccApiValue = selectedCcOption?.apiValue || "0";

        const payload: GetPremiumRequestCV = {
            class_id: "6",
            cover_type_id: "Comprehensive",
            is_government: "1",
            good_carrying_capacity: null,
            engine_capcity_cc: ccApiValue,
            driver_seat_capacity: "1",
            passenger_seat_capacity: String(passengerSeatCapacity),
            conductor_helper_seat_capacity: "0",
            compulsory_excess: compulsoryExcess,
            voluntary_excess: voluntaryExcess,
            vehicle_age_in_years: String(vehicleAge),
            vehicle_suminsured_amount: vehicleCost,
            calc_type: "p",
            noclaim_year: noClaimYear,
            is_tailor: "false",
            get_direct_discount: directDiscount === "yes" ? "y" : "n",
            vehicle_reg: "e",
            include_towing_charge: towingCharge === "yes" ? "true" : "false",
        };

        try {
            setLoading(true);

            localStorage.setItem("motor.vehicleType", "commercial");
            localStorage.setItem("motor.insurancePlan", "comprehensive");

            localStorage.setItem(
                "motor.selectedCommercialCategory",
                JSON.stringify({
                    data: "6",
                    value: "Taxi Policy",
                    additional_value: "CV",
                    title: "Taxi Policy",
                })
            );

            localStorage.setItem(
                "motor.comprehensiveTaxiForm",
                JSON.stringify({
                    categoryId: "6",
                    categoryName: "Taxi Policy",
                    vehicleCc,
                    vehicleCcLabel: selectedCcOption?.label || "",
                    engine_capcity_cc: ccApiValue,
                    noOfSeatsIncludingDriver: noOfSeats,
                    passengerSeatCapacity: String(passengerSeatCapacity),
                    yearOfManufacture,
                    vehicleAge,
                    vehicleCost,
                    compulsoryExcess,
                    voluntaryExcess,
                    noClaimYear,
                    towingCharge,
                    directDiscount,
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

    const ownDamagePremium = getValue(amount as any, [
        "premium_amount",
        "own_damage_premium",
        "od_premium",
    ]);

    const oldVehicleCharge = getValue(amount as any, ["old_vehicle_charge"]);

    const voluntaryExcessAmount = getValue(amount as any, [
        "voluntary_excess_amount",
        "voluntary_excess_discount",
    ]);

    const noClaimDiscount = getValue(amount as any, [
        "no_claim_discount_amount",
        "ncd_amount",
    ]);

    const directDiscountAmount = getValue(premiumData as any, [
        "direct_discount_amount",
    ]);

    const basicPremiumFromApi = getValue(amount as any, ["basic_premium"]);

    const basicPremium =
        toNumber(basicPremiumFromApi) > 0
            ? basicPremiumFromApi
            : toNumber(ownDamagePremium) +
            toNumber(oldVehicleCharge) -
            toNumber(voluntaryExcessAmount) -
            toNumber(noClaimDiscount) -
            toNumber(directDiscountAmount);

    const thirdPartyPremium = getValue(amount as any, [
        "tpl_amount",
        "third_party_premium",
    ]);

    const thirdPartyNcd = getValue(amount as any, [
        "tpl_no_claim_discount_amount",
        "third_party_no_claim_discount_amount",
        "third_party_ncd_amount",
    ]);

    const finalThirdPartyPremium =
        toNumber(thirdPartyPremium) - toNumber(thirdPartyNcd);
    const rsdPassenger = getValue(amount as any, [
        "rsd_passenger_amount",
        "rsd_passenger",
    ]);

    const poolPremiumFromApi = getValue(amount as any, ["pool_amount"]);
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
            key: "premium",
            label: "Premium",
            value: ownDamagePremium,
        },
        {
            key: "old_vehicle_charge",
            label: "Add : Old Vehicle Charge",
            value: oldVehicleCharge,
        },
        {
            key: "subtotal_1",
            label: "Sub Total",
            value: toNumber(ownDamagePremium) + toNumber(oldVehicleCharge),
            type: "subtotal",
        },
        {
            key: "voluntary_excess",
            label: "Less : Voluntary Excess",
            value: voluntaryExcessAmount,
            type: "less",
        },
        {
            key: "subtotal_2",
            label: "Sub Total",
            value:
                toNumber(ownDamagePremium) +
                toNumber(oldVehicleCharge) -
                toNumber(voluntaryExcessAmount),
            type: "subtotal",
        },
        {
            key: "no_claim_discount",
            label: "Less : No Claim Discount",
            value: noClaimDiscount,
            type: "less",
        },
        {
            key: "subtotal_3",
            label: "Sub Total",
            value:
                toNumber(ownDamagePremium) +
                toNumber(oldVehicleCharge) -
                toNumber(voluntaryExcessAmount) -
                toNumber(noClaimDiscount),
            type: "subtotal",
        },
        {
            key: "direct_discount",
            label: "Less : Direct Discount",
            value: directDiscountAmount,
            type: "less",
        },
        {
            key: "basic_premium",
            label: "Basic Premium",
            value: basicPremium,
            type: "subtotal",
        },
        {
            key: "third_party_section",
            label: "Third Party Premium Calculation",
            type: "section",
        },
        {
            key: "third_party_premium",
            label: "Basic Third Party Premium as per CC",
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
            label: "Third Party Premium(B)",
            value: finalThirdPartyPremium,
            type: "subtotal",
        },
        {
            key: "pool_section",
            label: "Pool Premium Calculation",
            type: "section",
        },
        {
            key: "rsd_passenger",
            label: "Add : RSD Passenger",
            value: rsdPassenger,
        },
        
        {
            key: "final_section",
            label: "Final Premium Calculation",
            type: "section",
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
                            Comprehensive Taxi Premium Details
                        </h1>

                        <p className="mt-1 text-sm text-muted-foreground">
                            Comprehensive taxi insurance calculation detail.
                        </p>
                    </div>
                </div>
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
                            navigate("/motor/commercial-vehicle/comprehensive")
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
                        navigate("/motor/commercial-vehicle/comprehensive")
                    }
                >
                    <ChevronLeft className="h-5 w-5 text-black" />
                </button>

                <div>
                    <h1 className="text-2xl font-bold text-black">
                        Comprehensive Taxi Policy
                    </h1>

                    <p className="mt-1 text-sm text-muted-foreground">
                        Fill taxi details to calculate comprehensive premium.
                    </p>
                </div>
            </div>

            <Card className="max-w-5xl">
                <CardContent className="space-y-5 pt-6">
                    <div className="grid gap-5 md:grid-cols-2">
                        <div>
                            <Label htmlFor="vehicleCc">Vehicle CC *</Label>

                            <Select
                                value={vehicleCc}
                                onValueChange={(value) => {
                                    setVehicleCc(value);
                                    clearError("vehicleCc");
                                }}
                            >
                                <SelectTrigger
                                    id="vehicleCc"
                                    className={`mt-2 ${errors.vehicleCc ? "border-red-500" : ""
                                        }`}
                                >
                                    <SelectValue placeholder="Select Vehicle CC" />
                                </SelectTrigger>

                                <SelectContent>
                                    {vehicleCcOptions.map((item) => (
                                        <SelectItem
                                            key={item.value}
                                            value={item.value}
                                        >
                                            {item.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {errors.vehicleCc && (
                                <p className="mt-1 text-xs text-red-600">
                                    {errors.vehicleCc}
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
                                className={`mt-2 ${errors.noOfSeats ? "border-red-500" : ""
                                    }`}
                                value={noOfSeats}
                                onChange={(e) => {
                                    const value = e.target.value;

                                    if (value === "" || /^\d+$/.test(value)) {
                                        setNoOfSeats(value);
                                        clearError("noOfSeats");
                                    }
                                }}
                            />

                            {errors.noOfSeats && (
                                <p className="mt-1 text-xs text-red-600">
                                    {errors.noOfSeats}
                                </p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="yearOfManufacture">
                                Year of Manufacture *
                            </Label>

                            <Select
                                value={yearOfManufacture}
                                onValueChange={(value) => {
                                    setYearOfManufacture(value);
                                    clearError("yearOfManufacture");
                                }}
                            >
                                <SelectTrigger
                                    id="yearOfManufacture"
                                    className={`mt-2 ${errors.yearOfManufacture
                                        ? "border-red-500"
                                        : ""
                                        }`}
                                >
                                    <SelectValue placeholder="Select Year" />
                                </SelectTrigger>

                                <SelectContent>
                                    {yearOptions.map((year) => (
                                        <SelectItem key={year} value={year}>
                                            {year}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {errors.yearOfManufacture && (
                                <p className="mt-1 text-xs text-red-600">
                                    {errors.yearOfManufacture}
                                </p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="vehicleCost">Vehicle Cost *</Label>

                            <Input
                                id="vehicleCost"
                                type="text"
                                inputMode="numeric"
                                placeholder="Enter vehicle cost"
                                className={`mt-2 ${errors.vehicleCost ? "border-red-500" : ""
                                    }`}
                                value={vehicleCost}
                                onChange={(e) => {
                                    const value = e.target.value;

                                    if (value === "" || /^\d+$/.test(value)) {
                                        setVehicleCost(value);
                                        clearError("vehicleCost");
                                    }
                                }}
                            />

                            {errors.vehicleCost && (
                                <p className="mt-1 text-xs text-red-600">
                                    {errors.vehicleCost}
                                </p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="compulsoryExcess">
                                Compulsory Excess *
                            </Label>

                            <Input
                                id="compulsoryExcess"
                                type="number"
                                className={`mt-2 cursor-not-allowed bg-muted ${errors.compulsoryExcess
                                    ? "border-red-500"
                                    : ""
                                    }`}
                                value={
                                    compulsoryLoading
                                        ? "Loading..."
                                        : compulsoryExcess
                                }
                                disabled
                                readOnly
                            />



                            {errors.compulsoryExcess && (
                                <p className="mt-1 text-xs text-red-600">
                                    {errors.compulsoryExcess}
                                </p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="voluntaryExcess">
                                Voluntary Excess *
                            </Label>

                            <Select
                                value={voluntaryExcess}
                                onValueChange={(value) => {
                                    setVoluntaryExcess(value);
                                    clearError("voluntaryExcess");
                                }}
                            >
                                <SelectTrigger
                                    id="voluntaryExcess"
                                    className={`mt-2 ${errors.voluntaryExcess
                                        ? "border-red-500"
                                        : ""
                                        }`}
                                >
                                    <SelectValue placeholder="Select Voluntary Excess" />
                                </SelectTrigger>

                                <SelectContent>
                                    {voluntaryExcessOptions.map((item) => (
                                        <SelectItem
                                            key={item.value}
                                            value={item.value}
                                        >
                                            {item.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {errors.voluntaryExcess && (
                                <p className="mt-1 text-xs text-red-600">
                                    {errors.voluntaryExcess}
                                </p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="noClaimYear">
                                Claim Discount Year *
                            </Label>

                            <Select
                                value={noClaimYear}
                                onValueChange={(value) => {
                                    setNoClaimYear(value);
                                    clearError("noClaimYear");
                                }}
                            >
                                <SelectTrigger
                                    id="noClaimYear"
                                    className={`mt-2 ${errors.noClaimYear
                                        ? "border-red-500"
                                        : ""
                                        }`}
                                >
                                    <SelectValue placeholder="Select Claim Year" />
                                </SelectTrigger>

                                <SelectContent>
                                    {noClaimYearOptions.map((item) => (
                                        <SelectItem
                                            key={item.value}
                                            value={item.value}
                                        >
                                            {item.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {errors.noClaimYear && (
                                <p className="mt-1 text-xs text-red-600">
                                    {errors.noClaimYear}
                                </p>
                            )}
                        </div>
                        <div>
                            <Label htmlFor="towingCharge">Towing Charge</Label>

                            <Select
                                value={towingCharge}
                                onValueChange={setTowingCharge}
                            >
                                <SelectTrigger id="towingCharge" className="mt-2">
                                    <SelectValue />
                                </SelectTrigger>

                                <SelectContent>
                                    <SelectItem value="yes">Yes</SelectItem>
                                    <SelectItem value="no">No</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 pt-2">
                            <div className="flex items-center gap-3">
                                <Switch
                                    id="directDiscount"
                                    checked={true}
                                    disabled
                                />
                                <Label
                                    htmlFor="directDiscount"
                                    className="cursor-not-allowed text-muted-foreground"
                                >
                                    Direct discount
                                </Label>
                            </div>
                        </div>
                    </div>

                    
                    <div className="flex justify-between pt-2">
                        <Button
                            variant="outline"
                            className="gap-2"
                            onClick={() =>
                                navigate("/motor/commercial-vehicle/comprehensive")
                            }
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </Button>

                        <Button
                            size="lg"
                            className="px-8"
                            disabled={loading || compulsoryLoading}
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