import React, { useMemo, useState } from "react";
import { buildSignatureForBody } from "../../api/session/signature";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

type TextFields = Record<string, string>;
type FileFields = Record<string, File | null>;

function getAccessToken(): string {
    return localStorage.getItem("access_token") || localStorage.getItem("accessToken") || "";
}

function extractApiMessage(json: any, fallbackText: string) {
    if (json && typeof json === "object") {
        if (Array.isArray(json.error_list) && json.error_list.length) {
            const msg = json.error_list
                .map((e: any) => e?.error_message || e?.message || "")
                .filter(Boolean)
                .join(" | ");
            if (msg) return msg;
        }
        if (typeof json.message === "string") return json.message;
        if (typeof json.error === "string") return json.error;
    }
    return fallbackText || "Request failed";
}

function Field(props: {
    name: string;
    label?: string;
    value: string;
    type?: React.HTMLInputTypeAttribute;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
}) {
    const { name, value, onChange, type = "text", placeholder, label } = props;
    return (
        <div className="grid gap-1">
            <label htmlFor={name} className="text-sm font-medium">
                {label ?? name}
            </label>
            <input
                id={name}
                name={name}
                type={type}
                value={value}
                onChange={onChange}
                className="w-full rounded-md border px-3 py-2"
                placeholder={placeholder}
            />
        </div>
    );
}

function FileField(props: {
    name: string;
    label?: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
    const { name, onChange, label } = props;
    return (
        <div className="grid gap-1">
            <label htmlFor={name} className="text-sm font-medium">
                {label ?? name}
            </label>
            <input
                id={name}
                name={name}
                type="file"
                onChange={onChange}
                className="w-full rounded-md border px-3 py-2"
                accept="image/*"
            />
            <p className="text-[11px] text-gray-500">
                (Browser security: file input cannot be auto-filled. Please choose file.)
            </p>
        </div>
    );
}

const POSTMAN_DEFAULTS: TextFields = {
    // Customer_Name
    "Customer_Name.Honour": "Mr.",
    "Customer_Name.First_Name": "Bijay",
    "Customer_Name.Middle_Name": "Sir",
    "Customer_Name.Last_Name": "Rana",
    "Customer_Name.First_Name_nep": "तर्क",
    "Customer_Name.Middle_Name_nep": "बहादुर",
    "Customer_Name.Last_Name_nep": "राणा",

    // Identification
    "Identification.Id_Type": "Citizenship",
    "Identification.Id_No": "6679876211",
    "Identification.Issued_District": "Kathmandu",
    "Identification.Issue_Date_AD": "2018-03-15",
    "Identification.Issue_Date_BS": "2074-11-01",

    // Address
    "Address.Province": "STATE 3",
    "Address.District": "Kathmandu",
    "Address.Local_level": "Kathmandu Mahanagarpalika",
    "Address.Ward_No": "7",
    "Address.Residence_Country": "NEPAL",

    // Contact
    "Contact.Mobile": "9846789970",
    "Contact.Email": "tarkabahadur1@test.com",

    // Relation
    "Relation.Father_Name": "Ramesh Chaudhary",
    "Relation.Father_Name_nep": "रमेश चौधरी",
    "Relation.Father_Citizenship_No": "2645891277",
    "Relation.Father_Citizenship_Issued_District": "Kathmandu",

    // CustomerInformation
    "CustomerInformation.Gender": "M",
    "CustomerInformation.Date_Of_Birth_AD": "1994-05-21",
    "CustomerInformation.Date_Of_Birth_BS": "2051-02-08",
    "CustomerInformation.Occupation": "Teaching",

    // Other
    Politically_Involved: "false",
    Party_Inspection_Category: "Low",
    Risk_Factors: "1",

    // customer_image
    "customer_image.doc_type": "citizenship",
};

const FILE_KEYS: (keyof FileFields)[] = [
    "customer_image.image_profile",
    "customer_image.ctz_image_front",
    "customer_image.ctz_image_back",
    "customer_image.passport_image_front",
    "customer_image.passport_image_back",
    "customer_image.nid_image_front",
    "customer_image.nid_image_back",
];

export default function KycTestPage() {
    const [fields, setFields] = useState<TextFields>({ ...POSTMAN_DEFAULTS });

    const [files, setFiles] = useState<FileFields>({
        "customer_image.image_profile": null,
        "customer_image.ctz_image_front": null,
        "customer_image.ctz_image_back": null,
        "customer_image.passport_image_front": null,
        "customer_image.passport_image_back": null,
        "customer_image.nid_image_front": null,
        "customer_image.nid_image_back": null,
    });

    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState("");
    const [apiSuccess, setApiSuccess] = useState("");
    const [rawResponse, setRawResponse] = useState<any>(null);

    const [debug, setDebug] = useState({
        unixTs: "",
        signature: "",
        verify: "",
        dataToSign: "",
    });

    const buttonText = useMemo(() => {
        if (loading) return "Sending...";
        if (apiSuccess) return "KYC Saved ✅";
        return "Send KYC";
    }, [loading, apiSuccess]);

    function onChangeText(e: React.ChangeEvent<HTMLInputElement>) {
        const { name, value } = e.target;
        setFields((prev) => ({ ...prev, [name]: value }));
    }

    function onChangeFile(e: React.ChangeEvent<HTMLInputElement>) {
        const { name } = e.target;
        const f = e.target.files?.[0] ?? null;
        setFiles((prev) => ({ ...prev, [name]: f }));
    }

    function buildFormData(): FormData {
        const fd = new FormData();

        // text fields
        for (const [k, v] of Object.entries(fields)) {
            // append even if empty? Postman usually sends checked ones only.
            // We will send non-empty only:
            if (v !== "" && v !== undefined && v !== null) fd.append(k, v);
        }

        // file fields
        for (const [k, f] of Object.entries(files)) {
            if (f) fd.append(k, f);
        }

        return fd;
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setApiError("");
        setApiSuccess("");
        setRawResponse(null);

        if (!API_BASE_URL) {
            setApiError("VITE_API_BASE_URL is not set");
            return;
        }

        const accessToken = getAccessToken();
        if (!accessToken) {
            setApiError("Access token missing in localStorage (access_token or accessToken).");
            return;
        }

        setLoading(true);
        try {
            // ✅ Postman form-data signing uses empty body: ""
            const { unixTs, signature } = buildSignatureForBody("");
            const verify = `${unixTs}.${signature}`;
           

            const fd = buildFormData();

            const res = await fetch(`${API_BASE_URL}/v1/CustomerKyc/customer-kyc`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "verify-signature": verify,
                    Accept: "*/*",
                    // ❌ DO NOT set Content-Type for FormData
                },
                body: fd,
            });

            const text = await res.text();
            let json: any = null;
            try {
                json = text ? JSON.parse(text) : null;
            } catch {
                json = null;
            }

            setRawResponse(json ?? text);

            // backend sometimes returns 200 even when process_result false
            if (!res.ok || json?.process_result === false) {
                setApiError(extractApiMessage(json, text));
                return;
            }

            setApiSuccess(json?.message || "KYC Saved");
        } catch (err: any) {
            setApiError(err?.message || "Network error");
        } finally {
            setLoading(false);
        }
    }

    function resetToPostmanDefaults() {
        setFields({ ...POSTMAN_DEFAULTS });
        setApiError("");
        setApiSuccess("");
        setRawResponse(null);
    }

    return (
        <div className="mt-5 p-4 max-w-6xl mx-auto">
            <form onSubmit={handleSubmit} className="grid gap-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-semibold">Customer KYC</h2>
                        <p className="text-sm text-gray-500">
                            POST <span className="font-mono">/v1/CustomerKyc/customer-kyc</span>
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={resetToPostmanDefaults}
                            className="rounded-lg border px-4 py-3 font-medium"
                        >
                            Load Postman Defaults
                        </button>

                        <button
                            type="submit"
                            disabled={loading}
                            className="rounded-lg bg-black px-5 py-3 text-white font-medium disabled:opacity-60"
                        >
                            {buttonText}
                        </button>
                    </div>
                </div>

                {/* Message boxes */}
                {apiError ? (
                    <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-red-800">
                        <div className="font-semibold">Error</div>
                        <div className="text-sm whitespace-pre-wrap">{apiError}</div>
                    </div>
                ) : null}

                {apiSuccess ? (
                    <div className="rounded-lg border border-green-300 bg-green-50 p-3 text-green-800">
                        <div className="font-semibold">Success</div>
                        <div className="text-sm">{apiSuccess}</div>
                    </div>
                ) : null}

                {/* Signature debug */}
                <section className="rounded-xl border p-4">
                    <h3 className="text-lg font-medium mb-2">Signature Debug (Postman style)</h3>
                    <pre className="text-xs bg-gray-50 border rounded-lg p-3 overflow-auto">
                        {JSON.stringify(debug, null, 2)}
                    </pre>
                </section>

                {/* Customer Name */}
                <section className="rounded-xl border p-4">
                    <h3 className="text-lg font-medium mb-3">Customer Name</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                        <Field name="Customer_Name.Honour" value={fields["Customer_Name.Honour"]} onChange={onChangeText} />
                        <Field name="Customer_Name.First_Name" value={fields["Customer_Name.First_Name"]} onChange={onChangeText} />
                        <Field name="Customer_Name.Middle_Name" value={fields["Customer_Name.Middle_Name"]} onChange={onChangeText} />
                        <Field name="Customer_Name.Last_Name" value={fields["Customer_Name.Last_Name"]} onChange={onChangeText} />
                        <Field name="Customer_Name.First_Name_nep" value={fields["Customer_Name.First_Name_nep"]} onChange={onChangeText} />
                        <Field name="Customer_Name.Middle_Name_nep" value={fields["Customer_Name.Middle_Name_nep"]} onChange={onChangeText} />
                        <div className="md:col-span-2">
                            <Field name="Customer_Name.Last_Name_nep" value={fields["Customer_Name.Last_Name_nep"]} onChange={onChangeText} />
                        </div>
                    </div>
                </section>

                {/* Identification */}
                <section className="rounded-xl border p-4">
                    <h3 className="text-lg font-medium mb-3">Identification</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                        <Field name="Identification.Id_Type" value={fields["Identification.Id_Type"]} onChange={onChangeText} />
                        <Field name="Identification.Id_No" value={fields["Identification.Id_No"]} onChange={onChangeText} />
                        <Field name="Identification.Issued_District" value={fields["Identification.Issued_District"]} onChange={onChangeText} />
                        <Field name="Identification.Issue_Date_AD" type="date" value={fields["Identification.Issue_Date_AD"]} onChange={onChangeText} />
                        <div className="md:col-span-2">
                            <Field name="Identification.Issue_Date_BS" value={fields["Identification.Issue_Date_BS"]} onChange={onChangeText} />
                        </div>
                    </div>
                </section>

                {/* Address */}
                <section className="rounded-xl border p-4">
                    <h3 className="text-lg font-medium mb-3">Address</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                        <Field name="Address.Province" value={fields["Address.Province"]} onChange={onChangeText} />
                        <Field name="Address.District" value={fields["Address.District"]} onChange={onChangeText} />
                        <Field name="Address.Local_level" value={fields["Address.Local_level"]} onChange={onChangeText} />
                        <Field name="Address.Ward_No" value={fields["Address.Ward_No"]} onChange={onChangeText} />
                        <div className="md:col-span-2">
                            <Field name="Address.Residence_Country" value={fields["Address.Residence_Country"]} onChange={onChangeText} />
                        </div>
                    </div>
                </section>

                {/* Contact */}
                <section className="rounded-xl border p-4">
                    <h3 className="text-lg font-medium mb-3">Contact</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                        <Field name="Contact.Mobile" value={fields["Contact.Mobile"]} onChange={onChangeText} />
                        <Field name="Contact.Email" type="email" value={fields["Contact.Email"]} onChange={onChangeText} />
                    </div>
                </section>

                {/* Relation */}
                <section className="rounded-xl border p-4">
                    <h3 className="text-lg font-medium mb-3">Relation</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                        <Field name="Relation.Father_Name" value={fields["Relation.Father_Name"]} onChange={onChangeText} />
                        <Field name="Relation.Father_Name_nep" value={fields["Relation.Father_Name_nep"]} onChange={onChangeText} />
                        <Field name="Relation.Father_Citizenship_No" value={fields["Relation.Father_Citizenship_No"]} onChange={onChangeText} />
                        <Field
                            name="Relation.Father_Citizenship_Issued_District"
                            value={fields["Relation.Father_Citizenship_Issued_District"]}
                            onChange={onChangeText}
                        />
                    </div>
                </section>

                {/* CustomerInformation */}
                <section className="rounded-xl border p-4">
                    <h3 className="text-lg font-medium mb-3">Customer Information</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                        <Field name="CustomerInformation.Gender" value={fields["CustomerInformation.Gender"]} onChange={onChangeText} />
                        <Field name="CustomerInformation.Date_Of_Birth_AD" type="date" value={fields["CustomerInformation.Date_Of_Birth_AD"]} onChange={onChangeText} />
                        <Field name="CustomerInformation.Date_Of_Birth_BS" value={fields["CustomerInformation.Date_Of_Birth_BS"]} onChange={onChangeText} />
                        <Field name="CustomerInformation.Occupation" value={fields["CustomerInformation.Occupation"]} onChange={onChangeText} />
                    </div>
                </section>

                {/* Other */}
                <section className="rounded-xl border p-4">
                    <h3 className="text-lg font-medium mb-3">Other</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                        <Field name="Politically_Involved" value={fields["Politically_Involved"]} onChange={onChangeText} />
                        <Field name="Party_Inspection_Category" value={fields["Party_Inspection_Category"]} onChange={onChangeText} />
                        <div className="md:col-span-2">
                            <Field name="Risk_Factors" value={fields["Risk_Factors"]} onChange={onChangeText} />
                        </div>
                    </div>
                </section>

                {/* customer_image */}
                <section className="rounded-xl border p-4">
                    <h3 className="text-lg font-medium mb-3">customer_image</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="md:col-span-2">
                            <Field name="customer_image.doc_type" value={fields["customer_image.doc_type"]} onChange={onChangeText} />
                        </div>

                        {FILE_KEYS.map((k) => (
                            <FileField key={k} name={k} onChange={onChangeFile} />
                        ))}
                    </div>
                </section>

                {/* Response */}
                <section className="rounded-xl border p-4">
                    <h3 className="text-lg font-medium mb-2">API Response</h3>
                    <pre className="text-xs bg-gray-50 border rounded-lg p-3 overflow-auto">
                        {rawResponse ? JSON.stringify(rawResponse, null, 2) : "No response yet."}
                    </pre>
                </section>
            </form>
        </div>
    );
}
