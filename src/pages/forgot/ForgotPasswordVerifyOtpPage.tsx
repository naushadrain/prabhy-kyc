// src/pages/ForgotPasswordVerifyOtpPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import logo from "@/assets/logo.png";
import { ArrowLeft, ShieldCheck } from "lucide-react";

import { sendForgotPasswordOtp, validateForgotPasswordOtp } from "@/api/forgot/forgotPasswordClient";

const otpSchema = z.object({
  otp: z
    .string()
    .trim()
    .min(4, "OTP is required")
    .max(6, "OTP must be 4–6 digits")
    .regex(/^[0-9]+$/, "OTP must be numeric"),
});

type OtpValues = z.infer<typeof otpSchema>;

export default function ForgotPasswordVerifyOtpPage() {
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);

  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [serverIsError, setServerIsError] = useState(false);

  // resend timer
  const [secondsLeft, setSecondsLeft] = useState(0);

  const fpMobile = useMemo(() => localStorage.getItem("fp_mobile") || "", []);
  const fpProcessId = useMemo(() => localStorage.getItem("fp_process_id") || "", []);

  // If user opens verify page without process_id/mobile => send back
  useEffect(() => {
    if (!fpMobile || !fpProcessId) {
      navigate("/forgot-password", { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // countdown logic
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [secondsLeft]);

  const maskedMobile = useMemo(() => {
    if (!fpMobile) return "";
    return fpMobile.slice(0, 2) + "******" + fpMobile.slice(-2);
  }, [fpMobile]);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
  } = useForm<OtpValues>({
    resolver: zodResolver(otpSchema),
    mode: "onChange",
    defaultValues: { otp: "" },
  });

  const onVerify = async (values: OtpValues) => {
    setVerifying(true);
    setServerMessage(null);
    setServerIsError(false);

    try {
      await validateForgotPasswordOtp(values.otp);

      setServerMessage("OTP verified successfully.");
      setServerIsError(false);

      // ✅ Next step route (you can change to your actual reset password route)
      navigate("/reset-password", { replace: true });
    } catch (err: any) {
      setServerMessage(err?.message || "OTP verification failed.");
      setServerIsError(true);
    } finally {
      setVerifying(false);
    }
  };

  const onResend = async () => {
    if (!fpMobile) return;

    setResending(true);
    setServerMessage(null);
    setServerIsError(false);

    try {
      const data = await sendForgotPasswordOtp(fpMobile);

      if (data?.process_id) {
        setServerMessage("OTP resent successfully.");
        setServerIsError(false);

        // restart timer (example 60s)
        setSecondsLeft(60);

        // clear otp input
        setValue("otp", "", { shouldValidate: true });
        return;
      }

      setServerMessage("Resent OTP but process id missing. Try again.");
      setServerIsError(true);
    } catch (err: any) {
      setServerMessage(err?.message || "Failed to resend OTP.");
      setServerIsError(true);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-stretch">
      {/* Left side */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-16 bg-muted/30">
        <div className="max-w-md">
          <img src={logo} alt="Logo" className="h-16 mb-6" />
          <h2 className="text-3xl font-bold leading-tight">Verify OTP</h2>
          <p className="text-muted-foreground mt-3">
            We sent an OTP to <span className="font-medium text-foreground">{maskedMobile}</span>. Enter it to continue.
          </p>

          <div className="mt-8 rounded-2xl border bg-background p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Safe & secure</p>
                <p className="text-sm text-muted-foreground">
                  OTP verification confirms it’s really you.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side */}
      <div className="w-full lg:w-[520px] bg-card p-8 sm:p-12 flex flex-col justify-center">
        <div className="flex items-center justify-between mb-10">
          <Link
            to="/forgot-password"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>

          <div className="lg:hidden">
            <img src={logo} alt="Logo" className="h-10" />
          </div>
        </div>

        <h1 className="text-3xl font-bold">OTP Verification</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Enter the OTP sent to <span className="font-medium text-foreground">{maskedMobile}</span>.
        </p>

        <form onSubmit={handleSubmit(onVerify)} className="mt-8 space-y-5">
          <div>
            <Label htmlFor="otp">OTP</Label>
            <Input
              id="otp"
              placeholder="Enter OTP"
              inputMode="numeric"
              autoComplete="one-time-code"
              className="mt-2 tracking-widest"
              {...register("otp")}
              onInput={(e) => {
                const target = e.target as HTMLInputElement;
                target.value = target.value.replace(/\D/g, "").slice(0, 6);
              }}
            />
            {errors.otp && <p className="text-xs text-red-500 mt-1">{errors.otp.message}</p>}
          </div>

          {serverMessage && (
            <div
              className={`rounded-lg border p-3 text-sm ${
                serverIsError
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-green-200 bg-green-50 text-green-700"
              }`}
            >
              {serverMessage}
            </div>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={!isValid || verifying}>
            {verifying ? "Verifying..." : "Verify OTP"}
          </Button>

          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={onResend}
              disabled={resending || secondsLeft > 0}
            >
              {secondsLeft > 0 ? `Resend in ${secondsLeft}s` : resending ? "Resending..." : "Resend OTP"}
            </Button>

            <Link to="/login" className="text-sm text-primary hover:underline whitespace-nowrap">
              Back to login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
