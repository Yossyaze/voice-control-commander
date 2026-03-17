import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";

// https://vite.dev/config/
export default defineConfig({
  base: "/voice-control-commander/",
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = id.replace(/\\/g, "/");
          if (!normalizedId.includes("node_modules")) return;

          if (normalizedId.includes("firebase")) return "vendor-firebase";
          if (normalizedId.includes("@dnd-kit")) return "vendor-dnd";
          if (normalizedId.includes("bplist") || normalizedId.includes("plist")) {
            return "vendor-plist";
          }
          if (normalizedId.includes("react") || normalizedId.includes("scheduler")) {
            return "vendor-react";
          }

          const modulePath = normalizedId.split("node_modules/")[1];
          if (!modulePath) return "vendor-misc";

          const parts = modulePath.split("/");
          const packageName = parts[0].startsWith("@")
            ? `${parts[0]}-${parts[1] ?? "unknown"}`
            : parts[0];

          return `vendor-${packageName.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
        },
      },
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    nodePolyfills({
      // bplist-parser が Buffer を使用するため必要
      include: ["buffer", "events", "stream", "util", "process", "fs"],
    }),
  ],
});
