// src/pages/ForgotPasswordPage.tsx
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import logo from "@/assets/logo.png";
import { Phone, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { sendForgotPasswordOtp } from "@/api/forgot/forgotPasswordClient";

//  Zod validation (10-digit mobile)
const forgotSchema = z.object({
    mobile: z
        .string()
        .trim()
        .min(1, "Mobile number is required")
        .regex(/^[0-9]{10}$/, "Enter a valid 10-digit mobile number"),
});

type ForgotValues = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
    const navigate = useNavigate(); //  must be inside component
    const [loading, setLoading] = useState(false);
    const [serverMessage, setServerMessage] = useState<string | null>(null);
    const [serverIsError, setServerIsError] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isValid },
    } = useForm<ForgotValues>({
        resolver: zodResolver(forgotSchema),
        mode: "onChange",
        defaultValues: { mobile: "" },
    });

    const onSubmit = async (values: ForgotValues) => {
        setLoading(true);
        setServerMessage(null);
        setServerIsError(false);

        try {
            const data = await sendForgotPasswordOtp(values.mobile);

            //  success if process_id exists
            if (data?.process_id) {
                // store for verify page (recommended)
                localStorage.setItem("fp_mobile", values.mobile);
                localStorage.setItem("fp_process_id", data.process_id);

                setServerMessage("OTP sent successfully. Redirecting...");
                setServerIsError(false);

                //  redirect to /verify-otp
                navigate("/verify-otp", { replace: true });
                return;
            }

            setServerMessage("OTP sent but process id missing. Please try again.");
            setServerIsError(true);
        } catch (err: any) {
            setServerMessage(err?.message || "Failed to send OTP. Please try again.");
            setServerIsError(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-stretch">
            {/* Left side */}
            <div className="hidden lg:flex flex-1 items-center justify-center p-16 bg-muted/30">
                <div className="max-w-md">
                    <img src={logo} alt="Logo" className="h-16 mb-6" />
                    <h2 className="text-3xl font-bold leading-tight">Reset your password</h2>
                    <p className="text-muted-foreground mt-3">
                        Enter your registered mobile number and we’ll send you an OTP to reset your password.
                    </p>

                    <div className="mt-8 rounded-2xl border bg-background p-6 shadow-sm">
                        <div className="flex items-start gap-3">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Phone className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="font-semibold">Secure verification</p>
                                <p className="text-sm text-muted-foreground">
                                    OTP verification helps protect your account.
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
                        to="/login"
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to login
                    </Link>

                    <div className="lg:hidden">
                        <img src={logo} alt="Logo" className="h-10" />
                    </div>
                </div>

                <h1 className="text-3xl font-bold">Forgot password</h1>
                <p className="text-sm text-muted-foreground mt-2">
                    We’ll send an OTP to your mobile number.
                </p>

                <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
                    <div>
                        <Label htmlFor="mobile">Mobile number</Label>

                        <div className="relative mt-2">
                            <Input
                                id="mobile"
                                placeholder="98XXXXXXXX"
                                inputMode="numeric"
                                autoComplete="off"
                                className="pl-10"
                                {...register("mobile")}
                                onInput={(e) => {
                                    const target = e.target as HTMLInputElement;
                                    target.value = target.value.replace(/\D/g, "").slice(0, 10);
                                }}
                            />
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        </div>

                        {errors.mobile && (
                            <p className="text-xs text-red-500 mt-1">{errors.mobile.message}</p>
                        )}
                    </div>

                    {serverMessage && (
                        <div
                            className={`rounded-lg border p-3 text-sm ${serverIsError
                                    ? "border-red-200 bg-red-50 text-red-700"
                                    : "border-green-200 bg-green-50 text-green-700"
                                }`}
                        >
                            {serverMessage}
                        </div>
                    )}

                    <Button type="submit" className="w-full" size="lg" disabled={!isValid || loading}>
                        {loading ? "Sending..." : "Send OTP"}
                    </Button>

                    <p className="text-center text-sm text-muted-foreground">
                        Remembered your password?{" "}
                        <Link to="/login" className="text-primary hover:underline">
                            Sign in
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
}
