// Feature: gis-faskes-bandar-lampung, Property 19: Database Migration is Idempotent
import { afterAll, beforeAll, test, expect } from "vitest";
import fc from "fast-check";
import { pool } from "../index";
import { runMigrations } from "../migrate";

async function snapshotSchema() {
  const tables = await pool.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
  );
  const columns = await pool.query(
    "SELECT table_name, column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema = 'public' ORDER BY table_name, column_name"
  );
  const indexes = await pool.query(
    "SELECT tablename, indexname FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename, indexname"
  );
  const constraints = await pool.query(
    "SELECT conname, conrelid::regclass::text AS table_name FROM pg_constraint WHERE connamespace = 'public'::regnamespace ORDER BY table_name, conname"
  );

  return {
    tables: tables.rows,
    columns: columns.rows,
    indexes: indexes.rows,
    constraints: constraints.rows,
  };
}

test("Property 19: running migrations multiple times is idempotent", async () => {
  await fc.assert(
    fc.asyncProperty(fc.integer({ min: 1, max: 3 }), async (runs) => {
      const baseline = await snapshotSchema();
      for (let i = 0; i < runs; i += 1) {
        await runMigrations();
      }
      const after = await snapshotSchema();
      expect(after).toEqual(baseline);
    })
  );
});
