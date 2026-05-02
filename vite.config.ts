import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    visualizer({ filename: "dist/stats.html", gzipSize: true, brotliSize: true }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // ── Vendor: React core ──────────────────────────────────────────
          if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/")) {
            return "vendor-react";
          }
          // ── Vendor: Routing ─────────────────────────────────────────────
          if (id.includes("node_modules/react-router-dom/") || id.includes("node_modules/react-router/")) {
            return "vendor-router";
          }
          // ── Vendor: Supabase ────────────────────────────────────────────
          if (id.includes("node_modules/@supabase/")) {
            return "vendor-supabase";
          }
          // ── Vendor: TanStack Query ──────────────────────────────────────
          if (id.includes("node_modules/@tanstack/")) {
            return "vendor-query";
          }
          // ── Vendor: Framer Motion ───────────────────────────────────────
          if (id.includes("node_modules/framer-motion/") || id.includes("node_modules/motion-dom/") || id.includes("node_modules/motion-utils/")) {
            return "vendor-motion";
          }
          // ── Vendor: Recharts + D3 ───────────────────────────────────────
          if (id.includes("node_modules/recharts/") || id.includes("node_modules/d3-") || id.includes("node_modules/react-smooth/")) {
            return "vendor-charts";
          }
          // ── Vendor: Radix UI ────────────────────────────────────────────
          if (id.includes("node_modules/@radix-ui/")) {
            return "vendor-radix";
          }
          // ── Vendor: Lucide icons ────────────────────────────────────────
          if (id.includes("node_modules/lucide-react/")) {
            return "vendor-icons";
          }
          // ── Vendor: PDF / canvas heavy libs ────────────────────────────
          if (
            id.includes("node_modules/html2canvas/") ||
            id.includes("node_modules/jspdf/") ||
            id.includes("node_modules/fast-png/") ||
            id.includes("node_modules/stackblur-canvas/")
          ) {
            return "vendor-pdf";
          }
          // ── Vendor: Form / validation ───────────────────────────────────
          if (id.includes("node_modules/react-hook-form/") || id.includes("node_modules/zod/") || id.includes("node_modules/@hookform/")) {
            return "vendor-forms";
          }
          // ── Vendor: Misc utilities ──────────────────────────────────────
          if (id.includes("node_modules/")) {
            return "vendor-misc";
          }
        },
      },
    },
  },
}));
