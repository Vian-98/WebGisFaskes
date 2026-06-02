"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMigrations = runMigrations;
const promises_1 = require("fs/promises");
const path_1 = __importDefault(require("path"));
const index_1 = require("./index");
const migrationsDir = path_1.default.join(__dirname, "migrations");
async function runMigrations() {
    const files = (await (0, promises_1.readdir)(migrationsDir))
        .filter((file) => file.endsWith(".sql"))
        .sort();
    for (const file of files) {
        const fullPath = path_1.default.join(migrationsDir, file);
        const sql = await (0, promises_1.readFile)(fullPath, "utf8");
        await index_1.pool.query(sql);
    }
}
async function main() {
    await runMigrations();
    await index_1.pool.end();
}
if (require.main === module) {
    main().catch((error) => {
        console.error("Migration failed", error);
        process.exitCode = 1;
    });
}
