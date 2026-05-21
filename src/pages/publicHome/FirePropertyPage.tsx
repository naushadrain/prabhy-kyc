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

type AddedProperty = {
    id: number;
    propertyId: string;
    propertyName: string;
    descriptionId: string;
    descriptionName: string;
    fireRiskType: string;
    fireRiskTypeName: string;
    constructionType: string;
    sumInsured: string;
    directDiscount: "yes" | "no";
};

const MAX_SUM_INSURED_PER_PROPERTY = 20000000;

const constructionOptions = [
    { label: "1st Class Construction", value: "1st Class Construction" },
    { label: "2nd Class Construction", value: "2nd Class Construction" },
    { label: "3rd Class Construction", value: "3rd Class Construction" },
];

const yesNoOptions = [
    { label: "Yes", value: "yes" },
    { label: "No", value: "no" },
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

function getAmountValue(
    obj: Record<string, unknown> | null | undefined,
    key: string,
    fallback: string | number = 0
) {
    if (!obj) return fallback;

    const value = obj[key];

    if (value === undefined || value === null || value === "") {
        return fallback;
    }

    if (typeof value === "string" || typeof value === "number") {
        return value;
    }

    return fallback;
}

export default function FirePropertyPage() {
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

    const [addedProperties, setAddedProperties] = useState<AddedProperty[]>([]);

    const [propertyLoading, setPropertyLoading] = useState(false);
    const [riskLoading, setRiskLoading] = useState(false);
    const [descriptionLoading, setDescriptionLoading] = useState(false);
    const [calculateLoading, setCalculateLoading] = useState(false);

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [inlineError, setInlineError] = useState("");

    const [premiumResponse, setPremiumResponse] =
        useState<FirePropertyPremiumResponse | null>(null);

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

                setInlineError(
                    error?.message || "Failed to load property description"
                );
            })
            .finally(() => {
                if (cancelled) return;

                setDescriptionLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [selectedProperty]);

    const selectedPropertyItem = propertyList.find(
        (item) => item.data === selectedProperty
    );

    const selectedDescriptionItem = propertyDescriptions.find(
        (item) => item.data === selectedDescription
    );

    const selectedRiskItem = riskTypes.find(
        (item) => item.data === fireRiskType
    );

    const totalSumInsured = useMemo(() => {
        return addedProperties.reduce((total, item) => {
            const amount = Number(item.sumInsured || 0);
            return total + (Number.isFinite(amount) ? amount : 0);
        }, 0);
    }, [addedProperties]);

    const clearError = (key: string) => {
        setErrors((prev) => ({
            ...prev,
            [key]: "",
        }));
    };

    const handleSumInsuredChange = (value: string) => {
        const cleanValue = value.replace(/[^\d]/g, "");
        setSumInsured(cleanValue);
        clearError("sumInsured");
    };

    const validateAddProperty = () => {
        const newErrors: Record<string, string> = {};
        const amount = Number(sumInsured || 0);

        if (!selectedProperty) {
            newErrors.selectedProperty = "Property list is required";
        }

        if (!selectedDescription) {
            newErrors.selectedDescription = "Description of property is required";
        }

        if (!fireRiskType) {
            newErrors.fireRiskType = "Nature of risk is required";
        }

        if (!constructionType) {
            newErrors.constructionType = "Class of construction is required";
        }

        if (!directDiscount) {
            newErrors.directDiscount = "Direct discount is required";
        }

        if (!sumInsured.trim()) {
            newErrors.sumInsured = "Sum insured is required";
        } else if (!/^\d+$/.test(sumInsured) || amount <= 0) {
            newErrors.sumInsured = "Enter valid sum insured";
        } else if (amount > MAX_SUM_INSURED_PER_PROPERTY) {
            newErrors.sumInsured =
                "Location total sum insured must not be greater than 2 crore";
        }

        return newErrors;
    };

    const handleAddProperty = () => {
        const validationErrors = validateAddProperty();
        setErrors(validationErrors);

        if (Object.keys(validationErrors).length > 0) {
            return;
        }

        setAddedProperties((prev) => [
            ...prev,
            {
                id: Date.now(),
                propertyId: selectedProperty,
                propertyName: selectedPropertyItem?.value || "Property",
                descriptionId: selectedDescription,
                descriptionName:
                    selectedDescriptionItem?.value || "Property Description",
                fireRiskType,
                fireRiskTypeName: selectedRiskItem?.value || "Risk Type",
                constructionType,
                sumInsured,
                directDiscount,
            },
        ]);

        setSelectedProperty("");
        setSelectedDescription("");
        setPropertyDescriptions([]);
        setFireRiskType("");
        setConstructionType("");
        setSumInsured("");
        setDirectDiscount("yes");
        setErrors({});
        setInlineError("");
    };

    const handleRemoveProperty = (id: number) => {
        setAddedProperties((prev) => prev.filter((item) => item.id !== id));
    };

    const validateCalculate = () => {
        const newErrors: Record<string, string> = {};

        if (addedProperties.length === 0) {
            newErrors.propertyTable = "Please add at least one property";
        }

        if (totalSumInsured <= 0) {
            newErrors.propertyTable = "Total sum insured is required";
        }

        return newErrors;
    };

   const buildPayload = (): FirePropertyPremiumRequest => {
    const locationInfo: FirePropertyLocationInfo[] = addedProperties.map(
        (item) => ({
            class_id: "62",

            fire_risk_type: item.fireRiskType,
            fire_property_description: item.descriptionId,

            location_total_suminsured: item.sumInsured,
            construction_type: item.constructionType,

            near_premises_suminsured: "",
            building_suminsured: item.sumInsured,
            plant_machinery_suminsured: "",
            raw_materials_suminsured: "",
            work_in_progress_suminsured: "",
            finished_goods_suminsured: "",
            semi_finished_goods_suminsured: "",
            furniture_suminsured: "",
            cash_gold_suminsured: "",
            maps_frame_suminsured: "",
            others_suminsured: "",
        })
    );

    return {
        class_id: "62",
        include_rsd_charge: false,
        location_count: String(addedProperties.length),
        total_suminsured: String(totalSumInsured),

        // direct discount root level
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

            localStorage.setItem(
                "firePropertyAddedProperties",
                JSON.stringify(addedProperties)
            );

            localStorage.setItem("firePropertyPayload", JSON.stringify(payload));

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
            <div className="min-h-screen bg-[#fbf4f2] px-4 py-8 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-6xl rounded-md bg-white px-4 py-5 shadow-sm sm:px-5">
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
                                Fire Property Premium Details
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
                                            label="Policy Session ID"
                                            value={premiumResponse.policy_session_id}
                                            textOnly
                                        />

                                        <PremiumRow
                                            label="Process Result"
                                            value={
                                                premiumResponse.process_result
                                                    ? "Success"
                                                    : "Failed"
                                            }
                                            textOnly
                                        />

                                        <PremiumRow
                                            label="Sum Insured"
                                            value={amount.suminsured}
                                        />

                                        <PremiumRow
                                            label="Basic Premium Amount"
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

                                        <tr className="bg-[#e91d25] text-white">
                                            <td className="border-r border-white px-4 py-4 text-base font-bold">
                                                Total Amount
                                            </td>

                                            <td className="px-4 py-4 text-right text-base font-bold">
                                                NPR{" "}
                                                {formatAmount(
                                                    amount.total_amount
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
                                    onClick={() => navigate("/home-insurance")}
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
        <div className="min-h-screen bg-[#fbf4f2] px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl rounded-md bg-white px-4 py-5 shadow-sm sm:px-5">
                <div className="mb-6 flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => navigate("/home-insurance")}
                        className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100"
                    >
                        <ChevronLeft className="h-5 w-5 text-black" />
                    </button>

                    <div>
                        <h1 className="text-xl font-bold text-black">
                            Fire Property Insurance
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

                <div className="rounded-3xl bg-[#f5f5f5] p-5">
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

                        <SimpleSelectField
                            label="Direct Discount *"
                            id="directDiscount"
                            value={directDiscount}
                            placeholder="Select direct discount"
                            options={yesNoOptions}
                            error={errors.directDiscount}
                            onChange={(value) => {
                                setDirectDiscount(value as "yes" | "no");
                                clearError("directDiscount");
                            }}
                        />
                    </div>

                    <Button
                        type="button"
                        onClick={handleAddProperty}
                        className="mt-5 bg-green-700 text-white hover:bg-green-800"
                    >
                        ADD PROPERTY
                    </Button>
                </div>

                <div className="mt-5 overflow-hidden rounded-sm border">
                    <table className="w-full border-collapse text-sm">
                        <thead>
                            <tr className="bg-[#e91d25] text-white">
                                <th className="border-r border-white px-4 py-3 text-left font-bold">
                                    Property
                                </th>

                                <th className="border-r border-white px-4 py-3 text-left font-bold">
                                    Description
                                </th>

                                <th className="border-r border-white px-4 py-3 text-left font-bold">
                                    Risk
                                </th>

                                <th className="border-r border-white px-4 py-3 text-left font-bold">
                                    Construction
                                </th>

                                <th className="border-r border-white px-4 py-3 text-left font-bold">
                                    Sum Insured
                                </th>

                                <th className="border-r border-white px-4 py-3 text-left font-bold">
                                    Direct Discount
                                </th>

                                <th className="px-4 py-3 text-center font-bold">
                                    Action
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {addedProperties.length === 0 ? (
                                <tr className="bg-[#fff7f3]">
                                    <td
                                        colSpan={7}
                                        className="px-4 py-4 text-center text-muted-foreground"
                                    >
                                        No property added yet.
                                    </td>
                                </tr>
                            ) : (
                                addedProperties.map((item) => (
                                    <tr key={item.id} className="bg-[#fff7f3]">
                                        <td className="border-r border-white px-4 py-3">
                                            {item.propertyName}
                                        </td>

                                        <td className="border-r border-white px-4 py-3">
                                            {item.descriptionName}
                                        </td>

                                        <td className="border-r border-white px-4 py-3">
                                            {item.fireRiskTypeName}
                                        </td>

                                        <td className="border-r border-white px-4 py-3">
                                            {item.constructionType}
                                        </td>

                                        <td className="border-r border-white px-4 py-3">
                                            NPR {formatAmount(item.sumInsured)}
                                        </td>

                                        <td className="border-r border-white px-4 py-3">
                                            {item.directDiscount === "yes"
                                                ? "Yes"
                                                : "No"}
                                        </td>

                                        <td className="px-4 py-3 text-center">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="border-red-500 text-red-600 hover:bg-red-50"
                                                onClick={() =>
                                                    handleRemoveProperty(
                                                        item.id
                                                    )
                                                }
                                            >
                                                Remove
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}

                            <tr className="bg-[#e91d25] font-bold text-white">
                                <td
                                    className="border-r border-white px-4 py-3"
                                    colSpan={4}
                                >
                                    TOTAL
                                </td>

                                <td className="border-r border-white px-4 py-3">
                                    NPR {formatAmount(totalSumInsured)}
                                </td>

                                <td className="border-r border-white px-4 py-3" />

                                <td className="px-4 py-3" />
                            </tr>
                        </tbody>
                    </table>
                </div>

                {errors.propertyTable && (
                    <p className="mt-2 text-sm text-red-600">
                        {errors.propertyTable}
                    </p>
                )}

                <div className="mt-5 bg-[#fff0e8] px-4 py-4 text-lg text-orange-500">
                    Note: The sum insured property cannot exceed Rs. 2 crore.
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