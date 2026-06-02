import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  base: "/admin/",
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: path.resolve(__dirname, "../server/public/admin"),
    emptyOutDir: false,
  },
});
