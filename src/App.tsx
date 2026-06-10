import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { TokenRefreshProvider } from "@/components/TokenRefreshProvider";
import { Home } from "./pages/Home";
import { Login } from "./pages/auth/Login";
import { Register } from "./pages/auth/Register";
import RegisterPage from "./pages/auth/RegisterPage";
import { OneTimeRegister } from "./pages/auth/OneTimeRegister";
import ForgotPasswordPage from "./pages/forgot/ForgotPassword";
import ForgotPasswordVerifyOtpPage from "./pages/forgot/ForgotPasswordVerifyOtpPage";
import ResetPasswordPage from "./pages/changePassword/ResetPasswordPage";
import NotFound from "./pages/NotFound";
import { Dashboard } from "./pages/Dashboard";
import { ChangePassword } from "./pages/changePassword/ChangePassword";
import { MyDraftPolicy } from "./pages/MyDraftPolicy";
import { MyPolicies } from "./pages/MyPolicies";
import { PolicyDetails } from "./pages/PolicyDetails";
import { UserProfile } from "./pages/UserProfile";
import DraftPolicyPage from "./pages/DraftPolicy";
import { KYCAdd } from "./pages/kyc/KYCAdd";
import ResubmitKycForm from "./pages/kyc/ResubmitKycForm";
import { TravelInsurance } from "./pages/travels/TravelInsurance";
import { TravelInsuranceCoverage } from "./pages/travels/TravelInsuranceCoverage";
import { TravelInsuranceDetails } from "./pages/travels/TravelInsuranceDetails";
import { TravelInsuranceInstantQuotes } from "./pages/travels/TravelInsuranceInstantQuotes";
import { PremiumSummaryPage } from "./pages/travels/PremiumSummary";
import ProtectedTravelLayout from "./pages/travels/layout";
import Travels from "./pages/publicTravels/travels";
import { TravelCoverage } from "./pages/publicTravels/CoverPage";
import { PremiumSummary } from "./pages/publicTravels/PremiumSummary";
import PublicTravelLayout from "./pages/publicTravels/layout";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { MotorInsurancePlan } from "./pages/publicMotor/MotorInsurancePlan";
import PublicMotorLayout from "./pages/publicMotor/layout";
import { MotorInsurancePage } from "./pages/motor/MotorInsurance";
import { TwoWhellerPage } from "./pages/motor/two-wheeler/TwoWheller";
import ProtectedMotorLayout from "./pages/motor/layout";
import { TwoWhellerThirdPage } from "./pages/motor/two-wheeler/TwoWhellerThird";
import { PrivateVehiclePage } from "./pages/publicMotor/PrivateVehicle/PrivateVechicle";
import { TwoWheelerPage } from "./pages/publicMotor/TwoWheel/TwoWheeler";
import { CommercialVehiclePage } from "./pages/publicMotor/CommercialVehicle/CommercialVehicle";
import HomeInsurancePage from "./pages/publicHome/HomeInsurancePage";
import { Comprehensive } from "./pages/publicMotor/CommercialVehicle/comprehensive/Comprehensive";
import ThirdPrty from "./pages/publicMotor/CommercialVehicle/thirdparty/ThirdParty";
import TtaxiPage from "./pages/publicMotor/CommercialVehicle/thirdparty/Taxi";
import TgoodsCarryingPage from "./pages/publicMotor/CommercialVehicle/thirdparty/GoodsCarrying";
import TpassengerCarryingPage from "./pages/publicMotor/CommercialVehicle/thirdparty/TpassengerCarryingPage";
import CtaxiPage from "./pages/publicMotor/CommercialVehicle/comprehensive/Ctaxi";
import TTempoErikshawPage from "./pages/publicMotor/CommercialVehicle/thirdparty/TtempoERikshaw";
import CPassengerCarryingPage from "./pages/publicMotor/CommercialVehicle/comprehensive/CPassengerCarrying";
import TTractorPowerTrailerPage from "./pages/publicMotor/CommercialVehicle/thirdparty/TTractorPowerTrailerPage";
import FireHousePage from "./pages/publicHome/FireHousePage";
import FirePropertyPage from "./pages/publicHome/FirePropertyPage";
import THazardousGoodsPage from "./pages/publicMotor/CommercialVehicle/thirdparty/THazardousGoodsPage";
import TAgricultureForestryPage from "./pages/publicMotor/CommercialVehicle/thirdparty/TAgricultureForestryPage";
import TConstructionEquipmentPage from "./pages/publicMotor/CommercialVehicle/thirdparty/TConstructionEquipmentPage";
import CNormalGoodsPage from "./pages/publicMotor/CommercialVehicle/comprehensive/CNormalGoodsPage";
import CHazardousGoodsPage from "./pages/publicMotor/CommercialVehicle/comprehensive/CHazardousGoodsPage";
import CTempoErikshawPage from "./pages/publicMotor/CommercialVehicle/comprehensive/CTempoErikshawPage";
import CAgricultureForestryPage from "./pages/publicMotor/CommercialVehicle/comprehensive/CAgricultureForestryPage";
import CConstructionEquipmentPage from "./pages/publicMotor/CommercialVehicle/comprehensive/CConstructionEquipmentPage";
import CTractorPowerTrailerPage from "./pages/publicMotor/CommercialVehicle/comprehensive/CTractorPowerTrailerPage";
import PublicHomeLayout from "./pages/publicHome/layout";
import AccidentInsurancePage from "./pages/public-accident/AccidentInsurancePage";
import PersonalAccidentPage from "./pages/public-accident/PersonalAccidentPage";
import GroupPersonalAccidentPage from "./pages/public-accident/GroupPersonalAccidentPage";
import PublicAccidentLayout from "./pages/public-accident/layout";
import { MotorPrivateVehiclePage } from "./pages/motor/private-vehicle/MotorPrivateVehicle";
import AccidentPersionalAccidentPagee from "./pages/accident/PersionalAccident";
import ProtectedAccidentLayout from "./pages/accident/layout";
import AccidentsPersonalPage from "./pages/accident/AccidentsPersonal";
import AccidentsGroupPage from "./pages/accident/CreateAccidentsPersonal";
import HomeInsurancesPage from "./pages/home-insurance/HomeInsurance";
import ProtectedHomeLayout from "./pages/home-insurance/layout";
import FireHouseInsurancePage from "./pages/home-insurance-fire/FireHouseInsurancePage";
import PCommercialVehiclePage from "./pages/motor/commercial-vehicle/PCommercialVehicle";
import PComprehensivePage from "./pages/motor/commercial-vehicle/Pcomprehensive";
import PNormalGoodsPage from "./pages/motor/commercial-vehicle/PNormalGoodsCreatePolicyPage";
import PTaxiPage from "./pages/motor/commercial-vehicle/PTaxi";
import PHazardousGoodsPage from "./pages/motor/commercial-vehicle/PHazardousGoods";
import PPassengerCarryingPage from "./pages/motor/commercial-vehicle/PPassengerCarrying";
import PTempoERikshawPage from "./pages/motor/commercial-vehicle/PTempoERikshaw";
import PAgricultureForestryPage from "./pages/motor/commercial-vehicle/PAgricultureForestry";
import PConstructionEquipmentPage from "./pages/motor/commercial-vehicle/PConstructionEquipment";
import FirePropertyInsurancePage from "./pages/home-insurance-fire/FirePropertyInsurancePage";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <TokenRefreshProvider>
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
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />

                {/* Public travel routes — shared layout */}
                <Route element={<PublicTravelLayout />}>
                  <Route path="/travel-coverage" element={<TravelCoverage />} />
                  <Route path="/travels" element={<Travels />} />
                  <Route path="/premium-summary" element={<PremiumSummary />} />
                </Route>

                <Route element={<PublicMotorLayout />}>
                  <Route path="/motor-insurance-plan" element={<MotorInsurancePlan />} />
                  <Route path="/motor/two-wheeler" element={<TwoWheelerPage />} />
                  <Route path="/motor/private-vehicle" element={<PrivateVehiclePage />} />
                  <Route path="/motor/commercial-vehicle" element={<CommercialVehiclePage />} />

                  <Route path="/motor/commercial-vehicle/comprehensive" element={<Comprehensive />} />
                  {/* comprehensive catagory url */}
                  <Route path="/motor/commercial-vehicle/comprehensive/normal-goods" element={<CNormalGoodsPage />} />
                  <Route path="/motor/commercial-vehicle/comprehensive/hazardous-goods" element={<CHazardousGoodsPage />} />
                  <Route path="/motor/commercial-vehicle/comprehensive/passenger-carrying" element={<CPassengerCarryingPage />} />
                  <Route path="/motor/commercial-vehicle/comprehensive/taxi" element={<CtaxiPage />} />
                  <Route path="/motor/commercial-vehicle/comprehensive/tempo-e-rikshaw" element={<CTempoErikshawPage />} />
                  <Route path="/motor/commercial-vehicle/comprehensive/agriculture-forestry" element={<CAgricultureForestryPage />} />
                  <Route path="/motor/commercial-vehicle/comprehensive/construction-equipment" element={<CConstructionEquipmentPage />} />
                  <Route path="/motor/commercial-vehicle/comprehensive/tractor-power-trailer" element={<CTractorPowerTrailerPage />} />


                  <Route path="/motor/commercial-vehicle/third-party" element={<ThirdPrty />} />
                  {/* third pary catagory url */}
                  <Route path="/motor/commercial-vehicle/third-party/normal-goods" element={<TgoodsCarryingPage />} />
                  <Route path="/motor/commercial-vehicle/third-party/hazardous-goods" element={<THazardousGoodsPage />} />
                  <Route path="/motor/commercial-vehicle/third-party/passenger-carrying" element={<TpassengerCarryingPage />} />
                  <Route path="/motor/commercial-vehicle/third-party/taxi" element={<TtaxiPage />} />
                  <Route path="/motor/commercial-vehicle/third-party/tempo-e-rikshaw" element={<TTempoErikshawPage />} />
                  <Route path="/motor/commercial-vehicle/third-party/tractor-power-trailer" element={<TTractorPowerTrailerPage />} />
                  <Route path="/motor/commercial-vehicle/third-party/agriculture-forestry" element={<TAgricultureForestryPage />} />
                  <Route path="/motor/commercial-vehicle/third-party/construction-equipment" element={<TConstructionEquipmentPage />} />


                </Route>
                <Route element={<PublicHomeLayout />}>
                  <Route path="/home-insurance" element={<HomeInsurancePage />} />
                  <Route path="/home-insurance/fire-house" element={<FireHousePage />} />
                  <Route path="/home-insurance/fire-property" element={<FirePropertyPage />} />
                </Route>

                <Route element={<PublicAccidentLayout />}>
                  <Route path="/accident-insurance" element={<AccidentInsurancePage />} />
                  <Route path="/accident-insurance/personal" element={<PersonalAccidentPage />} />
                  <Route path="/accident-insurance/group-personal" element={<GroupPersonalAccidentPage />} />
                </Route>


                {/* Protected routes */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/dashboard" element={<Dashboard />} />

                  <Route path="/change-password" element={<ChangePassword />} />
                  <Route path="/draft-policy" element={<DraftPolicyPage />} />
                  <Route path="/my-draft-policy" element={<MyDraftPolicy />} />
                  <Route path="/my-policies" element={<MyPolicies />} />
                  <Route path="/policy-details/:policyNo" element={<PolicyDetails />} />
                  <Route path="/profile" element={<UserProfile />} />
                  <Route path="/kyc-add" element={<KYCAdd />} />
                  <Route path="/kyc-resubmit" element={<ResubmitKycForm />} />

                  <Route element={<ProtectedAccidentLayout />}>
                    <Route path="/accidents" element={<AccidentPersionalAccidentPagee />} />
                    <Route path="/accidents/personal" element={<AccidentsPersonalPage />} />
                    <Route path="/accidents/group-personal" element={<AccidentsGroupPage />} />
                  </Route>

                  <Route path="/motor-insurance" element={<MotorInsurancePage />} />
                  <Route element={<ProtectedMotorLayout />}>
                    <Route path="/two-wheeler" element={<TwoWhellerPage />} />
                    <Route path="/two-wheeler/third-party" element={<TwoWhellerThirdPage />} />

                    <Route path="/private-vechicle" element={<MotorPrivateVehiclePage />} />
                  </Route>
                  <Route path="/commercial-vehicle" element={<PCommercialVehiclePage />} />
                  <Route path="/commercial-vehicle/comprehensive" element={<PComprehensivePage />} />
                  <Route path="/commercial-vehicle/comprehensive/normal-goods" element={<PNormalGoodsPage />} />
                  <Route path="/commercial-vehicle/comprehensive/hazardous-goods" element={<PHazardousGoodsPage />} />
                  <Route path="/commercial-vehicle/comprehensive/passenger-carrying" element={<PPassengerCarryingPage />} />
                  <Route path="/commercial-vehicle/comprehensive/taxi" element={<PTaxiPage />} />
                  <Route path="/commercial-vehicle/comprehensive/tempo-e-rikshaw" element={<PTempoERikshawPage />} />
                  <Route path="/commercial-vehicle/comprehensive/agriculture-forestry" element={<PAgricultureForestryPage />} />
                  <Route path="/commercial-vehicle/comprehensive/construction-equipment" element={<PConstructionEquipmentPage />} />



                  <Route path="/travel-insurance" element={<TravelInsurance />} />
                  <Route element={<ProtectedTravelLayout />}>
                    <Route path="/travel-insurance-coverage" element={<TravelInsuranceCoverage />} />
                    <Route path="/travel-insurance-details" element={<TravelInsuranceDetails />} />
                    <Route path="/travel-insurance-premium" element={<PremiumSummaryPage />} />
                    <Route path="/travel-insurance-instant-quotes" element={<TravelInsuranceInstantQuotes />} />
                  </Route>

                  <Route element={<ProtectedHomeLayout />}>
                    <Route path="/home-insurances" element={<HomeInsurancesPage />} />
                    <Route path="/home-insurances/fire-house" element={<FireHouseInsurancePage />} />
                    <Route path="/home-insurances/fire-property" element={<FirePropertyInsurancePage />}/>

                  </Route>

                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TokenRefreshProvider>
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
};

export default App;