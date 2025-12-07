import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const TransactionHistory = () => {
  const { t } = useLanguage();

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-8">
          <div className="bg-card rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-primary hover:bg-primary">
                  <TableHead className="text-primary-foreground">{t('transaction.sn')}</TableHead>
                  <TableHead className="text-primary-foreground">{t('transaction.userName')}</TableHead>
                  <TableHead className="text-primary-foreground">{t('transaction.transactionId')}</TableHead>
                  <TableHead className="text-primary-foreground">{t('transaction.amount')}</TableHead>
                  <TableHead className="text-primary-foreground">{t('transaction.serviceProvider')}</TableHead>
                  <TableHead className="text-primary-foreground">{t('transaction.requestDate')}</TableHead>
                  <TableHead className="text-primary-foreground">{t('transaction.paymentStatus')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    {t('transaction.noRows')}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>

            <div className="border-t border-border px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <span>{t('transaction.rowsPerPage')}</span>
                <Select defaultValue="100">
                  <SelectTrigger className="w-20 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-sm">1-0 of</span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
