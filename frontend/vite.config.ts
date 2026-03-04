import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";

// https://vite.dev/config/
export default defineConfig({
  base: "/voice-control-commander/",
  plugins: [
    react(),
    tailwindcss(),
    nodePolyfills({
      // bplist-parser が Buffer を使用するため必要
      include: ["buffer", "events", "stream", "util", "process"],
    }),
  ],
});
