import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { EnrollmentProvider } from "@/contexts/EnrollmentContext";
import AIChatbot from "./components/AIChatbot";
import SmoothScroll from "./components/SmoothScroll";
import ErrorBoundary from "./components/common/ErrorBoundary";
import { useAuth } from "./contexts/AuthContext";
import AuthModal from "./components/AuthModal";
import { RoleGuard } from "./components/auth/RoleGuard";
import { MasqueradeBar } from "@/components/admin/MasqueradeBar";

import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from "@/lib/react-query";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
}

const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const DashboardLayout = lazy(() => import("./components/dashboard/DashboardLayout"));
const DashboardHome = lazy(() => import("./pages/DashboardHome"));
const MyCourses = lazy(() => import("./pages/MyCourses"));
const MyPrograms = lazy(() => import("./pages/MyPrograms"));
const CalendarPage = lazy(() => import("./pages/CalendarPage"));
const CertificatesPage = lazy(() => import("./pages/CertificatesPage"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const InstructorCoursesPage = lazy(() => import("./pages/InstructorCoursesPage"));
const CourseBuilderPage = lazy(() => import("./pages/CourseBuilderPage"));
const StudentsPage = lazy(() => import("./pages/StudentsPage"));
const EarningsPage = lazy(() => import("./pages/EarningsPage"));
const ProgramManagerProgramsPage = lazy(() => import("./pages/ProgramManagerProgramsPage"));
const ProgramBuilderPage = lazy(() => import("./pages/ProgramBuilderPage"));
const ProgramCohortPage = lazy(() => import("./pages/ProgramCohortPage"));
const ParticipantsPage = lazy(() => import("./pages/ParticipantsPage"));
const ReportsPage = lazy(() => import("./pages/ReportsPage"));
const AdminUsersPage = lazy(() => import("./pages/AdminUsersPage"));
const AnalyticsPage = lazy(() => import("./pages/AnalyticsPage"));
const PaymentsPage = lazy(() => import("./pages/PaymentsPage"));
const RolesPage = lazy(() => import("./pages/RolesPage"));
const CourseCatalogPage = lazy(() => import("./pages/CourseCatalogPage"));
const CourseDetailPage = lazy(() => import("./pages/CourseDetailPage"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const ProgramsCatalogPage = lazy(() => import("./pages/ProgramsCatalogPage"));
const ProgramApplicationPage = lazy(() => import("./pages/ProgramApplicationPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const EmailTemplatesPage = lazy(() => import("./pages/EmailTemplatesPage"));
const CampaignsPage = lazy(() => import("./pages/CampaignsPage"));
const ForumsPage = lazy(() => import("./pages/ForumsPage"));
const VideoUploadPage = lazy(() => import("./pages/VideoUploadPage"));
const InterviewSchedulingPage = lazy(() => import("./pages/InterviewSchedulingPage"));
const IncomeProgressionPage = lazy(() => import("./pages/IncomeProgressionPage"));
const PortfolioPage = lazy(() => import("./pages/PortfolioPage"));
const OnboardingPage = lazy(() => import("./pages/OnboardingPage"));
const ResumeBuilderPage = lazy(() => import("./pages/ResumeBuilderPage"));
const SkillsAssessmentPage = lazy(() => import("./pages/SkillsAssessmentPage"));
const AssessmentsSetupPage = lazy(() => import("./pages/AssessmentsSetupPage"));
const NotificationPrefsPage = lazy(() => import("./pages/NotificationPrefsPage"));
const PlacementTrackingPage = lazy(() => import("./pages/PlacementTrackingPage"));
const LeadDashboardPage = lazy(() => import("./pages/LeadDashboardPage"));
const ReportBuilderPage = lazy(() => import("./pages/ReportBuilderPage"));
const ForTeamsPage = lazy(() => import("./pages/ForTeamsPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const AuthCallbackPage = lazy(() => import("./pages/AuthCallbackPage"));
const JobsBoardPage = lazy(() => import("./pages/JobsBoardPage"));
const WebinarsPage = lazy(() => import("./pages/WebinarsPage"));

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

function GlobalAuthModal() {
  const { isAuthModalOpen, authModalMode, closeAuthModal } = useAuth();
  return <AuthModal isOpen={isAuthModalOpen} onClose={closeAuthModal} initialMode={authModalMode} />;
}

function RouteLoadingFallback() {
  return (
    <div className="min-h-[40vh] flex items-center justify-center text-sm text-muted-foreground">
      Loading...
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <EnrollmentProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <MasqueradeBar />
          <SmoothScroll>
            <Suspense fallback={<RouteLoadingFallback />}>
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
              <Route path="/about" element={<Navigate to="/programs" replace />} />
              <Route path="/for-teams" element={<ForTeamsPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/auth/callback" element={<AuthCallbackPage />} />
              <Route path="/onboarding" element={<OnboardingPage />} />

              {/* Protected Dashboard */}
              <Route path="/dashboard" element={
                <ErrorBoundary name="Dashboard">
                  <RequireAuth>
                    <DashboardLayout />
                  </RequireAuth>
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
                  path="programs/:programId"
                  element={
                    <RoleGuard allow={["program_manager", "admin"]}>
                      <ProgramCohortPage />
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
                <Route path="jobs" element={<JobsBoardPage />} />
                <Route path="webinars" element={<WebinarsPage />} />
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
                  element={<Navigate to="/dashboard/programs" replace />}
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
                <Route path="job-alerts" element={<Navigate to="/dashboard/notification-preferences" replace />} />
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
                <Route
                  path="assessments/setup"
                  element={
                    <RoleGuard allow={["instructor", "program_manager", "admin"]}>
                      <AssessmentsSetupPage />
                    </RoleGuard>
                  }
                />
              </Route>

              <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
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
