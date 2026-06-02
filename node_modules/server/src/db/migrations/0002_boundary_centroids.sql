CREATE TABLE IF NOT EXISTS boundary_centroids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama TEXT NOT NULL,
  kabupaten_kota TEXT NOT NULL,
  provinsi TEXT NOT NULL,
  geom geometry(Point, 4326) NOT NULL,
  CONSTRAINT boundary_centroids_geom_not_null CHECK (geom IS NOT NULL)
);

ALTER TABLE boundary_centroids
  ADD COLUMN IF NOT EXISTS geom geometry(Point, 4326);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'boundary_centroids_geom_not_null'
  ) THEN
    ALTER TABLE boundary_centroids
      ADD CONSTRAINT boundary_centroids_geom_not_null CHECK (geom IS NOT NULL);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS boundary_centroids_geom_gist
  ON boundary_centroids USING GIST (geom);
