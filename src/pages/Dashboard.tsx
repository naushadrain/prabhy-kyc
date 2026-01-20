// ✅ src/pages/Dashboard.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { InsuranceCard } from "@/components/InsuranceCard";
import { useLanguage } from "@/contexts/LanguageContext";

import { AlertCircle, CheckCircle2, XCircle, Info, ShieldAlert } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { kycStatus } from "@/api/kyc/kycStatus";
import { KycNotes } from "@/api/kyc/kycNotes";

type KycStatusResponse = {
  kyc_Status?: string; // Pending | Verified | Rejected ...
  process_result?: boolean;
  [key: string]: any;
};

type KycNotesResponse = {
  note_Type?: string;
  comments?: string;
  date_Posted?: string;
  [key: string]: any;
};

export const Dashboard = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  // sidebar open state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // modal state
  const [kycModalOpen, setKycModalOpen] = useState(false);
  const [kycModalMsg, setKycModalMsg] = useState("");
  const [pendingRoute, setPendingRoute] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [kycData, setKycData] = useState<KycStatusResponse | null>(null);
  const [kycNotes, setKycNotes] = useState<KycNotesResponse[]>([]);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setError("");

        const [statusRes, notesRes] = await Promise.allSettled([kycStatus(), KycNotes()]);
        if (!mounted) return;

        if (statusRes.status === "fulfilled") {
          const data: KycStatusResponse =
            (statusRes.value as any)?.data ?? (statusRes.value as any);
          setKycData(data);
        }

        if (notesRes.status === "fulfilled") {
          const notes: KycNotesResponse[] =
            (notesRes.value as any)?.data ?? (notesRes.value as any) ?? [];
          setKycNotes(Array.isArray(notes) ? notes : []);
        }
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || "Failed to load KYC info");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // -----------------------------
  // normalize status
  const statusRaw = kycData?.kyc_Status ?? "Unknown";
  const status = String(statusRaw).trim().toLowerCase();

  const isVerified = status === "verified" || status === "approved";
  const isRejected = status === "rejected" || status === "failed";
  const isPending =
    status === "pending" ||
    status === "under review" ||
    status === "in review" ||
    status === "processing" ||
    status === "submitted";

  // latest note
  const latestNoteWithMessage = useMemo(() => {
    const withComments = (kycNotes || [])
      .filter((n) => String(n?.comments ?? "").trim().length > 0)
      .sort((a, b) => {
        const da = Date.parse(a?.date_Posted ?? "") || 0;
        const db = Date.parse(b?.date_Posted ?? "") || 0;
        return db - da;
      });

    return withComments[0] ?? null;
  }, [kycNotes]);

  const noteMessage = String(latestNoteWithMessage?.comments ?? "").trim();
  const noteType = String(latestNoteWithMessage?.note_Type ?? "").trim().toLowerCase();

  // -----------------------------
  // alert styles + mapping
  const stylesFor = (variant: "success" | "warning" | "danger" | "info") => {
    return variant === "success"
      ? { alert: "mb-6 bg-emerald-50 border-emerald-200", text: "text-emerald-700" }
      : variant === "danger"
      ? { alert: "mb-6 bg-destructive/10 border-destructive", text: "text-destructive" }
      : variant === "warning"
      ? { alert: "mb-6 bg-amber-50 border-amber-200", text: "text-amber-700" }
      : { alert: "mb-6 bg-muted/50 border-muted", text: "text-foreground/80" };
  };

  const statusUi = useMemo(() => {
    let variant: "success" | "warning" | "danger" | "info" = "info";
    let message = "KYC status is not available right now...";
    let Icon = Info;

    if (isVerified) {
      variant = "success";
      message = "Your KYC is verified. You can proceed with all services...";
      Icon = CheckCircle2;
    } else if (isRejected) {
      variant = "danger";
      message = "Your KYC was rejected. Please re-submit your documents...";
      Icon = XCircle;
    } else if (isPending) {
      variant = "warning";
      message = "Your KYC information has been submitted and is under review...";
      Icon = AlertCircle;
    }

    return { variant, message, Icon, styles: stylesFor(variant) };
  }, [isVerified, isRejected, isPending]);

  const notesUi = useMemo(() => {
    let variant: "success" | "warning" | "danger" | "info" = "info";
    let Icon = Info;

    if (noteType.includes("verified") || noteType.includes("approved") || noteType.includes("success")) {
      variant = "success";
      Icon = CheckCircle2;
    } else if (noteType.includes("reject") || noteType.includes("fail") || noteType.includes("error")) {
      variant = "danger";
      Icon = XCircle;
    } else if (noteType.includes("pending") || noteType.includes("review") || noteType.includes("process")) {
      variant = "warning";
      Icon = AlertCircle;
    }

    if (variant === "info") {
      variant = statusUi.variant;
      Icon = statusUi.Icon;
    }

    return { variant, message: noteMessage, Icon, styles: stylesFor(variant) };
  }, [noteType, noteMessage, statusUi.variant, statusUi.Icon]);

  const ui = noteMessage ? notesUi : statusUi;

  const statusLabel = statusRaw && statusRaw !== "Unknown" ? String(statusRaw) : "Unknown";

  // -----------------------------
  // ✅ Card click guard
  function guardKycThenNavigate(to: string) {
    // if KYC not loaded yet
    if (loading) {
      setKycModalMsg("Please wait… KYC status is loading.");
      setPendingRoute(to);
      setKycModalOpen(true);
      return;
    }

    // if API error
    if (error) {
      setKycModalMsg("KYC status could not be loaded. Please try again later.");
      setPendingRoute(null);
      setKycModalOpen(true);
      return;
    }

    // allow only verified
    if (!isVerified) {
      const msg = isRejected
        ? "Your KYC is rejected. Please re-submit your KYC first to access all features."
        : "Please wait. Your KYC must be verified first to access all features.";

      // show note message if available
      const finalMsg = noteMessage ? `${msg}\n\nNote: ${noteMessage}` : msg;

      setKycModalMsg(finalMsg);
      setPendingRoute(to);
      setKycModalOpen(true);
      return;
    }

    // verified -> go
    navigate(to);
  }

  function closeModal() {
    setKycModalOpen(false);
    setPendingRoute(null);
  }

  function goToKyc() {
    setKycModalOpen(false);
    setPendingRoute(null);
    // if rejected -> directly re-submit
    navigate(isRejected ? "/kyc-add" : "/kyc-check");
  }

  return (
    <div className="flex min-h-screen">
      {/* responsive sidebar */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col">
        {/* header with hamburger */}
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-6 lg:p-9">
          <h1 className="text-3xl lg:text-4xl font-bold mb-8">
            {t("home.title").split("Insurance Policy")[0]}
            <span className="text-secondary">Insurance Policy</span>
          </h1>

          {/* Error */}
          {error && (
            <Alert className="mb-6 bg-destructive/10 border-destructive">
              <XCircle className="h-4 w-4 text-destructive" />
              <AlertDescription className="text-destructive">{error}</AlertDescription>
            </Alert>
          )}

          {/* Loading */}
          {loading && <div className="mb-6 text-sm opacity-70">Loading KYC info...</div>}

          {/* Alert */}
          {!error && !loading && (
            <Alert className={ui.styles.alert}>
              <ui.Icon className={`h-4 w-4 ${ui.styles.text}`} />
              <AlertDescription className={ui.styles.text}>
                <div className="flex flex-col gap-3">
                  <div>{noteMessage ? noteMessage : ui.message}</div>

                  {isRejected && (
                    <div>
                      <Button type="button" variant="destructive" onClick={() => navigate("/kyc-add")}>
                        Re-submit KYC
                      </Button>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* ✅ Cards (click guarded by KYC) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div
              role="button"
              tabIndex={0}
              onClick={() => guardKycThenNavigate("/motor-insurance-plan")}
              onKeyDown={(e) => e.key === "Enter" && guardKycThenNavigate("/motor-insurance-plan")}
              className="cursor-pointer"
            >
              <InsuranceCard
                type="motor"
                title={t("insurance.motor")}
                subtitle={`${t("insurance.vehicle")} • KYC: ${statusLabel}`}
                to="#"
              />
            </div>

            <div
              role="button"
              tabIndex={0}
              onClick={() => guardKycThenNavigate("/travel-insurance-coverage")}
              onKeyDown={(e) => e.key === "Enter" && guardKycThenNavigate("/travel-insurance-coverage")}
              className="cursor-pointer"
            >
              <InsuranceCard
                type="travel"
                title={t("insurance.travel")}
                subtitle={t("insurance.travelIns")}
                to="#"
              />
            </div>

            <div
              role="button"
              tabIndex={0}
              onClick={() => guardKycThenNavigate("/home-insurance")}
              onKeyDown={(e) => e.key === "Enter" && guardKycThenNavigate("/home-insurance")}
              className="cursor-pointer"
            >
              <InsuranceCard
                type="home"
                title={t("insurance.home")}
                subtitle={t("insurance.homeIns")}
                to="#"
              />
            </div>
          </div>

          {/* ✅ Modal */}
          <Dialog open={kycModalOpen} onOpenChange={(v) => !v && closeModal()}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5" />
                  KYC Verification Required
                </DialogTitle>
              </DialogHeader>

              <div className="text-sm whitespace-pre-line text-muted-foreground">
                {kycModalMsg || "Please wait. Your KYC must be verified first to access all features."}
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={closeModal}>
                  Close
                </Button>

                {/* show KYC button always (helpful) */}
                <Button onClick={goToKyc}>
                  {isRejected ? "Re-submit KYC" : "Go to KYC"}
                </Button>

                {/* optional: if you want, allow "Continue" only when verified */}
                {/* {isVerified && pendingRoute && (
                  <Button onClick={() => navigate(pendingRoute)}>Continue</Button>
                )} */}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
};
