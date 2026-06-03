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

Jalankan perintah ini dari *root folder* untuk membuat tabel dan skema PostGIS:
```bash
cd packages/server
npx tsx src/db/migrate.ts
```

**PENTING: Import Data Awal (CSV)**
Agar peta tidak kosong, jalankan ketiga perintah berikut secara berurutan untuk memasukkan data Faskes dan membangun area Poligon Batas Wilayah:

1. Import data Faskes:
   ```bash
   npm run import:faskes -- "data/faskes_bandar_lampung_all.csv"
   ```
2. Import titik tengah (centroid) wilayah:
   ```bash
   npm run import:boundary-centroids -- "data/BatasWilayah_Kecamatan_BandarLampung.csv"
   ```
3. Generate Poligon wilayah dari titik-titik centroid menggunakan PostGIS Voronoi:
   ```bash
   npx tsx src/scripts/generateBoundaries.ts
   ```

Buat kredensial admin awal:
```bash
npx tsx seedAdmin.ts
```
*(Default: Username `admin` & Password `password123`)*

### 3) Menjalankan Mode Development (Semua Lapis)

Anda hanya cukup menjalankan 1 baris perintah berikut dari direktori **root** (pastikan sudah `npm install` sebelumnya):
```bash
npm run dev:all
```
Perintah ini akan secara ajaib menjalankan *Server Express* di port 3000, lalu mem-proxy UI dari Frontend dan Admin Panel Vite.

### 4) Akses Web
- **Halaman Publik / Analisis GIS**: `http://localhost:3000/`
- **Dashboard Admin**: `http://localhost:3000/admin/`

---

## 🛠️ Stack Teknologi Terapan
- **Frontend / Admin**: HTML, CSS, TypeScript, Vite, Leaflet.js, Turf.js
- **Backend API**: Node.js, Express.js, TypeScript
- **Database**: PostgreSQL dengan ekstensi PostGIS
- **ORM / Migrations**: Drizzle ORM
- **Ekspor Dokumen**: dom-to-image-more (PNG), native stringification (CSV)
