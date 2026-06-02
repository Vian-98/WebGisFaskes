"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const vitest_1 = require("vitest");
const migrate_1 = require("../db/migrate");
const db_1 = require("../db");
process.env.NODE_ENV = "test";
(0, vitest_1.beforeAll)(async () => {
    await (0, migrate_1.runMigrations)();
});
(0, vitest_1.afterAll)(async () => {
    await db_1.pool.end();
});
