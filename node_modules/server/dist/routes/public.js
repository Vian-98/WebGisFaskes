"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rowToFaskesFeature = rowToFaskesFeature;
exports.rowToBoundaryFeature = rowToBoundaryFeature;
const express_1 = require("express");
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = require("../db");
const router = (0, express_1.Router)();
function rowToFaskesFeature(row) {
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
function rowToBoundaryFeature(row) {
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
        const result = await db_1.db.execute((0, drizzle_orm_1.sql) `
      SELECT id, nama, jenis, alamat, kecamatan, kelurahan,
             ST_AsGeoJSON(geom)::json AS geometry
      FROM faskes
    `);
        const features = result.rows.map((row) => rowToFaskesFeature(row));
        res.type("application/json").json({ type: "FeatureCollection", features });
    }
    catch (error) {
        console.error("Failed to fetch faskes", error);
        res.status(503).json({ error: "Layanan tidak tersedia sementara." });
    }
});
router.get("/faskes/:id", async (req, res) => {
    try {
        const result = await db_1.db.execute((0, drizzle_orm_1.sql) `
      SELECT id, nama, jenis, alamat, kecamatan, kelurahan,
             ST_AsGeoJSON(geom)::json AS geometry
      FROM faskes
      WHERE id = ${req.params.id}
    `);
        if (result.rows.length === 0) {
            res.status(404).json({ error: "Faskes tidak ditemukan." });
            return;
        }
        res.type("application/json").json(rowToFaskesFeature(result.rows[0]));
    }
    catch (error) {
        console.error("Failed to fetch faskes by id", error);
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
        const features = result.rows.map((row) => rowToBoundaryFeature(row));
        res.type("application/json").json({ type: "FeatureCollection", features });
    }
    catch (error) {
        console.error("Failed to fetch boundaries", error);
        res.status(503).json({ error: "Layanan tidak tersedia sementara." });
    }
});
router.get("/boundaries/:id", async (req, res) => {
    try {
        const result = await db_1.db.execute((0, drizzle_orm_1.sql) `
      SELECT id, nama, level,
             ST_AsGeoJSON(geom)::json AS geometry
      FROM boundaries
      WHERE id = ${req.params.id}
    `);
        if (result.rows.length === 0) {
            res.status(404).json({ error: "Boundary tidak ditemukan." });
            return;
        }
        res.type("application/json").json(rowToBoundaryFeature(result.rows[0]));
    }
    catch (error) {
        console.error("Failed to fetch boundary by id", error);
        res.status(503).json({ error: "Layanan tidak tersedia sementara." });
    }
});
exports.default = router;
