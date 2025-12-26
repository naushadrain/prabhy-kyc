import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InsuranceCard } from "@/components/InsuranceCard";
import { useLanguage } from "@/contexts/LanguageContext";
import logo from "@/assets/logo.png";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { sendOneTimeOtp } from "@/api/auth/login/otpClient";

/* =========================
   ✅ Zod schema validation
   ========================= */
const registerSchema = z.object({
  mobile: z
    .string()
    .trim()
    .min(1, "Mobile number is required")
    .regex(/^\d+$/, "Mobile number must contain digits only")
    .refine((v) => v.startsWith("97") || v.startsWith("98"), "Mobile must start with 97 or 98")
    .refine((v) => v.length === 10, "Mobile number must be exactly 10 digits"), // Access the underlying ZodString schema directly

  userType: z.enum(["customer", "staff", "corporate", "surveyor"]),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export const Register = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
    defaultValues: { mobile: "", userType: "customer" },
  });

  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [serverIsError, setServerIsError] = useState<boolean>(false);

  // Mobile toggle for left section
  const [showInsuranceOnMobile, setShowInsuranceOnMobile] = useState(false);
  const [insuranceIndex, setInsuranceIndex] = useState(0);

  const insuranceItems = [
    { type: "motor", title: t("insurance.motor"), subtitle: t("insurance.vehicle") },
    { type: "travel", title: t("insurance.travel"), subtitle: t("insurance.travelIns") },
    { type: "home", title: t("insurance.home"), subtitle: t("insurance.homeIns") },
  ] as const;

  const nextInsurance = () => setInsuranceIndex((i) => (i + 1) % insuranceItems.length);
  const prevInsurance = () =>
    setInsuranceIndex((i) => (i - 1 + insuranceItems.length) % insuranceItems.length);

  const onSubmit = async (values: RegisterFormValues) => {
    setServerMessage(null);
    setServerIsError(false);

    try {
      const data = await sendOneTimeOtp(values.mobile);

      if (data?.process_id) {
        localStorage.setItem("otp_process_id", data.process_id);
        localStorage.setItem("otp_mobile", values.mobile);

        setServerMessage(t("auth.otpSent") ?? "OTP sent successfully. Redirecting...");
        setServerIsError(false);

        navigate("/otp-validate");
      } else {
        const err = data?.error_list?.[0];
        setServerMessage(
          err ? `${err.error_message} (Code: ${err.error_code})` : "Failed to send OTP. Please try again."
        );
        setServerIsError(true);
      }
    } catch (err: any) {
      setServerMessage(err?.message || "Unexpected error while sending OTP.");
      setServerIsError(true);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen flex-col md:flex-row">
        {/* ================= RIGHT SIDE (FORM) ================= */}
        <div className="order-1 w-full bg-card px-4 py-8 sm:px-8 sm:py-10 md:order-2 md:w-[440px] lg:w-[500px] md:border-l md:border-border">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8 flex items-center justify-center md:justify-start">
              <img src={logo} alt="Prabhu Insurance" className="h-14 sm:h-16" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-center md:text-left">
              {t("auth.signUp")}
            </h1>

            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">
                  {t("auth.mobileNo")}
                </Label>

                <Input
                  placeholder={t("auth.mobileNo")}
                  inputMode="numeric"
                  {...register("mobile", {
                    // ✅ while typing: remove any non-digit characters
                    setValueAs: (v) => String(v ?? "").replace(/\D/g, ""),
                  })}
                  className={errors.mobile ? "border-red-500 focus-visible:ring-red-500" : ""}
                />

                {errors.mobile?.message && (
                  <p className="text-sm text-red-500 mt-1">{errors.mobile.message}</p>
                )}

                {serverMessage && (
                  <p className={`text-sm mt-2 ${serverIsError ? "text-red-500" : "text-green-600"}`}>
                    {serverMessage}
                  </p>
                )}
              </div>

              <Button className="w-full" size="lg" type="submit" disabled={!isValid || isSubmitting}>
                {isSubmitting ? "loading..." : "submit"}
              </Button>

              <p className="text-center text-sm">
                {t("auth.alreadyHaveAccount")}{" "}
                <Link to="/login" className="text-primary hover:underline">
                  {t("auth.signInHere")}
                </Link>
              </p>
            </form>
          </div>
        </div>

        {/* ================= LEFT SIDE (INSURANCE) ================= */}
        {/* ================= LEFT SIDE (INSURANCE) ================= */}
        <div className="order-2 md:order-1 flex-1 px-4 pb-10 pt-2 sm:px-8 md:px-10 md:py-12 lg:px-16 lg:py-16">
          <div className="mx-auto w-full max-w-5xl">
            {/* ✅ Mobile: show all cards one-by-one (single column) */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
              <InsuranceCard
                type="motor"
                title={t("insurance.motor")}
                subtitle={t("insurance.vehicle")}
              />
              <InsuranceCard
                type="travel"
                title={t("insurance.travel")}
                subtitle={t("insurance.travelIns")}
              />
              <InsuranceCard
                type="home"
                title={t("insurance.home")}
                subtitle={t("insurance.homeIns")}
              />
            </div>

            {/* ✅ md+ : normal grid */}
            <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-6">
              <InsuranceCard type="motor" title={t("insurance.motor")} subtitle={t("insurance.vehicle")} />
              <InsuranceCard type="travel" title={t("insurance.travel")} subtitle={t("insurance.travelIns")} />
              <InsuranceCard type="home" title={t("insurance.home")} subtitle={t("insurance.homeIns")} />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
