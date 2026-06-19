import { useMemo, useState } from "react";
import { z } from "zod";
import { ArrowLeft, ChevronLeft, LogIn } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
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

const agricultureStep2Schema = z.object({
    selectedItem: z.string().min(1, "Please select an item"),
    noOfInsured: z.string().min(1, "No. of Insured is required"),
    sumInsuredEach: z.string().min(1, "Sum Insured Each is required"),
    noOfOwner: z.string().min(1, "No. of Owner is required"),
});

type Step2Errors = Partial<Record<keyof z.infer<typeof agricultureStep2Schema>, string>>;

type AgricultureType = "Livestock" | "Crop";

type AgricultureOption = {
    name: string;
    rate: number;
    type: AgricultureType;
    period: string;
};

const agricultureOptions: AgricultureOption[] = [
    {
        name: "Cow",
        rate: 0.05,
        type: "Livestock",
        period: "1 Year",
    },
    {
        name: "Buffalo",
        rate: 0.05,
        type: "Livestock",
        period: "1 Year",
    },
    {
        name: "Goat / Sheep",
        rate: 0.05,
        type: "Livestock",
        period: "1 Year",
    },
    {
        name: "Horse",
        rate: 0.05,
        type: "Livestock",
        period: "1 Year",
    },
    {
        name: "Pig",
        rate: 0.05,
        type: "Livestock",
        period: "1 Year",
    },
    {
        name: "Fish",
        rate: 0.03,
        type: "Livestock",
        period: "1 Year",
    },
    {
        name: "Honey Bee",
        rate: 0.05,
        type: "Livestock",
        period: "1 Year",
    },
    {
        name: "Broiler",
        rate: 0.0125,
        type: "Livestock",
        period: "56 Days",
    },
    {
        name: "Layers / Parent",
        rate: 0.05,
        type: "Livestock",
        period: "1 Year",
    },
    {
        name: "Vegetables",
        rate: 0.07,
        type: "Crop",
        period: "Depends on cultivation period",
    },
    {
        name: "Cereals (Paddy, Maize, Wheat)",
        rate: 0.05,
        type: "Crop",
        period: "Depends on cultivation period",
    },
    {
        name: "Cereals (Barley, Millet)",
        rate: 0.03,
        type: "Crop",
        period: "Depends on cultivation period",
    },
    {
        name: "Fruit",
        rate: 0.05,
        type: "Crop",
        period: "Depends on cultivation period",
    },
];

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

    if (raw.includes("crore") || raw.includes("cr")) return amount * 10000000;
    if (raw.includes("lakh") || raw.includes("lac")) return amount * 100000;
    if (raw.includes("thousand") || raw.includes("k")) return amount * 1000;

    return amount;
};

const MoneyInputField = ({
    id,
    label,
    value,
    onChange,
    placeholder = "Enter amount",
}: {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}) => {
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
                placeholder={placeholder}
                className="h-11 w-full"
            />
        </div>
    );
};

const TextInputField = ({
    id,
    label,
    value,
    onChange,
    placeholder,
}: {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
}) => {
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
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="h-11 w-full"
            />
        </div>
    );
};

const NumberInputField = ({
    id,
    label,
    value,
    onChange,
    placeholder,
}: {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
}) => {
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
                inputMode="numeric"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="h-11 w-full"
            />
        </div>
    );
};

export default function AgricultureInsurancePage() {
    const navigate = useNavigate();

    const [step, setStep] = useState<1 | 2 | 3>(1);

    const [insuredName, setInsuredName] = useState("");
    const [address, setAddress] = useState("");

    const [agricultureType, setAgricultureType] =
        useState<AgricultureType>("Livestock");

    const livestockOptions = agricultureOptions.filter(
        (item) => item.type === "Livestock",
    );

    const cropOptions = agricultureOptions.filter(
        (item) => item.type === "Crop",
    );

    const [selectedItem, setSelectedItem] = useState("");
    const [noOfInsured, setNoOfInsured] = useState("");
    const [sumInsuredEach, setSumInsuredEach] = useState("");
    const [noOfOwner, setNoOfOwner] = useState("");

    const [step2Errors, setStep2Errors] = useState<Step2Errors>({});

    const filteredOptions =
        agricultureType === "Livestock" ? livestockOptions : cropOptions;

    const calculation = useMemo(() => {
        const item =
            agricultureOptions.find((option) => option.name === selectedItem) ||
            filteredOptions[0];

        const insuredCount = parseMoney(noOfInsured);
        const sumEach = parseMoney(sumInsuredEach);
        const ownerCount = parseMoney(noOfOwner);

        const totalSumInsured = insuredCount * sumEach;

        const premiumRate = item.rate;
        const grossPremium = totalSumInsured * premiumRate;

        const subsidyPercent =
            totalSumInsured <= 5000000
                ? 80
                : totalSumInsured <= 10000000
                  ? 65
                  : 50;

        const subsidyAmount = (grossPremium * subsidyPercent) / 100;

        const insuredContributionPercent = 100 - subsidyPercent;
        const insuredContribution =
            (grossPremium * insuredContributionPercent) / 100;

        const paPremium = totalSumInsured > 0 ? ownerCount * 200 : 0;

        const stampDuty =
            totalSumInsured <= 0 ? 0 : totalSumInsured <= 100000 ? 10 : 20;

        const totalPremiumToBePaid =
            insuredContribution + paPremium + stampDuty;

        return {
            item,
            insuredCount,
            sumEach,
            ownerCount,

            totalSumInsured,
            premiumRate,
            grossPremium,

            subsidyPercent,
            subsidyAmount,

            insuredContributionPercent,
            insuredContribution,

            paPremium,
            stampDuty,
            totalPremiumToBePaid,
        };
    }, [
        selectedItem,
        noOfInsured,
        sumInsuredEach,
        noOfOwner,
        filteredOptions,
    ]);

    const handleTypeSelect = (type: AgricultureType) => {
        setAgricultureType(type);
        setSelectedItem("");
        setStep2Errors({});
        setStep(2);
    };

    const handleStepTwoNext = () => {
        const result = agricultureStep2Schema.safeParse({ selectedItem, noOfInsured, sumInsuredEach, noOfOwner });
        if (!result.success) {
            const fieldErrors: Step2Errors = {};
            for (const issue of result.error.issues) {
                const key = issue.path[0] as keyof Step2Errors;
                if (!fieldErrors[key]) fieldErrors[key] = issue.message;
            }
            setStep2Errors(fieldErrors);
            return;
        }
        setStep2Errors({});
        setStep(3);
    };

    const handleBack = () => {
        if (step === 3) {
            setStep(2);
            return;
        }

        if (step === 2) {
            setStep(1);
            return;
        }

        navigate(-1);
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
                            onClick={handleBack}
                            className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-gray-100"
                        >
                            <ChevronLeft className="h-5 w-5 text-black" />
                        </button>

                        <div>
                            <h1 className="text-lg font-bold text-black">
                                Agriculture Insurance
                            </h1>
                            <p className="text-sm text-gray-500">
                                {step === 1 &&
                                    "Step 1: Choose Livestock or Crop"}
                                {step === 2 &&
                                    `Step 2: Enter ${agricultureType} Details`}
                                {step === 3 &&
                                    "Step 3: Premium Calculation Details"}
                            </p>
                        </div>
                    </div>

                    

                    {step === 1 && (
                        <>
                            <p className="mb-8 text-muted-foreground">
                                Select the type of agriculture insurance that best suits you.
                            </p>

                            <div className="grid max-w-4xl gap-6 md:grid-cols-2">
                                <Card
                                    className="cursor-pointer border-2 p-6 transition-shadow hover:border-primary hover:shadow-lg"
                                    onClick={() => handleTypeSelect("Livestock")}
                                >
                                    <h3 className="mb-2 text-center text-lg font-bold">
                                        Livestock Insurance
                                    </h3>

                                    <div className="my-8 flex justify-center">
                                        <div className="flex h-32 w-32 items-center justify-center">
                                            <img
                                                src="/cow.svg"
                                                alt="Livestock"
                                                className="h-full w-full object-contain color-red-500"
                                            />
                                        </div>
                                    </div>

                                    <p className="text-center text-xs text-muted-foreground">
                                        Covers cattle, poultry, fish, and other livestock animals.
                                    </p>
                                </Card>

                                <Card
                                    className="cursor-pointer border-2 p-6 transition-shadow hover:border-primary hover:shadow-lg"
                                    onClick={() => handleTypeSelect("Crop")}
                                >
                                    <h3 className="mb-2 text-center text-lg font-bold">
                                        Crop Insurance
                                    </h3>

                                    <div className="my-8 flex justify-center">
                                        <div className="flex h-32 w-32 items-center justify-center">
                                            <img
                                                src="/agriculture-insurance.svg"
                                                alt="Crop"
                                                className="h-full w-full object-contain color-red-500"
                                            />
                                        </div>
                                    </div>

                                    <p className="text-center text-xs text-muted-foreground">
                                        Covers vegetables, cereals, fruits, and other crops.
                                    </p>
                                </Card>
                            </div>

                            <div className="mt-8 flex justify-start">
                                <Button
                                    variant="outline"
                                    className="gap-2"
                                    onClick={() => navigate(-1)}
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    BACK
                                </Button>
                            </div>
                        </>
                    )}

                    {step === 2 && (
                        <Card className="mb-8">
                            <CardContent className="space-y-6 pt-6">
                                <div>
                                    <h2 className="text-lg font-bold text-black">
                                        {agricultureType} Insurance Details
                                    </h2>
                                    <p className="text-sm text-gray-500">
                                        {agricultureType === "Livestock"
                                            ? "Only livestock items are shown in the dropdown."
                                            : "Only crop items are shown in the dropdown."}
                                    </p>
                                </div>

                                <div className="grid gap-5 md:grid-cols-2">
                                   
                                    <div>
                                        <Label className="mb-2 block text-sm font-medium text-gray-700">
                                            {agricultureType === "Livestock"
                                                ? "Livestock Items"
                                                : "Crop Items"}
                                        </Label>

                                        <Select
                                            value={selectedItem}
                                            onValueChange={(v) => { setSelectedItem(v); if (step2Errors.selectedItem) setStep2Errors((p) => ({ ...p, selectedItem: undefined })); }}
                                        >
                                            <SelectTrigger className={`h-11 w-full ${step2Errors.selectedItem ? "border-red-500 focus-visible:ring-red-500" : ""}`}>
                                                <SelectValue
                                                    placeholder={`Select ${agricultureType}`}
                                                />
                                            </SelectTrigger>

                                            <SelectContent>
                                                {filteredOptions.map(
                                                    (option) => (
                                                        <SelectItem
                                                            key={option.name}
                                                            value={option.name}
                                                        >
                                                            {option.name}
                                                        </SelectItem>
                                                    ),
                                                )}
                                            </SelectContent>
                                        </Select>
                                        {step2Errors.selectedItem && (
                                            <p className="mt-1 text-xs text-red-500">{step2Errors.selectedItem}</p>
                                        )}
                                    </div>

                                    <div>
                                        <NumberInputField
                                            id="noOfInsured"
                                            label="No. of Insured"
                                            value={noOfInsured}
                                            onChange={(v) => { setNoOfInsured(v); if (step2Errors.noOfInsured) setStep2Errors((p) => ({ ...p, noOfInsured: undefined })); }}
                                            placeholder="Example: 1"
                                        />
                                        {step2Errors.noOfInsured && <p className="mt-1 text-xs text-red-500">{step2Errors.noOfInsured}</p>}
                                    </div>

                                    <div>
                                        <MoneyInputField
                                            id="sumInsuredEach"
                                            label="Sum Insured Each"
                                            value={sumInsuredEach}
                                            onChange={(v) => { setSumInsuredEach(v); if (step2Errors.sumInsuredEach) setStep2Errors((p) => ({ ...p, sumInsuredEach: undefined })); }}
                                            placeholder="Enter amount"
                                        />
                                        {step2Errors.sumInsuredEach && <p className="mt-1 text-xs text-red-500">{step2Errors.sumInsuredEach}</p>}
                                    </div>

                                    <div>
                                        <NumberInputField
                                            id="noOfOwner"
                                            label="No. of Owner"
                                            value={noOfOwner}
                                            onChange={(v) => { setNoOfOwner(v); if (step2Errors.noOfOwner) setStep2Errors((p) => ({ ...p, noOfOwner: undefined })); }}
                                            placeholder="Example: 1"
                                        />
                                        {step2Errors.noOfOwner && <p className="mt-1 text-xs text-red-500">{step2Errors.noOfOwner}</p>}
                                    </div>
                                </div>

                                <div className="rounded-md border bg-red-50 p-3 text-sm text-red-700">
                                    <strong>Disclosure:</strong> Accidental
                                    insurance is mandatory. Stamp duty is Rs. 10
                                    up to Rs. 1 lakh and Rs. 20 above Rs. 1
                                    lakh.
                                </div>

                                <div className="flex justify-between pt-2">
                                    <Button
                                        variant="outline"
                                        className="gap-2"
                                        onClick={() => setStep(1)}
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                        BACK
                                    </Button>

                                    <Button
                                        size="lg"
                                        className="px-8"
                                        onClick={handleStepTwoNext}
                                    >
                                        Calculate
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {step === 3 && (
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
                                                No. of Insured
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium text-black">
                                                {calculation.insuredCount}
                                            </td>
                                        </tr>

                                        <tr className="border-b bg-[#fff7f3]">
                                            <td className="border-r border-white px-4 py-3 text-black">
                                                Sum Insured Each
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium text-black">
                                                {formatMoney(calculation.sumEach)}
                                            </td>
                                        </tr>

                                        <tr className="border-b bg-[#fff7f3]">
                                            <td className="border-r border-white px-4 py-3 font-semibold text-black">
                                                Total Sum Insured
                                            </td>
                                            <td className="px-4 py-3 text-right font-semibold text-black">
                                                {formatMoney(
                                                    calculation.totalSumInsured,
                                                )}
                                            </td>
                                        </tr>

                                        <tr className="border-b bg-[#fff7f3]">
                                            <td className="border-r border-white px-4 py-3 text-black">
                                                Gross Premium
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium text-black">
                                                {formatMoney(
                                                    calculation.grossPremium,
                                                )}
                                            </td>
                                        </tr>

                                        <tr className="border-b bg-[#fff7f3]">
                                            <td className="border-r border-white px-4 py-3 text-black">
                                                Government Subsidy
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium text-black">
                                                (
                                                {formatMoney(
                                                    calculation.subsidyAmount,
                                                )}
                                                )
                                            </td>
                                        </tr>

                                        <tr className="border-b bg-[#fff7f3]">
                                            <td className="border-r border-white px-4 py-3 font-semibold text-black">
                                                Insured&apos;s Contribution
                                            </td>
                                            <td className="px-4 py-3 text-right font-semibold text-black">
                                                {formatMoney(
                                                    calculation.insuredContribution,
                                                )}
                                            </td>
                                        </tr>

                                        <tr className="border-b bg-[#fff7f3]">
                                            <td className="border-r border-white px-4 py-3 text-black">
                                                Add: PA of Owner
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium text-black">
                                                {formatMoney(
                                                    calculation.paPremium,
                                                )}
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
                                                Total Premium to be Paid by Client
                                            </td>
                                            <td className="px-4 py-4 text-right text-base font-bold">
                                                {formatMoney(
                                                    calculation.totalPremiumToBePaid,
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
                                    onClick={() => setStep(2)}
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