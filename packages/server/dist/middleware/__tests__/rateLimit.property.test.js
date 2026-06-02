"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Feature: gis-faskes-bandar-lampung, Property 15: Rate Limiting Enforced After 5 Failed Login Attempts
const vitest_1 = require("vitest");
const express_1 = __importDefault(require("express"));
const supertest_1 = __importDefault(require("supertest"));
const rateLimit_1 = require("../rateLimit");
function createApp() {
    const app = (0, express_1.default)();
    app.use("/login", rateLimit_1.loginRateLimiter, (req, res) => res.status(401).json({ error: "invalid" }));
    return app;
}
(0, vitest_1.describe)("Property 15: rate limiting after 5 failed attempts", () => {
    (0, vitest_1.beforeEach)(() => {
        rateLimit_1.loginRateLimiter.resetKey("127.0.0.1");
        rateLimit_1.loginRateLimiter.resetKey("::ffff:127.0.0.1");
        rateLimit_1.loginRateLimiter.resetKey("::1");
    });
    (0, vitest_1.test)("sixth attempt is rejected", async () => {
        const app = createApp();
        const agent = supertest_1.default.agent(app);
        for (let i = 0; i < 5; i += 1) {
            const response = await agent.post("/login");
            (0, vitest_1.expect)(response.status).toBe(401);
        }
        const blocked = await agent.post("/login");
        (0, vitest_1.expect)(blocked.status).toBe(429);
    });
});
