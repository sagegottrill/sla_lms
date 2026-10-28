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
      // The mobile supabase client (Preferences-backed session storage) takes
      // precedence over the web client for EVERY shared consumer, so auth
      // sessions live in exactly one store inside the app shell.
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
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom", "@tanstack/react-query"],
          supabase: ["@supabase/supabase-js"],
          motion: ["framer-motion"],
        },
      },
    },
  },
});
