"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
function requireAuth(req, res, next) {
    if (!req.session?.adminId) {
        res.status(401).json({ error: "Tidak terautentikasi. Silakan login." });
        return;
    }
    next();
}
