import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { InsuranceCard } from '@/components/InsuranceCard';
import { useLanguage } from '@/contexts/LanguageContext';
import logo from '@/assets/logo.png';
import { useForm } from 'react-hook-form';
import { sendOneTimeOtp } from "@/api/otpClient";

type RegisterFormValues = {
  mobile: string;
  userType: 'customer' | 'staff' | 'corporate' | 'surveyor';
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
    defaultValues: {
      mobile: "",
      userType: "customer",
    },
  });

  const [loading, setLoading] = useState(false);
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [serverIsError, setServerIsError] = useState<boolean | null>(false);

  const onSubmit = async (values: RegisterFormValues) => {
    setServerMessage(null);
    setServerIsError(false);
    setLoading(true);

    try {
      // Call OTP API with mobile
      const data = await sendOneTimeOtp(values.mobile);

      // Treat as success if process_id exists
      if (data?.process_id) {
        localStorage.setItem("otp_process_id", data.process_id);
        localStorage.setItem("otp_mobile", values.mobile); // optional for later

        setServerMessage(t('auth.otpSent') ?? "OTP sent successfully. Redirecting...");
        setServerIsError(false);

        navigate("/otp-validate");
      } else {
        const err = data?.error_list?.[0];
        if (err) {
          setServerMessage(`${err.error_message} (Code: ${err.error_code})`);
        } else {
          setServerMessage("Failed to send OTP. Please try again.");
        }
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
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Insurance Cards */}
      <div className="flex-1 p-16 flex flex-col justify-center">
        <div className="grid grid-cols-3 gap-6 max-w-4xl">
          <InsuranceCard
            type="motor"
            title={t('insurance.motor')}
            subtitle={t('insurance.vehicle')}
          />
          <InsuranceCard
            type="travel"
            title={t('insurance.travel')}
            subtitle={t('insurance.travelIns')}
          />
          <InsuranceCard
            type="home"
            title={t('insurance.home')}
            subtitle={t('insurance.homeIns')}
          />
        </div>
      </div>

      {/* Right Side - Register / Send OTP Form */}
      <div className="w-[500px] bg-card p-12 flex flex-col">
        <div className="mb-12">
          <img
            src={logo}
            alt="Prabhu Insurance"
            className="h-16 mb-2"
          />
        </div>

        <h1 className="text-3xl font-bold mb-8 text-center">
          {t('auth.signUp')}
        </h1>

        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <Label className="text-sm text-muted-foreground mb-3 block">
              {t('auth.userType')}
            </Label>
            <RadioGroup
              defaultValue="customer"
              className="grid grid-cols-2 gap-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="customer" id="customer" />
                <Label htmlFor="customer">{t('auth.customer')}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="staff" id="staff" />
                <Label htmlFor="staff">{t('auth.staff')}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="corporate" id="corporate" />
                <Label htmlFor="corporate">{t('auth.corporate')}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="surveyor" id="surveyor" />
                <Label htmlFor="surveyor">{t('auth.surveyor')}</Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Input
              placeholder={t('auth.mobileNo')}
              {...register("mobile", {
                required: t('auth.mobileRequired') ?? "Mobile number is required",
                pattern: {
                  value: /^[0-9]{10}$/,
                  message:
                    t('auth.mobileInvalid') ??
                    "Enter a valid 10-digit mobile number",
                },
              })}
            />
            {errors.mobile && (
              <p className="text-sm text-red-500 mt-1">
                {errors.mobile.message}
              </p>
            )}

            {serverMessage && (
              <p
                className={`text-center text-sm mt-2 ${serverIsError ? "text-red-500" : "text-green-600"
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
            disabled={loading}
          >
            {loading ? t('common.loading') : t('common.submit')}
          </Button>

          <p className="text-center text-sm">
            {t('auth.alreadyHaveAccount')}{' '}
            <Link to="/login" className="text-primary hover:underline">
              {t('auth.signInHere')}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};
