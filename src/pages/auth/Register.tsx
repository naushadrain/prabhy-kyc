import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InsuranceCard } from "@/components/InsuranceCard";
import { useLanguage } from "@/contexts/LanguageContext";
import logo from "@/assets/logo.png";
import { useForm } from "react-hook-form";
import { sendOneTimeOtp } from "@/api/auth/login/otpClient";

type RegisterFormValues = {
  mobile: string;
  userType: "customer" | "staff" | "corporate" | "surveyor";
};

export const Register = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    mode: "onChange",
    defaultValues: { mobile: "", userType: "customer" },
  });

  const [loading, setLoading] = useState(false);
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [serverIsError, setServerIsError] = useState<boolean | null>(false);

  //  Mobile toggle for left section
  const [showInsuranceOnMobile, setShowInsuranceOnMobile] = useState(false);
  //  add these states near top of component
  const [insuranceIndex, setInsuranceIndex] = useState(0);

  const insuranceItems = [
    { type: "motor", title: t("insurance.motor"), subtitle: t("insurance.vehicle") },
    { type: "travel", title: t("insurance.travel"), subtitle: t("insurance.travelIns") },
    { type: "home", title: t("insurance.home"), subtitle: t("insurance.homeIns") },
  ] as const;

  const nextInsurance = () =>
    setInsuranceIndex((i) => (i + 1) % insuranceItems.length);

  const prevInsurance = () =>
    setInsuranceIndex((i) => (i - 1 + insuranceItems.length) % insuranceItems.length);

  const onSubmit = async (values: RegisterFormValues) => {
    setServerMessage(null);
    setServerIsError(false);
    setLoading(true);

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
        setServerMessage(err ? `${err.error_message} (Code: ${err.error_code})` : "Failed to send OTP. Please try again.");
        setServerIsError(true);
      }
    } catch (err: any) {
      setServerMessage(err.message || "Unexpected error while sending OTP.");
      setServerIsError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen flex-col md:flex-row">
        {/* ================= RIGHT SIDE (FORM) - ALWAYS TOP ON MOBILE ================= */}
        <div className="order-1 w-full bg-card px-4 py-8 sm:px-8 sm:py-10 md:order-2 md:w-[440px] lg:w-[500px] md:border-l md:border-border">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8 flex items-center justify-center md:justify-start">
              <img src={logo} alt="Prabhu Insurance" className="h-14 sm:h-16" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-center md:text-left">
              {t("auth.signUp")}
            </h1>

            {/*  your same form here */}
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">
                  {t("auth.mobileNo")}
                </Label>

                <Input
                  placeholder={t("auth.mobileNo")}
                  inputMode="numeric"
                  {...register("mobile", {
                    required: t("auth.mobileRequired") ?? "Mobile number is required",
                    pattern: {
                      value: /^[0-9]{10}$/,
                      message: t("auth.mobileInvalid") ?? "Enter a valid 10-digit mobile number",
                    },
                  })}
                />

                {errors.mobile && (
                  <p className="text-sm text-red-500 mt-1">{errors.mobile.message}</p>
                )}

                {serverMessage && (
                  <p className={`text-sm mt-2 ${serverIsError ? "text-red-500" : "text-green-600"}`}>
                    {serverMessage}
                  </p>
                )}
              </div>

              <Button className="w-full" size="lg" type="submit" disabled={loading}>
                {loading ? t("common.loading") : t("common.submit")}
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
        <div className="order-2 flex-1 bg-background px-4 pb-10 pt-2 sm:px-8 md:order-1 md:px-10 md:py-12 lg:px-16 lg:py-16">
          <div className="mx-auto w-full max-w-5xl">
            {/*  Mobile: button + single-card carousel */}
            <div className="md:hidden">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setShowInsuranceOnMobile((v) => !v)}
              >
                {showInsuranceOnMobile ? "Hide Insurance Options" : "View Insurance Options"}
              </Button>

              {showInsuranceOnMobile && (
                <div className="mt-4 rounded-2xl border bg-card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <button
                      type="button"
                      onClick={prevInsurance}
                      className="rounded-lg border bg-white px-3 py-2 text-sm hover:bg-gray-50"
                    >
                      Prev
                    </button>

                    <div className="text-xs text-muted-foreground">
                      {insuranceIndex + 1} / {insuranceItems.length}
                    </div>

                    <button
                      type="button"
                      onClick={nextInsurance}
                      className="rounded-lg border bg-white px-3 py-2 text-sm hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>

                  <InsuranceCard
                    // @ts-ignore (if your InsuranceCard expects a union type)
                    type={insuranceItems[insuranceIndex].type}
                    title={insuranceItems[insuranceIndex].title}
                    subtitle={insuranceItems[insuranceIndex].subtitle}
                  />

                  {/* dots */}
                  <div className="mt-3 flex justify-center gap-2">
                    {insuranceItems.map((_, i) => (
                      <span
                        key={i}
                        className={`h-2 w-2 rounded-full ${i === insuranceIndex ? "bg-primary" : "bg-gray-300"
                          }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/*  md+ : normal grid always visible */}
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
