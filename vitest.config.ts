import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // Alias `@/*` disamakan dengan `tsconfig.json` (`"@/*": ["./src/*"]`) —
  // tanpa ini, modul di `src/app` yang memakai alias Next.js (mis.
  // `@/core/galat` di `src/app/api/baca/route.ts`) tidak dapat dimuat
  // vitest, sehingga endpoint tidak bisa diuji langsung dari test (S12-3).
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
  },
});
