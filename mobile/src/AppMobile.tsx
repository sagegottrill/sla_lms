/**
 * MOBILE APP ROOT — provider tree + auth gate + routing.
 *
 * Shares the web app's @/* backend layer (AuthContext, api, react-query keys)
 * but swaps the shared lib/supabase import for the mobile Preferences-backed
 * client (see vite alias) so sessions persist inside the Capacitor shell.
 */
import { Suspense, lazy } from "react";
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { queryClient } from "@/lib/react-query";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Splash from "./components/Splash";
import { PageLoader } from "./components/kit";

const Tabs = lazy(() => import("./pages/Tabs"));
const AuthScreen = lazy(() => import("./pages/AuthScreen"));
const CourseDetail = lazy(() => import("./pages/CourseDetail"));
const CourseLearn = lazy(() => import("./pages/CourseLearn"));
const ForumThreadDetail = lazy(() => import("./pages/ForumThreadDetail"));

/** Auth gate: splash while restoring → auth screen → protected app. */
function Gate() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <Splash ready={!loading} />;
  if (!isAuthenticated) return <AuthScreen />;
  return <Outlet />;
}

/** Global forum popups once signed in (mounted exactly like the web app does). */
const ForumAlerts = lazy(() => import("./components/ForumAlerts"));

const router = createBrowserRouter([
  {
    element: (
      <>
        <Gate />
        <Suspense fallback={null}>
          <ForumAlerts />
        </Suspense>
      </>
    ),
    children: [
      { path: "/", element: <Navigate to="/home" replace /> },
      { path: "/tabs/:tab", element: <Tabs /> },
      { path: "/home", element: <Navigate to="/tabs/home" replace /> },
      { path: "/course/:id", element: <CourseDetail /> },
      { path: "/course/:id/learn", element: <CourseLearn /> },
      { path: "/forum/:threadId", element: <ForumThreadDetail /> },
      { path: "*", element: <Navigate to="/home" replace /> },
    ],
  },
]);

export default function AppMobile() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Toaster position="top-center" richColors closeButton />
        <Suspense fallback={<PageLoader />}>
          <RouterProvider router={router} />
        </Suspense>
      </AuthProvider>
    </QueryClientProvider>
  );
}
