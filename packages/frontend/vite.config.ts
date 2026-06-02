import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  base: "/",
  build: {
    outDir: path.resolve(__dirname, "../server/public"),
    emptyOutDir: false,
  },
});
