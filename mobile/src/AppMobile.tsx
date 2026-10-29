/**
 * MOBILE APP ROOT — provider tree + auth gate + routing.
 *
 * Shares the web app's @/* backend layer (AuthContext, api, react-query keys)
 * but swaps the shared lib/supabase import for the mobile localStorage-backed
 * client (see vite alias) so sessions persist inside the Capacitor shell.
 */
import { Suspense, lazy } from "react";
import { Component, useEffect, useState, type ReactNode } from "react";
import { AnimatePresence } from "framer-motion";
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from "react-router-dom";
import { listenForOAuthReturn } from "./lib/oauth";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { queryClient } from "@/lib/react-query";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Splash from "./components/Splash";
import { PageLoader } from "./components/kit";
import { initStatusBar, OfflineBanner, useAndroidBackButton } from "./components/NativeShell";
import { devPreviewUser } from "@kit";
import { learnerNeedsOnboarding } from "@/lib/userRole";

const Tabs = lazy(() => import("./pages/Tabs"));
const AuthScreen = lazy(() => import("./pages/AuthScreen"));
const CourseDetail = lazy(() => import("./pages/CourseDetail"));
const CourseLearn = lazy(() => import("./pages/CourseLearn"));
const ForumThreadDetail = lazy(() => import("./pages/ForumThreadDetail"));
const Programs = lazy(() => import("./pages/Programs"));
const Jobs = lazy(() => import("./pages/Jobs"));
const Sessions = lazy(() => import("./pages/Sessions"));
const Certificates = lazy(() => import("./pages/Certificates"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));

/**
 * BOOT GUARD — the splash can NEVER hold the app hostage: after 8s the gate
 * falls through to the auth screen (supabase listener keeps syncing in the
 * background) and any captured startup errors are shown on the splash itself.
 */
const BOOT_FALLBACK_MS = 8_000;

function Gate() {
  useAndroidBackButton(); // gesture/hardware back navigates the in-app stack
  const { isAuthenticated, loading, appUser } = useAuth();
  const [bootTimedOut, setBootTimedOut] = useState(false);
  const [splashGone, setSplashGone] = useState(false);

  useEffect(() => {
    if (!loading || bootTimedOut) return;
    const t = setTimeout(() => setBootTimedOut(true), BOOT_FALLBACK_MS - 1_400); // splash minMs=1600
    return () => clearTimeout(t);
  }, [loading, bootTimedOut]);

  const bootErrors = (window as any).__slaBootErrors as string[] | undefined;

  // SPLASH HANDOFF: the splash is a self-dismissing OVERLAY (see Splash.tsx).
  // The real UI always paints underneath as soon as it's decided, and the
  // splash cross-fades away on top — no hard cut, no flash.
  const holdSplash = loading && !bootTimedOut;
  const splashReady = !holdSplash;

  const previewUser = devPreviewUser(); // DEV-only visual QA scaffold (?role=...)
  const authed = isAuthenticated || !!previewUser;
  const shownUser = appUser ?? previewUser;

  let content: ReactNode;
  if (loading) content = null; // splash covers; blue body underlay avoids any flash
  else if (bootErrors?.length) content = <StartupProblem bootErrors={bootErrors} />;
  else if (!authed) content = <AuthScreen />;
  // Web parity: the learner wizard belongs to students only — staff go straight in.
  else if (learnerNeedsOnboarding(shownUser)) content = <Onboarding />;
  else content = <Outlet />;

  return (
    <>
      <div className={holdSplash ? "min-h-[100dvh] bg-primary" : undefined}>{content}</div>
      <AnimatePresence>
        {(holdSplash || (splashReady && !splashGone && !bootTimedOut)) && (
          <Splash key="splash" ready={splashReady} onDone={() => setSplashGone(true)} />
        )}
      </AnimatePresence>
    </>
  );
}

/** Completes Google OAuth returns arriving via the deep link (system browser → app). */
function OAuthReturn() {
  useEffect(() => listenForOAuthReturn(), []);
  return null;
}

/** Any captured startup failure → readable screen + restart, never a silent hang. */
function StartupProblem({ bootErrors }: { bootErrors: string[] }) {
  return (
    <div className="min-h-[100dvh] bg-background px-6 py-16">
      <p className="text-sm font-bold text-destructive">Startup problem</p>
      <pre className="mt-3 whitespace-pre-wrap break-words text-[11px] text-muted-foreground">{bootErrors.slice(-3).join("\n\n")}</pre>
      <button
        className="mt-6 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
        onClick={() => { (window as any).__slaBootErrors = undefined; location.reload(); }}
      >
        Restart app
      </button>
    </div>
  );
}

/** Crash anywhere in the tree → readable screen + restart, never a silent white/splash hang. */
class BootErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="min-h-[100dvh] bg-background px-6 py-16">
        <p className="text-sm font-bold text-destructive">The app hit an unexpected error</p>
        <pre className="mt-3 whitespace-pre-wrap break-words text-[11px] text-muted-foreground">{this.state.error.message}</pre>
        <button
          className="mt-6 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
          onClick={() => location.reload()}
        >
          Restart app
        </button>
      </div>
    );
  }
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
      { path: "/auth/callback", element: <AuthCallback /> },
      { path: "/tabs/:tab", element: <Tabs /> },
      { path: "/home", element: <Navigate to="/tabs/home" replace /> },
      { path: "/course/:id", element: <CourseDetail /> },
      { path: "/course/:id/learn", element: <CourseLearn /> },
      { path: "/forum/:threadId", element: <ForumThreadDetail /> },
      { path: "/programs", element: <Programs /> },
      { path: "/jobs", element: <Jobs /> },
      { path: "/sessions", element: <Sessions /> },
      { path: "/certificates", element: <Certificates /> },
      { path: "/onboarding", element: <Onboarding /> },
      { path: "*", element: <Navigate to="/home" replace /> },
    ],
  },
]);

export default function AppMobile() {
  initStatusBar();
  return (
    <BootErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <OAuthReturn />
        <OfflineBanner />
        <Toaster position="top-center" richColors closeButton />
        <Suspense fallback={<PageLoader />}>
          <RouterProvider router={router} />
        </Suspense>
      </AuthProvider>
    </QueryClientProvider>
    </BootErrorBoundary>
  );
}
