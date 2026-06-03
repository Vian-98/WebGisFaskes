import { FaskesFeature } from "../data/types";

export function filterByType(faskes: FaskesFeature[], type: string): FaskesFeature[] {
  if (type === "all") {
    return [...faskes];
  }
  return faskes.filter((feature) => feature.properties.jenis === type);
}

export function searchByName(faskes: FaskesFeature[], keyword: string): FaskesFeature[] {
  const normalized = keyword.trim().toLowerCase();
  if (!normalized) {
    return [...faskes];
  }
  return faskes.filter((feature) =>
    feature.properties.nama.toLowerCase().includes(normalized)
  );
}

export function haversineDistance(
  pointA: [number, number],
  pointB: [number, number]
): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const [lon1, lat1] = pointA;
  const [lon2, lat2] = pointB;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const r = 6371;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return r * c;
}

export function findNearestFacilities(
  faskes: FaskesFeature[],
  point: [number, number],
  limit = 5
) {
  return faskes
    .map((feature) => {
      const [lon, lat] = feature.geometry.coordinates;
      return {
        feature,
        distanceKm: haversineDistance(point, [lon, lat]),
      };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
}

import * as turf from '@turf/turf';

export function findBoundaryForPoint(point: [number, number], boundaries: any[]): any | null {
  const pt = turf.point(point);
  for (const b of boundaries) {
    try {
      if (turf.booleanPointInPolygon(pt, b)) {
        return b;
      }
    } catch (e) {
      // Ignore invalid geometry errors
    }
  }
  return null;
}
