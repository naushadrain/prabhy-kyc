import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useState } from 'react';

export const FAQ = () => {
  const { t } = useLanguage();

  const faqs = [
    { id: 'q1', question: t('faq.q1') },
    { id: 'q2', question: t('faq.q2') },
    { id: 'q3', question: t('faq.q3') },
    { id: 'q4', question: t('faq.q4') },
    { id: 'q5', question: t('faq.q5') },
    { id: 'q6', question: t('faq.q6') },
    { id: 'q7', question: t('faq.q7') },
    { id: 'q8', question: t('faq.q8') },
    { id: 'q9', question: t('faq.q9') },
    { id: 'q10', question: t('faq.q10') },
  ];
const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  return (
    <div className="flex min-h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-8">
          <h1 className="text-4xl font-bold mb-2">
            Frequently Asked <span className="text-secondary">Questions</span>
          </h1>

          <div className="mt-8 space-y-2">
            <Accordion type="single" collapsible className="space-y-2">
              {faqs.map((faq) => (
                <AccordionItem 
                  key={faq.id} 
                  value={faq.id}
                  className="bg-primary text-primary-foreground rounded-lg px-6 border-none"
                >
                  <AccordionTrigger className="hover:no-underline py-4">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-primary-foreground/90 pb-4">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </main>
      </div>
    </div>
  );
};
