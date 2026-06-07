import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  base: "/",
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: path.resolve(__dirname, "../server/public"),
    emptyOutDir: false,
  },
});
