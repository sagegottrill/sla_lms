import { useRef } from "react";
import { NavLink, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, Bell, House, MessagesSquare, UserRound } from "lucide-react";
import { cn } from "@kit";
import { hapticTap } from "../lib/haptics";
import Home from "./Home";
import MyCourses from "./MyCourses";
import Forums from "./Forums";
import Alerts from "./Alerts";
import Profile from "./Profile";

/** The five primary surfaces — mirrors the web dashboard's learner nav. */
const TABS = [
  { key: "home", label: "Home", icon: House },
  { key: "courses", label: "Courses", icon: BookOpen },
  { key: "forums", label: "Community", icon: MessagesSquare },
  { key: "alerts", label: "Alerts", icon: Bell },
  { key: "profile", label: "Profile", icon: UserRound },
] as const;

/**
 * BOTTOM TAB NAVIGATION — primary mobile navigation.
 * Routes via /tabs/:tab so every tab is deep-linkable.
 */
export default function Tabs() {
  const { tab } = useParams();
  // Unknown deep-link tab (e.g. /tabs/xyz) falls back to Home instead of a blank page.
  const active = (TABS.some((t) => t.key === tab) ? tab : "home") as (typeof TABS)[number]["key"];
  const activeIndex = TABS.findIndex((t) => t.key === active);

  // Slide direction follows the tab order, like a native pager.
  const dirRef = useRef(1);
  const lastIndex = useRef(activeIndex);
  if (lastIndex.current !== activeIndex) {
    dirRef.current = activeIndex > lastIndex.current ? 1 : -1;
    lastIndex.current = activeIndex;
    void hapticTap();
  }
  return (
    <div className="flex h-full min-h-[100dvh] w-full flex-col">
      <main className="flex-1 pb-28">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={active}
            initial={{ opacity: 0, x: dirRef.current * 44 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -dirRef.current * 44 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="min-h-full"
            style={{ position: "relative" }}
          >
            {active === "home" && <Home />}
            {active === "courses" && <MyCourses />}
            {active === "forums" && <Forums />}
            {active === "alerts" && <Alerts />}
            {active === "profile" && <Profile />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Floating glassy pill nav (the vault's 10K chrome rule: pills for
          chrome, not for cards). Rounded-full, floating over the canvas. */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 pad-bottom-safe">
        <div className="mx-auto mb-3 flex w-[min(96%,26rem)] items-stretch justify-between overflow-hidden rounded-full border border-border bg-card/85 px-1.5 py-1.5 shadow-lg shadow-black/10 backdrop-blur-xl">
          {TABS.map(({ key, label, icon: Icon }) => {
            const isActive = active === key;
            return (
              <NavLink
                key={key}
                to={`/tabs/${key}`}
                onClick={() => { if (active !== key) void hapticTap(); }}
                className="relative flex flex-col items-center justify-center px-3 py-1.5"
              >
                {isActive && (
                  <motion.span
                    layoutId="tab-pill"
                    className="absolute inset-0 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 400, damping: 34 }}
                  />
                )}
                <Icon className={cn("relative z-10 h-[22px] w-[22px] transition-colors ease-premium", isActive ? "text-white" : "text-muted-foreground")} />
                <span className={cn("relative z-10 mt-0.5 text-[9px] font-semibold transition-colors ease-premium", isActive ? "text-white" : "text-muted-foreground")}>
                  {label}
                </span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
