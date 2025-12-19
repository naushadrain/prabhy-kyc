//  OneTimeRegister.tsx (only the parts you need to change/add)
// - uses REAL resend API: sendOneTimeOtp(mobile)
// - stores new process_id into localStorage (important!)
// - handles missing mobile, loading state, errors, timer

import { useEffect, useMemo, useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import logo from "@/assets/logo.png";
import OtpInput from "@/components/ui/OtpInput";
import { ArrowLeft, Clock, MessageSquareText } from "lucide-react";

//  import both
import { validateOneTimeOtp, sendOneTimeOtp } from "@/api/auth/login/otpClient";

export const OneTimeRegister = () => {
  const navigate = useNavigate();

  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [loadingVerify, setLoadingVerify] = useState(false);
  const [loadingResend, setLoadingResend] = useState(false);

  const RESEND_SECONDS = 60;
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);

  const otpProcessId = useMemo(() => localStorage.getItem("otp_process_id"), []);
  const mobile = useMemo(() => localStorage.getItem("otp_mobile") || "", []);

  useEffect(() => {
    if (!otpProcessId) navigate("/register");
  }, [otpProcessId, navigate]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = window.setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [secondsLeft]);

  const canResend = secondsLeft <= 0 && !loadingResend;

  const validateOtpInput = (value: string) => {
    if (!value) return "Please enter the OTP.";
    if (!/^[0-9]{6}$/.test(value)) return "OTP must be 6 digits.";
    return "";
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    const vError = validateOtpInput(otp);
    if (vError) {
      setError(vError);
      return;
    }

    try {
      setLoadingVerify(true);
      await validateOneTimeOtp(otp);

      setInfo(" OTP verified successfully. Continuing…");
      navigate("/client-register");
    } catch (err: any) {
      setError(err?.message || "OTP verification failed. Please try again.");
    } finally {
      setLoadingVerify(false);
    }
  };

  //  REAL resend using API
  const handleResend = async () => {
    setError(null);
    setInfo(null);

    if (!mobile) {
      setError("Mobile number is missing. Please go back and try again.");
      return;
    }

    try {
      setLoadingResend(true);

      //  call API (it will create signature + Basic auth inside otpClient)
      const data = await sendOneTimeOtp(mobile);

      //  IMPORTANT: use returned process_id for next validation
      if (data?.process_id) {
        localStorage.setItem("otp_process_id", data.process_id);
      }

      setInfo(" A new OTP has been sent. Please check your phone.");
      setOtp("");
      setSecondsLeft(RESEND_SECONDS);
    } catch (err: any) {
      setError(err?.message || "Failed to resend OTP. Please try again.");
    } finally {
      setLoadingResend(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-stretch">
      {/* Left side panel */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-16 bg-muted/30">
        <div className="max-w-md">
          <img src={logo} alt="Prabhu Insurance" className="h-16 mb-6" />
          <h2 className="text-3xl font-bold leading-tight">Verify your mobile number</h2>
          <p className="text-muted-foreground mt-3">
            We sent a 6-digit OTP to your phone{mobile ? ` (${mobile})` : ""}. Please check your SMS and enter it below.
          </p>

          <div className="mt-8 rounded-2xl border bg-background p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <MessageSquareText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Didn’t receive OTP?</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Wait for the timer, then tap <span className="font-medium">Resend OTP</span>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side form */}
      <div className="w-full lg:w-[520px] bg-card p-8 sm:p-12 flex flex-col justify-center">
        <div className="flex items-center justify-between mb-10">
          <Link
            to="/register"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to register
          </Link>

          <div className="lg:hidden">
            <img src={logo} alt="Prabhu Insurance" className="h-10" />
          </div>
        </div>

        <h1 className="text-3xl font-bold">OTP verification</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Please check your phone and enter the 6-digit code.
        </p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
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

          <OtpInput length={6} value={otp} onChange={setOtp} autoFocus />

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 text-center">
              {error}
            </div>
          )}

          {info && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700 text-center">
              {info}
            </div>
          )}

          <Button className="w-full" size="lg" type="submit" disabled={loadingVerify || loadingResend}>
            {loadingVerify ? "Verifying..." : "Verify OTP"}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleResend}
            disabled={!canResend}
          >
            {loadingResend
              ? "Sending..."
              : canResend
                ? "Resend OTP"
                : `Resend OTP (00:${String(secondsLeft).padStart(2, "0")})`}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Entered wrong number?{" "}
            <Link to="/register" className="text-primary hover:underline">
              Change mobile
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};
