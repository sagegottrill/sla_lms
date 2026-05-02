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
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React - must load first
          "vendor-react": ["react", "react-dom", "react/jsx-runtime"],
          
          // Routing - depends on React
          "vendor-router": ["react-router-dom"],
          
          // State management & data fetching
          "vendor-query": ["@tanstack/react-query", "@tanstack/react-query-devtools"],
          
          // Supabase
          "vendor-supabase": ["@supabase/supabase-js"],
          
          // UI libraries
          "vendor-radix": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-select",
            "@radix-ui/react-tabs",
            "@radix-ui/react-tooltip",
            "@radix-ui/react-popover",
            "@radix-ui/react-label",
            "@radix-ui/react-checkbox",
            "@radix-ui/react-radio-group",
            "@radix-ui/react-switch",
            "@radix-ui/react-slider",
            "@radix-ui/react-separator",
            "@radix-ui/react-avatar",
            "@radix-ui/react-progress",
          ],
          
          // Icons
          "vendor-icons": ["lucide-react"],
          
          // Animation
          "vendor-motion": ["framer-motion"],
          
          // Forms
          "vendor-forms": ["react-hook-form", "zod"],
          
          // Charts - keep together to avoid circular deps
          "vendor-charts": ["recharts"],
          
          // PDF generation - keep together
          "vendor-pdf": ["jspdf", "html2canvas"],
        },
      },
    },
  },
}));
