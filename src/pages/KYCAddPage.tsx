// src/pages/KYCAdd.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InsuranceCard } from "@/components/InsuranceCard";
import { useLanguage } from "@/contexts/LanguageContext";
import logo from "@/assets/logo.png";

import { CustomerKycFormData } from "@/models/kyc";
import { submitCustomerKyc } from "@/api/kyc/customerKycClient";

export const KYCAddPage = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();

    const [serverMessage, setServerMessage] = useState<string | null>(null);
    const [serverIsError, setServerIsError] = useState(false);
    const [loading, setLoading] = useState(false);

    // image state
    const [imageProfile, setImageProfile] = useState<File | null>(null);
    const [imageFront, setImageFront] = useState<File | null>(null);
    const [imageBack, setImageBack] = useState<File | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<CustomerKycFormData>({
        defaultValues: {
            honour: "Mr.",
            firstNameNep: "",
            middleNameNep: "",
            lastNameNep: "",
            idType: "Citizenship",
            idNo: "",
            issuedDistrict: "",
            issueDateAD: "",
            issueDateBS: "",
            province: "",
            district: "",
            localLevel: "",
            wardNo: "",
            residenceCountry: "NEPAL",
            mobile: "",
            email: "",
            fatherName: "",
            fatherCitizenshipNo: "",
            gender: "" as any,
            dobAD: "",
            dobBS: "",
            occupation: "",
            politicallyInvolved: false,
            partyInspectionCategory: "Low",
            riskFactors: "2",
            imageProfile: null,
            imageFront: null,
            imageBack: null,
            docType: "citizenship",
        },
    });

    const onSubmit = async (values: CustomerKycFormData) => {
        setServerMessage(null);
        setServerIsError(false);
        setLoading(true);

        try {
            const payload: CustomerKycFormData = {
                ...values,
                imageProfile,
                imageFront,
                imageBack,
            };

            if (!payload.imageProfile || !payload.imageFront || !payload.imageBack) {
                throw new Error("Please upload all three images (profile, front, back).");
            }

            await submitCustomerKyc(payload);

            setServerMessage("KYC submitted successfully.");
            setServerIsError(false);
            navigate("/dashboard");
        } catch (err: any) {
            setServerIsError(true);
            setServerMessage(err.message || "Failed to submit KYC.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex">


            {/* Right Side - KYC Form */}
            <div className="w-[1650px] bg-card p-8 flex flex-col">
                <div className="mb-8 flex items-center justify-between">
                    <img src={logo} alt="Prabhu Insurance" className="h-14" />
                    <h1 className="text-2xl font-bold">
                        {t("kyc.title") || "Customer KYC"}
                    </h1>
                </div>

                <form
                    className="space-y-6 overflow-y-auto pr-2"
                    onSubmit={handleSubmit(onSubmit)}
                >
                    {/* Customer Name (Nepali) */}
                    <section>
                        <h2 className="text-lg font-semibold mb-3">Customer Name (Nepali)</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Honour</Label>
                                <Input {...register("honour")} />
                            </div>
                            <div>
                                <Label>First Name (Nep)</Label>
                                <Input {...register("firstNameNep", { required: true })} />
                                {errors.firstNameNep && (
                                    <p className="text-xs text-red-500 mt-1">
                                        First name is required
                                    </p>
                                )}
                            </div>
                            <div>
                                <Label>Middle Name (Nep)</Label>
                                <Input {...register("middleNameNep")} />
                            </div>
                            <div>
                                <Label>Last Name (Nep)</Label>
                                <Input {...register("lastNameNep", { required: true })} />
                                {errors.lastNameNep && (
                                    <p className="text-xs text-red-500 mt-1">
                                        Last name is required
                                    </p>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Identification */}
                    <section>
                        <h2 className="text-lg font-semibold mb-3">Identification</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Id Type</Label>
                                <Input {...register("idType", { required: true })} />
                            </div>
                            <div>
                                <Label>Id No</Label>
                                <Input {...register("idNo", { required: true })} />
                            </div>
                            <div>
                                <Label>Issued District</Label>
                                <Input {...register("issuedDistrict", { required: true })} />
                            </div>
                            <div>
                                <Label>Issue Date (AD)</Label>
                                <Input type="date" {...register("issueDateAD", { required: true })} />
                            </div>
                            <div>
                                <Label>Issue Date (BS)</Label>
                                <Input {...register("issueDateBS", { required: true })} />
                            </div>
                        </div>
                    </section>

                    {/* Address */}
                    <section>
                        <h2 className="text-lg font-semibold mb-3">Address</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Province</Label>
                                <Input {...register("province", { required: true })} />
                            </div>
                            <div>
                                <Label>District</Label>
                                <Input {...register("district", { required: true })} />
                            </div>
                            <div>
                                <Label>Local Level</Label>
                                <Input {...register("localLevel", { required: true })} />
                            </div>
                            <div>
                                <Label>Ward No</Label>
                                <Input {...register("wardNo", { required: true })} />
                            </div>
                            <div>
                                <Label>Residence Country</Label>
                                <Input {...register("residenceCountry", { required: true })} />
                            </div>
                        </div>
                    </section>

                    {/* Contact */}
                    <section>
                        <h2 className="text-lg font-semibold mb-3">Contact</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Mobile</Label>
                                <Input {...register("mobile", { required: true })} />
                            </div>
                            <div>
                                <Label>Email</Label>
                                <Input type="email" {...register("email", { required: true })} />
                            </div>
                        </div>
                    </section>

                    {/* Relation */}
                    <section>
                        <h2 className="text-lg font-semibold mb-3">Relation</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Father Name</Label>
                                <Input {...register("fatherName", { required: true })} />
                            </div>
                            <div>
                                <Label>Father Citizenship No</Label>
                                <Input {...register("fatherCitizenshipNo", { required: true })} />
                            </div>
                        </div>
                    </section>

                    {/* Customer Info */}
                    <section>
                        <h2 className="text-lg font-semibold mb-3">Customer Info</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Gender</Label>
                                <select
                                    className="border rounded-md px-3 py-2 w-full bg-background"
                                    {...register("gender", { required: true })}
                                >
                                    <option value="">Select</option>
                                    <option value="M">Male</option>
                                    <option value="F">Female</option>
                                    <option value="O">Other</option>
                                </select>
                            </div>
                            <div>
                                <Label>Date of Birth (AD)</Label>
                                <Input type="date" {...register("dobAD", { required: true })} />
                            </div>
                            <div>
                                <Label>Date of Birth (BS)</Label>
                                <Input {...register("dobBS", { required: true })} />
                            </div>
                            <div>
                                <Label>Occupation</Label>
                                <Input {...register("occupation", { required: true })} />
                            </div>
                        </div>
                    </section>

                    {/* Risk & Political */}
                    <section>
                        <h2 className="text-lg font-semibold mb-3">Risk & Political</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="politicallyInvolved"
                                    {...register("politicallyInvolved")}
                                />
                                <Label htmlFor="politicallyInvolved">Politically Involved</Label>
                            </div>
                            <div>
                                <Label>Inspection Category</Label>
                                <Input {...register("partyInspectionCategory", { required: true })} />
                            </div>
                            <div>
                                <Label>Risk Factors</Label>
                                <Input {...register("riskFactors", { required: true })} />
                            </div>
                        </div>
                    </section>

                    {/* Images */}
                    <section>
                        <h2 className="text-lg font-semibold mb-3">Document Images</h2>
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <Label>Profile Image</Label>
                                <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) =>
                                        setImageProfile(e.target.files?.[0] || null)
                                    }
                                />
                            </div>
                            <div>
                                <Label>Front Image</Label>
                                <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) =>
                                        setImageFront(e.target.files?.[0] || null)
                                    }
                                />
                            </div>
                            <div>
                                <Label>Back Image</Label>
                                <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) =>
                                        setImageBack(e.target.files?.[0] || null)
                                    }
                                />
                            </div>
                            <div>
                                <Label>Document Type</Label>
                                <Input {...register("docType", { required: true })} />
                            </div>
                        </div>
                    </section>

                    {serverMessage && (
                        <p
                            className={`text-sm mt-2 ${serverIsError ? "text-red-500" : "text-green-600"
                                }`}
                        >
                            {serverMessage}
                        </p>
                    )}

                    <Button
                        className="w-full mt-4"
                        size="lg"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? t("common.loading") : "Submit KYC"}
                    </Button>
                </form>
            </div>
        </div>
    );
};
