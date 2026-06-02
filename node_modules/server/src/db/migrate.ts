import { readdir, readFile } from "fs/promises";
import path from "path";
import { pool } from "./index";

const migrationsDir = path.join(__dirname, "migrations");

export async function runMigrations(): Promise<void> {
  const files = (await readdir(migrationsDir))
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const fullPath = path.join(migrationsDir, file);
    const sql = await readFile(fullPath, "utf8");
    await pool.query(sql);
  }
}

async function main(): Promise<void> {
  await runMigrations();
  await pool.end();
}

if (require.main === module) {
  main().catch((error) => {
    console.error("Migration failed", error);
    process.exitCode = 1;
  });
}
