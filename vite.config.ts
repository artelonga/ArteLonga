import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: "assets",
    emptyOutDir: false,
    rollupOptions: {
      input: { showcase: "src/showcase.ts" },
      output: {
        entryFileNames: "[name].js",
        format: "es",
      },
    },
    sourcemap: false,
    minify: false,
  },
});
