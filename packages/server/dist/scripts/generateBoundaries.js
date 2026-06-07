"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("../db");
dotenv_1.default.config();
async function run() {
    console.log("Generating boundary polygons using Voronoi partitioning around centroids...");
    // 1. Truncate boundaries
    await db_1.pool.query("TRUNCATE TABLE boundaries RESTART IDENTITY CASCADE");
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
    const result = await db_1.pool.query(query);
    console.log("Boundary polygons generated successfully!", result.rowCount, "rows inserted.");
    await db_1.pool.end();
}
run().catch(err => {
    console.error("Failed to generate boundaries:", err);
    process.exit(1);
});
