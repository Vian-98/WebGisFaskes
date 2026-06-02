# WebGIS Faskes Bandar Lampung

Monorepo untuk WebGIS analisis jangkauan faskes Bandar Lampung. Backend Express + PostGIS, frontend Leaflet + Turf.js, admin panel sederhana.

## Progress yang sudah dikerjakan

- Setup monorepo, workspace, dan dependencies backend/frontend/admin.
- Database schema + migrasi idempoten (PostGIS) + runner migrasi.
- Backend API: public routes, auth, dan admin CRUD.
- Middleware auth, rate limit, dan hashing password + property tests.
- Frontend data module, validator, state store, dan analysis module + property tests.
- UI GIS dasar: peta, marker faskes, filter, pencarian, buffer, nearest facilities.
- Hosting satu domain: server menyajikan frontend + admin dari folder build.
- Import data: script import faskes CSV dan centroid boundary (tabel terpisah).

## Progress yang belum dikerjakan (gap terhadap tasks.md)

- Task 5 property tests untuk public routes (Property 11, 12, 13) belum dibuat.
- Task 7 checkpoint backend belum diverifikasi (jalankan semua test dan verifikasi endpoint).
- Task 8 sudah dibuat test integrasi, tetapi perlu memastikan test DB siap dan tests dijalankan.
- Admin panel masih placeholder (belum ada UI CRUD faskes/boundary).
- Boundary polygon belum terisi (butuh GeoJSON); saat ini hanya centroid boundary yang tersedia.
- Fitur export PNG/CSV dan UI map advanced belum dibuat.

## Cara menjalankan (1 website utuh)

### 1) Siapkan environment

Buat file `.env` di `packages/server` atau set env global:

```
DATABASE_URL=postgres://user:pass@localhost:5432/webgis
SESSION_SECRET=change-me
```

### 2) Migrasi database

```
cd packages/server
npx tsx src/db/migrate.ts
```

### 3) Import data

Faskes:
```
npm run import:faskes -w packages/server -- "D:\Sistem Informasi Geografis\Project\faskes_bandar_lampung_all.csv"
```

Centroid boundary:
```
npm run import:boundary-centroids -w packages/server -- "D:\Sistem Informasi Geografis\Project\BatasWilayah_Kecamatan_BandarLampung.csv"
```

### 4) Build frontend + admin

```
npm run build:web
```

### 5) Jalankan server (single domain)

```
npm run dev -w packages/server
```

Akses:
- Publik: http://localhost:3000
- Admin: http://localhost:3000/admin

## Menjalankan test

Backend:
```
npm run test -w packages/server
```

Frontend:
```
npm run test -w packages/frontend
```

## Catatan penting

- Peta boundary polygon hanya akan muncul jika tabel `boundaries` diisi GeoJSON polygon.
- CSV boundary yang ada hanya centroid dan disimpan ke tabel `boundary_centroids`.
- Jika ingin boundary polygon, siapkan GeoJSON dan tambahkan script import ke tabel `boundaries`.
