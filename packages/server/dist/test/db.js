"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetDatabase = resetDatabase;
exports.seedAdmin = seedAdmin;
exports.seedFaskes = seedFaskes;
exports.seedBoundary = seedBoundary;
const db_1 = require("../db");
const password_1 = require("../auth/password");
async function resetDatabase() {
    await db_1.pool.query("TRUNCATE TABLE faskes, boundaries, boundary_centroids, admins, sessions RESTART IDENTITY CASCADE");
}
async function seedAdmin(username, password) {
    const passwordHash = await (0, password_1.hashPassword)(password);
    const result = await db_1.pool.query("INSERT INTO admins (username, password_hash) VALUES ($1, $2) RETURNING id", [username, passwordHash]);
    return result.rows[0].id;
}
async function seedFaskes(params) {
    await db_1.pool.query("INSERT INTO faskes (id, nama, jenis, alamat, kecamatan, kelurahan, geom) VALUES ($1, $2, $3, $4, $5, $6, ST_SetSRID(ST_MakePoint($7, $8), 4326))", [
        params.id,
        params.nama,
        params.jenis,
        params.alamat,
        params.kecamatan,
        params.kelurahan,
        params.longitude,
        params.latitude,
    ]);
}
async function seedBoundary(params) {
    await db_1.pool.query("INSERT INTO boundaries (id, nama, level, geom) VALUES ($1, $2, $3, ST_SetSRID(ST_GeomFromGeoJSON($4), 4326))", [params.id, params.nama, params.level, JSON.stringify(params.geometry)]);
}
