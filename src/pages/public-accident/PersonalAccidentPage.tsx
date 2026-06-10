// src/pages/accident/PersonalAccidentPage.tsx

import { useState } from "react";
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
import { Switch } from "@/components/ui/switch";

import {
    getPersonalAccidentPremium,
    type PersonalAccidentPremiumRequest,
    type PersonalAccidentPremiumResponse,
} from "@/api/accident/getPersonalAccidentPremium";

const MAX_SUM_INSURED = 4000000;

function formatAmount(value: number | string | null | undefined) {
    const cleanValue = String(value ?? "0").replace(/,/g, "");
    const num = Number(cleanValue);

    if (!Number.isFinite(num)) return "0.00";

    return num.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function formatInputAmount(value: string) {
    const cleanValue = value.replace(/[^\d]/g, "");

    if (!cleanValue) return "";

    return Number(cleanValue).toLocaleString("en-IN");
}

export default function PersonalAccidentPage() {
    const navigate = useNavigate();

    const [step, setStep] = useState<1 | 2>(1);

    const [suminsured, setSuminsured] = useState("");
    const [directDiscount, setDirectDiscount] = useState(true);

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [inlineError, setInlineError] = useState("");
    const [loading, setLoading] = useState(false);

    const [premiumResponse, setPremiumResponse] =
        useState<PersonalAccidentPremiumResponse | null>(null);

    const clearError = (key: string) => {
        setErrors((prev) => {
            const next = { ...prev };
            delete next[key];
            return next;
        });
    };

    const handleNumberChange = (
        value: string,
        setter: React.Dispatch<React.SetStateAction<string>>,
        errorKey: string,
    ) => {
        const cleanValue = value.replace(/[^\d]/g, "");
        const amount = Number(cleanValue || 0);

        setter(cleanValue);
        clearError(errorKey);

        if (amount > MAX_SUM_INSURED) {
            setErrors((prev) => ({
                ...prev,
                [errorKey]: "Maximum sum insured allowed is  40,00,000.",
            }));
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        const amount = Number(suminsured || 0);

        if (!suminsured.trim()) {
            newErrors.suminsured = "Sum insured is required";
        } else if (!/^\d+$/.test(suminsured) || amount <= 0) {
            newErrors.suminsured = "Enter valid sum insured";
        } else if (amount > MAX_SUM_INSURED) {
            newErrors.suminsured = "Maximum sum insured allowed is  40,00,000.";
        }

        return newErrors;
    };

    const buildPayload = (): PersonalAccidentPremiumRequest => {
        return {
            class_id: "18",
            suminsured: suminsured,
            total_suminsured: suminsured,
            get_direct_discount: directDiscount ? "y" : "n",
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
                JSON.stringify(payload),
            );

            const response = await getPersonalAccidentPremium(payload);

            localStorage.setItem(
                "accident.personalAccidentPremiumResponse",
                JSON.stringify(response),
            );

            setPremiumResponse(response);
            setStep(2);
        } catch (error: any) {
            let message = "Failed to calculate personal accident premium";

            try {
                const parsed = JSON.parse(error?.message || "");
                message =
                    parsed?.error_list?.[0]?.error_message || parsed?.message || message;
            } catch {
                message =
                    error?.data?.error_list?.[0]?.error_message ||
                    error?.response?.data?.error_list?.[0]?.error_message ||
                    error?.message ||
                    message;
            }

            setInlineError(message);
        } finally {
            setLoading(false);
        }
    };

    if (step === 2) {
        const amount = premiumResponse?.amount_info;

        return (
            <div className="min-h-screen bg-background">
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

                            <p className="mt-1 text-sm text-muted-foreground">
                                Premium calculated from personal accident.
                            </p>
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
                                                Amount NPR
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        <PremiumRow label="Sum Insured" value={amount.suminsured} />

                                        <PremiumRow
                                            label="Basic Premium Amount"
                                            value={amount.premium_amount}
                                        />

                                        <PremiumRow label="RS/MD/ST" value={amount.pool_amount} />

                                        <PremiumRow
                                            label= "Direct Discount"
                                            value={premiumResponse.direct_discount_amount ?? 0}
                                            isLess
                                        />

                                        <PremiumRow
                                            label="Taxable Amount"
                                            value={amount.taxable_amount}
                                        />

                                        {/* <PremiumRow
                                            label={`VAT (${amount.vat_percent ?? 13}%)`}
                                            value={amount.vat_amount}
                                        /> */}

                                        <PremiumRow label="Stamp Duty" value={amount.stamp_duty} />

                                        <tr className="bg-[#b71319] text-white">
                                            <td className="border-r border-white px-4 py-4 text-base font-bold">
                                                Total Amount
                                            </td>

                                            <td className="px-4 py-4 text-right text-base font-bold">
                                                {" "}
                                                {formatAmount(
                                                    premiumResponse.total_premium_with_vat ??
                                                    amount.total_amount,
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
                                    onClick={() => navigate("/login")}
                                >
                                    Buy Policy
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
        <div className="min-h-screen bg-background">
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
                            Enter sum insured and calculate personal accident premium.
                        </p>
                    </div>
                </div>

                {inlineError && (
                    <div className="mb-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        {inlineError}
                    </div>
                )}

                <div className="grid gap-5 md:grid-cols-2">
                    <div>
                        <Label htmlFor="suminsured">Sum Insured *</Label>

                        <Input
                            id="suminsured"
                            type="text"
                            inputMode="numeric"
                            value={formatInputAmount(suminsured)}
                            placeholder="Maximum  40,00,000"
                            onChange={(event) =>
                                handleNumberChange(
                                    event.target.value,
                                    setSuminsured,
                                    "suminsured",
                                )
                            }
                            className={`mt-2 h-12 ${errors.suminsured ? "border-red-500 text-red-500" : ""
                                }`}
                        />

                        <div className="mt-2 flex items-start justify-between gap-3">
                            <p
                                className={`text-sm ${errors.suminsured ? "text-red-600" : "text-muted-foreground"
                                    }`}
                            >
                                {errors.suminsured ||
                                    "Enter sum insured up to  40,00,000."}
                            </p>
                        </div>
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

                <div className="flex justify-between pt-6">
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
            </div>
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
    value: number | string | null | undefined;
    isLess?: boolean;
    textOnly?: boolean;
}) {
    return (
        <tr className="border-b bg-[#fff7f3] last:border-b-0">
            <td
                className={`border-r border-white px-4 py-3 ${
                    isLess ? "font-medium text-red-600" : "text-black"
                }`}
            >
                {isLess ? `Less : ${label}` : label}
            </td>

            <td
                className={`px-4 py-3 text-right font-medium ${
                    isLess ? "text-red-600" : "text-black"
                }`}
            >
                {textOnly
                    ? value
                    : isLess
                        ? `(${formatAmount(value)})`
                        : formatAmount(value)}
            </td>
        </tr>
    );
}