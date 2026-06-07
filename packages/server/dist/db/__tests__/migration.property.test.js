"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Feature: gis-faskes-bandar-lampung, Property 19: Database Migration is Idempotent
const vitest_1 = require("vitest");
const fast_check_1 = __importDefault(require("fast-check"));
const index_1 = require("../index");
const migrate_1 = require("../migrate");
async function snapshotSchema() {
    const tables = await index_1.pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
    const columns = await index_1.pool.query("SELECT table_name, column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema = 'public' ORDER BY table_name, column_name");
    const indexes = await index_1.pool.query("SELECT tablename, indexname FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename, indexname");
    const constraints = await index_1.pool.query("SELECT conname, conrelid::regclass::text AS table_name FROM pg_constraint WHERE connamespace = 'public'::regnamespace ORDER BY table_name, conname");
    return {
        tables: tables.rows,
        columns: columns.rows,
        indexes: indexes.rows,
        constraints: constraints.rows,
    };
}
(0, vitest_1.test)("Property 19: running migrations multiple times is idempotent", async () => {
    await fast_check_1.default.assert(fast_check_1.default.asyncProperty(fast_check_1.default.integer({ min: 1, max: 3 }), async (runs) => {
        const baseline = await snapshotSchema();
        for (let i = 0; i < runs; i += 1) {
            await (0, migrate_1.runMigrations)();
        }
        const after = await snapshotSchema();
        (0, vitest_1.expect)(after).toEqual(baseline);
    }));
});
