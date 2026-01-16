import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
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
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useState } from 'react';

export const ClaimTracking = () => {
  const { t } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  return (
    <div className="flex min-h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-8 bg-background">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">{t('claimTracking.title')}</h1>
            <Button className="bg-primary hover:bg-primary/90 gap-2">
              {t('claimTracking.claimInitimation')} <Plus className="w-4 h-4" />
            </Button>
          </div>

          <Tabs defaultValue="self" className="w-full">
            <TabsList className="bg-muted">
              <TabsTrigger
                value="self"
                className="data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary"
              >
                {t('claimTracking.selfList')}
              </TabsTrigger>
              <TabsTrigger
                value="others"
                className="data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary"
              >
                {t('claimTracking.othersList')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="self" className="mt-6">
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-primary hover:bg-primary">
                      <TableHead className="text-primary-foreground font-bold">{t('transaction.sn')}</TableHead>
                      <TableHead className="text-primary-foreground font-bold">{t('claimTracking.claimNo')}</TableHead>
                      <TableHead className="text-primary-foreground font-bold">{t('claimTracking.policyNo')}</TableHead>
                      <TableHead className="text-primary-foreground font-bold">{t('claimTracking.regDate')}</TableHead>
                      <TableHead className="text-primary-foreground font-bold">{t('claimTracking.insuredName')}</TableHead>
                      <TableHead className="text-primary-foreground font-bold">{t('claimTracking.vehicleNumber')}</TableHead>
                      <TableHead className="text-primary-foreground font-bold">{t('claimTracking.documentNumber')}</TableHead>
                      <TableHead className="text-primary-foreground font-bold">Su...</TableHead>
                      <TableHead className="text-primary-foreground font-bold">{t('claimTracking.action')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                        {t('transaction.noRows')}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {t('transaction.rowsPerPage')}
                  <Select defaultValue="10">
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
                  <span className="text-sm text-muted-foreground">1–0 of</span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" disabled>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" disabled>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="others" className="mt-6">
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-primary hover:bg-primary">
                      <TableHead className="text-primary-foreground font-bold">{t('transaction.sn')}</TableHead>
                      <TableHead className="text-primary-foreground font-bold">{t('claimTracking.claimNo')}</TableHead>
                      <TableHead className="text-primary-foreground font-bold">{t('claimTracking.policyNo')}</TableHead>
                      <TableHead className="text-primary-foreground font-bold">{t('claimTracking.regDate')}</TableHead>
                      <TableHead className="text-primary-foreground font-bold">{t('claimTracking.insuredName')}</TableHead>
                      <TableHead className="text-primary-foreground font-bold">{t('claimTracking.vehicleNumber')}</TableHead>
                      <TableHead className="text-primary-foreground font-bold">{t('claimTracking.documentNumber')}</TableHead>
                      <TableHead className="text-primary-foreground font-bold">Su...</TableHead>
                      <TableHead className="text-primary-foreground font-bold">{t('claimTracking.action')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                        {t('transaction.noRows')}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {t('transaction.rowsPerPage')}
                  <Select defaultValue="10">
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
                  <span className="text-sm text-muted-foreground">1–0 of</span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" disabled>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" disabled>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};
