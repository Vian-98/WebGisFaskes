import { pool } from "../db/index";

async function main() {
  console.log("Menghapus titik faskes yang berada di luar batas wilayah Bandar Lampung...");

  try {
    // Menghapus faskes yang geom-nya TIDAK beririsan (intersect) dengan satupun poligon di tabel boundaries
    const result = await pool.query(`
      DELETE FROM faskes
      WHERE NOT EXISTS (
        SELECT 1 FROM boundaries
        WHERE ST_Intersects(faskes.geom, boundaries.geom)
      )
    `);

    console.log(`Sukses menghapus ${result.rowCount} titik faskes yang berada di luar batas wilayah.`);
  } catch (error) {
    console.error("Error menghapus faskes:", error);
  } finally {
    await pool.end();
  }
}

main();
