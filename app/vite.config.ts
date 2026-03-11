import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: "@koinara/shared", replacement: resolve(__dirname, "../shared/src") },
      { find: "@koinara/shared/", replacement: `${resolve(__dirname, "../shared/src")}/` }
    ]
  },
  build: {
    outDir: "dist-renderer"
  },
  test: {
    environment: "jsdom",
    include: ["test/**/*.test.ts", "test/**/*.test.tsx"],
    setupFiles: ["./test/setup.ts"]
  }
});
