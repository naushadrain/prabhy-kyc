import React, { useState } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  FileText,
  Lock,
  Edit3,
  CheckCircle,
  Clock,
  CreditCard,
  Activity,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";

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
      <p className="text-sm font-medium text-foreground truncate">{value}</p>
    </div>
  </div>
);

export const UserProfile: React.FC = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fullName = localStorage.getItem("customer_name") || "Guest User";
  const partyType = localStorage.getItem("party_type") || "INDIVIDUAL";
  const initial = (fullName?.trim()?.[0] || "G").toUpperCase();

  const stats = [
    {
      label: "Active Policies",
      value: "3",
      icon: <Shield className="w-5 h-5 text-primary" />,
      bg: "bg-primary/10",
    },
    {
      label: "Pending Claims",
      value: "1",
      icon: <Clock className="w-5 h-5 text-amber-600" />,
      bg: "bg-amber-50",
    },
    {
      label: "Transactions",
      value: "12",
      icon: <CreditCard className="w-5 h-5 text-blue-600" />,
      bg: "bg-blue-50",
    },
    {
      label: "Documents",
      value: "5",
      icon: <FileText className="w-5 h-5 text-purple-600" />,
      bg: "bg-purple-50",
    },
  ];

  const recentActivity = [
    {
      action: "Policy renewed",
      detail: "Travel Insurance – Asia Plan",
      time: "2 days ago",
      icon: <Shield className="w-4 h-4 text-primary" />,
      dot: "bg-primary",
    },
    {
      action: "Claim submitted",
      detail: "Motor Insurance Claim #CLM-0042",
      time: "5 days ago",
      icon: <Activity className="w-4 h-4 text-amber-600" />,
      dot: "bg-amber-500",
    },
    {
      action: "Payment completed",
      detail: "Home Insurance Premium – NPR 12,500",
      time: "1 week ago",
      icon: <CreditCard className="w-4 h-4 text-blue-600" />,
      dot: "bg-blue-500",
    },
    {
      action: "KYC approved",
      detail: "Identity verification successful",
      time: "2 weeks ago",
      icon: <CheckCircle className="w-4 h-4 text-green-600" />,
      dot: "bg-green-500",
    },
  ];

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
          {/* ── Stats ─────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-xl border bg-card p-4 flex items-center gap-3 shadow-sm"
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${s.bg}`}>
                  {s.icon}
                </div>
                <div>
                  <p className="text-2xl font-bold leading-none">{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Info Cards ────────────────────────────────────── */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className="rounded-xl border bg-card shadow-sm">
              <div className="flex items-center gap-2 px-5 py-4 border-b">
                <User className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">Personal Information</h3>
              </div>
              <div className="px-5">
                <InfoRow icon={<User className="w-4 h-4" />} label="Full Name" value={fullName} />
                <InfoRow icon={<Mail className="w-4 h-4" />} label="Email Address" value="user@example.com" />
                <InfoRow icon={<Phone className="w-4 h-4" />} label="Mobile Number" value="+977 98XXXXXXXX" />
                <InfoRow icon={<MapPin className="w-4 h-4" />} label="Address" value="Kathmandu, Bagmati Province" />
                <InfoRow icon={<Calendar className="w-4 h-4" />} label="Date of Birth" value="—" />
              </div>
            </div>

            {/* Account & KYC */}
            <div className="rounded-xl border bg-card shadow-sm">
              <div className="flex items-center gap-2 px-5 py-4 border-b">
                <Shield className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">Account & KYC</h3>
              </div>
              <div className="px-5">
                <InfoRow
                  icon={<Shield className="w-4 h-4" />}
                  label="Account Type"
                  value={partyType === "INDIVIDUAL" ? "Individual" : "Corporate"}
                />
                <InfoRow icon={<CheckCircle className="w-4 h-4" />} label="KYC Status" value="Verified" />
                <InfoRow icon={<FileText className="w-4 h-4" />} label="Identity Document" value="Citizenship" />
                <InfoRow icon={<Calendar className="w-4 h-4" />} label="Member Since" value="2024" />
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

          {/* ── Recent Activity ────────────────────────────────── */}
          <div className="rounded-xl border bg-card shadow-sm">
            <div className="flex items-center gap-2 px-5 py-4 border-b">
              <Activity className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm">Recent Activity</h3>
            </div>
            <div className="divide-y">
              {recentActivity.map((item, idx) => (
                <div key={idx} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{item.action}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.detail}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{item.time}</span>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
