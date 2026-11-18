import { configDefaults, defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    // e2e/ is Playwright's; .claude/ holds agent worktrees with their own copies of the tests.
    exclude: [...configDefaults.exclude, "e2e/**", ".claude/**"],
    environmentOptions: {
      jsdom: { url: "http://localhost" },
    },
    coverage: {
      provider: "v8",
      include: ["app/**", "lib/**", "hooks/**"],
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
});
