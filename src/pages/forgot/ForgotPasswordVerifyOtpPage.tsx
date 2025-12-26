// src/pages/ForgotPasswordVerifyOtpPage.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import logo from "@/assets/logo.png";
import { ArrowLeft, ShieldCheck, Clock } from "lucide-react";

import OtpInput from "@/components/ui/OtpInput";
import {
  sendForgotPasswordOtp,
  validateForgotPasswordOtp,
} from "@/api/forgot/forgotPasswordClient";

const RESEND_SECONDS = 60;

const otpSchema = z.object({
  otp: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "OTP must be exactly 6 digits"),
});

type OtpValues = z.infer<typeof otpSchema>;

export default function ForgotPasswordVerifyOtpPage() {
  const navigate = useNavigate();

  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);

  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [serverIsError, setServerIsError] = useState(false);

  const [secondsLeft, setSecondsLeft] = useState<number>(RESEND_SECONDS);
  const tickRef = useRef<number | null>(null);

  const fpMobile = useMemo(() => localStorage.getItem("fp_mobile") || "", []);
  const fpProcessId = useMemo(() => localStorage.getItem("fp_process_id") || "", []);

  // If user opens verify page without process_id/mobile => send back
  useEffect(() => {
    if (!fpMobile || !fpProcessId) {
      navigate("/forgot-password", { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // countdown (safe single timer)
  useEffect(() => {
    if (secondsLeft <= 0) return;

    tickRef.current = window.setTimeout(() => {
      setSecondsLeft((s) => s - 1);
    }, 1000);

    return () => {
      if (tickRef.current) window.clearTimeout(tickRef.current);
    };
  }, [secondsLeft]);

  const maskedMobile = useMemo(() => {
    if (!fpMobile) return "";
    if (fpMobile.length < 4) return fpMobile;
    return fpMobile.slice(0, 2) + "******" + fpMobile.slice(-2);
  }, [fpMobile]);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    reset,
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

      setServerMessage("OTP verified successfully. Redirecting…");
      setServerIsError(false);

      // optional small delay so user sees message
      window.setTimeout(() => {
        navigate("/reset-password", { replace: true });
      }, 800);
    } catch (err: any) {
      setServerMessage(err?.message || "OTP verification failed.");
      setServerIsError(true);
    } finally {
      setVerifying(false);
    }
  };

  const canResend = secondsLeft <= 0 && !resending && !verifying;

  const onResend = async () => {
    if (!fpMobile) return;

    setResending(true);
    setServerMessage(null);
    setServerIsError(false);

    try {
      const data = await sendForgotPasswordOtp(fpMobile);

      if (data?.process_id) {
        // ✅ IMPORTANT: store the new process_id
        localStorage.setItem("fp_process_id", data.process_id);

        setServerMessage("A new OTP has been sent. Please check your SMS.");
        setServerIsError(false);

        setSecondsLeft(RESEND_SECONDS);
        reset({ otp: "" });
        return;
      }

      setServerMessage("OTP sent, but process id missing. Please try again.");
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
            We sent a 6-digit OTP to{" "}
            <span className="font-medium text-foreground">{maskedMobile}</span>.
            Enter it to continue.
          </p>

          <div className="mt-8 rounded-2xl border bg-background p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Safe & secure</p>
                <p className="text-sm text-muted-foreground mt-1">
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
          Enter the code sent to{" "}
          <span className="font-medium text-foreground">{maskedMobile}</span>.
        </p>

        <form onSubmit={handleSubmit(onVerify)} className="mt-8 space-y-5">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Enter OTP</Label>

            <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-4 w-4" />
              {secondsLeft <= 0 ? (
                <span>You can resend now</span>
              ) : (
                <span>Resend in 00:{String(secondsLeft).padStart(2, "0")}</span>
              )}
            </div>
          </div>

          {/* ✅ Proper RHF integration using Controller + 6-box OTP */}
            <Controller
              control={control}
              name="otp"
              render={({ field }) => (
                <OtpInput
                  length={6}
                  value={field.value}
                  autoFocus
                  onChange={(val: string) => {
                    const cleaned = String(val ?? "").replace(/\D/g, "").slice(0, 6);
                    field.onChange(cleaned);
                  }}
                />
              )}
            />
            {errors.otp?.message && (
              <p className="text-xs text-red-500 mt-2 text-center">{errors.otp.message}</p>
            )}

          {serverMessage && (
            <div
              className={`rounded-lg border p-3 text-sm text-center ${
                serverIsError
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-green-200 bg-green-50 text-green-700"
              }`}
            >
              {serverMessage}
            </div>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={!isValid || verifying || resending}>
            {verifying ? "Verifying..." : "Verify OTP"}
          </Button>

          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={onResend}
              disabled={!canResend}
            >
              {resending
                ? "Resending..."
                : canResend
                ? "Resend OTP"
                : `Resend OTP (00:${String(secondsLeft).padStart(2, "0")})`}
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
