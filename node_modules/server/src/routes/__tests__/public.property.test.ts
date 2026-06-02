import { describe, test, expect } from "vitest";
import fc from "fast-check";
import request from "supertest";
import app from "../../app";
import { resetDatabase } from "../../test/db";
import { rowToFaskesFeature, rowToBoundaryFeature } from "../public";

// Generators for test data
const faskesRowGen = fc.record({
  id: fc.uuid(),
  nama: fc.string({ minLength: 1, maxLength: 100 }),
  jenis: fc.constantFrom("Puskesmas", "Klinik", "RS", "Apotek"),
  alamat: fc.string({ minLength: 1, maxLength: 200 }),
  kecamatan: fc.constantFrom(
    "Ilir Barat I",
    "Ilir Barat II",
    "Ilir Timur I",
    "Ilir Timur II",
    "Bukit Kecil",
    "Tanjung Senang",
    "Teluk Betung Barat",
    "Teluk Betung Selatan",
    "Teluk Betung Timur",
    "Kebon Jeruk"
  ),
  kelurahan: fc.string({ minLength: 1, maxLength: 100 }),
  geometry: fc.record({
    type: fc.constant("Point"),
    coordinates: fc.tuple(
      fc.double({ min: 105.18, max: 105.42, noNaN: true }), // longitude
      fc.double({ min: -5.52, max: -5.28, noNaN: true }) // latitude
    ),
  }),
});

const boundaryRowGen = fc.record({
  id: fc.uuid(),
  nama: fc.string({ minLength: 1, maxLength: 100 }),
  level: fc.constantFrom("kecamatan", "kelurahan"),
  geometry: fc.record({
    type: fc.constantFrom("Polygon", "MultiPolygon"),
    coordinates: fc.array(
      fc.array(
        fc.array(
          fc.tuple(
            fc.double({ min: 105.18, max: 105.42, noNaN: true }),
            fc.double({ min: -5.52, max: -5.28, noNaN: true })
          ),
          { minLength: 4 }
        ),
        { minLength: 1 }
      ),
      { minLength: 1 }
    ),
  }),
});

describe("Public Routes - Property Tests", () => {
  describe("Property 11: Collection Endpoint Returns Valid GeoJSON FeatureCollection", () => {
    test("buildFaskesFeatureCollection should return FeatureCollection with same number of features", () => {
      fc.assert(
        fc.property(fc.array(faskesRowGen, { minLength: 0, maxLength: 100 }), (rows) => {
          const features = rows.map((row) => rowToFaskesFeature(row as any));
          const collection = {
            type: "FeatureCollection",
            features,
          };

          // Property 11a: Type is FeatureCollection
          expect(collection.type).toBe("FeatureCollection");

          // Property 11b: Features array length matches input
          expect(collection.features).toHaveLength(rows.length);

          // Property 11c: All features have valid structure
          collection.features.forEach((feature, idx) => {
            expect(feature).toEqual({
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
        })
      );
    });

    test("buildBoundaryFeatureCollection should return FeatureCollection with same number of features", () => {
      fc.assert(
        fc.property(fc.array(boundaryRowGen, { minLength: 0, maxLength: 100 }), (rows) => {
          const features = rows.map((row) => rowToBoundaryFeature(row as any));
          const collection = {
            type: "FeatureCollection",
            features,
          };

          // Property 11a: Type is FeatureCollection
          expect(collection.type).toBe("FeatureCollection");

          // Property 11b: Features array length matches input
          expect(collection.features).toHaveLength(rows.length);

          // Property 11c: All features have valid structure
          collection.features.forEach((feature, idx) => {
            expect(feature).toEqual({
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
        })
      );
    });
  });

  describe("Property 12: Lookup by ID Returns Matching GeoJSON Feature", () => {
    test("rowToFaskesFeature should return Feature with all properties matching input row", () => {
      fc.assert(
        fc.property(faskesRowGen, (row) => {
          const feature = rowToFaskesFeature(row as any);

          // Property 12a: Type is Feature
          expect(feature.type).toBe("Feature");

          // Property 12b: Geometry matches input
          expect(feature.geometry).toEqual(row.geometry);

          // Property 12c: All properties match input
          expect(feature.properties).toEqual({
            id: row.id,
            nama: row.nama,
            jenis: row.jenis,
            alamat: row.alamat,
            kecamatan: row.kecamatan,
            kelurahan: row.kelurahan,
          });

          // Property 12d: ID property matches row ID
          expect(feature.properties.id).toBe(row.id);

          return true;
        })
      );
    });

    test("rowToBoundaryFeature should return Feature with all properties matching input row", () => {
      fc.assert(
        fc.property(boundaryRowGen, (row) => {
          const feature = rowToBoundaryFeature(row as any);

          // Property 12a: Type is Feature
          expect(feature.type).toBe("Feature");

          // Property 12b: Geometry matches input
          expect(feature.geometry).toEqual(row.geometry);

          // Property 12c: All properties match input
          expect(feature.properties).toEqual({
            id: row.id,
            nama: row.nama,
            level: row.level,
          });

          // Property 12d: ID property matches row ID
          expect(feature.properties.id).toBe(row.id);

          return true;
        })
      );
    });
  });

  describe("Property 13: Not-Found ID Returns 404", () => {
    test("GET /api/faskes/:id with non-existent UUID returns 404", async () => {
      await resetDatabase();

      await fc.assert(
        fc.asyncProperty(fc.uuid(), async (nonExistentId) => {
          const res = await request(app).get(`/api/faskes/${nonExistentId}`);
          expect(res.status).toBe(404);
          expect(res.body.error).toBeDefined();
        })
      );
    });

    test("GET /api/boundaries/:id with non-existent UUID returns 404", async () => {
      await resetDatabase();

      await fc.assert(
        fc.asyncProperty(fc.uuid(), async (nonExistentId) => {
          const res = await request(app).get(`/api/boundaries/${nonExistentId}`);
          expect(res.status).toBe(404);
          expect(res.body.error).toBeDefined();
        })
      );
    });
  });
});
