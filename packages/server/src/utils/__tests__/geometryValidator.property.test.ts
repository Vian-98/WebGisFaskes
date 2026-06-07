// Feature: gis-faskes-bandar-lampung, Property 9: Coordinate and GeoJSON Validation (backend geometry validator)
import { test, expect } from "vitest";
import fc from "fast-check";
import { validateBoundaryGeometry } from "../geometryValidator";

type Position = [number, number];

const positionArb = fc.tuple(
  fc.double({ min: -180, max: 180, noNaN: true }),
  fc.double({ min: -90, max: 90, noNaN: true })
) as fc.Arbitrary<Position>;

const closedRingArb = fc
  .array(positionArb, { minLength: 3, maxLength: 8 })
  .map((points) => {
    const ring = [...points, points[0]];
    return ring;
  });

const openRingArb = fc.array(positionArb, { minLength: 3, maxLength: 8 });

const validPolygonArb = closedRingArb.map((ring) => ({
  type: "Polygon",
  coordinates: [ring],
}));

const invalidPolygonArb = fc.oneof(
  openRingArb.map((ring) => ({ type: "Polygon", coordinates: [ring] })),
  fc.constant({ type: "Polygon", coordinates: [] })
);

const validMultiPolygonArb = fc.array(closedRingArb, { minLength: 1, maxLength: 3 }).map(
  (rings) => ({
    type: "MultiPolygon",
    coordinates: rings.map((ring) => [ring]),
  })
);

const invalidMultiPolygonArb = fc.oneof(
  fc.array(openRingArb, { minLength: 1, maxLength: 3 }).map((rings) => ({
    type: "MultiPolygon",
    coordinates: rings.map((ring) => [ring]),
  })),
  fc.constant({ type: "MultiPolygon", coordinates: [] })
);

test("Property 9: valid Polygon geometries are accepted", () => {
  fc.assert(
    fc.property(validPolygonArb, (geometry) => {
      const result = validateBoundaryGeometry(geometry);
      expect(result.valid).toBe(true);
    })
  );
});

test("Property 9: invalid Polygon geometries are rejected", () => {
  fc.assert(
    fc.property(invalidPolygonArb, (geometry) => {
      const result = validateBoundaryGeometry(geometry);
      expect(result.valid).toBe(false);
    })
  );
});

test("Property 9: valid MultiPolygon geometries are accepted", () => {
  fc.assert(
    fc.property(validMultiPolygonArb, (geometry) => {
      const result = validateBoundaryGeometry(geometry);
      expect(result.valid).toBe(true);
    })
  );
});

test("Property 9: invalid MultiPolygon geometries are rejected", () => {
  fc.assert(
    fc.property(invalidMultiPolygonArb, (geometry) => {
      const result = validateBoundaryGeometry(geometry);
      expect(result.valid).toBe(false);
    })
  );
});
