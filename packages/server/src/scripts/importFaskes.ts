import { createReadStream } from "fs";
import path from "path";
import csv from "csv-parser";
import dotenv from "dotenv";
import { pool } from "../db";

dotenv.config();

type FaskesRow = {
  kdppk: string;
  nmppk: string;
  jnsppk: string;
  nmjnsppk: string;
  telpppk: string;
  latitude: string;
  longitude: string;
  nmjlnppk: string;
  icon: string;
};

const BBOX = {
  minLat: -5.52,
  maxLat: -5.28,
  minLon: 105.18,
  maxLon: 105.42,
};

function resolveCsvPath(): string {
  const argPath = process.argv[2];
  if (argPath) {
    return argPath;
  }
  const envPath = process.env.FASKES_CSV_PATH;
  if (envPath) {
    return envPath;
  }
  return path.resolve("data", "faskes_bandar_lampung_all.csv");
}

function toNumber(value: string): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function isInBbox(lat: number, lon: number): boolean {
  return (
    lat >= BBOX.minLat &&
    lat <= BBOX.maxLat &&
    lon >= BBOX.minLon &&
    lon <= BBOX.maxLon
  );
}

async function truncateIfRequested(): Promise<void> {
  if (process.env.TRUNCATE_FASKES === "true") {
    await pool.query("TRUNCATE TABLE faskes RESTART IDENTITY CASCADE");
  }
}

async function insertRow(row: FaskesRow): Promise<boolean> {
  const lat = toNumber(row.latitude);
  const lon = toNumber(row.longitude);

  if (lat === null || lon === null) {
    return false;
  }

  if (!isInBbox(lat, lon)) {
    return false;
  }

  await pool.query(
    "INSERT INTO faskes (nama, jenis, alamat, kecamatan, kelurahan, geom) VALUES ($1, $2, $3, $4, $5, ST_SetSRID(ST_MakePoint($6, $7), 4326))",
    [
      row.nmppk?.trim() ?? "",
      (row.nmjnsppk || row.jnsppk || "").trim(),
      row.nmjlnppk?.trim() ?? "",
      "",
      "",
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

  await new Promise<void>((resolve, reject) => {
    createReadStream(csvPath)
      .pipe(csv())
      .on("data", async (row: FaskesRow) => {
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
      })
      .on("end", () => resolve())
      .on("error", (error) => reject(error));
  });

  console.log("Import faskes selesai", { total, inserted, skipped });
  await pool.end();
}

run().catch((error) => {
  console.error("Import faskes gagal", error);
  process.exitCode = 1;
});
