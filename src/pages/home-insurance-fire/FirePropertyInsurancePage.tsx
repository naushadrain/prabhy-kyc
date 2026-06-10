// src/pages/home/FirePropertyPage.tsx

import { useEffect, useMemo, useState } from "react";
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import {
    getPropertyListCatalogue,
    getPropertyDescriptionCatalogue,
    getFireRiskTypeCatalogue,
    type HomeCatalogueItem,
} from "@/api/home/getCatlog";

import {
    getFirePropertyPremium,
    type FirePropertyLocationInfo,
    type FirePropertyPremiumRequest,
    type FirePropertyPremiumResponse,
} from "@/api/home/getFireHousePremium";

const constructionOptions = [
    { label: "1st Class Construction", value: "1st Class Construction" },
    { label: "2nd Class Construction", value: "2nd Class Construction" },
    { label: "3rd Class Construction", value: "3rd Class Construction" },
];

function formatAmount(value: number | string | null | undefined) {
    const cleanValue = String(value ?? "0").replace(/,/g, "");
    const num = Number(cleanValue);

    if (!Number.isFinite(num)) {
        return "0.00";
    }

    return num.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

export default function FirePropertyInsurancePage() {
    const navigate = useNavigate();

    const [step, setStep] = useState<1 | 2>(1);

    const [propertyList, setPropertyList] = useState<HomeCatalogueItem[]>([]);
    const [riskTypes, setRiskTypes] = useState<HomeCatalogueItem[]>([]);
    const [propertyDescriptions, setPropertyDescriptions] = useState<HomeCatalogueItem[]>([]);

    const [selectedProperty, setSelectedProperty] = useState("");
    const [selectedDescription, setSelectedDescription] = useState("");
    const [fireRiskType, setFireRiskType] = useState("");
    const [constructionType, setConstructionType] = useState("");
    const [sumInsured, setSumInsured] = useState("");
    const [directDiscount, setDirectDiscount] = useState<"yes" | "no">("yes");

    const [propertyLoading, setPropertyLoading] = useState(false);
    const [riskLoading, setRiskLoading] = useState(false);
    const [descriptionLoading, setDescriptionLoading] = useState(false);
    const [calculateLoading, setCalculateLoading] = useState(false);

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [inlineError, setInlineError] = useState("");

    const [premiumResponse, setPremiumResponse] =
        useState<FirePropertyPremiumResponse | null>(null);

    const selectedPropertyName = useMemo(() => {
        return propertyList.find((item) => item.data === selectedProperty)?.value || "";
    }, [propertyList, selectedProperty]);

    const selectedDescriptionName = useMemo(() => {
        return propertyDescriptions.find((item) => item.data === selectedDescription)?.value || "";
    }, [propertyDescriptions, selectedDescription]);

    const selectedRiskName = useMemo(() => {
        return riskTypes.find((item) => item.data === fireRiskType)?.value || "";
    }, [riskTypes, fireRiskType]);

    useEffect(() => {
        let cancelled = false;

        setPropertyLoading(true);
        setRiskLoading(true);
        setInlineError("");

        Promise.all([getPropertyListCatalogue(), getFireRiskTypeCatalogue()])
            .then(([propertyRes, riskRes]) => {
                if (cancelled) return;

                setPropertyList(propertyRes || []);
                setRiskTypes(riskRes || []);
            })
            .catch((error) => {
                if (cancelled) return;
                setInlineError(error?.message || "Failed to load catalogue");
            })
            .finally(() => {
                if (cancelled) return;
                setPropertyLoading(false);
                setRiskLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (!selectedProperty) {
            setPropertyDescriptions([]);
            setSelectedDescription("");
            return;
        }

        let cancelled = false;

        setDescriptionLoading(true);
        setSelectedDescription("");
        clearError("selectedDescription");

        getPropertyDescriptionCatalogue(selectedProperty)
            .then((list) => {
                if (cancelled) return;
                setPropertyDescriptions(list || []);
            })
            .catch((error) => {
                if (cancelled) return;
                setInlineError(error?.message || "Failed to load property description");
            })
            .finally(() => {
                if (cancelled) return;
                setDescriptionLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [selectedProperty]);

    const clearError = (key: string) => {
        setErrors((prev) => {
            const next = { ...prev };
            delete next[key];
            return next;
        });
    };

    const handleSumInsuredChange = (value: string) => {
        const cleanValue = value.replace(/[^\d]/g, "");
        setSumInsured(cleanValue);
        clearError("sumInsured");
    };

    const validateCalculate = () => {
        const newErrors: Record<string, string> = {};

        if (!selectedProperty) {
            newErrors.selectedProperty = "Property list is required";
        }

        if (!selectedDescription) {
            newErrors.selectedDescription = "Property description is required";
        }

        if (!fireRiskType) {
            newErrors.fireRiskType = "Nature of risk is required";
        }

        if (!constructionType) {
            newErrors.constructionType = "Class of construction is required";
        }

        return newErrors;
    };

    const buildPayload = (): FirePropertyPremiumRequest => {
        const locationInfo: FirePropertyLocationInfo[] = [
            {
                class_id: "62",
                fire_risk_type: fireRiskType,
                fire_property_description: selectedDescription,
                location_total_suminsured: sumInsured,
                construction_type: constructionType,

                near_premises_suminsured: "",
                building_suminsured: sumInsured,
                plant_machinery_suminsured: "",
                raw_materials_suminsured: "",
                work_in_progress_suminsured: "",
                finished_goods_suminsured: "",
                semi_finished_goods_suminsured: "",
                furniture_suminsured: "",
                cash_gold_suminsured: "",
                maps_frame_suminsured: "",
                others_suminsured: "",
            },
        ];

        return {
            class_id: "62",
            include_rsd_charge: false,
            location_count: "1",
            total_suminsured: sumInsured,
            get_direct_discount: directDiscount === "yes" ? "y" : "n",
            location_info: locationInfo,
        };
    };

    const handleCalculate = async () => {
        setInlineError("");

        const validationErrors = validateCalculate();
        setErrors(validationErrors);

        if (Object.keys(validationErrors).length > 0) {
            return;
        }

        const payload = buildPayload();

        try {
            setCalculateLoading(true);

            localStorage.setItem("firePropertyPayload", JSON.stringify(payload));
            localStorage.setItem(
                "firePropertyForm",
                JSON.stringify({
                    selectedProperty,
                    selectedPropertyName,
                    selectedDescription,
                    selectedDescriptionName,
                    fireRiskType,
                    selectedRiskName,
                    constructionType,
                    sumInsured,
                    directDiscount,
                })
            );

            const response = await getFirePropertyPremium(payload);

            localStorage.setItem(
                "firePropertyPremiumResponse",
                JSON.stringify(response)
            );

            setPremiumResponse(response);
            setStep(2);
        } catch (error: any) {
            setInlineError(error?.message || "Failed to calculate premium");
        } finally {
            setCalculateLoading(false);
        }
    };

    if (step === 2) {
        const amount = premiumResponse?.amount_info;

        return (
            <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-6xl rounded-md px-4 py-5 shadow-sm sm:px-5">
                    <div className="mb-6 flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100"
                        >
                            <ChevronLeft className="h-5 w-5 text-black" />
                        </button>

                        <div>
                            <h1 className="text-xl font-bold text-black">
                                Property Insurance Premium Details
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
                                            label={`Direct Discount (${premiumResponse.direct_discount_percent ?? 0}%)`}
                                            value={premiumResponse.direct_discount_amount ?? 0}
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

                                       

                                        <tr className="bg-[#e91d25] text-white">
                                            <td className="border-r border-white px-4 py-4 text-base font-bold">
                                                Total Amount
                                            </td>

                                            <td className="px-4 py-4 text-right text-base font-bold">
                                                NPR {formatAmount(amount.total_amount)}
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
                                    onClick={() => navigate("/home-insurances")}
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
        <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl rounded-md px-4 py-5 shadow-sm sm:px-5">
                <div className="mb-6 flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => navigate("/home-insurances")}
                        className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100"
                    >
                        <ChevronLeft className="h-5 w-5 text-black" />
                    </button>

                    <div>
                        <h1 className="text-xl font-bold text-black">
                            Property Insurance
                        </h1>

                        <p className="mt-1 text-sm text-muted-foreground">
                            Add property details and calculate premium.
                        </p>
                    </div>
                </div>

                {inlineError && (
                    <div className="mb-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        {inlineError}
                    </div>
                )}

                <div className="rounded-3xl p-5">
                    <div className="grid gap-4 md:grid-cols-2">
                        <CatalogueSelectField
                            label="Property Lists *"
                            id="propertyList"
                            value={selectedProperty}
                            placeholder={
                                propertyLoading
                                    ? "Loading property list..."
                                    : "Select property list"
                            }
                            options={propertyList}
                            error={errors.selectedProperty}
                            disabled={propertyLoading}
                            onChange={(value) => {
                                setSelectedProperty(value);
                                clearError("selectedProperty");
                            }}
                        />

                        <CatalogueSelectField
                            label="Description of Property *"
                            id="selectedDescription"
                            value={selectedDescription}
                            placeholder={
                                descriptionLoading
                                    ? "Loading description..."
                                    : "Select description of property"
                            }
                            options={propertyDescriptions}
                            error={errors.selectedDescription}
                            disabled={!selectedProperty || descriptionLoading}
                            onChange={(value) => {
                                setSelectedDescription(value);
                                clearError("selectedDescription");
                            }}
                        />

                        <CatalogueSelectField
                            label="Nature of Risk *"
                            id="fireRiskType"
                            value={fireRiskType}
                            placeholder={
                                riskLoading
                                    ? "Loading nature of risk..."
                                    : "Select nature of risk"
                            }
                            options={riskTypes}
                            error={errors.fireRiskType}
                            disabled={riskLoading}
                            onChange={(value) => {
                                setFireRiskType(value);
                                clearError("fireRiskType");
                            }}
                        />

                        <SimpleSelectField
                            label="Class of Construction *"
                            id="constructionType"
                            value={constructionType}
                            placeholder="Select class of construction"
                            options={constructionOptions}
                            error={errors.constructionType}
                            onChange={(value) => {
                                setConstructionType(value);
                                clearError("constructionType");
                            }}
                        />

                        <div>
                            <Label htmlFor="sumInsured">Sum Insured *</Label>

                            <Input
                                id="sumInsured"
                                type="text"
                                inputMode="numeric"
                                value={sumInsured}
                                onChange={(event) =>
                                    handleSumInsuredChange(event.target.value)
                                }
                                className={`mt-2 h-14 bg-white text-base ${
                                    errors.sumInsured
                                        ? "border-red-500 text-red-500"
                                        : ""
                                }`}
                                placeholder="Enter sum insured"
                            />

                            {errors.sumInsured && (
                                <p className="mt-2 text-sm text-red-600">
                                    {errors.sumInsured}
                                </p>
                            )}
                        </div>

                        <div
                            onClick={() => {
                                setDirectDiscount((prev) =>
                                    prev === "yes" ? "no" : "yes"
                                );
                                clearError("directDiscount");
                            }}
                            className="inline-flex cursor-pointer items-center gap-3 mt-4"
                        >
                            <Switch
                                id="directDiscount"
                                checked={directDiscount === "yes"}
                                onCheckedChange={(checked) => {
                                    setDirectDiscount(checked ? "yes" : "no");
                                    clearError("directDiscount");
                                }}
                                onClick={(event) => event.stopPropagation()}
                            />

                            <Label
                                htmlFor="directDiscount"
                                className="cursor-pointer text-sm font-medium"
                            >
                                Direct Discount
                            </Label>
                        </div>
                    </div>
                </div>

                <div className="mt-10 flex justify-end">
                    <Button
                        type="button"
                        onClick={handleCalculate}
                        disabled={
                            calculateLoading ||
                            propertyLoading ||
                            riskLoading ||
                            descriptionLoading
                        }
                        className="gap-2 bg-[#f71920] px-8 py-6 text-base text-white hover:bg-[#d9151b]"
                    >
                        {calculateLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                CALCULATING...
                            </>
                        ) : (
                            <>
                                NEXT
                                <ArrowRight className="h-5 w-5" />
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}

function CatalogueSelectField({
    label,
    id,
    value,
    placeholder,
    options,
    error,
    disabled,
    onChange,
}: {
    label: string;
    id: string;
    value: string;
    placeholder: string;
    options: HomeCatalogueItem[];
    error?: string;
    disabled?: boolean;
    onChange: (value: string) => void;
}) {
    return (
        <div>
            <Label htmlFor={id}>{label}</Label>

            <Select value={value} disabled={disabled} onValueChange={onChange}>
                <SelectTrigger
                    id={id}
                    className={`mt-2 h-14 bg-white text-base ${
                        error ? "border-red-500 text-red-500" : ""
                    }`}
                >
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>

                <SelectContent>
                    {options.map((item) => (
                        <SelectItem key={item.data} value={item.data}>
                            {item.value}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
    );
}

function SimpleSelectField({
    label,
    id,
    value,
    placeholder,
    options,
    error,
    onChange,
}: {
    label: string;
    id: string;
    value: string;
    placeholder: string;
    options: { label: string; value: string }[];
    error?: string;
    onChange: (value: string) => void;
}) {
    return (
        <div>
            <Label htmlFor={id}>{label}</Label>

            <Select value={value} onValueChange={onChange}>
                <SelectTrigger
                    id={id}
                    className={`mt-2 h-14 bg-white text-base ${
                        error ? "border-red-500 text-red-500" : ""
                    }`}
                >
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>

                <SelectContent>
                    {options.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                            {item.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
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
            <p className="mt-1 break-all font-semibold text-black">{value || "—"}</p>
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