// src/pages/policy/PolicyDetails.tsx

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ChevronLeft, 
  Download, 
  Printer, 
  Calendar, 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Globe,
  CreditCard,
  Clock,
  FileText,
  Shield,
  DollarSign
} from 'lucide-react';
import { getPolicyDetail, PolicyDetailResponse, ScheduleItem } from '@/api/policy/policyList';

export const PolicyDetails = () => {
  const { policyNo } = useParams<{ policyNo: string }>();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [policy, setPolicy] = useState<PolicyDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (policyNo) {
      fetchPolicyDetails(policyNo);
    }
  }, [policyNo]);

  const fetchPolicyDetails = async (policyNumber: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await getPolicyDetail(81, policyNumber);
      
      if (response.process_result && response.policy_number) {
        setPolicy(response);
      } else {
        setError('Failed to load policy details');
      }
    } catch (err) {
      setError('Error loading policy details');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/my-policies');
  };

  const handleDownload = () => {
    // Implement PDF download
    console.log('Downloading policy...');
  };

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateStr: string) => {
    return dateStr; // Already in DD/MM/YYYY format
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-NP', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(parseFloat(amount));
  };

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col">
          <Header onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 p-8 bg-background">
            <div className="max-w-6xl mx-auto">
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error || !policy) {
    return (
      <div className="flex min-h-screen">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col">
          <Header onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 p-8 bg-background">
            <div className="max-w-6xl mx-auto">
              <div className="text-center py-12">
                <p className="text-red-500">{error || 'Policy not found'}</p>
                <Button onClick={handleBack} className="mt-4">
                  Back to Policies
                </Button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="flex-1 bg-background p-6">
  <div className="max-w-7xl mx-auto">
    {/* Policy Number Header */}
    <div className="mb-6">
      <h1 className="text-2xl font-bold">Policy Details</h1>
      <p className="text-sm text-muted-foreground mt-1">
        Policy Number: <span className="font-mono font-medium">{policy.policy_number}</span>
      </p>
    </div>

    {/* First Row - 2 Cards */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* Policy Summary Card */}
      <Card>
        <CardHeader className="bg-primary/5">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Policy Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="h-4 w-4" /> Issue Date
              </p>
              <p className="font-medium">{formatDate(policy.policy_issue_date)}</p>
              <p className="text-xs text-muted-foreground">{policy.createdTime}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="h-4 w-4" /> Effective Date
              </p>
              <p className="font-medium">{formatDate(policy.effective_date)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="h-4 w-4" /> Expiry Date
              </p>
              <p className="font-medium">{formatDate(policy.expiry_date)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="h-4 w-4" /> Duration
              </p>
              <p className="font-medium">{policy.no_of_days} Days</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Shield className="h-4 w-4" /> Branch
              </p>
              <p className="font-medium">{policy.branch_name_english}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <CreditCard className="h-4 w-4" /> Fiscal Year
              </p>
              <p className="font-medium">{policy.fiscal_year}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <DollarSign className="h-4 w-4" /> Total Premium
              </p>
              <p className="font-medium text-lg text-primary">
                NPR {formatCurrency(policy.total_premium)}
              </p>
            </div>
            <div>
              <Badge variant={policy.is_draft_policy === 'y' ? 'outline' : 'default'}>
                {policy.is_draft_policy === 'y' ? 'Draft' : 'Active'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Insured Person Details Card */}
      <Card>
        <CardHeader className="bg-primary/5">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Insured Person Details
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Full Name</p>
                <p className="font-medium">{policy.insured_person_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date of Birth</p>
                <p className="font-medium">{formatDate(policy.dob)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Passport No.</p>
                <p className="font-medium font-mono">{policy.passport_no}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Phone className="h-4 w-4" /> Phone
                </p>
                <p className="font-medium">{policy.phone_no}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="h-4 w-4" /> Address
              </p>
              <p className="font-medium">{policy.insured_person_address}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    {/* Second Row - 2 Cards */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* Travel Details Card */}
      <Card>
        <CardHeader className="bg-primary/5">
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Travel Details
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Travel Plan</p>
              <p className="font-medium">{policy.travel_plan_name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Package</p>
              <p className="font-medium">{policy.travel_plan}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Travel Area</p>
              <p className="font-medium">{policy.travel_area}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Country</p>
              <p className="font-medium">{policy.country_name}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Premium Breakdown Card */}
      <Card>
        <CardHeader className="bg-primary/5">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Premium Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Base Premium</p>
              <p className="font-medium">
                {policy.currency_name} {formatCurrency(policy.currency_premium)}
              </p>
              <p className="text-xs text-muted-foreground">
                NPR {formatCurrency(policy.premium)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Stamp Duty</p>
              <p className="font-medium">NPR {formatCurrency(policy.stamp_duty)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">VAT Amount</p>
              <p className="font-medium">NPR {formatCurrency(policy.vat_amount)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    {/* Schedule of Benefits - Full Width */}
    <Card className="mb-6">
      <CardHeader className="bg-primary/5">
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Schedule of Benefits
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {policy.schedule_list.map((item: ScheduleItem, index: number) => (
            <div key={index} className="border rounded-lg p-4 hover:bg-muted/50 transition">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                  <p className="font-medium text-primary" 
                     dangerouslySetInnerHTML={{ __html: item.schedule_title }} 
                  />
                </div>
                <div className="md:col-span-1">
                  <p className="text-sm text-muted-foreground">Coverage</p>
                  <p className="font-medium">{item.schedule_description}</p>
                </div>
                <div className="md:col-span-1">
                  <p className="text-sm text-muted-foreground">Excess</p>
                  <p className="font-medium">{item.schedule_excess}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>

    {/* Children Information (if any) */}
    {policy.children_list && policy.children_list.length > 0 && (
      <Card>
        <CardHeader className="bg-primary/5">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Children Information
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {policy.children_list.map((child: any, index: number) => (
              <div key={index} className="border rounded-lg p-4">
                <p>Child {index + 1}</p>
                {/* Add child details here based on API response structure */}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )}
  </div>
</main>
      </div>
    </div>
  );
};