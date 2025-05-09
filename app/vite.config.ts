import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => {

  return {
    base: "/",
    plugins: [react(), tsconfigPaths()],
    resolve: {
      alias: {
        "@": "/src",
      },
    },
    server: {
      fs: {
        strict: false,
      },
    },
    build: {
      outDir: "dist",
      assetsDir: "assets",
    },
  };
});
