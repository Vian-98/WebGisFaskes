import { beforeEach, describe, expect, test } from "vitest";
import request from "supertest";
import { randomUUID } from "crypto";
import app from "../../app";
import { resetDatabase, seedAdmin, seedBoundary } from "../../test/db";

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

describe("Admin integration", () => {
  beforeEach(async () => {
    await resetDatabase();
    await seedAdmin(adminUser.username, adminUser.password);
  });

  test("CRUD faskes flow", async () => {
    const agent = request.agent(app);
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
    expect(created.status).toBe(201);
    const id = created.body.properties.id as string;

    const updated = await agent
      .put(`/api/admin/faskes/${id}`)
      .send({ nama: "Klinik Update" });
    expect(updated.status).toBe(200);
    expect(updated.body.properties.nama).toBe("Klinik Update");

    const deleted = await agent.delete(`/api/admin/faskes/${id}`);
    expect(deleted.status).toBe(204);

    const missing = await agent.get(`/api/faskes/${id}`);
    expect(missing.status).toBe(404);
  });

  test("invalid faskes payload returns 400", async () => {
    const agent = request.agent(app);
    await agent.post("/api/auth/login").send(adminUser);

    const invalid = await agent.post("/api/admin/faskes").send({ nama: "" });
    expect(invalid.status).toBe(400);
    expect(invalid.body.details).toBeDefined();
  });

  test("update boundary metadata and geometry", async () => {
    const boundaryId = randomUUID();
    await seedBoundary({
      id: boundaryId,
      nama: "Boundary A",
      level: "kecamatan",
      geometry: sampleBoundary,
    });

    const agent = request.agent(app);
    await agent.post("/api/auth/login").send(adminUser);

    const metaUpdate = await agent
      .put(`/api/admin/boundaries/${boundaryId}`)
      .send({ nama: "Boundary B" });
    expect(metaUpdate.status).toBe(200);
    expect(metaUpdate.body.properties.nama).toBe("Boundary B");

    const geometryUpdate = await agent
      .put(`/api/admin/boundaries/${boundaryId}/geometry`)
      .send(anotherBoundary);
    expect(geometryUpdate.status).toBe(200);
  });

  test("invalid boundary geometry returns 400", async () => {
    const boundaryId = randomUUID();
    await seedBoundary({
      id: boundaryId,
      nama: "Boundary A",
      level: "kecamatan",
      geometry: sampleBoundary,
    });

    const agent = request.agent(app);
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
    expect(response.status).toBe(400);
  });
});
