import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InsuranceCard } from "@/components/InsuranceCard";
import { useLanguage } from "@/contexts/LanguageContext";

import { Eye, EyeOff, MessageSquare } from "lucide-react";
import logo from "@/assets/logo.png";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { toast } from "@/components/ui/sonner";
import { loginCustomer } from "@/api/auth/login/loginClient";

/* =========================
    Zod schema validation
   ========================= */
const loginSchema = z.object({
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

  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const Login = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const {
    register,
    formState: { errors, isValid, isSubmitting },
    handleSubmit,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: {
      mobile: "",
      password: "",
    },
  });

  const [loginSuccess, setLoginSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const redirectTimerRef = useRef<number | null>(null);

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
  ];

  const handlePlanSelect = (planId: string, route: string) => {
    localStorage.setItem("motor.vehicleType", planId);
    navigate(route);
  };

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        window.clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  const onSubmit = async (values: LoginFormValues) => {
    if (redirectTimerRef.current) {
      window.clearTimeout(redirectTimerRef.current);
      redirectTimerRef.current = null;
    }

    try {
      const data = await loginCustomer(values.mobile, values.password);

      const customerName =
        data?.customer_name || data?.full_name || `${values.mobile}`;

      const partyType = data?.party_type || data?.Party_Type || "INDIVIDUAL";

      localStorage.setItem("customer_name", customerName);
      localStorage.setItem("party_type", partyType);

      toast.success("Login successful!", {
        description: `Welcome back, ${customerName}`,
      });

      setLoginSuccess(true);

      redirectTimerRef.current = window.setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
    } catch (err: any) {
      const apiMsg =
        err?.message ||
        err?.response?.data?.message ||
        "Login failed. Please try again.";

      toast.error("Login failed", {
        description: apiMsg,
      });
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

        {/* ================= RIGHT SIDE LOGIN FORM ================= */}
        <div className="order-1 w-full bg-card px-4 py-8 sm:px-8 sm:py-10 md:order-2 md:w-[440px] md:border-l md:border-border lg:w-[500px]">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-10 flex items-center justify-center md:justify-start">
              <img
                src={logo}
                alt="Prabhu Insurance"
                className="h-14 sm:h-16"
              />
            </div>

            <h1 className="mb-6 text-center text-2xl font-bold sm:text-3xl md:text-left">
              {t("auth.signIn")}
            </h1>

            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
              {/* Mobile number */}
              <div className="relative">
                <Input
                  inputMode="numeric"
                  placeholder={t("auth.mobileNo")}
                  className={`pr-10 ${
                    errors.mobile
                      ? "border-red-500 focus-visible:ring-red-500"
                      : ""
                  }`}
                  {...register("mobile", {
                    setValueAs: (v) => String(v ?? "").replace(/\D/g, ""),
                  })}
                />

                <MessageSquare className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>

              {errors.mobile && (
                <p className="text-sm text-red-500">
                  {errors.mobile.message}
                </p>
              )}

              {/* Password */}
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder={t("auth.password")}
                  className={`pr-10 ${
                    errors.password
                      ? "border-red-500 focus-visible:ring-red-500"
                      : ""
                  }`}
                  {...register("password")}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              {errors.password && (
                <p className="text-sm text-red-500">
                  {errors.password.message}
                </p>
              )}

              <div className="text-right">
                <Link
                  to="/forgot-password"
                  className="text-sm text-primary hover:underline"
                >
                  {t("auth.forgotPassword")}
                </Link>
              </div>

              <Button
                className="w-full"
                size="lg"
                type="submit"
                disabled={!isValid || isSubmitting || loginSuccess}
              >
                {isSubmitting ? "Loading..." : t("common.signIn")}
              </Button>

              <p className="text-center text-sm">
                {t("auth.dontHaveAccount")}{" "}
                <Link to="/register" className="text-primary hover:underline">
                  {t("common.signUp")}
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};