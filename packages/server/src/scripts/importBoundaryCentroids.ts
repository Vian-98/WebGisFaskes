import { createReadStream } from "fs";
import path from "path";
import csv from "csv-parser";
import dotenv from "dotenv";
import { pool } from "../db";

dotenv.config();

type BoundaryRow = {
  nama_kecamatan: string;
  kabupaten_kota: string;
  provinsi: string;
  centroid_longitude: string;
  centroid_latitude: string;
};

function resolveCsvPath(): string {
  const argPath = process.argv[2];
  if (argPath) {
    return argPath;
  }
  const envPath = process.env.BOUNDARY_CENTROIDS_CSV_PATH;
  if (envPath) {
    return envPath;
  }
  return path.resolve("data", "BatasWilayah_Kecamatan_BandarLampung.csv");
}

function toNumber(value: string): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function truncateIfRequested(): Promise<void> {
  if (process.env.TRUNCATE_BOUNDARY_CENTROIDS === "true") {
    await pool.query("TRUNCATE TABLE boundary_centroids RESTART IDENTITY CASCADE");
  }
}

async function insertRow(row: BoundaryRow): Promise<boolean> {
  const lat = toNumber(row.centroid_latitude);
  const lon = toNumber(row.centroid_longitude);

  if (lat === null || lon === null) {
    return false;
  }

  await pool.query(
    "INSERT INTO boundary_centroids (nama, kabupaten_kota, provinsi, geom) VALUES ($1, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326))",
    [
      row.nama_kecamatan?.trim() ?? "",
      row.kabupaten_kota?.trim() ?? "",
      row.provinsi?.trim() ?? "",
      lon,
      lat,
    ]
  );

  return true;
}

async function run(): Promise<void> {
  const csvPath = resolveCsvPath();
  await truncateIfRequested();

  let total = 0;
  let inserted = 0;
  let skipped = 0;

  const rows: BoundaryRow[] = [];

  await new Promise<void>((resolve, reject) => {
    createReadStream(csvPath)
      .pipe(csv())
      .on("data", (row: BoundaryRow) => {
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
      } else {
        skipped += 1;
      }
    } catch (error) {
      skipped += 1;
      console.warn("Failed to import row", error);
    }
  }

  console.log("Import boundary centroids selesai", { total, inserted, skipped });
  await pool.end();
}

run().catch((error) => {
  console.error("Import boundary centroids gagal", error);
  process.exitCode = 1;
});
