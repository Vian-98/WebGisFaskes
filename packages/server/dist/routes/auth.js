"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = require("../db");
const rateLimit_1 = require("../middleware/rateLimit");
const auth_1 = require("../middleware/auth");
const password_1 = require("../auth/password");
const router = (0, express_1.Router)();
const LoginSchema = zod_1.z.object({
    username: zod_1.z.string().min(1, "Username tidak boleh kosong"),
    password: zod_1.z.string().min(1, "Password tidak boleh kosong"),
});
router.post("/login", rateLimit_1.loginRateLimiter, async (req, res) => {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: "Payload tidak valid.", details: parsed.error.flatten().fieldErrors });
        return;
    }
    try {
        const result = await db_1.db.execute((0, drizzle_orm_1.sql) `
      SELECT id, username, password_hash
      FROM admins
      WHERE username = ${parsed.data.username}
    `);
        const admin = result.rows[0];
        if (!admin) {
            res.status(401).json({ error: "Username atau password salah." });
            return;
        }
        const ok = await (0, password_1.verifyPassword)(parsed.data.password, admin.password_hash);
        if (!ok) {
            res.status(401).json({ error: "Username atau password salah." });
            return;
        }
        req.session.adminId = admin.id;
        res.json({ ok: true });
    }
    catch (error) {
        console.error("Login failed", error);
        res.status(503).json({ error: "Layanan tidak tersedia sementara." });
    }
});
router.post("/logout", auth_1.requireAuth, (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Logout failed", err);
            res.status(500).json({ error: "Terjadi kesalahan internal." });
            return;
        }
        res.json({ ok: true });
    });
});
exports.default = router;
