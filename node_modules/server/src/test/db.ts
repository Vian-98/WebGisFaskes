import { pool } from "../db";
import { hashPassword } from "../auth/password";

export async function resetDatabase(): Promise<void> {
  await pool.query(
    "TRUNCATE TABLE faskes, boundaries, boundary_centroids, admins, sessions RESTART IDENTITY CASCADE"
  );
}

export async function seedAdmin(username: string, password: string): Promise<string> {
  const passwordHash = await hashPassword(password);
  const result = await pool.query(
    "INSERT INTO admins (username, password_hash) VALUES ($1, $2) RETURNING id",
    [username, passwordHash]
  );
  return result.rows[0].id as string;
}

export async function seedFaskes(params: {
  id: string;
  nama: string;
  jenis: string;
  alamat: string;
  kecamatan: string;
  kelurahan: string;
  latitude: number;
  longitude: number;
}): Promise<void> {
  await pool.query(
    "INSERT INTO faskes (id, nama, jenis, alamat, kecamatan, kelurahan, geom) VALUES ($1, $2, $3, $4, $5, $6, ST_SetSRID(ST_MakePoint($7, $8), 4326))",
    [
      params.id,
      params.nama,
      params.jenis,
      params.alamat,
      params.kecamatan,
      params.kelurahan,
      params.longitude,
      params.latitude,
    ]
  );
}

export async function seedBoundary(params: {
  id: string;
  nama: string;
  level: "kecamatan" | "kelurahan";
  geometry: object;
}): Promise<void> {
  await pool.query(
    "INSERT INTO boundaries (id, nama, level, geom) VALUES ($1, $2, $3, ST_SetSRID(ST_GeomFromGeoJSON($4), 4326))",
    [params.id, params.nama, params.level, JSON.stringify(params.geometry)]
  );
}
