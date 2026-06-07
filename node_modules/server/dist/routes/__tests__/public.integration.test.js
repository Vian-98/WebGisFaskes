"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const supertest_1 = __importDefault(require("supertest"));
const crypto_1 = require("crypto");
const app_1 = __importDefault(require("../../app"));
const db_1 = require("../../test/db");
const sampleBoundary = {
    type: "MultiPolygon",
    coordinates: [
        [
            [
                [105.2, -5.3],
                [105.3, -5.3],
                [105.3, -5.4],
                [105.2, -5.4],
                [105.2, -5.3],
            ],
        ],
    ],
};
(0, vitest_1.describe)("Public API integration", () => {
    (0, vitest_1.beforeEach)(async () => {
        await (0, db_1.resetDatabase)();
        await (0, db_1.seedFaskes)({
            id: (0, crypto_1.randomUUID)(),
            nama: "RS Test",
            jenis: "rumah_sakit",
            alamat: "Jl. Test",
            kecamatan: "Enggal",
            kelurahan: "Pelita",
            latitude: -5.35,
            longitude: 105.25,
        });
        await (0, db_1.seedBoundary)({
            id: (0, crypto_1.randomUUID)(),
            nama: "Kecamatan Test",
            level: "kecamatan",
            geometry: sampleBoundary,
        });
    });
    (0, vitest_1.test)("GET /api/faskes returns FeatureCollection", async () => {
        const response = await (0, supertest_1.default)(app_1.default).get("/api/faskes");
        (0, vitest_1.expect)(response.status).toBe(200);
        (0, vitest_1.expect)(response.body.type).toBe("FeatureCollection");
        (0, vitest_1.expect)(response.body.features.length).toBe(1);
    });
    (0, vitest_1.test)("GET /api/faskes/:id returns Feature", async () => {
        const list = await (0, supertest_1.default)(app_1.default).get("/api/faskes");
        const id = list.body.features[0].properties.id;
        const response = await (0, supertest_1.default)(app_1.default).get(`/api/faskes/${id}`);
        (0, vitest_1.expect)(response.status).toBe(200);
        (0, vitest_1.expect)(response.body.type).toBe("Feature");
        (0, vitest_1.expect)(response.body.properties.id).toBe(id);
    });
    (0, vitest_1.test)("GET /api/faskes/:id returns 404 for missing", async () => {
        const response = await (0, supertest_1.default)(app_1.default).get(`/api/faskes/${(0, crypto_1.randomUUID)()}`);
        (0, vitest_1.expect)(response.status).toBe(404);
        (0, vitest_1.expect)(response.body.error).toBeDefined();
    });
    (0, vitest_1.test)("GET /api/boundaries returns FeatureCollection", async () => {
        const response = await (0, supertest_1.default)(app_1.default).get("/api/boundaries");
        (0, vitest_1.expect)(response.status).toBe(200);
        (0, vitest_1.expect)(response.body.type).toBe("FeatureCollection");
        (0, vitest_1.expect)(response.body.features.length).toBe(1);
    });
    (0, vitest_1.test)("GET /api/boundaries/:id returns 404 for missing", async () => {
        const response = await (0, supertest_1.default)(app_1.default).get(`/api/boundaries/${(0, crypto_1.randomUUID)()}`);
        (0, vitest_1.expect)(response.status).toBe(404);
        (0, vitest_1.expect)(response.body.error).toBeDefined();
    });
});
