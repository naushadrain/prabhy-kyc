import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ArrowLeft, Loader2, AlertCircle, Car, DollarSign, FileText, CheckCircle } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { toast } from '@/components/ui/sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    getMotorPremiumPV,
    type GetPremiumRequestPV,
} from '@/api/motor/getpremium';

import { PremiumAmountInfo, GetPremiumResponse } from '@/types/getpremium';
/* ──────────────────────────────────────────────────────────────────────────────
   Constants
   ────────────────────────────────────────────────────────────────────────────── */

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

/* ──────────────────────────────────────────────────────────────────────────────
   Helpers
   ────────────────────────────────────────────────────────────────────────────── */

function todayISO(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addOneYear(dateISO: string): string {
    const d = new Date(dateISO);
    d.setFullYear(d.getFullYear() + 1);
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const fmt = (v: number | string | undefined | null) => {
    const n = Number(v ?? 0);
    if (!Number.isFinite(n)) return "\u2014";
    return n.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex justify-between py-2 border-b last:border-b-0">
            <span className="text-sm text-muted-foreground">{label}</span>
            <span className="text-sm font-medium">{value ?? "\u2014"}</span>
        </div>
    );
}


/* ══════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════════════════════ */

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

    const vehicleType = localStorage.getItem('motor.vehicleType') || 'two-wheeler';
    const planTitle = vehicleType === 'two-wheeler'
        ? 'Two Wheeler Plan'
        : vehicleType === 'private'
            ? 'Private Vehicle Plan'
            : 'Commercial Vehicle Plan';

    /* ────────────────────────────────────────────────────────────────────────────
       STEP 1 — Coverage Plan Selection
       ──────────────────────────────────────────────────────────────────────────── */

    const Step1CoveragePlan = () => {
        const handlePlanSelect = (planType: 'comprehensive' | 'third-party') => {
            localStorage.setItem('motor.insurancePlan', planType);
            goToStep(2);
        };

        return (
            <>
                <div className="mb-6 flex items-center gap-3">
                    <button
                        type="button"
                        className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-gray-10"
                        onClick={() => navigate('/login')}
                    >
                        <ChevronLeft className="h-5 w-5 text-black" />
                    </button>

                    <h1 className="text-lg font-bold text-black">{planTitle}</h1>
                </div>
                <p className="text-muted-foreground mb-8">Select the insurance plan that best suits you.</p>

                <div className="grid md:grid-cols-2 gap-6 max-w-3xl">
                    <Card
                        className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary"
                        onClick={() => handlePlanSelect('comprehensive')}
                    >
                        <h3 className="text-lg font-bold mb-2 text-center">Comprehensive Insurance</h3>
                        <div className="flex justify-center my-8">
                            <div className="w-32 h-32 flex items-center justify-center">
                                <svg viewBox="0 0 100 100" className="w-full h-full">
                                    <path d="M50 10 L65 25 L65 50 L50 60 L35 50 L35 25 Z" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" />
                                    <circle cx="50" cy="35" r="8" fill="hsl(var(--primary))" />
                                    <path d="M42 42 L42 50 L58 50 L58 42" fill="hsl(var(--primary))" />
                                </svg>
                            </div>
                        </div>
                        <p className="text-xs text-center text-muted-foreground">Covers all damages including you and other third-party damages.</p>
                    </Card>

                    <Card
                        className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary"
                        onClick={() => handlePlanSelect('third-party')}
                    >
                        <h3 className="text-lg font-bold mb-2 text-center">Third Party Insurance</h3>
                        <div className="flex justify-center my-8">
                            <div className="w-32 h-32 flex items-center justify-center">
                                <svg viewBox="0 0 100 100" className="w-full h-full">
                                    <path d="M50 10 L65 25 L65 50 L50 60 L35 50 L35 25 Z" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" />
                                    <path d="M42 32 L48 38 L58 28" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M40 45 L40 52 L60 52 L60 45" fill="hsl(var(--primary))" />
                                </svg>
                            </div>
                        </div>
                        <p className="text-xs text-center text-muted-foreground">All third-party damages are covered.</p>
                    </Card>
                </div>

                <div className="mt-8 space-y-4 max-w-3xl">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-700">All third-party damages are covered.</p>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-sm text-green-700">Covers all damages including you and other third-party damages.</p>
                    </div>
                </div>
            </>
        );
    };

    /* ────────────────────────────────────────────────────────────────────────────
       STEP 2 — Vehicle Details Form
       ──────────────────────────────────────────────────────────────────────────── */

    const Step2VehicleDetails = () => {
        const insurancePlan = localStorage.getItem('motor.insurancePlan') || 'comprehensive';
        const isThirdParty = insurancePlan === 'third-party';

        const savedCoverage = useMemo(() => {
            try {
                return JSON.parse(localStorage.getItem("motor.coverageForm") || "null");
            } catch {
                return null;
            }
        }, []);

        const [category, setCategory] = useState<string>(savedCoverage?.category || "");
        const [yearOfManufacture, setYearOfManufacture] = useState<string>(savedCoverage?.yearOfManufacture || "");
        const [selectedCcRange, setSelectedCcRange] = useState<string>(savedCoverage?.selectedCcRange || "");
        const [vehicleCost, setVehicleCost] = useState<string>(savedCoverage?.vehicleCost || "");
        const [voluntaryExcess, setVoluntaryExcess] = useState<string>(savedCoverage?.voluntaryExcess || "0");
        const paDriver = "500000";
        const noOfSeat = "2";
        const paPassenger = "500000";
        const [effectiveDate, setEffectiveDate] = useState<string>(savedCoverage?.effectiveDate || todayISO());
        const [coverStrikeDamage, setCoverStrikeDamage] = useState<boolean>(savedCoverage?.coverStrikeDamage ?? true);
        const [noClaimYear, setNoClaimYear] = useState<string>(savedCoverage?.noClaimYear || "0");
        const [directDiscount, setDirectDiscount] = useState<boolean>(savedCoverage?.directDiscount ?? true);
        const [loading, setLoading] = useState(false);
        const [inlineError, setInlineError] = useState<string | null>(null);

        const expiryDate = useMemo(() => (effectiveDate ? addOneYear(effectiveDate) : ""), [effectiveDate]);

        const years = useMemo(() => {
            const list: string[] = [];
            for (let y = 2026; y >= 1985; y--) list.push(String(y));
            return list;
        }, []);

        const getCcValue = () => {
            const selected = CC_OPTIONS.find(opt => opt.value === selectedCcRange);
            return selected ? selected.cc_value : "";
        };

        // Different validation for Third Party vs Comprehensive
        const isFormValid = isThirdParty
            ? (!!selectedCcRange && !!effectiveDate)  // Third Party: only CC range and effective date
            : (!!category && !!yearOfManufacture && !!selectedCcRange && !!vehicleCost.trim() && Number(vehicleCost) > 0 && !!effectiveDate);

        const handleCalculate = async () => {
            setInlineError(null);
            if (!selectedCcRange) {
                const msg = "Please select Cubic Capacity range";
                setInlineError(msg);
                toast.error(msg);
                return;
            }

            const currentYear = new Date().getFullYear();
            const vehicleAge = isThirdParty ? 0 : currentYear - Number(yearOfManufacture);
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
                get_direct_discount: isThirdParty ? "n" : (directDiscount ? "y" : "n"),
                vehicle_reg: "e",
            };

            try {
                setLoading(true);
                const resp = await getMotorPremiumPV(payload);

                if (resp?.process_result === false) {
                    const msg = resp?.error_list?.[0]?.error_message || "Failed to calculate premium";
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
                    }),
                );

                goToStep(3);
            } catch (err: any) {
                let msg = "Failed to calculate premium";
                try {
                    msg = JSON.parse(err?.message || "")?.error_list?.[0]?.error_message || msg;
                } catch {
                    msg = err?.message || msg;
                }
                setInlineError(msg);
                toast.error(msg);
            } finally {
                setLoading(false);
            }
        };

        // Render Third Party simplified form
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

                        <h1 className="text-lg font-bold text-black">Coverage Plan &mdash; Third Party</h1>
                    </div>

                    <p className="text-sm text-muted-foreground mb-8">Fill in the details to calculate your premium</p>

                    <Card className="mb-8">
                        <CardContent className="pt-6 space-y-5">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="ccRange">Cubic Capacity *</Label>
                                    <Select value={selectedCcRange} onValueChange={setSelectedCcRange}>
                                        <SelectTrigger id="ccRange" className="mt-2">
                                            <SelectValue placeholder="Select CC Range" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {CC_OPTIONS.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                            </div>
                            {inlineError && (
                                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                    {inlineError}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div className="flex justify-between">
                        <Button variant="outline" className="gap-2" onClick={() => goToStep(1)}>
                            <ArrowLeft className="w-4 h-4" /> BACK
                        </Button>
                        <Button size="lg" className="px-8" disabled={!isFormValid || loading} onClick={handleCalculate}>
                            {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Calculating...</> : "CALCULATE"}
                        </Button>
                    </div>
                </>
            );
        }

        // Render Comprehensive form (full details)
        return (
            <>
                <Button variant="ghost" className="mb-4 gap-2" onClick={() => goToStep(1)}>
                    <ArrowLeft className="w-4 h-4" /> Back
                </Button>

                <h1 className="text-2xl font-bold mb-2">Coverage Plan &mdash; Comprehensive</h1>
                <p className="text-sm text-muted-foreground mb-8">Fill in your vehicle details to get an instant quote</p>

                <Card className="mb-8">
                    <CardContent className="pt-6 space-y-5">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="category">Category *</Label>
                                <Select value={category} onValueChange={(v) => { setCategory(v); setVoluntaryExcess(""); }}>
                                    <SelectTrigger id="category" className="mt-2">
                                        <SelectValue placeholder="Select Category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CATEGORIES.map((c) => (
                                            <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="year">Year Of Manufacture *</Label>
                                <Select value={yearOfManufacture} onValueChange={setYearOfManufacture}>
                                    <SelectTrigger id="year" className="mt-2">
                                        <SelectValue placeholder="Select Year" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {years.map((y) => (<SelectItem key={y} value={y}>{y}</SelectItem>))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="ccRange">Cubic Capacity *</Label>
                                <Select value={selectedCcRange} onValueChange={setSelectedCcRange}>
                                    <SelectTrigger id="ccRange" className="mt-2">
                                        <SelectValue placeholder="Select CC Range" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CC_OPTIONS.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
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
                                    className="mt-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    placeholder="Enter vehicle cost"
                                    value={vehicleCost}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        if (value === "" || /^\d+$/.test(value)) setVehicleCost(value);
                                    }}
                                />
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="voluntaryExcess">Voluntary Excess *</Label>
                                <Select value={voluntaryExcess} onValueChange={setVoluntaryExcess}>
                                    <SelectTrigger id="voluntaryExcess" className="mt-2">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(category === "2" ? VOLUNTARY_EXCESS_ID2 : VOLUNTARY_EXCESS_ID1).map((v) => (
                                            <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-orange-600 mt-1">The sum you bear towards a claim for a premium discount.</p>
                            </div>
                            <div>
                                <Label>Compulsory Excess</Label>
                                <Input className="mt-2" value="500" disabled />
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <Label>P.A. to Driver</Label>
                                <Input type="number" className="mt-2" value={paDriver} disabled />
                            </div>
                            <div>
                                <Label>No of Seat (Including Driver)</Label>
                                <Input type="number" className="mt-2" value={noOfSeat} disabled />
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <Label>P.A. to Passenger</Label>
                                <Input type="number" className="mt-2" value={paPassenger} disabled />
                            </div>
                            <div>
                                <Label htmlFor="noClaimYear">Claim Discount Year</Label>
                                <Select value={noClaimYear} onValueChange={setNoClaimYear}>
                                    <SelectTrigger id="noClaimYear" className="mt-2">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {["0", "1", "2", "3", "4", "5"].map((y) => (
                                            <SelectItem key={y} value={y}>{y} {y === "1" ? "Year" : "Years"}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4 pt-2">
                            <div className="flex items-center gap-3">
                                <Switch id="directDiscount" checked={directDiscount} onCheckedChange={setDirectDiscount} />
                                <Label htmlFor="directDiscount" className="cursor-pointer">Direct discount?</Label>
                            </div>
                        </div>

                        {inlineError && (
                            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                {inlineError}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="flex justify-between">
                    <Button variant="outline" className="gap-2" onClick={() => goToStep(1)}>
                        <ArrowLeft className="w-4 h-4" /> BACK
                    </Button>
                    <Button size="lg" className="px-8" disabled={!isFormValid || loading} onClick={handleCalculate}>
                        {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Calculating...</> : "CALCULATE"}
                    </Button>
                </div>
            </>
        );
    };

    /* ────────────────────────────────────────────────────────────────────────────
       STEP 3 — Premium Details
       ──────────────────────────────────────────────────────────────────────────── */

 const Step3PremiumDetails = () => {
    type RowType = "normal" | "section" | "less" | "subtotal" | "total";

    type PremiumTableRow = {
        key: string;
        label: string;
        value?: number | string | null;
        type?: RowType;
    };

    const insurancePlan = localStorage.getItem("motor.insurancePlan") || "comprehensive";
    const isThirdParty = insurancePlan === "third-party";

    const premiumData = useMemo<GetPremiumResponse | null>(() => {
        try {
            return JSON.parse(localStorage.getItem("motor.premiumResponse") || "null") as GetPremiumResponse | null;
        } catch {
            return null;
        }
    }, []);

    const coverageForm = useMemo(() => {
        try { return JSON.parse(localStorage.getItem("motor.coverageForm") || "null"); } catch { return null; }
    }, []);

    const amount: PremiumAmountInfo | undefined = premiumData?.amount_info;
    const hasData = !!amount;

    const getValue = (
        obj: PremiumAmountInfo | GetPremiumResponse | undefined | null,
        keys: string[],
        fallback: number | string = 0
    ): number | string => {
        if (!obj) return fallback;

        for (const key of keys) {
            const value = obj[key as keyof typeof obj];

            if (
                value !== undefined &&
                value !== null &&
                value !== ""
            ) {
                if (
                    typeof value === "string" ||
                    typeof value === "number"
                ) {
                    return value;
                }
            }
        }

        return fallback;
    };

    const toNumber = (value: number | string | null | undefined): number => {
        const num = Number(value ?? 0);
        return Number.isFinite(num) ? num : 0;
    };

    const formatLabel = (key: string) => {
        return key
            .replace(/_/g, " ")
            .replace(/\b\w/g, (char) => char.toUpperCase());
    };

    const formatAmount = (value: number | string | null | undefined) => {
        if (value === null || value === undefined || value === "") return "—";
        return fmt(value);
    };

    const ownDamagePremium = getValue(amount, [
        "premium_amount",
        "own_damage_premium",
        "od_premium",
    ]);

    const oldVehicleCharge = getValue(amount, ["old_vehicle_charge"]);

    const voluntaryExcess = getValue(amount, [
        "voluntary_excess_amount",
        "voluntary_excess_discount",
    ]);

    const noClaimDiscount = getValue(amount, [
        "no_claim_discount_amount",
        "ncd_amount",
    ]);

    const directDiscount = getValue(premiumData, ["direct_discount_amount"]);

    const basicPremiumFromApi = getValue(amount, ["basic_premium"]);

    const basicPremium =
        toNumber(basicPremiumFromApi) > 0
            ? basicPremiumFromApi
            : toNumber(ownDamagePremium) +
              toNumber(oldVehicleCharge) -
              toNumber(voluntaryExcess) -
              toNumber(noClaimDiscount) -
              toNumber(directDiscount);

    const thirdPartyPremium = getValue(amount, [
        "tpl_amount",
        "third_party_premium",
    ]);

    const thirdPartyNcd = getValue(amount, [
        "tpl_no_claim_discount_amount",
        "third_party_no_claim_discount_amount",
        "third_party_ncd_amount",
    ]);

    const finalThirdPartyPremium =
        toNumber(thirdPartyPremium) - toNumber(thirdPartyNcd);

    const rsd = getValue(amount, ["rsd_amount", "rsd"]);
    const rsdRider = getValue(amount, ["rsd_rider_amount", "rsd_rider"]);
    const rsdPassenger = getValue(amount, ["rsd_passenger_amount", "rsd_passenger"]);

    const poolPremiumFromApi = getValue(amount, ["pool_amount"]);

    const poolPremium =
        toNumber(poolPremiumFromApi) > 0
            ? poolPremiumFromApi
            : toNumber(rsd) + toNumber(rsdRider) + toNumber(rsdPassenger);

    const taxableAmount = getValue(amount, [
        "taxable_amount",
        "subtotal_amount",
    ]);

    const subTotalABC =
        toNumber(taxableAmount) > 0
            ? taxableAmount
            : toNumber(basicPremium) + toNumber(finalThirdPartyPremium) + toNumber(poolPremium);

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
                  key: "taxable_amount",
                  label: "Sub Total",
                  value: subTotalABC,
                  type: "subtotal",
              },
              {
                  key: "vat_amount",
                  label: `Add : VAT ${vatPercent}%`,
                  value: vatAmount,
              },
              {
                  key: "stamp_duty",
                  label: "Add : Stamp Duty",
                  value: stampDuty,
              },
              {
                  key: "total_premium",
                  label: "Total Premium",
                  value: totalPremium,
                  type: "total",
              },
          ]
        : [
              
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
                  value: voluntaryExcess,
                  type: "less",
              },
              {
                  key: "subtotal_2",
                  label: "Sub Total",
                  value:
                      toNumber(ownDamagePremium) +
                      toNumber(oldVehicleCharge) -
                      toNumber(voluntaryExcess),
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
                      toNumber(voluntaryExcess) -
                      toNumber(noClaimDiscount),
                  type: "subtotal",
              },
              {
                  key: "direct_discount",
                  label: "Less : Direct Discount",
                  value: directDiscount,
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
                  label: "Pool Premium(C)",
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
                  label: "Sub Total(A+B+C)",
                  value: subTotalABC,
                  type: "subtotal",
              },
              {
                  key: "vat_amount",
                  label: `Add : VAT ${vatPercent}%`,
                  value: vatAmount,
              },
              {
                  key: "stamp_duty",
                  label: "Add : Stamp Duty",
                  value: stampDuty,
              },
              {
                  key: "total_premium",
                  label: "Total Premium",
                  value: totalPremium,
                  type: "total",
              },
          ];

    const usedKeys = new Set([
        "premium_amount",
        "own_damage_premium",
        "od_premium",
        "old_vehicle_charge",
        "voluntary_excess_amount",
        "voluntary_excess_discount",
        "no_claim_discount_amount",
        "ncd_amount",
        "basic_premium",
        "tpl_amount",
        "third_party_premium",
        "tpl_no_claim_discount_amount",
        "third_party_no_claim_discount_amount",
        "third_party_ncd_amount",
        "pool_amount",
        "rsd_amount",
        "rsd",
        "rsd_rider_amount",
        "rsd_rider",
        "rsd_passenger_amount",
        "rsd_passenger",
        "taxable_amount",
        "subtotal_amount",
        "vat_percent",
        "vat_amount",
        "stamp_duty",
        "total_amount",
        "total_premium",
        "payable_amount",
    ]);

    const extraRows = amount
        ? Object.entries(amount)
              .filter(([key]) => !usedKeys.has(key))
              .map(([key, value]) => ({
                  key,
                  label: formatLabel(key),
                  value,
              }))
        : [];

    const getRowClass = (type?: RowType, index?: number) => {
        if (type === "section") return "bg-muted/70";
        if (type === "total") return "bg-primary/10 border-t-2 border-primary/30";
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
        if (type === "total") return "font-bold text-primary text-base";
        if (type === "subtotal") return "font-semibold text-foreground";
        if (type === "less") return "font-medium text-red-600";
        return "font-medium text-foreground";
    };

    return (
        <>
            <Button variant="ghost" className="mb-4 gap-2" onClick={() => goToStep(2)}>
                <ArrowLeft className="w-4 h-4" /> Back
            </Button>

            <div className="mb-6">
                <h1 className="text-lg font-bold text-black">Premium Details</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    {isThirdParty ? "Third Party Insurance" : "Comprehensive Insurance"} calculation breakdown
                </p>
            </div>

                {coverageForm && (
                <Card className="mb-6">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Vehicle Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-2 gap-x-8">
                            <InfoRow label="Insurance Plan" value={isThirdParty ? "Third Party" : "Comprehensive"} />
                            {!isThirdParty && (
                                <InfoRow
                                    label="Category"
                                    value={CATEGORIES.find(c => c.value === coverageForm.category)?.label ?? "—"}
                                />
                            )}
                            {!isThirdParty && (
                                <InfoRow label="Year of Manufacture" value={coverageForm.yearOfManufacture || "—"} />
                            )}
                            <InfoRow
                                label="Cubic Capacity"
                                value={CC_OPTIONS.find(c => c.value === coverageForm.selectedCcRange)?.label ?? "—"}
                            />
                            {!isThirdParty && (
                                <InfoRow label="Vehicle Cost (NPR)" value={fmt(coverageForm.vehicleCost)} />
                            )}
                            {!isThirdParty && (
                                <InfoRow label="Voluntary Excess" value={fmt(coverageForm.voluntaryExcess)} />
                            )}
                            <InfoRow label="Compulsory Excess" value="500" />
                            {!isThirdParty && (
                                <InfoRow
                                    label="No Claim Discount Year"
                                    value={`${coverageForm.noClaimYear ?? 0} ${Number(coverageForm.noClaimYear) === 1 ? "Year" : "Years"}`}
                                />
                            )}
                            <InfoRow label="Effective Date" value={coverageForm.effectiveDate || "—"} />
                            <InfoRow label="Expiry Date" value={coverageForm.expiryDate || "—"} />
                            {!isThirdParty && (
                                <InfoRow label="Direct Discount" value={coverageForm.directDiscount ? "Yes" : "No"} />
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {!hasData && (
                <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-700 mb-6">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    No premium data found. Please go back and calculate first.
                </div>
            )}

            {hasData && (
                <div className="space-y-2">
                    <Card> 
                        <CardContent className='mt-3'>
                            <div className="rounded-lg overflow-hidden border">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-primary text-primary-foreground">
                                            <th className="text-left px-5 py-3 font-semibold">
                                                Description
                                            </th>
                                            <th className="text-right px-5 py-3 font-semibold">
                                                Amount (NPR)
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {calculationRows.map((row, index) => (
                                            <tr
                                                key={row.key}
                                                className={getRowClass(row.type, index)}
                                            >
                                                <td className={`px-5 py-3 ${getLabelClass(row.type)}`}>
                                                    {row.label}
                                                </td>
                                                <td className={`px-5 py-3 text-right ${getValueClass(row.type)}`}>
                                                    {row.type === "section" ? "" : formatAmount(row.value)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            <div className="flex mt-6 gap-2">
                <Button variant="outline" className="gap-2" onClick={() => goToStep(2)}>
                    <ArrowLeft className="w-4 h-4" /> Back
                </Button>
            </div>
        </>
    );
};


    /* ────────────────────────────────────────────────────────────────────────────
       RENDER
       ──────────────────────────────────────────────────────────────────────────── */

    switch (currentStep) {
        case 1: return <Step1CoveragePlan />;
        case 2: return <Step2VehicleDetails />;
        case 3: return <Step3PremiumDetails />;
        default: return <Step1CoveragePlan />;
    }
};