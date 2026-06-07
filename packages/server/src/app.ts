import express, { Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import cors from "cors";
import dotenv from "dotenv";
import { createProxyMiddleware } from "http-proxy-middleware";
import { pool } from "./db";
import publicRouter from "./routes/public";
import authRouter from "./routes/auth";
import adminRouter from "./routes/admin";

dotenv.config();

const app = express();

const PgSession = connectPgSimple(session);

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

const publicDir = path.resolve(process.cwd(), "public");
const adminDir = path.join(publicDir, "admin");
const publicIndex = path.join(publicDir, "index.html");
const adminIndex = path.join(adminDir, "index.html");

const isProduction = process.env.NODE_ENV === "production";

if (!isProduction) {
  // In dev mode, proxy non-API requests to Vite dev servers
  const adminProxy = createProxyMiddleware({
    pathFilter: (path: string) => path.startsWith("/admin"),
    target: "http://localhost:5174",
    changeOrigin: true,
    ws: true,
  });

  const frontendProxy = createProxyMiddleware({
    pathFilter: (path: string) =>
      !path.startsWith("/api") && !path.startsWith("/admin"),
    target: "http://localhost:5173",
    changeOrigin: true,
    ws: true,
  });

  app.use(adminProxy);
  app.use(frontendProxy);
} else {
  app.use("/admin", express.static(adminDir));
  app.use(express.static(publicDir));
}

app.use(express.json());

app.use(
  session({
    store: new PgSession({
      pool,
      tableName: "sessions",
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET ?? "change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 8 * 60 * 60 * 1000,
    },
  })
);

app.use("/api", publicRouter);
app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);

if (isProduction) {
  app.get(/^\/admin\/(.*)/, (req, res) => {
    if (fs.existsSync(adminIndex)) {
      res.sendFile(adminIndex);
      return;
    }
    res.status(404).json({ error: "Halaman admin belum dibuild." });
  });

  app.get(/^\/(.*)/, (req, res) => {
    if (fs.existsSync(publicIndex)) {
      res.sendFile(publicIndex);
      return;
    }
    res.status(404).json({ error: "Frontend belum dibuild." });
  });
}

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Unhandled error", err);
  const message = err.message ?? "";
  if (message.includes("ECONNREFUSED")) {
    res.status(503).json({ error: "Layanan tidak tersedia sementara." });
    return;
  }
  res.status(500).json({ error: "Terjadi kesalahan internal." });
});

export default app;
