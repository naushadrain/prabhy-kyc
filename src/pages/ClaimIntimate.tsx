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
import { Plus } from 'lucide-react';

export const ClaimIntimate = () => {
  const { t } = useLanguage();

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-8 bg-background">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">{t('claimIntimate.title')}</h1>
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
                      <TableHead className="text-primary-foreground font-bold">{t('claimTracking.insuredName')}</TableHead>
                      <TableHead className="text-primary-foreground font-bold">{t('claimIntimate.address')}</TableHead>
                      <TableHead className="text-primary-foreground font-bold">{t('claimIntimate.intimationDate')}</TableHead>
                      <TableHead className="text-primary-foreground font-bold">{t('claimIntimate.claimStatus')}</TableHead>
                      <TableHead className="text-primary-foreground font-bold">{t('claimTracking.action')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12">
                        <div className="flex justify-center">
                          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-end mt-4">
                <span className="text-sm text-muted-foreground">1–0 of</span>
              </div>
            </TabsContent>

            <TabsContent value="others" className="mt-6">
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-primary hover:bg-primary">
                      <TableHead className="text-primary-foreground font-bold">{t('transaction.sn')}</TableHead>
                      <TableHead className="text-primary-foreground font-bold">{t('claimTracking.insuredName')}</TableHead>
                      <TableHead className="text-primary-foreground font-bold">{t('claimIntimate.address')}</TableHead>
                      <TableHead className="text-primary-foreground font-bold">{t('claimIntimate.intimationDate')}</TableHead>
                      <TableHead className="text-primary-foreground font-bold">{t('claimIntimate.claimStatus')}</TableHead>
                      <TableHead className="text-primary-foreground font-bold">{t('claimTracking.action')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                        {t('transaction.noRows')}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-end mt-4">
                <span className="text-sm text-muted-foreground">1–0 of</span>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};
