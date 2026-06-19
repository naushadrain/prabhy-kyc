// CommercialVehicle/comprehensive/pages/CPassengerCarryingPage.tsx

import { useEffect, useMemo, useState } from "react";
import {
    AlertCircle,
    ArrowLeft,
    ArrowRight,
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

const seatCapacityOptions = [
    {
        label: "Up to 14 Pax",
        value: "up_to_14",
        minSeat: 1,
        maxSeat: 14,
    },
    {
        label: "15 to 18 Pax",
        value: "15_to_18",
        minSeat: 15,
        maxSeat: 18,
    },
    {
        label: "19 to 35 Pax",
        value: "19_to_35",
        minSeat: 19,
        maxSeat: 35,
    },
    {
        label: "More than 35 Pax",
        value: "more_than_35",
        minSeat: 36,
        maxSeat: 99,
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

export default function CPassengerCarryingPage() {
    const navigate = useNavigate();

    const [step, setStep] = useState<1 | 2>(1);

    const [seatCapacity, setSeatCapacity] = useState("");
    const [noOfSeats, setNoOfSeats] = useState("");
    const [helper, setHelper] = useState("no");
    const [conductor, setConductor] = useState("no");

    const [sumInsured, setSumInsured] = useState("");
    const [yearOfManufacture, setYearOfManufacture] = useState("");
    const [compulsoryExcess, setCompulsoryExcess] = useState("500");
    const [compulsoryLoading, setCompulsoryLoading] = useState(false);

    const [privateUse, setPrivateUse] = useState("no");
    const [voluntaryExcess, setVoluntaryExcess] = useState("");
    const [noClaimYear, setNoClaimYear] = useState("0");
    const [towingCharge, setTowingCharge] = useState("no");
    const [rsdTerrorismRisk, setRsdTerrorismRisk] = useState("no");
    const [directDiscount] = useState(true);

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [inlineError, setInlineError] = useState<string | null>(null);
    const [premiumData, setPremiumData] = useState<GetPremiumResponse | null>(
        null
    );

    const selectedSeatCapacity = useMemo(() => {
        return seatCapacityOptions.find((item) => item.value === seatCapacity);
    }, [seatCapacity]);

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

    const validate = () => {
        const newErrors: Record<string, string> = {};

        const totalSeats = Number(noOfSeats || 0);

        if (!noOfSeats.trim()) {
            newErrors.noOfSeats = "No of seats including driver is required";
        } else if (!/^\d+$/.test(noOfSeats) || totalSeats <= 0) {
            newErrors.noOfSeats = "Enter valid no of seats";
        } else if (
            selectedSeatCapacity &&
            (totalSeats < selectedSeatCapacity.minSeat ||
                totalSeats > selectedSeatCapacity.maxSeat)
        ) {
            newErrors.noOfSeats = `Seats must be between ${selectedSeatCapacity.minSeat} and ${selectedSeatCapacity.maxSeat}`;
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
            newErrors.noClaimYear = "No claim discount year is required";
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

        const helperSeat = helper === "yes" ? 1 : 0;
        const conductorSeat = conductor === "yes" ? 1 : 0;
        const conductorHelperSeatCapacity = helperSeat + conductorSeat;

        const totalSeats = Number(noOfSeats);
        const passengerSeatCapacity = Math.max(
            0,
            totalSeats - 1 - conductorHelperSeatCapacity
        );

        const payload: GetPremiumRequestCV = {
            class_id: "5",
            cover_type_id: "Comprehensive",
            is_government: "1",
            good_carrying_capacity: null,
            engine_capcity_cc: "12",
            driver_seat_capacity: "1",
            passenger_seat_capacity: String(passengerSeatCapacity),
            conductor_helper_seat_capacity: String(
                conductorHelperSeatCapacity
            ),
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
            include_rsd_charge: rsdTerrorismRisk === "yes" ? "true" : "false",
        };

        try {
            setLoading(true);

            localStorage.setItem("motor.vehicleType", "commercial");
            localStorage.setItem("motor.insurancePlan", "comprehensive");

            localStorage.setItem(
                "motor.selectedCommercialCategory",
                JSON.stringify({
                    data: "5",
                    value: "Commercial Vehicle Passenger Carrying Policy",
                    additional_value: "CV",
                    title: "Passenger Carrying Policy",
                })
            );

            localStorage.setItem(
                "motor.comprehensivePassengerCarryingForm",
                JSON.stringify({
                    categoryId: "5",
                    categoryName:
                        "Commercial Vehicle Passenger Carrying Policy",
                    seatCapacity,
                    seatCapacityLabel: selectedSeatCapacity?.label || "",
                    noOfSeatsIncludingDriver: noOfSeats,
                    driverSeatCapacity: "1",
                    passengerSeatCapacity: String(passengerSeatCapacity),
                    helper,
                    conductor,
                    conductorHelperSeatCapacity: String(
                        conductorHelperSeatCapacity
                    ),
                    sumInsured,
                    yearOfManufacture,
                    vehicleAge,
                    compulsoryExcess,
                    privateUse,
                    voluntaryExcess,
                    noClaimYear,
                    towingCharge,
                    rsdTerrorismRisk,
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

    const premiumRows: PremiumRow[] = [
        {
            key: "suminsured",
            label: "Sum Insured",
            value: getValue(amount as any, ["suminsured"]),
        },
        {
            key: "premium_amount",
            label: "Basic Premium",
            value: getValue(amount as any, ["premium_amount"]),
        },
        {
            key: "pa_amount",
            label: "Driver/Passenger Premium",
            value: getValue(amount as any, ["pa_amount"]),
        },
        {
            key: "tpl_amount",
            label: "Third Party Premium",
            value: getValue(amount as any, ["tpl_amount"]),
        },
        {
            key: "pool_amount",
            label: "RS/MD/ST",
            value: getValue(amount as any, ["pool_amount"]),
        },
        {
            key: "taxable_amount",
            label: "Taxable Amount",
            value: getValue(amount as any, ["taxable_amount"]),
        },
        {
            key: "vat_amount",
            label: "VAT",
            value: getValue(amount as any, ["vat_amount"]),
        },
        {
            key: "stamp_duty",
            label: "Stamp Duty",
            value: getValue(amount as any, ["stamp_duty"]),
        },
        {
            key: "total_premium_with_vat",
            label: "Total Premium With VAT",
            value: getValue(
                premiumData as any,
                ["total_premium_with_vat"],
                getValue(amount as any, ["total_amount"])
            ),
            type: "total",
        },
    ];

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
                            Comprehensive Passenger Carrying Premium Details
                        </h1>

                        <p className="mt-1 text-sm text-muted-foreground">
                            Comprehensive passenger carrying premium calculation details.
                        </p>
                    </div>
                </div>

                <div className="overflow-hidden rounded-md border">
                    <table className="w-full border-collapse text-sm">
                        <thead>
                            <tr className="bg-[#e91d25] text-white">
                                <th className="border-r border-white px-4 py-3 text-left font-bold">
                                    Particulars
                                </th>

                                <th className="px-4 py-3 text-right font-bold">
                                    Amount NPR
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {premiumRows.map((row) => {
                                if (row.type === "total") {
                                    return (
                                        <tr key={row.key} className="bg-[#b71319] text-white">
                                            <td className="border-r border-white px-4 py-4 text-base font-bold">
                                                {row.label}
                                            </td>

                                            <td className="px-4 py-4 text-right text-base font-bold">
                                                {fmt(row.value)}
                                            </td>
                                        </tr>
                                    );
                                }

                                return (
                                    <tr
                                        key={row.key}
                                        className="border-b bg-[#fff7f3] last:border-b-0"
                                    >
                                        <td className="border-r border-white px-4 py-3 text-black">
                                            {row.label}
                                        </td>

                                        <td className="px-4 py-3 text-right font-medium text-black">
                                            {fmt(row.value)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="mt-8 flex items-center justify-between gap-3">
                    <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => setStep(1)}
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>

                    <Button
                        className="gap-2 bg-[#f71920] text-white hover:bg-[#d9151b]"
                        onClick={() => navigate("/login")}
                    >
                        Buy Policy
                        <ArrowRight className="h-4 w-4" />
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
                        Comprehensive Passenger Carrying
                    </h1>

                    <p className="mt-1 text-sm text-muted-foreground">
                        Fill passenger carrying vehicle details to calculate
                        comprehensive premium.
                    </p>
                </div>
            </div>

            <Card className="max-w-5xl">
                <CardContent className="space-y-5 pt-6">
                    <div className="grid gap-5 md:grid-cols-2">
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
                                onChange={(e) =>
                                    handleNumberInput(
                                        e.target.value,
                                        setNoOfSeats,
                                        "noOfSeats"
                                    )
                                }
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

                        <SelectBox
                            id="helper"
                            label="Helper *"
                            value={helper}
                            onChange={(value) => {
                                setHelper(value);
                                clearError("helper");
                            }}
                            options={yesNoOptions}
                        />

                        <SelectBox
                            id="conductor"
                            label="Conductor *"
                            value={conductor}
                            onChange={(value) => {
                                setConductor(value);
                                clearError("conductor");
                            }}
                            options={yesNoOptions}
                        />

                        <div>
                            <Label htmlFor="sumInsured">Sum Insured *</Label>

                            <Input
                                id="sumInsured"
                                type="text"
                                inputMode="numeric"
                                placeholder="Enter vehicle sum insured"
                                className={`mt-2 ${errors.sumInsured ? "border-red-500" : ""
                                    }`}
                                value={sumInsured}
                                onChange={(e) =>
                                    handleNumberInput(
                                        e.target.value,
                                        setSumInsured,
                                        "sumInsured"
                                    )
                                }
                            />

                            {errors.sumInsured && (
                                <p className="mt-1 text-xs text-red-600">
                                    {errors.sumInsured}
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
                            id="privateUse"
                            label="Private Use"
                            value={privateUse}
                            onChange={setPrivateUse}
                            options={yesNoOptions}
                        />

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
                                    className={`mt-2 ${errors.noClaimYear
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

                        <SelectBox
                            id="towingCharge"
                            label="Towing Charge"
                            value={towingCharge}
                            onChange={setTowingCharge}
                            options={yesNoOptions}
                        />

                        <SelectBox
                            id="rsdTerrorismRisk"
                            label="RS/MD/ST Risk"
                            value={rsdTerrorismRisk}
                            onChange={setRsdTerrorismRisk}
                            options={yesNoOptions}
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
                            className="gap-2 px-8"
                            disabled={loading || compulsoryLoading}
                            onClick={handleCalculate}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Calculating...
                                </>
                            ) : (
                                <>
                                    Calculate
                                    <ArrowRight className="h-4 w-4" />
                                </>
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

function SelectBox({
    id,
    label,
    value,
    onChange,
    options,
}: {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: { label: string; value: string }[];
}) {
    return (
        <div>
            <Label htmlFor={id}>{label}</Label>

            <Select value={value} onValueChange={onChange}>
                <SelectTrigger id={id} className="mt-2">
                    <SelectValue />
                </SelectTrigger>

                <SelectContent>
                    {options.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                            {item.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}