import fs from "fs";
import path from "path";
import { pool, db } from "../db/index";
import { boundaries } from "../db/schema";
import { eq } from "drizzle-orm";

async function main() {
  const args = process.argv.slice(2);
  const jsonPath = args[0] || "data/ADMINISTRASIKECAMATAN_AR_50K (1).json";
  const absolutePath = path.resolve(process.cwd(), jsonPath);

  if (!fs.existsSync(absolutePath)) {
    console.error(`File tidak ditemukan: ${absolutePath}`);
    process.exit(1);
  }

  console.log(`Membaca file JSON dari ${absolutePath}...`);
  const rawData = fs.readFileSync(absolutePath, "utf8");
  const data = JSON.parse(rawData);

  if (data.type !== "FeatureCollection" || !Array.isArray(data.features)) {
    console.error("Format JSON tidak valid. Harus berupa FeatureCollection.");
    process.exit(1);
  }

  // Filter khusus untuk Bandar Lampung
  const bandarLampungFeatures = data.features.filter(
    (f: any) =>
      f.properties &&
      f.properties.WADMKK &&
      f.properties.WADMKK.replace(/\s+/g, "").toUpperCase() === "BANDARLAMPUNG"
  );

  console.log(`Ditemukan ${bandarLampungFeatures.length} kecamatan untuk Bandar Lampung.`);

  try {
    // Kosongkan tabel boundaries yang lama
    console.log("Menghapus data batas wilayah lama...");
    await pool.query("TRUNCATE boundaries RESTART IDENTITY CASCADE");

    console.log("Menyimpan poligon ke database...");
    
    let count = 0;
    for (const feature of bandarLampungFeatures) {
      const nama = feature.properties.NAMOBJ;
      let geometry = feature.geometry;
      
      if (!geometry || !nama) continue;

      // Konversi Polygon ke MultiPolygon karena skema DB mensyaratkan MultiPolygon
      if (geometry.type === "Polygon") {
        geometry = {
          type: "MultiPolygon",
          coordinates: [geometry.coordinates]
        };
      }

      const geomGeoJSON = JSON.stringify(geometry);
      
      // Simpan langsung ke DB menggunakan PostGIS ST_GeomFromGeoJSON
      await pool.query(
        `INSERT INTO boundaries (nama, level, geom)
         VALUES ($1, 'kecamatan', ST_SetSRID(ST_GeomFromGeoJSON($2), 4326))`,
        [nama, geomGeoJSON]
      );
      
      count++;
    }

    console.log(`Sukses mengimpor ${count} poligon kecamatan ke database.`);
  } catch (error) {
    console.error("Error mengimpor data:", error);
  } finally {
    await pool.end();
  }
}

main();
