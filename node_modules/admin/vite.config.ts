import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  base: "/admin/",
  server: {
    port: 5174,
    strictPort: true,
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
