import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { cloudflare } from "@cloudflare/vite-plugin";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";

export default defineConfig({
  plugins: [
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    tanstackStart({ server: { entry: "server" } }),
    react(),
    tailwindcss(),
    tsconfigPaths({ ignoreConfigErrors: true }),
  ],
  resolve: {
    alias: {
      "#tanstack-router-entry": "/.tanstack/router/entry.js",
      "#tanstack-start-entry": "/.tanstack/start/entry.js",
      "#tanstack-start-plugin-adapters": "/.tanstack/start/plugin-adapters.js",
      "tanstack-start-manifest:v": "/.tanstack/start/manifest.js",
      "tanstack-start-injected-head-scripts:v": "/.tanstack/start/injected-head-scripts.js",
    },
  },
});