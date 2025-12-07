import { Link, useLocation } from 'react-router-dom';
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
  File
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import logo from '@/assets/logo.png';

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
  children?: NavItem[];
}

export const Sidebar = () => {
  const location = useLocation();
  const { t } = useLanguage();

  const navItems: NavItem[] = [
    { icon: ShoppingCart, label: t('nav.buyPolicies'), path: '/dashboard' },
    { 
      icon: User, 
      label: t('nav.kyc'), 
      path: '/kyc-check',
      children: [
        { icon: Users, label: t('nav.kycAdd'), path: '/kyc-add' },
        { icon: Users, label: t('nav.kycAddCorporate'), path: '/kyc-add-corporate' },
        { icon: LinkIcon, label: t('nav.kycLink'), path: '/kyc-check' },
      ]
    },
    { icon: CreditCard, label: t('nav.draftPolicyPayment'), path: '/draft-policy' },
    { 
      icon: Lock, 
      label: t('nav.myPolicies'), 
      path: '/my-policies',
      children: [
        { icon: FileText, label: t('nav.myPolicies'), path: '/my-policies' },
        { icon: File, label: t('nav.myDraftPolicy'), path: '/my-draft-policy' },
      ]
    },
    { 
      icon: ClipboardList, 
      label: t('nav.claim'), 
      path: '/claim',
      children: [
        { icon: FileText, label: t('nav.claimIntimate'), path: '/claim' },
        { icon: FileText, label: t('nav.claimTracking'), path: '/claim-tracking' },
      ]
    },
    { icon: HelpCircle, label: t('nav.faq'), path: '/faq' },
    { icon: Phone, label: t('nav.contactUs'), path: '/contact' },
    { icon: History, label: t('nav.transactionHistory'), path: '/transaction-history' },
  ];

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border min-h-screen">
      <div className="p-6">
        <img 
          src={logo}
          alt="Prabhu Insurance" 
          className="h-12 w-auto"
        />
      </div>
      
      <nav className="px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.children && item.children.some(child => location.pathname === child.path));
          
          return (
            <div key={item.path}>
              <Link
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
                {item.children && (
                  <span className="ml-auto">▾</span>
                )}
              </Link>
              
              {item.children && isActive && (
                <div className="ml-6 mt-1 space-y-1">
                  {item.children.map((child) => (
                    <Link
                      key={child.path}
                      to={child.path}
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
  );
};
