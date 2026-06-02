import { check, pgTable, text, uuid, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const faskes = pgTable(
  "faskes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    nama: text("nama").notNull(),
    jenis: text("jenis").notNull(),
    alamat: text("alamat").notNull().default(""),
    kecamatan: text("kecamatan").notNull().default(""),
    kelurahan: text("kelurahan").notNull().default(""),
  },
  (table) => ({
    geomNotNull: check("faskes_geom_not_null", sql`geom IS NOT NULL`),
  })
);

export const boundaries = pgTable(
  "boundaries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    nama: text("nama").notNull(),
    level: text("level").notNull(),
  },
  (table) => ({
    levelCheck: check(
      "boundaries_level_check",
      sql`level IN ('kecamatan', 'kelurahan')`
    ),
    geomNotNull: check("boundaries_geom_not_null", sql`geom IS NOT NULL`),
  })
);

export const admins = pgTable("admins", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`NOW()`),
});
