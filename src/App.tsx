// src/App.tsx (or App.jsx)
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";

import { Home } from "./pages/Home";
import { Login } from "./pages/auth/Login";
import { Register } from "./pages/auth/Register";
import { Dashboard } from "./pages/Dashboard";
import { Claim } from "./pages/Claim";
import { ChangePassword } from "./pages/changePassword/ChangePassword";
import { TransactionHistory } from "./pages/travels/TransactionHistory";
import { Contact } from "./pages/Contact";
import { FAQ } from "./pages/FAQ";
import { ClaimTracking } from "./pages/ClaimTracking";
import { ClaimIntimate } from "./pages/ClaimIntimate";
import { MyDraftPolicy } from "./pages/MyDraftPolicy";
import { MyPolicies } from "./pages/MyPolicies";
import { KYCCheck } from "./pages/kyc/KYCCheck";
import { KYCAdd } from "./pages/kyc/KYCAdd";
import { KYCAddCorporate } from "./pages/kyc/KYCAddCorporate";
import { BuyPolicies } from "./pages/BuyPolicies";
import { HomeInsurance } from "./pages/HomeInsurance";
import { VehicleInsurance } from "./pages/VehicleInsurance";
import { VehicleInsurancePlan } from "./pages/VehicleInsurancePlan";
import { VehicleCoveragePlan } from "./pages/VehicleCoveragePlan";
import { VehicleCoveragePlanSimple } from "./pages/VehicleCoveragePlanSimple";
import { MotorInsurancePlan } from "./pages/MotorInsurancePlan";
import { TravelInsurance } from "./pages/travels/TravelInsurance";
import { TravelInsuranceCoverage } from "./pages/travels/TravelInsuranceCoverage";
import { TravelInsuranceDetails } from "./pages/travels/TravelInsuranceDetails";
import NotFound from "./pages/NotFound";
import { OneTimeRegister } from "./pages/auth/OneTimeRegister";
import RegisterPage from "./pages/auth/RegisterPage";

import { ProtectedRoute } from "./routes/ProtectedRoute";
import { KYCAddPage } from "./pages/KYCAddPage";
import ForgotPasswordPage from "./pages/forgot/ForgotPassword";
import ForgotPasswordVerifyOtpPage from "./pages/forgot/ForgotPasswordVerifyOtpPage";
import ResetPasswordPage from "./pages/changePassword/ResetPasswordPage";
import ResubmitKycForm from "./pages/kyc/ResubmitKycForm";
import { TravelInsuranceInstantQuotes } from "./pages/travels/TravelInsuranceInstantQuotes ";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/client-register" element={<RegisterPage />} />
            <Route path="/otp-validate" element={<OneTimeRegister />} />
            <Route path="/verify-otp" element={<ForgotPasswordVerifyOtpPage />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/faq" element={<FAQ />} />

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/claim" element={<Claim />} />
              <Route path="/claim-tracking" element={<ClaimTracking />} />
              <Route path="/claim-intimate" element={<ClaimIntimate />} />
              <Route path="/change-password" element={<ChangePassword />} />
              <Route path="/transaction-history" element={<TransactionHistory />} />
              <Route path="/my-draft-policy" element={<MyDraftPolicy />} />
              <Route path="/my-policies" element={<MyPolicies />} />
              <Route path="/kyc-check" element={<KYCCheck />} />
              <Route path="/kyc-add" element={<KYCAdd />} />
              <Route path="/kyc-resubmit" element={<ResubmitKycForm />} />
              <Route path="/kyc-add-page" element={<KYCAddPage />} />
              <Route path="/kyc-add-corporate" element={<KYCAddCorporate />} />
              <Route path="/buy-policies" element={<BuyPolicies />} />
              <Route path="/home-insurance" element={<HomeInsurance />} />
              <Route path="/vehicle-insurance" element={<VehicleInsurance />} />
              <Route path="/vehicle-insurance-plan" element={<VehicleInsurancePlan />} />
              <Route path="/vehicle-coverage-plan" element={<VehicleCoveragePlan />} />
              <Route path="/vehicle-coverage-plan-simple" element={<VehicleCoveragePlanSimple />} />
              <Route path="/motor-insurance-plan" element={<MotorInsurancePlan />} />
              <Route path="/travel-insurance" element={<TravelInsurance />} />
              <Route path="/travel-insurance-coverage" element={<TravelInsuranceCoverage />} />
              <Route path="/travel-insurance-details" element={<TravelInsuranceDetails />} />
              <Route path="/travel-insurance-history" element={<TransactionHistory />} />
              <Route path="/travel-insurance-instant-quotes" element={<TravelInsuranceInstantQuotes />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
