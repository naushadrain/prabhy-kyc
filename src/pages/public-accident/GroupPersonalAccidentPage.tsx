// src/pages/accident/GroupPersonalAccidentPage.tsx

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
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

import {
    getGroupPersonalAccidentPremium,
    type GroupPersonalAccidentPremiumRequest,
    type GroupPersonalAccidentPremiumResponse,
} from "@/api/accident/getGroupPersonalAccidentPremium";

function formatAmount(value: number | string | null | undefined) {
    const cleanValue = String(value ?? "0").replace(/,/g, "");
    const num = Number(cleanValue);

    if (!Number.isFinite(num)) return "0.00";

    return num.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

export default function GroupPersonalAccidentPage() {
    const navigate = useNavigate();

    const [step, setStep] = useState<1 | 2>(1);

    const [totalPerson, setTotalPerson] = useState("4");
    const [totalSuminsured, setTotalSuminsured] = useState("1000000");
    const [directDiscount, setDirectDiscount] = useState(true);

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [inlineError, setInlineError] = useState("");
    const [loading, setLoading] = useState(false);

    const [premiumResponse, setPremiumResponse] =
        useState<GroupPersonalAccidentPremiumResponse | null>(null);

    const clearError = (key: string) => {
        setErrors((prev) => {
            const next = { ...prev };
            delete next[key];
            return next;
        });
    };

    const handleNumberInput = (
        value: string,
        setter: React.Dispatch<React.SetStateAction<string>>,
        errorKey: string,
    ) => {
        const cleanValue = value.replace(/[^\d]/g, "");
        setter(cleanValue);
        clearError(errorKey);
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!totalPerson.trim()) {
            newErrors.totalPerson = "No. of person is required";
        } else if (!/^\d+$/.test(totalPerson) || Number(totalPerson) <= 0) {
            newErrors.totalPerson = "Enter valid no. of person";
        }

        if (!totalSuminsured.trim()) {
            newErrors.totalSuminsured = "Total sum insured is required";
        } else if (
            !/^\d+$/.test(totalSuminsured) ||
            Number(totalSuminsured) <= 0
        ) {
            newErrors.totalSuminsured = "Enter valid total sum insured";
        }

        return newErrors;
    };

    const buildPayload = (): GroupPersonalAccidentPremiumRequest => {
        return {
            class_id: "19",
            total_suminsured: totalSuminsured,
            get_direct_discount: directDiscount ? "y" : "n",
            total_person: totalPerson,
        } as GroupPersonalAccidentPremiumRequest;
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
                "accident.groupPersonalAccidentPayload",
                JSON.stringify(payload),
            );

            const response = await getGroupPersonalAccidentPremium(payload);

            localStorage.setItem(
                "accident.groupPersonalAccidentPremiumResponse",
                JSON.stringify(response),
            );

            setPremiumResponse(response);
            setStep(2);
        } catch (error: any) {
            setInlineError(
                error?.message ||
                "Failed to calculate group personal accident premium",
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
                                Group Personal Accident Premium Details
                            </h1>

                            <p className="mt-1 text-sm text-muted-foreground">
                                Premium calculated for {totalPerson} person(s).
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
                                        <PremiumRow
                                            label="Sum Insured"
                                            value={amount.suminsured}
                                        />

                                        <PremiumRow
                                            label="Basic Premium Amount"
                                            value={amount.premium_amount}
                                        />

                                        <PremiumRow
                                            label="RS/MD/ST"
                                            value={amount.pool_amount}
                                        />

                                        <PremiumRow
                                            label="Direct Discount"
                                            value={
                                                premiumResponse.direct_discount_amount ??
                                                0
                                            }
                                            isLess
                                        />

                                        <PremiumRow
                                            label="Taxable Amount"
                                            value={amount.taxable_amount}
                                        />

                                        
                                        <PremiumRow
                                            label="Stamp Duty"
                                            value={amount.stamp_duty}
                                        />

                                       
                                        <tr className="bg-[#b71319] text-white">
                                            <td className="border-r border-white px-4 py-4 text-base font-bold">
                                                Total Premium
                                            </td>

                                            <td className="px-4 py-4 text-right text-base font-bold">
                                                {" "}
                                                {formatAmount(
                                                    premiumResponse.total_premium_with_vat,
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
                                    Buy policy
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
                            Group Personal Accident Insurance
                        </h1>

                        <p className="mt-1 text-sm text-muted-foreground">
                            Enter no. of person, total sum insured, and direct
                            discount to calculate GPA premium.
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
                        <Label htmlFor="totalPerson">
                            No. of Person *
                        </Label>

                        <Input
                            id="totalPerson"
                            type="text"
                            inputMode="numeric"
                            value={totalPerson}
                            placeholder="Example: 4"
                            onChange={(event) =>
                                handleNumberInput(
                                    event.target.value,
                                    setTotalPerson,
                                    "totalPerson",
                                )
                            }
                            className={`mt-2 h-12 ${errors.totalPerson
                                    ? "border-red-500"
                                    : ""
                                }`}
                        />

                        {errors.totalPerson && (
                            <p className="mt-1 text-xs text-red-600">
                                {errors.totalPerson}
                            </p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="totalSuminsured">
                            Total Sum Insured *
                        </Label>

                        <Input
                            id="totalSuminsured"
                            type="text"
                            inputMode="numeric"
                            value={totalSuminsured}
                            placeholder="Example: 1000000"
                            onChange={(event) =>
                                handleNumberInput(
                                    event.target.value,
                                    setTotalSuminsured,
                                    "totalSuminsured",
                                )
                            }
                            className={`mt-2 h-12 ${errors.totalSuminsured
                                    ? "border-red-500"
                                    : ""
                                }`}
                        />

                        {errors.totalSuminsured && (
                            <p className="mt-1 text-xs text-red-600">
                                {errors.totalSuminsured}
                            </p>
                        )}
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

            </div>
        </div>
    );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
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
    value: number | string | null | undefined;
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
                {textOnly
                    ? value
                    : isLess
                        ? `(${formatAmount(value)})`
                        : formatAmount(value)}
            </td>
        </tr>
    );
}