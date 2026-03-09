// src/App.tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";

// Import your token refresh provider
import { TokenRefreshProvider } from "@/components/TokenRefreshProvider";

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
import { HomePremiumDetails } from "./pages/HomePremiumDetails";
import { HomeInsuranceKYC } from "./pages/HomeInsuranceKYC";
import { VehicleInsurance } from "./pages/VehicleInsurance";
import { VehicleInsurancePlan } from "./pages/VehicleInsurancePlan";
import { VehicleCoveragePlan } from "./pages/VehicleCoveragePlan";
import { VehicleCoveragePlanSimple } from "./pages/VehicleCoveragePlanSimple";
import { VehicleCoverageDetails } from "./pages/VehicleCoverageDetails";
import { MotorInsurancePlan } from "./pages/MotorInsurancePlan";
import { MotorKYCDetails } from "./pages/MotorKYCDetails";
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
import Travels from "./pages/publicTravels/travels";
import { TravelCoverage } from "./pages/publicTravels/CoverPage";
import { PremiumSummary } from "./pages/publicTravels/PremiumSummary";
import { PolicyDetails } from "./pages/PolicyDetails";
import { UserProfile } from "./pages/UserProfile";
import DraftPolicyPage from "./pages/DraftPolicy";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <TokenRefreshProvider> {/* Add this wrapper */}
          <Toaster />
          <Sonner position="top-right" />
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

              <Route path="/travels" element={<Travels />} />
              <Route path="/travel-coverage" element={<TravelCoverage />} />
              <Route path="/premium-summary" element={<PremiumSummary />} />

              {/* Protected routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/claim" element={<Claim />} />
                <Route path="/claim-tracking" element={<ClaimTracking />} />
                <Route path="/claim-intimate" element={<ClaimIntimate />} />
                <Route path="/change-password" element={<ChangePassword />} />
                <Route path="/draft-policy" element={<DraftPolicyPage/>}/>
                <Route path="/transaction-history" element={<TransactionHistory />} />
                <Route path="/my-draft-policy" element={<MyDraftPolicy />} />
                <Route path="/my-policies" element={<MyPolicies />} />
                <Route path="/policy-details/:policyNo" element={<PolicyDetails />} />

                <Route path="/kyc-check" element={<KYCCheck />} />
                <Route path="/kyc-add" element={<KYCAdd />} />
                <Route path="/kyc-resubmit" element={<ResubmitKycForm />} />
                <Route path="/kyc-add-page" element={<KYCAddPage />} />
                <Route path="/kyc-add-corporate" element={<KYCAddCorporate />} />
                <Route path="/buy-policies" element={<BuyPolicies />} />
                <Route path="/home-insurance" element={<HomeInsurance />} />
                <Route path="/home-premium-details" element={<HomePremiumDetails />} />
                <Route path="/home-insurance-kyc" element={<HomeInsuranceKYC />} />
                <Route path="/vehicle-insurance" element={<VehicleInsurance />} />
                <Route path="/vehicle-insurance-plan" element={<VehicleInsurancePlan />} />
                <Route path="/vehicle-coverage-plan" element={<VehicleCoveragePlan />} />
                <Route path="/vehicle-coverage-plan-simple" element={<VehicleCoveragePlanSimple />} />
                <Route path="/vehicle-coverage-details" element={<VehicleCoverageDetails />} />
                <Route path="/motor-insurance-plan" element={<MotorInsurancePlan />} />
                <Route path="/motor-kyc-details" element={<MotorKYCDetails />} />
                <Route path="/travel-insurance" element={<TravelInsurance />} />
                <Route path="/travel-insurance-coverage" element={<TravelInsuranceCoverage />} />
                <Route path="/travel-insurance-details" element={<TravelInsuranceDetails />} />
                <Route path="/travel-insurance-history" element={<TransactionHistory />} />
                <Route path="/travel-insurance-instant-quotes" element={<TravelInsuranceInstantQuotes />} />
                <Route path="/profile" element={<UserProfile />}/>
              </Route>

              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TokenRefreshProvider> {/* Close the wrapper */}
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;