import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Eye, Download, Printer } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPolicyList, printPolicyPdf } from '@/api/policy/policyList';

// Types
interface Policy {
  created_date: string;
  effective_date: string;
  expiry_date: string;
  policy_number: string;
  expiry_status: string;
  total_premium: string;
  insured_name: string;
  product_name: string;
  payment_status: string;
  policy_status: string;
  policy_remarks: string;
  is_draft_policy: string;
}

export const MyPolicies = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  
  // Data states
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [filteredPolicies, setFilteredPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Filter states
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [insuredName, setInsuredName] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('policy');
  
  // Pagination
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Fetch policies on mount
  useEffect(() => {
    fetchPolicies();
  }, []);

  // Apply filters
  useEffect(() => {
    filterPolicies();
  }, [policies, dateFrom, dateTo, insuredName, activeTab]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [rowsPerPage, filteredPolicies.length]);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const response = await getPolicyList(81);
      if (response.process_result && response.policy_list) {
        setPolicies(response.policy_list);
      }
    } catch (err) {
      console.error('Error fetching policies:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterPolicies = () => {
    let filtered = [...policies];

    // Filter by tab
    if (activeTab === 'expired') {
      filtered = filtered.filter(p => p.expiry_status === 'Expired');
    } else {
      filtered = filtered.filter(p => p.expiry_status !== 'Expired');
    }

    // Filter by date range
    if (dateFrom) {
      filtered = filtered.filter(p => {
        const policyDate = p.created_date.split('/').reverse().join('-');
        return policyDate >= dateFrom;
      });
    }

    if (dateTo) {
      filtered = filtered.filter(p => {
        const policyDate = p.created_date.split('/').reverse().join('-');
        return policyDate <= dateTo;
      });
    }

    // Filter by insured name
    if (insuredName.trim()) {
      filtered = filtered.filter(p =>
        p.insured_name.toLowerCase().includes(insuredName.toLowerCase())
      );
    }

    setFilteredPolicies(filtered);
  };

  const handleSearch = () => filterPolicies();
  
  const handleReset = () => {
    setDateFrom('');
    setDateTo('');
    setInsuredName('');
    setCurrentPage(1);
  };

  const handleViewPolicy = (policy: Policy) => {
    navigate(`/policy-details/${encodeURIComponent(policy.policy_number)}`);
  };

  const handleDownloadPDF = async (policy: Policy) => {
    try {
      const pdfBlob = await printPolicyPdf(81, policy.policy_number);
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `Policy_${policy.policy_number.replace(/[\/\\]/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 100);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  const handlePrintPDF = async (policy: Policy) => {
    try {
      const pdfBlob = await printPolicyPdf(81, policy.policy_number);
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const printWindow = window.open(pdfUrl, '_blank');
      if (printWindow) {
        printWindow.onload = () => printWindow.print();
      }
    } catch (error) {
      console.error("Print failed:", error);
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredPolicies.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, filteredPolicies.length);
  const currentPolicies = filteredPolicies.slice(startIndex, endIndex);

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-NP', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(parseFloat(amount));
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'paid') {
      return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Paid</span>;
    } else if (statusLower === 'unpaid') {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">Unpaid</span>;
    }
    return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">{status}</span>;
  };

  const getPolicyStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('approval pending')) {
      return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">Pending</span>;
    } else if (statusLower.includes('approved')) {
      return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Approved</span>;
    } else if (statusLower.includes('rejected')) {
      return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">Rejected</span>;
    }
    return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">{status}</span>;
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-8 bg-background">
          {/* Search Filters */}
          <div className="flex flex-wrap gap-4 mb-6 items-end">
            <div>
              <label className="text-sm font-medium mb-1 block">Date From</label>
              <Input 
                type="date" 
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-48"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Date To</label>
              <Input 
                type="date" 
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-48"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Insured Name</label>
              <Input 
                type="text" 
                placeholder="Search by name"
                value={insuredName}
                onChange={(e) => setInsuredName(e.target.value)}
                className="w-64"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSearch} className="bg-primary hover:bg-primary/90">
                Search
              </Button>
              <Button variant="outline" onClick={handleReset}>
                Reset
              </Button>
            </div>
          </div>

          <Tabs defaultValue="policy" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="bg-muted">
              <TabsTrigger value="policy">
                Active Policies ({policies.filter(p => p.expiry_status !== 'Expired').length})
              </TabsTrigger>
              <TabsTrigger value="expired">
                Expired Policies ({policies.filter(p => p.expiry_status === 'Expired').length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="policy" className="mt-6">
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-primary hover:bg-primary">
                      <TableHead className="text-primary-foreground font-bold">S.N.</TableHead>
                      <TableHead className="text-primary-foreground font-bold">Insured Name</TableHead>
                      <TableHead className="text-primary-foreground font-bold">Product</TableHead>
                      <TableHead className="text-primary-foreground font-bold">Created Date</TableHead>
                      <TableHead className="text-primary-foreground font-bold">Expiry Date</TableHead>
                      <TableHead className="text-primary-foreground font-bold">Policy Number</TableHead>
                      <TableHead className="text-primary-foreground font-bold">Premium (NPR)</TableHead>
                      <TableHead className="text-primary-foreground font-bold">Payment</TableHead>
                      <TableHead className="text-primary-foreground font-bold">Status</TableHead>
                      <TableHead className="text-primary-foreground font-bold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-12">
                          <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : currentPolicies.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                          No policies found
                        </TableCell>
                      </TableRow>
                    ) : (
                      currentPolicies.map((policy, index) => (
                        <TableRow key={policy.policy_number} className="hover:bg-muted/50">
                          <TableCell>{startIndex + index + 1}</TableCell>
                          <TableCell className="font-medium">{policy.insured_name}</TableCell>
                          <TableCell>{policy.product_name}</TableCell>
                          <TableCell>{policy.created_date}</TableCell>
                          <TableCell>{policy.expiry_date}</TableCell>
                          <TableCell>
                            <span className="font-mono text-sm">{policy.policy_number}</span>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(policy.total_premium)}
                          </TableCell>
                          <TableCell>{getPaymentStatusBadge(policy.payment_status)}</TableCell>
                          <TableCell>{getPolicyStatusBadge(policy.policy_status)}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleViewPolicy(policy)}
                                title="View Policy"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleDownloadPDF(policy)}
                                title="Download PDF"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handlePrintPDF(policy)}
                                title="Print Policy"
                              >
                                <Printer className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  Rows per page
                  <Select 
                    value={rowsPerPage.toString()} 
                    onValueChange={(v) => setRowsPerPage(Number(v))}
                  >
                    <SelectTrigger className="w-16">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">
                    {filteredPolicies.length > 0 
                      ? `${startIndex + 1}–${endIndex} of ${filteredPolicies.length}`
                      : '0–0 of 0'
                    }
                  </span>
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1 || filteredPolicies.length === 0}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages || filteredPolicies.length === 0}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="expired" className="mt-6">
              {/* Same table for expired - can reuse or separate component */}
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-primary hover:bg-primary">
                      <TableHead className="text-primary-foreground font-bold">S.N.</TableHead>
                      <TableHead className="text-primary-foreground font-bold">Insured Name</TableHead>
                      <TableHead className="text-primary-foreground font-bold">Product</TableHead>
                      <TableHead className="text-primary-foreground font-bold">Created Date</TableHead>
                      <TableHead className="text-primary-foreground font-bold">Expiry Date</TableHead>
                      <TableHead className="text-primary-foreground font-bold">Policy Number</TableHead>
                      <TableHead className="text-primary-foreground font-bold">Premium (NPR)</TableHead>
                      <TableHead className="text-primary-foreground font-bold">Payment</TableHead>
                      <TableHead className="text-primary-foreground font-bold">Status</TableHead>
                      <TableHead className="text-primary-foreground font-bold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentPolicies.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                          No expired policies found
                        </TableCell>
                      </TableRow>
                    ) : (
                      currentPolicies.map((policy, index) => (
                        <TableRow key={policy.policy_number} className="hover:bg-muted/50">
                          <TableCell>{startIndex + index + 1}</TableCell>
                          <TableCell className="font-medium">{policy.insured_name}</TableCell>
                          <TableCell>{policy.product_name}</TableCell>
                          <TableCell>{policy.created_date}</TableCell>
                          <TableCell>{policy.expiry_date}</TableCell>
                          <TableCell>
                            <span className="font-mono text-sm">{policy.policy_number}</span>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(policy.total_premium)}
                          </TableCell>
                          <TableCell>{getPaymentStatusBadge(policy.payment_status)}</TableCell>
                          <TableCell>{getPolicyStatusBadge(policy.policy_status)}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="icon" onClick={() => handleViewPolicy(policy)} title="View">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDownloadPDF(policy)} title="Download">
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handlePrintPDF(policy)} title="Print">
                                <Printer className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};