import { defineConfig, build, type Plugin } from "vite";

function buildAlSignup(): Plugin {
    let done = false;
    return {
        name: "build-al-signup",
        enforce: "post",
        async closeBundle() {
            if (done) return;
            done = true;
            await build({
                configFile: false,
                build: {
                    outDir: "assets",
                    emptyOutDir: false,
                    lib: {
                        entry: "src/runtime/al-signup.ts",
                        name: "AL_SIGNUP_RUNTIME",
                        formats: ["iife"],
                        fileName: () => "al-signup.js",
                    },
                    sourcemap: false,
                    minify: false,
                },
            });
        },
    };
}

export default defineConfig({
    plugins: [buildAlSignup()],
    build: {
        outDir: "assets",
        emptyOutDir: false,
        lib: {
            entry: "src/runtime/analytics.ts",
            name: "AL_ANALYTICS_RUNTIME",
            formats: ["iife"],
            fileName: () => "analytics.js",
        },
        sourcemap: false,
        minify: false,
    },
});
