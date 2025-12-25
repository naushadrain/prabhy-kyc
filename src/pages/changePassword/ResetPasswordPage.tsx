// src/pages/ResetPasswordPage.tsx
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import logo from "@/assets/logo.png";
import { ArrowLeft, Eye, EyeOff, Lock, Phone } from "lucide-react";

// ✅ import your API function
import { resetPassword } from "@/api/forgot/forgotPasswordClient";

// ✅ Password rules:
// - 6 to 12 chars
// - at least 1 uppercase
// - at least 1 number
// - at least 1 symbol
const resetSchema = z
    .object({
        mobile: z
            .string()
            .trim()
            .min(1, "Mobile number is required")
            .regex(/^[0-9]{10}$/, "Enter a valid 10-digit mobile number"),
        newPassword: z
            .string()
            .min(6, "Password must be at least 6 characters")
            .max(12, "Password must be at most 12 characters")
            .regex(/[A-Z]/, "Password must include at least 1 uppercase letter")
            .regex(/[0-9]/, "Password must include at least 1 number")
            .regex(/[^A-Za-z0-9]/, "Password must include at least 1 symbol"),
        confirmPassword: z.string().min(1, "Please confirm your password"),
    })
    .refine((v) => v.newPassword === v.confirmPassword, {
        path: ["confirmPassword"],
        message: "Passwords do not match",
    });

type ResetValues = z.infer<typeof resetSchema>;

export default function ResetPasswordPage() {
    const navigate = useNavigate();

    // ✅ read saved mobile (support both keys)
    const storedMobile = useMemo(
        () =>
            localStorage.getItem("forgot_mobile") ||
            localStorage.getItem("fp_mobile") ||
            "",
        []
    );

    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        setError,
        formState: { errors, isValid, isSubmitting },
    } = useForm<ResetValues>({
        resolver: zodResolver(resetSchema),
        mode: "onChange",
        defaultValues: {
            mobile: storedMobile,
            newPassword: "",
            confirmPassword: "",
        },
    });

    // keep only digits in mobile (UI behavior)
    const onMobileInput = (e: React.FormEvent<HTMLInputElement>) => {
        const target = e.currentTarget;
        const cleaned = target.value.replace(/\D/g, "").slice(0, 10);
        target.value = cleaned;
        setValue("mobile", cleaned, { shouldValidate: true, shouldDirty: true });
    };

    const onSubmit = async (values: ResetValues) => {
        try {
            // optional safety: ensure user resets same mobile used in OTP request
            const savedMobile = localStorage.getItem("forgot_mobile");
            if (savedMobile && savedMobile !== values.mobile) {
                setError("mobile", {
                    type: "validate",
                    message: "Mobile number does not match OTP request.",
                });
                return;
            }

            // ✅ call API (uses otp_process_id from localStorage in your client)
            await resetPassword(values.newPassword);

            // ✅ cleanup (optional)
            localStorage.removeItem("otp_process_id");
            localStorage.removeItem("forgot_mobile_encrypt");

            // ✅ redirect
            navigate("/login", { replace: true });
        } catch (err: any) {
            const msg =
                err?.message ||
                "Failed to reset password. Please try again.";

            // show error under password field
            setError("newPassword", { type: "server", message: msg });
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-stretch">
            {/* Left side panel */}
            <div className="hidden lg:flex flex-1 items-center justify-center p-16 bg-muted/30">
                <div className="max-w-md">
                    <img src={logo} alt="Logo" className="h-16 mb-6" />
                    <h2 className="text-3xl font-bold leading-tight">
                        Set a new password
                    </h2>
                    <p className="text-muted-foreground mt-3">
                        Create a strong password to secure your account. Make sure your new
                        password is different from old passwords.
                    </p>

                    <div className="mt-8 space-y-4">
                        <div className="rounded-2xl border bg-background p-6 shadow-sm">
                            <div className="flex items-start gap-3">
                                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <Lock className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="font-semibold">Strong password tips</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        6–12 chars, 1 uppercase, 1 number, and 1 symbol.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border bg-background p-6 shadow-sm">
                            <p className="text-sm text-muted-foreground">
                                If you didn’t request a password reset, you can safely ignore
                                this.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right side form */}
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

                <h1 className="text-3xl font-bold">Reset password</h1>
                <p className="text-sm text-muted-foreground mt-2">
                    Enter your mobile number and choose a new password.
                </p>

                <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
                    {/* Mobile */}
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
                                onInput={onMobileInput}
                            />
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        </div>
                        {errors.mobile && (
                            <p className="text-xs text-red-500 mt-1">
                                {errors.mobile.message}
                            </p>
                        )}
                    </div>

                    {/* New password */}
                    <div>
                        <Label htmlFor="newPassword">New password</Label>
                        <div className="relative mt-2">
                            <Input
                                id="newPassword"
                                type={showNew ? "text" : "password"}
                                placeholder="Enter new password"
                                className="pl-10 pr-10"
                                {...register("newPassword")}
                            />
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <button
                                type="button"
                                onClick={() => setShowNew((s) => !s)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                aria-label={showNew ? "Hide password" : "Show password"}
                            >
                                {showNew ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </button>
                        </div>
                        {errors.newPassword && (
                            <p className="text-xs text-red-500 mt-1">
                                {errors.newPassword.message}
                            </p>
                        )}
                    </div>

                    {/* Confirm password */}
                    <div>
                        <Label htmlFor="confirmPassword">Confirm password</Label>
                        <div className="relative mt-2">
                            <Input
                                id="confirmPassword"
                                type={showConfirm ? "text" : "password"}
                                placeholder="Re-enter new password"
                                className="pl-10 pr-10"
                                {...register("confirmPassword")}
                            />
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <button
                                type="button"
                                onClick={() => setShowConfirm((s) => !s)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                aria-label={showConfirm ? "Hide password" : "Show password"}
                            >
                                {showConfirm ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </button>
                        </div>
                        {errors.confirmPassword && (
                            <p className="text-xs text-red-500 mt-1">
                                {errors.confirmPassword.message}
                            </p>
                        )}
                    </div>

                    <Button
                        type="submit"
                        className="w-full"
                        size="lg"
                        disabled={!isValid || isSubmitting}
                    >
                        {isSubmitting ? "Saving..." : "Save new password"}
                    </Button>

                    <p className="text-center text-sm text-muted-foreground">
                        Changed your mind?{" "}
                        <Link to="/login" className="text-primary hover:underline">
                            Sign in
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
}
