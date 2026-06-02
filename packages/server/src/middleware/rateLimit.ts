import rateLimit from "express-rate-limit";

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Terlalu banyak percobaan login. Coba lagi dalam 15 menit." },
  standardHeaders: true,
  legacyHeaders: false,
});
