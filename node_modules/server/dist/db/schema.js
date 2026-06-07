"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.admins = exports.boundaries = exports.faskes = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
exports.faskes = (0, pg_core_1.pgTable)("faskes", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    nama: (0, pg_core_1.text)("nama").notNull(),
    jenis: (0, pg_core_1.text)("jenis").notNull(),
    alamat: (0, pg_core_1.text)("alamat").notNull().default(""),
    kecamatan: (0, pg_core_1.text)("kecamatan").notNull().default(""),
    kelurahan: (0, pg_core_1.text)("kelurahan").notNull().default(""),
}, (table) => ({
    geomNotNull: (0, pg_core_1.check)("faskes_geom_not_null", (0, drizzle_orm_1.sql) `geom IS NOT NULL`),
}));
exports.boundaries = (0, pg_core_1.pgTable)("boundaries", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    nama: (0, pg_core_1.text)("nama").notNull(),
    level: (0, pg_core_1.text)("level").notNull(),
}, (table) => ({
    levelCheck: (0, pg_core_1.check)("boundaries_level_check", (0, drizzle_orm_1.sql) `level IN ('kecamatan', 'kelurahan')`),
    geomNotNull: (0, pg_core_1.check)("boundaries_geom_not_null", (0, drizzle_orm_1.sql) `geom IS NOT NULL`),
}));
exports.admins = (0, pg_core_1.pgTable)("admins", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    username: (0, pg_core_1.text)("username").notNull().unique(),
    passwordHash: (0, pg_core_1.text)("password_hash").notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true })
        .notNull()
        .default((0, drizzle_orm_1.sql) `NOW()`),
});
