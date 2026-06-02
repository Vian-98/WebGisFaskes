export type FaskesProperties = {
  id: string;
  nama: string;
  jenis: string;
  alamat: string;
  kecamatan: string;
  kelurahan: string;
};

export type BoundaryProperties = {
  id: string;
  nama: string;
  level: "kecamatan" | "kelurahan";
};

export type PointGeometry = {
  type: "Point";
  coordinates: [number, number];
};

export type PolygonGeometry = {
  type: "Polygon";
  coordinates: [number, number][][];
};

export type MultiPolygonGeometry = {
  type: "MultiPolygon";
  coordinates: [number, number][][][];
};

export type FaskesFeature = {
  type: "Feature";
  geometry: PointGeometry;
  properties: FaskesProperties;
};

export type BoundaryFeature = {
  type: "Feature";
  geometry: PolygonGeometry | MultiPolygonGeometry;
  properties: BoundaryProperties;
};

export type FeatureCollection<T> = {
  type: "FeatureCollection";
  features: T[];
};

export type ValidationResult<T> = {
  valid: T[];
  invalid: T[];
  errors: string[];
};

export const BANDAR_LAMPUNG_BBOX = {
  minLat: -5.52,
  maxLat: -5.28,
  minLon: 105.18,
  maxLon: 105.42,
};
