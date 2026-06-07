"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Feature: gis-faskes-bandar-lampung, Property 16: Password Stored as bcrypt Hash with Sufficient Cost Factor
const vitest_1 = require("vitest");
const fast_check_1 = __importDefault(require("fast-check"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const password_1 = require("../password");
(0, vitest_1.test)("Property 16: password is stored as bcrypt hash", async () => {
    await fast_check_1.default.assert(fast_check_1.default.asyncProperty(fast_check_1.default.string({ minLength: 1, maxLength: 72 }), async (password) => {
        const hash = await (0, password_1.hashPassword)(password);
        const isValid = await bcryptjs_1.default.compare(password, hash);
        const costFactor = parseInt(hash.split("$")[2], 10);
        (0, vitest_1.expect)(isValid).toBe(true);
        (0, vitest_1.expect)(hash).not.toBe(password);
        (0, vitest_1.expect)(costFactor).toBeGreaterThanOrEqual(10);
    }));
});
