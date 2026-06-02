import { Router } from "express";
import { sql } from "drizzle-orm";
import { db } from "../db";

const router = Router();

type FaskesRow = {
  id: string;
  nama: string;
  jenis: string;
  alamat: string;
  kecamatan: string;
  kelurahan: string;
  geometry: { type: string; coordinates: number[] } | null;
};

type BoundaryRow = {
  id: string;
  nama: string;
  level: string;
  geometry: { type: string; coordinates: unknown } | null;
};

export function rowToFaskesFeature(row: FaskesRow) {
  return {
    type: "Feature",
    geometry: row.geometry,
    properties: {
      id: row.id,
      nama: row.nama,
      jenis: row.jenis,
      alamat: row.alamat,
      kecamatan: row.kecamatan,
      kelurahan: row.kelurahan,
    },
  };
}

export function rowToBoundaryFeature(row: BoundaryRow) {
  return {
    type: "Feature",
    geometry: row.geometry,
    properties: {
      id: row.id,
      nama: row.nama,
      level: row.level,
    },
  };
}

router.get("/faskes", async (req, res) => {
  try {
    const result = await db.execute(sql`
      SELECT id, nama, jenis, alamat, kecamatan, kelurahan,
             ST_AsGeoJSON(geom)::json AS geometry
      FROM faskes
    `);

    const features = result.rows.map((row) => rowToFaskesFeature(row as FaskesRow));
    res.type("application/json").json({ type: "FeatureCollection", features });
  } catch (error) {
    console.error("Failed to fetch faskes", error);
    res.status(503).json({ error: "Layanan tidak tersedia sementara." });
  }
});

router.get("/faskes/:id", async (req, res) => {
  try {
    const result = await db.execute(sql`
      SELECT id, nama, jenis, alamat, kecamatan, kelurahan,
             ST_AsGeoJSON(geom)::json AS geometry
      FROM faskes
      WHERE id = ${req.params.id}
    `);

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Faskes tidak ditemukan." });
      return;
    }

    res.type("application/json").json(rowToFaskesFeature(result.rows[0] as FaskesRow));
  } catch (error) {
    console.error("Failed to fetch faskes by id", error);
    res.status(503).json({ error: "Layanan tidak tersedia sementara." });
  }
});

router.get("/boundaries", async (req, res) => {
  try {
    const result = await db.execute(sql`
      SELECT id, nama, level,
             ST_AsGeoJSON(geom)::json AS geometry
      FROM boundaries
    `);

    const features = result.rows.map((row) => rowToBoundaryFeature(row as BoundaryRow));
    res.type("application/json").json({ type: "FeatureCollection", features });
  } catch (error) {
    console.error("Failed to fetch boundaries", error);
    res.status(503).json({ error: "Layanan tidak tersedia sementara." });
  }
});

router.get("/boundaries/:id", async (req, res) => {
  try {
    const result = await db.execute(sql`
      SELECT id, nama, level,
             ST_AsGeoJSON(geom)::json AS geometry
      FROM boundaries
      WHERE id = ${req.params.id}
    `);

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Boundary tidak ditemukan." });
      return;
    }

    res.type("application/json").json(rowToBoundaryFeature(result.rows[0] as BoundaryRow));
  } catch (error) {
    console.error("Failed to fetch boundary by id", error);
    res.status(503).json({ error: "Layanan tidak tersedia sementara." });
  }
});

export default router;
