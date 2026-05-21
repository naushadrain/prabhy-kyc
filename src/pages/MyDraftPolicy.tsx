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
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPolicyList, printPolicyPdf } from '@/api/policy/policyList';
import { Policy } from '@/types/policy/types';

export const MyDraftPolicy = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  const [policies, setPolicies] = useState<Policy[]>([]);
  const [filteredPolicies, setFilteredPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [insuredName, setInsuredName] = useState<string>('');
  const [policyNumber, setPolicyNumber] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('all');

  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    fetchPolicies();
  }, []);

  useEffect(() => {
    filterPolicies();
  }, [policies, dateFrom, dateTo, insuredName, policyNumber, activeTab]);

  useEffect(() => {
    setCurrentPage(1);
  }, [rowsPerPage, filteredPolicies.length, activeTab]);

  const normalizeStatus = (status?: string) => status?.trim().toLowerCase() || '';

  const isExcludedStatus = (policy: Policy) => {
    return normalizeStatus(policy.policy_status) === 'accepted, payment pending';
  };

  const getPolicyBucket = (policy: Policy) => {
    const status = normalizeStatus(policy.policy_status);

    if (status.includes('reject')) return 'rejected';

    if (
      status.includes('approval pending') ||
      status.includes('pending') ||
      status.includes('unapproved') ||
      status.includes('payment pending')
    ) {
      return 'unapproved';
    }

    return 'other';
  };

  const allCount = useMemo(() => {
    return policies.filter((p) => !isExcludedStatus(p)).length;
  }, [policies]);

  const unapprovedCount = useMemo(() => {
    return policies.filter(
      (p) => !isExcludedStatus(p) && getPolicyBucket(p) === 'unapproved'
    ).length;
  }, [policies]);

  const rejectedCount = useMemo(() => {
    return policies.filter(
      (p) => !isExcludedStatus(p) && getPolicyBucket(p) === 'rejected'
    ).length;
  }, [policies]);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const response = await getPolicyList();

      if (response?.process_result && Array.isArray(response.policy_list)) {
        const filteredList = response.policy_list.filter(
          (policy: Policy) => !isExcludedStatus(policy)
        );
        setPolicies(filteredList);
      } else {
        setPolicies([]);
      }
    } catch (error) {
      console.error('Error fetching policies:', error);
      setPolicies([]);
    } finally {
      setLoading(false);
    }
  };

  const convertDdMmYyyyToIso = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('/');
    if (parts.length !== 3) return '';
    const [dd, mm, yyyy] = parts;
    return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
  };

  const filterPolicies = () => {
    let filtered = [...policies];

    filtered = filtered.filter((p) => !isExcludedStatus(p));

    if (activeTab === 'unapproved') {
      filtered = filtered.filter((p) => getPolicyBucket(p) === 'unapproved');
    } else if (activeTab === 'rejected') {
      filtered = filtered.filter((p) => getPolicyBucket(p) === 'rejected');
    }

    if (dateFrom) {
      filtered = filtered.filter((p) => {
        const policyDate = convertDdMmYyyyToIso(p.created_date);
        return policyDate ? policyDate >= dateFrom : false;
      });
    }

    if (dateTo) {
      filtered = filtered.filter((p) => {
        const policyDate = convertDdMmYyyyToIso(p.created_date);
        return policyDate ? policyDate <= dateTo : false;
      });
    }

    if (insuredName.trim()) {
      filtered = filtered.filter((p) =>
        (p.insured_name || '').toLowerCase().includes(insuredName.toLowerCase())
      );
    }

    if (policyNumber.trim()) {
      filtered = filtered.filter((p) =>
        (p.document_number || '').toLowerCase().includes(policyNumber.toLowerCase())
      );
    }

    setFilteredPolicies(filtered);
  };

  const handleSearch = () => {
    filterPolicies();
  };

  const handleReset = () => {
    setDateFrom('');
    setDateTo('');
    setInsuredName('');
    setPolicyNumber('');
    setCurrentPage(1);
    setActiveTab('all');
  };

  const handleViewPolicy = (policy: Policy) => {
    navigate(`/policy-details/${encodeURIComponent(policy.document_number)}`);
  };

  const handleDownloadPDF = async (policy: Policy) => {
    try {
      const resp = await printPolicyPdf(policy.document_number);
      const pdfLink = resp?.print_link;
      if (pdfLink) {
        window.open(pdfLink, '_blank');
      }
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handlePrintPDF = async (policy: Policy) => {
    try {
      const resp = await printPolicyPdf(policy.document_number);
      const pdfLink = resp?.print_link;
      if (pdfLink) {
        window.open(pdfLink, '_blank');
      }
    } catch (error) {
      console.error('Print failed:', error);
    }
  };

  const totalPages = Math.max(1, Math.ceil(filteredPolicies.length / rowsPerPage));
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, filteredPolicies.length);
  const currentPolicies = filteredPolicies.slice(startIndex, endIndex);

  const getStatusBadge = (status: string) => {
    const statusLower = normalizeStatus(status);

    if (statusLower.includes('pending') || statusLower.includes('unapproved')) {
      return (
        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
          {status}
        </span>
      );
    }

    if (statusLower.includes('reject')) {
      return (
        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
          {status}
        </span>
      );
    }

    return (
      <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
        {status}
      </span>
    );
  };

  const renderTable = (emptyText: string) => (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-primary hover:bg-primary">
            <TableHead className="text-primary-foreground font-bold">{t('transaction.sn')}</TableHead>
            <TableHead className="text-primary-foreground font-bold">{t('claimTracking.insuredName')}</TableHead>
            <TableHead className="text-primary-foreground font-bold">{t('draftPolicy.productName')}</TableHead>
            <TableHead className="text-primary-foreground font-bold">{t('draftPolicy.createdDate')}</TableHead>
            <TableHead className="text-primary-foreground font-bold">{t('draftPolicy.acceptanceNo')}</TableHead>
            <TableHead className="text-primary-foreground font-bold">{t('draftPolicy.proformaNo')}</TableHead>
            <TableHead className="text-primary-foreground font-bold">Policy No</TableHead>
            <TableHead className="text-primary-foreground font-bold">{t('draftPolicy.status')}</TableHead>
            <TableHead className="text-primary-foreground font-bold">{t('claimTracking.action')}</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-12">
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              </TableCell>
            </TableRow>
          ) : currentPolicies.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                {emptyText}
              </TableCell>
            </TableRow>
          ) : (
            currentPolicies.map((policy, index) => (
              <TableRow key={`${policy.document_number}-${index}`} className="hover:bg-muted/50">
                <TableCell>{startIndex + index + 1}</TableCell>
                <TableCell className="font-medium">{policy.insured_name}</TableCell>
                <TableCell>{policy.product_name}</TableCell>
                <TableCell>{policy.created_date}</TableCell>
                <TableCell>{policy.policy_number || '-'}</TableCell>
                <TableCell>{policy.total_premium || '-'}</TableCell>
                <TableCell>
                  <span className="font-mono text-sm">{policy.document_number}</span>
                </TableCell>
                <TableCell>{getStatusBadge(policy.policy_status)}</TableCell>
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
  );

  return (
    <div className="flex min-h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-8 bg-background">
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

            <div>
              <label className="text-sm font-medium mb-1 block">Policy Number</label>
              <Input
                type="text"
                placeholder="Search by policy number"
                value={policyNumber}
                onChange={(e) => setPolicyNumber(e.target.value)}
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

          <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="bg-muted">
              <TabsTrigger value="all">
                All ({allCount})
              </TabsTrigger>
              <TabsTrigger value="unapproved">
                Unapproved ({unapprovedCount})
              </TabsTrigger>
              <TabsTrigger value="rejected">
                Rejected ({rejectedCount})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              {renderTable(t('transaction.noRows'))}

              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {t('transaction.rowsPerPage')}
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
                      : '0–0 of 0'}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1 || filteredPolicies.length === 0}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages || filteredPolicies.length === 0}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="unapproved" className="mt-6">
              {renderTable(t('transaction.noRows'))}
            </TabsContent>

            <TabsContent value="rejected" className="mt-6">
              {renderTable(t('transaction.noRows'))}
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};