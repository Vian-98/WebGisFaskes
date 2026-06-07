# WebGIS Faskes Bandar Lampung

Aplikasi WebGIS modern dan interaktif untuk analisis sebaran dan jangkauan Fasilitas Kesehatan (Faskes) di Kota Bandar Lampung. Proyek ini menggunakan arsitektur Monorepo yang mengandalkan **Express + PostGIS** di sisi backend, dan **Leaflet + Turf.js** dengan antarmuka Vanilla TS / CSS Glassmorphism di sisi frontend. Tersedia juga panel **Admin** khusus untuk mengelola data spasial.

---

## 🌟 Fitur Utama yang Sudah Diselesaikan

### 1. Halaman Publik (Frontend)
- **Desain Premium Light-Mode**: Antarmuka *Glassmorphism* yang cerah, elegan, dan sangat responsif.
- **Peta Interaktif (Leaflet)**: Mendukung berbagai *basemap* pilihan (Positron, Voyager, Dark Matter, Satellite).
- **Visualisasi Spasial**:
  - Titik Fasilitas Kesehatan (Rumah Sakit, Puskesmas, Klinik, Apotek) dengan efek *hover tooltip* dan pop-up interaktif terintegrasi ke navigasi Google Maps.
  - Poligon Batas Wilayah (Kecamatan/Kelurahan) yang dilengkapi dengan label nama otomatis di tengah area (*centroid*).
- **Analisis GIS (Menggunakan Turf.js)**:
  - **Filter & Pencarian**: Filter faskes berdasarkan jenis dan pencarian teks secara *real-time*.
  - **Analisis Buffer**: Pembuatan zona jangkauan (*buffer*) dinamis di sekitar Faskes dengan radius fleksibel (100m - 5000m).
  - **Statistik Cakupan Wilayah**: Perhitungan otomatis rasio persentase luas area wilayah yang terlayani (*covered*) versus yang tidak terlayani (*uncovered*) oleh faskes berdasarkan zona radius.
  - **Pencarian Titik Terdekat**: Klik di manapun pada peta untuk menemukan Faskes terdekat beserta perhitungan presisi jaraknya dalam satuan Kilometer.
  - **GPS**: Menemukan lokasi GPS pengguna saat ini secara otomatis (jika diizinkan oleh browser).
- **Ekspor Data Analisis**:
  - **Cetak Peta (PNG)**: Menggunakan teknologi `dom-to-image-more` untuk mencetak gambar peta resolusi tinggi yang akurat menjaga struktur vektor.
  - **Ekspor Data (CSV)**: Kemampuan mengunduh laporan detail Faskes di area *buffer*, daftar titik terdekat, dan statistik persentase cakupan per wilayah kecamatan secara terpisah.

### 2. Panel Admin
- **Sistem Keamanan**: *Authentication* (Login) berbasis JWT dengan skema enkripsi dan batasan *Rate Limit*.
- **Desain UI Konsisten**: Tema *Glassmorphism Light* yang selaras dengan halaman publik.
- **Dashboard Data Spasial**: Menampilkan ringkasan jumlah Faskes dan pembagian Batas Wilayah secara visual.
- **Manajemen Faskes (CRUD)**: Fasilitas pencarian, edit, hapus, dan tambah Faskes (termasuk penyimpanan presisi koordinat Latitude dan Longitude).
- **Manajemen Batas Wilayah (CRUD)**: Fasilitas untuk memodifikasi bentuk batas wilayah menggunakan data GeoJSON terintegrasi.
- **Auto-Seeding Admin**: Tersedia *script* mudah untuk mengatur ulang atau membuat akun *admin* default.

### 3. Arsitektur Backend & Database (PostGIS)
- **Monorepo**: Turborepo dengan `concurrently` (Satu perintah untuk menjalankan Vite frontend, Vite admin, dan server Express).
- **HPM Proxy**: Server Node.js menangani rute API, dan mem-proxy permintaan frontend Vite agar berjalan dalam 1 domain (`localhost:3000`).
- **PostGIS / Drizzle ORM**: Tabel dioptimasi dengan tipe data spesifik GEOMETRY dari PostGIS, dikontrol sepenuhnya melalui skema migrasi dari Drizzle ORM.
- **Property-based Testing**: Unit tes fungsional (fast-check) untuk menguji konsistensi sistem.

---

## 🚀 Cara Menjalankan Aplikasi Lokal

### 1) Siapkan Environment

Buat file `.env` di folder `packages/server`:

```env
DATABASE_URL=postgres://user:pass@localhost:5432/webgis
SESSION_SECRET=rahasia-webgis-faskes
```

### 2) Inisialisasi Database & Import Data

Terdapat dua skenario persiapan database, ikuti salah satu yang sesuai dengan kondisi Anda:

#### Skenario A: Jika Memulai dari Nol (Instalasi Baru)
Jalankan perintah ini dari *root folder* untuk membuat tabel dan skema PostGIS ke dalam database Anda:
```bash
cd packages/server
npx tsx src/db/migrate.ts
```

#### Skenario B: Jika Sudah Punya Versi Sebelumnya (Reset & Drop Data)
Jika Anda sebelumnya sudah menjalankan aplikasi ini (memiliki versi/data lama) dan ingin melakukan reset total untuk menggunakan format/data batas wilayah terbaru:
1. Buka database PostGIS Anda (menggunakan DBeaver/pgAdmin/psql).
2. Jalankan perintah SQL berikut untuk **menghapus bersih (drop)** semua skema tabel lama dan membuat yang baru secara instan:
   ```sql
   DROP SCHEMA public CASCADE;
   CREATE SCHEMA public;
   -- Pastikan extension postgis aktif di public
   CREATE EXTENSION IF NOT EXISTS postgis;
   ```
3. Hapus seluruh isi yang ada di dalam folder `packages/server/src/db/migrations`.
4. Buka terminal di folder project, *generate* ulang migrasi dan terapkan ke database yang baru di-reset:
   ```bash
   cd packages/server
   npx drizzle-kit generate
   npx tsx src/db/migrate.ts
   ```

---

**PENTING: Import Data Awal (Wajib untuk Kedua Skenario di Atas)**
Agar peta memiliki data faskes dan batas wilayah, jalankan **keempat** perintah berikut secara berurutan (pastikan posisi terminal Anda berada di dalam folder `packages/server`):

1. **Import data Faskes mentah** dari file CSV:
   ```bash
   npm run import:faskes -- "data/faskes_bandar_lampung_all.csv"
   ```
2. **Import Poligon Batas Wilayah** (Bandar Lampung) dari file GeoJSON:
   ```bash
   npm run import:boundaries -- "data/ADMINISTRASIKECAMATAN_AR_50K (1).json"
   ```
3. **Bersihkan Titik Offside**: Menghapus titik-titik Faskes yang lokasinya berada di luar area poligon Bandar Lampung:
   ```bash
   npm run clean:faskes
   ```
4. **Lengkapi Kolom Metadata**: Mengisi kolom 'Kecamatan' pada tabel Faskes secara otomatis menggunakan perhitungan *Spatial Intersection* dengan poligon yang telah diimpor sebelumnya:
   ```bash
   npx tsx src/scripts/fillKecamatan.ts
   ```

### 3) Menjalankan Mode Development (Semua Lapis)

Anda hanya cukup menjalankan 1 baris perintah berikut dari direktori **root** (pastikan sudah `npm install` sebelumnya):
```bash
npm run dev:all
```
Perintah ini akan secara ajaib menjalankan *Server Express* di port 3000, lalu mem-proxy UI dari Frontend dan Admin Panel Vite.

### 4) Akses Web & Login Admin
- **Halaman Publik / Analisis GIS**: `http://localhost:3000/`
- **Dashboard Admin**: `http://localhost:3000/admin/`

Untuk mengakses Dashboard Admin, gunakan kredensial bawaan yang telah dibuat (atau buat ulang dengan `npx tsx src/scripts/seedAdmin.ts` dari dalam folder `packages/server`):
- **Username**: `admin`
- **Password**: `password123`

---

## 💾 Panduan Manajemen Database (Migrasi)

Jika Anda melakukan perubahan pada skema tabel di file `src/db/schema.ts`, berikut adalah cara untuk mengelola migrasi menggunakan **Drizzle ORM**:

### 1. Menghapus/Mereset Migrasi Lama (Reset Database)
Jika Anda ingin mereset database ke kondisi kosong dan menghapus histori migrasi sebelumnya:
1. Buka database Anda menggunakan DBeaver/pgAdmin.
2. Jalankan perintah SQL berikut untuk mereset skema secara instan:
   ```sql
   DROP SCHEMA public CASCADE;
   CREATE SCHEMA public;
   ```
3. Hapus seluruh isi folder `packages/server/src/db/migrations` di project Anda.

### 2. Membuat Migrasi Baru (Generate)
Setelah Anda mengubah file skema (`schema.ts`) atau mereset database, generate file migrasi baru dengan menjalankan:
```bash
cd packages/server
npx drizzle-kit generate
```

### 3. Menerapkan Migrasi ke Database (Push/Migrate)
Setelah file migrasi sukses dibuat, terapkan ke database PostGIS Anda:
```bash
npx tsx src/db/migrate.ts
```

---

## 🛠️ Stack Teknologi Terapan
- **Frontend / Admin**: HTML, CSS, TypeScript, Vite, Leaflet.js, Turf.js
- **Backend API**: Node.js, Express.js, TypeScript
- **Database**: PostgreSQL dengan ekstensi PostGIS
- **ORM / Migrations**: Drizzle ORM
- **Ekspor Dokumen**: dom-to-image-more (PNG), native stringification (CSV)
