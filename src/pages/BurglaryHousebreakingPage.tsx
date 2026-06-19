import { useMemo, useState } from "react";
import { z } from "zod";

const formSchema = z.object({
    description: z.string().min(1, "Please select a description."),
    sumInsured: z
        .string()
        .min(1, "Sum insured is required.")
        .refine((v) => /^\d+$/.test(v) && Number(v) > 0, {
            message: "Please enter a valid sum insured.",
        }),
});
import { ChevronLeft, LogIn, UserPlus, Home, ArrowLeft, ArrowRight } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import logo from "@/assets/logo.png";
import { Switch } from "@/components/ui/switch";

type DescriptionOption = {
    label: string;
    rate: number;
};

const descriptionOptions: DescriptionOption[] = [
    {
        label: "Goods in bulk quantity / Merchandized goods",
        rate: 0.001,
    },
    {
        label: "Hand Carriable Goods (e.g. mobile, camera, watch)",
        rate: 0.003,
    },
    {
        label: "Gold & Jewellery Shop",
        rate: 0.005,
    },
];

const formatMoney = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value || 0);
};

export default function BurglaryHousebreakingPage() {
    const navigate = useNavigate();

    const [step, setStep] = useState<1 | 2>(1);
    const [errors, setErrors] = useState<{ description?: string; sumInsured?: string }>({});

    const [description, setDescription] = useState("");
    const [sumInsured, setSumInsured] = useState("");

    const [corpDiscount, setCorpDiscount] = useState<"YES" | "NO">("YES");
    const [firstLossBasis, setFirstLossBasis] = useState<"YES" | "NO">("NO");
    const [firstLossDiscount, setFirstLossDiscount] = useState<"YES" | "NO">("NO");

    const calculation = useMemo(() => {
        const insuredAmount = Number(sumInsured || 0);

        const selectedDescription =
            descriptionOptions.find((item) => item.label === description) ||
            descriptionOptions[0];

        const rate = selectedDescription.rate;

        const basePremium = rate * insuredAmount;

        const discountPercent = corpDiscount === "YES" ? 2.5 : 0;
        const discountAmount = (basePremium * discountPercent) / 100;

        const subTotal = basePremium - discountAmount;
        const vat = subTotal * 0.13;
        const stampDuty = insuredAmount > 1 ? 20 : 0;
        const totalPremium = subTotal + vat + stampDuty;

        const firstLossSumInsured =
            firstLossBasis === "YES" && insuredAmount >= 100000000
                ? insuredAmount * 0.25
                : 0;

        const firstLossPremium = rate * 2 * firstLossSumInsured;

        const firstLossDiscountPercent = firstLossDiscount === "YES" ? 2.5 : 0;
        const firstLossDiscountAmount =
            (firstLossPremium * firstLossDiscountPercent) / 100;

        const firstLossSubTotal = firstLossPremium - firstLossDiscountAmount;
        const firstLossVat = firstLossSubTotal * 0.13;
        const firstLossStampDuty = firstLossSumInsured > 1 ? 20 : 0;
        const firstLossTotal =
            firstLossSubTotal + firstLossVat + firstLossStampDuty;

        return {
            rate,
            insuredAmount,
            basePremium,
            discountPercent,
            discountAmount,
            subTotal,
            vat,
            stampDuty,
            totalPremium,
            firstLossSumInsured,
            firstLossPremium,
            firstLossDiscountPercent,
            firstLossDiscountAmount,
            firstLossSubTotal,
            firstLossVat,
            firstLossStampDuty,
            firstLossTotal,
        };
    }, [
        description,
        sumInsured,
        corpDiscount,
        firstLossBasis,
        firstLossDiscount,
    ]);

    const handleSumInsuredChange = (value: string) => {
        const onlyNumber = value.replace(/[^0-9]/g, "");
        setSumInsured(onlyNumber);
    };

    const handleNext = () => {
        const result = formSchema.safeParse({ description, sumInsured });
        if (!result.success) {
            const fieldErrors = result.error.flatten().fieldErrors;
            setErrors({
                description: fieldErrors.description?.[0],
                sumInsured: fieldErrors.sumInsured?.[0],
            });
            return;
        }
        setErrors({});
        setStep(2);
    };


    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur">
                <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                    <div className="h-16 flex items-center justify-between gap-3">
                        <Link
                            to="/"
                            className="flex items-center gap-3 min-w-0 hover:opacity-80 transition-opacity"
                        >
                            <img
                                src={logo}
                                alt="Prabhu Insurance"
                                className="h-9 w-auto shrink-0"
                            />
                        </Link>
                        <div className="flex items-center gap-2 shrink-0">
                            <Link to="/login">
                                <Button size="sm" className="gap-2">
                                    <LogIn className="h-4 w-4" />
                                    <span className="hidden sm:inline">Login</span>
                                    <span className="sm:hidden">Login</span>
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Page content */}
            <main className="flex-1">
                <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                    {/* Page title + back */}
                    <div className="mb-6 flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() =>
                                step === 2 ? setStep(1) : navigate(-1)
                            }
                            className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-gray-100"
                        >
                            <ChevronLeft className="h-5 w-5 text-black" />
                        </button>
                        <div>
                            <h1 className="text-lg font-bold text-black">
                                Burglary &amp; Housebreaking Insurance
                            </h1>

                        </div>
                    </div>



                    {/* ── STEP 1 ── */}
                    {step === 1 && (
                        <Card className="mb-8">
                            <CardContent className="pt-6 space-y-5">
                                <div className="grid gap-5 md:grid-cols-2">
                                    <div>
                                        <Label htmlFor="description">
                                            Description
                                        </Label>
                                        <Select
                                            value={description}
                                            onValueChange={setDescription}
                                        >
                                            <SelectTrigger
                                                id="description"
                                                className="mt-2"
                                            >
                                                <SelectValue placeholder="Select description" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {descriptionOptions.map(
                                                    (item) => (
                                                        <SelectItem
                                                            key={item.label}
                                                            value={item.label}
                                                        >
                                                            {item.label}
                                                        </SelectItem>
                                                    ),
                                                )}
                                            </SelectContent>
                                        </Select>
                                        {errors.description && (
                                            <p className="mt-1 text-xs text-red-600">{errors.description}</p>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor="sumInsured">
                                            Sum Insured
                                        </Label>
                                        <Input
                                            id="sumInsured"
                                            value={sumInsured}
                                            onChange={(e) => {
                                                handleSumInsuredChange(e.target.value);
                                                if (errors.sumInsured) setErrors((prev) => ({ ...prev, sumInsured: undefined }));
                                            }}
                                            placeholder="Enter sum insured"
                                            className={`mt-2 ${errors.sumInsured ? "border-red-500" : ""}`}
                                        />
                                        {errors.sumInsured && (
                                            <p className="mt-1 text-xs text-red-600">{errors.sumInsured}</p>
                                        )}
                                    </div>

                                    {/* Corp Discount */}
                                   <div className="md:col-span-2">
                                            <div className="inline-flex cursor-pointer items-center gap-3 mt-4">

                                                <Switch
                                                    checked={corpDiscount === "YES"}
                                                    onCheckedChange={(checked) => setCorpDiscount(checked ? "YES" : "NO")}
                                                />
                                                <Label
                                                    htmlFor="directDiscount"
                                                    className="cursor-pointer text-sm font-medium"
                                                >
                                                    Direct Discount
                                                </Label>
                                            </div>
                                       </div>



                                    {/* First Loss Corp Discount */}
                                    {firstLossBasis === "YES" && (
                                        <div className="rounded-lg border bg-gray-50 p-4 md:col-span-2">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <Label className="text-sm font-medium text-gray-700">
                                                        First Loss Corp Discount
                                                    </Label>
                                                    <p className="text-xs text-gray-500">
                                                        {firstLossDiscount === "YES" ? "2.5% discount applied on first loss premium" : "No discount (0%) on first loss premium"}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-xs font-semibold ${firstLossDiscount === "YES" ? "text-red-600" : "text-gray-400"}`}>
                                                        {firstLossDiscount === "YES" ? "YES" : "NO"}
                                                    </span>
                                                    <Switch
                                                        checked={firstLossDiscount === "YES"}
                                                        onCheckedChange={(checked) => setFirstLossDiscount(checked ? "YES" : "NO")}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-between pt-2">
                                    <Button
                                        variant="outline"
                                        className="gap-2"
                                        onClick={() => navigate(-1)}
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        BACK
                                    </Button>
                                    <Button
                                        size="lg"
                                        className="px-8"
                                        onClick={handleNext}
                                    >
                                        Calculate
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* ── STEP 2 ── */}
                    {step === 2 && (
                        <>


                            {/* Premium table */}
                            <div className="overflow-hidden rounded-md border mb-6">
                                <table className="w-full text-sm border-collapse">
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
                                        <tr className="border-b bg-[#fff7f3]">
                                            <td className="border-r border-white px-4 py-3 text-black">Rate</td>
                                            <td className="px-4 py-3 text-right font-medium text-black">
                                                {calculation.rate}
                                            </td>
                                        </tr>
                                        <tr className="border-b bg-[#fff7f3]">
                                            <td className="border-r border-white px-4 py-3 text-black">Sum Insured</td>
                                            <td className="px-4 py-3 text-right font-medium text-black">
                                                {formatMoney(calculation.insuredAmount)}
                                            </td>
                                        </tr>
                                        <tr className="border-b bg-[#fff7f3]">
                                            <td className="border-r border-white px-4 py-3 text-black">Basic Premium</td>
                                            <td className="px-4 py-3 text-right font-medium text-black">
                                                {formatMoney(calculation.basePremium)}
                                            </td>
                                        </tr>
                                        <tr className="border-b bg-[#fff7f3]">
                                            <td className="border-r border-white px-4 py-3 text-red-600">
                                                Less : Direct discount
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium text-red-600">
                                                ({formatMoney(calculation.discountAmount)})
                                            </td>
                                        </tr>
                                        <tr className="border-b bg-[#fff7f3]">
                                            <td className="border-r border-white px-4 py-3 font-semibold text-black">Sub Total</td>
                                            <td className="px-4 py-3 text-right font-semibold text-black">
                                                {formatMoney(calculation.subTotal)}
                                            </td>
                                        </tr>
                                        <tr className="border-b bg-[#fff7f3]">
                                            <td className="border-r border-white px-4 py-3 text-black">Add: 13% VAT</td>
                                            <td className="px-4 py-3 text-right font-medium text-black">
                                                {formatMoney(calculation.vat)}
                                            </td>
                                        </tr>
                                        <tr className="border-b bg-[#fff7f3]">
                                            <td className="border-r border-white px-4 py-3 text-black">Add: Stamp Duty</td>
                                            <td className="px-4 py-3 text-right font-medium text-black">
                                                {formatMoney(calculation.stampDuty)}
                                            </td>
                                        </tr>
                                        <tr className="bg-[#b71319] text-white">
                                            <td className="border-r border-white px-4 py-4 text-base font-bold">
                                                Total Premium
                                            </td>
                                            <td className="px-4 py-4 text-right text-base font-bold">
                                                {formatMoney(calculation.totalPremium)}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* First Loss table */}
                            {firstLossBasis === "YES" && (
                                <div className="overflow-hidden rounded-md border mb-6">
                                    <table className="w-full text-sm border-collapse">
                                        <thead>
                                            <tr className="bg-gray-800 text-white">
                                                <th className="border-r border-white px-4 py-3 text-left font-bold">
                                                    First Loss Basis
                                                </th>
                                                <th className="px-4 py-3 text-right font-bold">
                                                    Amount NPR
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="border-b bg-[#fff7f3]">
                                                <td className="border-r border-white px-4 py-3 text-black">First Loss Sum Insured</td>
                                                <td className="px-4 py-3 text-right font-medium text-black">
                                                    {formatMoney(calculation.firstLossSumInsured)}
                                                </td>
                                            </tr>
                                            <tr className="border-b bg-[#fff7f3]">
                                                <td className="border-r border-white px-4 py-3 text-black">First Loss Premium</td>
                                                <td className="px-4 py-3 text-right font-medium text-black">
                                                    {formatMoney(calculation.firstLossPremium)}
                                                </td>
                                            </tr>
                                            <tr className="border-b bg-[#fff7f3]">
                                                <td className="border-r border-white px-4 py-3 text-red-600">
                                                    Less : Corp Discount{" "}
                                                    {calculation.firstLossDiscountPercent > 0
                                                        ? `(${calculation.firstLossDiscountPercent}%)`
                                                        : ""}
                                                </td>
                                                <td className="px-4 py-3 text-right font-medium text-red-600">
                                                    ({formatMoney(calculation.firstLossDiscountAmount)})
                                                </td>
                                            </tr>
                                            <tr className="border-b bg-[#fff7f3]">
                                                <td className="border-r border-white px-4 py-3 font-semibold text-black">Sub Total</td>
                                                <td className="px-4 py-3 text-right font-semibold text-black">
                                                    {formatMoney(calculation.firstLossSubTotal)}
                                                </td>
                                            </tr>
                                            <tr className="border-b bg-[#fff7f3]">
                                                <td className="border-r border-white px-4 py-3 text-black">Add: 13% VAT</td>
                                                <td className="px-4 py-3 text-right font-medium text-black">
                                                    {formatMoney(calculation.firstLossVat)}
                                                </td>
                                            </tr>
                                            <tr className="border-b bg-[#fff7f3]">
                                                <td className="border-r border-white px-4 py-3 text-black">Add: Stamp Duty</td>
                                                <td className="px-4 py-3 text-right font-medium text-black">
                                                    {formatMoney(calculation.firstLossStampDuty)}
                                                </td>
                                            </tr>
                                            <tr className="bg-gray-800 text-white">
                                                <td className="border-r border-white px-4 py-4 text-base font-bold">
                                                    First Loss Total Premium
                                                </td>
                                                <td className="px-4 py-4 text-right text-base font-bold">
                                                    {formatMoney(calculation.firstLossTotal)}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            )}
                            {/* Back / Home buttons */}
                            <div className="flex items-center justify-between">
                                <Button
                                    variant="outline"
                                    className="gap-2"
                                    onClick={() => setStep(1)}
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Back
                                </Button>
                                <Button
                                    className="gap-2 bg-red-600 text-white hover:bg-red-700"
                                    onClick={() => navigate("/")}
                                >
                                    Home
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </div>

                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
