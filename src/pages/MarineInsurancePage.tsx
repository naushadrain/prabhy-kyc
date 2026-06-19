import { useMemo, useState } from "react";
import { z } from "zod";
import { ArrowLeft, ArrowRight, ChevronLeft, LogIn } from "lucide-react";
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

const marineFormSchema = z.object({
    sumInsured: z.string().min(1, "Sum Insured is required"),
    riskCover: z.string().min(1, "Please select risk cover"),
    insuredItems: z.string().min(1, "Please select item/goods heading"),
    srcc: z.string().min(1, "Please select SRCC option"),
    tpnd: z.enum(["YES", "NO"], { errorMap: () => ({ message: "Please select an option" }) }),
    containerDiscount: z.enum(["YES", "NO"], { errorMap: () => ({ message: "Please select an option" }) }),
    directDiscount: z.enum(["YES", "NO"], { errorMap: () => ({ message: "Please select an option" }) }),
});

type FormErrors = Partial<Record<keyof z.infer<typeof marineFormSchema>, string>>;

type YesNo = "YES" | "NO";
type YesNoValue = YesNo | "";
type RiskCover = "All Risk" | "Basic" | "Minimum";

type GoodsOption = {
    name: string;
    allRisk: number;
    basic: number;
    minimum: number;
};

type SrccOption = {
    name: string;
    rate: number;
};

const goodsOptions: GoodsOption[] = [
    { name: "Autobomiles", allRisk: 0.26, basic: 0.14, minimum: 0.06 },
    { name: "Bagged Cargo in Gunny/Jute Bags", allRisk: 0.25, basic: 0.15, minimum: 0.06 },
    { name: "Bagged Cargo in Polythene/Double & woven sacs", allRisk: 0.22, basic: 0.13, minimum: 0.05 },
    { name: "Betlenuts", allRisk: 0.5, basic: 0.3, minimum: 0.12 },
    { name: "Beverages & Mineral Water in glass bottles", allRisk: 0.4, basic: 0.25, minimum: 0.1 },
    { name: "Beverages & Mineral Water in other packing", allRisk: 0.3, basic: 0.15, minimum: 0.06 },
    { name: "Cable & Wires", allRisk: 0.15, basic: 0.1, minimum: 0.04 },
    { name: "Cement", allRisk: 0.5, basic: 0.15, minimum: 0.06 },
    { name: "Chemicals (non hazardous)", allRisk: 0.3, basic: 0.18, minimum: 0.07 },
    { name: "Chemicals (hazardous)", allRisk: 0.4, basic: 0.25, minimum: 0.1 },
    { name: "Chemicals (extra hazardous)", allRisk: 0.5, basic: 0.3, minimum: 0.12 },
    { name: "Coal", allRisk: 0.5, basic: 0.4, minimum: 0.3 },
    { name: "Carpets, Textiles, Hosiery & Garment Raw Materials & Products", allRisk: 0.15, basic: 0.1, minimum: 0.04 },
    { name: "Cotton, Yarn, Thread", allRisk: 0.1, basic: 0.08, minimum: 0.04 },
    { name: "Edible Oil & Ghee in bulk, tanks & tankers", allRisk: 0.35, basic: 0.2, minimum: 0.08 },
    { name: "Edible Oil & Ghee in Drum, Jar & other packing", allRisk: 0.22, basic: 0.15, minimum: 0.06 },
    { name: "Edible Items (Grains & Pulses)", allRisk: 0.25, basic: 0.15, minimum: 0.06 },
    { name: "Edible Items (Oil Seeds)", allRisk: 0.32, basic: 0.17, minimum: 0.07 },
    { name: "Edible Items (Others)", allRisk: 0.25, basic: 0.15, minimum: 0.06 },
    { name: "Electric & Electronic Items", allRisk: 0.3, basic: 0.2, minimum: 0.08 },
    { name: "Empty Gas Cylinder", allRisk: 0.08, basic: 0.05, minimum: 0.03 },
    { name: "Fragile & Brittle Articles", allRisk: 0.8, basic: 0.5, minimum: 0.2 },
    { name: "Fertilizer (In Bulk)", allRisk: 0.5, basic: 0.23, minimum: 0.09 },
    { name: "Fertilizer (In Bags)", allRisk: 0.4, basic: 0.2, minimum: 0.08 },
    { name: "Foot Ware", allRisk: 0.2, basic: 0.12, minimum: 0.05 },
    { name: "Furniture (Metal & Plastics)", allRisk: 0.2, basic: 0.12, minimum: 0.05 },
    { name: "Furniture (Wooden & other)", allRisk: 0.7, basic: 0.4, minimum: 0.2 },
    { name: "Gold, Silver & Precious Stones", allRisk: 0.5, basic: 0.3, minimum: 0.12 },
    { name: "Handicrafts other than Fragile & Brittle", allRisk: 0.3, basic: 0.15, minimum: 0.06 },
    { name: "Leather & Leather Goods (Raw & Semi Finished)", allRisk: 0.25, basic: 0.15, minimum: 0.06 },
    { name: "Leather & Leather Goods (Finished Goods)", allRisk: 0.2, basic: 0.12, minimum: 0.05 },
    { name: "Non Hazardous Liquid Cargo & Chemicals in Tanker or Drums", allRisk: 0.4, basic: 0.25, minimum: 0.1 },
    { name: "Non Hazardous Liquid Cargo & Chemicals in other packing", allRisk: 0.3, basic: 0.18, minimum: 0.07 },
    { name: "Hazardous Liquid Cargo & Chemicals in Tanker or Drums", allRisk: 0.6, basic: 0.35, minimum: 0.14 },
    { name: "Hazardous Liquid Cargo & Chemicals in other packing", allRisk: 0.4, basic: 0.25, minimum: 0.1 },
    { name: "Extra Hazardous Liquid Cargo & Chemicals in Tanker or Drums", allRisk: 0.8, basic: 0.5, minimum: 0.2 },
    { name: "Extra Hazardous Liquid Cargo & Chemicals in other packing", allRisk: 0.4, basic: 0.25, minimum: 0.1 },
    { name: "LPG in Tanker or Bullet", allRisk: 0.4, basic: 0.25, minimum: 0.1 },
    { name: "LPG in Cylinders", allRisk: 0.2, basic: 0.12, minimum: 0.05 },
    { name: "Machinery & Machinery Hand tools", allRisk: 0.2, basic: 0.1, minimum: 0.04 },
    { name: "Machinery & Machinery other power tools", allRisk: 0.3, basic: 0.2, minimum: 0.08 },
    { name: "Marble & Granite", allRisk: 0.5, basic: 0.3, minimum: 0.12 },
    { name: "Metal-Billets, Ingots", allRisk: 0.06, basic: 0.04, minimum: 0.02 },
    { name: "Metal Hardware/utensils & sheets", allRisk: 0.08, basic: 0.05, minimum: 0.03 },
    { name: "Metal Scrap", allRisk: 0.08, basic: 0.05, minimum: 0.03 },
    { name: "Matches & Alike", allRisk: 0.9, basic: 0.55, minimum: 0.25 },
    { name: "News prints, Cardboards", allRisk: 0.3, basic: 0.15, minimum: 0.06 },
    { name: "Books Magazines, Stationeries", allRisk: 0.25, basic: 0.12, minimum: 0.05 },
    { name: "Others Paper/Stationeries", allRisk: 0.3, basic: 0.15, minimum: 0.06 },
    { name: "Plywood & Particle Board", allRisk: 0.25, basic: 0.15, minimum: 0.06 },
    { name: "Non Refrigerated/Insulated Perishable Items", allRisk: 0.4, basic: 0.2, minimum: 0.08 },
    { name: "Refrigerated/Insulated Perishable Items", allRisk: 0.3, basic: 0.16, minimum: 0.06 },
    { name: "Personal Effects & Household Goods", allRisk: 2, basic: 0.5, minimum: 0.2 },
    { name: "Petroleum Fuel in Bulk", allRisk: 0.8, basic: 0.5, minimum: 0.2 },
    { name: "Petroleum Fuel in Tanker & Others", allRisk: 0.4, basic: 0.25, minimum: 0.1 },
    { name: "Pharmaceuticals, Medicines, Toiletries & Cosmetics", allRisk: 0.25, basic: 0.15, minimum: 0.06 },
    { name: "Plastic Sheets", allRisk: 0.18, basic: 0.1, minimum: 0.04 },
    { name: "Plastic Granules", allRisk: 0.25, basic: 0.15, minimum: 0.06 },
    { name: "Other Plastic Goods", allRisk: 0.2, basic: 0.12, minimum: 0.05 },
    { name: "Spare parts Electric & Electronic", allRisk: 0.32, basic: 0.22, minimum: 0.09 },
    { name: "Spare parts Glass items", allRisk: 0.8, basic: 0.5, minimum: 0.2 },
    { name: "Spare parts Mechanical", allRisk: 0.25, basic: 0.15, minimum: 0.06 },
    { name: "Spare parts Rubber & Plastic items", allRisk: 0.2, basic: 0.12, minimum: 0.05 },
    { name: "Straw, Grass, Hays, Baggase, Bran, Husk, Jute, Combustible Fibres & Alike", allRisk: 0.7, basic: 0.5, minimum: 0.2 },
    { name: "Sugar in Bulk", allRisk: 0.6, basic: 0.35, minimum: 0.14 },
    { name: "Sugar in other packing", allRisk: 0.35, basic: 0.2, minimum: 0.08 },
    { name: "Timber & Wood", allRisk: 0.15, basic: 0.1, minimum: 0.04 },
    { name: "Tobacco & Tobacco Leaf", allRisk: 0.3, basic: 0.2, minimum: 0.1 },
    { name: "Tobacco product", allRisk: 0.25, basic: 0.15, minimum: 0.06 },
    { name: "Bitumin", allRisk: 0.35, basic: 0.225, minimum: 0.18 },
];

const srccOptions: SrccOption[] = [
    { name: "Inland Transit (Rail or Road)", rate: 0.02 },
    { name: "Air Transit", rate: 0.02 },
    { name: "Ship & Road", rate: 0.03 },
    { name: "Not Required", rate: 0 },
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
}: {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
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
                placeholder="Enter amount"
                className="h-11 w-full"
            />
        </div>
    );
};

const SelectField = ({
    label,
    value,
    onChange,
    options,
    error,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: string[];
    error?: string;
}) => {
    return (
        <div>
            <Label className="mb-2 block text-sm font-medium text-gray-700">
                {label}
            </Label>

            <Select value={value} onValueChange={onChange}>
                <SelectTrigger className={`h-11 w-full ${error ? "border-red-500 focus-visible:ring-red-500" : ""}`}>
                    <SelectValue placeholder={`Select ${label}`} />
                </SelectTrigger>

                <SelectContent>
                    {options.map((item) => (
                        <SelectItem key={item} value={item}>
                            {item}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
    );
};

const YesNoSelectField = ({
    label,
    value,
    onChange,
    disabled,
    error,
}: {
    label: string;
    value: YesNoValue;
    onChange: (value: YesNo) => void;
    disabled?: boolean;
    error?: string;
}) => {
    return (
        <div>
            <Label className={`mb-2 block text-sm font-medium ${disabled ? "text-gray-400" : "text-gray-700"}`}>
                {label}
            </Label>

            <Select value={value} onValueChange={(v) => onChange(v as YesNo)} disabled={disabled}>
                <SelectTrigger className={`h-11 w-full ${disabled ? "cursor-not-allowed opacity-50" : ""} ${error ? "border-red-500 focus-visible:ring-red-500" : ""}`}>
                    <SelectValue placeholder={`Select ${label}`} />
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

export default function MarineInsurancePage() {
    const navigate = useNavigate();

    const [step, setStep] = useState<1 | 2>(1);

    const [sumInsured, setSumInsured] = useState("");
    const [riskCover, setRiskCover] = useState("");
    const [insuredItems, setInsuredItems] = useState("");

    const [tpnd, setTpnd] = useState<YesNoValue>("");
    const [containerDiscount, setContainerDiscount] = useState<YesNoValue>("");
    const [srcc, setSrcc] = useState("");
    const [directDiscount, setDirectDiscount] = useState<YesNoValue>("");
    const [volumeDiscount, setVolumeDiscount] = useState<YesNo>("NO");

    const [errors, setErrors] = useState<FormErrors>({});

    const calculation = useMemo(() => {
        const insuredAmount = parseMoney(sumInsured);

        const selectedGoods =
            goodsOptions.find((item) => item.name === insuredItems) ||
            goodsOptions[0];

        const selectedSrcc =
            srccOptions.find((item) => item.name === srcc) || srccOptions[0];

        const itemRate =
            riskCover === "All Risk"
                ? selectedGoods.allRisk
                : riskCover === "Basic"
                  ? selectedGoods.basic
                  : selectedGoods.minimum;

        const itemPremium = (insuredAmount * itemRate) / 100;

        const tpndRate = tpnd === "YES" ? itemRate * 0.25 : 0;
        const tpndAmount = (insuredAmount * tpndRate) / 100;

        const containerDiscountRate = containerDiscount === "YES" ? 10 : 0;
        const containerDiscountAmount =
            ((itemPremium + tpndAmount) * containerDiscountRate) / 100;

        const afterContainer =
            itemPremium + tpndAmount - containerDiscountAmount;

        /**
         * Hidden Excel row:
         * Transit Discount in the provided sheet uses Air Transit 20%.
         * User does not enter this field, so it is fixed hidden.
         */
        const hiddenTransitDiscountRate = 20;
        const hiddenTransitDiscountAmount =
            (afterContainer * hiddenTransitDiscountRate) / 100;

        const srccRate = selectedSrcc.rate;
        const srccAmount = (insuredAmount * srccRate) / 100;

        const beforeDirectDiscount =
            afterContainer - hiddenTransitDiscountAmount + srccAmount;

        const directDiscountRate = directDiscount === "YES" ? 2.5 : 0;
        const directDiscountAmount =
            (beforeDirectDiscount * directDiscountRate) / 100;

        const beforeVolumeDiscount =
            beforeDirectDiscount - directDiscountAmount;

        const volumeDiscountRate = volumeDiscount === "YES" ? 20 : 0;
        const volumeDiscountAmount =
            (beforeVolumeDiscount * volumeDiscountRate) / 100;

        const subTotal = beforeVolumeDiscount - volumeDiscountAmount;

        const vatRate = 13;
        const vat = (subTotal * vatRate) / 100;

        const stampDuty = insuredAmount > 0 ? 20 : 0;

        const totalPremium = subTotal + vat + stampDuty;

        return {
            insuredAmount,
            itemRate,
            itemPremium,

            tpndRate,
            tpndAmount,

            containerDiscountRate,
            containerDiscountAmount,

            hiddenTransitDiscountRate,
            hiddenTransitDiscountAmount,

            srccRate,
            srccAmount,

            directDiscountRate,
            directDiscountAmount,

            volumeDiscountRate,
            volumeDiscountAmount,

            subTotal,
            vatRate,
            vat,
            stampDuty,
            totalPremium,
        };
    }, [
        sumInsured,
        riskCover,
        insuredItems,
        tpnd,
        containerDiscount,
        srcc,
        directDiscount,
        volumeDiscount,
    ]);

    const handleNext = () => {
        const result = marineFormSchema.safeParse({ sumInsured, riskCover, insuredItems, srcc, tpnd, containerDiscount, directDiscount });
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
                                Marine / Transit Insurance
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
                                        Marine Insurance Details
                                    </h2>
                                    <p className="text-sm text-gray-500">
                                        User only enters sum insured and selects
                                        options. All percentage rates are hidden.
                                    </p>
                                </div>

                                <div className="grid gap-5 md:grid-cols-2">
                                    <MoneyInputField
                                        id="sumInsured"
                                        label="Sum Insured Amount"
                                        value={sumInsured}
                                        onChange={(v) => { setSumInsured(v); if (errors.sumInsured) setErrors((p) => ({ ...p, sumInsured: undefined })); }}
                                    />

                                    <SelectField
                                        label="Risk to be Covered"
                                        value={riskCover}
                                        onChange={(value) => { setRiskCover(value); if (errors.riskCover) setErrors((p) => ({ ...p, riskCover: undefined })); }}
                                        options={["All Risk", "Basic", "Minimum"]}
                                        error={errors.riskCover}
                                    />

                                    <SelectField
                                        label="Item/Goods Heading"
                                        value={insuredItems}
                                        onChange={(v) => { setInsuredItems(v); if (errors.insuredItems) setErrors((p) => ({ ...p, insuredItems: undefined })); }}
                                        options={goodsOptions.map(
                                            (item) => item.name,
                                        )}
                                        error={errors.insuredItems}
                                    />

                                    <YesNoSelectField
                                        label="Additional: TPND"
                                        value={tpnd}
                                        onChange={(v) => { setTpnd(v); if (errors.tpnd) setErrors((p) => ({ ...p, tpnd: undefined })); }}
                                        error={errors.tpnd}
                                    />

                                    <YesNoSelectField
                                        label="Container Discount"
                                        value={containerDiscount}
                                        onChange={(v) => { setContainerDiscount(v); if (errors.containerDiscount) setErrors((p) => ({ ...p, containerDiscount: undefined })); }}
                                        error={errors.containerDiscount}
                                    />

                                    <SelectField
                                        label="Add: SRCC"
                                        value={srcc}
                                        onChange={(v) => { setSrcc(v); if (errors.srcc) setErrors((p) => ({ ...p, srcc: undefined })); }}
                                        options={srccOptions.map(
                                            (item) => item.name,
                                        )}
                                        error={errors.srcc}
                                    />

                                    <YesNoSelectField
                                        label="Direct Discount"
                                        value={directDiscount}
                                        onChange={(v) => { setDirectDiscount(v); if (errors.directDiscount) setErrors((p) => ({ ...p, directDiscount: undefined })); }}
                                        error={errors.directDiscount}
                                    />
                                </div>

                                <div className="rounded-md border bg-red-50 p-3 text-sm text-red-700">
                                    <strong>Instruction:</strong> Select{" "}
                                    <strong>All Risk</strong> coverage only in
                                    case of Air Transit. TPND is required in case
                                    of <strong>Basic Risk</strong> only.
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
                                                Item/Goods Premium
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium text-black">
                                                {formatMoney(
                                                    calculation.itemPremium,
                                                )}
                                            </td>
                                        </tr>

                                        <tr className="border-b bg-[#fff7f3]">
                                            <td className="border-r border-white px-4 py-3 text-black">
                                                Additional: TPND
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium text-black">
                                                {formatMoney(
                                                    calculation.tpndAmount,
                                                )}
                                            </td>
                                        </tr>

                                        <tr className="border-b bg-[#fff7f3]">
                                            <td className="border-r border-white px-4 py-3 text-red-600">
                                                Less: Container Discount
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium text-red-600">
                                                (
                                                {formatMoney(
                                                    calculation.containerDiscountAmount,
                                                )}
                                                )
                                            </td>
                                        </tr>

                                        <tr className="border-b bg-[#fff7f3]">
                                            <td className="border-r border-white px-4 py-3 text-red-600">
                                                Less: Transit Discount
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium text-red-600">
                                                (
                                                {formatMoney(
                                                    calculation.hiddenTransitDiscountAmount,
                                                )}
                                                )
                                            </td>
                                        </tr>

                                        <tr className="border-b bg-[#fff7f3]">
                                            <td className="border-r border-white px-4 py-3 text-black">
                                                Add: SRCC
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium text-black">
                                                {formatMoney(
                                                    calculation.srccAmount,
                                                )}
                                            </td>
                                        </tr>

                                        <tr className="border-b bg-[#fff7f3]">
                                            <td className="border-r border-white px-4 py-3 text-red-600">
                                                Less: Direct Discount
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium text-red-600">
                                                (
                                                {formatMoney(
                                                    calculation.directDiscountAmount,
                                                )}
                                                )
                                            </td>
                                        </tr>

                                        {/* <tr className="border-b bg-[#fff7f3]">
                                            <td className="border-r border-white px-4 py-3 text-red-600">
                                                Less: Volume Discount
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium text-red-600">
                                                (
                                                {formatMoney(
                                                    calculation.volumeDiscountAmount,
                                                )}
                                                )
                                            </td>
                                        </tr> */}

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
                                                Add: VAT
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