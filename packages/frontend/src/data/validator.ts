import {
  BANDAR_LAMPUNG_BBOX,
  BoundaryFeature,
  FeatureCollection,
  FaskesFeature,
  MultiPolygonGeometry,
  PolygonGeometry,
  ValidationResult,
} from "./types";

type Position = [number, number];

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isValidPoint(point: unknown): point is Position {
  return (
    Array.isArray(point) &&
    point.length >= 2 &&
    isFiniteNumber(point[0]) &&
    isFiniteNumber(point[1])
  );
}

function isValidRing(ring: unknown): ring is Position[] {
  if (!Array.isArray(ring) || ring.length < 4) {
    return false;
  }

  const first = ring[0];
  const last = ring[ring.length - 1];

  if (!isValidPoint(first) || !isValidPoint(last)) {
    return false;
  }

  if (first[0] !== last[0] || first[1] !== last[1]) {
    return false;
  }

  return ring.every(isValidPoint);
}

export function validateFaskesFeature(feature: FaskesFeature): { valid: boolean; error?: string } {
  const geometry = feature?.geometry;
  if (!geometry || geometry.type !== "Point" || !isValidPoint(geometry.coordinates)) {
    return { valid: false, error: "Geometry faskes tidak valid." };
  }

  const [lon, lat] = geometry.coordinates;
  if (
    lat < BANDAR_LAMPUNG_BBOX.minLat ||
    lat > BANDAR_LAMPUNG_BBOX.maxLat ||
    lon < BANDAR_LAMPUNG_BBOX.minLon ||
    lon > BANDAR_LAMPUNG_BBOX.maxLon
  ) {
    return { valid: false, error: "Koordinat faskes di luar wilayah Bandar Lampung." };
  }

  if (!feature.properties?.nama || !feature.properties?.jenis) {
    return { valid: false, error: "Properti faskes tidak lengkap." };
  }

  return { valid: true };
}

export function validateFaskesCollection(
  geojson: FeatureCollection<FaskesFeature>
): ValidationResult<FaskesFeature> {
  const valid: FaskesFeature[] = [];
  const invalid: FaskesFeature[] = [];
  const errors: string[] = [];

  for (const feature of geojson.features ?? []) {
    const result = validateFaskesFeature(feature);
    if (result.valid) {
      valid.push(feature);
    } else {
      invalid.push(feature);
      const message = result.error ?? "Record faskes tidak valid.";
      errors.push(message);
      console.warn(message, feature);
    }
  }

  return { valid, invalid, errors };
}

function isValidPolygonGeometry(geometry: PolygonGeometry): boolean {
  return Array.isArray(geometry.coordinates) && geometry.coordinates.every(isValidRing);
}

function isValidMultiPolygonGeometry(geometry: MultiPolygonGeometry): boolean {
  if (!Array.isArray(geometry.coordinates)) {
    return false;
  }

  for (const rings of geometry.coordinates) {
    if (!Array.isArray(rings) || !rings.every(isValidRing)) {
      return false;
    }
  }

  return true;
}

export function validateBoundaryFeature(
  feature: BoundaryFeature
): { valid: boolean; error?: string } {
  const geometry = feature?.geometry;
  if (!geometry) {
    return { valid: false, error: "Geometry boundary tidak valid." };
  }

  if (geometry.type === "Polygon") {
    if (!isValidPolygonGeometry(geometry)) {
      return { valid: false, error: "Ring Polygon tidak valid." };
    }
  } else if (geometry.type === "MultiPolygon") {
    if (!isValidMultiPolygonGeometry(geometry)) {
      return { valid: false, error: "Ring MultiPolygon tidak valid." };
    }
  } else {
    return { valid: false, error: "Tipe geometry boundary tidak valid." };
  }

  if (!feature.properties?.nama || !feature.properties?.level) {
    return { valid: false, error: "Properti boundary tidak lengkap." };
  }

  return { valid: true };
}

export function validateBoundaryCollection(
  geojson: FeatureCollection<BoundaryFeature>
): ValidationResult<BoundaryFeature> {
  const valid: BoundaryFeature[] = [];
  const invalid: BoundaryFeature[] = [];
  const errors: string[] = [];

  for (const feature of geojson.features ?? []) {
    const result = validateBoundaryFeature(feature);
    if (result.valid) {
      valid.push(feature);
    } else {
      invalid.push(feature);
      const message = result.error ?? "Record boundary tidak valid.";
      errors.push(message);
      console.warn(message, feature);
    }
  }

  return { valid, invalid, errors };
}
