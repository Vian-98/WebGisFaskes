"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const csv_parser_1 = __importDefault(require("csv-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("../db");
dotenv_1.default.config();
function resolveCsvPath() {
    const argPath = process.argv[2];
    if (argPath) {
        return argPath;
    }
    const envPath = process.env.BOUNDARY_CENTROIDS_CSV_PATH;
    if (envPath) {
        return envPath;
    }
    return path_1.default.resolve("data", "BatasWilayah_Kecamatan_BandarLampung.csv");
}
function toNumber(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}
async function truncateIfRequested() {
    if (process.env.TRUNCATE_BOUNDARY_CENTROIDS === "true") {
        await db_1.pool.query("TRUNCATE TABLE boundary_centroids RESTART IDENTITY CASCADE");
    }
}
async function insertRow(row) {
    const lat = toNumber(row.centroid_latitude);
    const lon = toNumber(row.centroid_longitude);
    if (lat === null || lon === null) {
        return false;
    }
    await db_1.pool.query("INSERT INTO boundary_centroids (nama, kabupaten_kota, provinsi, geom) VALUES ($1, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326))", [
        row.nama_kecamatan?.trim() ?? "",
        row.kabupaten_kota?.trim() ?? "",
        row.provinsi?.trim() ?? "",
        lon,
        lat,
    ]);
    return true;
}
async function run() {
    const csvPath = resolveCsvPath();
    await truncateIfRequested();
    let total = 0;
    let inserted = 0;
    let skipped = 0;
    const rows = [];
    await new Promise((resolve, reject) => {
        (0, fs_1.createReadStream)(csvPath)
            .pipe((0, csv_parser_1.default)())
            .on("data", (row) => {
            rows.push(row);
        })
            .on("end", () => resolve())
            .on("error", (error) => reject(error));
    });
    for (const row of rows) {
        total += 1;
        try {
            const ok = await insertRow(row);
            if (ok) {
                inserted += 1;
            }
            else {
                skipped += 1;
            }
        }
        catch (error) {
            skipped += 1;
            console.warn("Failed to import row", error);
        }
    }
    console.log("Import boundary centroids selesai", { total, inserted, skipped });
    await db_1.pool.end();
}
run().catch((error) => {
    console.error("Import boundary centroids gagal", error);
    process.exitCode = 1;
});
