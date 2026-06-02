// Feature: gis-faskes-bandar-lampung, Property 4: Buffer Radius Validation
// Feature: gis-faskes-bandar-lampung, Property 5: Coverage Calculation Accuracy
import { test, expect } from "vitest";
import fc from "fast-check";
import * as turf from "@turf/turf";
import { validateBufferRadius, computeCoverageStats } from "../coverage";

const squarePolygon = (x: number, y: number, size: number) =>
  turf.polygon([
    [
      [x, y],
      [x + size, y],
      [x + size, y + size],
      [x, y + size],
      [x, y],
    ],
  ]);

test("Property 4: buffer radius validation accepts only 100-5000", () => {
  fc.assert(
    fc.property(fc.double({ noNaN: true, min: -1000, max: 6000 }), (value) => {
      const result = validateBufferRadius(value);
      if (value >= 100 && value <= 5000) {
        expect(result.valid).toBe(true);
      } else {
        expect(result.valid).toBe(false);
      }
    })
  );
});

test("Property 5: coverage stats sum to total area", () => {
  fc.assert(
    fc.property(
      fc.record({
        x: fc.double({ min: 0, max: 10, noNaN: true }),
        y: fc.double({ min: 0, max: 10, noNaN: true }),
        size: fc.double({ min: 0.1, max: 1, noNaN: true }),
        coverSize: fc.double({ min: 0.05, max: 1, noNaN: true }),
      }),
      ({ x, y, size, coverSize }) => {
        const boundary = squarePolygon(x, y, size);
        const unionBuffer = squarePolygon(x, y, Math.min(size, coverSize));
        const stats = computeCoverageStats(
          boundary as any,
          unionBuffer as any
        );

        const totalKm2 = turf.area(boundary) / 1_000_000;
        const sum = stats.coveredKm2 + stats.uncoveredKm2;
        expect(Math.abs(sum - totalKm2)).toBeLessThanOrEqual(0.001);
        expect(stats.percentageCovered).toBeGreaterThanOrEqual(0);
        expect(stats.percentageCovered).toBeLessThanOrEqual(100);
      }
    )
  );
});
