const { Pool } = require("pg");
require("dotenv").config();

async function check() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const res = await pool.query(`SELECT count(*) FROM faskes, boundaries WHERE ST_Intersects(faskes.geom, boundaries.geom)`);
    console.log("Intersections:", res.rows[0].count);
    
    const res2 = await pool.query(`SELECT count(*) FROM faskes`);
    console.log("Total faskes:", res2.rows[0].count);
  } finally {
    await pool.end();
  }
}
check();
