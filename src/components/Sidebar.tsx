import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ShoppingCart,
  User,
  CreditCard,
  Lock,
  FileText,
  ClipboardList,
  HelpCircle,
  Phone,
  History,
  Users,
  Link as LinkIcon,
  File,
  X,
} from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.png";
import { Button } from "@/components/ui/button";

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
  children?: NavItem[];
}

type SidebarProps = {
  open: boolean;
  onClose: () => void;
};

export const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  const location = useLocation();
  const { t } = useLanguage();

  const navItems: NavItem[] = [
    { icon: ShoppingCart, label: t("nav.buyPolicies"), path: "/dashboard" },
    {
      icon: User,
      label: t("nav.kyc"),
      path: "/kyc-check",
      children: [
        { icon: Users, label: t("nav.kycAdd"), path: "/kyc-add" },
        { icon: Users, label: t("nav.kycAddCorporate"), path: "/kyc-add-corporate" },
        { icon: LinkIcon, label: t("nav.kycLink"), path: "/kyc-check" },
      ],
    },
    { icon: CreditCard, label: t("nav.draftPolicyPayment"), path: "/draft-policy" },
    {
      icon: Lock,
      label: t("nav.myPolicies"),
      path: "/my-policies",
      children: [
        { icon: FileText, label: t("nav.myPolicies"), path: "/my-policies" },
        { icon: File, label: t("nav.myDraftPolicy"), path: "/my-draft-policy" },
      ],
    },
    {
      icon: ClipboardList,
      label: t("nav.claim"),
      path: "/claim",
      children: [
        { icon: FileText, label: t("nav.claimIntimate"), path: "/claim" },
        { icon: FileText, label: t("nav.claimTracking"), path: "/claim-tracking" },
      ],
    },
    { icon: HelpCircle, label: t("nav.faq"), path: "/faq" },
    { icon: Phone, label: t("nav.contactUs"), path: "/contact" },
    { icon: History, label: t("nav.transactionHistory"), path: "/transaction-history" },
  ];

  // Desktop sidebar always visible, mobile uses "open"
  return (
    <>
      {/* ✅ Mobile overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
      />

      {/* ✅ Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen w-72 bg-sidebar border-r border-sidebar-border",
          "transition-transform duration-200 ease-in-out",
          "lg:translate-x-0 lg:static lg:z-auto lg:w-64",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header area */}
        <div className="flex items-center justify-between p-6 border-b border-sidebar-border">
          <img src={logo} alt="Prabhu Insurance" className="h-10 w-auto" />

          {/* Close button only on mobile */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Nav */}
        <nav className="px-3 py-4 space-y-1 overflow-y-auto h-[calc(100vh-80px)]">
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.children &&
                item.children.some((child) => location.pathname === child.path));

            return (
              <div key={item.path}>
                <Link
                  to={item.path}
                  onClick={onClose} // ✅ close on mobile after click
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                  {item.children && <span className="ml-auto">▾</span>}
                </Link>

                {/* children */}
                {item.children && isActive && (
                  <div className="ml-6 mt-1 space-y-1">
                    {item.children.map((child) => (
                      <Link
                        key={child.path}
                        to={child.path}
                        onClick={onClose} // ✅ close on mobile after click
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                          location.pathname === child.path
                            ? "text-primary font-medium"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <child.icon className="w-3 h-3" />
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
};
