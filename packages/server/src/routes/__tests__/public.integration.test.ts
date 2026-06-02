import { beforeEach, describe, expect, test } from "vitest";
import request from "supertest";
import { randomUUID } from "crypto";
import app from "../../app";
import { resetDatabase, seedBoundary, seedFaskes } from "../../test/db";

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

describe("Public API integration", () => {
  beforeEach(async () => {
    await resetDatabase();

    await seedFaskes({
      id: randomUUID(),
      nama: "RS Test",
      jenis: "rumah_sakit",
      alamat: "Jl. Test",
      kecamatan: "Enggal",
      kelurahan: "Pelita",
      latitude: -5.35,
      longitude: 105.25,
    });

    await seedBoundary({
      id: randomUUID(),
      nama: "Kecamatan Test",
      level: "kecamatan",
      geometry: sampleBoundary,
    });
  });

  test("GET /api/faskes returns FeatureCollection", async () => {
    const response = await request(app).get("/api/faskes");
    expect(response.status).toBe(200);
    expect(response.body.type).toBe("FeatureCollection");
    expect(response.body.features.length).toBe(1);
  });

  test("GET /api/faskes/:id returns Feature", async () => {
    const list = await request(app).get("/api/faskes");
    const id = list.body.features[0].properties.id as string;

    const response = await request(app).get(`/api/faskes/${id}`);
    expect(response.status).toBe(200);
    expect(response.body.type).toBe("Feature");
    expect(response.body.properties.id).toBe(id);
  });

  test("GET /api/faskes/:id returns 404 for missing", async () => {
    const response = await request(app).get(`/api/faskes/${randomUUID()}`);
    expect(response.status).toBe(404);
    expect(response.body.error).toBeDefined();
  });

  test("GET /api/boundaries returns FeatureCollection", async () => {
    const response = await request(app).get("/api/boundaries");
    expect(response.status).toBe(200);
    expect(response.body.type).toBe("FeatureCollection");
    expect(response.body.features.length).toBe(1);
  });

  test("GET /api/boundaries/:id returns 404 for missing", async () => {
    const response = await request(app).get(`/api/boundaries/${randomUUID()}`);
    expect(response.status).toBe(404);
    expect(response.body.error).toBeDefined();
  });
});
