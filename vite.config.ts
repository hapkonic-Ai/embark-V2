import devServer from "@hono/vite-dev-server"
import path from "path"
const __dirname = import.meta.dirname
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { inspectAttr } from 'kimi-plugin-inspect-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    devServer({ entry: "api/boot.ts", exclude: [/^\/(?!api\/).*$/] }),
    mode === "development" ? inspectAttr() : null,
    react(),
  ].filter(Boolean),
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@contracts": path.resolve(__dirname, "./contracts"),
      "@db": path.resolve(__dirname, "./db"),
      "db": path.resolve(__dirname, "./db"),
    },
  },
  envDir: path.resolve(__dirname),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes("node_modules")) {
            const parts = id.split("node_modules/");
            const pkg = parts[parts.length - 1].split("/")[0];
            const scope = pkg.startsWith("@") ? pkg.split("/").slice(0, 2).join("/") : pkg;
            // Group tiny shared deps into one vendor chunk to keep file count reasonable
            if (
              ["react", "react-dom", "react-router", "scheduler", "use-sync-external-store"].includes(scope)
            ) {
              return "react-vendor";
            }
            if (["framer-motion"].includes(scope)) return "motion";
            if (["recharts", "d3"].some((n) => scope.startsWith(n))) return "charts";
            if (
              ["@radix-ui", "cmdk", "vaul", "@floating-ui", "aria-hidden", "react-remove-scroll", "@react-aria"].some((n) =>
                scope.startsWith(n)
              )
            ) {
              return "ui-vendor";
            }
            if (
              ["@trpc", "@tanstack", "superjson"].some((n) => scope.startsWith(n))
            ) {
              return "data-vendor";
            }
            return "vendor";
          }
          return null;
        },
      },
    },
  },
}));
