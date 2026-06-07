CREATE TABLE "admins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	CONSTRAINT "admins_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "boundaries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nama" text NOT NULL,
	"level" text NOT NULL,
	"geom" geometry,
	CONSTRAINT "boundaries_level_check" CHECK (level IN ('kecamatan', 'kelurahan')),
	CONSTRAINT "boundaries_geom_not_null" CHECK (geom IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "faskes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nama" text NOT NULL,
	"jenis" text NOT NULL,
	"alamat" text DEFAULT '' NOT NULL,
	"kecamatan" text DEFAULT '' NOT NULL,
	"kelurahan" text DEFAULT '' NOT NULL,
	"geom" geometry,
	CONSTRAINT "faskes_geom_not_null" CHECK (geom IS NOT NULL)
);
