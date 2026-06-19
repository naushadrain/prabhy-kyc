import { useMemo, useState } from "react";
import { ChevronLeft, ArrowLeft, LogIn, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import logo from "@/assets/logo.png";

type YesNo = "YES" | "NO";

const cashFormSchema = z.object({
    vaultAmount: z.string().min(1, "Cash in Vault/Safe is required"),
    counterAmount: z.string().min(1, "Cash in Counter is required"),
    transitAmount: z.string().min(1, "Cash in Transit is required"),
    assetsAmount: z.string().min(1, "Cash Assets / Equivalents is required"),
    propertyRisk: z.enum(["YES", "NO"], { errorMap: () => ({ message: "Please select an option" }) }),
    propertyRiskTransit: z.enum(["YES", "NO"], { errorMap: () => ({ message: "Please select an option" }) }),
});

type FormErrors = Partial<Record<keyof z.infer<typeof cashFormSchema>, string>>;

type YesNoValue = YesNo | "";

type MoneyInputFieldProps = {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    error?: string;
};

type DirectDiscountSwitchProps = {
    value: YesNo;
    onChange: (value: YesNo) => void;
};

type YesNoSelectFieldProps = {
    label: string;
    value: YesNoValue;
    onChange: (value: YesNo) => void;
    error?: string;
};

const formatMoney = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value || 0);
};

const parseMoney = (value: string) => {
    const raw = value.toLowerCase().replace(/,/g, "").trim();

    if (!raw) return 0;

    const numberMatch = raw.match(/\d+(\.\d+)?/);
    const amount = numberMatch ? Number(numberMatch[0]) : 0;

    if (raw.includes("crore") || raw.includes("cr")) {
        return amount * 10000000;
    }

    if (raw.includes("lakh") || raw.includes("lac")) {
        return amount * 100000;
    }

    if (raw.includes("thousand") || raw.includes("k")) {
        return amount * 1000;
    }

    return amount;
};

const MoneyInputField = ({
    id,
    label,
    value,
    onChange,
    error,
}: MoneyInputFieldProps) => {
    return (
        <div>
            <Label
                htmlFor={id}
                className="mb-2 block text-sm font-medium text-gray-700"
            >
                {label}
            </Label>

            <Input
                id={id}
                type="text"
                inputMode="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Enter Sum Insured Amount"
                className={`h-11 w-full ${
                    error ? "border-red-500 focus-visible:ring-red-500" : ""
                }`}
            />

            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
    );
};

const YesNoSelectField = ({
    label,
    value,
    onChange,
    error,
}: YesNoSelectFieldProps) => {
    return (
        <div>
            <Label className="mb-2 block text-sm font-medium text-gray-700">
                {label}
            </Label>

            <Select value={value} onValueChange={(v) => onChange(v as YesNo)}>
                <SelectTrigger className={`h-11 w-full ${error ? "border-red-500 focus-visible:ring-red-500" : ""}`}>
                    <SelectValue placeholder="Select YES / NO" />
                </SelectTrigger>

                <SelectContent>
                    <SelectItem value="YES">YES</SelectItem>
                    <SelectItem value="NO">NO</SelectItem>
                </SelectContent>
            </Select>

            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
    );
};

const DirectDiscountSwitch = ({
    value,
    onChange,
}: DirectDiscountSwitchProps) => {
    const checked = value === "YES";

    return (
        <div>
            <div className="mb-2 flex items-center gap-2">
                <Switch
                    checked={checked}
                    onCheckedChange={(isChecked) =>
                        onChange(isChecked ? "YES" : "NO")
                    }
                />
                <Label className="cursor-pointer text-sm font-medium text-gray-700">
                    Direct Discount
                </Label> 
            </div>
        </div>
    );
};

export default function CashInsurancePage() {
    const navigate = useNavigate();

    const [step, setStep] = useState<1 | 2>(1);

    const [vaultAmount, setVaultAmount] = useState("");
    const [counterAmount, setCounterAmount] = useState("");
    const [transitAmount, setTransitAmount] = useState("");
    const [assetsAmount, setAssetsAmount] = useState("");

    const [propertyRisk, setPropertyRisk] = useState<YesNoValue>("");
    const [propertyRiskTransit, setPropertyRiskTransit] =
        useState<YesNoValue>("");

    const [directDiscount, setDirectDiscount] = useState<YesNo>("YES");
    const [errors, setErrors] = useState<FormErrors>({});

    const calculation = useMemo(() => {
        const vault = parseMoney(vaultAmount);
        const counter = parseMoney(counterAmount);
        const transit = parseMoney(transitAmount);
        const assets = parseMoney(assetsAmount);

        const vaultPremium = vault * 0.002;
        const counterPremium = counter * 0.002;
        const transitPremium = transit * 0.015;
        const assetsPremium = assets * 0.002;

        const propertyRiskPremium =
            propertyRisk === "YES"
                ? (vault + counter + assets) * 0.0015
                : 0;

        const propertyRiskTransitPremium =
            propertyRiskTransit === "YES" ? transit * 0.0015 : 0;

        const grossPremium =
            vaultPremium +
            counterPremium +
            transitPremium +
            assetsPremium +
            propertyRiskPremium +
            propertyRiskTransitPremium;

        const directDiscountPercent = directDiscount === "YES" ? 2.5 : 0;
        const directDiscountAmount =
            (grossPremium * directDiscountPercent) / 100;

        const normalTotal = grossPremium - directDiscountAmount;

        const totalMoney = vault + counter + transit + assets;

        const rsdMdStPremium = totalMoney * 0.00125;

        const subTotal = normalTotal + rsdMdStPremium;
        const vat = subTotal * 0.13;
        const stampDuty = totalMoney > 0 ? 20 : 0;
        const totalPremium = subTotal + vat + stampDuty;

        return {
            vault,
            counter,
            transit,
            assets,
            totalMoney,

            vaultPremium,
            counterPremium,
            transitPremium,
            assetsPremium,

            propertyRiskPremium,
            propertyRiskTransitPremium,

            grossPremium,
            directDiscountPercent,
            directDiscountAmount,
            normalTotal,

            rsdMdStPremium,
            subTotal,
            vat,
            stampDuty,
            totalPremium,
        };
    }, [
        vaultAmount,
        counterAmount,
        transitAmount,
        assetsAmount,
        propertyRisk,
        propertyRiskTransit,
        directDiscount,
    ]);

    const handleNext = () => {
        const result = cashFormSchema.safeParse({
            vaultAmount,
            counterAmount,
            transitAmount,
            assetsAmount,
            propertyRisk,
            propertyRiskTransit,
        });

        if (!result.success) {
            const fieldErrors: FormErrors = {};

            for (const issue of result.error.issues) {
                const key = issue.path[0] as keyof FormErrors;
                if (!fieldErrors[key]) fieldErrors[key] = issue.message;
            }

            setErrors(fieldErrors);
            return;
        }

        setErrors({});
        setStep(2);
    };

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur">
                <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between gap-3">
                        <Link
                            to="/"
                            className="flex min-w-0 items-center gap-3 transition-opacity hover:opacity-80"
                        >
                            <img
                                src={logo}
                                alt="Prabhu Insurance"
                                className="h-9 w-auto shrink-0"
                            />
                        </Link>

                        <Link to="/login">
                            <Button size="sm" className="gap-2">
                                <LogIn className="h-4 w-4" />
                                Login
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            <main className="flex-1">
                <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
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
                                Cash Insurance
                            </h1>
                            <p className="text-sm text-gray-500">
                                {step === 1
                                    ? "Step 1: Enter Details"
                                    : "Step 2: Premium Calculation Details"}
                            </p>
                        </div>
                    </div>

                    {step === 1 && (
                        <Card className="mb-8">
                            <CardContent className="space-y-6 pt-6">
                                <div>
                                    <h2 className="text-lg font-bold text-black">
                                        Cash Insurance Details
                                    </h2>
                                    <p className="text-sm text-gray-500">
                                        Enter the money amount only. Premium will
                                        calculate automatically.
                                    </p>
                                </div>

                                <div className="grid gap-5 md:grid-cols-2">
                                    <MoneyInputField
                                        id="vaultAmount"
                                        label="Cash in Vault/Safe"
                                        value={vaultAmount}
                                        onChange={setVaultAmount}
                                        error={errors.vaultAmount}
                                    />

                                    <MoneyInputField
                                        id="counterAmount"
                                        label="Cash in Counter"
                                        value={counterAmount}
                                        onChange={setCounterAmount}
                                        error={errors.counterAmount}
                                    />

                                    <MoneyInputField
                                        id="transitAmount"
                                        label="Cash in Transit"
                                        value={transitAmount}
                                        onChange={setTransitAmount}
                                        error={errors.transitAmount}
                                    />

                                    <MoneyInputField
                                        id="assetsAmount"
                                        label="Cash Assets / Equivalents"
                                        value={assetsAmount}
                                        onChange={setAssetsAmount}
                                        error={errors.assetsAmount}
                                    />

                                    <YesNoSelectField
                                        label="Add- Property Risk (for vault, safe & cash assets)"
                                        value={propertyRisk}
                                        onChange={(v) => { setPropertyRisk(v); if (errors.propertyRisk) setErrors((p) => ({ ...p, propertyRisk: undefined })); }}
                                        error={errors.propertyRisk}
                                    />

                                    <YesNoSelectField
                                        label="Add- Property Risk on Transit"
                                        value={propertyRiskTransit}
                                        onChange={(v) => { setPropertyRiskTransit(v); if (errors.propertyRiskTransit) setErrors((p) => ({ ...p, propertyRiskTransit: undefined })); }}
                                        error={errors.propertyRiskTransit}
                                    />

                                    <div className="md:col-span-2">
                                        <DirectDiscountSwitch
                                            value={directDiscount}
                                            onChange={setDirectDiscount}
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-between pt-2">
                                    <Button
                                        variant="outline"
                                        className="gap-2"
                                        onClick={() => navigate(-1)}
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                        BACK
                                    </Button>

                                    <Button
                                        size="lg"
                                        className="px-8"
                                        onClick={handleNext}
                                    >
                                        Calculate
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {step === 2 && (
                        <>
                            <div className="mb-6 overflow-hidden rounded-md border">
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
                                        <tr className="border-b bg-[#fff7f3]">
                                            <td className="border-r border-white px-4 py-3 text-black">
                                                Cash in Vault/Safe Premium
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium text-black">
                                                {formatMoney(
                                                    calculation.vaultPremium,
                                                )}
                                            </td>
                                        </tr>

                                        <tr className="border-b bg-[#fff7f3]">
                                            <td className="border-r border-white px-4 py-3 text-black">
                                                Cash in Counter Premium
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium text-black">
                                                {formatMoney(
                                                    calculation.counterPremium,
                                                )}
                                            </td>
                                        </tr>

                                        <tr className="border-b bg-[#fff7f3]">
                                            <td className="border-r border-white px-4 py-3 text-black">
                                                Cash in Transit Premium
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium text-black">
                                                {formatMoney(
                                                    calculation.transitPremium,
                                                )}
                                            </td>
                                        </tr>

                                        <tr className="border-b bg-[#fff7f3]">
                                            <td className="border-r border-white px-4 py-3 text-black">
                                                Cash Assets / Equivalents Premium
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium text-black">
                                                {formatMoney(
                                                    calculation.assetsPremium,
                                                )}
                                            </td>
                                        </tr>

                                        <tr className="border-b bg-[#fff7f3]">
                                            <td className="border-r border-white px-4 py-3 text-black">
                                                Add - Property Risk{" "}
                                                {propertyRisk === "YES"
                                                    ? "(0.15%)"
                                                    : "(0%)"}
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium text-black">
                                                {formatMoney(
                                                    calculation.propertyRiskPremium,
                                                )}
                                            </td>
                                        </tr>

                                        <tr className="border-b bg-[#fff7f3]">
                                            <td className="border-r border-white px-4 py-3 text-black">
                                                Add - Property Risk on Transit{" "}
                                                {propertyRiskTransit === "YES"
                                                    ? "(0.15%)"
                                                    : "(0%)"}
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium text-black">
                                                {formatMoney(
                                                    calculation.propertyRiskTransitPremium,
                                                )}
                                            </td>
                                        </tr>

                                        <tr className="border-b bg-[#fff7f3]">
                                            <td className="border-r border-white px-4 py-3 font-semibold text-black">
                                                Gross Premium
                                            </td>
                                            <td className="px-4 py-3 text-right font-semibold text-black">
                                                {formatMoney(
                                                    calculation.grossPremium,
                                                )}
                                            </td>
                                        </tr>

                                        <tr className="border-b bg-[#fff7f3]">
                                            <td className="border-r border-white px-4 py-3 text-red-600">
                                                Less : Direct Discount{" "}
                                                {directDiscount === "YES"
                                                    ? "(2.5%)"
                                                    : "(0%)"}
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium text-red-600">
                                                (
                                                {formatMoney(
                                                    calculation.directDiscountAmount,
                                                )}
                                                )
                                            </td>
                                        </tr>

                                        <tr className="border-b bg-[#fff7f3]">
                                            <td className="border-r border-white px-4 py-3 font-semibold text-black">
                                                Normal Total
                                            </td>
                                            <td className="px-4 py-3 text-right font-semibold text-black">
                                                {formatMoney(
                                                    calculation.normalTotal,
                                                )}
                                            </td>
                                        </tr>

                                        <tr className="border-b bg-[#fff7f3]">
                                            <td className="border-r border-white px-4 py-3 text-black">
                                                Add: RSD/MD/ST
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium text-black">
                                                {formatMoney(
                                                    calculation.rsdMdStPremium,
                                                )}
                                            </td>
                                        </tr>

                                        <tr className="border-b bg-[#fff7f3]">
                                            <td className="border-r border-white px-4 py-3 font-semibold text-black">
                                                Sub Total
                                            </td>
                                            <td className="px-4 py-3 text-right font-semibold text-black">
                                                {formatMoney(
                                                    calculation.subTotal,
                                                )}
                                            </td>
                                        </tr>

                                        <tr className="border-b bg-[#fff7f3]">
                                            <td className="border-r border-white px-4 py-3 text-black">
                                                Add: 13% VAT
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium text-black">
                                                {formatMoney(calculation.vat)}
                                            </td>
                                        </tr>

                                        <tr className="border-b bg-[#fff7f3]">
                                            <td className="border-r border-white px-4 py-3 text-black">
                                                Add: Stamp Duty
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium text-black">
                                                {formatMoney(
                                                    calculation.stampDuty,
                                                )}
                                            </td>
                                        </tr>

                                        <tr className="bg-[#b71319] text-white">
                                            <td className="border-r border-white px-4 py-4 text-base font-bold">
                                                Total Premium
                                            </td>
                                            <td className="px-4 py-4 text-right text-base font-bold">
                                                {formatMoney(
                                                    calculation.totalPremium,
                                                )}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

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
                                    className="bg-red-600 px-8 text-white hover:bg-red-700"
                                    onClick={() => navigate("/")}
                                >
                                    Home
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}