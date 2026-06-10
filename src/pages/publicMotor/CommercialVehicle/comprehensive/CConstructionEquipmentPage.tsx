// CommercialVehicle/comprehensive/pages/CConstructionEquipmentPage.tsx

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
import { GetPremiumResponse } from "@/types/getpremium";
import { toast } from "@/components/ui/sonner";

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
    const clean = String(value ?? "0").replace(/,/g, "");
    const num = Number(clean);

    if (!Number.isFinite(num)) return "0.00";

    return num.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

const getValue = (obj: any, keys: string[], fallback: number | string = 0) => {
    if (!obj) return fallback;

    for (const key of keys) {
        if (obj[key] !== undefined && obj[key] !== null && obj[key] !== "") {
            return obj[key];
        }
    }

    return fallback;
};

const normalizeIntAmount = (value: string | number | null | undefined) => {
    const clean = String(value ?? "0").replace(/,/g, "");
    const num = Number(clean);

    if (!Number.isFinite(num)) return "0";

    return String(Math.trunc(num));
};

export default function CConstructionEquipmentPage() {
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
            class_id: "9",
            cover_type_id: "Comprehensive",
            is_government: "1",
            good_carrying_capacity: goodCarryingCapacity,
            engine_capcity_cc: "49",
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
                    data: "9",
                    value: "Construction Equipment Vehicle",
                    additional_value: "CV",
                    title: "Construction Equipment Vehicle",
                })
            );

            localStorage.setItem(
                "motor.comprehensiveConstructionEquipmentForm",
                JSON.stringify({
                    categoryId: "9",
                    categoryName: "Construction Equipment Vehicle",
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

    const amount = premiumData?.amount_info;

    if (step === 2 && premiumData && amount) {
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
                            Comprehensive Construction Equipment Premium Details
                        </h1>

                        <p className="mt-1 text-sm text-muted-foreground">
                            Comprehensive premium calculation details.
                        </p>
                    </div>
                </div>
                        <div className="overflow-hidden rounded-lg border">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-primary text-primary-foreground">
                                        <th className="px-5 py-3 text-left">
                                            Description
                                        </th>

                                        <th className="px-5 py-3 text-right">
                                            Amount (NPR)
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    <PremiumRow
                                        label="Premium"
                                        value={getValue(amount, [
                                            "premium_amount",
                                            "own_damage_premium",
                                            "od_premium",
                                        ])}
                                    />

                                    <PremiumRow
                                        label="Third Party Premium"
                                        value={getValue(amount, [
                                            "tpl_amount",
                                            "third_party_premium",
                                        ])}
                                    />

                                    <PremiumRow
                                        label="Pool Premium"
                                        value={getValue(amount, [
                                            "pool_amount",
                                        ])}
                                    />

                                    <PremiumRow
                                        label="Taxable Amount"
                                        value={getValue(amount, [
                                            "taxable_amount",
                                            "subtotal_amount",
                                        ])}
                                    />

                                    <PremiumRow
                                        label={`VAT ${getValue(
                                            amount,
                                            ["vat_percent"],
                                            13
                                        )}%`}
                                        value={getValue(amount, ["vat_amount"])}
                                    />

                                    <PremiumRow
                                        label="Stamp Duty"
                                        value={getValue(amount, ["stamp_duty"])}
                                    />

                                    <tr className="bg-primary/10 font-bold text-primary">
                                        <td className="px-5 py-4">
                                            Total Premium
                                        </td>

                                        <td className="px-5 py-4 text-right">
                                            NPR{" "}
                                            {fmt(
                                                getValue(amount, [
                                                    "total_amount",
                                                    "total_premium",
                                                    "payable_amount",
                                                ])
                                            )}
                                        </td>
                                    </tr>
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
                        Comprehensive Construction Equipment
                    </h1>

                    <p className="mt-1 text-sm text-muted-foreground">
                        Fill construction equipment vehicle details to calculate
                        comprehensive premium.
                    </p>
                </div>
            </div>

            <Card className="max-w-5xl">
                <CardContent className="space-y-5 pt-6">
                    <div className="grid gap-5 md:grid-cols-2">
                        <InputBox
                            label="Good Carrying Capacity *"
                            id="goodCarryingCapacity"
                            value={goodCarryingCapacity}
                            placeholder="Enter good carrying capacity"
                            error={errors.goodCarryingCapacity}
                            onChange={(value) =>
                                handleNumberInput(
                                    value,
                                    setGoodCarryingCapacity,
                                    "goodCarryingCapacity"
                                )
                            }
                        />

                        <InputBox
                            label="No of Seats Including Driver *"
                            id="noOfSeats"
                            value={noOfSeats}
                            placeholder="Enter no of seats including driver"
                            error={errors.noOfSeats}
                            onChange={(value) =>
                                handleNumberInput(
                                    value,
                                    setNoOfSeats,
                                    "noOfSeats"
                                )
                            }
                        />

                        <SelectBox
                            label="Helper *"
                            id="helper"
                            value={helper}
                            error={errors.helper}
                            placeholder="Select helper"
                            options={yesNoOptions}
                            onChange={(value) => {
                                setHelper(value);
                                clearError("helper");
                            }}
                        />

                        <InputBox
                            label="Sum Insured *"
                            id="sumInsured"
                            value={sumInsured}
                            placeholder="Enter vehicle sum insured"
                            error={errors.sumInsured}
                            onChange={(value) =>
                                handleNumberInput(
                                    value,
                                    setSumInsured,
                                    "sumInsured"
                                )
                            }
                        />

                        <SelectBox
                            label="Year of Manufacture *"
                            id="yearOfManufacture"
                            value={yearOfManufacture}
                            error={errors.yearOfManufacture}
                            placeholder="Select year"
                            options={yearOptions.map((year) => ({
                                label: year,
                                value: year,
                            }))}
                            onChange={(value) => {
                                setYearOfManufacture(value);
                                clearError("yearOfManufacture");
                            }}
                        />

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

                        

                        <SelectBox
                            label="Voluntary Excess *"
                            id="voluntaryExcess"
                            value={voluntaryExcess}
                            error={errors.voluntaryExcess}
                            placeholder="Select voluntary excess"
                            options={voluntaryExcessOptions}
                            onChange={(value) => {
                                setVoluntaryExcess(value);
                                clearError("voluntaryExcess");
                            }}
                        />

                        <SelectBox
                            label="No Claim Discount *"
                            id="noClaimYear"
                            value={noClaimYear}
                            error={errors.noClaimYear}
                            placeholder="Select no claim discount"
                            options={noClaimYearOptions}
                            onChange={(value) => {
                                setNoClaimYear(value);
                                clearError("noClaimYear");
                            }}
                        />

                        <SelectBox
                            label="Towing Charge"
                            id="towingCharge"
                            value={towingCharge}
                            placeholder="Select towing charge"
                            options={yesNoOptions}
                            onChange={setTowingCharge}
                        />

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

function InputBox({
    label,
    id,
    value,
    placeholder,
    error,
    onChange,
}: {
    label: string;
    id: string;
    value: string;
    placeholder: string;
    error?: string;
    onChange: (value: string) => void;
}) {
    return (
        <div>
            <Label htmlFor={id}>{label}</Label>

            <Input
                id={id}
                type="text"
                inputMode="numeric"
                placeholder={placeholder}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className={`mt-2 ${error ? "border-red-500" : ""}`}
            />

            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
}

function SelectBox({
    label,
    id,
    value,
    placeholder,
    options,
    error,
    onChange,
}: {
    label: string;
    id: string;
    value: string;
    placeholder: string;
    options: { label: string; value: string }[];
    error?: string;
    onChange: (value: string) => void;
}) {
    return (
        <div>
            <Label htmlFor={id}>{label}</Label>

            <Select value={value} onValueChange={onChange}>
                <SelectTrigger
                    id={id}
                    className={`mt-2 ${error ? "border-red-500" : ""}`}
                >
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>

                <SelectContent>
                    {options.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                            {item.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
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

function PremiumRow({
    label,
    value,
}: {
    label: string;
    value: number | string;
}) {
    return (
        <tr className="border-b bg-muted/10">
            <td className="px-5 py-3 text-muted-foreground">{label}</td>
            <td className="px-5 py-3 text-right font-medium">
                NPR {fmt(value)}
            </td>
        </tr>
    );
}