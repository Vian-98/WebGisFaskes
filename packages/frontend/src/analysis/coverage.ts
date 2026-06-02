import * as turf from "@turf/turf";
import { BoundaryFeature, FaskesFeature } from "../data/types";

export function validateBufferRadius(value: unknown): { valid: boolean; error?: string } {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return { valid: false, error: "Radius harus berupa angka." };
  }
  if (value < 100) {
    return { valid: false, error: "Radius minimal 100 meter." };
  }
  if (value > 5000) {
    return { valid: false, error: "Radius maksimal 5000 meter." };
  }
  return { valid: true };
}

export function computeBufferZones(faskes: FaskesFeature[], radiusMeters: number) {
  return faskes.map((feature) =>
    turf.buffer(feature as any, radiusMeters, { units: "meters" })
  );
}

export function computeUnionBuffer(bufferZones: turf.Feature<turf.Polygon | turf.MultiPolygon>[]) {
  let merged: turf.Feature<turf.Polygon | turf.MultiPolygon> | null = null;
  for (const zone of bufferZones) {
    if (!merged) {
      merged = zone;
    } else {
      merged = turf.union(merged, zone) as turf.Feature<turf.Polygon | turf.MultiPolygon>;
    }
  }
  return merged;
}

export function computeCoverageStats(
  boundary: BoundaryFeature,
  unionBuffer: turf.Feature<turf.Polygon | turf.MultiPolygon> | null
) {
  const boundaryFeature = boundary as unknown as turf.Feature<turf.Polygon | turf.MultiPolygon>;
  const boundaryArea = turf.area(boundaryFeature);

  if (!unionBuffer) {
    const totalKm2 = boundaryArea / 1_000_000;
    return { coveredKm2: 0, uncoveredKm2: totalKm2, percentageCovered: 0 };
  }

  const intersection = turf.intersect(boundaryFeature, unionBuffer);
  const covered = intersection ? turf.area(intersection) : 0;
  const coveredKm2 = covered / 1_000_000;
  const uncoveredKm2 = (boundaryArea - covered) / 1_000_000;
  const percentageCovered = boundaryArea === 0 ? 0 : (covered / boundaryArea) * 100;

  return {
    coveredKm2,
    uncoveredKm2,
    percentageCovered,
  };
}
