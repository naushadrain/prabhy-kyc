import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InsuranceCard } from '@/components/InsuranceCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { Eye, MessageSquare } from 'lucide-react';
import logo from '@/assets/logo.png';

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginCustomer } from "@/api/auth/login/loginClient";

export const Login = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm({
    mode: "onChange",
  });

  const [loading, setLoading] = useState(false);
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [serverIsError, setServerIsError] = useState(false);

  const onSubmit = async (values) => {
    setLoading(true);
    setServerMessage(null);
    setServerIsError(false);

    try {
      // 🔐 Call the login API (AES + signature like Postman)
      const data = await loginCustomer(values.mobile, values.password);

      // ✅ Store name and party type from API (fallbacks if missing)
      const customerName =
        data?.customer_name ||
        data?.full_name ||
        `${values.mobile}`; // fallback to mobile if nothing else
      const partyType =
        data?.party_type ||
        data?.Party_Type ||
        "INDIVIDUAL";

      localStorage.setItem("customer_name", customerName);
      localStorage.setItem("party_type", partyType);

      setServerMessage(t("auth.loginSuccess") || "Login successful.");
      setServerIsError(false);

      // redirect to dashboard on success
      navigate("/dashboard");
    } catch (err: any) {
      setServerIsError(true);
      setServerMessage(err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-background flex">

      {/* Left Side */}
      <div className="flex-1 p-16 flex flex-col justify-center">
        <div className="grid grid-cols-3 gap-6 max-w-4xl">
          <InsuranceCard type="motor" title={t('insurance.motor')} subtitle={t('insurance.vehicle')} />
          <InsuranceCard type="travel" title={t('insurance.travel')} subtitle={t('insurance.travelIns')} />
          <InsuranceCard type="home" title={t('insurance.home')} subtitle={t('insurance.homeIns')} />
        </div>
      </div>

      {/* Right Side */}
      <div className="w-[500px] bg-card p-12 flex flex-col">
        <div className="mb-12">
          <img src={logo} alt="Prabhu Insurance" className="h-16 mb-2" />
        </div>

        <h1 className="text-3xl font-bold mb-8 text-center">{t('auth.signIn')}</h1>

        {/* Form */}
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          {/* Mobile */}
          <div className="relative">
            <Input
              placeholder={t('auth.mobileNo')}
              className="pr-10"
              {...register("mobile")}
            />
            <MessageSquare className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

          </div>

          {/* Password */}
          <div className="relative">
            <Input
              type="password"
              placeholder={t('auth.password')}
              className="pr-10"
              {...register("password")}
            />
            <Eye className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

          </div>

          <div className="text-right">
            <Link to="/forgot-password" className="text-sm text-primary hover:underline">
              {t('auth.forgotPassword')}
            </Link>
          </div>

          <Button
            className="w-full"
            size="lg"
            type="submit"
            disabled={loading}
          >
            {loading ? "Loading..." : t('common.signIn')}
          </Button>

          {serverMessage && (
            <p
              className={`text-center text-sm mt-2 ${serverIsError ? "text-red-500" : "text-green-600"
                }`}
            >
              {serverMessage}
            </p>
          )}

          <p className="text-center text-sm">
            {t('auth.dontHaveAccount')}{" "}
            <Link to="/register" className="text-primary hover:underline">
              {t('common.signUp')}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};
