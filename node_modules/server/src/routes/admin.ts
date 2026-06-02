import { Router } from "express";
import { sql } from "drizzle-orm";
import { db } from "../db";
import { requireAuth } from "../middleware/auth";
import { FaskesCreateSchema, FaskesUpdateSchema } from "../schemas/faskes.schema";
import { BoundaryUpdateSchema } from "../schemas/boundary.schema";
import { validateBoundaryGeometry } from "../utils/geometryValidator";
import { rowToBoundaryFeature, rowToFaskesFeature } from "./public";

const router = Router();

router.use(requireAuth);

router.get("/faskes", async (req, res) => {
  try {
    const result = await db.execute(sql`
      SELECT id, nama, jenis, alamat, kecamatan, kelurahan,
             ST_AsGeoJSON(geom)::json AS geometry
      FROM faskes
    `);

    const features = result.rows.map((row) => rowToFaskesFeature(row as any));
    res.type("application/json").json({ type: "FeatureCollection", features });
  } catch (error) {
    console.error("Failed to fetch admin faskes", error);
    res.status(503).json({ error: "Layanan tidak tersedia sementara." });
  }
});

router.post("/faskes", async (req, res) => {
  const parsed = FaskesCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Payload tidak valid.", details: parsed.error.flatten().fieldErrors });
    return;
  }

  const data = parsed.data;

  try {
    const result = await db.execute(sql`
      INSERT INTO faskes (nama, jenis, alamat, kecamatan, kelurahan, geom)
      VALUES (
        ${data.nama},
        ${data.jenis},
        ${data.alamat},
        ${data.kecamatan},
        ${data.kelurahan},
        ST_SetSRID(ST_MakePoint(${data.longitude}, ${data.latitude}), 4326)
      )
      RETURNING id, nama, jenis, alamat, kecamatan, kelurahan,
                ST_AsGeoJSON(geom)::json AS geometry
    `);

    res.status(201).json(rowToFaskesFeature(result.rows[0] as any));
  } catch (error) {
    console.error("Failed to create faskes", error);
    res.status(503).json({ error: "Layanan tidak tersedia sementara." });
  }
});

router.put("/faskes/:id", async (req, res) => {
  const parsed = FaskesUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Payload tidak valid.", details: parsed.error.flatten().fieldErrors });
    return;
  }

  const data = parsed.data;
  const updates = [] as any[];

  if (data.nama !== undefined) updates.push(sql`nama = ${data.nama}`);
  if (data.jenis !== undefined) updates.push(sql`jenis = ${data.jenis}`);
  if (data.alamat !== undefined) updates.push(sql`alamat = ${data.alamat}`);
  if (data.kecamatan !== undefined) updates.push(sql`kecamatan = ${data.kecamatan}`);
  if (data.kelurahan !== undefined) updates.push(sql`kelurahan = ${data.kelurahan}`);

  const hasLat = data.latitude !== undefined;
  const hasLon = data.longitude !== undefined;
  if (hasLat !== hasLon) {
    res.status(400).json({
      error: "Payload tidak valid.",
      details: {
        latitude: "Latitude dan longitude harus diisi bersama.",
        longitude: "Latitude dan longitude harus diisi bersama.",
      },
    });
    return;
  }

  if (hasLat && hasLon) {
    updates.push(
      sql`geom = ST_SetSRID(ST_MakePoint(${data.longitude}, ${data.latitude}), 4326)`
    );
  }

  if (updates.length === 0) {
    res.status(400).json({ error: "Tidak ada field yang diperbarui." });
    return;
  }

  try {
    const result = await db.execute(sql`
      UPDATE faskes
      SET ${sql.join(updates, sql`, `)}
      WHERE id = ${req.params.id}
      RETURNING id, nama, jenis, alamat, kecamatan, kelurahan,
                ST_AsGeoJSON(geom)::json AS geometry
    `);

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Faskes tidak ditemukan." });
      return;
    }

    res.json(rowToFaskesFeature(result.rows[0] as any));
  } catch (error) {
    console.error("Failed to update faskes", error);
    res.status(503).json({ error: "Layanan tidak tersedia sementara." });
  }
});

router.delete("/faskes/:id", async (req, res) => {
  try {
    const result = await db.execute(sql`
      DELETE FROM faskes
      WHERE id = ${req.params.id}
      RETURNING id
    `);

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Faskes tidak ditemukan." });
      return;
    }

    res.status(204).end();
  } catch (error) {
    console.error("Failed to delete faskes", error);
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

    const features = result.rows.map((row) => rowToBoundaryFeature(row as any));
    res.type("application/json").json({ type: "FeatureCollection", features });
  } catch (error) {
    console.error("Failed to fetch admin boundaries", error);
    res.status(503).json({ error: "Layanan tidak tersedia sementara." });
  }
});

router.put("/boundaries/:id", async (req, res) => {
  const parsed = BoundaryUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Payload tidak valid.", details: parsed.error.flatten().fieldErrors });
    return;
  }

  const data = parsed.data;
  const updates = [] as any[];

  if (data.nama !== undefined) updates.push(sql`nama = ${data.nama}`);
  if (data.level !== undefined) updates.push(sql`level = ${data.level}`);

  if (updates.length === 0) {
    res.status(400).json({ error: "Tidak ada field yang diperbarui." });
    return;
  }

  try {
    const result = await db.execute(sql`
      UPDATE boundaries
      SET ${sql.join(updates, sql`, `)}
      WHERE id = ${req.params.id}
      RETURNING id, nama, level, ST_AsGeoJSON(geom)::json AS geometry
    `);

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Boundary tidak ditemukan." });
      return;
    }

    res.json(rowToBoundaryFeature(result.rows[0] as any));
  } catch (error) {
    console.error("Failed to update boundary metadata", error);
    res.status(503).json({ error: "Layanan tidak tersedia sementara." });
  }
});

router.put("/boundaries/:id/geometry", async (req, res) => {
  const validation = validateBoundaryGeometry(req.body);
  if (!validation.valid) {
    res.status(400).json({ error: validation.error ?? "Format GeoJSON tidak valid." });
    return;
  }

  const geometry = req.body.type === "Feature" ? req.body.geometry : req.body;

  try {
    const result = await db.execute(sql`
      UPDATE boundaries
      SET geom = ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(geometry)}), 4326)
      WHERE id = ${req.params.id}
      RETURNING id, nama, level, ST_AsGeoJSON(geom)::json AS geometry
    `);

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Boundary tidak ditemukan." });
      return;
    }

    res.json(rowToBoundaryFeature(result.rows[0] as any));
  } catch (error) {
    console.error("Failed to update boundary geometry", error);
    res.status(503).json({ error: "Layanan tidak tersedia sementara." });
  }
});

export default router;
