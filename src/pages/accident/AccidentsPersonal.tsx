// src/pages/accident/PersonalAccidentPage.tsx

import { useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  ChevronLeft,
  FileText,
  Loader2,
  UserRound,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  getPersonalAccidentPremium,
  type PersonalAccidentPremiumRequest,
  type PersonalAccidentPremiumResponse,
} from "@/api/accident/CreatePersonalAccident";
import {
  createPersonalAccidentPolicy,
  type CreatePersonalAccidentPolicyPayload,
} from "@/api/accident/CreatePersonalAccident";
import { Switch } from "@/components/ui/switch";

const yesNoOptions = [
  { label: "Yes", value: "yes" },
  { label: "No", value: "no" },
];

const professionOptions = [
  { label: "General", value: "1" },
  { label: "Service", value: "2" },
  { label: "Business", value: "3" },
  { label: "Student", value: "4" },
];

const honorOptions = ["Mr.", "Mrs.", "Ms.", "Miss", "Dr."];

const relationOptions = [
  "Father",
  "Mother",
  "Brother",
  "Sister",
  "Spouse",
  "Son",
  "Daughter",
  "Other",
];

function todayISO(): string {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

function addOneYear(dateISO: string): string {
  const date = new Date(dateISO);
  date.setFullYear(date.getFullYear() + 1);
  date.setDate(date.getDate() - 1);

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

function formatAmount(value: number | string | null | undefined) {
  const cleanValue = String(value ?? "0").replace(/,/g, "");
  const num = Number(cleanValue);

  if (!Number.isFinite(num)) return "0.00";

  return num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function readStorage<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") || fallback;
  } catch {
    return fallback;
  }
}

type CoverageForm = {
  classId: string;
  includeRsdCharge: string;
  suminsured: string;
  medicalSuminsured: string;
  totalSuminsured: string;
  effectiveDate: string;
  expiryDate: string;
};

type NomineeForm = {
  professionId: string;
  nomineeHonorId: string;
  nomineeName: string;
  nomineeRelation: string;
  fatherName: string;
  motherName: string;
};

const defaultNomineeForm: NomineeForm = {
  professionId: "1",
  nomineeHonorId: "Mr.",
  nomineeName: "",
  nomineeRelation: "",
  fatherName: "",
  motherName: "",
};

export default function AccidentsPersonalPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentStep = Number(searchParams.get("step")) || 2;
  const [directDiscount, setDirectDiscount] = useState(true);
  const savedCoverage = useMemo(
    () =>
      readStorage<CoverageForm | null>("accident.coverageForm", null),
    [],
  );

  const savedPremium = useMemo(
    () =>
      readStorage<PersonalAccidentPremiumResponse | null>(
        "accident.premiumResponse",
        null,
      ),
    [],
  );

  const savedNominee = useMemo(
    () => readStorage<NomineeForm>("accident.nomineeForm", defaultNomineeForm),
    [],
  );

  const [suminsured, setSuminsured] = useState(savedCoverage?.suminsured || "");
  const [medicalSuminsured, setMedicalSuminsured] = useState(
    savedCoverage?.medicalSuminsured || "",
  );
  const [includeRsdCharge, setIncludeRsdCharge] = useState(
    savedCoverage?.includeRsdCharge || "yes",
  );
  const [effectiveDate, setEffectiveDate] = useState(
    savedCoverage?.effectiveDate || todayISO(),
  );

  const [nomineeForm, setNomineeForm] = useState<NomineeForm>(savedNominee);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [inlineError, setInlineError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [successModal, setSuccessModal] = useState<{ policyNo?: string } | null>(null);
  const [premiumResponse, setPremiumResponse] =
    useState<PersonalAccidentPremiumResponse | null>(savedPremium);

  const totalSuminsured = useMemo(() => {
    const main = Number(suminsured || 0);
    const medical = Number(medicalSuminsured || 0);
    return String(main + medical);
  }, [suminsured, medicalSuminsured]);

  const expiryDate = useMemo(() => addOneYear(effectiveDate), [effectiveDate]);

  const goToStep = (step: number) => {
    setSearchParams({ step: String(step) });
  };

  const clearError = (key: string) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleNumberChange = (
    value: string,
    setter: React.Dispatch<React.SetStateAction<string>>,
    errorKey: string,
  ) => {
    const cleanValue = value.replace(/[^\d]/g, "");
    setter(cleanValue);
    clearError(errorKey);
  };

  const updateNominee = (key: keyof NomineeForm, value: string) => {
    setNomineeForm((prev) => ({ ...prev, [key]: value }));
    clearError(key);
  };

  const validateCoverage = () => {
    const newErrors: Record<string, string> = {};

    if (!suminsured.trim()) {
      newErrors.suminsured = "Sum insured is required";
    } else if (!/^\d+$/.test(suminsured) || Number(suminsured) <= 0) {
      newErrors.suminsured = "Enter valid sum insured";
    }

    if (!medicalSuminsured.trim()) {
      newErrors.medicalSuminsured = "Medical sum insured is required";
    } else if (!/^\d+$/.test(medicalSuminsured) || Number(medicalSuminsured) < 0) {
      newErrors.medicalSuminsured = "Enter valid medical sum insured";
    }

    if (!includeRsdCharge) newErrors.includeRsdCharge = "RSD charge option is required";
    if (!effectiveDate) newErrors.effectiveDate = "Effective date is required";

    return newErrors;
  };

  const validateNominee = () => {
    const newErrors: Record<string, string> = {};

    if (!nomineeForm.professionId) newErrors.professionId = "Profession is required";
    if (!nomineeForm.nomineeHonorId) newErrors.nomineeHonorId = "Honor title is required";
    if (!nomineeForm.nomineeName.trim()) newErrors.nomineeName = "Nominee name is required";
    if (!nomineeForm.nomineeRelation) newErrors.nomineeRelation = "Nominee relation is required";

    return newErrors;
  };

  const buildPremiumPayload = (): PersonalAccidentPremiumRequest => ({
    class_id: "18",
    include_rsd_charge: includeRsdCharge === "yes",
    suminsured,
    medical_suminsured: medicalSuminsured,
    total_suminsured: totalSuminsured,
    get_direct_discount: directDiscount ? "y" : "n",

  });

  const saveCoverageForm = () => {
    const coverageForm: CoverageForm = {
      classId: "18",
      includeRsdCharge,
      suminsured,
      medicalSuminsured,
      totalSuminsured,
      effectiveDate,
      expiryDate,
    };

    localStorage.setItem("accident.coverageForm", JSON.stringify(coverageForm));
    return coverageForm;
  };

  const handleCalculate = async () => {
    setInlineError("");

    const validationErrors = validateCoverage();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    const payload = buildPremiumPayload();

    try {
      setLoading(true);
      localStorage.setItem("accident.personalAccidentPayload", JSON.stringify(payload));

      const response = await getPersonalAccidentPremium(payload);
      const coverageForm = saveCoverageForm();

      localStorage.setItem("accident.premiumResponse", JSON.stringify(response));
      localStorage.setItem("accident.personalAccidentPremiumResponse", JSON.stringify(response));

      setPremiumResponse(response);
      toast.success("Premium calculated successfully");
      goToStep(3);
    } catch (error: any) {
      setInlineError(error?.message || "Failed to calculate personal accident premium");
    } finally {
      setLoading(false);
    }
  };

  const handleNomineeNext = () => {
    const validationErrors = validateNominee();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      toast.error("Please fix the highlighted fields");
      return;
    }

    localStorage.setItem("accident.nomineeForm", JSON.stringify(nomineeForm));
    goToStep(5);
  };

  const handleSubmit = async () => {
    const coverageForm = readStorage<CoverageForm | null>("accident.coverageForm", null);
    const nomineeData = readStorage<NomineeForm>("accident.nomineeForm", nomineeForm);
    const premiumData = premiumResponse || readStorage<PersonalAccidentPremiumResponse | null>("accident.premiumResponse", null);

    if (!coverageForm || !premiumData) {
      toast.error("Missing premium data. Please calculate premium again.");
      goToStep(2);
      return;
    }

    const policySessionId = premiumData?.policy_session_id || "";

    if (!policySessionId) {
      toast.error("policy_session_id missing. Please calculate premium again.");
      goToStep(2);
      return;
    }

    try {
      setSubmitLoading(true);

      const payload: CreatePersonalAccidentPolicyPayload = {
        client_info: {
          Bank_Code: "1",
        },
        policy_info: {
          department_id: "3",
          class_id: "18",
          payment_process: "Full Payment",
          effective_date: coverageForm.effectiveDate,
          expiry_date: coverageForm.expiryDate,
        },
        policy_session_id: policySessionId,
        class_info: {
          class_id: "18",
          profession_id: nomineeData.professionId || "1",
          suminsured: String(coverageForm.suminsured || "0"),
          medical_suminsured: String(coverageForm.medicalSuminsured || "0"),
          total_suminsured: String(coverageForm.totalSuminsured || "0"),
          nominee_honor_id: nomineeData.nomineeHonorId || "Mr.",
          nominee_name: nomineeData.nomineeName || "",
          nominee_relation: nomineeData.nomineeRelation || "",
          father_name: nomineeData.fatherName || "",
          mother_name: nomineeData.motherName || "",
        },
      };

      const response = await createPersonalAccidentPolicy(payload);
      const policyNo = response?.policy_no || response?.policy_number || response?.document_number || "";

      setSuccessModal({ policyNo });
    } catch (error: any) {
      toast.error(error?.message || "Failed to create personal accident policy");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleSuccessClose = () => {
    [
      "accident.coverageForm",
      "accident.premiumResponse",
      "accident.personalAccidentPayload",
      "accident.personalAccidentPremiumResponse",
      "accident.nomineeForm",
      "accident.selectedPlan",
      "accident.planId",
    ].forEach((key) => localStorage.removeItem(key));

    setSuccessModal(null);
    navigate("/my-draft-policy", { replace: true });
  };

  const fieldError = (key: string) =>
    errors[key] ? <p className="mt-1 text-xs text-red-600">{errors[key]}</p> : null;

  const amount = premiumResponse?.amount_info;

  return (
    <div className="min-h-screen">
      <Dialog open={!!successModal} onOpenChange={() => { }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-6 w-6" /> Policy Created!
            </DialogTitle>
          </DialogHeader>

          <div className="py-4 text-center">
            <p className="text-lg">Personal accident policy created successfully.</p>
            {successModal?.policyNo && (
              <p className="mt-2 font-bold">Policy Number: {successModal.policyNo}</p>
            )}
          </div>

          <DialogFooter>
            <Button onClick={handleSuccessClose} className="w-full">
              View My Policies
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="mx-auto max-w-6xl px-4 py-5 shadow-sm sm:px-5">
        <div className="mb-8 flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (currentStep <= 2) navigate("/accidents?step=1");
              else goToStep(currentStep - 1);
            }}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100"
          >
            <ChevronLeft className="h-5 w-5 text-black" />
          </button>

          <div>
            <h1 className="text-2xl font-bold text-black">Personal Accident Insurance</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Calculate premium, add nominee details, and submit policy.
            </p>
          </div>
        </div>

        {inlineError && (
          <div className="mb-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {inlineError}
          </div>
        )}

        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-5 w-5" /> Coverage Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 pt-0">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <Label htmlFor="suminsured">Sum Insured *</Label>
                  <Input
                    id="suminsured"
                    type="text"
                    inputMode="numeric"
                    value={suminsured}
                    placeholder="Enter sum insured"
                    onChange={(event) => handleNumberChange(event.target.value, setSuminsured, "suminsured")}
                    className={`mt-2 h-12 ${errors.suminsured ? "border-red-500" : ""}`}
                  />
                  {fieldError("suminsured")}
                </div>
                <div>
                  <Label htmlFor="effectiveDate">Effective Date *</Label>
                  <Input
                    id="effectiveDate"
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
                  <Input className="mt-2 h-12" value={expiryDate} readOnly />
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

              </div>

              <div className="flex justify-between pt-3">
                <Button type="button" variant="outline" className="gap-2" onClick={() => navigate("/accidents?step=1")}>
                  <ArrowLeft className="h-4 w-4" /> Back
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
        )}

        {currentStep === 3 && (
          <>
            <h2>Personal Accident Premium Details</h2>
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
                        <th className="border-r border-white px-4 py-3 text-left font-bold">Particulars</th>
                        <th className="px-4 py-3 text-right font-bold">Amount NPR</th>
                      </tr>
                    </thead>
                    <tbody>
                      <PremiumRow label="Sum Insured" value={amount.suminsured} />
                      <PremiumRow label="Premium Amount" value={amount.premium_amount} />
                      <PremiumRow label="RS/MD/ST" value={amount.pool_amount} />
                      <PremiumRow
                        label={`Direct Discount (${premiumResponse.direct_discount_percent}%)`}
                        value={premiumResponse.direct_discount_amount}
                        isLess
                      />
                      <PremiumRow label="Taxable Amount" value={amount.taxable_amount} />
                      <PremiumRow label={`VAT (${amount.vat_percent}%)`} value={amount.vat_amount} />
                      <PremiumRow label="Stamp Duty" value={amount.stamp_duty} />
                      <tr className="bg-[#b71319] text-white">
                        <td className="border-r border-white px-4 py-4 text-base font-bold">Total Premium With VAT</td>
                        <td className="px-4 py-4 text-right text-base font-bold">
                          NPR {formatAmount(premiumResponse.total_premium_with_vat)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="mt-8 flex justify-between">
                  <Button type="button" variant="outline" className="gap-2" onClick={() => goToStep(2)}>
                    <ArrowLeft className="h-4 w-4" /> Back
                  </Button>
                  <Button type="button" className="gap-2 bg-[#f71920] text-white hover:bg-[#d9151b]" onClick={() => goToStep(4)}>
                    Next <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </>
        )}

        {currentStep === 4 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <UserRound className="h-5 w-5" /> Nominee & Family Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <Label>Profession *</Label>
                  <Select value={nomineeForm.professionId} onValueChange={(value) => updateNominee("professionId", value)}>
                    <SelectTrigger className="mt-2 h-12">
                      <SelectValue placeholder="Select profession" />
                    </SelectTrigger>
                    <SelectContent>
                      {professionOptions.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldError("professionId")}
                </div>

                <div>
                  <Label>Nominee Honor *</Label>
                  <Select value={nomineeForm.nomineeHonorId} onValueChange={(value) => updateNominee("nomineeHonorId", value)}>
                    <SelectTrigger className="mt-2 h-12">
                      <SelectValue placeholder="Select honor" />
                    </SelectTrigger>
                    <SelectContent>
                      {honorOptions.map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldError("nomineeHonorId")}
                </div>

                <div>
                  <Label>Nominee Name *</Label>
                  <Input
                    className="mt-2 h-12"
                    value={nomineeForm.nomineeName}
                    onChange={(event) => updateNominee("nomineeName", event.target.value)}
                    placeholder="Enter nominee name"
                  />
                  {fieldError("nomineeName")}
                </div>

                <div>
                  <Label>Nominee Relation *</Label>
                  <Select value={nomineeForm.nomineeRelation} onValueChange={(value) => updateNominee("nomineeRelation", value)}>
                    <SelectTrigger className="mt-2 h-12">
                      <SelectValue placeholder="Select relation" />
                    </SelectTrigger>
                    <SelectContent>
                      {relationOptions.map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldError("nomineeRelation")}
                </div>

                <div>
                  <Label>Father Name</Label>
                  <Input
                    className="mt-2 h-12"
                    value={nomineeForm.fatherName}
                    onChange={(event) => updateNominee("fatherName", event.target.value)}
                    placeholder="Enter father name"
                  />
                </div>

                <div>
                  <Label>Mother Name</Label>
                  <Input
                    className="mt-2 h-12"
                    value={nomineeForm.motherName}
                    onChange={(event) => updateNominee("motherName", event.target.value)}
                    placeholder="Enter mother name"
                  />
                </div>
              </div>

              <div className="flex justify-between pt-3">
                <Button type="button" variant="outline" className="gap-2" onClick={() => goToStep(3)}>
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
                <Button type="button" className="gap-2 bg-[#f71920] text-white hover:bg-[#d9151b]" onClick={handleNomineeNext}>
                  Next <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 5 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle className="h-5 w-5" /> Review & Submit
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-5 md:grid-cols-2">
                <SummaryCard label="Sum Insured" value={`NPR ${formatAmount(suminsured || savedCoverage?.suminsured)}`} />
                <SummaryCard
                  label="Medical Sum Insured"
                  value={`NPR ${formatAmount(medicalSuminsured || savedCoverage?.medicalSuminsured)}`}
                />
                <SummaryCard label="Total Sum Insured" value={`NPR ${formatAmount(totalSuminsured || savedCoverage?.totalSuminsured)}`} />
                <SummaryCard label="Effective Date" value={effectiveDate || savedCoverage?.effectiveDate || "—"} />
                <SummaryCard label="Expiry Date" value={expiryDate || savedCoverage?.expiryDate || "—"} />
                <SummaryCard label="Nominee" value={`${nomineeForm.nomineeHonorId} ${nomineeForm.nomineeName}`.trim()} />
                <SummaryCard label="Nominee Relation" value={nomineeForm.nomineeRelation || "—"} />
                <SummaryCard label="Total Premium With VAT" value={`NPR ${formatAmount(premiumResponse?.total_premium_with_vat)}`} />
              </div>

              <div className="flex justify-between pt-3">
                <Button type="button" variant="outline" className="gap-2" onClick={() => goToStep(4)}>
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
                <Button
                  type="button"
                  size="lg"
                  disabled={submitLoading}
                  onClick={handleSubmit}
                  className="gap-2 bg-[#f71920] px-8 text-white hover:bg-[#d9151b]"
                >
                  {submitLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
                    </>
                  ) : (
                    <>
                      Submit Policy <CheckCircle className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
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
  value: number | string;
  isLess?: boolean;
  textOnly?: boolean;
}) {
  return (
    <tr className="border-b bg-[#fff7f3] last:border-b-0">
      <td className={`border-r border-white px-4 py-3 ${isLess ? "text-red-600" : "text-black"}`}>{label}</td>
      <td className={`px-4 py-3 text-right font-medium ${isLess ? "text-red-600" : "text-black"}`}>
        {textOnly ? value : `NPR ${formatAmount(value)}`}
      </td>
    </tr>
  );
}
