import {
  BoundaryFeature,
  FeatureCollection,
  FaskesFeature,
  ValidationResult,
} from "./types";
import { validateBoundaryCollection, validateFaskesCollection } from "./validator";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";
const DATA_UNAVAILABLE_MESSAGE = "Data tidak dapat dimuat. Periksa koneksi atau coba lagi nanti.";

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    if (response.status === 503) {
      throw new Error(DATA_UNAVAILABLE_MESSAGE);
    }
    throw new Error(`Gagal memuat data: HTTP ${response.status}`);
  }
  return (await response.json()) as T;
}

export async function fetchFaskes(): Promise<ValidationResult<FaskesFeature>> {
  try {
    const geojson = await fetchJson<FeatureCollection<FaskesFeature>>(`${API_BASE}/faskes`);
    return validateFaskesCollection(geojson);
  } catch (error) {
    if (error instanceof Error && error.message === DATA_UNAVAILABLE_MESSAGE) {
      throw error;
    }
    throw new Error(DATA_UNAVAILABLE_MESSAGE);
  }
}

export async function fetchBoundaries(): Promise<ValidationResult<BoundaryFeature>> {
  try {
    const geojson = await fetchJson<FeatureCollection<BoundaryFeature>>(`${API_BASE}/boundaries`);
    return validateBoundaryCollection(geojson);
  } catch (error) {
    if (error instanceof Error && error.message === DATA_UNAVAILABLE_MESSAGE) {
      throw error;
    }
    throw new Error(DATA_UNAVAILABLE_MESSAGE);
  }
}
