import { useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Loader2,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  getGroupPersonalAccidentPremium,
  createGroupPersonalAccidentPolicy,
  type GroupPersonalAccidentPremiumRequest,
  type GroupPersonalAccidentPremiumResponse,
  type GroupPersonInfo,
  type CreateGroupPersonalAccidentPolicyPayload,
} from "@/api/accident/CreateGroupPersonalAccident";
import { Switch } from "@/components/ui/switch";

const professionOptions = [
  { label: "General Staff", value: "1" },
  { label: "Employee / Worker Group", value: "2" },
  { label: "Contractor Group", value: "3" },
];

const relationOptions = ["Employee", "Contract", "Member", "Partner", "Other"];
const nomineeRelationOptions = ["Father", "Mother", "Brother", "Sister", "Spouse", "Son", "Daughter", "Other"];

type ErrorBag = Record<string, string>;

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addOneYear(dateISO: string): string {
  const d = new Date(dateISO || todayISO());
  d.setFullYear(d.getFullYear() + 1);
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatAmount(value: number | string | null | undefined): string {
  const num = Number(String(value ?? "0").replace(/,/g, ""));
  if (!Number.isFinite(num)) return "0.00";
  return num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function calculateAge(dob: string): string {
  if (!dob) return "";
  const birthDate = new Date(dob);
  const today = new Date();
  if (Number.isNaN(birthDate.getTime()) || birthDate > today) return "";

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }
  return age >= 0 ? String(age) : "";
}

function newPerson(index: number): GroupPersonInfo {
  return {
    person_code: `T${String(Date.now()).slice(-4)}${index}`,
    person_name: "",
    dob: "",
    age: "",
    designation: "",
    suminsured: "250000",
    relationship_with_prosper: "Employee",
    occupation_nature: "user defined",
    nominee_name: "",
    nominee_relation: "",
  };
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 break-all text-lg font-bold text-black">{value}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex justify-between gap-4 border-b py-2 last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium">{value || "—"}</span>
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
      <td className={`border-r border-white px-4 py-3 ${isLess ? "text-red-600" : "text-black"}`}>
        {label}
      </td>
      <td className={`px-4 py-3 text-right font-medium ${isLess ? "text-red-600" : "text-black"}`}>
        {textOnly ? value : `NPR ${formatAmount(value)}`}
      </td>
    </tr>
  );
}

export default function AccidentsGroupPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentStep = Number(searchParams.get("step")) || 2;

  const [professionId, setProfessionId] = useState("2");
  const [directDiscount, setDirectDiscount] = useState(true);
  const [effectiveDate, setEffectiveDate] = useState(todayISO());
  const expiryDate = useMemo(() => addOneYear(effectiveDate), [effectiveDate]);

  const [persons, setPersons] = useState<GroupPersonInfo[]>([
    newPerson(1),
  ]);

  const [errors, setErrors] = useState<ErrorBag>({});
  const [inlineError, setInlineError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [premiumResponse, setPremiumResponse] = useState<GroupPersonalAccidentPremiumResponse | null>(() => {
    try {
      return JSON.parse(localStorage.getItem("accident.groupPremiumResponse") || "null");
    } catch {
      return null;
    }
  });

  const totalPerson = String(persons.length);
  const totalSuminsured = useMemo(
    () => persons.reduce((sum, person) => sum + Number(person.suminsured || 0), 0),
    [persons],
  );
  const amount = premiumResponse?.amount_info;

  const goToStep = (step: number) => setSearchParams({ step: String(step) });

  const clearError = (key: string) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const updatePerson = (index: number, key: keyof GroupPersonInfo, value: string) => {
    setPersons((prev) =>
      prev.map((person, i) => {
        if (i !== index) return person;
        const cleanValue = key === "suminsured" ? value.replace(/[^\d]/g, "") : value;
        const next: GroupPersonInfo = { ...person, [key]: cleanValue };
        if (key === "dob") next.age = calculateAge(value);
        return next;
      }),
    );
    clearError(`${key}_${index}`);
    clearError("personTotal");
    clearError("totalSuminsured");
  };

  const addPerson = () => {
    setPersons((prev) => [...prev, newPerson(prev.length + 1)]);
    clearError("persons");
  };

  const removePerson = (index: number) => {
    if (persons.length <= 1) {
      toast.error("At least one person is required");
      return;
    }
    setPersons((prev) => prev.filter((_, i) => i !== index));
    clearError("persons");
  };

  const validatePremium = (): ErrorBag => {
    const newErrors: ErrorBag = {};
    if (persons.length <= 0) newErrors.persons = "At least one person is required";

    persons.forEach((person, index) => {
      if (!person.suminsured.trim()) {
        newErrors[`suminsured_${index}`] = `Sum insured is required for person ${index + 1}`;
      } else if (!/^\d+$/.test(person.suminsured) || Number(person.suminsured) <= 0) {
        newErrors[`suminsured_${index}`] = `Enter valid sum insured for person ${index + 1}`;
      }
    });

    if (totalSuminsured <= 0) newErrors.totalSuminsured = "Total sum insured must be greater than 0";
    return newErrors;
  };

  const validatePolicyDetails = (): ErrorBag => {
    const newErrors: ErrorBag = {};
    if (!professionId) newErrors.professionId = "Profession is required";
    if (!effectiveDate) newErrors.effectiveDate = "Effective date is required";

    persons.forEach((person, index) => {
      const row = index + 1;
      if (!person.person_code.trim()) newErrors[`person_code_${index}`] = `Person code is required in row ${row}`;
      if (!person.person_name.trim()) newErrors[`person_name_${index}`] = `Person name is required in row ${row}`;
      if (!person.dob) newErrors[`dob_${index}`] = `DOB is required in row ${row}`;
      if (!person.age) newErrors[`age_${index}`] = `Valid age is required in row ${row}`;
      if (!person.designation.trim()) newErrors[`designation_${index}`] = `Designation is required in row ${row}`;
      if (!person.suminsured.trim() || Number(person.suminsured) <= 0) newErrors[`suminsured_${index}`] = `Valid sum insured is required in row ${row}`;
      if (!person.relationship_with_prosper.trim()) newErrors[`relationship_with_prosper_${index}`] = `Relationship is required in row ${row}`;
      if (!person.occupation_nature.trim()) newErrors[`occupation_nature_${index}`] = `Occupation nature is required in row ${row}`;
    });

    if (totalSuminsured <= 0) newErrors.personTotal = "Total sum insured must be greater than 0";
    return newErrors;
  };

  const buildPremiumPayload = (): GroupPersonalAccidentPremiumRequest => ({
    class_id: "19",
    total_suminsured: String(totalSuminsured),
    person_info: persons.map((person) => ({
      suminsured: String(person.suminsured || "0"),
    })),
    get_direct_discount: directDiscount ? "y" : "n",
    total_person: totalPerson,
  });

  const handleCalculate = async () => {
    setInlineError("");
    const validationErrors = validatePremium();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    const payload = buildPremiumPayload();

    try {
      setLoading(true);
      localStorage.setItem("accident.groupPremiumPayload", JSON.stringify(payload));
      localStorage.setItem("accident.groupPersonDraft", JSON.stringify(persons));

      const response = await getGroupPersonalAccidentPremium(payload);
      localStorage.setItem("accident.groupPremiumResponse", JSON.stringify(response));
      setPremiumResponse(response);
      goToStep(3);
    } catch (error: any) {
      setInlineError(error?.message || "Failed to calculate group personal accident premium");
    } finally {
      setLoading(false);
    }
  };

  const saveDetailsAndNext = () => {
    const validationErrors = validatePolicyDetails();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      toast.error("Please fix group member details");
      return;
    }
    localStorage.setItem(
      "accident.groupPolicyDetails",
      JSON.stringify({ professionId, effectiveDate, expiryDate, persons, totalSuminsured }),
    );
    goToStep(5);
  };

  const handleSubmit = async () => {
    if (!premiumResponse?.policy_session_id) {
      toast.error("policy_session_id missing. Please calculate premium again.");
      goToStep(2);
      return;
    }

    const validationErrors = validatePolicyDetails();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      toast.error("Please fix details before submit");
      return;
    }

    const payload: CreateGroupPersonalAccidentPolicyPayload = {
      client_info: {
        Bank_Code: "1",
      },
      policy_info: {
        department_id: "3",
        class_id: "19",
        payment_process: "Full Payment",
        effective_date: effectiveDate,
        expiry_date: expiryDate,
      },
      policy_session_id: premiumResponse.policy_session_id,
      class_info: {
        class_id: "19",
        profession_id: professionId || "2",
        total_suminsured: String(totalSuminsured || "0"),
        is_bulk_insert: "",
        person_info: persons.map((person) => ({
          person_code: person.person_code || "",
          person_name: person.person_name || "",
          dob: person.dob || "",
          age: String(person.age || ""),
          designation: person.designation || "",
          suminsured: String(person.suminsured || "0"),
          relationship_with_prosper: person.relationship_with_prosper || "",
          occupation_nature: person.occupation_nature || "user defined",
          nominee_name: person.nominee_name || "",
          nominee_relation: person.nominee_relation || "",
        })),
      },
    };

    try {
      setSubmitLoading(true);
      const response = await createGroupPersonalAccidentPolicy(payload);
      const policyNo = response?.policy_no || response?.policy_number || response?.document_number || "";

      toast.success(
        policyNo
          ? `Group personal accident policy created successfully. Policy No: ${policyNo}`
          : "Group personal accident policy created successfully",
      );

      localStorage.removeItem("accident.groupPremiumPayload");
      localStorage.removeItem("accident.groupPremiumResponse");
      localStorage.removeItem("accident.groupPersonDraft");
      localStorage.removeItem("accident.groupPolicyDetails");

      navigate("/my-draft-policy");
    } catch (error: any) {
      toast.error(error?.message || "Failed to create group personal accident policy");
    } finally {
      setSubmitLoading(false);
    }
  };

  const fieldError = (key: string) =>
    errors[key] ? <p className="mt-1 text-xs text-red-600">{errors[key]}</p> : null;

  return (
    <div>
      <div className="mb-8 flex items-start gap-3">
        <button
          type="button"
          onClick={() => (currentStep <= 2 ? navigate("/accidents?step=1") : goToStep(currentStep - 1))}
          className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-white hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5 text-black" />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-black">Group Personal Accident Insurance</h1>
          </div>
        </div>
      </div>

      {inlineError && (
        <div className="mb-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{inlineError}</span>
        </div>
      )}

      {currentStep === 2 && (
        <>
          <Card>
            <CardHeader className="border-b bg-muted/30">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-base">Premium Calculation</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Add person-wise sum insured. This sends Postman premium payload format.
                  </p>
                </div>
                <Button type="button" variant="outline" size="sm" className="gap-2" onClick={addPerson}>
                  <Plus className="h-4 w-4" /> Add Person
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 pt-6">
              {fieldError("persons")}
              {fieldError("totalSuminsured")}

              <div className="space-y-4">
                {persons.map((person, index) => (
                  <div key={index} className="rounded-xl border bg-white p-4 shadow-sm transition hover:border-primary/40">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-black">Person {index + 1}</h3>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="gap-1 text-red-600 hover:text-red-700"
                        onClick={() => removePerson(index)}
                      >
                        <Trash2 className="h-4 w-4" /> Remove
                      </Button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-[1fr_220px]">
                      <div>
                        <Label htmlFor={`suminsured_${index}`}>Sum Insured *</Label>
                        <Input
                          id={`suminsured_${index}`}
                          type="text"
                          inputMode="numeric"
                          value={person.suminsured}
                          placeholder="250000"
                          onChange={(event) => updatePerson(index, "suminsured", event.target.value)}
                          className={`mt-2 h-12 ${errors[`suminsured_${index}`] ? "border-red-500" : ""}`}
                        />
                        {fieldError(`suminsured_${index}`)}
                      </div>

                      <div className="rounded-lg border bg-muted/30 p-4">
                        <p className="text-xs text-muted-foreground">Current Amount</p>
                        <p className="mt-2 text-lg font-bold text-black">NPR {formatAmount(person.suminsured)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div
                onClick={() => setDirectDiscount((prev) => !prev)}
                className="inline-flex cursor-pointer items-center gap-3 mt-4"
              >
                <Switch
                  id="directDiscount"
                  checked={directDiscount}
                  onCheckedChange={setDirectDiscount}
                  onClick={(event) => event.stopPropagation()}
                />

                <Label
                  htmlFor="directDiscount"
                  className="cursor-pointer text-sm font-medium"
                >
                  Direct Discount
                </Label>
              </div>
              <div className="flex justify-between pt-3">
                <Button type="button" variant="outline" className="gap-2" onClick={() => navigate("/accidents?step=1")}>
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
                <Button type="button" size="lg" disabled={loading} onClick={handleCalculate} className="gap-2 bg-[#f71920] px-8 text-white hover:bg-[#d9151b]">
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Calculating...
                    </>
                  ) : (
                    <>
                      Calculate <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {currentStep === 3 && (
        <>
          {!premiumResponse || !amount ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Premium response not found. Please calculate again.
            </div>
          ) : (
            <>
            
              <Card className="overflow-hidden">
                <CardHeader className="border-b bg-muted/30">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <CardTitle className="text-base">Premium Details</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[650px] border-collapse text-sm">
                      <thead>
                        <tr className="bg-[#e91d25] text-white">
                          <th className="border-r border-white px-4 py-3 text-left font-bold">Particulars</th>
                          <th className="px-4 py-3 text-right font-bold">Amount NPR </th>
                        </tr>
                      </thead>
                      <tbody>
                        <PremiumRow label="Sum Insured" value={amount.suminsured} />
                        <PremiumRow label="Premium Amount" value={amount.premium_amount} />
                        <PremiumRow label="RS/MD/ST" value={amount.pool_amount} />
                        <PremiumRow label={`Direct Discount (${premiumResponse.direct_discount_percent}%)`} value={premiumResponse.direct_discount_amount} isLess />
                        <PremiumRow label="Taxable Amount" value={amount.taxable_amount} />
                        <PremiumRow label={`VAT (${amount.vat_percent}%)`} value={amount.vat_amount} />
                        <PremiumRow label="Stamp Duty" value={amount.stamp_duty} />
                        <tr className="bg-[#b71319] text-white">
                          <td className="border-r border-white px-4 py-4 text-base font-bold">Total Premium With VAT</td>
                          <td className="px-4 py-4 text-right text-base font-bold">NPR {formatAmount(premiumResponse.total_premium_with_vat)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              <div className="mt-8 flex justify-between">
                <Button type="button" variant="outline" className="gap-2" onClick={() => goToStep(2)}>
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
                <Button type="button" className="gap-2 bg-[#f71920] text-white hover:bg-[#d9151b]" onClick={() => goToStep(4)}>
                  Continue Details <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </>
      )}

      {currentStep === 4 && (
        <Card>
          <CardHeader className="border-b bg-muted/30">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-base">Policy & Group Member Details</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">These fields are used for create group policy.</p>
              </div>
              <Button type="button" variant="outline" size="sm" className="gap-2" onClick={addPerson}>
                <Plus className="h-4 w-4" /> Add Person
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 pt-6">
            <div className="grid gap-5 md:grid-cols-3">
              <div>
                <Label>Profession *</Label>
                <Select
                  value={professionId}
                  onValueChange={(value) => {
                    setProfessionId(value);
                    clearError("professionId");
                  }}
                >
                  <SelectTrigger className={`mt-2 h-12 ${errors.professionId ? "border-red-500" : ""}`}>
                    <SelectValue placeholder="Select profession" />
                  </SelectTrigger>
                  <SelectContent>
                    {professionOptions.map((item) => (
                      <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldError("professionId")}
              </div>

              <div>
                <Label>Effective Date *</Label>
                <Input
                  type="date"
                  min={todayISO()}
                  value={effectiveDate}
                  onChange={(event) => {
                    setEffectiveDate(event.target.value);
                    clearError("effectiveDate");
                  }}
                  className={`mt-2 h-12 ${errors.effectiveDate ? "border-red-500" : ""}`}
                />
                {fieldError("effectiveDate")}
              </div>

              <div>
                <Label>Expiry Date</Label>
                <Input type="date" value={expiryDate} disabled className="mt-2 h-12" />
              </div>
            </div>



            <div className="space-y-5">
              {persons.map((person, index) => (
                <div key={index} className="rounded-xl border p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-semibold">Person {index + 1}</h3>
                    <Button type="button" variant="ghost" size="sm" className="gap-1 text-red-600" onClick={() => removePerson(index)}>
                      <Trash2 className="h-4 w-4" /> Remove
                    </Button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <Label>Person Code *</Label>
                      <Input className="mt-2" value={person.person_code} onChange={(event) => updatePerson(index, "person_code", event.target.value)} placeholder="T329" />
                      {fieldError(`person_code_${index}`)}
                    </div>
                    <div>
                      <Label>Person Name *</Label>
                      <Input className="mt-2" value={person.person_name} onChange={(event) => updatePerson(index, "person_name", event.target.value)} placeholder="Staff 1" />
                      {fieldError(`person_name_${index}`)}
                    </div>
                    <div>
                      <Label>DOB *</Label>
                      <Input type="date" className="mt-2" value={person.dob} onChange={(event) => updatePerson(index, "dob", event.target.value)} />
                      {fieldError(`dob_${index}`)}
                    </div>
                    <div>
                      <Label>Age *</Label>
                      <Input className="mt-2" value={person.age} readOnly />
                      {fieldError(`age_${index}`)}
                    </div>
                    <div>
                      <Label>Designation *</Label>
                      <Input className="mt-2" value={person.designation} onChange={(event) => updatePerson(index, "designation", event.target.value)} placeholder="Supervisor" />
                      {fieldError(`designation_${index}`)}
                    </div>
                    <div>
                      <Label>Sum Insured *</Label>
                      <Input inputMode="numeric" className="mt-2" value={person.suminsured} onChange={(event) => updatePerson(index, "suminsured", event.target.value)} placeholder="100000" />
                      {fieldError(`suminsured_${index}`)}
                    </div>
                    <div>
                      <Label>Relationship With Proposer *</Label>
                      <Select value={person.relationship_with_prosper} onValueChange={(value) => updatePerson(index, "relationship_with_prosper", value)}>
                        <SelectTrigger className="mt-2"><SelectValue placeholder="Select relationship" /></SelectTrigger>
                        <SelectContent>
                          {relationOptions.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      {fieldError(`relationship_with_prosper_${index}`)}
                    </div>
                    <div>
                      <Label>Occupation Nature *</Label>
                      <Input className="mt-2" value={person.occupation_nature} onChange={(event) => updatePerson(index, "occupation_nature", event.target.value)} placeholder="user defined" />
                      {fieldError(`occupation_nature_${index}`)}
                    </div>
                    <div>
                      <Label>Nominee Name</Label>
                      <Input className="mt-2" value={person.nominee_name} onChange={(event) => updatePerson(index, "nominee_name", event.target.value)} placeholder="Nominee name" />
                    </div>
                    <div>
                      <Label>Nominee Relation</Label>
                      <Select value={person.nominee_relation} onValueChange={(value) => updatePerson(index, "nominee_relation", value)}>
                        <SelectTrigger className="mt-2"><SelectValue placeholder="Select nominee relation" /></SelectTrigger>
                        <SelectContent>
                          {nomineeRelationOptions.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between pt-3">
              <Button type="button" variant="outline" className="gap-2" onClick={() => goToStep(3)}>
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <Button type="button" className="gap-2 bg-[#f71920] px-8 text-white hover:bg-[#d9151b]" onClick={saveDetailsAndNext}>
                Review <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 5 && (
        <Card>
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle className="h-5 w-5 text-green-600" /> Review & Create Policy
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6 pt-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-xl border p-5">
                <h3 className="mb-3 font-semibold">Policy Summary</h3>
                <InfoRow label="Department ID" value="3" />
                <InfoRow label="Class ID" value="19" />
                <InfoRow label="Profession ID" value={professionId} />
                <InfoRow label="Payment Process" value="Full Payment" />
                <InfoRow label="Effective Date" value={effectiveDate} />
                <InfoRow label="Expiry Date" value={expiryDate} />
                <InfoRow label="Policy Session ID" value={premiumResponse?.policy_session_id || "—"} />
              </div>

              <div className="rounded-xl border p-5">
                <h3 className="mb-3 font-semibold">Premium Summary</h3>
                <InfoRow label="Total Persons" value={persons.length} />
                <InfoRow label="Total Sum Insured" value={`NPR ${formatAmount(totalSuminsured)}`} />
                <InfoRow label="Direct Discount" value={directDiscount ? "Yes" : "No"} />
                <InfoRow label="Premium Amount" value={`NPR ${formatAmount(amount?.premium_amount)}`} />
                <InfoRow label="Taxable Amount" value={`NPR ${formatAmount(amount?.taxable_amount)}`} />
                <InfoRow label="VAT" value={`NPR ${formatAmount(amount?.vat_amount)}`} />
                <InfoRow label="Total Premium" value={`NPR ${formatAmount(premiumResponse?.total_premium_with_vat)}`} />
              </div>
            </div>

            <div className="rounded-xl border">
              <div className="border-b p-4">
                <h3 className="font-semibold">Person List</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[950px] text-sm">
                  <thead>
                    <tr className="bg-muted/40 text-left">
                      <th className="px-4 py-3">Code</th>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">DOB</th>
                      <th className="px-4 py-3">Age</th>
                      <th className="px-4 py-3">Designation</th>
                      <th className="px-4 py-3 text-right">Sum Insured</th>
                      <th className="px-4 py-3">Relationship</th>
                      <th className="px-4 py-3">Nominee</th>
                    </tr>
                  </thead>
                  <tbody>
                    {persons.map((person, index) => (
                      <tr key={index} className="border-t">
                        <td className="px-4 py-3">{person.person_code}</td>
                        <td className="px-4 py-3">{person.person_name}</td>
                        <td className="px-4 py-3">{person.dob}</td>
                        <td className="px-4 py-3">{person.age}</td>
                        <td className="px-4 py-3">{person.designation}</td>
                        <td className="px-4 py-3 text-right">NPR {formatAmount(person.suminsured)}</td>
                        <td className="px-4 py-3">{person.relationship_with_prosper}</td>
                        <td className="px-4 py-3">
                          {person.nominee_name || "—"}{person.nominee_relation ? ` (${person.nominee_relation})` : ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-between pt-3">
              <Button type="button" variant="outline" className="gap-2" onClick={() => goToStep(4)}>
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <Button type="button" size="lg" disabled={submitLoading} onClick={handleSubmit} className="gap-2 bg-[#f71920] px-8 text-white hover:bg-[#d9151b]">
                {submitLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Creating Policy...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" /> Create Policy
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
