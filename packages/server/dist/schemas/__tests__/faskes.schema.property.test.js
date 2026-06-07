"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Feature: gis-faskes-bandar-lampung, Property 17: Invalid Faskes Input Rejected with Field-Specific Errors
const vitest_1 = require("vitest");
const fast_check_1 = __importDefault(require("fast-check"));
const faskes_schema_1 = require("../faskes.schema");
const validFaskesArb = fast_check_1.default.record({
    nama: fast_check_1.default.string({ minLength: 1, maxLength: 50 }),
    jenis: fast_check_1.default.string({ minLength: 1, maxLength: 30 }),
    alamat: fast_check_1.default.string({ maxLength: 120 }),
    kecamatan: fast_check_1.default.string({ maxLength: 80 }),
    kelurahan: fast_check_1.default.string({ maxLength: 80 }),
    latitude: fast_check_1.default.double({
        min: faskes_schema_1.BANDAR_LAMPUNG_BBOX.minLat,
        max: faskes_schema_1.BANDAR_LAMPUNG_BBOX.maxLat,
        noNaN: true,
    }),
    longitude: fast_check_1.default.double({
        min: faskes_schema_1.BANDAR_LAMPUNG_BBOX.minLon,
        max: faskes_schema_1.BANDAR_LAMPUNG_BBOX.maxLon,
        noNaN: true,
    }),
});
const invalidLatitudeArb = fast_check_1.default.oneof(fast_check_1.default.double({ max: faskes_schema_1.BANDAR_LAMPUNG_BBOX.minLat - 0.001, noNaN: true }), fast_check_1.default.double({ min: faskes_schema_1.BANDAR_LAMPUNG_BBOX.maxLat + 0.001, noNaN: true }), fast_check_1.default.constant(Number.NaN));
const invalidLongitudeArb = fast_check_1.default.oneof(fast_check_1.default.double({ max: faskes_schema_1.BANDAR_LAMPUNG_BBOX.minLon - 0.001, noNaN: true }), fast_check_1.default.double({ min: faskes_schema_1.BANDAR_LAMPUNG_BBOX.maxLon + 0.001, noNaN: true }), fast_check_1.default.constant(Number.NaN));
const invalidPayloadArb = fast_check_1.default.oneof(validFaskesArb.map((payload) => ({
    payload: { ...payload, nama: "" },
    field: "nama",
})), validFaskesArb.map((payload) => ({
    payload: { ...payload, jenis: "" },
    field: "jenis",
})), fast_check_1.default.record({
    payload: validFaskesArb,
    field: fast_check_1.default.constant("latitude"),
    invalid: invalidLatitudeArb,
}).map(({ payload, field, invalid }) => ({
    payload: { ...payload, latitude: invalid },
    field,
})), fast_check_1.default.record({
    payload: validFaskesArb,
    field: fast_check_1.default.constant("longitude"),
    invalid: invalidLongitudeArb,
}).map(({ payload, field, invalid }) => ({
    payload: { ...payload, longitude: invalid },
    field,
})));
(0, vitest_1.test)("Property 17: invalid faskes payload is rejected with field errors", () => {
    fast_check_1.default.assert(fast_check_1.default.property(invalidPayloadArb, ({ payload, field }) => {
        const result = faskes_schema_1.FaskesCreateSchema.safeParse(payload);
        (0, vitest_1.expect)(result.success).toBe(false);
        if (!result.success) {
            const errors = result.error.flatten().fieldErrors;
            (0, vitest_1.expect)(errors[field]?.length).toBeGreaterThan(0);
        }
    }));
});
