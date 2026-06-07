import { Request, Response, NextFunction } from "express";

declare module "express-session" {
  interface SessionData {
    adminId?: string;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.session?.adminId) {
    res.status(401).json({ error: "Tidak terautentikasi. Silakan login." });
    return;
  }

  next();
}
