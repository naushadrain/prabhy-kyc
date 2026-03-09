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
import { Search, ChevronLeft, ChevronRight, CreditCard } from 'lucide-react';
import { useState } from 'react';

export default function DraftPolicyPage() {
  const { t } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const columns = [
    t('transaction.sn'),
    t('claimTracking.insuredName'),
    t('draftPolicy.productName'),
    t('draftPolicy.createdDate'),
    t('draftPolicy.acceptanceNo'),
    t('draftPolicy.proformaNo'),
    'Valid To',
    t('draftPolicy.status'),
    t('draftPolicy.remarks'),
    'Action',
  ];

  const PaginatedTable = () => (
    <>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-primary hover:bg-primary">
              {columns.map((col) => (
                <TableHead key={col} className="text-primary-foreground font-semibold whitespace-nowrap">
                  {col}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center py-14 text-muted-foreground">
                {t('transaction.noRows')}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {t('transaction.rowsPerPage')}
          <Select defaultValue="10">
            <SelectTrigger className="w-16 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">1–0 of 0</span>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" disabled className="h-8 w-8">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" disabled className="h-8 w-8">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-6 lg:p-8 bg-background">
          {/* Page Title */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold leading-tight">{t('nav.draftPolicyPayment')}</h1>
              <p className="text-sm text-muted-foreground">View and pay your pending draft policies</p>
            </div>
          </div>

          {/* Search bar */}
          <div className="flex gap-3 mb-6 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Search by name or policy number..."
                className="pl-9"
              />
            </div>
            <Button className="bg-primary hover:bg-primary/90 gap-2 shrink-0">
              <Search className="w-4 h-4" />
              {t('myPolicies.search')}
            </Button>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="approved" className="w-full">
            <TabsList className="bg-muted mb-6">
              <TabsTrigger
                value="approved"
                className="data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary"
              >
                {t('draftPolicy.approvedDraft')}
              </TabsTrigger>
              <TabsTrigger
                value="unapproved"
                className="data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary"
              >
                {t('draftPolicy.unapprovedDraft')}
              </TabsTrigger>
              <TabsTrigger
                value="rejected"
                className="data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary"
              >
                {t('draftPolicy.rejectedDraft')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="approved">
              <PaginatedTable />
            </TabsContent>
            <TabsContent value="unapproved">
              <PaginatedTable />
            </TabsContent>
            <TabsContent value="rejected">
              <PaginatedTable />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
