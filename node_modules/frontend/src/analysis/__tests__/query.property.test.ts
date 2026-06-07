// Feature: gis-faskes-bandar-lampung, Property 6: Filter Completeness and Exclusiveness
// Feature: gis-faskes-bandar-lampung, Property 7: Search Substring Matching
// Feature: gis-faskes-bandar-lampung, Property 8: Nearest Facility Distance Ordering
import { test, expect } from "vitest";
import fc from "fast-check";
import {
  filterByType,
  searchByName,
  findNearestFacilities,
  haversineDistance,
} from "../query";
import { FaskesFeature } from "../../data/types";

const faskesArb = fc.record({
  type: fc.constant("Feature"),
  geometry: fc.record({
    type: fc.constant("Point"),
    coordinates: fc.tuple(
      fc.double({ min: 105.18, max: 105.42, noNaN: true }),
      fc.double({ min: -5.52, max: -5.28, noNaN: true })
    ),
  }),
  properties: fc.record({
    id: fc.uuid(),
    nama: fc.string({ minLength: 1, maxLength: 20 }),
    jenis: fc.constantFrom("rumah_sakit", "puskesmas", "klinik", "apotek"),
    alamat: fc.string(),
    kecamatan: fc.string(),
    kelurahan: fc.string(),
  }),
}) as fc.Arbitrary<FaskesFeature>;

test("Property 6: filter returns only matching types", () => {
  fc.assert(
    fc.property(fc.array(faskesArb, { minLength: 1, maxLength: 20 }), (features) => {
      const target = features[0].properties.jenis;
      const filtered = filterByType(features, target);
      expect(filtered.every((f) => f.properties.jenis === target)).toBe(true);

      const all = filterByType(features, "all");
      expect(all.length).toBe(features.length);
    })
  );
});

test("Property 7: search matches substring case-insensitive", () => {
  fc.assert(
    fc.property(fc.array(faskesArb, { minLength: 1, maxLength: 20 }), (features) => {
      const keyword = features[0].properties.nama.slice(0, 1).toLowerCase();
      const results = searchByName(features, keyword);
      expect(
        results.every((f) => f.properties.nama.toLowerCase().includes(keyword))
      ).toBe(true);
    })
  );
});

test("Property 8: nearest facilities are ordered by distance", () => {
  fc.assert(
    fc.property(
      fc.array(faskesArb, { minLength: 2, maxLength: 20 }),
      fc.tuple(
        fc.double({ min: 105.18, max: 105.42, noNaN: true }),
        fc.double({ min: -5.52, max: -5.28, noNaN: true })
      ),
      (features, point) => {
        const results = findNearestFacilities(features, point, 5);
        for (let i = 1; i < results.length; i += 1) {
          expect(results[i - 1].distanceKm).toBeLessThanOrEqual(results[i].distanceKm);
        }
        results.forEach((item) => {
          const [lon, lat] = item.feature.geometry.coordinates;
          const expected = haversineDistance(point, [lon, lat]);
          expect(item.distanceKm).toBeCloseTo(expected, 6);
        });
      }
    )
  );
});
