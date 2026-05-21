// src/pages/accident/PersonalAccidentPage.tsx

import { useMemo, useState } from "react";
import {
    AlertCircle,
    ArrowLeft,
    ArrowRight,
    ChevronLeft,
    Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import {
    getPersonalAccidentPremium,
    type PersonalAccidentPremiumRequest,
    type PersonalAccidentPremiumResponse,
} from "@/api/accident/getPersonalAccidentPremium";

const yesNoOptions = [
    { label: "Yes", value: "yes" },
    { label: "No", value: "no" },
];

function formatAmount(value: number | string | null | undefined) {
    const cleanValue = String(value ?? "0").replace(/,/g, "");
    const num = Number(cleanValue);

    if (!Number.isFinite(num)) return "0.00";

    return num.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

export default function AccidentsPersonalPage() {
    const navigate = useNavigate();

    const [step, setStep] = useState<1 | 2>(1);

    const [suminsured, setSuminsured] = useState("");
    const [medicalSuminsured, setMedicalSuminsured] = useState("");
    const [includeRsdCharge, setIncludeRsdCharge] = useState("yes");

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [inlineError, setInlineError] = useState("");
    const [loading, setLoading] = useState(false);

    const [premiumResponse, setPremiumResponse] =
        useState<PersonalAccidentPremiumResponse | null>(null);

    const totalSuminsured = useMemo(() => {
        const main = Number(suminsured || 0);
        const medical = Number(medicalSuminsured || 0);

        return String(main + medical);
    }, [suminsured, medicalSuminsured]);

    const clearError = (key: string) => {
        setErrors((prev) => ({
            ...prev,
            [key]: "",
        }));
    };

    const handleNumberChange = (
        value: string,
        setter: React.Dispatch<React.SetStateAction<string>>,
        errorKey: string
    ) => {
        const cleanValue = value.replace(/[^\d]/g, "");
        setter(cleanValue);
        clearError(errorKey);
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!suminsured.trim()) {
            newErrors.suminsured = "Sum insured is required";
        } else if (!/^\d+$/.test(suminsured) || Number(suminsured) <= 0) {
            newErrors.suminsured = "Enter valid sum insured";
        }

        if (!medicalSuminsured.trim()) {
            newErrors.medicalSuminsured = "Medical sum insured is required";
        } else if (
            !/^\d+$/.test(medicalSuminsured) ||
            Number(medicalSuminsured) < 0
        ) {
            newErrors.medicalSuminsured = "Enter valid medical sum insured";
        }

        if (!includeRsdCharge) {
            newErrors.includeRsdCharge = "RSD charge option is required";
        }

        return newErrors;
    };

    const buildPayload = (): PersonalAccidentPremiumRequest => {
        return {
            class_id: "18",
            include_rsd_charge: includeRsdCharge === "yes",
            suminsured,
            medical_suminsured: medicalSuminsured,
            total_suminsured: totalSuminsured,
        };
    };

    const handleCalculate = async () => {
        setInlineError("");

        const validationErrors = validate();
        setErrors(validationErrors);

        if (Object.keys(validationErrors).length > 0) {
            return;
        }

        const payload = buildPayload();

        try {
            setLoading(true);

            localStorage.setItem(
                "accident.personalAccidentPayload",
                JSON.stringify(payload)
            );

            const response = await getPersonalAccidentPremium(payload);

            localStorage.setItem(
                "accident.personalAccidentPremiumResponse",
                JSON.stringify(response)
            );

            setPremiumResponse(response);
            setStep(2);
        } catch (error: any) {
            setInlineError(
                error?.message || "Failed to calculate personal accident premium"
            );
        } finally {
            setLoading(false);
        }
    };

    if (step === 2) {
        const amount = premiumResponse?.amount_info;

        return (
            <div className="min-h-screen">
                <div className="mx-auto max-w-6xl px-4 py-5 shadow-sm sm:px-5">
                    <div className="mb-6 flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100"
                        >
                            <ChevronLeft className="h-5 w-5 text-black" />
                        </button>

                        <div>
                            <h1 className="text-2xl font-bold text-black">
                                Personal Accident Premium Details
                            </h1>
                        </div>
                    </div>

                    {!premiumResponse || !amount ? (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                            Premium response not found. Please calculate again.
                        </div>
                    ) : (
                        <>
                           

                            <div className="overflow-hidden rounded-md border">
                                <table className="w-full border-collapse text-sm">
                                    <thead>
                                        <tr className="bg-[#e91d25] text-white">
                                            <th className="border-r border-white px-4 py-3 text-left font-bold">
                                                Particulars
                                            </th>

                                            <th className="px-4 py-3 text-right font-bold">
                                                Value / Amount
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        <PremiumRow
                                            label="Sum Insured"
                                            value={amount.suminsured}
                                        />

                                        <PremiumRow
                                            label="Premium Amount"
                                            value={amount.premium_amount}
                                        />

                                        <PremiumRow
                                            label="PA Amount"
                                            value={amount.pa_amount}
                                        />

                                        <PremiumRow
                                            label="TPL Amount"
                                            value={amount.tpl_amount}
                                        />

                                        <PremiumRow
                                            label="Pool Amount"
                                            value={amount.pool_amount}
                                        />

                                        <PremiumRow
                                            label={`Direct Discount (${premiumResponse.direct_discount_percent}%)`}
                                            value={
                                                premiumResponse.direct_discount_amount
                                            }
                                            isLess
                                        />

                                        <PremiumRow
                                            label="Taxable Amount"
                                            value={amount.taxable_amount}
                                        />

                                        <PremiumRow
                                            label={`VAT (${amount.vat_percent}%)`}
                                            value={amount.vat_amount}
                                        />

                                        <PremiumRow
                                            label="Stamp Duty"
                                            value={amount.stamp_duty}
                                        />

                                        <PremiumRow
                                            label="Commission Percent"
                                            value={`${amount.commission_percent}%`}
                                            textOnly
                                        />

                                        <PremiumRow
                                            label="Commission Amount"
                                            value={amount.commission_amount}
                                        />

                                        <PremiumRow
                                            label="Commission Tax Percent"
                                            value={`${amount.commission_tax_percent}%`}
                                            textOnly
                                        />

                                        <PremiumRow
                                            label="Commission Tax Amount"
                                            value={amount.commission_tax_amount}
                                        />

                                        

                                        <tr className="bg-[#b71319] text-white">
                                            <td className="border-r border-white px-4 py-4 text-base font-bold">
                                                Total Premium With VAT
                                            </td>

                                            <td className="px-4 py-4 text-right text-base font-bold">
                                                NPR{" "}
                                                {formatAmount(
                                                    premiumResponse.total_premium_with_vat
                                                )}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <div className="mt-8 flex justify-between">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="gap-2"
                                    onClick={() => setStep(1)}
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Back
                                </Button>

                                <Button
                                    type="button"
                                    className="gap-2 bg-[#f71920] text-white hover:bg-[#d9151b]"
                                    onClick={() => navigate("/accident-insurance")}
                                >
                                    Done
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <div className="mx-auto max-w-5xl px-4 py-5 shadow-sm sm:px-5">
                <div className="mb-8 flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => navigate("/accident-insurance")}
                        className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100"
                    >
                        <ChevronLeft className="h-5 w-5 text-black" />
                    </button>

                    <div>
                        <h1 className="text-2xl font-bold text-black">
                            Personal Accident Insurance
                        </h1>

                        <p className="mt-1 text-sm text-muted-foreground">
                            Enter sum insured details to calculate PA premium.
                        </p>
                    </div>
                </div>

                {inlineError && (
                    <div className="mb-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        {inlineError}
                    </div>
                )}

                <Card>
                    <CardContent className="space-y-5 pt-6">
                        <div className="grid gap-5 md:grid-cols-2">
                            <div>
                                <Label htmlFor="suminsured">Sum Insured *</Label>

                                <Input
                                    id="suminsured"
                                    type="text"
                                    inputMode="numeric"
                                    value={suminsured}
                                    placeholder="Enter sum insured"
                                    onChange={(event) =>
                                        handleNumberChange(
                                            event.target.value,
                                            setSuminsured,
                                            "suminsured"
                                        )
                                    }
                                    className={`mt-2 h-12 ${
                                        errors.suminsured
                                            ? "border-red-500"
                                            : ""
                                    }`}
                                />

                                {errors.suminsured && (
                                    <p className="mt-1 text-xs text-red-600">
                                        {errors.suminsured}
                                    </p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="medicalSuminsured">
                                    Medical Sum Insured *
                                </Label>

                                <Input
                                    id="medicalSuminsured"
                                    type="text"
                                    inputMode="numeric"
                                    value={medicalSuminsured}
                                    placeholder="Enter medical sum insured"
                                    onChange={(event) =>
                                        handleNumberChange(
                                            event.target.value,
                                            setMedicalSuminsured,
                                            "medicalSuminsured"
                                        )
                                    }
                                    className={`mt-2 h-12 ${
                                        errors.medicalSuminsured
                                            ? "border-red-500"
                                            : ""
                                    }`}
                                />

                                {errors.medicalSuminsured && (
                                    <p className="mt-1 text-xs text-red-600">
                                        {errors.medicalSuminsured}
                                    </p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="includeRsdCharge">
                                    Include RSD Charge *
                                </Label>

                                <Select
                                    value={includeRsdCharge}
                                    onValueChange={(value) => {
                                        setIncludeRsdCharge(value);
                                        clearError("includeRsdCharge");
                                    }}
                                >
                                    <SelectTrigger
                                        id="includeRsdCharge"
                                        className={`mt-2 h-12 ${
                                            errors.includeRsdCharge
                                                ? "border-red-500"
                                                : ""
                                        }`}
                                    >
                                        <SelectValue placeholder="Select RSD charge" />
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

                                {errors.includeRsdCharge && (
                                    <p className="mt-1 text-xs text-red-600">
                                        {errors.includeRsdCharge}
                                    </p>
                                )}
                            </div>

                            <div className="rounded-lg border bg-muted/30 p-4">
                                <p className="text-xs text-muted-foreground">
                                    Total Sum Insured
                                </p>

                                <p className="mt-2 text-xl font-bold">
                                    NPR {formatAmount(totalSuminsured)}
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-between pt-3">
                            <Button
                                type="button"
                                variant="outline"
                                className="gap-2"
                                onClick={() => navigate("/accident-insurance")}
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back
                            </Button>

                            <Button
                                type="button"
                                size="lg"
                                disabled={loading}
                                onClick={handleCalculate}
                                className="gap-2 bg-[#f71920] px-8 text-white hover:bg-[#d9151b]"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
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
            </div>
        </div>
    );
}

function SummaryCard({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-lg border bg-muted/30 p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 break-all font-semibold text-black">{value}</p>
        </div>
    );
}

function PremiumRow({
    label,
    value,
    isLess = false,
    textOnly = false,
}: {
    label: string;
    value: number | string;
    isLess?: boolean;
    textOnly?: boolean;
}) {
    return (
        <tr className="border-b bg-[#fff7f3] last:border-b-0">
            <td
                className={`border-r border-white px-4 py-3 ${
                    isLess ? "text-red-600" : "text-black"
                }`}
            >
                {label}
            </td>

            <td
                className={`px-4 py-3 text-right font-medium ${
                    isLess ? "text-red-600" : "text-black"
                }`}
            >
                {textOnly ? value : `NPR ${formatAmount(value)}`}
            </td>
        </tr>
    );
}