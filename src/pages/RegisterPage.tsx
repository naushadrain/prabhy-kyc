// src/pages/RegisterPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerCustomer } from "../api/registerClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InsuranceCard } from "@/components/InsuranceCard";
import { useLanguage } from "@/contexts/LanguageContext";
import logo from "@/assets/logo.png";

export default function RegisterPage() {
    const { t } = useLanguage();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        password: "",
    });

    const [otpProcessId, setOtpProcessId] = useState("");
    const [error, setError] = useState("");
    const [info, setInfo] = useState("");
    const [loading, setLoading] = useState(false);

    // If user opens /client-register without OTP, send them back
    useEffect(() => {
        const storedOtpProcessId = localStorage.getItem("otp_process_id");

        if (!storedOtpProcessId) {
            navigate("/");
        } else {
            setOtpProcessId(storedOtpProcessId);
        }
    }, [navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setInfo("");

        const firstName = form.firstName.trim();
        const lastName = form.lastName.trim();

        if (!firstName || !lastName) {
            setError("First name and last name are required");
            return;
        }
        if (!form.password || form.password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        try {
            setLoading(true);

            await registerCustomer({
                firstName,
                lastName,
                password: form.password,
            });

            // ✅ Only after successful registration
            localStorage.setItem("customer_name", `${firstName} ${lastName}`);
            localStorage.setItem("party_type", "INDIVIDUAL");

            setInfo("Registration successful. Redirecting to dashboard...");
            navigate("/dashboard");
        } catch (err) {
            setError(err.message || "Registration failed");
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

            {/* Right Side - Registration Form */}
            <div className="w-[500px] bg-card p-12 flex flex-col">
                <div className="mb-8">
                    <img src={logo} alt="Prabhu Insurance" className="h-16 mb-2" />
                </div>

                <h1 className="text-3xl font-bold mb-4 text-center">
                    {t("auth.customerRegistration") || "Customer Registration"}
                </h1>

                {otpProcessId && (
                    <p className="text-xs text-muted-foreground mb-4 text-center">
                        OTP Process ID:{" "}
                        <span className="font-mono break-all">{otpProcessId}</span>
                    </p>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="firstName">
                            {t("auth.firstName") || "First Name"}
                        </Label>
                        <Input
                            id="firstName"
                            name="firstName"
                            value={form.firstName}
                            onChange={handleChange}
                            placeholder={t("auth.firstName") || "Enter first name"}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="lastName">
                            {t("auth.lastName") || "Last Name"}
                        </Label>
                        <Input
                            id="lastName"
                            name="lastName"
                            value={form.lastName}
                            onChange={handleChange}
                            placeholder={t("auth.lastName") || "Enter last name"}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">
                            {t("auth.password") || "Password"}
                        </Label>
                        <Input
                            id="password"
                            type="password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            placeholder={t("auth.passwordPlaceholder") || "Enter password"}
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-red-500 mt-1">
                            {error}
                        </p>
                    )}

                    {info && (
                        <p className="text-sm text-green-600 mt-1">
                            {info}
                        </p>
                    )}

                    <Button
                        type="submit"
                        className="w-full mt-2"
                        disabled={loading}
                    >
                        {loading
                            ? t("common.loading") || "Registering..."
                            : t("auth.register") || "Register"}
                    </Button>
                </form>
            </div>
        </div>
    );
}
