import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InsuranceCard } from "@/components/InsuranceCard";
import { useLanguage } from "@/contexts/LanguageContext";

import { Eye, MessageSquare, AlertCircle, CheckCircle2 } from "lucide-react";
import logo from "@/assets/logo.png";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Alert, AlertDescription } from "@/components/ui/alert";
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
    .refine((v) => v.startsWith("97") || v.startsWith("98"), "Mobile must start with 97 or 98")
    .refine((v) => v.length === 10, "Mobile number must be exactly 10 digits"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

type Notice = {
  type: "error" | "success";
  message: string;
};

export const Login = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const {
    register,
    formState: { errors, isValid, isSubmitting },
    handleSubmit,
    watch,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: { mobile: "", password: "" },
  });

  const [notice, setNotice] = useState<Notice | null>(null);
  const redirectTimerRef = useRef<number | null>(null);

  // ✅ Mobile insurance toggle
  const [showInsuranceOnMobile, setShowInsuranceOnMobile] = useState(false);

  const mobileWatch = watch("mobile");
  const passWatch = watch("password");
  useEffect(() => {
    if (notice) setNotice(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mobileWatch, passWatch]);

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) window.clearTimeout(redirectTimerRef.current);
    };
  }, []);

  const clientErrorMessage = errors.mobile?.message || errors.password?.message || null;

  const onSubmit = async (values: LoginFormValues) => {
    if (redirectTimerRef.current) {
      window.clearTimeout(redirectTimerRef.current);
      redirectTimerRef.current = null;
    }

    setNotice(null);

    try {
      const data = await loginCustomer(values.mobile, values.password);

      const customerName = data?.customer_name || data?.full_name || `${values.mobile}`;
      const partyType = data?.party_type || data?.Party_Type || "INDIVIDUAL";

      localStorage.setItem("customer_name", customerName);
      localStorage.setItem("party_type", partyType);

      setNotice({ type: "success", message: "Login successful." });

      redirectTimerRef.current = window.setTimeout(() => {
        navigate("/dashboard");
      }, 3000);
    } catch (err: any) {
      const apiMsg =
        err?.message ||
        err?.response?.data?.message ||
        "Login failed. Please try again.";

      setNotice({ type: "error", message: apiMsg });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen flex-col md:flex-row">
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


        {/* ================= RIGHT SIDE (LOGIN FORM) ================= */}
        <div className="order-1 md:order-2 w-full bg-card px-4 py-8 sm:px-8 sm:py-10 md:w-[440px] lg:w-[500px] md:border-l md:border-border">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-10 flex items-center justify-center md:justify-start">
              <img src={logo} alt="Prabhu Insurance" className="h-14 sm:h-16" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-center md:text-left">
              {t("auth.signIn")}
            </h1>

            {(clientErrorMessage || notice) && (
              <Alert
                className={`mb-4 ${notice?.type === "success"
                    ? "border-green-500/40 bg-green-500/10"
                    : "border-red-500/40 bg-red-500/10"
                  }`}
              >
                {notice?.type === "success" ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}

                <AlertDescription className="text-sm">
                  {notice?.message || clientErrorMessage}
                </AlertDescription>
              </Alert>
            )}

            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
              {/* Mobile */}
              <div className="relative">
                <Input
                  inputMode="numeric"
                  placeholder={t("auth.mobileNo")}
                  className={`pr-10 ${errors.mobile ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  {...register("mobile", {
                    setValueAs: (v) => String(v ?? "").replace(/\D/g, ""),
                  })}
                />
                <MessageSquare className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>

              {/* Password */}
              <div className="relative">
                <Input
                  type="password"
                  placeholder={t("auth.password")}
                  className={`pr-10 ${errors.password ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  {...register("password")}
                />
                <Eye className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>

              <div className="text-right">
                <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                  {t("auth.forgotPassword")}
                </Link>
              </div>

              <Button
                className="w-full"
                size="lg"
                type="submit"
                disabled={!isValid || isSubmitting || notice?.type === "success"}
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
