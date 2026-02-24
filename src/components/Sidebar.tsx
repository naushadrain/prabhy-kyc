import React, { useState, useEffect } from "react";
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
  ChevronDown,
  ChevronRight,
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
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  // Auto-expand parent if child is active
  useEffect(() => {
    const items = [
      { path: "/kyc-check", children: ["/kyc-add", "/kyc-add-corporate"] },
      { path: "/my-policies", children: ["/my-draft-policy"] },
      { path: "/claim", children: ["/claim-tracking"] },
    ];
    
    items.forEach(item => {
      if (item.children.some(child => location.pathname === child)) {
        setExpandedItems(prev => 
          prev.includes(item.path) ? prev : [...prev, item.path]
        );
      }
    });
  }, [location.pathname]);

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

  const toggleExpand = (path: string) => {
    setExpandedItems(prev =>
      prev.includes(path) 
        ? prev.filter(p => p !== path)
        : [...prev, path]
    );
  };

  const isActive = (path: string) => location.pathname === path;
  const isChildActive = (children?: NavItem[]) => 
    children?.some(child => location.pathname === child.path);

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
      />

      {/* Sidebar - fixed position with its own scroll */}
      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 z-50 h-screen w-72 bg-sidebar border-r border-sidebar-border",
          "flex flex-col", // Use flex column to separate logo and nav
          "transition-transform duration-200 ease-in-out",
          "lg:translate-x-0 lg:w-64",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header area - fixed at top of sidebar */}
        <div className="flex items-center justify-between p-6 border-b border-sidebar-border shrink-0">
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

        {/* Nav - scrollable area */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActiveItem = isActive(item.path) || isChildActive(item.children);
              const isExpanded = expandedItems.includes(item.path);

              return (
                <div key={item.path}>
                  {/* Parent menu item */}
                  <div className="relative">
                    <Link
                      to={item.path}
                      onClick={() => {
                        if (!item.children) onClose();
                      }}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                        isActiveItem && !item.children
                          ? "bg-primary text-primary-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-accent"
                      )}
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.children && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleExpand(item.path);
                          }}
                          className="p-1 hover:bg-sidebar-accent rounded-md"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </Link>
                  </div>

                  {/* Children menu items */}
                  {item.children && isExpanded && (
                    <div className="ml-6 mt-1 space-y-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.path}
                          to={child.path}
                          onClick={onClose}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                            location.pathname === child.path
                              ? "text-primary font-medium bg-sidebar-accent"
                              : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
                          )}
                        >
                          <child.icon className="w-3 h-3 shrink-0" />
                          <span className="truncate">{child.label}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </nav>
      </aside>
    </>
  );
};