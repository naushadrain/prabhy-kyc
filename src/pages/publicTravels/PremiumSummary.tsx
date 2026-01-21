// ✅ PremiumSummary.tsx (UI-only, no form)
// Reads premium summary from localStorage: "travel.premiumSnapshot"

import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, LogIn, RefreshCcw } from "lucide-react";

import logo from "@/assets/logo.png";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type PremiumSnapshot = {
    currency?: string;
    rate?: number;
    currency_amount?: number;
    premium_in_npr?: number;
    currency_suminsured?: number;
    suminsured_in_npr?: number;
    vat_percent?: number;
    vat_amount?: number;
    stamp_duty?: number;
    total_premium_with_vat?: number;
    direct_discount_amount?: number;
    taxable_amount?: number;
};

function SummaryRow({ label, value }: { label: string; value: any }) {
    return (
        <div className="flex items-center justify-between gap-3 border-b py-2 last:border-b-0">
            <span className="text-sm text-muted-foreground">{label}</span>
            <span className="text-sm font-semibold">{String(value ?? "—")}</span>
        </div>
    );
}

function safeParse<T>(raw: string | null): T | null {
    if (!raw) return null;
    try {
        return JSON.parse(raw) as T;
    } catch {
        return null;
    }
}

export const PremiumSummary = () => {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [snapshot, setSnapshot] = useState<PremiumSnapshot | null>(null);
    const [error, setError] = useState<string>("");

    const formatted = useMemo(() => {
        if (!snapshot) return null;

        const n = (x: any) => {
            const v = Number(x);
            if (!Number.isFinite(v)) return "—";
            return v.toFixed(2);
        };

        return {
            currency: snapshot.currency ?? "—",
            rate: n(snapshot.rate),
            currencyPremium: n(snapshot.currency_amount),
            premiumNpr: n(snapshot.premium_in_npr),
            currencySuminsured: n(snapshot.currency_suminsured),
            suminsuredNpr: n(snapshot.suminsured_in_npr),
            vatPercent: n(snapshot.vat_percent),
            vatAmount: n(snapshot.vat_amount),
            stampDuty: n(snapshot.stamp_duty),
            totalWithVat: n(snapshot.total_premium_with_vat),
            discount: n(snapshot.direct_discount_amount),
            taxable: n(snapshot.taxable_amount),
        };
    }, [snapshot]);

    const reload = () => {
        setLoading(true);
        setError("");

        const data = safeParse<PremiumSnapshot>(localStorage.getItem("travel.premiumSnapshot"));

        if (!data) {
            setSnapshot(null);
            setError("Premium summary not found. Please go back and generate premium first.");
            setLoading(false);
            return;
        }

        setSnapshot(data);
        setLoading(false);
    };

    useEffect(() => {
        reload();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="min-h-screen bg-background">
            {/* ✅ Top Bar: Left Logo, Right Login Button */}
            <header className="border-b bg-white">
                <div className="mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src={logo} alt="Prabhu Insurance" className="h-10 w-auto" />
                    </div>

                    <div className="flex items-center gap-2">
                        <Link to="/login">
                            <Button className="gap-2">
                                <LogIn className="h-4 w-4" />
                                Login
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* ✅ Content */}
            <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center justify-between mb-6">
                    <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
                        <ChevronLeft className="h-4 w-4" />
                        Back
                    </Button>

                    <h1 className="text-xl sm:text-2xl font-bold">Premium Summary</h1>

                    <div className="w-[70px]" /> {/* spacer to balance header */}
                </div>

                {loading && (
                    <div className="text-sm text-muted-foreground">Loading premium summary...</div>
                )}

                {!loading && error && (
                    <Alert className="border-red-200 bg-red-50">
                        <AlertTitle className="text-red-700 font-semibold">Not available</AlertTitle>
                        <AlertDescription className="text-red-700">{error}</AlertDescription>
                    </Alert>
                )}

                {!loading && !error && formatted && (
                    <div className="grid gap-6">
                        <Card>
                            <CardContent className="space-y-1">
                                <SummaryRow label="Currency" value={formatted.currency} />
                                <SummaryRow label="Rate" value={formatted.rate} />
                                <SummaryRow label="Currency Premium" value={formatted.currencyPremium} />
                                <SummaryRow label="Premium (NPR)" value={formatted.premiumNpr} />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="space-y-1">
                                <SummaryRow label="Currency Sum Insured" value={formatted.currencySuminsured} />
                                <SummaryRow label="Sum Insured (NPR)" value={formatted.suminsuredNpr} />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="space-y-1">
                                <SummaryRow label="Discount" value={formatted.discount} />
                                <SummaryRow label="Taxable Amount" value={formatted.taxable} />
                                <SummaryRow label="VAT (%)" value={formatted.vatPercent} />
                                <SummaryRow label="VAT Amount" value={formatted.vatAmount} />
                                <SummaryRow label="Stamp Duty" value={formatted.stampDuty} />
                                <SummaryRow label="Total Premium (with VAT)" value={formatted.totalWithVat} />
                            </CardContent>
                        </Card>

                        <div className="flex justify-end gap-3">

                            <Button onClick={() => navigate("/")}>
                                Home
                            </Button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};
