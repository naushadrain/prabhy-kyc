import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ArrowLeft, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useMemo, useCallback, useEffect, } from 'react';
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
import {
    getVehicleCategories,
    getVehicleSubCategories,
    getVehicleAgeBands,
    type CatalogueItem,
} from '@/api/motor/getMotorCatalogue';
import { PremiumAmountInfo, GetPremiumResponse } from '@/types/getpremium';
/* ──────────────────────────────────────────────────────────────────────────────
   Constants
   ────────────────────────────────────────────────────────────────────────────── */

const CC_OPTIONS = [
    { value: "less_than_1000", label: "Less than 1000 CC", cc_value: "900" },
    { value: "1000_to_1600", label: "1000 CC to 1600 CC", cc_value: "1300" },
    { value: "above_1600", label: "Above 1600 CC", cc_value: "1700" },
];

const VOLUNTARY_EXCESS_ID1 = [
    { value: "1000", label: "1000" },
    { value: "2000", label: "2,000" },
    { value: "5000", label: "5,000" },
    { value: "10000", label: "10,000" }
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

export const PrivateVehiclePage = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const currentStep = Number(searchParams.get("step")) || 1;

    const goToStep = useCallback(
        (step: number) => {
            setSearchParams({ step: String(step) });
        },
        [setSearchParams],
    );

    const vehicleType = localStorage.getItem('motor.vehicleType') || 'private';
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
                        className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-gray-100"
                        onClick={() => navigate('/login')}
                    >
                        <ChevronLeft className="h-5 w-5 text-black" />
                    </button>

                    <div>
                        <h1 className="text-2xl font-bold text-black">{planTitle}</h1>
                        <p className="mt-1 text-sm text-muted-foreground">Select insurance type to continue.</p>
                    </div>
                </div>

                <div className="grid max-w-5xl gap-6 md:grid-cols-2">
                    <Card
                        className="cursor-pointer border-2 p-6 transition-all hover:-translate-y-1 hover:border-primary hover:shadow-xl"
                        onClick={() => handlePlanSelect('comprehensive')}
                    >
                        <h3 className="mb-2 text-center text-lg font-bold">Comprehensive Insurance</h3>
                        <div className="my-8 flex justify-center">
                            <div className="flex h-32 w-32 items-center justify-center rounded-full bg-primary/10">
                                <svg viewBox="0 0 100 100" className="h-full w-full p-6">
                                    <path d="M50 10 L65 25 L65 50 L50 60 L35 50 L35 25 Z" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" />
                                    <circle cx="50" cy="35" r="8" fill="hsl(var(--primary))" />
                                    <path d="M42 42 L42 50 L58 50 L58 42" fill="hsl(var(--primary))" />
                                </svg>
                            </div>
                        </div>
                        <p className="text-center text-xs text-muted-foreground">Covers own damage and third-party damages.</p>
                    </Card>

                    <Card
                        className="cursor-pointer border-2 p-6 transition-all hover:-translate-y-1 hover:border-primary hover:shadow-xl"
                        onClick={() => handlePlanSelect('third-party')}
                    >
                        <h3 className="mb-2 text-center text-lg font-bold">Third Party Insurance</h3>
                        <div className="my-8 flex justify-center">
                            <div className="flex h-32 w-32 items-center justify-center rounded-full bg-primary/10">
                                <svg viewBox="0 0 100 100" className="h-full w-full p-6">
                                    <path d="M50 10 L65 25 L65 50 L50 60 L35 50 L35 25 Z" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" />
                                    <path d="M42 32 L48 38 L58 28" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M40 45 L40 52 L60 52 L60 45" fill="hsl(var(--primary))" />
                                </svg>
                            </div>
                        </div>
                        <p className="text-center text-xs text-muted-foreground">Covers only third-party damages.</p>
                    </Card>
                </div>

                <div className="mt-8 grid max-w-5xl gap-4 md:grid-cols-2">
                    <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                        <p className="text-sm text-green-700">Comprehensive insurance covers own damage and third-party damage.</p>
                    </div>
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                        <p className="text-sm text-blue-700">Third-party insurance covers third-party damage only.</p>
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
        const [voluntaryExcess, setVoluntaryExcess] = useState<string>(savedCoverage?.voluntaryExcess || "");
        const paDriver = "500000";
        const [noOfSeat, setNoOfSeat] = useState<string>(savedCoverage?.noOfSeat || "5");
        const paPassenger = "500000";
        const effectiveDate = todayISO();
        const [coverStrikeDamage, setCoverStrikeDamage] = useState<boolean>(savedCoverage?.coverStrikeDamage ?? true);
        const [noClaimYear, setNoClaimYear] = useState<string>(savedCoverage?.noClaimYear || "0");
        const directDiscount = true;
        const [privateRent, setPrivateRent] = useState<string>(savedCoverage?.privateRent || "no");
        const [towingCharge, setTowingCharge] = useState<string>(savedCoverage?.towingCharge || "no");
        const [rsdTerrorismRisk, setRsdTerrorismRisk] = useState<string>(savedCoverage?.rsdTerrorismRisk || "no");
        const [loading, setLoading] = useState(false);
        const [inlineError, setInlineError] = useState<string | null>(null);
        const [topCategory, setTopCategory] = useState<string>(savedCoverage?.topCategory || "");
        const [topCategories, setTopCategories] = useState<CatalogueItem[]>([]);
        const [topCategoriesLoading, setTopCategoriesLoading] = useState(false);
        const [categories, setCategories] = useState<CatalogueItem[]>([]);
        const [categoriesLoading, setCategoriesLoading] = useState(false);
        const [compulsoryExcess, setCompulsoryExcess] = useState<string>(savedCoverage?.compulsoryExcess || "500");
        const [compulsoryLoading, setCompulsoryLoading] = useState(false);
        const [errors, setErrors] = useState<Record<string, string>>({});

        const clearErr = (field: string) => {
            setErrors((prev) => {
                if (!prev[field]) return prev;
                const next = { ...prev };
                delete next[field];
                return next;
            });
        };

        // Top-level Category (catalogue_type=01) — filtered to additional_value === "MCY"
        useEffect(() => {
            let cancelled = false;
            setTopCategoriesLoading(true);
            getVehicleCategories()
                .then((list) => {
                    if (cancelled) return;
                    const filtered = list.filter((c) => c.additional_value === "PV");
                    setTopCategories(filtered);
                })
                .catch((err) => { if (!cancelled) toast.error(err?.message || "Failed to load categories"); })
                .finally(() => { if (!cancelled) setTopCategoriesLoading(false); });
            return () => { cancelled = true; };
        }, []);

        // Sub-Category (catalogue_type=05) — id = selected top-category's data
        useEffect(() => {
            if (!topCategory) { setCategories([]); return; }
            let cancelled = false;
            setCategoriesLoading(true);
            getVehicleSubCategories(topCategory)
                .then((list) => { if (!cancelled) setCategories(list); })
                .catch((err) => { if (!cancelled) toast.error(err?.message || "Failed to load sub-categories"); })
                .finally(() => { if (!cancelled) setCategoriesLoading(false); });
            return () => { cancelled = true; };
        }, [topCategory]);

        // When year changes, fetch the age-band catalogue (type=41, id=02,
        // additional_field1 = vehicle age in years) and use the returned
        // value as the Compulsory Excess amount.
        useEffect(() => {
            if (!yearOfManufacture) return;
            const age = new Date().getFullYear() - Number(yearOfManufacture);
            if (!Number.isFinite(age) || age < 0) return;
            let cancelled = false;
            setCompulsoryLoading(true);
            getVehicleAgeBands("02", String(age))
                .then((list) => {
                    if (cancelled) return;
                    const first = list?.[0];
                    const amount = first?.additional_value || first?.data || first?.value;
                    if (amount) setCompulsoryExcess(String(amount));
                })
                .catch((err) => { if (!cancelled) toast.error(err?.message || "Failed to load compulsory excess"); })
                .finally(() => { if (!cancelled) setCompulsoryLoading(false); });
            return () => { cancelled = true; };
        }, [yearOfManufacture]);

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

        const validate = (): Record<string, string> => {
            const e: Record<string, string> = {};
            if (!topCategory) e.topCategory = "Category is required";
            if (!category) e.category = "Sub Category is required";
            if (!selectedCcRange) e.selectedCcRange = "Cubic Capacity is required";
            if (!isThirdParty) {
                if (!yearOfManufacture) e.yearOfManufacture = "Year Of Manufacture is required";
                if (!vehicleCost.trim()) {
                    e.vehicleCost = "Vehicle Cost is required";
                } else if (!/^\d+$/.test(vehicleCost) || Number(vehicleCost) <= 0) {
                    e.vehicleCost = "Enter a valid vehicle cost";
                }
                if (!voluntaryExcess) e.voluntaryExcess = "Voluntary Excess is required";
                if (!noClaimYear) e.noClaimYear = "Claim Discount Year is required";
            }
            return e;
        };

        const handleCalculate = async () => {
            setInlineError(null);
            const errMap = validate();
            setErrors(errMap);
            if (Object.keys(errMap).length > 0) {
                toast.error("Please fix the highlighted fields");
                return;
            }

            const currentYear = new Date().getFullYear();
            const vehicleAge = isThirdParty ? 0 : currentYear - Number(yearOfManufacture || currentYear);
            const ccValue = getCcValue();
            const selectedCategory = categories.find((c) => c.data === category);
            const classId = selectedCategory?.additional_value || "2";

            const payload: GetPremiumRequestPV = {
                class_id: classId,
                cover_type_id: isThirdParty ? "Third Party" : "Comprehensive",
                is_government: "1",
                engine_capcity_cc: ccValue,
                driver_seat_capacity: "1",
                passenger_seat_capacity: String(Math.max(0, Number(noOfSeat) - 1)),
                compulsory_excess: isThirdParty ? "0" : (compulsoryExcess || "500"),
                voluntary_excess: isThirdParty ? "0" : voluntaryExcess,
                vehicle_age_in_years: String(vehicleAge),
                vehicle_suminsured_amount: isThirdParty ? "0" : vehicleCost,
                calc_type: "p",
                noclaim_year: isThirdParty ? "0" : noClaimYear,
                is_tailor: "false",
                get_direct_discount: isThirdParty ? "n" : "y",
                vehicle_reg: "e",
                // conductor_helper_seat_capacity: "1",
                include_towing_charge: isThirdParty ? "false" : (towingCharge === "yes" ? "true" : "false"),
                include_personal_use_discount: isThirdParty ? "false" : (privateRent === "yes" ? "true" : "false"),
                include_rsd_charge: rsdTerrorismRisk === "yes" ? "true" : "false",
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
                        topCategory,
                        category,
                        categoryLabel: selectedCategory?.value || "",
                        classId,
                        yearOfManufacture,
                        selectedCcRange,
                        ccValue,
                        noOfSeat,
                        vehicleCost: isThirdParty ? "" : vehicleCost,
                        voluntaryExcess: isThirdParty ? "" : voluntaryExcess,
                        compulsoryExcess,
                        effectiveDate,
                        expiryDate,
                        noClaimYear: isThirdParty ? "" : noClaimYear,
                        coverStrikeDamage: isThirdParty ? false : coverStrikeDamage,
                        directDiscount,
                        privateRent,
                        towingCharge,
                        rsdTerrorismRisk,
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
                    <div className="mb-6 flex items-center gap-3">
                        <button
                            type="button"
                            className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-gray-100"
                            onClick={() => goToStep(1)}
                        >
                            <ChevronLeft className="h-5 w-5 text-black" />
                        </button>
                        <h1 className="text-2xl font-bold mb-2"> Coverage Plan &mdash; Third Party</h1>

                    </div>

                    <p className="text-sm text-muted-foreground mb-8">Fill in the details to calculate your premium</p>

                    <Card className="mb-8">
                        <CardContent className="pt-6 space-y-5">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="topCategory">Category *</Label>
                                    <Select value={topCategory} onValueChange={(v) => { setTopCategory(v); setCategory(""); setVoluntaryExcess(""); clearErr("topCategory"); }} disabled={topCategoriesLoading}>
                                        <SelectTrigger id="topCategory" className={`mt-2 ${errors.topCategory ? "border-red-500" : ""}`}>
                                            <SelectValue placeholder={topCategoriesLoading ? "Loading..." : "Select Category"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {topCategories.map((c) => (
                                                <SelectItem key={c.data} value={c.data}>{c.value}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.topCategory && <p className="text-xs text-red-600 mt-1">{errors.topCategory}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="category">Sub Category *</Label>
                                    <Select value={category} onValueChange={(v) => { setCategory(v); setVoluntaryExcess(""); clearErr("category"); }} disabled={!topCategory || categoriesLoading}>
                                        <SelectTrigger id="category" className={`mt-2 ${errors.category ? "border-red-500" : ""}`}>
                                            <SelectValue placeholder={!topCategory ? "Select Category first" : categoriesLoading ? "Loading..." : "Select Sub Category"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map((c) => (
                                                <SelectItem key={c.data} value={c.data}>{c.value}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.category && <p className="text-xs text-red-600 mt-1">{errors.category}</p>}
                                </div>

                                <div>
                                    <Label htmlFor="ccRange">Cubic Capacity *</Label>
                                    <Select value={selectedCcRange} onValueChange={(v) => { setSelectedCcRange(v); clearErr("selectedCcRange"); }}>
                                        <SelectTrigger id="ccRange" className={`mt-2 ${errors.selectedCcRange ? "border-red-500" : ""}`}>
                                            <SelectValue placeholder="Select CC Range" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {CC_OPTIONS.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.selectedCcRange && <p className="text-xs text-red-600 mt-1">{errors.selectedCcRange}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="noOfSeatTp">No of Seat (Including Driver)</Label>
                                    <Input
                                        id="noOfSeatTp"
                                        type="number"
                                        min={1}
                                        className="mt-2"
                                        value={noOfSeat}
                                        onChange={(e) => {
                                            const v = e.target.value;
                                            if (v === "" || /^\d+$/.test(v)) setNoOfSeat(v);
                                        }}
                                    />
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
                        <Button size="lg" className="px-8" disabled={loading} onClick={handleCalculate}>
                            {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Calculating...</> : "CALCULATE"}
                        </Button>
                    </div>
                </>
            );
        }

        // Render Comprehensive form (full details)
        return (
            <>
                <div className="mb-6 flex items-center gap-3">
                    <button
                        type="button"
                        className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-gray-100"
                        onClick={() => goToStep(1)}
                    >
                        <ChevronLeft className="h-5 w-5 text-black" />
                    </button>

                    <h1 className="text-2xl font-bold mb-2">Coverage Plan &mdash; Comprehensive</h1>
                </div>

                <p className="text-sm text-muted-foreground mb-8">Fill in your vehicle details to get an instant quote</p>

                <Card className="mb-8">
                    <CardContent className="pt-6 space-y-5">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="topCategory">Category *</Label>
                                <Select value={topCategory} onValueChange={(v) => { setTopCategory(v); setCategory(""); setVoluntaryExcess(""); clearErr("topCategory"); }} disabled={topCategoriesLoading}>
                                    <SelectTrigger id="topCategory" className={`mt-2 ${errors.topCategory ? "border-red-500" : ""}`}>
                                        <SelectValue placeholder={topCategoriesLoading ? "Loading..." : "Select Category"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {topCategories.map((c) => (
                                            <SelectItem key={c.data} value={c.data}>{c.value}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.topCategory && <p className="text-xs text-red-600 mt-1">{errors.topCategory}</p>}
                            </div>
                            <div>
                                <Label htmlFor="category">Sub Category *</Label>
                                <Select value={category} onValueChange={(v) => { setCategory(v); setVoluntaryExcess(""); clearErr("category"); }} disabled={!topCategory || categoriesLoading}>
                                    <SelectTrigger id="category" className={`mt-2 ${errors.category ? "border-red-500" : ""}`}>
                                        <SelectValue placeholder={!topCategory ? "Select Category first" : categoriesLoading ? "Loading..." : "Select Sub Category"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((c) => (
                                            <SelectItem key={c.data} value={c.data}>{c.value}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.category && <p className="text-xs text-red-600 mt-1">{errors.category}</p>}
                            </div>
                            <div>
                                <Label htmlFor="year">Year Of Manufacture *</Label>
                                <Select value={yearOfManufacture} onValueChange={(v) => { setYearOfManufacture(v); clearErr("yearOfManufacture"); }}>
                                    <SelectTrigger id="year" className={`mt-2 ${errors.yearOfManufacture ? "border-red-500" : ""}`}>
                                        <SelectValue placeholder="Select Year" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {years.map((y) => (<SelectItem key={y} value={y}>{y}</SelectItem>))}
                                    </SelectContent>
                                </Select>
                                {errors.yearOfManufacture && <p className="text-xs text-red-600 mt-1">{errors.yearOfManufacture}</p>}
                            </div>
                            <div>
                                <Label>Compulsory Excess</Label>
                                <Input className="mt-2" value={compulsoryLoading ? "Loading..." : compulsoryExcess} disabled />
                            </div>

                            <div>
                                <Label htmlFor="ccRange">Cubic Capacity *</Label>
                                <Select value={selectedCcRange} onValueChange={(v) => { setSelectedCcRange(v); clearErr("selectedCcRange"); }}>
                                    <SelectTrigger id="ccRange" className={`mt-2 ${errors.selectedCcRange ? "border-red-500" : ""}`}>
                                        <SelectValue placeholder="Select CC Range" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CC_OPTIONS.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.selectedCcRange && <p className="text-xs text-red-600 mt-1">{errors.selectedCcRange}</p>}
                            </div>
                            <div>
                                <Label htmlFor="vehicleCost">Vehicle Cost (NPR) *</Label>
                                <Input
                                    id="vehicleCost"
                                    type="text"
                                    inputMode="numeric"
                                    className={`mt-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${errors.vehicleCost ? "border-red-500" : ""}`}
                                    placeholder="Enter vehicle cost"
                                    value={vehicleCost}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        if (value === "" || /^\d+$/.test(value)) { setVehicleCost(value); clearErr("vehicleCost"); }
                                    }}
                                />
                                {errors.vehicleCost && <p className="text-xs text-red-600 mt-1">{errors.vehicleCost}</p>}
                            </div>
                            <div>
                                <Label htmlFor="voluntaryExcess">Voluntary Excess *</Label>
                                <Select value={voluntaryExcess} onValueChange={(v) => { setVoluntaryExcess(v); clearErr("voluntaryExcess"); }}>
                                    <SelectTrigger id="voluntaryExcess" className={`mt-2 ${errors.voluntaryExcess ? "border-red-500" : ""}`}>
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {VOLUNTARY_EXCESS_ID1.map((v) => (
                                            <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.voluntaryExcess
                                    ? <p className="text-xs text-red-600 mt-1">{errors.voluntaryExcess}</p>
                                    : <p className="text-xs text-orange-600 mt-1">The sum you bear towards a claim for a premium discount.</p>}
                            </div>
                            <div>
                                <Label htmlFor="privateRent">Private Rent</Label>
                                <Select value={privateRent} onValueChange={setPrivateRent}>
                                    <SelectTrigger id="privateRent" className="mt-2">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="yes">Yes</SelectItem>
                                        <SelectItem value="no">No</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="towingCharge">Towing Charge</Label>
                                <Select value={towingCharge} onValueChange={setTowingCharge}>
                                    <SelectTrigger id="towingCharge" className="mt-2">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="yes">Yes</SelectItem>
                                        <SelectItem value="no">No</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="rsdTerrorismRisk">RS/MD/ST Risk</Label>
                                <Select value={rsdTerrorismRisk} onValueChange={setRsdTerrorismRisk}>
                                    <SelectTrigger id="rsdTerrorismRisk" className="mt-2">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="yes">Yes</SelectItem>
                                        <SelectItem value="no">No</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label>P.A. to Driver</Label>
                                <Input type="number" className="mt-2" value={paDriver} disabled />
                            </div>
                            <div>
                                <Label htmlFor="noOfSeat">No of Seat (Including Driver)</Label>
                                <Input
                                    id="noOfSeat"
                                    type="number"
                                    min={1}
                                    className="mt-2"
                                    value={noOfSeat}
                                    onChange={(e) => {
                                        const v = e.target.value;
                                        if (v === "" || /^\d+$/.test(v)) setNoOfSeat(v);
                                    }}
                                />
                            </div>
                            <div>
                                <Label>P.A. to Passenger</Label>
                                <Input type="number" className="mt-2" value={paPassenger} disabled />
                            </div>
                            <div>
                                <Label htmlFor="noClaimYear">Claim Discount Year *</Label>
                                <Select value={noClaimYear} onValueChange={(v) => { setNoClaimYear(v); clearErr("noClaimYear"); }}>
                                    <SelectTrigger id="noClaimYear" className={`mt-2 ${errors.noClaimYear ? "border-red-500" : ""}`}>
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {["0", "1", "2", "3", "4", "5"].map((y) => (
                                            <SelectItem key={y} value={y}>{y} {y === "1" ? "Year" : "Years"}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.noClaimYear && <p className="text-xs text-red-600 mt-1">{errors.noClaimYear}</p>}
                            </div>
                            <div className="flex items-center gap-3 mt-4">
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
                    <Button size="lg" className="px-8" disabled={loading} onClick={handleCalculate}>
                        {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Calculating...</> : "CALCULATE"}
                    </Button>
                </div>
            </>
        );
    };

    const Step3PremiumDetails = () => {
        type RowType = "normal" | "section" | "less" | "subtotal" | "total" | "divider";

        type PremiumTableRow = {
            key: string;
            label: string;
            value?: number | string | null;
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

        const safeValue = (value: unknown): number | string | null => {
            if (typeof value === "number" || typeof value === "string") {
                return value;
            }

            return null;
        };

        const formatAmount = (value: number | string | null | undefined) => {
            if (value === null || value === undefined || value === "") return "—";
            return fmt(value);
        };

        const calculationRows: PremiumTableRow[] = isThirdParty
            ? [
                {
                    key: "third_party_section",
                    label: "Third Party Premium Calculation",
                    type: "section",
                },
                {
                    key: "tpl_amount",
                    label: "Third Party Premium as per CC",
                    value: safeValue(amount?.tpl_amount),
                },
                {
                    key: "pa_amount",
                    label: "Driver/Passenger Premium",
                    value: safeValue(amount?.pa_amount),
                },
                {
                    key: "vat_amount",
                    label: "VAT Amount",
                    value: safeValue(amount?.vat_amount),
                },
                {
                    key: "stamp_duty",
                    label: "Stamp Duty",
                    value: safeValue(amount?.stamp_duty),
                },
                {
                    key: "total_amount",
                    label: "Total Amount",
                    value: safeValue(amount?.total_amount),
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
                    label: "Basic Premium Amount",
                    value: safeValue(amount?.premium_amount),
                },
                // {
                //     key: "direct_discount_amount",
                //     label: "Direct Discount Amount",
                //     value: safeValue(
                //         (premiumData as Record<string, unknown> | null)
                //             ?.direct_discount_amount,
                //     ),
                //     type: "less",
                // },
                {
                    key: "pa_amount",
                    label: "Driver/Passenger Premium",
                    value: safeValue(amount?.pa_amount),
                },
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
                    label: "VAT Amount",
                    value: safeValue(amount?.vat_amount),
                },
                {
                    key: "stamp_duty",
                    label: "Stamp Duty",
                    value: safeValue(amount?.stamp_duty),
                },
                {
                    key: "total_premium_with_vat",
                    label: "Total Premium With VAT",
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
                        className="mt-1 flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100"
                        onClick={() => goToStep(2)}
                    >
                        <ChevronLeft className="h-5 w-5 text-black" />
                    </button>

                    <div>
                        <h1 className="text-xl font-bold text-black">
                            {isThirdParty
                                ? "Private Vehicle Third Party Premium Details"
                                : "Private Vehicle Comprehensive Premium Details"}
                        </h1>

                        <p className="mt-1 text-sm text-muted-foreground">
                            Review the premium amount, VAT, stamp duty, and final payable amount.
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

                                    if (row.type === "divider") {
                                        return (
                                            <tr key={row.key}>
                                                <td
                                                    colSpan={2}
                                                    className="border-t-2 border-slate-300 p-0"
                                                />
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
                                            className="border-b bg-[#fff7f3] last:border-b-0"
                                        >
                                            <td
                                                className={`border-r border-white px-4 py-3 ${row.type === "less"
                                                        ? "text-red-600"
                                                        : row.type === "subtotal"
                                                            ? "font-semibold text-black"
                                                            : "text-black"
                                                    }`}
                                            >
                                                {row.type === "less"
                                                    ? `Less : ${row.label}`
                                                    : row.label}
                                            </td>

                                            <td
                                                className={`px-4 py-3 text-right font-medium ${row.type === "less"
                                                        ? "text-red-600"
                                                        : row.type === "subtotal"
                                                            ? "font-semibold text-black"
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

    /* ────────────────────────────────────────────────────────────────────────────
       RENDER
       ──────────────────────────────────────────────────────────────────────────── */

    // Map in-page step (1=pick plan, 2=vehicle details, 3=premium) to global
    // stepper step. Public flow stops at "Premium Details" (3) — KYC steps 4/5
    // remain pending until the user signs in.
    const globalStep = currentStep >= 3 ? 3 : 2;

    const content = (() => {
        switch (currentStep) {
            case 1: return <Step1CoveragePlan />;
            case 2: return <Step2VehicleDetails />;
            case 3: return <Step3PremiumDetails />;
            default: return <Step1CoveragePlan />;
        }
    })();

    return (
        <>
            <div className="mb-0">
                {/* <MotorStepper steps={getMotorSteps(globalStep)} /> */}
            </div>
            {content}
        </>
    );
};