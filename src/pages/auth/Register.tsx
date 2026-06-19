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
    Zod schema validation
   ========================= */
const registerSchema = z.object({
  mobile: z
    .string()
    .trim()
    .min(1, "Mobile number is required")
    .regex(/^\d+$/, "Mobile number must contain digits only")
    .refine(
      (v) => v.startsWith("97") || v.startsWith("98"),
      "Mobile must start with 97 or 98"
    )
    .refine((v) => v.length === 10, "Mobile number must be exactly 10 digits"),

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
    defaultValues: {
      mobile: "",
      userType: "customer",
    },
  });

   const insurancePlans = [
    {
      id: "two-wheeler",
      title: "Two Wheeler",
      icon: "/motor.svg",
      route: "/motor/two-wheeler",
    },
    {
      id: "private",
      title: "Private Vehicle",
      icon: "/car-white.svg",
      route: "/motor/private-vehicle",
    },
    {
      id: "commercial",
      title: "Commercial Vehicle",
      icon: "/commercial.svg",
      route: "/motor/commercial-vehicle",
    },
    {
      id: "accident",
      title: " Accidental Insurance",
      icon: "/accident-white.svg",
      route: "/accident-insurance",
    },
    {
      id: "travel",
      title: "Travel Insurance",
      icon: "/travel-icon.svg",
      route: "/travel-coverage",
    },
    {
      id: "home",
      title: "House & Property Insurance",
      icon: "/Property-white.svg",
      route: "/home-insurance",
    },
     {
      id: "Burglary Housebreaking",
      title: "Burglary & Housebreaking Insurance",
      icon: "/burglary-housebreaking.svg",
      route: "/burglary-housebreaking",
    },
    {
      id: "cash",
      title: "Cash Insurance",
      icon: "/cash-insurance.svg",
      route: "/cash-insurance",
    },
    {
      id: "marine",
      title: "Marine Insurance",
      icon: "/marine-insurance.svg",
      route: "/marine-insurance",
    },
    {
      id: "agriculture",
      title: "Agriculture Insurance",
      icon: "/agriculture-insurance.svg",
      route: "/agriculture-insurance",
    }
  ];

  const handlePlanSelect = (planId: string, route: string) => {
    localStorage.setItem("motor.vehicleType", planId);
    navigate(route);
  };

  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [serverIsError, setServerIsError] = useState<boolean>(false);

  const onSubmit = async (values: RegisterFormValues) => {
    setServerMessage(null);
    setServerIsError(false);

    try {
      const data = await sendOneTimeOtp(values.mobile);

      if (data?.process_id) {
        localStorage.setItem("otp_process_id", data.process_id);
        localStorage.setItem("otp_mobile", values.mobile);

        setServerMessage(
          t("auth.otpSent") ?? "OTP sent successfully. Redirecting..."
        );
        setServerIsError(false);

        navigate("/otp-validate");
      } else {
        const err = data?.error_list?.[0];

        setServerMessage(
          err
            ? `${err.error_message} (Code: ${err.error_code})`
            : "Failed to send OTP. Please try again."
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
        {/* ================= LEFT SIDE INSURANCE CARDS ================= */}
        <div className="order-2 flex-1 bg-[#f7f7f7] px-4 pb-10 pt-6 sm:px-8 md:order-1 md:px-10 md:py-12 lg:px-16 lg:py-16">
          <div className="mx-auto w-full max-w-5xl">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {insurancePlans.map((plan) => (
                <InsuranceCard
                  key={plan.id}
                  icon={plan.icon}
                  title={plan.title}
                  onClick={() => handlePlanSelect(plan.id, plan.route)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ================= RIGHT SIDE REGISTER FORM ================= */}
        <div className="order-1 w-full bg-card px-4 py-8 sm:px-8 sm:py-10 md:order-2 md:w-[440px] md:border-l md:border-border lg:w-[500px]">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8 flex items-center justify-center md:justify-start">
              <img
                src={logo}
                alt="Prabhu Insurance"
                className="h-14 sm:h-16"
              />
            </div>

            <h1 className="mb-6 text-center text-2xl font-bold sm:mb-8 sm:text-3xl md:text-left">
              {t("auth.signUp")}
            </h1>

            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <Label className="mb-2 block text-sm text-muted-foreground">
                  {t("auth.mobileNo")}
                </Label>

                <Input
                  placeholder={t("auth.mobileNo")}
                  inputMode="numeric"
                  {...register("mobile", {
                    setValueAs: (v) => String(v ?? "").replace(/\D/g, ""),
                  })}
                  className={
                    errors.mobile
                      ? "border-red-500 focus-visible:ring-red-500"
                      : ""
                  }
                />

                {errors.mobile?.message && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.mobile.message}
                  </p>
                )}

                {serverMessage && (
                  <p
                    className={`mt-2 text-sm ${
                      serverIsError ? "text-red-500" : "text-green-600"
                    }`}
                  >
                    {serverMessage}
                  </p>
                )}
              </div>

              <Button
                className="w-full"
                size="lg"
                type="submit"
                disabled={!isValid || isSubmitting}
              >
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
      </div>
    </div>
  );
};