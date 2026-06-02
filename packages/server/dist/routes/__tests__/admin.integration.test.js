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
const adminUser = { username: "admin", password: "secret123" };
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
const anotherBoundary = {
    type: "MultiPolygon",
    coordinates: [
        [
            [
                [105.22, -5.31],
                [105.32, -5.31],
                [105.32, -5.41],
                [105.22, -5.41],
                [105.22, -5.31],
            ],
        ],
    ],
};
(0, vitest_1.describe)("Admin integration", () => {
    (0, vitest_1.beforeEach)(async () => {
        await (0, db_1.resetDatabase)();
        await (0, db_1.seedAdmin)(adminUser.username, adminUser.password);
    });
    (0, vitest_1.test)("CRUD faskes flow", async () => {
        const agent = supertest_1.default.agent(app_1.default);
        await agent.post("/api/auth/login").send(adminUser);
        const createPayload = {
            nama: "Klinik Test",
            jenis: "klinik",
            alamat: "Jl. Test",
            kecamatan: "Enggal",
            kelurahan: "Pelita",
            latitude: -5.35,
            longitude: 105.25,
        };
        const created = await agent.post("/api/admin/faskes").send(createPayload);
        (0, vitest_1.expect)(created.status).toBe(201);
        const id = created.body.properties.id;
        const updated = await agent
            .put(`/api/admin/faskes/${id}`)
            .send({ nama: "Klinik Update" });
        (0, vitest_1.expect)(updated.status).toBe(200);
        (0, vitest_1.expect)(updated.body.properties.nama).toBe("Klinik Update");
        const deleted = await agent.delete(`/api/admin/faskes/${id}`);
        (0, vitest_1.expect)(deleted.status).toBe(204);
        const missing = await agent.get(`/api/faskes/${id}`);
        (0, vitest_1.expect)(missing.status).toBe(404);
    });
    (0, vitest_1.test)("invalid faskes payload returns 400", async () => {
        const agent = supertest_1.default.agent(app_1.default);
        await agent.post("/api/auth/login").send(adminUser);
        const invalid = await agent.post("/api/admin/faskes").send({ nama: "" });
        (0, vitest_1.expect)(invalid.status).toBe(400);
        (0, vitest_1.expect)(invalid.body.details).toBeDefined();
    });
    (0, vitest_1.test)("update boundary metadata and geometry", async () => {
        const boundaryId = (0, crypto_1.randomUUID)();
        await (0, db_1.seedBoundary)({
            id: boundaryId,
            nama: "Boundary A",
            level: "kecamatan",
            geometry: sampleBoundary,
        });
        const agent = supertest_1.default.agent(app_1.default);
        await agent.post("/api/auth/login").send(adminUser);
        const metaUpdate = await agent
            .put(`/api/admin/boundaries/${boundaryId}`)
            .send({ nama: "Boundary B" });
        (0, vitest_1.expect)(metaUpdate.status).toBe(200);
        (0, vitest_1.expect)(metaUpdate.body.properties.nama).toBe("Boundary B");
        const geometryUpdate = await agent
            .put(`/api/admin/boundaries/${boundaryId}/geometry`)
            .send(anotherBoundary);
        (0, vitest_1.expect)(geometryUpdate.status).toBe(200);
    });
    (0, vitest_1.test)("invalid boundary geometry returns 400", async () => {
        const boundaryId = (0, crypto_1.randomUUID)();
        await (0, db_1.seedBoundary)({
            id: boundaryId,
            nama: "Boundary A",
            level: "kecamatan",
            geometry: sampleBoundary,
        });
        const agent = supertest_1.default.agent(app_1.default);
        await agent.post("/api/auth/login").send(adminUser);
        const invalidGeometry = {
            type: "Polygon",
            coordinates: [
                [
                    [105.2, -5.3],
                    [105.3, -5.3],
                    [105.3, -5.4],
                ],
            ],
        };
        const response = await agent
            .put(`/api/admin/boundaries/${boundaryId}/geometry`)
            .send(invalidGeometry);
        (0, vitest_1.expect)(response.status).toBe(400);
    });
});
