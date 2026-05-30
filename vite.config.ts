import { defineConfig } from "vite";
import { resolve } from "node:path";
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
      "#tanstack-router-entry": resolve(".tanstack/router/entry.js"),
      "#tanstack-start-entry": resolve(".tanstack/start/entry.js"),
      "#tanstack-start-plugin-adapters": resolve(".tanstack/start/plugin-adapters.js"),
      "tanstack-start-manifest:v": resolve(".tanstack/start/manifest.js"),
      "tanstack-start-injected-head-scripts:v": resolve(".tanstack/start/injected-head-scripts.js"),
    },
  },
});