import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    ChevronLeft,
    ArrowLeft,
    Loader2,
    AlertCircle,
    ArrowRight,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useState, useMemo, useCallback } from "react";
import { toast } from "@/components/ui/sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    getMotorPremiumPV,
    type GetPremiumRequestPV,
} from "@/api/motor/getpremium";
import { PremiumAmountInfo, GetPremiumResponse } from "@/types/getpremium";

const CATEGORIES = [
    { value: "1", label: "Motorcycle" },
    { value: "2", label: "Scooter" },
];

const CC_OPTIONS = [
    { value: "less_than_150", label: "Less than 150 CC", cc_value: "100" },
    { value: "150_to_250", label: "150 CC to 250 CC", cc_value: "200" },
    { value: "above_250", label: "Above 250 CC", cc_value: "300" },
];

const VOLUNTARY_EXCESS_ID1 = [
    { value: "500", label: "500" },
    { value: "1000", label: "1,000" },
    { value: "2000", label: "2,000" },
];

const VOLUNTARY_EXCESS_ID2 = [
    { value: "500", label: "500" },
    { value: "1000", label: "1,000" },
    { value: "2000", label: "2,000" },
];

function todayISO(): string {
    const d = new Date();

    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        "0",
    )}-${String(d.getDate()).padStart(2, "0")}`;
}

function addOneYear(dateISO: string): string {
    const d = new Date(dateISO);

    d.setFullYear(d.getFullYear() + 1);
    d.setDate(d.getDate() - 1);

    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        "0",
    )}-${String(d.getDate()).padStart(2, "0")}`;
}

const fmt = (v: number | string | undefined | null) => {
    const n = Number(v ?? 0);

    if (!Number.isFinite(n)) return "—";

    return n.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

export const TwoWheelerPage = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const currentStep = Number(searchParams.get("step")) || 1;

    const goToStep = useCallback(
        (step: number) => {
            setSearchParams({ step: String(step) });
        },
        [setSearchParams],
    );

    const vehicleType = localStorage.getItem("motor.vehicleType") || "two-wheeler";

    const planTitle =
        vehicleType === "two-wheeler"
            ? "Two Wheeler Plan"
            : vehicleType === "private"
                ? "Private Vehicle Plan"
                : "Commercial Vehicle Plan";

    const Step1CoveragePlan = () => {
        const handlePlanSelect = (planType: "comprehensive" | "third-party") => {
            localStorage.setItem("motor.insurancePlan", planType);
            goToStep(2);
        };

        return (
            <>
                <div className="mb-6 flex items-center gap-3">
                    <button
                        type="button"
                        className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-gray-100"
                        onClick={() => navigate("/login")}
                    >
                        <ChevronLeft className="h-5 w-5 text-black" />
                    </button>

                    <h1 className="text-lg font-bold text-black">{planTitle}</h1>
                </div>

                <p className="mb-8 text-muted-foreground">
                    Select the insurance plan that best suits you.
                </p>

                <div className="grid max-w-5xl gap-6 md:grid-cols-2">
                    <Card
                        className="cursor-pointer border-2 p-6 transition-all hover:-translate-y-1 hover:border-primary hover:shadow-xl"
                        onClick={() => handlePlanSelect("comprehensive")}
                    >
                        <h3 className="mb-2 text-center text-lg font-bold">
                            Comprehensive Insurance
                        </h3>

                        <div className="my-8 flex justify-center">
                            <div className="flex h-32 w-32 items-center justify-center rounded-full bg-primary/10">
                                <svg viewBox="0 0 100 100" className="h-full w-full p-6">
                                    <path
                                        d="M50 10 L65 25 L65 50 L50 60 L35 50 L35 25 Z"
                                        fill="none"
                                        stroke="hsl(var(--primary))"
                                        strokeWidth="2"
                                    />
                                    <circle
                                        cx="50"
                                        cy="35"
                                        r="8"
                                        fill="hsl(var(--primary))"
                                    />
                                    <path
                                        d="M42 42 L42 50 L58 50 L58 42"
                                        fill="hsl(var(--primary))"
                                    />
                                </svg>
                            </div>
                        </div>

                        <p className="text-center text-xs text-muted-foreground">
                            Covers own damage and third-party damages.
                        </p>
                    </Card>

                    <Card
                        className="cursor-pointer border-2 p-6 transition-all hover:-translate-y-1 hover:border-primary hover:shadow-xl"
                        onClick={() => handlePlanSelect("third-party")}
                    >
                        <h3 className="mb-2 text-center text-lg font-bold">
                            Third Party Insurance
                        </h3>

                        <div className="my-8 flex justify-center">
                            <div className="flex h-32 w-32 items-center justify-center rounded-full bg-primary/10">
                                <svg viewBox="0 0 100 100" className="h-full w-full p-6">
                                    <path
                                        d="M50 10 L65 25 L65 50 L50 60 L35 50 L35 25 Z"
                                        fill="none"
                                        stroke="hsl(var(--primary))"
                                        strokeWidth="2"
                                    />
                                    <path
                                        d="M42 32 L48 38 L58 28"
                                        fill="none"
                                        stroke="hsl(var(--primary))"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                    <path
                                        d="M40 45 L40 52 L60 52 L60 45"
                                        fill="hsl(var(--primary))"
                                    />
                                </svg>
                            </div>
                        </div>

                        <p className="text-center text-xs text-muted-foreground">
                            Covers only third-party damages.
                        </p>
                    </Card>
                </div>

                <div className="mt-8 grid max-w-5xl gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                    <p className="text-sm text-green-700">
                        Comprehensive insurance covers own damage and third-party damage.
                    </p>
                </div>

                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <p className="text-sm text-blue-700">
                        Third-party insurance covers third-party damage only.
                    </p>
                </div>
            </div>
            </>
        );
    };

    const Step2VehicleDetails = () => {
        const insurancePlan =
            localStorage.getItem("motor.insurancePlan") || "comprehensive";

        const isThirdParty = insurancePlan === "third-party";

        const savedCoverage = useMemo(() => {
            try {
                return JSON.parse(localStorage.getItem("motor.coverageForm") || "null");
            } catch {
                return null;
            }
        }, []);

        const [category, setCategory] = useState<string>(
            savedCoverage?.category || "",
        );

        const [yearOfManufacture, setYearOfManufacture] = useState<string>(
            savedCoverage?.yearOfManufacture || "",
        );

        const [selectedCcRange, setSelectedCcRange] = useState<string>(
            savedCoverage?.selectedCcRange || "",
        );

        const [vehicleCost, setVehicleCost] = useState<string>(
            savedCoverage?.vehicleCost || "",
        );

        const [voluntaryExcess, setVoluntaryExcess] = useState<string>(
            savedCoverage?.voluntaryExcess || "0",
        );

        const paDriver = "500000";
        const noOfSeat = "2";
        const paPassenger = "500000";

        const [effectiveDate] = useState<string>(
            savedCoverage?.effectiveDate || todayISO(),
        );

        const [coverStrikeDamage] = useState<boolean>(
            savedCoverage?.coverStrikeDamage ?? true,
        );

        const [noClaimYear, setNoClaimYear] = useState<string>(
            savedCoverage?.noClaimYear || "0",
        );

        const [rsdTerrorismRisk, setRsdTerrorismRisk] = useState<string>(
            savedCoverage?.rsdTerrorismRisk || "no",
        );

        const directDiscount = true;

        const [loading, setLoading] = useState(false);
        const [inlineError, setInlineError] = useState<string | null>(null);

        const expiryDate = useMemo(
            () => (effectiveDate ? addOneYear(effectiveDate) : ""),
            [effectiveDate],
        );

        const years = useMemo(() => {
            const list: string[] = [];
            const currentYear = new Date().getFullYear();

            for (let y = currentYear; y >= 1985; y--) {
                list.push(String(y));
            }

            return list;
        }, []);

        const getCcValue = () => {
            const selected = CC_OPTIONS.find(
                (option) => option.value === selectedCcRange,
            );

            return selected ? selected.cc_value : "";
        };

        const isFormValid = isThirdParty
            ? !!selectedCcRange && !!effectiveDate
            : !!category &&
            !!yearOfManufacture &&
            !!selectedCcRange &&
            !!vehicleCost.trim() &&
            Number(vehicleCost) > 0 &&
            !!effectiveDate;

        const handleCalculate = async () => {
            setInlineError(null);

            if (!selectedCcRange) {
                const msg = "Please select Cubic Capacity range";
                setInlineError(msg);
                toast.error(msg);
                return;
            }

            if (!isThirdParty && !yearOfManufacture) {
                const msg = "Please select year of manufacture";
                setInlineError(msg);
                toast.error(msg);
                return;
            }

            const currentYear = new Date().getFullYear();
            const vehicleAge = isThirdParty
                ? 0
                : currentYear - Number(yearOfManufacture);

            const ccValue = getCcValue();

            const payload: GetPremiumRequestPV = {
                class_id: "1",
                cover_type_id: isThirdParty ? "Third Party" : "Comprehensive",
                is_government: "1",
                engine_capcity_cc: ccValue,
                driver_seat_capacity: "1",
                passenger_seat_capacity: String(Math.max(0, Number(noOfSeat) - 1)),
                compulsory_excess: "500",
                voluntary_excess: isThirdParty ? "0" : voluntaryExcess,
                vehicle_age_in_years: String(vehicleAge),
                vehicle_suminsured_amount: isThirdParty ? "0" : vehicleCost,
                calc_type: "p",
                noclaim_year: isThirdParty ? "0" : noClaimYear,
                is_tailor: "false",
                get_direct_discount: isThirdParty ? "n" : "y",
                vehicle_reg: "e",
                include_rsd_charge: rsdTerrorismRisk === "yes" ? "true" : "false",
            };

            try {
                setLoading(true);

                const resp = await getMotorPremiumPV(payload);

                if (resp?.process_result === false) {
                    const msg =
                        resp?.error_list?.[0]?.error_message ||
                        "Failed to calculate premium";

                    setInlineError(msg);
                    toast.error(msg);
                    return;
                }

                localStorage.setItem("motor.premiumResponse", JSON.stringify(resp));

                localStorage.setItem(
                    "motor.coverageForm",
                    JSON.stringify({
                        category: isThirdParty ? "" : category,
                        yearOfManufacture: isThirdParty ? "" : yearOfManufacture,
                        selectedCcRange,
                        ccValue,
                        vehicleCost: isThirdParty ? "" : vehicleCost,
                        voluntaryExcess: isThirdParty ? "" : voluntaryExcess,
                        effectiveDate,
                        expiryDate,
                        noClaimYear: isThirdParty ? "" : noClaimYear,
                        coverStrikeDamage: isThirdParty ? false : coverStrikeDamage,
                        directDiscount: isThirdParty ? false : directDiscount,
                        rsdTerrorismRisk: isThirdParty ? "no" : rsdTerrorismRisk,
                    }),
                );

                goToStep(3);
            } catch (err: any) {
                let msg = "Failed to calculate premium";

                try {
                    msg =
                        JSON.parse(err?.message || "")?.error_list?.[0]
                            ?.error_message || msg;
                } catch {
                    msg = err?.message || msg;
                }

                setInlineError(msg);
                toast.error(msg);
            } finally {
                setLoading(false);
            }
        };

        if (isThirdParty) {
            return (
                <>
                    <div className="mb-3 flex items-center gap-0">
                        <button
                            type="button"
                            className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-gray-100"
                            onClick={() => goToStep(1)}
                        >
                            <ChevronLeft className="h-5 w-5 text-black" />
                        </button>

                        <h1 className="text-lg font-bold text-black">
                            Coverage Plan &mdash; Third Party
                        </h1>
                    </div>

                    <p className="mb-8 text-sm text-muted-foreground">
                        Fill in the details to calculate your premium.
                    </p>

                    <Card className="mb-8">
                        <CardContent className="space-y-5 pt-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <Label htmlFor="ccRange">Cubic Capacity *</Label>

                                    <Select
                                        value={selectedCcRange}
                                        onValueChange={setSelectedCcRange}
                                    >
                                        <SelectTrigger id="ccRange" className="mt-2">
                                            <SelectValue placeholder="Select CC Range" />
                                        </SelectTrigger>

                                        <SelectContent>
                                            {CC_OPTIONS.map((option) => (
                                                <SelectItem
                                                    key={option.value}
                                                    value={option.value}
                                                >
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {inlineError && (
                                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                                    {inlineError}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div className="flex justify-between">
                        <Button
                            variant="outline"
                            className="gap-2"
                            onClick={() => goToStep(1)}
                        >
                            <ArrowLeft className="h-4 w-4" />
                            BACK
                        </Button>

                        <Button
                            size="lg"
                            className="px-8"
                            disabled={!isFormValid || loading}
                            onClick={handleCalculate}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Calculating...
                                </>
                            ) : (
                                "CALCULATE"
                            )}
                        </Button>
                    </div>
                </>
            );
        }

        return (
            <>
                <div className="mb-6 flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => goToStep(1)}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-white transition hover:bg-muted"
                    >
                        <ArrowLeft className="h-5 w-5 text-black" />
                    </button>

                    <h1 className="text-2xl font-bold text-black">
                        Coverage Plan &mdash; Comprehensive
                    </h1>
                </div>

                <p className="mb-8 text-sm text-muted-foreground">
                    Fill in your vehicle details to get an instant quote.
                </p>

                <Card className="mb-8">
                    <CardContent className="space-y-5 pt-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <Label htmlFor="category">Category *</Label>

                                <Select
                                    value={category}
                                    onValueChange={(value) => {
                                        setCategory(value);
                                        setVoluntaryExcess("");
                                    }}
                                >
                                    <SelectTrigger id="category" className="mt-2">
                                        <SelectValue placeholder="Select Category" />
                                    </SelectTrigger>

                                    <SelectContent>
                                        {CATEGORIES.map((item) => (
                                            <SelectItem key={item.value} value={item.value}>
                                                {item.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="year">Year Of Manufacture *</Label>

                                <Select
                                    value={yearOfManufacture}
                                    onValueChange={setYearOfManufacture}
                                >
                                    <SelectTrigger id="year" className="mt-2">
                                        <SelectValue placeholder="Select Year" />
                                    </SelectTrigger>

                                    <SelectContent>
                                        {years.map((year) => (
                                            <SelectItem key={year} value={year}>
                                                {year}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <Label htmlFor="ccRange">Cubic Capacity *</Label>

                                <Select
                                    value={selectedCcRange}
                                    onValueChange={setSelectedCcRange}
                                >
                                    <SelectTrigger id="ccRange" className="mt-2">
                                        <SelectValue placeholder="Select CC Range" />
                                    </SelectTrigger>

                                    <SelectContent>
                                        {CC_OPTIONS.map((option) => (
                                            <SelectItem
                                                key={option.value}
                                                value={option.value}
                                            >
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="vehicleCost">Vehicle Cost (NPR) *</Label>

                                <Input
                                    id="vehicleCost"
                                    type="text"
                                    inputMode="numeric"
                                    className="mt-2 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                    placeholder="Enter vehicle cost"
                                    value={vehicleCost}
                                    onChange={(e) => {
                                        const value = e.target.value;

                                        if (value === "" || /^\d+$/.test(value)) {
                                            setVehicleCost(value);
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <Label htmlFor="voluntaryExcess">
                                    Voluntary Excess *
                                </Label>

                                <Select
                                    value={voluntaryExcess}
                                    onValueChange={setVoluntaryExcess}
                                >
                                    <SelectTrigger id="voluntaryExcess" className="mt-2">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>

                                    <SelectContent>
                                        {(category === "2"
                                            ? VOLUNTARY_EXCESS_ID2
                                            : VOLUNTARY_EXCESS_ID1
                                        ).map((item) => (
                                            <SelectItem key={item.value} value={item.value}>
                                                {item.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <p className="mt-1 text-xs text-orange-600">
                                    The sum you bear towards a claim for a premium discount.
                                </p>
                            </div>

                            <div>
                                <Label>Compulsory Excess</Label>
                                <Input className="mt-2" value="500" disabled />
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <Label>P.A. to Driver</Label>
                                <Input
                                    type="number"
                                    className="mt-2"
                                    value={paDriver}
                                    disabled
                                />
                            </div>

                            <div>
                                <Label>No of Seat Including Driver</Label>
                                <Input
                                    type="number"
                                    className="mt-2"
                                    value={noOfSeat}
                                    disabled
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <Label>P.A. to Passenger</Label>
                                <Input
                                    type="number"
                                    className="mt-2"
                                    value={paPassenger}
                                    disabled
                                />
                            </div>

                            <div>
                                <Label htmlFor="noClaimYear">Claim Discount Year</Label>

                                <Select
                                    value={noClaimYear}
                                    onValueChange={setNoClaimYear}
                                >
                                    <SelectTrigger id="noClaimYear" className="mt-2">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>

                                    <SelectContent>
                                        {["0", "1", "2", "3", "4", "5"].map((year) => (
                                            <SelectItem key={year} value={year}>
                                                {year} {year === "1" ? "Year" : "Years"}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <Label htmlFor="rsdTerrorismRisk">RS/MD/ST Risk</Label>

                                <Select
                                    value={rsdTerrorismRisk}
                                    onValueChange={setRsdTerrorismRisk}
                                >
                                    <SelectTrigger id="rsdTerrorismRisk" className="mt-2">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>

                                    <SelectContent>
                                        <SelectItem value="yes">Yes</SelectItem>
                                        <SelectItem value="no">No</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid gap-4 pt-2 md:grid-cols-2">
                            <div className="flex items-center gap-3">
                                <Switch id="directDiscount" checked={true} disabled />

                                <Label
                                    htmlFor="directDiscount"
                                    className="cursor-not-allowed text-muted-foreground"
                                >
                                    Direct discount
                                </Label>
                            </div>
                        </div>

                        {inlineError && (
                            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                                {inlineError}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="flex justify-between">
                    <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => goToStep(1)}
                    >
                        <ArrowLeft className="h-4 w-4" />
                        BACK
                    </Button>

                    <Button
                        size="lg"
                        className="px-8"
                        disabled={!isFormValid || loading}
                        onClick={handleCalculate}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Calculating...
                            </>
                        ) : (
                            "CALCULATE"
                        )}
                    </Button>
                </div>
            </>
        );
    };

   const Step3PremiumDetails = () => {
    type RowType = "normal" | "section" | "less" | "subtotal" | "total";

    type PremiumTableRow = {
        key: string;
        label: string;
        value?: string | number | null;
        type?: RowType;
    };

    const insurancePlan =
        localStorage.getItem("motor.insurancePlan") || "comprehensive";

    const isThirdParty = insurancePlan === "third-party";

    const premiumData = useMemo<GetPremiumResponse | null>(() => {
        try {
            return JSON.parse(
                localStorage.getItem("motor.premiumResponse") || "null",
            ) as GetPremiumResponse | null;
        } catch {
            return null;
        }
    }, []);

    const amount: PremiumAmountInfo | undefined = premiumData?.amount_info;
    const hasData = !!amount;

    const safeValue = (value: unknown): string | number | null => {
        if (typeof value === "string" || typeof value === "number") {
            return value;
        }

        return null;
    };

    const getValue = (
        obj: PremiumAmountInfo | GetPremiumResponse | undefined | null,
        keys: string[],
        fallback: string | number = 0,
    ): string | number => {
        if (!obj) return fallback;

        for (const key of keys) {
            const value = (obj as Record<string, unknown>)[key];

            if (typeof value === "string" || typeof value === "number") {
                return value;
            }
        }

        return fallback;
    };

    const formatAmount = (value: string | number | null | undefined) => {
        if (value === null || value === undefined || value === "") return "—";
        return fmt(value);
    };

    const thirdPartyPremium = getValue(amount, [
        "tpl_amount",
        "third_party_premium",
    ]);

    const vatPercent = getValue(amount, ["vat_percent"], 13);
    const vatAmount = getValue(amount, ["vat_amount"]);
    const stampDuty = getValue(amount, ["stamp_duty"]);

    const totalPremium = getValue(amount, [
        "total_amount",
        "total_premium",
        "payable_amount",
    ]);

    const calculationRows: PremiumTableRow[] = isThirdParty
        ? [
              {
                  key: "third_party_section",
                  label: "Third Party Premium Calculation",
                  type: "section",
              },
              {
                  key: "third_party_premium",
                  label: "Third Party Premium as per CC",
                  value: safeValue(thirdPartyPremium),
              },
              {
                  key: "sub_total",
                  label: "Sub Total",
                  value: safeValue(thirdPartyPremium),
                  type: "subtotal",
              },
              {
                  key: "vat_amount",
                  label: `Add : VAT ${safeValue(vatPercent) ?? 13}%`,
                  value: safeValue(vatAmount),
              },
              {
                  key: "stamp_duty",
                  label: "Add : Stamp Duty",
                  value: safeValue(stampDuty),
              },
              {
                  key: "total_premium",
                  label: "Total Premium",
                  value: safeValue(totalPremium),
                  type: "total",
              },
          ]
        : [
              {
                  key: "suminsured",
                  label: "Sum Insured",
                  value: safeValue(amount?.suminsured),
              },
              {
                  key: "premium_amount",
                  label: "Basic Premium",
                  value: safeValue(amount?.premium_amount),
              },
            //   {
            //       key: "direct_discount_amount",
            //       label: "Direct Discount Amount",
            //       value: safeValue(
            //           (premiumData as Record<string, unknown> | null)
            //               ?.direct_discount_amount,
            //       ),
            //       type: "less",
            //   },
              {
                  key: "tpl_amount",
                  label: "Third Party Premium",
                  value: safeValue(amount?.tpl_amount),
              },
              {
                  key: "pool_amount",
                  label: "RS/MD/ST",
                  value: safeValue(amount?.pool_amount),
              },
              {
                  key: "taxable_amount",
                  label: "Taxable Amount",
                  value: safeValue(amount?.taxable_amount),
                  type: "subtotal",
              },
              {
                  key: "vat_amount",
                  label: `VAT (${safeValue(amount?.vat_percent) ?? 13}%)`,
                  value: safeValue(amount?.vat_amount),
              },
              {
                  key: "stamp_duty",
                  label: "Stamp Duty",
                  value: safeValue(amount?.stamp_duty),
              },
              {
                  key: "total_premium_with_vat",
                  label: "Total Premium",
                  value: safeValue(
                      (premiumData as Record<string, unknown> | null)
                          ?.total_premium_with_vat,
                  ),
                  type: "total",
              },
          ];

    return (
        <>
            <div className="mb-6 flex items-start gap-3">
                <button
                    type="button"
                    onClick={() => goToStep(2)}
                    className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-black"
                >
                    <ChevronLeft className="h-5 w-5" />
                </button>

                <div>
                    <h1 className="text-xl font-bold text-slate-900">
                        {isThirdParty
                            ? "Third Party Premium Details"
                            : "Comprehensive Premium Details"}
                    </h1>

                    <p className="mt-1 text-sm text-muted-foreground">
                        Review the premium amount, VAT, stamp duty, discount, and final payable amount.
                    </p>
                </div>
            </div>

            {!hasData && (
                <div className="mb-6 flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-700">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    No premium data found. Please go back and calculate first.
                </div>
            )}

            {hasData && (
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
                            {calculationRows.map((row) => {
                                if (row.type === "section") {
                                    return (
                                        <tr
                                            key={row.key}
                                            className="border-b bg-[#fff7f3]"
                                        >
                                            <td
                                                colSpan={2}
                                                className="px-4 py-3 font-bold text-black"
                                            >
                                                {row.label}
                                            </td>
                                        </tr>
                                    );
                                }

                                if (row.type === "total") {
                                    return (
                                        <tr
                                            key={row.key}
                                            className="bg-[#b71319] text-white"
                                        >
                                            <td className="border-r border-white px-4 py-4 text-base font-bold">
                                                {row.label}
                                            </td>

                                            <td className="px-4 py-4 text-right text-base font-bold">
                                                {formatAmount(row.value)}
                                            </td>
                                        </tr>
                                    );
                                }

                                return (
                                    <tr
                                        key={row.key}
                                        className={`border-b bg-[#fff7f3] last:border-b-0 ${
                                            row.type === "subtotal"
                                                ? "font-semibold"
                                                : ""
                                        }`}
                                    >
                                        <td
                                            className={`border-r border-white px-4 py-3 ${
                                                row.type === "less"
                                                    ? "text-red-600"
                                                    : "text-black"
                                            }`}
                                        >
                                            {row.type === "less"
                                                ? `Less : ${row.label}`
                                                : row.label}
                                        </td>

                                        <td
                                            className={`px-4 py-3 text-right font-medium ${
                                                row.type === "less"
                                                    ? "text-red-600"
                                                    : "text-black"
                                            }`}
                                        >
                                            {row.type === "less"
                                                ? `(${formatAmount(row.value)})`
                                                : formatAmount(row.value)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="mt-8 flex items-center justify-between gap-3">
                <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => goToStep(2)}
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                </Button>

                <Button
                    size="lg"
                    className="gap-2 bg-[#f71920] px-8 text-white hover:bg-[#d9151b]"
                    onClick={() => navigate("/login")}
                >
                    Buy Policy
                    <ArrowRight className="h-4 w-4" />
                </Button>
            </div>
        </>
    );
};

    switch (currentStep) {
        case 1:
            return <Step1CoveragePlan />;
        case 2:
            return <Step2VehicleDetails />;
        case 3:
            return <Step3PremiumDetails />;
        default:
            return <Step1CoveragePlan />;
    }
};