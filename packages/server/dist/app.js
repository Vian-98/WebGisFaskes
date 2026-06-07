"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const express_session_1 = __importDefault(require("express-session"));
const connect_pg_simple_1 = __importDefault(require("connect-pg-simple"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("./db");
const public_1 = __importDefault(require("./routes/public"));
const auth_1 = __importDefault(require("./routes/auth"));
const admin_1 = __importDefault(require("./routes/admin"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PgSession = (0, connect_pg_simple_1.default)(express_session_1.default);
app.use((0, cors_1.default)({
    origin: true,
    credentials: true,
}));
app.use(express_1.default.json());
app.use((0, express_session_1.default)({
    store: new PgSession({
        pool: db_1.pool,
        tableName: "sessions",
    }),
    secret: process.env.SESSION_SECRET ?? "change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 8 * 60 * 60 * 1000,
    },
}));
app.use("/api", public_1.default);
app.use("/api/auth", auth_1.default);
app.use("/api/admin", admin_1.default);
const publicDir = path_1.default.resolve(process.cwd(), "public");
const adminDir = path_1.default.join(publicDir, "admin");
const publicIndex = path_1.default.join(publicDir, "index.html");
const adminIndex = path_1.default.join(adminDir, "index.html");
app.use("/admin", express_1.default.static(adminDir));
app.use(express_1.default.static(publicDir));
app.get(/^\/admin\/(.*)/, (req, res) => {
    if (fs_1.default.existsSync(adminIndex)) {
        res.sendFile(adminIndex);
        return;
    }
    res.status(404).json({ error: "Halaman admin belum dibuild." });
});
app.get(/^\/(.*)/, (req, res) => {
    if (fs_1.default.existsSync(publicIndex)) {
        res.sendFile(publicIndex);
        return;
    }
    res.status(404).json({ error: "Frontend belum dibuild." });
});
app.use((err, req, res, next) => {
    console.error("Unhandled error", err);
    const message = err.message ?? "";
    if (message.includes("ECONNREFUSED")) {
        res.status(503).json({ error: "Layanan tidak tersedia sementara." });
        return;
    }
    res.status(500).json({ error: "Terjadi kesalahan internal." });
});
exports.default = app;
