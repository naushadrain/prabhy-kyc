// src/pages/RegisterPage.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerCustomer } from "@/api/auth/register/registerClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InsuranceCard } from "@/components/InsuranceCard";
import { useLanguage } from "@/contexts/LanguageContext";
import logo from "@/assets/logo.png";
import { z } from "zod";
import { User, Lock, ArrowLeft, ShieldCheck, Eye, EyeOff } from "lucide-react";

const registerSchema = z.object({
  firstName: z.string().trim().min(3, "First name must be at least 3 characters"),
  lastName: z.string().trim().min(3, "Last name must be at least 3 characters"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(12, "Password must be at most 12 characters")
    
});

export default function RegisterPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [form, setForm] = useState({ firstName: "", lastName: "", password: "" });
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const [showPwd, setShowPwd] = useState(false);

  const otpProcessId = useMemo(() => localStorage.getItem("otp_process_id") || "", []);

  useEffect(() => {
    if (!otpProcessId) navigate("/");
  }, [otpProcessId, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const pwdHints = useMemo(() => {
    const p = form.password || "";
    return {
      len: p.length >= 6 && p.length <= 12,
      upper: /[A-Z]/.test(p),
      num: /[0-9]/.test(p),
      sym: /[^A-Za-z0-9]/.test(p),
    };
  }, [form.password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");

    const result = registerSchema.safeParse(form);
    if (!result.success) {
      setError(result.error.issues[0]?.message || "Invalid form data");
      return;
    }

    const firstName = result.data.firstName.trim();
    const lastName = result.data.lastName.trim();
    const password = result.data.password;

    try {
      setLoading(true);

      await registerCustomer({ firstName, lastName, password });

      localStorage.setItem("customer_name", `${firstName} ${lastName}`);
      localStorage.setItem("party_type", "INDIVIDUAL");

      setInfo("Registration successful. Redirecting to dashboard...");
      navigate("/dashboard");
    } catch (err) {
      setError(err?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel (hidden on mobile) */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-12 bg-muted/30">
        <div className="w-full max-w-2xl">
          <img src={logo} alt="Prabhu Insurance" className="h-14 mb-8" />

          <h2 className="text-3xl font-bold leading-tight">
            Complete your registration
          </h2>
          <p className="text-muted-foreground mt-2">
            Your OTP has been verified. Please set your profile name and password to continue.
          </p>

          <div className="mt-8 rounded-2xl border bg-background p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Secure account setup</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Choose a strong password to protect your account.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel (form) */}
      <div className="w-full lg:w-[520px] bg-card p-6 sm:p-10 flex flex-col justify-center">
        {/* top bar */}
        <div className="flex items-center justify-between mb-8">
          <Link
            to="/register"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>

          <div className="lg:hidden">
            <img src={logo} alt="Prabhu Insurance" className="h-10" />
          </div>
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-bold">Customer Registration</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Enter your details to finish creating your account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* First name */}
          <div>
            <Label htmlFor="firstName">First name</Label>
            <div className="relative mt-2">
              <Input
                id="firstName"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                placeholder="Enter first name"
                className="pl-10"
                autoComplete="given-name"
              />
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          {/* Last name */}
          <div>
            <Label htmlFor="lastName">Last name</Label>
            <div className="relative mt-2">
              <Input
                id="lastName"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                placeholder="Enter last name"
                className="pl-10"
                autoComplete="family-name"
              />
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          {/* Password */}
          <div>
            <Label htmlFor="password">Password</Label>
            <div className="relative mt-2">
              <Input
                id="password"
                type={showPwd ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Create a strong password"
                className="pl-10 pr-12"
                autoComplete="new-password"
              />
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

              <button
                type="button"
                onClick={() => setShowPwd((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPwd ? "Hide password" : "Show password"}
              >
                {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

          </div>

          {/* Server messages */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {info && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              {info}
            </div>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? "Registering..." : "Create account"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
