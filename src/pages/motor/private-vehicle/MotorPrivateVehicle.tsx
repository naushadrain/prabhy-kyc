import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, AlertCircle, Car, CheckCircle, ChevronLeft, DollarSign, FileText, Info, Loader2, Upload, X } from 'lucide-react';

import { toast } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import { getMotorPremiumPV, type GetPremiumRequestPV } from '@/api/motor/getpremium';
import { createMotorPolicy, type CreateMotorPolicyPayload } from '@/api/motor/createMotorPolicy';
import { uploadVehicleBack, uploadVehicleFront } from '@/api/policy/uploadPolicyDoc';
import { adIsoToBsYMD } from '@/zod/kycSchema';
import {
    getVehicleCategories,
    getVehicleSubCategories,
    getVehicleAgeBands,
    getZoneAbbreviations,
    getZoneLotNumbers,
    getVehicleKinds,
    getEmbossedStates,
    getEmbossedLotNumbers,
    getEmbossedVehicleKinds,
    type CatalogueItem,
} from '@/api/motor/getMotorCatalogue';
import type { GetPremiumResponse, PremiumAmountInfo } from '@/types/getpremium';

const CC_OPTIONS = [
    { value: 'less_than_1000', label: 'Less than 1000 CC', cc_value: '900' },
    { value: '1000_to_1600', label: '1000 CC to 1600 CC', cc_value: '1300' },
    { value: 'above_1600', label: 'Above 1600 CC', cc_value: '1700' },
];

const VOLUNTARY_EXCESS_OPTIONS = [
    { value: '1000', label: '1,000' },
    { value: '2000', label: '2,000' },
    { value: '5000', label: '5,000' },
    { value: '10000', label: '10,000' },
];

type FileState = { file: File; preview: string } | null;
type RowType = 'normal' | 'section' | 'less' | 'subtotal' | 'total';
type PremiumTableRow = { key: string; label: string; value?: number | string | null; type?: RowType };

function todayISO(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function addOneYear(dateISO: string): string {
    const d = new Date(dateISO || todayISO());
    d.setFullYear(d.getFullYear() + 1);
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getYearOptions(startYear = 1990): string[] {
    const currentYear = new Date().getFullYear();
    const years: string[] = [];
    for (let y = currentYear; y >= startYear; y -= 1) years.push(String(y));
    return years;
}

function safeJSON<T = any>(key: string, fallback: T | null = null): T | null {
    try {
        return JSON.parse(localStorage.getItem(key) || 'null') as T | null;
    } catch {
        return fallback;
    }
}

function fmt(value: number | string | undefined | null): string {
    const n = Number(value ?? 0);
    if (!Number.isFinite(n)) return '—';
    return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
    return (
        <div className="flex justify-between gap-4 py-2 border-b last:border-b-0">
            <span className="text-sm text-muted-foreground">{label}</span>
            <span className="text-sm font-medium text-right">{value ?? '—'}</span>
        </div>
    );
}

export const MotorPrivateVehiclePage = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const currentStep = Number(searchParams.get('step')) || 1;

    const goToStep = useCallback((step: number) => setSearchParams({ step: String(step) }), [setSearchParams]);

    const vehicleType = localStorage.getItem('motor.vehicleType') || 'private';
    const planTitle = vehicleType === 'two-wheeler' ? 'Two Wheeler Plan' : vehicleType === 'commercial' ? 'Commercial Vehicle Plan' : 'Private Vehicle Plan';

    const Step1CoveragePlan = () => {
        const handlePlanSelect = (planType: 'comprehensive' | 'third-party') => {
            localStorage.setItem('motor.insurancePlan', planType);
            goToStep(2);
        };

        return (
            <>
                <div className="mb-6 flex items-center gap-3">
                    <button type="button" className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-gray-100" onClick={() => navigate('/login')}>
                        <ChevronLeft className="h-5 w-5 text-black" />
                    </button>
                    <h1 className="text-lg font-bold text-black">{planTitle}</h1>
                </div>

                <p className="text-sm text-muted-foreground mb-4">Select the insurance plan that best suits you.</p>

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
            </>
        );
    };

    const Step2VehicleDetails = () => {
        const insurancePlan = localStorage.getItem('motor.insurancePlan') || 'comprehensive';
        const isThirdParty = insurancePlan === 'third-party';
        const savedCoverage = useMemo(() => safeJSON<any>('motor.coverageForm'), []);

        const [topCategory, setTopCategory] = useState(savedCoverage?.topCategory || '');
        const [category, setCategory] = useState(savedCoverage?.category || '');
        const [yearOfManufacture, setYearOfManufacture] = useState(savedCoverage?.yearOfManufacture || '');
        const [selectedCcRange, setSelectedCcRange] = useState(savedCoverage?.selectedCcRange || '');
        const [vehicleCost, setVehicleCost] = useState(savedCoverage?.vehicleCost || '');
        const [voluntaryExcess, setVoluntaryExcess] = useState(savedCoverage?.voluntaryExcess || '');
        const [compulsoryExcess, setCompulsoryExcess] = useState(savedCoverage?.compulsoryExcess || '500');
        const [noOfSeat, setNoOfSeat] = useState(savedCoverage?.noOfSeat || '5');
        const [noClaimYear, setNoClaimYear] = useState(savedCoverage?.noClaimYear || '0');
        const [directDiscount, setDirectDiscount] = useState(savedCoverage?.directDiscount ?? true);
        const [coverStrikeDamage, setCoverStrikeDamage] = useState(savedCoverage?.coverStrikeDamage ?? true);
        const [privateRent, setPrivateRent] = useState(savedCoverage?.privateRent || 'no');
        const [towingCharge, setTowingCharge] = useState(savedCoverage?.towingCharge || 'no');
        const [topCategories, setTopCategories] = useState<CatalogueItem[]>([]);
        const [categories, setCategories] = useState<CatalogueItem[]>([]);
        const [topCategoriesLoading, setTopCategoriesLoading] = useState(false);
        const [categoriesLoading, setCategoriesLoading] = useState(false);
        const [compulsoryLoading, setCompulsoryLoading] = useState(false);
        const [loading, setLoading] = useState(false);
        const [inlineError, setInlineError] = useState<string | null>(null);
        const [errors, setErrors] = useState<Record<string, string>>({});

        const effectiveDate = todayISO();
        const expiryDate = useMemo(() => addOneYear(effectiveDate), [effectiveDate]);
        const years = useMemo(() => getYearOptions(1990), []);
        const selectedCc = CC_OPTIONS.find((item) => item.value === selectedCcRange);

        const clearErr = (field: string) => {
            setErrors((prev) => {
                if (!prev[field]) return prev;
                const next = { ...prev };
                delete next[field];
                return next;
            });
        };

        useEffect(() => {
            let cancelled = false;
            setTopCategoriesLoading(true);
            getVehicleCategories()
                .then((list) => {
                    if (cancelled) return;
                    setTopCategories(list.filter((item) => item.additional_value === 'PV'));
                })
                .catch((err: any) => !cancelled && toast.error(err?.message || 'Failed to load categories'))
                .finally(() => !cancelled && setTopCategoriesLoading(false));
            return () => {
                cancelled = true;
            };
        }, []);

        useEffect(() => {
            if (!topCategory) {
                setCategories([]);
                return;
            }
            let cancelled = false;
            setCategoriesLoading(true);
            getVehicleSubCategories(topCategory)
                .then((list) => !cancelled && setCategories(list))
                .catch((err: any) => !cancelled && toast.error(err?.message || 'Failed to load sub-categories'))
                .finally(() => !cancelled && setCategoriesLoading(false));
            return () => {
                cancelled = true;
            };
        }, [topCategory]);

        useEffect(() => {
            if (!yearOfManufacture || isThirdParty) return;
            const age = new Date().getFullYear() - Number(yearOfManufacture);
            if (!Number.isFinite(age) || age < 0) return;
            let cancelled = false;
            setCompulsoryLoading(true);
            getVehicleAgeBands('02', String(age))
                .then((list) => {
                    if (cancelled) return;
                    const first = list?.[0];
                    const amount = first?.additional_value || first?.data || first?.value;
                    if (amount) setCompulsoryExcess(String(amount));
                })
                .catch((err: any) => !cancelled && toast.error(err?.message || 'Failed to load compulsory excess'))
                .finally(() => !cancelled && setCompulsoryLoading(false));
            return () => {
                cancelled = true;
            };
        }, [yearOfManufacture, isThirdParty]);

        const validate = () => {
            const e: Record<string, string> = {};
            if (!topCategory) e.topCategory = 'Category is required';
            if (!category) e.category = 'Sub Category is required';
            if (!selectedCcRange) e.selectedCcRange = 'Cubic Capacity is required';
            if (!noOfSeat || Number(noOfSeat) <= 0) e.noOfSeat = 'Seat number is required';
            if (!isThirdParty) {
                if (!yearOfManufacture) e.yearOfManufacture = 'Year Of Manufacture is required';
                if (!vehicleCost.trim() || !/^\d+$/.test(vehicleCost) || Number(vehicleCost) <= 0) e.vehicleCost = 'Enter a valid vehicle cost';
                if (!voluntaryExcess) e.voluntaryExcess = 'Voluntary Excess is required';
                if (!noClaimYear) e.noClaimYear = 'Claim Discount Year is required';
            }
            return e;
        };

        const handleCalculate = async () => {
            setInlineError(null);
            const errMap = validate();
            setErrors(errMap);
            if (Object.keys(errMap).length > 0) {
                toast.error('Please fix the highlighted fields');
                return;
            }

            const selectedCategory = categories.find((item) => item.data === category);
            const classId = selectedCategory?.additional_value || '2';
            const currentYear = new Date().getFullYear();
            const vehicleAge = isThirdParty ? 0 : Math.max(1, currentYear - Number(yearOfManufacture));

            const payload: GetPremiumRequestPV = {
                class_id: classId,
                cover_type_id: isThirdParty ? 'Third Party' : 'Comprehensive',
                is_government: '1',
                engine_capcity_cc: selectedCc?.cc_value || '',
                driver_seat_capacity: '1',
                passenger_seat_capacity: String(Math.max(0, Number(noOfSeat || 1) - 1)),
                compulsory_excess: isThirdParty ? '0' : compulsoryExcess || '500',
                voluntary_excess: isThirdParty ? '0' : voluntaryExcess,
                vehicle_age_in_years: String(vehicleAge),
                vehicle_suminsured_amount: isThirdParty ? '0' : vehicleCost,
                calc_type: 'p',
                noclaim_year: isThirdParty ? '0' : noClaimYear,
                is_tailor: 'false',
                get_direct_discount: directDiscount ? 'y' : 'n',
                vehicle_reg: 'e',
                include_towing_charge: isThirdParty ? 'false' : towingCharge === 'yes' ? 'true' : 'false',
                include_personal_use_discount: isThirdParty ? 'false' : privateRent === 'yes' ? 'true' : 'false',
            };

            try {
                setLoading(true);
                const resp = await getMotorPremiumPV(payload);
                if (resp?.process_result === false) {
                    const msg = resp?.error_list?.[0]?.error_message || 'Failed to calculate premium';
                    setInlineError(msg);
                    toast.error(msg);
                    return;
                }

                localStorage.setItem('motor.premiumResponse', JSON.stringify(resp));
                localStorage.setItem(
                    'motor.coverageForm',
                    JSON.stringify({
                        topCategory,
                        category,
                        categoryLabel: selectedCategory?.value || '',
                        classId,
                        yearOfManufacture: isThirdParty ? '' : yearOfManufacture,
                        selectedCcRange,
                        ccValue: selectedCc?.cc_value || '',
                        noOfSeat,
                        vehicleCost: isThirdParty ? '' : vehicleCost,
                        voluntaryExcess: isThirdParty ? '' : voluntaryExcess,
                        compulsoryExcess: isThirdParty ? '0' : compulsoryExcess,
                        effectiveDate,
                        expiryDate,
                        noClaimYear: isThirdParty ? '0' : noClaimYear,
                        coverStrikeDamage: isThirdParty ? false : coverStrikeDamage,
                        directDiscount,
                        privateRent,
                        towingCharge,
                    }),
                );

                goToStep(3);
            } catch (err: any) {
                let msg = 'Failed to calculate premium';
                try {
                    msg = JSON.parse(err?.message || '')?.error_list?.[0]?.error_message || msg;
                } catch {
                    msg = err?.message || msg;
                }
                setInlineError(msg);
                toast.error(msg);
            } finally {
                setLoading(false);
            }
        };

        return (
            <>
                <div className="mb-6 flex items-center gap-3">
                    <button type="button" className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-gray-100" onClick={() => goToStep(1)}>
                        <ChevronLeft className="h-5 w-5 text-black" />
                    </button>
                    <h1 className="text-2xl font-bold mb-2">Coverage Plan — {isThirdParty ? 'Third Party' : 'Comprehensive'}</h1>
                </div>

                <p className="text-sm text-muted-foreground mb-8">Fill in the details to calculate your premium.</p>

                <Card className="mb-8">
                    <CardContent className="pt-6 space-y-5">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <Label>Category *</Label>
                                <Select value={topCategory} onValueChange={(v) => { setTopCategory(v); setCategory(''); clearErr('topCategory'); }} disabled={topCategoriesLoading}>
                                    <SelectTrigger className={`mt-2 ${errors.topCategory ? 'border-red-500' : ''}`}><SelectValue placeholder={topCategoriesLoading ? 'Loading...' : 'Select Category'} /></SelectTrigger>
                                    <SelectContent>{topCategories.map((item) => <SelectItem key={item.data} value={item.data}>{item.value}</SelectItem>)}</SelectContent>
                                </Select>
                                {errors.topCategory && <p className="text-xs text-red-600 mt-1">{errors.topCategory}</p>}
                            </div>

                            <div>
                                <Label>Sub Category *</Label>
                                <Select value={category} onValueChange={(v) => { setCategory(v); clearErr('category'); }} disabled={!topCategory || categoriesLoading}>
                                    <SelectTrigger className={`mt-2 ${errors.category ? 'border-red-500' : ''}`}><SelectValue placeholder={!topCategory ? 'Select Category first' : categoriesLoading ? 'Loading...' : 'Select Sub Category'} /></SelectTrigger>
                                    <SelectContent>{categories.map((item) => <SelectItem key={item.data} value={item.data}>{item.value}</SelectItem>)}</SelectContent>
                                </Select>
                                {errors.category && <p className="text-xs text-red-600 mt-1">{errors.category}</p>}
                            </div>

                            {!isThirdParty && (
                                <div>
                                    <Label>Year Of Manufacture *</Label>
                                    <Select value={yearOfManufacture} onValueChange={(v) => { setYearOfManufacture(v); clearErr('yearOfManufacture'); }}>
                                        <SelectTrigger className={`mt-2 ${errors.yearOfManufacture ? 'border-red-500' : ''}`}><SelectValue placeholder="Select Year" /></SelectTrigger>
                                        <SelectContent>{years.map((year) => <SelectItem key={year} value={year}>{year}</SelectItem>)}</SelectContent>
                                    </Select>
                                    {errors.yearOfManufacture && <p className="text-xs text-red-600 mt-1">{errors.yearOfManufacture}</p>}
                                </div>
                            )}

                            {!isThirdParty && (
                                <div>
                                    <Label>Compulsory Excess</Label>
                                    <Input className="mt-2" value={compulsoryLoading ? 'Loading...' : compulsoryExcess} disabled />
                                </div>
                            )}

                            <div>
                                <Label>Cubic Capacity *</Label>
                                <Select value={selectedCcRange} onValueChange={(v) => { setSelectedCcRange(v); clearErr('selectedCcRange'); }}>
                                    <SelectTrigger className={`mt-2 ${errors.selectedCcRange ? 'border-red-500' : ''}`}><SelectValue placeholder="Select CC Range" /></SelectTrigger>
                                    <SelectContent>{CC_OPTIONS.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
                                </Select>
                                {errors.selectedCcRange && <p className="text-xs text-red-600 mt-1">{errors.selectedCcRange}</p>}
                            </div>

                            {!isThirdParty && (
                                <div>
                                    <Label>Vehicle Cost (NPR) *</Label>
                                    <Input className={`mt-2 ${errors.vehicleCost ? 'border-red-500' : ''}`} inputMode="numeric" value={vehicleCost} onChange={(e) => { if (e.target.value === '' || /^\d+$/.test(e.target.value)) { setVehicleCost(e.target.value); clearErr('vehicleCost'); } }} placeholder="Enter vehicle cost" />
                                    {errors.vehicleCost && <p className="text-xs text-red-600 mt-1">{errors.vehicleCost}</p>}
                                </div>
                            )}

                            {!isThirdParty && (
                                <div>
                                    <Label>Voluntary Excess *</Label>
                                    <Select value={voluntaryExcess} onValueChange={(v) => { setVoluntaryExcess(v); clearErr('voluntaryExcess'); }}>
                                        <SelectTrigger className={`mt-2 ${errors.voluntaryExcess ? 'border-red-500' : ''}`}><SelectValue placeholder="Select" /></SelectTrigger>
                                        <SelectContent>{VOLUNTARY_EXCESS_OPTIONS.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
                                    </Select>
                                    {errors.voluntaryExcess && <p className="text-xs text-red-600 mt-1">{errors.voluntaryExcess}</p>}
                                </div>
                            )}

                            <div>
                                <Label>No of Seat (Including Driver)</Label>
                                <Input className={`mt-2 ${errors.noOfSeat ? 'border-red-500' : ''}`} type="number" min={1} value={noOfSeat} onChange={(e) => { if (e.target.value === '' || /^\d+$/.test(e.target.value)) { setNoOfSeat(e.target.value); clearErr('noOfSeat'); } }} />
                                {errors.noOfSeat && <p className="text-xs text-red-600 mt-1">{errors.noOfSeat}</p>}
                            </div>

                            {!isThirdParty && (
                                <>
                                    <div><Label>Private Rent</Label><Select value={privateRent} onValueChange={setPrivateRent}><SelectTrigger className="mt-2"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent></Select></div>
                                    <div><Label>Towing Charge</Label><Select value={towingCharge} onValueChange={setTowingCharge}><SelectTrigger className="mt-2"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent></Select></div>
                                    <div><Label>Claim Discount Year *</Label><Select value={noClaimYear} onValueChange={(v) => { setNoClaimYear(v); clearErr('noClaimYear'); }}><SelectTrigger className={`mt-2 ${errors.noClaimYear ? 'border-red-500' : ''}`}><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{['0', '1', '2', '3', '4', '5'].map((year) => <SelectItem key={year} value={year}>{year} {year === '1' ? 'Year' : 'Years'}</SelectItem>)}</SelectContent></Select>{errors.noClaimYear && <p className="text-xs text-red-600 mt-1">{errors.noClaimYear}</p>}</div>
                                </>
                            )}
                        </div>

                        {!isThirdParty && (
                            <div className="grid md:grid-cols-2 gap-4 pt-2">
                                <div className="flex items-center gap-3"><Switch checked={directDiscount} onCheckedChange={setDirectDiscount} /><Label>Direct discount?</Label></div>
                                <div className="flex items-center gap-3"><Switch checked={coverStrikeDamage} onCheckedChange={setCoverStrikeDamage} /><Label>Cover strike damage?</Label></div>
                            </div>
                        )}

                        {inlineError && <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{inlineError}</div>}
                    </CardContent>
                </Card>

                <div className="flex justify-between">
                    <Button variant="outline" className="gap-2" onClick={() => goToStep(1)}><ArrowLeft className="w-4 h-4" /> BACK</Button>
                    <Button size="lg" className="px-8" disabled={loading} onClick={handleCalculate}>{loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Calculating...</> : 'CALCULATE'}</Button>
                </div>
            </>
        );
    };

    const Step3PremiumDetails = () => {
        const insurancePlan = localStorage.getItem('motor.insurancePlan') || 'comprehensive';
        const isThirdParty = insurancePlan === 'third-party';
        const premiumData = useMemo(() => safeJSON<GetPremiumResponse>('motor.premiumResponse'), []);
        const coverageForm = useMemo(() => safeJSON<any>('motor.coverageForm'), []);
        const amount: PremiumAmountInfo | undefined = premiumData?.amount_info;
        const hasData = !!amount;

        const getValue = (obj: any, keys: string[], fallback: number | string = 0) => {
            if (!obj) return fallback;
            for (const key of keys) if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') return obj[key];
            return fallback;
        };
        const toNumber = (value: any) => (Number.isFinite(Number(value ?? 0)) ? Number(value ?? 0) : 0);

        const ownDamagePremium = getValue(amount, ['premium_amount', 'own_damage_premium', 'od_premium']);
        const oldVehicleCharge = getValue(amount, ['old_vehicle_charge']);
        const voluntaryDiscount = getValue(amount, ['voluntary_excess_amount', 'voluntary_excess_discount']);
        const noClaimDiscount = getValue(amount, ['no_claim_discount_amount', 'ncd_amount']);
        const directDiscount = getValue(premiumData, ['direct_discount_amount']);
        const thirdPartyPremium = getValue(amount, ['tpl_amount', 'third_party_premium']);
        const thirdPartyNcd = getValue(amount, ['tpl_no_claim_discount_amount', 'third_party_ncd_amount']);
        const finalThirdPartyPremium = toNumber(thirdPartyPremium) - toNumber(thirdPartyNcd);
        const poolPremium = getValue(amount, ['pool_amount']);
        const taxableAmount = getValue(amount, ['taxable_amount', 'subtotal_amount']);
        const vatPercent = getValue(amount, ['vat_percent'], 13);
        const vatAmount = getValue(amount, ['vat_amount']);
        const stampDuty = getValue(amount, ['stamp_duty']);
        const totalPremium = getValue(amount, ['total_amount', 'total_premium', 'payable_amount']);

        const rows: PremiumTableRow[] = isThirdParty
            ? [
                { key: 'tp', label: 'Third Party Premium Calculation', type: 'section' },
                { key: 'tp-basic', label: 'Basic Third Party Premium as per CC', value: thirdPartyPremium },
                { key: 'tp-ncd', label: 'Less : No Claim Discount', value: thirdPartyNcd, type: 'less' },
                { key: 'tp-total', label: 'Third Party Premium', value: finalThirdPartyPremium, type: 'subtotal' },
                { key: 'taxable', label: 'Sub Total', value: taxableAmount, type: 'subtotal' },
                { key: 'vat', label: `Add : VAT ${vatPercent}%`, value: vatAmount },
                { key: 'stamp', label: 'Add : Stamp Duty', value: stampDuty },
                { key: 'total', label: 'Total Premium', value: totalPremium, type: 'total' },
            ]
            : [
                { key: 'od', label: 'Own Damage Premium', value: ownDamagePremium },
                { key: 'old', label: 'Add : Old Vehicle Charge', value: oldVehicleCharge },
                { key: 'vol', label: 'Less : Voluntary Excess', value: voluntaryDiscount, type: 'less' },
                { key: 'ncd', label: 'Less : No Claim Discount', value: noClaimDiscount, type: 'less' },
                { key: 'direct', label: 'Less : Direct Discount', value: directDiscount, type: 'less' },
                { key: 'tp', label: 'Third Party Premium', value: finalThirdPartyPremium, type: 'subtotal' },
                { key: 'pool', label: 'Pool Premium', value: poolPremium, type: 'subtotal' },
                { key: 'taxable', label: 'Sub Total', value: taxableAmount, type: 'subtotal' },
                { key: 'vat', label: `Add : VAT ${vatPercent}%`, value: vatAmount },
                { key: 'stamp', label: 'Add : Stamp Duty', value: stampDuty },
                { key: 'total', label: 'Total Premium', value: totalPremium, type: 'total' },
            ];

        const rowClass = (type?: RowType) => type === 'section' ? 'bg-muted/70' : type === 'total' ? 'bg-primary/10 border-t-2 border-primary/30' : type === 'subtotal' ? 'bg-muted/30' : 'bg-background';
        const textClass = (type?: RowType) => type === 'total' ? 'font-bold text-primary' : type === 'subtotal' || type === 'section' ? 'font-semibold' : type === 'less' ? 'text-red-600' : 'text-muted-foreground';

        return (
            <>
                <div className="mb-6 flex items-center gap-3"><button type="button" className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-gray-100" onClick={() => goToStep(2)}><ChevronLeft className="h-5 w-5 text-black" /></button><h1 className="text-lg font-bold text-black">Premium Details</h1></div>

                {coverageForm && (
                    <Card className="mb-6"><CardContent className="pt-6"><h2 className="text-base font-semibold mb-3">Vehicle Details</h2><div className="grid md:grid-cols-2 gap-x-8">
                        <InfoRow label="Insurance Plan" value={isThirdParty ? 'Third Party' : 'Comprehensive'} />
                        <InfoRow label="Sub Category" value={coverageForm.categoryLabel || '—'} />
                        {!isThirdParty && <InfoRow label="Year of Manufacture" value={coverageForm.yearOfManufacture || '—'} />}
                        <InfoRow label="Cubic Capacity" value={CC_OPTIONS.find((item) => item.value === coverageForm.selectedCcRange)?.label || '—'} />
                        <InfoRow label="No of Seat" value={coverageForm.noOfSeat || '—'} />
                        {!isThirdParty && <InfoRow label="Vehicle Cost" value={`NPR ${fmt(coverageForm.vehicleCost)}`} />}
                        {!isThirdParty && <InfoRow label="Compulsory Excess" value={fmt(coverageForm.compulsoryExcess)} />}
                    </div></CardContent></Card>
                )}

                {!hasData && <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-700 mb-6"><AlertCircle className="w-4 h-4 shrink-0" />No premium data found. Please go back and calculate first.</div>}

                {hasData && <Card><CardContent className="mt-3"><div className="rounded-lg overflow-hidden border"><table className="w-full text-sm"><thead><tr className="bg-primary text-primary-foreground"><th className="text-left px-5 py-3 font-semibold">Description</th><th className="text-right px-5 py-3 font-semibold">Amount (NPR)</th></tr></thead><tbody>{rows.map((row) => <tr key={row.key} className={rowClass(row.type)}><td className={`px-5 py-3 ${textClass(row.type)}`}>{row.label}</td><td className={`px-5 py-3 text-right ${textClass(row.type)}`}>{row.type === 'section' ? '' : fmt(row.value)}</td></tr>)}</tbody></table></div></CardContent></Card>}

                <div className="flex mt-6 gap-2"><Button variant="outline" className="gap-2" onClick={() => goToStep(2)}><ArrowLeft className="w-4 h-4" /> Back</Button>{hasData && <Button size="lg" className="px-6" onClick={() => goToStep(4)}>Next</Button>}</div>
            </>
        );
    };

    const Step4VehicleDetails = () => {
        const savedVehicle = useMemo(() => safeJSON<any>('motor.vehicleDetail'), []);
        const savedCoverage = useMemo(() => safeJSON<any>('motor.coverageForm'), []);
        const manufactureYearOptions = useMemo(() => getYearOptions(1990), []);

        const [regSystem, setRegSystem] = useState(savedVehicle?.regSystem || 'zone');
        const [zone, setZone] = useState(savedVehicle?.zone || '');
        const [lotNo, setLotNo] = useState(savedVehicle?.lotNo || '');
        const [vehicleSymbol, setVehicleSymbol] = useState(savedVehicle?.vehicleSymbol || '');
        const [vehicleNumber, setVehicleNumber] = useState(savedVehicle?.vehicleNumber || '');
        const [manufactureYear, setManufactureYear] = useState(savedVehicle?.manufactureYear || savedCoverage?.yearOfManufacture || '');
        const [registerDate, setRegisterDate] = useState(savedVehicle?.registerDate || '');
        const [manufacturer, setManufacturer] = useState(savedVehicle?.manufacturer || '');
        const [modelNumber, setModelNumber] = useState(savedVehicle?.modelNumber || '');
        const [vehicleTypeName, setVehicleTypeName] = useState(savedVehicle?.vehicleType || savedCoverage?.categoryLabel || 'Private Vehicle');
        const [chassisNo, setChassisNo] = useState(savedVehicle?.chassisNo || '');
        const [engineNo, setEngineNo] = useState(savedVehicle?.engineNo || '');
        const [billbookNo, setBillbookNo] = useState(savedVehicle?.billbookNo || '');
        const [billbookExpiry, setBillbookExpiry] = useState(savedVehicle?.billbookExpiry || addOneYear(todayISO()));
        const [errors, setErrors] = useState<Record<string, string>>({});
        const [blueBookFront, setBlueBookFront] = useState<FileState>(null);
        const [blueBookBack, setBlueBookBack] = useState<FileState>(null);
        const frontRef = useRef<HTMLInputElement>(null);
        const backRef = useRef<HTMLInputElement>(null);

        const [zoneList, setZoneList] = useState<CatalogueItem[]>([]);
        const [zoneLotList, setZoneLotList] = useState<CatalogueItem[]>([]);
        const [kindList, setKindList] = useState<CatalogueItem[]>([]);
        const [embossedStateList, setEmbossedStateList] = useState<CatalogueItem[]>([]);
        const [embossedLotList, setEmbossedLotList] = useState<CatalogueItem[]>([]);
        const [embossedKindList, setEmbossedKindList] = useState<CatalogueItem[]>([]);
        const [catalogueLoading, setCatalogueLoading] = useState(false);

        const registrationMinDate = useMemo(() => (manufactureYear ? `${manufactureYear}-01-01` : ''), [manufactureYear]);
        const registrationMaxDate = useMemo(() => todayISO(), []);
        const billbookExpiryBS = useMemo(() => {
            if (!billbookExpiry) return '';
            try { return adIsoToBsYMD(billbookExpiry); } catch { return ''; }
        }, [billbookExpiry]);

        const zoneOptions = regSystem === 'embossed' ? embossedStateList : zoneList;
        const lotOptions = regSystem === 'embossed' ? embossedLotList : zoneLotList;
        const kindOptions = regSystem === 'embossed' ? embossedKindList : kindList;

        useEffect(() => {
            let mounted = true;
            setCatalogueLoading(true);
            Promise.all([getZoneAbbreviations(), getZoneLotNumbers(), getVehicleKinds(), getEmbossedStates(), getEmbossedLotNumbers(), getEmbossedVehicleKinds()])
                .then(([zones, zoneLots, kinds, eStates, eLots, eKinds]) => {
                    if (!mounted) return;
                    setZoneList(zones); setZoneLotList(zoneLots); setKindList(kinds); setEmbossedStateList(eStates); setEmbossedLotList(eLots); setEmbossedKindList(eKinds);
                })
                .catch((err: any) => toast.error(err?.message || 'Failed to load vehicle catalogues'))
                .finally(() => mounted && setCatalogueLoading(false));
            return () => { mounted = false; };
        }, []);

        useEffect(() => {
            const restoreFile = async (dataKey: string, nameKey: string, setter: (value: FileState) => void) => {
                const data = sessionStorage.getItem(dataKey);
                const name = localStorage.getItem(nameKey);
                if (!data || !name) return;
                try {
                    const blob = await fetch(data).then((r) => r.blob());
                    const file = new File([blob], name, { type: blob.type });
                    setter({ file, preview: blob.type.startsWith('image/') ? data : '' });
                } catch { /* ignore */ }
            };
            restoreFile('motor.billbookFrontData', 'motor.billbookFrontName', setBlueBookFront);
            restoreFile('motor.billbookBackData', 'motor.billbookBackName', setBlueBookBack);
        }, []);

        useEffect(() => {
            if (registerDate && registrationMinDate && registerDate < registrationMinDate) {
                setRegisterDate('');
                setErrors((prev) => ({ ...prev, registerDate: `Registration Date must be from ${manufactureYear} to present only` }));
            }
        }, [manufactureYear, registerDate, registrationMinDate]);

        const clearError = (key: string) => setErrors((prev) => { const next = { ...prev }; delete next[key]; return next; });
        const fieldError = (key: string) => errors[key] ? <p className="text-xs text-red-500 mt-1">{errors[key]}</p> : null;
        const handleFile = (file: File, setter: (value: FileState) => void) => setter({ file, preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : '' });

        const validate = () => {
            const e: Record<string, string> = {};
            if (!zone) e.zone = 'Zone/State is required';
            if (!lotNo) e.lotNo = 'Vehicle Age Code is required';
            if (!vehicleSymbol) e.vehicleSymbol = 'Vehicle Symbol is required';
            if (!vehicleNumber.trim()) e.vehicleNumber = 'Vehicle Number is required';
            else if (!/^\d{1,4}$/.test(vehicleNumber.trim())) e.vehicleNumber = 'Vehicle Number must be 1-4 digits';
            if (!manufactureYear) e.manufactureYear = 'Manufacture Year is required';
            if (!registerDate) e.registerDate = 'Registration Date is required';
            else if (registrationMinDate && registerDate < registrationMinDate) e.registerDate = `Registration Date must be from ${manufactureYear} to present only`;
            else if (registerDate > registrationMaxDate) e.registerDate = 'Registration Date cannot be future date';
            if (!manufacturer.trim()) e.manufacturer = 'Manufacture Company is required';
            if (!chassisNo.trim()) e.chassisNo = 'Chassis No is required';
            if (!engineNo.trim()) e.engineNo = 'Engine No is required';
            if (!billbookNo.trim()) e.billbookNo = 'Billbook Number is required';
            if (!billbookExpiry) e.billbookExpiry = 'Billbook Expiry Date is required';
            else if (!billbookExpiryBS) e.billbookExpiry = 'Invalid date — cannot convert to BS';
            if (!blueBookFront) e.blueBookFront = 'Billbook front image is required';
            if (!blueBookBack) e.blueBookBack = 'Billbook back image is required';
            setErrors(e);
            return Object.keys(e).length === 0;
        };

        const saveFile = (file: File, key: string) => {
            const reader = new FileReader();
            reader.onload = () => sessionStorage.setItem(key, reader.result as string);
            reader.readAsDataURL(file);
        };

        const handleNext = () => {
            if (!validate()) { toast.error('Please fix the highlighted errors'); return; }
            localStorage.setItem('motor.vehicleDetail', JSON.stringify({ regSystem, zone, lotNo, vehicleSymbol, vehicleNumber: vehicleNumber.trim(), manufactureYear, registerDate, manufacturer, modelNumber, vehicleType: vehicleTypeName, chassisNo, engineNo, billbookNo, billbookExpiry, billbookExpiryBS }));
            if (blueBookFront?.file) { localStorage.setItem('motor.billbookFrontName', blueBookFront.file.name); saveFile(blueBookFront.file, 'motor.billbookFrontData'); }
            if (blueBookBack?.file) { localStorage.setItem('motor.billbookBackName', blueBookBack.file.name); saveFile(blueBookBack.file, 'motor.billbookBackData'); }
            goToStep(5);
        };

        const renderUpload = (label: string, state: FileState, setter: (value: FileState) => void, ref: RefObject<HTMLInputElement>, errorKey: string) => (
            <div>
                <Label className="text-sm font-medium">{label}</Label>
                <input ref={ref} type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) { handleFile(file, setter); clearError(errorKey); } e.target.value = ''; }} />
                <div className={`mt-2 flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${state ? 'border-green-400 bg-green-50' : errors[errorKey] ? 'border-red-400 bg-red-50/30' : 'border-border hover:border-primary/50 hover:bg-muted/30'}`} onClick={() => ref.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const file = e.dataTransfer.files?.[0]; if (file) { handleFile(file, setter); clearError(errorKey); } }}>
                    {state ? <><>{state.preview && <img src={state.preview} alt="preview" className="w-full max-h-32 object-contain rounded" />}</><p className="text-xs font-medium text-green-700 break-all">{state.file.name}</p><p className="text-xs text-muted-foreground">{(state.file.size / 1024).toFixed(1)} KB</p><Button type="button" variant="ghost" size="sm" className="text-red-600 gap-1" onClick={(e) => { e.stopPropagation(); setter(null); }}><X className="h-3 w-3" /> Remove</Button></> : <><Upload className="w-8 h-8 text-muted-foreground" /><p className="text-xs font-medium">Click or drag & drop</p><p className="text-xs text-muted-foreground">Images or PDF</p></>}
                </div>
                {fieldError(errorKey)}
            </div>
        );

        return (
            <>
                <Button variant="ghost" className="mb-4 gap-2" onClick={() => goToStep(3)}><ArrowLeft className="w-4 h-4" /> Back</Button>
                <h1 className="text-2xl font-bold mb-2">Vehicle Details</h1>
                <p className="text-sm text-muted-foreground mb-4">Enter your vehicle registration and details.</p>

                <div className="mb-6 flex justify-center"><div className="w-full max-w-md rounded-lg overflow-hidden border-4 border-blue-700"><div className="bg-white flex items-center justify-center gap-4 px-6 py-5"><span className="text-4xl font-black text-black">{zone || '—'}</span><span className="text-3xl font-bold text-blue-700">{lotNo || '—'}</span><span className="text-3xl font-bold text-black">{vehicleSymbol || '—'}</span><span className="text-4xl font-black text-black tracking-widest">{vehicleNumber || '----'}</span></div><div className="grid grid-cols-4 bg-blue-700 text-white text-[9px] text-center py-1"><span>State Code</span><span>Age Identifier</span><span>Vehicle Type</span><span>Vehicle Number</span></div></div></div>

                <Card className="mb-6"><CardContent className="pt-6 space-y-5"><div><Label className="flex items-center gap-2 mb-3">Choose Registration System <Info className="w-4 h-4 text-muted-foreground" /></Label><RadioGroup value={regSystem} onValueChange={(value) => { setRegSystem(value); setZone(''); setLotNo(''); setVehicleSymbol(''); }} className="flex flex-wrap gap-6"><div className="flex items-center space-x-2"><RadioGroupItem value="zone" id="zone-sys" /><Label htmlFor="zone-sys">Zone System</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="province" id="province-sys" /><Label htmlFor="province-sys">Province System</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="embossed" id="embossed-sys" /><Label htmlFor="embossed-sys">Embossed System</Label></div></RadioGroup></div>{catalogueLoading && <p className="text-sm text-muted-foreground">Loading vehicle catalogues...</p>}<div className="grid grid-cols-2 md:grid-cols-4 gap-4"><div><Label className="text-xs">{regSystem === 'zone' ? 'Zone *' : 'STATE Code *'}</Label><Select value={zone} onValueChange={(v) => { setZone(v); clearError('zone'); }}><SelectTrigger className="mt-1"><SelectValue placeholder={catalogueLoading ? 'Loading...' : 'Select'} /></SelectTrigger><SelectContent>{zoneOptions.map((item) => <SelectItem key={item.data} value={item.data}>{item.value}</SelectItem>)}</SelectContent></Select>{fieldError('zone')}</div><div><Label className="text-xs">Vehicle Age Code *</Label><Select value={lotNo} onValueChange={(v) => { setLotNo(v); clearError('lotNo'); }}><SelectTrigger className="mt-1"><SelectValue placeholder={catalogueLoading ? 'Loading...' : 'Select'} /></SelectTrigger><SelectContent>{lotOptions.map((item) => <SelectItem key={item.data} value={item.data}>{item.value}</SelectItem>)}</SelectContent></Select>{fieldError('lotNo')}</div><div><Label className="text-xs">Types of Vehicles *</Label><Select value={vehicleSymbol} onValueChange={(v) => { setVehicleSymbol(v); clearError('vehicleSymbol'); }}><SelectTrigger className="mt-1"><SelectValue placeholder={catalogueLoading ? 'Loading...' : 'Select'} /></SelectTrigger><SelectContent>{kindOptions.map((item) => <SelectItem key={item.data} value={item.data}>{item.value}</SelectItem>)}</SelectContent></Select>{fieldError('vehicleSymbol')}</div><div><Label className="text-xs">Vehicle Number *</Label><Input className="mt-1" value={vehicleNumber} maxLength={4} inputMode="numeric" onChange={(e) => { setVehicleNumber(e.target.value.replace(/\D/g, '').slice(0, 4)); clearError('vehicleNumber'); }} placeholder="0001" />{fieldError('vehicleNumber')}</div></div></CardContent></Card>

                <Card className="mb-6"><CardContent className="pt-6 space-y-5"><div className="grid md:grid-cols-2 gap-4"><div><Label>Manufacture Year *</Label><Select value={manufactureYear} onValueChange={(v) => { setManufactureYear(v); if (registerDate && registerDate < `${v}-01-01`) setRegisterDate(''); clearError('manufactureYear'); clearError('registerDate'); }}><SelectTrigger className="mt-2"><SelectValue placeholder="Select manufacture year" /></SelectTrigger><SelectContent>{manufactureYearOptions.map((year) => <SelectItem key={year} value={year}>{year}</SelectItem>)}</SelectContent></Select>{fieldError('manufactureYear')}</div><div><Label>Registration Date *</Label><Input type="date" className="mt-2" value={registerDate} min={registrationMinDate} max={registrationMaxDate} disabled={!manufactureYear} onChange={(e) => { const value = e.target.value; setRegisterDate(value); setErrors((prev) => { const next = { ...prev }; delete next.registerDate; if (registrationMinDate && value < registrationMinDate) next.registerDate = `Registration Date must be from ${manufactureYear} to present only`; else if (value > registrationMaxDate) next.registerDate = 'Registration Date cannot be future date'; return next; }); }} />{manufactureYear && <p className="text-xs text-muted-foreground mt-1">Allowed registration date: {manufactureYear} to present</p>}{fieldError('registerDate')}</div><div><Label>Manufacture Company *</Label><Input className="mt-2" value={manufacturer} onChange={(e) => { setManufacturer(e.target.value); clearError('manufacturer'); }} placeholder="e.g. Toyota, Hyundai, Tata" />{fieldError('manufacturer')}</div><div><Label>Model Number</Label><Input className="mt-2" value={modelNumber} onChange={(e) => setModelNumber(e.target.value)} placeholder="e.g. Swift, i20" /></div><div><Label>Vehicle Type</Label><Input className="mt-2" value={vehicleTypeName} onChange={(e) => setVehicleTypeName(e.target.value)} placeholder="Private Vehicle" /></div><div><Label>Chassis No *</Label><Input className="mt-2" value={chassisNo} onChange={(e) => { setChassisNo(e.target.value); clearError('chassisNo'); }} />{fieldError('chassisNo')}</div><div><Label>Engine No *</Label><Input className="mt-2" value={engineNo} onChange={(e) => { setEngineNo(e.target.value); clearError('engineNo'); }} />{fieldError('engineNo')}</div><div><Label>Billbook Number *</Label><Input className="mt-2" value={billbookNo} onChange={(e) => { setBillbookNo(e.target.value); clearError('billbookNo'); }} />{fieldError('billbookNo')}</div><div><Label>Billbook Expiry Date (AD) *</Label><Input type="date" className="mt-2" value={billbookExpiry} min={todayISO()} onChange={(e) => { setBillbookExpiry(e.target.value); clearError('billbookExpiry'); }} />{fieldError('billbookExpiry')}</div><div><Label>Billbook Expiry Date (BS)</Label><Input className="mt-2" value={billbookExpiryBS} readOnly placeholder="Auto calculated" /></div></div></CardContent></Card>

                <Card className="mb-8"><CardContent className="pt-6"><Label className="text-base font-semibold mb-4 block">Billbook Documents *</Label><div className="grid md:grid-cols-2 gap-4">{renderUpload('Billbook Front *', blueBookFront, setBlueBookFront, frontRef as RefObject<HTMLInputElement>, 'blueBookFront')}{renderUpload('Billbook Back *', blueBookBack, setBlueBookBack, backRef as RefObject<HTMLInputElement>, 'blueBookBack')}</div></CardContent></Card>

                <div className="flex justify-between"><Button variant="outline" className="gap-2" onClick={() => goToStep(3)}><ArrowLeft className="w-4 h-4" /> BACK</Button><Button size="lg" className="px-8" onClick={handleNext}>NEXT</Button></div>
            </>
        );
    };

    const Step5ReviewSubmit = () => {
        const [submitLoading, setSubmitLoading] = useState(false);
        const [successModal, setSuccessModal] = useState<{ policyNo?: string } | null>(null);
        const coverageForm = useMemo(() => safeJSON<any>('motor.coverageForm'), []);
        const premiumData = useMemo(() => safeJSON<any>('motor.premiumResponse'), []);
        const vehicleDetail = useMemo(() => safeJSON<any>('motor.vehicleDetail'), []);
        const amount = premiumData?.amount_info;
        const policySessionId = premiumData?.policy_session_id || '';
        const isThirdParty = localStorage.getItem('motor.insurancePlan') === 'third-party';

        const handleSubmit = async () => {
            if (!premiumData || !coverageForm || !vehicleDetail) { toast.error('Missing data. Please complete all previous steps.'); return; }
            if (!policySessionId) { toast.error('policy_session_id missing. Please recalculate premium.'); return; }
            const vd = vehicleDetail;
            const cf = coverageForm;
            const mfgYear = Number(vd.manufactureYear || cf.yearOfManufacture);
            const vehicleAge = mfgYear > 0 ? Math.max(1, new Date().getFullYear() - mfgYear) : 1;
            const regNumber = `${vd.zone || ''} ${vd.vehicleSymbol || ''} ${vd.lotNo || ''} ${vd.vehicleNumber || ''}`.trim();

            try {
                setSubmitLoading(true);
                let billbookFrontId = '';
                let billbookBackId = '';
                const frontData = sessionStorage.getItem('motor.billbookFrontData');
                const backData = sessionStorage.getItem('motor.billbookBackData');

                if (frontData) {
                    const blob = await fetch(frontData).then((r) => r.blob());
                    const res = await uploadVehicleFront(vd.billbookNo || 'billbook', new File([blob], 'billbook_front.jpg', { type: blob.type }));
                    if (res.process_result && res.uploaded_id != null) billbookFrontId = String(res.uploaded_id);
                    else { toast.error(res.error_list?.[0]?.error_message || 'Billbook front upload failed'); return; }
                }
                if (backData) {
                    const blob = await fetch(backData).then((r) => r.blob());
                    const res = await uploadVehicleBack(vd.billbookNo || 'billbook', new File([blob], 'billbook_back.jpg', { type: blob.type }));
                    if (res.process_result && res.uploaded_id != null) billbookBackId = String(res.uploaded_id);
                    else { toast.error(res.error_list?.[0]?.error_message || 'Billbook back upload failed'); return; }
                }

                const payload = {
                    client_info: { Bank_Code: '1' },
                    policy_info: { department_id: '1', class_id: cf.classId || '1', payment_process: 'Full Payment', effective_date: cf.effectiveDate || todayISO(), expiry_date: cf.expiryDate || addOneYear(todayISO()) },
                    policy_session_id: policySessionId,
                    class_info: {
                        class_id: cf.classId || '1',
                        cover_type_id: isThirdParty ? 'Third Party' : 'Comprehensive',
                        is_government: '1',
                        vehicle_suminsured_amount: isThirdParty ? 0 : Number(cf.vehicleCost || 0),
                        item_suminsured_amount: 0,
                        suminsured_amount: isThirdParty ? 0 : Number(cf.vehicleCost || 0),
                        voluntary_excess: Number(cf.voluntaryExcess || 0),
                        compulsory_excess: Number(cf.compulsoryExcess || 0),
                        item_description: '',
                        manufacturing_company: vd.manufacturer || '',
                        manufacture_year: vd.manufactureYear || cf.yearOfManufacture || '',
                        registration_date: vd.registerDate || '',
                        vehicle_age_in_years: vehicleAge,
                        driver_seat_capacity: 1,
                        conductor_helper_seat_capacity: 0,
                        passenger_seat_capacity: Math.max(0, Number(cf.noOfSeat || 5) - 1),
                        passanger_carrying_capacity: Number(cf.noOfSeat || 5),
                        good_carrying_capacity: 0,
                        engine_capcity_cc: cf.ccValue || '',
                        vehicle_type: vd.vehicleType || cf.categoryLabel || 'Private Vehicle',
                        chassis_number: vd.chassisNo || '',
                        engine_number: vd.engineNo || '',
                        model_number: vd.modelNumber || '',
                        vehicle_number: vd.vehicleNumber || '',
                        registration_number: regNumber,
                        vehicle_num_zone_state: vd.zone || '',
                        vehicle_num_lot: String(vd.lotNo || ''),
                        vehicle_num_kind: vd.vehicleSymbol || '',
                        vehicle_reg: vd.regSystem === 'embossed' ? 'e' : 'y',
                        billbook_number: vd.billbookNo || '',
                        billbook_exp_date: vd.billbookExpiry || '',
                        billbook_exp_date_nep: vd.billbookExpiryBS || '',
                        billbook_front_id: billbookFrontId,
                        billbook_back_id: billbookBackId,
                        noclaim_year: cf.noClaimYear || '0',
                        no_claim_discount_percent: '0',
                        has_tailor: 'n',
                        tailor_amount: null,
                        nep_vehicle_number: '',
                        is_tmis_vehicle_register: 'n',
                        office_code: '',
                        motor_model: '',
                        motor_code: 'bpj',
                        is_diplomatic: 'n',
                        has_schedule: 'n',
                    },
                };

                const resp = await createMotorPolicy(payload as CreateMotorPolicyPayload);
                const policyNo = resp?.policy_no || resp?.policy_number || resp?.document_number || '';
                setSuccessModal({ policyNo });
                ['motor.premiumResponse', 'motor.coverageForm', 'motor.vehicleDetail', 'motor.insurancePlan', 'motor.billbookFrontName', 'motor.billbookBackName'].forEach((key) => localStorage.removeItem(key));
                ['motor.billbookFrontData', 'motor.billbookBackData'].forEach((key) => sessionStorage.removeItem(key));
            } catch (err: any) {
                toast.error(err?.data?.error_list?.[0]?.error_message || err?.message || 'Failed to create motor policy');
            } finally {
                setSubmitLoading(false);
            }
        };

        return (
            <>
                <Button variant="ghost" className="mb-4 gap-2" onClick={() => goToStep(4)}><ArrowLeft className="w-4 h-4" /> Back</Button>
                <h1 className="text-2xl font-bold mb-2">Review & Submit</h1>
                <p className="text-sm text-muted-foreground mb-6">Please review your details before submitting.</p>

                <Dialog open={!!successModal} onOpenChange={() => undefined}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle className="flex items-center gap-2 text-green-600"><CheckCircle className="h-6 w-6" /> Policy Created!</DialogTitle></DialogHeader><div className="py-4 text-center"><p className="text-lg">Motor policy created successfully.</p>{successModal?.policyNo && <p className="mt-2 font-bold">Policy Number: {successModal.policyNo}</p>}</div><DialogFooter><Button onClick={() => navigate('/my-draft-policy', { replace: true })} className="w-full">View My Policies</Button></DialogFooter></DialogContent></Dialog>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6"><Card><CardHeader className="bg-primary/5 pb-3"><CardTitle className="flex items-center gap-2 text-base"><FileText className="h-5 w-5" /> Coverage Summary</CardTitle></CardHeader><CardContent className="pt-4"><InfoRow label="Plan Type" value={localStorage.getItem('motor.insurancePlan') || '—'} />{coverageForm && <><InfoRow label="Category" value={coverageForm.categoryLabel || 'Private Vehicle'} /><InfoRow label="Year of Manufacture" value={coverageForm.yearOfManufacture || '—'} /><InfoRow label="Cubic Capacity" value={CC_OPTIONS.find((item) => item.value === coverageForm.selectedCcRange)?.label || '—'} /><InfoRow label="Seat Capacity" value={coverageForm.noOfSeat || '—'} /><InfoRow label="Vehicle Cost" value={`NPR ${fmt(coverageForm.vehicleCost)}`} /><InfoRow label="Effective Date" value={coverageForm.effectiveDate || '—'} /><InfoRow label="Expiry Date" value={coverageForm.expiryDate || '—'} /></>}</CardContent></Card><Card><CardHeader className="bg-primary/5 pb-3"><CardTitle className="flex items-center gap-2 text-base"><Car className="h-5 w-5" /> Vehicle Details</CardTitle></CardHeader><CardContent className="pt-4">{vehicleDetail ? <><InfoRow label="Registration" value={`${vehicleDetail.zone || ''} ${vehicleDetail.lotNo || ''} ${vehicleDetail.vehicleSymbol || ''} ${vehicleDetail.vehicleNumber || ''}`.trim() || '—'} /><InfoRow label="Manufacture Year" value={vehicleDetail.manufactureYear || coverageForm?.yearOfManufacture || '—'} /><InfoRow label="Registration Date" value={vehicleDetail.registerDate || '—'} /><InfoRow label="Manufacturer" value={vehicleDetail.manufacturer || '—'} /><InfoRow label="Vehicle Type" value={vehicleDetail.vehicleType || '—'} /><InfoRow label="Model" value={vehicleDetail.modelNumber || '—'} /><InfoRow label="Chassis No" value={vehicleDetail.chassisNo || '—'} /><InfoRow label="Engine No" value={vehicleDetail.engineNo || '—'} /><InfoRow label="Billbook No" value={vehicleDetail.billbookNo || '—'} /></> : <p className="text-sm text-muted-foreground py-4 text-center">No vehicle details found</p>}</CardContent></Card></div>

                {amount && <Card className="mb-8"><CardHeader className="bg-primary/5 pb-3"><CardTitle className="flex items-center gap-2 text-base"><DollarSign className="h-5 w-5" /> Premium Breakdown</CardTitle></CardHeader><CardContent className="pt-4"><div className="rounded-lg overflow-hidden border"><table className="w-full text-sm"><tbody><tr><td className="px-5 py-3 text-muted-foreground">Sum Insured</td><td className="px-5 py-3 text-right font-medium">{fmt(amount.suminsured)}</td></tr><tr className="bg-muted/40"><td className="px-5 py-3 text-muted-foreground">Premium Amount</td><td className="px-5 py-3 text-right font-medium">{fmt(amount.premium_amount)}</td></tr><tr><td className="px-5 py-3 text-muted-foreground">Taxable Amount</td><td className="px-5 py-3 text-right font-medium">{fmt(amount.taxable_amount)}</td></tr><tr className="bg-muted/40"><td className="px-5 py-3 text-muted-foreground">VAT ({amount.vat_percent}%)</td><td className="px-5 py-3 text-right font-medium">{fmt(amount.vat_amount)}</td></tr><tr><td className="px-5 py-3 text-muted-foreground">Stamp Duty</td><td className="px-5 py-3 text-right font-medium">{fmt(amount.stamp_duty)}</td></tr><tr className="border-t-2 bg-primary/5"><td className="px-5 py-4 font-bold text-primary">Total Premium</td><td className="px-5 py-4 text-right font-bold text-primary text-base">{fmt(amount.total_amount)}</td></tr></tbody></table></div></CardContent></Card>}

                <div className="flex justify-between"><Button variant="outline" className="gap-2" onClick={() => goToStep(4)}><ArrowLeft className="w-4 h-4" /> BACK</Button><Button size="lg" className="px-8 gap-2" disabled={submitLoading || !premiumData || !vehicleDetail} onClick={handleSubmit}>{submitLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : <><CheckCircle className="w-4 h-4" /> SUBMIT POLICY</>}</Button></div>
            </>
        );
    };

    switch (currentStep) {
        case 1: return <Step1CoveragePlan />;
        case 2: return <Step2VehicleDetails />;
        case 3: return <Step3PremiumDetails />;
        case 4: return <Step4VehicleDetails />;
        case 5: return <Step5ReviewSubmit />;
        default: return <Step1CoveragePlan />;
    }
};
