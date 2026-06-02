import { Router } from "express";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { db } from "../db";
import { loginRateLimiter } from "../middleware/rateLimit";
import { requireAuth } from "../middleware/auth";
import { verifyPassword } from "../auth/password";

const router = Router();

const LoginSchema = z.object({
  username: z.string().min(1, "Username tidak boleh kosong"),
  password: z.string().min(1, "Password tidak boleh kosong"),
});

type AdminRow = {
  id: string;
  username: string;
  password_hash: string;
};

router.post("/login", loginRateLimiter, async (req, res) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Payload tidak valid.", details: parsed.error.flatten().fieldErrors });
    return;
  }

  try {
    const result = await db.execute(sql`
      SELECT id, username, password_hash
      FROM admins
      WHERE username = ${parsed.data.username}
    `);

    const admin = result.rows[0] as AdminRow | undefined;
    if (!admin) {
      res.status(401).json({ error: "Username atau password salah." });
      return;
    }

    const ok = await verifyPassword(parsed.data.password, admin.password_hash);
    if (!ok) {
      res.status(401).json({ error: "Username atau password salah." });
      return;
    }

    req.session.adminId = admin.id;
    res.json({ ok: true });
  } catch (error) {
    console.error("Login failed", error);
    res.status(503).json({ error: "Layanan tidak tersedia sementara." });
  }
});

router.post("/logout", requireAuth, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout failed", err);
      res.status(500).json({ error: "Terjadi kesalahan internal." });
      return;
    }
    res.json({ ok: true });
  });
});

export default router;
