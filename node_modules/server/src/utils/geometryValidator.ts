type Position = [number, number];

function isValidPoint(point: unknown): point is Position {
  if (!Array.isArray(point) || point.length < 2) {
    return false;
  }
  const [lon, lat] = point;
  return Number.isFinite(lon) && Number.isFinite(lat);
}

export function isValidRing(ring: unknown): ring is Position[] {
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

export function validateBoundaryGeometry(geometry: unknown): {
  valid: boolean;
  error?: string;
} {
  if (!geometry || typeof geometry !== "object") {
    return { valid: false, error: "Geometry tidak valid." };
  }

  const geomCandidate = geometry as { type?: string; geometry?: unknown; coordinates?: unknown };
  const geom =
    geomCandidate.type === "Feature" ? (geomCandidate.geometry as typeof geomCandidate) : geomCandidate;

  if (!geom || typeof geom !== "object") {
    return { valid: false, error: "Geometry tidak valid." };
  }

  if (geom.type === "Polygon") {
    const rings = geom.coordinates as unknown;
    if (!Array.isArray(rings) || !rings.every(isValidRing)) {
      return { valid: false, error: "Polygon memiliki ring yang tidak valid." };
    }
    return { valid: true };
  }

  if (geom.type === "MultiPolygon") {
    const polygons = geom.coordinates as unknown;
    if (!Array.isArray(polygons)) {
      return { valid: false, error: "MultiPolygon memiliki ring yang tidak valid." };
    }

    for (const rings of polygons) {
      if (!Array.isArray(rings) || !rings.every(isValidRing)) {
        return { valid: false, error: "MultiPolygon memiliki ring yang tidak valid." };
      }
    }

    return { valid: true };
  }

  return {
    valid: false,
    error: `Tipe geometry tidak didukung: ${geom.type ?? "unknown"}. Harus Polygon atau MultiPolygon.`,
  };
}
