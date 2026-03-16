import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { EnrollmentProvider } from "@/contexts/EnrollmentContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DashboardLayout from "./components/dashboard/DashboardLayout";
import DashboardHome from "./pages/DashboardHome";
import MyCourses from "./pages/MyCourses";
import MyPrograms from "./pages/MyPrograms";
import CalendarPage from "./pages/CalendarPage";
import CertificatesPage from "./pages/CertificatesPage";
import NotificationsPage from "./pages/NotificationsPage";
import SettingsPage from "./pages/SettingsPage";
import JobBoardPage from "./pages/JobBoardPage";
import InstructorCoursesPage from "./pages/InstructorCoursesPage";
import CourseBuilderPage from "./pages/CourseBuilderPage";
import StudentsPage from "./pages/StudentsPage";
import EarningsPage from "./pages/EarningsPage";
import ProgramManagerProgramsPage from "./pages/ProgramManagerProgramsPage";
import ProgramBuilderPage from "./pages/ProgramBuilderPage";
import ParticipantsPage from "./pages/ParticipantsPage";
import ReportsPage from "./pages/ReportsPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import PaymentsPage from "./pages/PaymentsPage";
import RolesPage from "./pages/RolesPage";
import CourseCatalogPage from "./pages/CourseCatalogPage";
import CourseDetailPage from "./pages/CourseDetailPage";
import CheckoutPage from "./pages/CheckoutPage";
import ProgramsCatalogPage from "./pages/ProgramsCatalogPage";
import ProgramApplicationPage from "./pages/ProgramApplicationPage";
import ProfilePage from "./pages/ProfilePage";
import EmailTemplatesPage from "./pages/EmailTemplatesPage";
import CampaignsPage from "./pages/CampaignsPage";
import EmployerPortalPage from "./pages/EmployerPortalPage";
import ForumsPage from "./pages/ForumsPage";
import VideoUploadPage from "./pages/VideoUploadPage";
import InterviewSchedulingPage from "./pages/InterviewSchedulingPage";
import IncomeProgressionPage from "./pages/IncomeProgressionPage";
import PortfolioPage from "./pages/PortfolioPage";
import OnboardingPage from "./pages/OnboardingPage";
import ResumeBuilderPage from "./pages/ResumeBuilderPage";
import SkillsAssessmentPage from "./pages/SkillsAssessmentPage";
import JobAlertsPage from "./pages/JobAlertsPage";
import NotificationPrefsPage from "./pages/NotificationPrefsPage";
import PlacementTrackingPage from "./pages/PlacementTrackingPage";
import LeadDashboardPage from "./pages/LeadDashboardPage";
import ReportBuilderPage from "./pages/ReportBuilderPage";
import AIChatbot from "./components/AIChatbot";
import SmoothScroll from "./components/SmoothScroll";
import AboutPage from "./pages/AboutPage";
import ForTeamsPage from "./pages/ForTeamsPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import AdminLogin from "./pages/AdminLogin";
import { useAuth } from "./contexts/AuthContext";

const queryClient = new QueryClient();

function CoursesRoute() {
  const { appUser } = useAuth();
  if (appUser?.role === "instructor") return <InstructorCoursesPage />;
  return <MyCourses />;
}

function ProgramsRoute() {
  const { appUser } = useAuth();
  if (appUser?.role === "program_manager" || appUser?.role === "admin") return <ProgramManagerProgramsPage />;
  return <MyPrograms />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <EnrollmentProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SmoothScroll>
            <Routes>
              {/* Public */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/courses" element={<CourseCatalogPage />} />
              <Route path="/courses/:id" element={<CourseDetailPage />} />
              <Route path="/courses/:id/checkout" element={<CheckoutPage />} />
              <Route path="/programs" element={<ProgramsCatalogPage />} />
              <Route path="/programs/:id/apply" element={<ProgramApplicationPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/for-teams" element={<ForTeamsPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/onboarding" element={<OnboardingPage />} />

              {/* Protected Dashboard */}
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<DashboardHome />} />
                <Route path="courses" element={<CoursesRoute />} />
                <Route path="courses/new" element={<CourseBuilderPage />} />
                <Route path="programs" element={<ProgramsRoute />} />
                <Route path="programs/new" element={<ProgramBuilderPage />} />
                <Route path="students" element={<StudentsPage />} />
                <Route path="participants" element={<ParticipantsPage />} />
                <Route path="users" element={<AdminUsersPage />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="earnings" element={<EarningsPage />} />
                <Route path="payments" element={<PaymentsPage />} />
                <Route path="certificates" element={<CertificatesPage />} />
                <Route path="calendar" element={<CalendarPage />} />
                <Route path="jobs" element={<JobBoardPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="roles" element={<RolesPage />} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="portfolio" element={<PortfolioPage />} />
                <Route path="employers" element={<EmployerPortalPage />} />
                <Route path="email-templates" element={<EmailTemplatesPage />} />
                <Route path="campaigns" element={<CampaignsPage />} />
                <Route path="forums" element={<ForumsPage />} />
                <Route path="videos" element={<VideoUploadPage />} />
                <Route path="interviews" element={<InterviewSchedulingPage />} />
                <Route path="income" element={<IncomeProgressionPage />} />
                <Route path="resume" element={<ResumeBuilderPage />} />
                <Route path="skills" element={<SkillsAssessmentPage />} />
                <Route path="job-alerts" element={<JobAlertsPage />} />
                <Route path="notification-preferences" element={<NotificationPrefsPage />} />
                <Route path="placements" element={<PlacementTrackingPage />} />
                <Route path="leads" element={<LeadDashboardPage />} />
                <Route path="report-builder" element={<ReportBuilderPage />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
            <AIChatbot />
          </SmoothScroll>
        </BrowserRouter>
      </TooltipProvider>
      </EnrollmentProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
