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
  const active = (tab ?? "home") as (typeof TABS)[number]["key"];
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
      <main className="flex-1 pb-24">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={active}
            initial={{ opacity: 0, x: dirRef.current * 44 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -dirRef.current * 44 }}
            transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
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

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-lg pad-bottom-safe">
        <div className="mx-auto grid max-w-lg grid-cols-5">
          {TABS.map(({ key, label, icon: Icon }) => {
            const isActive = active === key;
            return (
              <NavLink
                key={key}
                to={`/tabs/${key}`}
                onClick={() => { if (active !== key) void hapticTap(); }}
                className="relative flex flex-col items-center pb-1 pt-2"
              >
                {isActive && (
                  <motion.span
                    layoutId="tab-pill"
                    className="absolute inset-x-2 inset-y-0 rounded-xl bg-accent"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <Icon className={cn("relative h-6 w-6 transition-colors", isActive ? "text-primary" : "text-muted-foreground")} />
                <span className={cn("relative mt-0.5 text-[10px] font-semibold", isActive ? "text-primary" : "text-muted-foreground")}>
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
