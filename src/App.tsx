import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { EnrollmentProvider } from "@/contexts/EnrollmentContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

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

import JobsAdminPage from "./pages/JobsAdminPage";
import ErrorBoundary from "./components/common/ErrorBoundary";
import { useAuth } from "./contexts/AuthContext";
import AuthModal from "./components/AuthModal";
import { RoleGuard } from "./components/auth/RoleGuard";

import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from "@/lib/react-query";

function CoursesRoute() {
  const { appUser } = useAuth();
  if (appUser?.role === "instructor" || appUser?.role === "admin" || appUser?.role === "program_manager") {
    return <InstructorCoursesPage />;
  }
  return <MyCourses />;
}

function ProgramsRoute() {
  const { appUser } = useAuth();
  if (appUser?.role === "program_manager" || appUser?.role === "admin") return <ProgramManagerProgramsPage />;
  return <MyPrograms />;
}

function JobsRoute() {
  const { appUser } = useAuth();
  if (appUser?.role === "admin" || appUser?.role === "program_manager") return <JobsAdminPage />;
  return <JobBoardPage />;
}

function GlobalAuthModal() {
  const { isAuthModalOpen, authModalMode, closeAuthModal } = useAuth();
  return <AuthModal isOpen={isAuthModalOpen} onClose={closeAuthModal} initialMode={authModalMode} />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <EnrollmentProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <SmoothScroll>
            <Routes>
              {/* Public */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Navigate to="/" replace />} />
              <Route path="/signup" element={<Navigate to="/" replace />} />
              <Route path="/admin" element={<Navigate to="/" replace />} />
              <Route path="/admin/login" element={<Navigate to="/" replace />} />
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
              <Route path="/dashboard" element={
                <ErrorBoundary name="Dashboard">
                  <DashboardLayout />
                </ErrorBoundary>
              }>
                <Route index element={<DashboardHome />} />
                <Route path="courses" element={<CoursesRoute />} />
                <Route
                  path="courses/new"
                  element={
                    <RoleGuard allow={["instructor", "admin", "program_manager"]}>
                      <CourseBuilderPage />
                    </RoleGuard>
                  }
                />
                <Route path="programs" element={<ProgramsRoute />} />
                <Route
                  path="programs/new"
                  element={
                    <RoleGuard allow={["program_manager", "admin"]}>
                      <ProgramBuilderPage />
                    </RoleGuard>
                  }
                />
                <Route
                  path="students"
                  element={
                    <RoleGuard allow={["instructor", "admin"]}>
                      <StudentsPage />
                    </RoleGuard>
                  }
                />
                <Route
                  path="participants"
                  element={
                    <RoleGuard allow={["program_manager", "admin"]}>
                      <ParticipantsPage />
                    </RoleGuard>
                  }
                />
                <Route
                  path="users"
                  element={
                    <RoleGuard allow={["admin"]}>
                      <AdminUsersPage />
                    </RoleGuard>
                  }
                />
                <Route
                  path="analytics"
                  element={
                    <RoleGuard allow={["instructor", "program_manager", "admin"]}>
                      <AnalyticsPage />
                    </RoleGuard>
                  }
                />
                <Route
                  path="earnings"
                  element={
                    <RoleGuard allow={["instructor", "admin"]}>
                      <EarningsPage />
                    </RoleGuard>
                  }
                />
                <Route
                  path="payments"
                  element={
                    <RoleGuard allow={["admin"]}>
                      <PaymentsPage />
                    </RoleGuard>
                  }
                />
                <Route path="certificates" element={<CertificatesPage />} />
                <Route path="calendar" element={<CalendarPage />} />
                <Route path="jobs" element={<JobsRoute />} />
                <Route
                  path="reports"
                  element={
                    <RoleGuard allow={["program_manager", "admin"]}>
                      <ReportsPage />
                    </RoleGuard>
                  }
                />
                <Route
                  path="roles"
                  element={
                    <RoleGuard allow={["admin"]}>
                      <RolesPage />
                    </RoleGuard>
                  }
                />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="portfolio" element={<PortfolioPage />} />
                <Route
                  path="employers"
                  element={
                    <RoleGuard allow={["admin"]}>
                      <EmployerPortalPage />
                    </RoleGuard>
                  }
                />
                <Route
                  path="email-templates"
                  element={
                    <RoleGuard allow={["admin"]}>
                      <EmailTemplatesPage />
                    </RoleGuard>
                  }
                />
                <Route
                  path="campaigns"
                  element={
                    <RoleGuard allow={["admin"]}>
                      <CampaignsPage />
                    </RoleGuard>
                  }
                />
                <Route path="forums" element={<ForumsPage />} />
                <Route
                  path="videos"
                  element={
                    <RoleGuard allow={["admin", "instructor", "program_manager"]}>
                      <VideoUploadPage />
                    </RoleGuard>
                  }
                />
                <Route
                  path="interviews"
                  element={
                    <RoleGuard allow={["program_manager", "admin"]}>
                      <InterviewSchedulingPage />
                    </RoleGuard>
                  }
                />
                <Route path="income" element={<IncomeProgressionPage />} />
                <Route path="resume" element={<ResumeBuilderPage />} />
                <Route path="skills" element={<SkillsAssessmentPage />} />
                <Route path="job-alerts" element={<JobAlertsPage />} />
                <Route path="notification-preferences" element={<NotificationPrefsPage />} />
                <Route
                  path="placements"
                  element={
                    <RoleGuard allow={["program_manager", "admin"]}>
                      <PlacementTrackingPage />
                    </RoleGuard>
                  }
                />
                <Route
                  path="leads"
                  element={
                    <RoleGuard allow={["admin"]}>
                      <LeadDashboardPage />
                    </RoleGuard>
                  }
                />
                <Route
                  path="report-builder"
                  element={
                    <RoleGuard allow={["program_manager", "admin"]}>
                      <ReportBuilderPage />
                    </RoleGuard>
                  }
                />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
            <AIChatbot />
            <GlobalAuthModal />
          </SmoothScroll>
        </BrowserRouter>
      </TooltipProvider>
      </EnrollmentProvider>
    </AuthProvider>
    <ReactQueryDevtools initialIsOpen={false} />
  </QueryClientProvider>
);

export default App;
