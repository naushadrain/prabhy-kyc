// src/pages/policy/PolicyDetails.tsx

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft,
  User,
  MapPin,
  FileText,
  Shield,
  DollarSign,
  Car,
} from 'lucide-react';
import { getPolicyDetail } from '@/api/policy/policyList';

const fmt = (v: number | string | undefined | null) => {
  const n = Number(v ?? 0);
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium">{value ?? '—'}</p>
    </div>
  );
}

export const PolicyDetails = () => {
  const { policyNo } = useParams<{ policyNo: string }>();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [policy, setPolicy] = useState<any>(null);
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
      const response = await getPolicyDetail(policyNumber);

      if (response.process_result && response.policy_number) {
        setPolicy(response);
      } else {
        const msg = (response as any)?.error_list?.[0]?.error_message || 'Failed to load policy details';
        setError(msg);
      }
    } catch (err: any) {
      setError(err?.message || 'Error loading policy details');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => navigate('/my-draft-policy');

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col">
          <Header onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 p-8 bg-background">
            <div className="max-w-6xl mx-auto flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
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
            <div className="max-w-6xl mx-auto text-center py-12">
              <p className="text-red-500">{error || 'Policy not found'}</p>
              <Button onClick={handleBack} className="mt-4">Back to Policies</Button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const amount = policy.amount_info;
  const classInfo = policy.class_info;

  return (
    <div className="flex min-h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 bg-background p-6">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <button
                onClick={handleBack}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft size={20} />
                <span>Back</span>
              </button>

              <div className="flex items-center gap-3 mt-2">
                <h1 className="text-2xl font-bold">Policy Details</h1>
                <Badge variant={policy.is_draft_policy === 'y' ? 'outline' : 'default'}>
                  {policy.is_draft_policy === 'y' ? 'Draft' : 'Active'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Policy Number: <span className="font-mono font-medium">{policy.policy_number}</span>
              </p>
            </div>

            {/* Row 1: Policy Summary + Insured Person */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Policy Summary */}
              <Card>
                <CardHeader className="bg-primary/5">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" /> Policy Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <InfoRow label="Issue Date" value={policy.policy_issue_date} />
                    <InfoRow label="Time" value={policy.createdTime} />
                    <InfoRow label="Effective Date" value={policy.effective_date} />
                    <InfoRow label="Expiry Date" value={policy.expiry_date} />
                    <InfoRow label="Duration" value={`${policy.no_of_days} Days`} />
                    <InfoRow label="Fiscal Year" value={policy.fiscal_year} />
                    <InfoRow label="Branch" value={policy.branch_name_english} />
                    <InfoRow label="Cover Type" value={classInfo?.cover_type_id} />
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <DollarSign className="h-4 w-4" /> Total Premium
                      </p>
                      <p className="font-bold text-lg text-primary">
                        NPR {fmt(amount?.total_amount)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Insured Person */}
              <Card>
                <CardHeader className="bg-primary/5">
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" /> Insured Person
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <InfoRow label="Full Name" value={policy.insured_person_name} />
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-4 w-4" /> Address
                      </p>
                      <p className="font-medium">{policy.insured_person_address || '—'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Row 2: Vehicle Details + Premium Breakdown */}
            {classInfo && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Vehicle Details */}
                <Card>
                  <CardHeader className="bg-primary/5">
                    <CardTitle className="flex items-center gap-2">
                      <Car className="h-5 w-5" /> Vehicle Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-2 gap-4">
                      <InfoRow label="Vehicle Type" value={classInfo.vehicle_type} />
                      <InfoRow label="Manufacturer" value={classInfo.manufacturing_company} />
                      <InfoRow label="Model" value={classInfo.model_number} />
                      <InfoRow label="Manufacture Year" value={classInfo.manufacture_year} />
                      <InfoRow label="Engine CC" value={classInfo.engine_capcity_cc} />
                      <InfoRow label="Vehicle Age" value={`${classInfo.vehicle_age_in_years} Years`} />
                      <InfoRow label="Registration No." value={classInfo.registration_number} />
                      <InfoRow label="Chassis No." value={classInfo.chassis_number} />
                      <InfoRow label="Engine No." value={classInfo.engine_number} />
                      <InfoRow label="Billbook No." value={classInfo.billbook_number} />
                      <InfoRow label="Billbook Expiry" value={classInfo.billbook_exp_date} />
                      <InfoRow label="Sum Insured" value={`NPR ${fmt(classInfo.vehicle_suminsured_amount)}`} />
                      <InfoRow label="Voluntary Excess" value={fmt(classInfo.voluntary_excess)} />
                      <InfoRow label="Compulsory Excess" value={fmt(classInfo.compulsory_excess)} />
                      <InfoRow label="Driver Seats" value={classInfo.driver_seat_capacity} />
                      <InfoRow label="Passenger Seats" value={classInfo.passenger_seat_capacity} />
                    </div>
                  </CardContent>
                </Card>

                {/* Premium Breakdown */}
                {amount && (
                  <Card>
                    <CardHeader className="bg-primary/5">
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" /> Premium Breakdown
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="rounded-lg overflow-hidden border">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-primary text-primary-foreground">
                              <th className="text-left px-4 py-3 font-semibold">Description</th>
                              <th className="text-right px-4 py-3 font-semibold">Amount (NPR)</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="bg-background">
                              <td className="px-4 py-3 text-muted-foreground">Sum Insured</td>
                              <td className="px-4 py-3 text-right font-medium">{fmt(amount.suminsured)}</td>
                            </tr>
                            <tr className="bg-muted/40">
                              <td className="px-4 py-3 text-muted-foreground">Premium Amount</td>
                              <td className="px-4 py-3 text-right font-medium">{fmt(amount.premium_amount)}</td>
                            </tr>
                            {Number(amount.tpl_amount) > 0 && (
                              <tr className="bg-background">
                                <td className="px-4 py-3 text-muted-foreground">Third Party Liability</td>
                                <td className="px-4 py-3 text-right font-medium">{fmt(amount.tpl_amount)}</td>
                              </tr>
                            )}
                            {Number(amount.pool_amount) > 0 && (
                              <tr className="bg-muted/40">
                                <td className="px-4 py-3 text-muted-foreground">Pool Contribution</td>
                                <td className="px-4 py-3 text-right font-medium">{fmt(amount.pool_amount)}</td>
                              </tr>
                            )}
                            {Number(amount.pa_amount) > 0 && (
                              <tr className="bg-background">
                                <td className="px-4 py-3 text-muted-foreground">PA Amount</td>
                                <td className="px-4 py-3 text-right font-medium">{fmt(amount.pa_amount)}</td>
                              </tr>
                            )}
                            <tr className="bg-muted/40">
                              <td className="px-4 py-3 text-muted-foreground">Taxable Amount</td>
                              <td className="px-4 py-3 text-right font-medium">{fmt(amount.taxable_amount)}</td>
                            </tr>
                            <tr className="bg-background">
                              <td className="px-4 py-3 text-muted-foreground">VAT ({amount.vat_percent}%)</td>
                              <td className="px-4 py-3 text-right font-medium">{fmt(amount.vat_amount)}</td>
                            </tr>
                            <tr className="bg-muted/40">
                              <td className="px-4 py-3 text-muted-foreground">Stamp Duty</td>
                              <td className="px-4 py-3 text-right font-medium">{fmt(amount.stamp_duty)}</td>
                            </tr>
                            <tr className="border-t-2 bg-primary/5">
                              <td className="px-4 py-4 font-bold text-primary">Total Premium</td>
                              <td className="px-4 py-4 text-right font-bold text-primary text-base">
                                {fmt(amount.total_amount)}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Schedule of Benefits (if present - for travel policies) */}
            {policy.schedule_list && policy.schedule_list.length > 0 && (
              <Card className="mb-6">
                <CardHeader className="bg-primary/5">
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" /> Schedule of Benefits
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {policy.schedule_list.map((item: any, index: number) => (
                      <div key={index} className="border rounded-lg p-4 hover:bg-muted/50 transition">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <p className="font-medium text-primary"
                               dangerouslySetInnerHTML={{ __html: item.schedule_title }}
                            />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Coverage</p>
                            <p className="font-medium">{item.schedule_description}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Excess</p>
                            <p className="font-medium">{item.schedule_excess}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Children (if present - for travel policies) */}
            {policy.children_list && policy.children_list.length > 0 && (
              <Card className="mb-6">
                <CardHeader className="bg-primary/5">
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" /> Children Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {policy.children_list.map((child: any, index: number) => (
                      <div key={index} className="border rounded-lg p-4">
                        <p className="font-medium">Child {index + 1}: {child.children_name || '—'}</p>
                        {child.children_dob && (
                          <p className="text-sm text-muted-foreground mt-1">DOB: {child.children_dob}</p>
                        )}
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
