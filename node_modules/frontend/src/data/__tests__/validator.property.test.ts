// Feature: gis-faskes-bandar-lampung, Property 9: Coordinate and GeoJSON Validation (frontend validator)
import { test, expect } from "vitest";
import fc from "fast-check";
import {
  BANDAR_LAMPUNG_BBOX,
  BoundaryFeature,
  FaskesFeature,
  FeatureCollection,
} from "../types";
import { validateBoundaryCollection, validateFaskesCollection } from "../validator";

type Position = [number, number];

const validFaskesFeatureArb = fc.record({
  type: fc.constant("Feature"),
  geometry: fc.record({
    type: fc.constant("Point"),
    coordinates: fc.tuple(
      fc.double({ min: BANDAR_LAMPUNG_BBOX.minLon, max: BANDAR_LAMPUNG_BBOX.maxLon, noNaN: true }),
      fc.double({ min: BANDAR_LAMPUNG_BBOX.minLat, max: BANDAR_LAMPUNG_BBOX.maxLat, noNaN: true })
    ),
  }),
  properties: fc.record({
    id: fc.uuid(),
    nama: fc.string({ minLength: 1 }),
    jenis: fc.string({ minLength: 1 }),
    alamat: fc.string(),
    kecamatan: fc.string(),
    kelurahan: fc.string(),
  }),
}) as fc.Arbitrary<FaskesFeature>;

const invalidFaskesFeatureArb = validFaskesFeatureArb.map((feature) => ({
  ...feature,
  geometry: {
    type: "Point",
    coordinates: [BANDAR_LAMPUNG_BBOX.minLon - 1, BANDAR_LAMPUNG_BBOX.minLat - 1] as [
      number,
      number
    ],
  },
}));

const positionArb = fc.tuple(
  fc.double({ min: -180, max: 180, noNaN: true }),
  fc.double({ min: -90, max: 90, noNaN: true })
) as fc.Arbitrary<Position>;

const closedRingArb = fc.array(positionArb, { minLength: 3, maxLength: 8 }).map((points) => [
  ...points,
  points[0],
]);

const openRingArb = fc.array(positionArb, { minLength: 3, maxLength: 8 });

const validBoundaryFeatureArb = closedRingArb.map((ring) => ({
  type: "Feature",
  geometry: { type: "Polygon", coordinates: [ring] },
  properties: {
    id: crypto.randomUUID(),
    nama: "Boundary",
    level: "kecamatan" as const,
  },
})) as fc.Arbitrary<BoundaryFeature>;

const invalidBoundaryFeatureArb = openRingArb.map((ring) => ({
  type: "Feature",
  geometry: { type: "Polygon", coordinates: [ring] },
  properties: {
    id: crypto.randomUUID(),
    nama: "Boundary",
    level: "kecamatan" as const,
  },
})) as fc.Arbitrary<BoundaryFeature>;

test("Property 9: valid faskes coordinates are accepted", () => {
  fc.assert(
    fc.property(fc.array(validFaskesFeatureArb, { minLength: 1, maxLength: 5 }), (features) => {
      const geojson: FeatureCollection<FaskesFeature> = { type: "FeatureCollection", features };
      const result = validateFaskesCollection(geojson);
      expect(result.invalid.length).toBe(0);
    })
  );
});

test("Property 9: invalid faskes coordinates are rejected", () => {
  fc.assert(
    fc.property(fc.array(invalidFaskesFeatureArb, { minLength: 1, maxLength: 5 }), (features) => {
      const geojson: FeatureCollection<FaskesFeature> = { type: "FeatureCollection", features };
      const result = validateFaskesCollection(geojson);
      expect(result.invalid.length).toBe(features.length);
    })
  );
});

test("Property 9: valid boundary rings are accepted", () => {
  fc.assert(
    fc.property(fc.array(validBoundaryFeatureArb, { minLength: 1, maxLength: 5 }), (features) => {
      const geojson: FeatureCollection<BoundaryFeature> = { type: "FeatureCollection", features };
      const result = validateBoundaryCollection(geojson);
      expect(result.invalid.length).toBe(0);
    })
  );
});

test("Property 9: invalid boundary rings are rejected", () => {
  fc.assert(
    fc.property(fc.array(invalidBoundaryFeatureArb, { minLength: 1, maxLength: 5 }), (features) => {
      const geojson: FeatureCollection<BoundaryFeature> = { type: "FeatureCollection", features };
      const result = validateBoundaryCollection(geojson);
      expect(result.invalid.length).toBe(features.length);
    })
  );
});
