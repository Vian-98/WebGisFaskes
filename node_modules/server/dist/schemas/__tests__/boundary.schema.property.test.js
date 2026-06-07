"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Feature: gis-faskes-bandar-lampung, Property 18: Invalid Boundary Metadata Input Rejected
const vitest_1 = require("vitest");
const fast_check_1 = __importDefault(require("fast-check"));
const boundary_schema_1 = require("../boundary.schema");
(0, vitest_1.test)("Property 18: invalid boundary metadata is rejected", () => {
    const invalidPayloadArb = fast_check_1.default.oneof(fast_check_1.default.record({ nama: fast_check_1.default.constant(""), level: fast_check_1.default.constantFrom("kecamatan", "kelurahan") }), fast_check_1.default.record({ nama: fast_check_1.default.string({ minLength: 1 }), level: fast_check_1.default.string({ minLength: 1 }) })
        .filter((payload) => payload.level !== "kecamatan" && payload.level !== "kelurahan"));
    fast_check_1.default.assert(fast_check_1.default.property(invalidPayloadArb, (payload) => {
        const result = boundary_schema_1.BoundaryUpdateSchema.safeParse(payload);
        (0, vitest_1.expect)(result.success).toBe(false);
        if (!result.success) {
            const errors = result.error.flatten().fieldErrors;
            (0, vitest_1.expect)(Object.keys(errors).length).toBeGreaterThan(0);
        }
    }));
});
