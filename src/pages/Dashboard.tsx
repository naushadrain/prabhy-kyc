// src/pages/Dashboard.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { InsuranceCard } from "@/components/InsuranceCard";
import { useLanguage } from "@/contexts/LanguageContext";

import { AlertCircle, CheckCircle2, XCircle, Info, ShieldAlert, Wrench } from "lucide-react";
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
  kyc_Status?: string;
  process_result?: boolean;
  [key: string]: any;
};

type KycNotesResponse = {
  note_Type?: string;
  comments?: string;
  date_Posted?: string;
  [key: string]: any;
};

type ModalKind = "kyc" | "info";

export const Dashboard = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalKind, setModalKind] = useState<ModalKind>("kyc");
  const [modalTitle, setModalTitle] = useState("");
  const [modalMsg, setModalMsg] = useState("");
  const [targetRoute, setTargetRoute] = useState<string>("");

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

  // Normalize status
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

  // Latest note
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

  // Alert styles
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

  /**
   * Generic function to check KYC before navigating to any service
   */
  function checkKycAndNavigate(route: string, serviceName: string) {
    // If still loading KYC
    if (loading) {
      setModalKind("kyc");
      setModalTitle("Please wait");
      setModalMsg("KYC status is loading. Please wait a moment...");
      setModalOpen(true);
      return;
    }

    // If there's an error loading KYC
    if (error) {
      setModalKind("kyc");
      setModalTitle("KYC not available");
      setModalMsg("KYC status could not be loaded. Please try again later.");
      setModalOpen(true);
      return;
    }

    // If KYC is verified - allow navigation
    if (isVerified) {
      navigate(route);
      return;
    }

    // If KYC is rejected
    if (isRejected) {
      setModalKind("kyc");
      setModalTitle("KYC Verification Required");
      setModalMsg(
        `Your KYC has been rejected. Please re-submit your KYC documents to access ${serviceName}.${
          noteMessage ? `\n\nReason: ${noteMessage}` : ""
        }`
      );
      setTargetRoute(route);
      setModalOpen(true);
      return;
    }

    // If KYC is pending
    if (isPending) {
      setModalKind("kyc");
      setModalTitle("KYC Verification Pending");
      setModalMsg(
        `Your KYC is currently under review. You'll be able to access ${serviceName} once your KYC is verified.${
          noteMessage ? `\n\nStatus: ${noteMessage}` : ""
        }`
      );
      setTargetRoute(route);
      setModalOpen(true);
      return;
    }

    // If KYC status is unknown
    setModalKind("kyc");
    setModalTitle("KYC Required");
    setModalMsg(`Please complete your KYC verification to access ${serviceName}.`);
    setTargetRoute(route);
    setModalOpen(true);
  }

  // Service click handlers
  const handleMotorClick = () => {
    checkKycAndNavigate("/motor-insurance-plan", "Motor Insurance");
  };

  const handleTravelClick = () => {
    checkKycAndNavigate("/travel-insurance-coverage", "Travel Insurance");
  };

  const handleHomeClick = () => {
    checkKycAndNavigate("/home-insurance-plan", "Home Insurance");
  };

  function closeModal() {
    setModalOpen(false);
    setTargetRoute("");
  }

  function goToKyc() {
    setModalOpen(false);
    navigate("/kyc-add");
  }

  function proceedToService() {
    if (targetRoute) {
      setModalOpen(false);
      navigate(targetRoute);
      setTargetRoute("");
    }
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-6 lg:p-9">
          <h1 className="text-3xl lg:text-4xl font-bold mb-8">
            {t("home.title").split("Insurance Policy")[0]}
            <span className="text-secondary">Insurance Policy</span>
          </h1>

          {error && (
            <Alert className="mb-6 bg-destructive/10 border-destructive">
              <XCircle className="h-4 w-4 text-destructive" />
              <AlertDescription className="text-destructive">{error}</AlertDescription>
            </Alert>
          )}

          {loading && (
            <div className="mb-6 text-sm opacity-70 flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              Loading KYC information...
            </div>
          )}

          {!error && !loading && (
            <Alert className={ui.styles.alert}>
              <ui.Icon className={`h-4 w-4 ${ui.styles.text}`} />
              <AlertDescription className={ui.styles.text}>
                <div className="flex flex-col gap-3">
                  <div>{noteMessage ? noteMessage : ui.message}</div>

                  {isRejected && (
                    <div>
                      <Button 
                        type="button" 
                        variant="destructive" 
                        size="sm"
                        onClick={() => navigate("/kyc-add")}
                      >
                        Re-submit KYC
                      </Button>
                    </div>
                  )}
                  
                  {!isVerified && !isRejected && !isPending && (
                    <div>
                      <Button 
                        type="button" 
                        variant="default" 
                        size="sm"
                        onClick={() => navigate("/kyc-add")}
                      >
                        Complete KYC
                      </Button>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Insurance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Motor Insurance */}
            <div
              role="button"
              tabIndex={0}
              onClick={handleMotorClick}
              onKeyDown={(e) => e.key === "Enter" && handleMotorClick()}
              className="cursor-pointer transition-transform hover:scale-105"
            >
              <InsuranceCard
                type="motor"
                title={t("insurance.motor")}
                subtitle={`${t("insurance.vehicle")} • KYC: ${statusLabel}`}
                to="#"
              />
            </div>

            {/* Travel Insurance */}
            <div
              role="button"
              tabIndex={0}
              onClick={handleTravelClick}
              onKeyDown={(e) => e.key === "Enter" && handleTravelClick()}
              className="cursor-pointer transition-transform hover:scale-105"
            >
              <InsuranceCard
                type="travel"
                title={t("insurance.travel")}
                subtitle={t("insurance.travelIns")}
                to="#"
              />
            </div>

            {/* Home Insurance */}
            <div
              role="button"
              tabIndex={0}
              onClick={handleHomeClick}
              onKeyDown={(e) => e.key === "Enter" && handleHomeClick()}
              className="cursor-pointer transition-transform hover:scale-105"
            >
              <InsuranceCard
                type="home"
                title={t("insurance.home")}
                subtitle={t("insurance.homeIns")}
                to="#"
              />
            </div>
          </div>
          {/* Modal Dialog */}
          <Dialog open={modalOpen} onOpenChange={(v) => !v && closeModal()}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {modalKind === "kyc" ? (
                    <ShieldAlert className="w-5 h-5" />
                  ) : (
                    <Info className="w-5 h-5" />
                  )}
                  {modalTitle || "Message"}
                </DialogTitle>
              </DialogHeader>

              <div className="text-sm whitespace-pre-line text-muted-foreground">
                {modalMsg || "Message"}
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={closeModal}>
                  Close
                </Button>

                {modalKind === "kyc" && !isVerified && (
                  <Button onClick={goToKyc} variant={isRejected ? "destructive" : "default"}>
                    {isRejected ? "Re-submit KYC" : isPending ? "Check KYC Status" : "Go to KYC"}
                  </Button>
                )}

                {modalKind === "kyc" && isVerified && targetRoute && (
                  <Button onClick={proceedToService}>
                    Proceed
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
};