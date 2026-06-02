import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  base: "/admin/",
  build: {
    outDir: path.resolve(__dirname, "../server/public/admin"),
    emptyOutDir: false,
  },
});
