"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../../app"));
const db_1 = require("../../test/db");
const rateLimit_1 = require("../../middleware/rateLimit");
const adminUser = { username: "admin", password: "secret123" };
(0, vitest_1.describe)("Auth integration", () => {
    (0, vitest_1.beforeEach)(async () => {
        await (0, db_1.resetDatabase)();
        await (0, db_1.seedAdmin)(adminUser.username, adminUser.password);
        rateLimit_1.loginRateLimiter.resetKey("127.0.0.1");
        rateLimit_1.loginRateLimiter.resetKey("::ffff:127.0.0.1");
        rateLimit_1.loginRateLimiter.resetKey("::1");
    });
    (0, vitest_1.test)("login with valid credentials returns session", async () => {
        const response = await (0, supertest_1.default)(app_1.default).post("/api/auth/login").send(adminUser);
        (0, vitest_1.expect)(response.status).toBe(200);
        (0, vitest_1.expect)(response.headers["set-cookie"]).toBeDefined();
    });
    (0, vitest_1.test)("login with invalid password returns 401", async () => {
        const response = await (0, supertest_1.default)(app_1.default)
            .post("/api/auth/login")
            .send({ username: adminUser.username, password: "wrong" });
        (0, vitest_1.expect)(response.status).toBe(401);
    });
    (0, vitest_1.test)("protected route requires session", async () => {
        const response = await (0, supertest_1.default)(app_1.default).get("/api/admin/faskes");
        (0, vitest_1.expect)(response.status).toBe(401);
    });
    (0, vitest_1.test)("logout ends session", async () => {
        const agent = supertest_1.default.agent(app_1.default);
        await agent.post("/api/auth/login").send(adminUser);
        const logout = await agent.post("/api/auth/logout");
        (0, vitest_1.expect)(logout.status).toBe(200);
        const after = await agent.get("/api/admin/faskes");
        (0, vitest_1.expect)(after.status).toBe(401);
    });
    (0, vitest_1.test)("rate limit triggers after 5 failures", async () => {
        const agent = supertest_1.default.agent(app_1.default);
        for (let i = 0; i < 5; i += 1) {
            const response = await agent
                .post("/api/auth/login")
                .send({ username: adminUser.username, password: "wrong" });
            (0, vitest_1.expect)(response.status).toBe(401);
        }
        const blocked = await agent
            .post("/api/auth/login")
            .send({ username: adminUser.username, password: "wrong" });
        (0, vitest_1.expect)(blocked.status).toBe(429);
    });
});
