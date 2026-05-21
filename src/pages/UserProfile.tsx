import React, { useState, useEffect } from "react";
import {
  User,
  Phone,
  Shield,
  FileText,
  Lock,
  CheckCircle,
  CreditCard,
  Activity,
  AlertCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { getUserInfo } from "@/api/userInfo/homePageIngo";
import type { UsersInfo } from "@/types/gotohome";

const InfoRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
}> = ({ icon, label, value }) => (
  <div className="flex items-center gap-4 py-3.5 border-b last:border-0">
    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-primary">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm font-medium text-foreground truncate">{value || "—"}</p>
    </div>
  </div>
);

export const UserProfile: React.FC = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userInfo, setUserInfo] = useState<UsersInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const partyType = localStorage.getItem("party_type") || "INDIVIDUAL";

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getUserInfo();
        setUserInfo(data);
      } catch (err: any) {
        setError(err?.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const fullName = userInfo?.customer_name || localStorage.getItem("customer_name") || "Guest User";
  const initial = (fullName.trim()[0] || "G").toUpperCase();

  const kycBadgeColor =
    userInfo?.kyc_status?.toLowerCase() === "approved"
      ? "bg-green-100 text-green-700 border-green-200"
      : userInfo?.kyc_status
      ? "bg-amber-100 text-amber-700 border-amber-200"
      : "bg-muted text-muted-foreground";

  const quickLinks = [
    { label: "My Policies", path: "/my-policies", icon: <Shield className="w-5 h-5 text-primary" /> },
    { label: "File a Claim", path: "/claim", icon: <FileText className="w-5 h-5 text-primary" /> },
    { label: "Transaction History", path: "/transaction-history", icon: <CreditCard className="w-5 h-5 text-primary" /> },
    { label: "Change Password", path: "/change-password", icon: <Lock className="w-5 h-5 text-primary" /> },
  ];

  return (
    <div className="flex min-h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setSidebarOpen(true)} title="My Profile" />

        <main className="flex-1 p-6 lg:p-9 space-y-6">

          {/* ── Error ── */}
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* ── Profile Header Card ── */}
          <div className="rounded-xl border bg-card shadow-sm p-6 flex flex-col sm:flex-row items-center sm:items-start gap-5">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
              <span className="text-3xl font-bold text-primary">{initial}</span>
            </div>

            {/* Name block */}
            <div className="flex-1 text-center sm:text-left space-y-1">
              {loading ? (
                <div className="h-5 w-48 bg-muted animate-pulse rounded" />
              ) : (
                <>
                  <h2 className="text-xl font-bold leading-tight">{fullName}</h2>
                  {userInfo?.customer_name_nep && (
                    <p className="text-sm text-muted-foreground">{userInfo.customer_name_nep}</p>
                  )}
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {partyType === "INDIVIDUAL" ? "Individual" : "Corporate"}
                    </Badge>
                    {userInfo?.kyc_status && (
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${kycBadgeColor}`}>
                        KYC: {userInfo.kyc_status}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── Info Cards ── */}
          <div className="grid md:grid-cols-2 gap-6">

            {/* Personal Information */}
            <div className="rounded-xl border bg-card shadow-sm">
              <div className="flex items-center gap-2 px-5 py-4 border-b">
                <User className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">Personal Information</h3>
              </div>
              <div className="px-5">
                {loading ? (
                  <div className="space-y-4 py-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-4 bg-muted animate-pulse rounded w-3/4" />
                    ))}
                  </div>
                ) : (
                  <>
                    <InfoRow
                      icon={<User className="w-4 h-4" />}
                      label="Full Name (English)"
                      value={userInfo?.customer_name || ""}
                    />
                    <InfoRow
                      icon={<User className="w-4 h-4" />}
                      label="Full Name (Nepali)"
                      value={userInfo?.customer_name_nep || ""}
                    />
                    <InfoRow
                      icon={<User className="w-4 h-4" />}
                      label="First Name"
                      value={userInfo?.customer_first_name || ""}
                    />
                    <InfoRow
                      icon={<User className="w-4 h-4" />}
                      label="Middle Name"
                      value={userInfo?.customer_middle_name || ""}
                    />
                    <InfoRow
                      icon={<User className="w-4 h-4" />}
                      label="Last Name"
                      value={userInfo?.customer_last_name || ""}
                    />
                    <InfoRow
                      icon={<Phone className="w-4 h-4" />}
                      label="Mobile Number"
                      value={userInfo?.mobile_no || ""}
                    />
                  </>
                )}
              </div>
            </div>

            {/* Account & KYC */}
            <div className="rounded-xl border bg-card shadow-sm">
              <div className="flex items-center gap-2 px-5 py-4 border-b">
                <Shield className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">Account & KYC</h3>
              </div>
              <div className="px-5">
                {loading ? (
                  <div className="space-y-4 py-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-4 bg-muted animate-pulse rounded w-3/4" />
                    ))}
                  </div>
                ) : (
                  <>
                    <InfoRow
                      icon={<Shield className="w-4 h-4" />}
                      label="Account Type"
                      value={partyType === "INDIVIDUAL" ? "Individual" : "Corporate"}
                    />
                    <InfoRow
                      icon={<CheckCircle className="w-4 h-4" />}
                      label="KYC Status"
                      value={userInfo?.kyc_status || "—"}
                    />
                    <InfoRow
                      icon={<User className="w-4 h-4" />}
                      label="First Name (Nepali)"
                      value={userInfo?.customer_first_name_nep || ""}
                    />
                    <InfoRow
                      icon={<User className="w-4 h-4" />}
                      label="Middle Name (Nepali)"
                      value={userInfo?.customer_middle_name_nep || ""}
                    />
                    <InfoRow
                      icon={<User className="w-4 h-4" />}
                      label="Last Name (Nepali)"
                      value={userInfo?.customer_last_name_nep || ""}
                    />
                  </>
                )}
              </div>
              <div className="px-5 pb-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2 text-xs mt-1"
                  onClick={() => navigate("/kyc-check")}
                >
                  <FileText className="w-3.5 h-3.5" />
                  View KYC Details
                </Button>
              </div>
            </div>
          </div>

          {/* ── Quick Links ── */}
          <div className="rounded-xl border bg-card shadow-sm">
            <div className="flex items-center gap-2 px-5 py-4 border-b">
              <Activity className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm">Quick Links</h3>
            </div>
            <div className="divide-y">
              {quickLinks.map((link) => (
                <button
                  key={link.path}
                  onClick={() => navigate(link.path)}
                  className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-muted/40 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    {link.icon}
                  </div>
                  <span className="flex-1 text-sm font-medium">{link.label}</span>
                  <CreditCard className="w-4 h-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>

        </main>
      </div>
    </div>
  );
};
