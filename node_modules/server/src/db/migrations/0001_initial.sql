CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS faskes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama TEXT NOT NULL,
  jenis TEXT NOT NULL,
  alamat TEXT NOT NULL DEFAULT '',
  kecamatan TEXT NOT NULL DEFAULT '',
  kelurahan TEXT NOT NULL DEFAULT '',
  geom geometry(Point, 4326) NOT NULL,
  CONSTRAINT faskes_geom_not_null CHECK (geom IS NOT NULL)
);

ALTER TABLE faskes
  ADD COLUMN IF NOT EXISTS geom geometry(Point, 4326);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'faskes_geom_not_null'
  ) THEN
    ALTER TABLE faskes
      ADD CONSTRAINT faskes_geom_not_null CHECK (geom IS NOT NULL);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS faskes_geom_gist ON faskes USING GIST (geom);

CREATE TABLE IF NOT EXISTS boundaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('kecamatan', 'kelurahan')),
  geom geometry(MultiPolygon, 4326) NOT NULL,
  CONSTRAINT boundaries_geom_not_null CHECK (geom IS NOT NULL)
);

ALTER TABLE boundaries
  ADD COLUMN IF NOT EXISTS geom geometry(MultiPolygon, 4326);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'boundaries_level_check'
  ) THEN
    ALTER TABLE boundaries
      ADD CONSTRAINT boundaries_level_check CHECK (level IN ('kecamatan', 'kelurahan'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'boundaries_geom_not_null'
  ) THEN
    ALTER TABLE boundaries
      ADD CONSTRAINT boundaries_geom_not_null CHECK (geom IS NOT NULL);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS boundaries_geom_gist ON boundaries USING GIST (geom);

CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
  sid VARCHAR PRIMARY KEY,
  sess JSON NOT NULL,
  expire TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS sessions_expire_idx ON sessions (expire);
