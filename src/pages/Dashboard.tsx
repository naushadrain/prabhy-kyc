import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { InsuranceCard } from "@/components/InsuranceCard";
import { useLanguage } from "@/contexts/LanguageContext";

import { AlertCircle, CheckCircle2, XCircle, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

import { kycStatus } from "@/api/kyc/kycStatus";
import { KycNotes } from "@/api/kyc/kycNotes";

type KycStatusResponse = {
  kyc_Status?: string; // "Pending" | "Verified" | "Rejected" ...
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

        const [statusRes, notesRes] = await Promise.allSettled([
          kycStatus(),
          KycNotes(),
        ]);

        if (!mounted) return;

        // status
        if (statusRes.status === "fulfilled") {
          const data: KycStatusResponse =
            (statusRes.value as any)?.data ?? (statusRes.value as any);
          setKycData(data);
        }

        // notes
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
  //  status normalize
  const statusRaw = kycData?.kyc_Status ?? "Unknown";
  const status = String(statusRaw).trim().toLowerCase();

  const isRejected = status === "rejected" || status === "failed";

  //  pick latest note that has comments
  const latestNoteWithMessage = useMemo(() => {
    const withComments = (kycNotes || [])
      .filter((n) => String(n?.comments ?? "").trim().length > 0)
      .sort((a, b) => {
        const da = Date.parse(a?.date_Posted ?? "") || 0;
        const db = Date.parse(b?.date_Posted ?? "") || 0;
        return db - da; // newest first
      });

    return withComments[0] ?? null;
  }, [kycNotes]);

  const noteMessage = String(latestNoteWithMessage?.comments ?? "").trim();
  const noteType = String(latestNoteWithMessage?.note_Type ?? "")
    .trim()
    .toLowerCase();

  // -----------------------------
  //  helper: tailwind styles
  const stylesFor = (variant: "success" | "warning" | "danger" | "info") => {
    return variant === "success"
      ? {
        alert: "mb-6 bg-emerald-50 border-emerald-200",
        text: "text-emerald-700",
      }
      : variant === "danger"
        ? {
          alert: "mb-6 bg-destructive/10 border-destructive",
          text: "text-destructive",
        }
        : variant === "warning"
          ? {
            alert: "mb-6 bg-amber-50 border-amber-200",
            text: "text-amber-700",
          }
          : { alert: "mb-6 bg-muted/50 border-muted", text: "text-foreground/80" };
  };

  //  status -> UI mapping
  const statusUi = useMemo(() => {
    let variant: "success" | "warning" | "danger" | "info" = "info";
    let message = "KYC status is not available right now...";
    let Icon = Info;

    if (status === "verified" || status === "approved") {
      variant = "success";
      message = "Your KYC is verified. You can proceed with all services...";
      Icon = CheckCircle2;
    } else if (status === "rejected" || status === "failed") {
      variant = "danger";
      message = "Your KYC was rejected. Please re-submit your documents...";
      Icon = XCircle; //  important
    } else if (
      status === "pending" ||
      status === "under review" ||
      status === "in review" ||
      status === "processing" ||
      status === "submitted"
    ) {
      variant = "warning";
      message = "Your KYC information has been submitted and is under review...";
      Icon = AlertCircle;
    } else if (status === "unknown" || !status) {
      variant = "info";
      message = "KYC status is not available right now...";
      Icon = Info;
    } else {
      variant = "info";
      message = `KYC Status: ${statusRaw}`;
      Icon = Info;
    }

    return { variant, message, Icon, styles: stylesFor(variant) };
  }, [status, statusRaw]);

  //  notes -> UI mapping (only used if noteMessage exists)
  const notesUi = useMemo(() => {
    let variant: "success" | "warning" | "danger" | "info" = "info";
    let Icon = Info;

    if (
      noteType.includes("verified") ||
      noteType.includes("approved") ||
      noteType.includes("success")
    ) {
      variant = "success";
      Icon = CheckCircle2;
    } else if (
      noteType.includes("reject") ||
      noteType.includes("fail") ||
      noteType.includes("error")
    ) {
      variant = "danger";
      Icon = XCircle; //  important
    } else if (
      noteType.includes("pending") ||
      noteType.includes("review") ||
      noteType.includes("process")
    ) {
      variant = "warning";
      Icon = AlertCircle;
    }

    // fallback to status variant/icon if noteType unknown
    if (variant === "info") {
      variant = statusUi.variant;
      Icon = statusUi.Icon;
    }

    return { variant, message: noteMessage, Icon, styles: stylesFor(variant) };
  }, [noteType, noteMessage, statusUi.variant, statusUi.Icon]);

  //  FINAL: show notes alert if message exists, otherwise status alert
  const ui = noteMessage ? notesUi : statusUi;

  const statusLabel =
    statusRaw && statusRaw !== "Unknown" ? String(statusRaw) : "Unknown";

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />

        <main className="flex-1 p-8">
          <h1 className="text-4xl font-bold mb-8">
            {t("home.title").split("Insurance Policy")[0]}
            <span className="text-secondary">Insurance Policy</span>
          </h1>

          {/* Error */}
          {error && (
            <Alert className="mb-6 bg-destructive/10 border-destructive">
              <XCircle className="h-4 w-4 text-destructive" />
              <AlertDescription className="text-destructive">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Loading */}
          {loading && (
            <div className="mb-6 text-sm opacity-70">Loading KYC info...</div>
          )}

          {/*  Alert (notes first, else status) +  Resubmit button when rejected */}
          {!error && !loading && (
            <Alert className={ui.styles.alert}>
              <ui.Icon className={`h-4 w-4 ${ui.styles.text}`} />
              <AlertDescription className={ui.styles.text}>
                <div className="flex flex-col gap-3">
                  <div>{noteMessage ? noteMessage : ui.message}</div>

                  {/*  show resubmit only when rejected/failed */}
                  {isRejected && (
                    <div>
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => navigate("/kyc-add")}
                      >
                        Re-submit KYC
                      </Button>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <InsuranceCard
              type="motor"
              title={t("insurance.motor")}
              subtitle={`${t("insurance.vehicle")} • KYC: ${statusLabel}`}
              to="/motor-insurance-plan"
            />
            <InsuranceCard
              type="travel"
              title={t("insurance.travel")}
              subtitle={t("insurance.travelIns")}
              to="/travel-insurance-coverage"
            />
            <InsuranceCard
              type="home"
              title={t("insurance.home")}
              subtitle={t("insurance.homeIns")}
              to="/home-insurance"
            />
          </div>
        </main>
      </div>
    </div>
  );
};
