import dotenv from "dotenv";
import { pool } from "../db";

dotenv.config();

async function run() {
  console.log("Generating boundary polygons using Voronoi partitioning around centroids...");
  
  // 1. Truncate boundaries
  await pool.query("TRUNCATE TABLE boundaries RESTART IDENTITY CASCADE");
  
  // 2. Run Voronoi generation and insert
  const query = `
    WITH centroids AS (
      SELECT ST_Collect(geom) AS geom FROM boundary_centroids
    ),
    voronoi AS (
      SELECT (ST_Dump(ST_VoronoiPolygons(geom))).geom AS cell
      FROM centroids
    ),
    bounded_voronoi AS (
      SELECT ST_Intersection(cell, ST_MakeEnvelope(105.18, -5.52, 105.42, -5.28, 4326)) AS cell
      FROM voronoi
    )
    INSERT INTO boundaries (nama, level, geom)
    SELECT 
      c.nama,
      'kecamatan'::text AS level,
      ST_Multi(bv.cell) AS geom
    FROM bounded_voronoi bv
    CROSS JOIN LATERAL (
      SELECT nama 
      FROM boundary_centroids 
      ORDER BY geom <-> bv.cell 
      LIMIT 1
    ) c;
  `;
  
  const result = await pool.query(query);
  console.log("Boundary polygons generated successfully!", result.rowCount, "rows inserted.");
  await pool.end();
}

run().catch(err => {
  console.error("Failed to generate boundaries:", err);
  process.exit(1);
});
