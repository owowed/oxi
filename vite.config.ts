import { defineConfig } from "vite";

export default defineConfig({
    build: {
        outDir: "./dist",
        sourcemap: true,
        lib: {
            entry: "./src/index.ts",
            name: "oxi",
            fileName: (format) => `oxi.${format}.js`,
        },
    },
});
