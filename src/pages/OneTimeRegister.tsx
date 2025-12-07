import { useEffect, useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { InsuranceCard } from "@/components/InsuranceCard";
import { useLanguage } from "@/contexts/LanguageContext";
import logo from "@/assets/logo.png";
import OtpInput from "@/components/ui/OtpInput";
import { validateOneTimeOtp } from "@/api/otpClient";

export const OneTimeRegister = () => {
  const { t } = useLanguage();
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const otpProcessId = localStorage.getItem("otp_process_id");

  // If user comes here without OTP process id, send back to register
  useEffect(() => {
    if (!otpProcessId) {
      navigate("/register");
    }
  }, [otpProcessId, navigate]);

  const validateOtpInput = (value: string) => {
    if (!value) return "OTP is required";
    if (!/^[0-9]{6}$/.test(value)) return "Enter a valid 6-digit OTP";
    return "";
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setInfo("");

    const vError = validateOtpInput(otp);
    if (vError) {
      setError(vError);
      return;
    }

    try {
      setLoading(true);
      await validateOneTimeOtp(otp);

      // If validateOneTimeOtp does not throw → success
      setInfo("OTP verified successfully. Redirecting...");
      navigate("/client-register");
    } catch (err: any) {
      setError(err.message || "Failed to validate OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Insurance Cards */}
      <div className="flex-1 p-16 flex flex-col justify-center">
        <div className="grid grid-cols-3 gap-6 max-w-4xl">
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
      </div>

      {/* Right Side - OTP Verification */}
      <div className="w-[500px] bg-card p-12 flex flex-col">
        <div className="mb-12">
          <img src={logo} alt="Prabhu Insurance" className="h-16 mb-2" />
        </div>

        <h1 className="text-3xl font-bold mb-8 text-center">
          Otp Verification
        </h1>

        <div className="space-y-6">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <OtpInput
              length={6}
              value={otp}
              onChange={setOtp}
              autoFocus
            />

            {error && (
              <p className="text-sm text-red-500 mt-2 text-center">
                {error}
              </p>
            )}

            {info && (
              <p className="text-sm text-green-600 mt-2 text-center">
                {info}
              </p>
            )}

            <Button
              className="w-full"
              size="lg"
              type="submit"
              disabled={loading}
            >
              {loading ? t("common.loading") : t("common.submit")}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
