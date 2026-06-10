// src/pages/Dashboard.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { InsuranceCard } from "@/components/InsuranceCard";
import { useLanguage } from "@/contexts/LanguageContext";

import { AlertCircle, CheckCircle2, XCircle, Info, ShieldAlert } from "lucide-react";
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

  const stylesFor = (variant: "success" | "warning" | "danger" | "info") => {
    if (variant === "success") {
      return {
        alert: "mb-6 border-l-4 border-l-primary border-primary/30 bg-primary/10",
        text: "text-primary",
        badge: "bg-green-600 text-white border border-green-600",
        icon: "text-primary",
      };
    }
    if (variant === "danger") {
      return {
        alert: "mb-6 border-l-4 border-l-primary border-primary/30 bg-primary/5",
        text: "text-primary",
        badge: "bg-primary/10 text-primary border border-primary/30",
        icon: "text-primary",
      };
    }
    if (variant === "warning") {
      return {
        alert: "mb-6 border-l-4 border-l-orange-500 border-orange-200 bg-orange-50",
        text: "text-orange-800",
        badge: "bg-orange-100 text-orange-700 border border-orange-200",
        icon: "text-orange-500",
      };
    }
    return {
      alert: "mb-6 border-l-4 border-l-muted-foreground/40 border-border bg-muted/40",
      text: "text-muted-foreground",
      badge: "bg-muted text-muted-foreground border border-border",
      icon: "text-muted-foreground",
    };
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
      Icon = XCircle;
    } else if (
      noteType.includes("pending") ||
      noteType.includes("review") ||
      noteType.includes("process")
    ) {
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



  function checkKycAndNavigate(route: string, serviceName: string) {
    if (loading) {
      setModalKind("kyc");
      setModalTitle("Please wait");
      setModalMsg("KYC status is loading. Please wait a moment...");
      setModalOpen(true);
      return;
    }

    if (error) {
      setModalKind("kyc");
      setModalTitle("KYC not available");
      setModalMsg("KYC status could not be loaded. Please try again later.");
      setModalOpen(true);
      return;
    }

    if (isVerified) {
      navigate(route);
      return;
    }

    if (isRejected) {
      setModalKind("kyc");
      setModalTitle("KYC Verification Required");
      setModalMsg(
        `Your KYC has been rejected. Please re-submit your KYC documents to access ${serviceName}.${noteMessage ? `\n\nReason: ${noteMessage}` : ""
        }`
      );
      setTargetRoute(route);
      setModalOpen(true);
      return;
    }

    if (isPending) {
      setModalKind("kyc");
      setModalTitle("KYC Verification Pending");
      setModalMsg(
        `Your KYC is currently under review. You'll be able to access ${serviceName} once your KYC is verified.${noteMessage ? `\n\nStatus: ${noteMessage}` : ""
        }`
      );
      setTargetRoute(route);
      setModalOpen(true);
      return;
    }

    setModalKind("kyc");
    setModalTitle("KYC Required");
    setModalMsg(`Please complete your KYC verification to access ${serviceName}.`);
    setTargetRoute(route);
    setModalOpen(true);
  }

  const handleMotorClick = () => {
    checkKycAndNavigate("/motor-insurance", "Motor Insurance");
  };
  const handleTwoWheelerClick = () => {
    checkKycAndNavigate("/two-wheeler", "Two Wheeler");
  }
  const handlePrivateVechicleClick = () => {
    checkKycAndNavigate("/private-vechicle", "Two Wheeler");
  }

  const handleCommercialVehicleClick = () => {
    checkKycAndNavigate("/commercial-vehicle", "Two Wheeler");
  }
  const handleAccidenClick = () => {
    checkKycAndNavigate("/accidents", "Two Wheeler");
  }
  const handleTravelClick = () => {
    checkKycAndNavigate("/travel-insurance-coverage", "Travel Insurance");
  };

  const handleHomeClick = () => {
    checkKycAndNavigate("/home-insurances", "Home Insurance");
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
            <span className="text-red-500">Insurance Policy</span>
          </h1>

          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-lg border-l-4 border-l-primary border-primary/30 bg-primary/5 px-4 py-3.5">
              <XCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-primary">Unable to load KYC status</p>
                <p className="text-sm text-primary/80 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {loading && (
            <div className="mb-6 flex items-center gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3.5">
              <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Checking KYC status…</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Please wait while we verify your information.
                </p>
              </div>
            </div>
          )}

          {!error && !loading && (
            <div className={`flex items-start gap-3 rounded-lg px-4 py-3.5 ${ui.styles.alert}`}>
              <ui.Icon className={`h-5 w-5 mt-0.5 shrink-0 ${ui.styles.icon}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className={`text-sm font-semibold ${ui.styles.text}`}>
                    KYC Verification Status
                  </p>
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${ui.styles.badge}`}>
                    {statusLabel}
                  </span>
                </div>
                <p className={`text-sm mt-1 ${ui.styles.text} opacity-90`}>
                  {noteMessage || ui.message}
                </p>
                {(isRejected || (!isVerified && !isRejected && !isPending)) && (
                  <div className="mt-2.5">
                    {isRejected ? (
                      <Button
                        type="button"
                        size="sm"
                        className="bg-primary hover:bg-primary/90 text-primary-foreground h-8 text-xs"
                        onClick={() => navigate("/kyc-add")}
                      >
                        Re-submit KYC
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        className="bg-primary hover:bg-primary/90 text-primary-foreground h-8 text-xs"
                        onClick={() => navigate("/kyc-add")}
                      >
                        Complete KYC
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            <div
              role="button"
              tabIndex={0}
              onClick={handleTwoWheelerClick}
              onKeyDown={(e) => e.key === "Enter" && handleTwoWheelerClick()}
              className="cursor-pointer"
            >
              <InsuranceCard
                title="Two Wheeler"
                icon="/motor.svg"
              />
            </div>

            <div
              role="button"
              tabIndex={0}
              onClick={handlePrivateVechicleClick}
              onKeyDown={(e) => e.key === "Enter" && handlePrivateVechicleClick()}
              className="cursor-pointer"
            >
              <InsuranceCard
                title="Private Vehicle"
                icon="/car-white.svg"
              />
            </div>

            <div
              role="button"
              tabIndex={0}
              onClick={handleCommercialVehicleClick}
              onKeyDown={(e) => e.key === "Enter" && handleCommercialVehicleClick()}
              className="cursor-pointer"
            >
              <InsuranceCard
                title="Commercial Vehicle"
                icon="/commercial.svg"
              />
            </div>

            <div
              role="button"
              tabIndex={0}
              onClick={handleAccidenClick}
              onKeyDown={(e) => e.key === "Enter" && handleAccidenClick()}
              className="cursor-pointer"
            >
              <InsuranceCard
                title="Accidental Insurance"
                icon="/accident-white.svg"
              />
            </div>

            <div
              role="button"
              tabIndex={0}
              onClick={handleTravelClick}
              onKeyDown={(e) => e.key === "Enter" && handleTravelClick()}
              className="cursor-pointer"
            >
              <InsuranceCard
                title="Travel Insurance"
                icon="/travel-icon.svg"
              />
            </div>

            <div
              role="button"
              tabIndex={0}
              onClick={handleHomeClick}
              onKeyDown={(e) => e.key === "Enter" && handleHomeClick()}
              className="cursor-pointer"
            >
              <InsuranceCard
                title={t("insurance.home")}
                icon="/home-icon.svg"
              />
            </div>
          </div>

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