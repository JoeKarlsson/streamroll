import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    environmentOptions: {
      jsdom: { url: "http://localhost" },
    },
    coverage: {
      provider: "v8",
      exclude: [
        "public/**",
        "scripts/**",
        ".claude/**",
        ".next/**",
        "vitest.setup.ts",
        "vitest.config.ts",
        "next.config.ts",
        "postcss.config.mjs",
      ],
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
});
