import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: "assets",
    emptyOutDir: false,
    lib: {
      entry: "src/dispatcher.ts",
      name: "AL_RENDERER",
      formats: ["iife"],
      fileName: () => "renderer.js",
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
    sourcemap: false,
    minify: false,
  },
});
