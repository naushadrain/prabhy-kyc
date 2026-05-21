// CommercialVehicle/comprehensive/pages/CNormalGoodsPage.tsx

import { useEffect, useState } from "react";
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
import { Switch } from "@/components/ui/switch";

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

type RowType = "normal" | "section" | "less" | "subtotal" | "total";

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

const normalizeIntAmount = (value: string | number | null | undefined) => {
    const cleanValue = String(value ?? "0").replace(/,/g, "");
    const numberValue = Number(cleanValue);

    if (!Number.isFinite(numberValue)) {
        return "0";
    }

    return String(Math.trunc(numberValue));
};

export default function CNormalGoodsPage() {
    const navigate = useNavigate();

    const [step, setStep] = useState<1 | 2>(1);

    const [goodCarryingCapacity, setGoodCarryingCapacity] = useState("");
    const [noOfSeats, setNoOfSeats] = useState("5");
    const [helper, setHelper] = useState("no");

    const [sumInsured, setSumInsured] = useState("");
    const [yearOfManufacture, setYearOfManufacture] = useState("");
    const [compulsoryExcess, setCompulsoryExcess] = useState("500");
    const [compulsoryLoading, setCompulsoryLoading] = useState(false);

    const [rsdTerrorismRisk, setRsdTerrorismRisk] = useState("no");
    const [voluntaryExcess, setVoluntaryExcess] = useState("");
    const [noClaimYear, setNoClaimYear] = useState("0");
    const [towingCharge, setTowingCharge] = useState("no");
    const [directDiscount, setDirectDiscount] = useState(true);

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [inlineError, setInlineError] = useState<string | null>(null);
    const [premiumData, setPremiumData] = useState<GetPremiumResponse | null>(
        null
    );

    const yearOptions = (() => {
        const currentYear = new Date().getFullYear();
        const years: string[] = [];

        for (let year = currentYear; year >= 1985; year--) {
            years.push(String(year));
        }

        return years;
    })();

    const clearError = (name: string) => {
        setErrors((prev) => ({
            ...prev,
            [name]: "",
        }));
    };

    const handleNumberInput = (
        value: string,
        setter: React.Dispatch<React.SetStateAction<string>>,
        errorKey: string
    ) => {
        if (value === "" || /^\d+$/.test(value)) {
            setter(value);
            clearError(errorKey);
        }
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

                setCompulsoryExcess(normalizeIntAmount(amount));
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

        if (!goodCarryingCapacity.trim()) {
            newErrors.goodCarryingCapacity =
                "Good carrying capacity is required";
        } else if (
            !/^\d+$/.test(goodCarryingCapacity) ||
            Number(goodCarryingCapacity) <= 0
        ) {
            newErrors.goodCarryingCapacity =
                "Enter valid good carrying capacity";
        }

        if (!noOfSeats.trim()) {
            newErrors.noOfSeats = "No of seats including driver is required";
        } else if (!/^\d+$/.test(noOfSeats) || Number(noOfSeats) <= 0) {
            newErrors.noOfSeats = "Enter valid no of seats";
        }

        if (!helper) {
            newErrors.helper = "Helper is required";
        }

        if (!sumInsured.trim()) {
            newErrors.sumInsured = "Sum insured is required";
        } else if (!/^\d+$/.test(sumInsured) || Number(sumInsured) <= 0) {
            newErrors.sumInsured = "Enter valid sum insured";
        }

        if (!yearOfManufacture) {
            newErrors.yearOfManufacture = "Year of manufacture is required";
        }

        if (!compulsoryExcess.trim()) {
            newErrors.compulsoryExcess = "Compulsory excess is required";
        } else if (
            !/^\d+(\.\d{1,2})?$/.test(compulsoryExcess) ||
            Number(compulsoryExcess) < 0
        ) {
            newErrors.compulsoryExcess = "Enter valid compulsory excess";
        }

        

        if (!voluntaryExcess) {
            newErrors.voluntaryExcess = "Voluntary excess is required";
        }

        if (!noClaimYear) {
            newErrors.noClaimYear = "No claim discount is required";
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

        const helperSeatCapacity = helper === "yes" ? "1" : "0";

        const passengerSeatCapacity = Math.max(
            0,
            Number(noOfSeats) - 1 - Number(helperSeatCapacity)
        );

        const payload: GetPremiumRequestCV = {
            class_id: "3",
            cover_type_id: "Comprehensive",
            is_government: "1",
            good_carrying_capacity: goodCarryingCapacity,
            engine_capcity_cc: "12",
            driver_seat_capacity: "1",
            passenger_seat_capacity: String(passengerSeatCapacity),
            conductor_helper_seat_capacity: helperSeatCapacity,
            compulsory_excess: compulsoryExcess,
            voluntary_excess: voluntaryExcess,
            vehicle_age_in_years: String(vehicleAge),
            vehicle_suminsured_amount: sumInsured,
            calc_type: "p",
            noclaim_year: noClaimYear,
            is_tailor: "false",
            get_direct_discount: directDiscount ? "y" : "n",
            vehicle_reg: "e",
            include_towing_charge: towingCharge === "yes" ? "true" : "false",
        } as any;

        try {
            setLoading(true);

            localStorage.setItem("motor.vehicleType", "commercial");
            localStorage.setItem("motor.insurancePlan", "comprehensive");

            localStorage.setItem(
                "motor.selectedCommercialCategory",
                JSON.stringify({
                    data: "3",
                    value: "Commercial Vehicle Normal Good Carrying Policy",
                    additional_value: "CV",
                    title: "Normal Goods Carrying Policy",
                })
            );

            localStorage.setItem(
                "motor.comprehensiveNormalGoodsForm",
                JSON.stringify({
                    categoryId: "3",
                    categoryName:
                        "Commercial Vehicle Normal Good Carrying Policy",
                    goodCarryingCapacity,
                    noOfSeatsIncludingDriver: noOfSeats,
                    driverSeatCapacity: "1",
                    passengerSeatCapacity: String(passengerSeatCapacity),
                    helper,
                    helperSeatCapacity,
                    sumInsured,
                    yearOfManufacture,
                    vehicleAge,
                    compulsoryExcess,
                    rsdTerrorismRisk,
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

    const poolPremium = getValue(amount as any, ["pool_amount"]);

    const taxableAmount = getValue(amount as any, [
        "taxable_amount",
        "subtotal_amount",
    ]);

    const subTotalABC =
        toNumber(taxableAmount) > 0
            ? taxableAmount
            : toNumber(basicPremium) +
              toNumber(thirdPartyPremium) +
              toNumber(poolPremium);

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
            key: "voluntary_excess",
            label: "Less : Voluntary Excess",
            value: voluntaryExcessAmount,
            type: "less",
        },
        {
            key: "no_claim_discount",
            label: "Less : No Claim Discount",
            value: noClaimDiscount,
            type: "less",
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
            label: "Third Party Premium",
            value: thirdPartyPremium,
        },
        {
            key: "pool_section",
            label: "Pool Premium Calculation",
            type: "section",
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
            key: "subtotal_abc",
            label: "Sub Total",
            value: subTotalABC,
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
                            Comprehensive Normal Goods Premium Details
                        </h1>

                        <p className="mt-1 text-sm text-muted-foreground">
                            Comprehensive premium calculation details.
                        </p>
                    </div>
                </div>

                <Card className="mb-6">
                    <CardContent className="pt-6">
                        <h2 className="mb-4 text-base font-semibold">
                            Selected Normal Goods Details
                        </h2>

                        <div className="grid gap-4 md:grid-cols-2">
                            <DetailCard
                                label="Good Carrying Capacity"
                                value={`${goodCarryingCapacity} Ton`}
                            />

                            <DetailCard
                                label="No of Seats Including Driver"
                                value={noOfSeats}
                            />

                            <DetailCard
                                label="Helper"
                                value={helper === "yes" ? "Yes" : "No"}
                            />

                            <DetailCard
                                label="Passenger Seat Capacity"
                                value={String(
                                    Math.max(
                                        0,
                                        Number(noOfSeats) -
                                            1 -
                                            (helper === "yes" ? 1 : 0)
                                    )
                                )}
                            />

                            <DetailCard
                                label="Sum Insured"
                                value={`NPR ${fmt(sumInsured)}`}
                            />

                            <DetailCard
                                label="Year of Manufacture"
                                value={yearOfManufacture}
                            />

                            <DetailCard
                                label="Compulsory Excess"
                                value={`NPR ${compulsoryExcess}`}
                            />

                        

                            <DetailCard
                                label="Voluntary Excess"
                                value={`NPR ${fmt(voluntaryExcess)}`}
                            />

                            <DetailCard
                                label="No Claim Discount"
                                value={`${noClaimYear} Year`}
                            />

                            <DetailCard
                                label="Towing Charge"
                                value={towingCharge === "yes" ? "Yes" : "No"}
                            />

                            <DetailCard
                                label="Direct Discount"
                                value={directDiscount ? "Yes" : "No"}
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
                        Comprehensive Normal Goods
                    </h1>

                    <p className="mt-1 text-sm text-muted-foreground">
                        Fill normal goods vehicle details to calculate
                        comprehensive premium.
                    </p>
                </div>
            </div>

            <Card className="max-w-5xl">
                <CardContent className="space-y-5 pt-6">
                    <div className="grid gap-5 md:grid-cols-2">
                        <div>
                            <Label htmlFor="goodCarryingCapacity">
                                Good Carrying Capacity in Ton *
                            </Label>

                            <Input
                                id="goodCarryingCapacity"
                                type="text"
                                inputMode="numeric"
                                placeholder="Enter good carrying capacity in ton"
                                value={goodCarryingCapacity}
                                onChange={(event) =>
                                    handleNumberInput(
                                        event.target.value,
                                        setGoodCarryingCapacity,
                                        "goodCarryingCapacity"
                                    )
                                }
                                className={`mt-2 ${
                                    errors.goodCarryingCapacity
                                        ? "border-red-500"
                                        : ""
                                }`}
                            />

                            {errors.goodCarryingCapacity && (
                                <p className="mt-1 text-xs text-red-600">
                                    {errors.goodCarryingCapacity}
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
                                value={noOfSeats}
                                onChange={(event) =>
                                    handleNumberInput(
                                        event.target.value,
                                        setNoOfSeats,
                                        "noOfSeats"
                                    )
                                }
                                className={`mt-2 ${
                                    errors.noOfSeats ? "border-red-500" : ""
                                }`}
                            />

                            {errors.noOfSeats && (
                                <p className="mt-1 text-xs text-red-600">
                                    {errors.noOfSeats}
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

                        <div>
                            <Label htmlFor="sumInsured">Sum Insured *</Label>

                            <Input
                                id="sumInsured"
                                type="text"
                                inputMode="numeric"
                                placeholder="Enter vehicle sum insured"
                                value={sumInsured}
                                onChange={(event) =>
                                    handleNumberInput(
                                        event.target.value,
                                        setSumInsured,
                                        "sumInsured"
                                    )
                                }
                                className={`mt-2 ${
                                    errors.sumInsured ? "border-red-500" : ""
                                }`}
                            />

                            {errors.sumInsured && (
                                <p className="mt-1 text-xs text-red-600">
                                    {errors.sumInsured}
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
                                    className={`mt-2 ${
                                        errors.yearOfManufacture
                                            ? "border-red-500"
                                            : ""
                                    }`}
                                >
                                    <SelectValue placeholder="Select year" />
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
                            <Label htmlFor="compulsoryExcess">
                                Compulsory Excess *
                            </Label>

                            <Input
                                id="compulsoryExcess"
                                type="text"
                                value={
                                    compulsoryLoading
                                        ? "Loading..."
                                        : compulsoryExcess
                                }
                                disabled
                                readOnly
                                className={`mt-2 cursor-not-allowed bg-muted ${
                                    errors.compulsoryExcess
                                        ? "border-red-500"
                                        : ""
                                }`}
                            />

                            <p className="mt-1 text-xs text-muted-foreground">
                                Auto calculated from year of manufacture.
                            </p>

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
                                    className={`mt-2 ${
                                        errors.voluntaryExcess
                                            ? "border-red-500"
                                            : ""
                                    }`}
                                >
                                    <SelectValue placeholder="Select voluntary excess" />
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
                                No Claim Discount *
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
                                    className={`mt-2 ${
                                        errors.noClaimYear
                                            ? "border-red-500"
                                            : ""
                                    }`}
                                >
                                    <SelectValue placeholder="Select no claim discount" />
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
                                <SelectTrigger
                                    id="towingCharge"
                                    className="mt-2"
                                >
                                    <SelectValue placeholder="Select towing charge" />
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
                        </div>

                        <div className="rounded-lg border bg-muted/30 p-4">
                            <div className="flex items-center gap-3 pt-2">
                                <Switch
                                    id="directDiscount"
                                    checked={directDiscount}
                                    onCheckedChange={setDirectDiscount}
                                />

                                <Label
                                    htmlFor="directDiscount"
                                    className="cursor-pointer"
                                >
                                    Direct discount?
                                </Label>
                            </div>
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
                                    "/motor/commercial-vehicle/comprehensive"
                                )
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