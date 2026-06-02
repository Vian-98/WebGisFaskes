"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Feature: gis-faskes-bandar-lampung, Property 14: Unauthenticated Requests Rejected on All Protected Routes
const vitest_1 = require("vitest");
const fast_check_1 = __importDefault(require("fast-check"));
const express_1 = __importDefault(require("express"));
const supertest_1 = __importDefault(require("supertest"));
const auth_1 = require("../auth");
(0, vitest_1.describe)("Property 14: requireAuth rejects unauthenticated requests", () => {
    (0, vitest_1.test)("rejects requests without session", async () => {
        const app = (0, express_1.default)();
        app.get("/protected", auth_1.requireAuth, (req, res) => res.json({ ok: true }));
        await fast_check_1.default.assert(fast_check_1.default.asyncProperty(fast_check_1.default.constant(null), async () => {
            const response = await (0, supertest_1.default)(app).get("/protected");
            (0, vitest_1.expect)(response.status).toBe(401);
        }));
    });
});
