import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
// Mobile-specific kit exposed as "m".
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig({
  root: __dirname,
  // Mobile app reads VITE_SUPABASE_* from the repo's root .env (single source of truth).
  envDir: path.resolve(__dirname, ".."),
  plugins: [react()],
  resolve: {
    alias: [
      // SINGLE-COPY LAW: every runtime dependency shared with ../src must
      // resolve to the ROOT node_modules. Mobile/node_modules carries different
      // versions; without these aliases the bundle ships two copies of e.g.
      // React Query, and their separate contexts crash the app on boot
      // (the endless-splash bug). Keeps shared + mobile code on one instance.
      ...[
        "@tanstack/react-query",
        "@supabase/supabase-js",
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react-router-dom",
        "framer-motion",
        "lucide-react",
        "sonner",
        "clsx",
        "tailwind-merge",
        "class-variance-authority",
        "browser-image-compression",
      ].map((name) => ({
        find: new RegExp(`^${name.replace("/", "\\/")}$`),
        replacement: path.resolve(__dirname, "..", "node_modules", name),
      })),
      // The mobile supabase client takes precedence over the web client for
      // EVERY shared consumer, so auth sessions live in exactly one client
      // instance. AuthContext imports it as "../lib/supabase" (relative), so
      // every spelling of the specifier must resolve to the mobile client.
      { find: /(^\.\.|^\.)\/lib\/supabase$/, replacement: path.resolve(__dirname, "src", "lib", "supabase.ts") },
      // literal "@/lib/supabase" spelling used by mobile pages + shared src
      { find: "@/lib/supabase", replacement: path.resolve(__dirname, "src", "lib", "supabase.ts") },
      // Mobile-specific forum popup hook (desktop-free navigation targets).
      { find: "@/hooks/useForumRealtime", replacement: path.resolve(__dirname, "src", "hooks", "useForumRealtime.ts") },
      // Mobile UI kit.
      { find: /^@kit$/, replacement: path.resolve(__dirname, "src", "lib", "m", "index.ts") },
      { find: "@", replacement: path.resolve(__dirname, "..", "src") },
    ],
  },
  build: {
    outDir: "dist",
    chunkSizeWarningLimit: 1600,
    // IMPORTANT: no manualChunks here. Forcing vendor/supabase/motion chunks
    // produced DUPLICATE copies of React Query (one per chunk); the provider
    // and the auth hook then read from different context copies and the app
    // crashed silently on boot (endless splash). Let Rollup dedupe naturally.
  },
});
