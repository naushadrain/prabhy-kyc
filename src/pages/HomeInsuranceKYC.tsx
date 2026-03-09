import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ArrowRight, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

export const HomeInsuranceKYC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [successModal, setSuccessModal] = useState(false);

  const steps = [
    { number: 1, label: t('homeInsurance.step1'), status: 'completed' },
    { number: 2, label: t('homeInsurance.step2'), status: 'completed' },
    { number: 3, label: t('homeInsurance.step3'), status: 'inProcess' },
    { number: 4, label: t('homeInsurance.step4'), status: 'pending' },
  ];

  return (
    <div className="flex min-h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-8 bg-background">
          {/* Stepper */}
          <div className="mb-12">
            <div className="flex items-center justify-between max-w-4xl mx-auto">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 text-sm font-bold ${
                      step.status === 'completed'
                        ? 'bg-green-500 text-white'
                        : step.status === 'inProcess'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {step.status === 'completed' ? '✓' : step.number}
                    </div>
                    <span className="text-xs text-center max-w-[120px] font-medium">
                      STEP {step.number}
                    </span>
                    <span className={`text-xs mt-1 ${
                      step.status === 'completed'
                        ? 'text-green-500'
                        : step.status === 'inProcess'
                        ? 'text-primary'
                        : 'text-orange-500'
                    }`}>
                      {step.status === 'completed'
                        ? 'Completed'
                        : step.status === 'inProcess'
                        ? t('claim.inProcess')
                        : t('claim.pending')}
                    </span>
                    <span className="text-xs text-center max-w-[120px] mt-1">{step.label}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="flex-1 h-0.5 bg-border mx-2" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Success Dialog */}
          <Dialog open={successModal} onOpenChange={() => {}}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-6 w-6" />
                  Policy Submitted!
                </DialogTitle>
              </DialogHeader>
              <div className="py-4 text-center">
                <p className="text-lg">Your home insurance policy has been submitted successfully.</p>
              </div>
              <DialogFooter>
                <Button
                  className="w-full"
                  onClick={() => { setSuccessModal(false); navigate('/dashboard'); }}
                >
                  Go to Dashboard
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Form */}
          <div className="max-w-4xl mx-auto">
            <Button
              variant="ghost"
              className="mb-4 gap-2"
              onClick={() => navigate('/home-premium-details')}
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </Button>

            <h1 className="text-2xl font-bold mb-2">KYC Details</h1>
            <p className="text-muted-foreground mb-8">Enter your Know Your Customer information.</p>

            <div className="space-y-6">
              {/* Personal Information */}
              <div>
                <h2 className="text-base font-semibold mb-4">Personal Information</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Full Name *</Label>
                    <Input className="mt-2" placeholder="Enter full name" />
                  </div>
                  <div>
                    <Label>Date of Birth *</Label>
                    <Input type="date" className="mt-2" />
                  </div>
                  <div>
                    <Label>Gender *</Label>
                    <Select>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Nationality *</Label>
                    <Select>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select nationality" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nepali">Nepali</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Identity Information */}
              <div>
                <h2 className="text-base font-semibold mb-4">Identity Information</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>ID Type *</Label>
                    <Select>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select ID type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="citizenship">Citizenship</SelectItem>
                        <SelectItem value="passport">Passport</SelectItem>
                        <SelectItem value="license">Driving License</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>ID Number *</Label>
                    <Input className="mt-2" placeholder="Enter ID number" />
                  </div>
                  <div>
                    <Label>Issued District *</Label>
                    <Input className="mt-2" placeholder="Enter issued district" />
                  </div>
                  <div>
                    <Label>Issued Date *</Label>
                    <Input type="date" className="mt-2" />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h2 className="text-base font-semibold mb-4">Contact Information</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Mobile Number *</Label>
                    <Input className="mt-2" placeholder="Enter mobile number" />
                  </div>
                  <div>
                    <Label>Email Address</Label>
                    <Input type="email" className="mt-2" placeholder="Enter email address" />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Permanent Address *</Label>
                    <Input className="mt-2" placeholder="Enter permanent address" />
                  </div>
                </div>
              </div>

              {/* Property Address */}
              <div>
                <h2 className="text-base font-semibold mb-4">Property Address</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Province *</Label>
                    <Select>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select province" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Province No. 1</SelectItem>
                        <SelectItem value="2">Madhesh Province</SelectItem>
                        <SelectItem value="3">Bagmati Province</SelectItem>
                        <SelectItem value="4">Gandaki Province</SelectItem>
                        <SelectItem value="5">Lumbini Province</SelectItem>
                        <SelectItem value="6">Karnali Province</SelectItem>
                        <SelectItem value="7">Sudurpashchim Province</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>District *</Label>
                    <Select>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select district" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kathmandu">Kathmandu</SelectItem>
                        <SelectItem value="lalitpur">Lalitpur</SelectItem>
                        <SelectItem value="bhaktapur">Bhaktapur</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Municipality / VDC *</Label>
                    <Input className="mt-2" placeholder="Enter municipality or VDC" />
                  </div>
                  <div>
                    <Label>Ward No. *</Label>
                    <Input className="mt-2" placeholder="Enter ward number" />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Street / Tole</Label>
                    <Input className="mt-2" placeholder="Enter street or tole" />
                  </div>
                </div>
              </div>

              {/* Nominee Details */}
              <div>
                <h2 className="text-base font-semibold mb-4">Nominee Details</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Nominee Name *</Label>
                    <Input className="mt-2" placeholder="Enter nominee name" />
                  </div>
                  <div>
                    <Label>Relationship *</Label>
                    <Select>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select relationship" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="spouse">Spouse</SelectItem>
                        <SelectItem value="parent">Parent</SelectItem>
                        <SelectItem value="child">Child</SelectItem>
                        <SelectItem value="sibling">Sibling</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Nominee Contact *</Label>
                    <Input className="mt-2" placeholder="Enter nominee contact" />
                  </div>
                  <div>
                    <Label>Nominee Date of Birth</Label>
                    <Input type="date" className="mt-2" />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between pt-6">
                <Button
                  variant="outline"
                  className="gap-2 text-primary border-primary"
                  onClick={() => navigate('/home-premium-details')}
                >
                  <ChevronLeft className="w-4 h-4" />
                  BACK
                </Button>
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90 gap-2 px-10"
                  onClick={() => setSuccessModal(true)}
                >
                  NEXT <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
