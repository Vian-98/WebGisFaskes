import { pool } from "../db/index";

async function main() {
  try {
    console.log("Updating faskes kecamatan from boundaries...");
    
    const query = `
      UPDATE faskes
      SET kecamatan = b.nama
      FROM boundaries b
      WHERE b.level = 'kecamatan'
        AND ST_Intersects(faskes.geom, b.geom);
    `;
    
    const result = await pool.query(query);
    console.log(`Successfully updated ${result.rowCount} faskes records with their kecamatan.`);
    
  } catch (error) {
    console.error("Error updating kecamatan:", error);
  } finally {
    await pool.end();
  }
}

main();
