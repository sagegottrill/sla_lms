import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";


// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("react") || id.includes("react-dom") || id.includes("react-router-dom")) return "vendor-react";
          if (id.includes("@tanstack")) return "vendor-query";
          if (id.includes("@supabase")) return "vendor-supabase";
          if (id.includes("recharts") || id.includes("d3-")) return "vendor-charts";
          if (id.includes("html2canvas")) return "vendor-html2canvas";
          if (id.includes("jspdf")) return "vendor-jspdf";
          if (id.includes("@radix-ui")) return "vendor-radix";
          const pkgMatch = id.match(/node_modules\/(@[^/]+\/[^/]+|[^/]+)/);
          if (pkgMatch?.[1]) {
            return `vendor-${pkgMatch[1].replace("@", "").replace("/", "-")}`;
          }
          return "vendor-misc";
        },
      },
    },
  },
}));
