"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const faskes_schema_1 = require("../schemas/faskes.schema");
const boundary_schema_1 = require("../schemas/boundary.schema");
const geometryValidator_1 = require("../utils/geometryValidator");
const public_1 = require("./public");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
router.get("/faskes", async (req, res) => {
    try {
        const result = await db_1.db.execute((0, drizzle_orm_1.sql) `
      SELECT id, nama, jenis, alamat, kecamatan, kelurahan,
             ST_AsGeoJSON(geom)::json AS geometry
      FROM faskes
    `);
        const features = result.rows.map((row) => (0, public_1.rowToFaskesFeature)(row));
        res.type("application/json").json({ type: "FeatureCollection", features });
    }
    catch (error) {
        console.error("Failed to fetch admin faskes", error);
        res.status(503).json({ error: "Layanan tidak tersedia sementara." });
    }
});
router.post("/faskes", async (req, res) => {
    const parsed = faskes_schema_1.FaskesCreateSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: "Payload tidak valid.", details: parsed.error.flatten().fieldErrors });
        return;
    }
    const data = parsed.data;
    try {
        const result = await db_1.db.execute((0, drizzle_orm_1.sql) `
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
        res.status(201).json((0, public_1.rowToFaskesFeature)(result.rows[0]));
    }
    catch (error) {
        console.error("Failed to create faskes", error);
        res.status(503).json({ error: "Layanan tidak tersedia sementara." });
    }
});
router.put("/faskes/:id", async (req, res) => {
    const parsed = faskes_schema_1.FaskesUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: "Payload tidak valid.", details: parsed.error.flatten().fieldErrors });
        return;
    }
    const data = parsed.data;
    const updates = [];
    if (data.nama !== undefined)
        updates.push((0, drizzle_orm_1.sql) `nama = ${data.nama}`);
    if (data.jenis !== undefined)
        updates.push((0, drizzle_orm_1.sql) `jenis = ${data.jenis}`);
    if (data.alamat !== undefined)
        updates.push((0, drizzle_orm_1.sql) `alamat = ${data.alamat}`);
    if (data.kecamatan !== undefined)
        updates.push((0, drizzle_orm_1.sql) `kecamatan = ${data.kecamatan}`);
    if (data.kelurahan !== undefined)
        updates.push((0, drizzle_orm_1.sql) `kelurahan = ${data.kelurahan}`);
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
        updates.push((0, drizzle_orm_1.sql) `geom = ST_SetSRID(ST_MakePoint(${data.longitude}, ${data.latitude}), 4326)`);
    }
    if (updates.length === 0) {
        res.status(400).json({ error: "Tidak ada field yang diperbarui." });
        return;
    }
    try {
        const result = await db_1.db.execute((0, drizzle_orm_1.sql) `
      UPDATE faskes
      SET ${drizzle_orm_1.sql.join(updates, (0, drizzle_orm_1.sql) `, `)}
      WHERE id = ${req.params.id}
      RETURNING id, nama, jenis, alamat, kecamatan, kelurahan,
                ST_AsGeoJSON(geom)::json AS geometry
    `);
        if (result.rows.length === 0) {
            res.status(404).json({ error: "Faskes tidak ditemukan." });
            return;
        }
        res.json((0, public_1.rowToFaskesFeature)(result.rows[0]));
    }
    catch (error) {
        console.error("Failed to update faskes", error);
        res.status(503).json({ error: "Layanan tidak tersedia sementara." });
    }
});
router.delete("/faskes/:id", async (req, res) => {
    try {
        const result = await db_1.db.execute((0, drizzle_orm_1.sql) `
      DELETE FROM faskes
      WHERE id = ${req.params.id}
      RETURNING id
    `);
        if (result.rows.length === 0) {
            res.status(404).json({ error: "Faskes tidak ditemukan." });
            return;
        }
        res.status(204).end();
    }
    catch (error) {
        console.error("Failed to delete faskes", error);
        res.status(503).json({ error: "Layanan tidak tersedia sementara." });
    }
});
router.get("/boundaries", async (req, res) => {
    try {
        const result = await db_1.db.execute((0, drizzle_orm_1.sql) `
      SELECT id, nama, level,
             ST_AsGeoJSON(geom)::json AS geometry
      FROM boundaries
    `);
        const features = result.rows.map((row) => (0, public_1.rowToBoundaryFeature)(row));
        res.type("application/json").json({ type: "FeatureCollection", features });
    }
    catch (error) {
        console.error("Failed to fetch admin boundaries", error);
        res.status(503).json({ error: "Layanan tidak tersedia sementara." });
    }
});
router.put("/boundaries/:id", async (req, res) => {
    const parsed = boundary_schema_1.BoundaryUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: "Payload tidak valid.", details: parsed.error.flatten().fieldErrors });
        return;
    }
    const data = parsed.data;
    const updates = [];
    if (data.nama !== undefined)
        updates.push((0, drizzle_orm_1.sql) `nama = ${data.nama}`);
    if (data.level !== undefined)
        updates.push((0, drizzle_orm_1.sql) `level = ${data.level}`);
    if (updates.length === 0) {
        res.status(400).json({ error: "Tidak ada field yang diperbarui." });
        return;
    }
    try {
        const result = await db_1.db.execute((0, drizzle_orm_1.sql) `
      UPDATE boundaries
      SET ${drizzle_orm_1.sql.join(updates, (0, drizzle_orm_1.sql) `, `)}
      WHERE id = ${req.params.id}
      RETURNING id, nama, level, ST_AsGeoJSON(geom)::json AS geometry
    `);
        if (result.rows.length === 0) {
            res.status(404).json({ error: "Boundary tidak ditemukan." });
            return;
        }
        res.json((0, public_1.rowToBoundaryFeature)(result.rows[0]));
    }
    catch (error) {
        console.error("Failed to update boundary metadata", error);
        res.status(503).json({ error: "Layanan tidak tersedia sementara." });
    }
});
router.put("/boundaries/:id/geometry", async (req, res) => {
    const validation = (0, geometryValidator_1.validateBoundaryGeometry)(req.body);
    if (!validation.valid) {
        res.status(400).json({ error: validation.error ?? "Format GeoJSON tidak valid." });
        return;
    }
    const geometry = req.body.type === "Feature" ? req.body.geometry : req.body;
    try {
        const result = await db_1.db.execute((0, drizzle_orm_1.sql) `
      UPDATE boundaries
      SET geom = ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(geometry)}), 4326)
      WHERE id = ${req.params.id}
      RETURNING id, nama, level, ST_AsGeoJSON(geom)::json AS geometry
    `);
        if (result.rows.length === 0) {
            res.status(404).json({ error: "Boundary tidak ditemukan." });
            return;
        }
        res.json((0, public_1.rowToBoundaryFeature)(result.rows[0]));
    }
    catch (error) {
        console.error("Failed to update boundary geometry", error);
        res.status(503).json({ error: "Layanan tidak tersedia sementara." });
    }
});
exports.default = router;
