import "dotenv/config";
import { beforeAll, afterAll } from "vitest";
import { runMigrations } from "../db/migrate";
import { pool } from "../db";

process.env.NODE_ENV = "test";

beforeAll(async () => {
  await runMigrations();
});

afterAll(async () => {
  await pool.end();
});
