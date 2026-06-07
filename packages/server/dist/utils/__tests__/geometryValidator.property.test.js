"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Feature: gis-faskes-bandar-lampung, Property 9: Coordinate and GeoJSON Validation (backend geometry validator)
const vitest_1 = require("vitest");
const fast_check_1 = __importDefault(require("fast-check"));
const geometryValidator_1 = require("../geometryValidator");
const positionArb = fast_check_1.default.tuple(fast_check_1.default.double({ min: -180, max: 180, noNaN: true }), fast_check_1.default.double({ min: -90, max: 90, noNaN: true }));
const closedRingArb = fast_check_1.default
    .array(positionArb, { minLength: 3, maxLength: 8 })
    .map((points) => {
    const ring = [...points, points[0]];
    return ring;
});
const openRingArb = fast_check_1.default.array(positionArb, { minLength: 3, maxLength: 8 });
const validPolygonArb = closedRingArb.map((ring) => ({
    type: "Polygon",
    coordinates: [ring],
}));
const invalidPolygonArb = fast_check_1.default.oneof(openRingArb.map((ring) => ({ type: "Polygon", coordinates: [ring] })), fast_check_1.default.constant({ type: "Polygon", coordinates: [] }));
const validMultiPolygonArb = fast_check_1.default.array(closedRingArb, { minLength: 1, maxLength: 3 }).map((rings) => ({
    type: "MultiPolygon",
    coordinates: rings.map((ring) => [ring]),
}));
const invalidMultiPolygonArb = fast_check_1.default.oneof(fast_check_1.default.array(openRingArb, { minLength: 1, maxLength: 3 }).map((rings) => ({
    type: "MultiPolygon",
    coordinates: rings.map((ring) => [ring]),
})), fast_check_1.default.constant({ type: "MultiPolygon", coordinates: [] }));
(0, vitest_1.test)("Property 9: valid Polygon geometries are accepted", () => {
    fast_check_1.default.assert(fast_check_1.default.property(validPolygonArb, (geometry) => {
        const result = (0, geometryValidator_1.validateBoundaryGeometry)(geometry);
        (0, vitest_1.expect)(result.valid).toBe(true);
    }));
});
(0, vitest_1.test)("Property 9: invalid Polygon geometries are rejected", () => {
    fast_check_1.default.assert(fast_check_1.default.property(invalidPolygonArb, (geometry) => {
        const result = (0, geometryValidator_1.validateBoundaryGeometry)(geometry);
        (0, vitest_1.expect)(result.valid).toBe(false);
    }));
});
(0, vitest_1.test)("Property 9: valid MultiPolygon geometries are accepted", () => {
    fast_check_1.default.assert(fast_check_1.default.property(validMultiPolygonArb, (geometry) => {
        const result = (0, geometryValidator_1.validateBoundaryGeometry)(geometry);
        (0, vitest_1.expect)(result.valid).toBe(true);
    }));
});
(0, vitest_1.test)("Property 9: invalid MultiPolygon geometries are rejected", () => {
    fast_check_1.default.assert(fast_check_1.default.property(invalidMultiPolygonArb, (geometry) => {
        const result = (0, geometryValidator_1.validateBoundaryGeometry)(geometry);
        (0, vitest_1.expect)(result.valid).toBe(false);
    }));
});
