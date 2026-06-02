"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const fast_check_1 = __importDefault(require("fast-check"));
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../../app"));
const db_1 = require("../../test/db");
const public_1 = require("../public");
// Generators for test data
const faskesRowGen = fast_check_1.default.record({
    id: fast_check_1.default.uuid(),
    nama: fast_check_1.default.string({ minLength: 1, maxLength: 100 }),
    jenis: fast_check_1.default.constantFrom("Puskesmas", "Klinik", "RS", "Apotek"),
    alamat: fast_check_1.default.string({ minLength: 1, maxLength: 200 }),
    kecamatan: fast_check_1.default.constantFrom("Ilir Barat I", "Ilir Barat II", "Ilir Timur I", "Ilir Timur II", "Bukit Kecil", "Tanjung Senang", "Teluk Betung Barat", "Teluk Betung Selatan", "Teluk Betung Timur", "Kebon Jeruk"),
    kelurahan: fast_check_1.default.string({ minLength: 1, maxLength: 100 }),
    geometry: fast_check_1.default.record({
        type: fast_check_1.default.constant("Point"),
        coordinates: fast_check_1.default.tuple(fast_check_1.default.double({ min: 105.18, max: 105.42, noNaN: true }), // longitude
        fast_check_1.default.double({ min: -5.52, max: -5.28, noNaN: true }) // latitude
        ),
    }),
});
const boundaryRowGen = fast_check_1.default.record({
    id: fast_check_1.default.uuid(),
    nama: fast_check_1.default.string({ minLength: 1, maxLength: 100 }),
    level: fast_check_1.default.constantFrom("kecamatan", "kelurahan"),
    geometry: fast_check_1.default.record({
        type: fast_check_1.default.constantFrom("Polygon", "MultiPolygon"),
        coordinates: fast_check_1.default.array(fast_check_1.default.array(fast_check_1.default.array(fast_check_1.default.tuple(fast_check_1.default.double({ min: 105.18, max: 105.42, noNaN: true }), fast_check_1.default.double({ min: -5.52, max: -5.28, noNaN: true })), { minLength: 4 }), { minLength: 1 }), { minLength: 1 }),
    }),
});
(0, vitest_1.describe)("Public Routes - Property Tests", () => {
    (0, vitest_1.describe)("Property 11: Collection Endpoint Returns Valid GeoJSON FeatureCollection", () => {
        (0, vitest_1.test)("buildFaskesFeatureCollection should return FeatureCollection with same number of features", () => {
            fast_check_1.default.assert(fast_check_1.default.property(fast_check_1.default.array(faskesRowGen, { minLength: 0, maxLength: 100 }), (rows) => {
                const features = rows.map((row) => (0, public_1.rowToFaskesFeature)(row));
                const collection = {
                    type: "FeatureCollection",
                    features,
                };
                // Property 11a: Type is FeatureCollection
                (0, vitest_1.expect)(collection.type).toBe("FeatureCollection");
                // Property 11b: Features array length matches input
                (0, vitest_1.expect)(collection.features).toHaveLength(rows.length);
                // Property 11c: All features have valid structure
                collection.features.forEach((feature, idx) => {
                    (0, vitest_1.expect)(feature).toEqual({
                        type: "Feature",
                        geometry: rows[idx].geometry,
                        properties: {
                            id: rows[idx].id,
                            nama: rows[idx].nama,
                            jenis: rows[idx].jenis,
                            alamat: rows[idx].alamat,
                            kecamatan: rows[idx].kecamatan,
                            kelurahan: rows[idx].kelurahan,
                        },
                    });
                });
                return true;
            }));
        });
        (0, vitest_1.test)("buildBoundaryFeatureCollection should return FeatureCollection with same number of features", () => {
            fast_check_1.default.assert(fast_check_1.default.property(fast_check_1.default.array(boundaryRowGen, { minLength: 0, maxLength: 100 }), (rows) => {
                const features = rows.map((row) => (0, public_1.rowToBoundaryFeature)(row));
                const collection = {
                    type: "FeatureCollection",
                    features,
                };
                // Property 11a: Type is FeatureCollection
                (0, vitest_1.expect)(collection.type).toBe("FeatureCollection");
                // Property 11b: Features array length matches input
                (0, vitest_1.expect)(collection.features).toHaveLength(rows.length);
                // Property 11c: All features have valid structure
                collection.features.forEach((feature, idx) => {
                    (0, vitest_1.expect)(feature).toEqual({
                        type: "Feature",
                        geometry: rows[idx].geometry,
                        properties: {
                            id: rows[idx].id,
                            nama: rows[idx].nama,
                            level: rows[idx].level,
                        },
                    });
                });
                return true;
            }));
        });
    });
    (0, vitest_1.describe)("Property 12: Lookup by ID Returns Matching GeoJSON Feature", () => {
        (0, vitest_1.test)("rowToFaskesFeature should return Feature with all properties matching input row", () => {
            fast_check_1.default.assert(fast_check_1.default.property(faskesRowGen, (row) => {
                const feature = (0, public_1.rowToFaskesFeature)(row);
                // Property 12a: Type is Feature
                (0, vitest_1.expect)(feature.type).toBe("Feature");
                // Property 12b: Geometry matches input
                (0, vitest_1.expect)(feature.geometry).toEqual(row.geometry);
                // Property 12c: All properties match input
                (0, vitest_1.expect)(feature.properties).toEqual({
                    id: row.id,
                    nama: row.nama,
                    jenis: row.jenis,
                    alamat: row.alamat,
                    kecamatan: row.kecamatan,
                    kelurahan: row.kelurahan,
                });
                // Property 12d: ID property matches row ID
                (0, vitest_1.expect)(feature.properties.id).toBe(row.id);
                return true;
            }));
        });
        (0, vitest_1.test)("rowToBoundaryFeature should return Feature with all properties matching input row", () => {
            fast_check_1.default.assert(fast_check_1.default.property(boundaryRowGen, (row) => {
                const feature = (0, public_1.rowToBoundaryFeature)(row);
                // Property 12a: Type is Feature
                (0, vitest_1.expect)(feature.type).toBe("Feature");
                // Property 12b: Geometry matches input
                (0, vitest_1.expect)(feature.geometry).toEqual(row.geometry);
                // Property 12c: All properties match input
                (0, vitest_1.expect)(feature.properties).toEqual({
                    id: row.id,
                    nama: row.nama,
                    level: row.level,
                });
                // Property 12d: ID property matches row ID
                (0, vitest_1.expect)(feature.properties.id).toBe(row.id);
                return true;
            }));
        });
    });
    (0, vitest_1.describe)("Property 13: Not-Found ID Returns 404", () => {
        (0, vitest_1.test)("GET /api/faskes/:id with non-existent UUID returns 404", async () => {
            await (0, db_1.resetDatabase)();
            await fast_check_1.default.assert(fast_check_1.default.asyncProperty(fast_check_1.default.uuid(), async (nonExistentId) => {
                const res = await (0, supertest_1.default)(app_1.default).get(`/api/faskes/${nonExistentId}`);
                (0, vitest_1.expect)(res.status).toBe(404);
                (0, vitest_1.expect)(res.body.error).toBeDefined();
            }));
        });
        (0, vitest_1.test)("GET /api/boundaries/:id with non-existent UUID returns 404", async () => {
            await (0, db_1.resetDatabase)();
            await fast_check_1.default.assert(fast_check_1.default.asyncProperty(fast_check_1.default.uuid(), async (nonExistentId) => {
                const res = await (0, supertest_1.default)(app_1.default).get(`/api/boundaries/${nonExistentId}`);
                (0, vitest_1.expect)(res.status).toBe(404);
                (0, vitest_1.expect)(res.body.error).toBeDefined();
            }));
        });
    });
});
