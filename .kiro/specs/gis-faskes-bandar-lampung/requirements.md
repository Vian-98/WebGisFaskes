# Requirements Document

## Introduction

Website GIS Analisis Jangkauan Fasilitas Kesehatan (Faskes) Bandar Lampung adalah sistem berbasis web yang memungkinkan pengguna untuk menganalisis aksesibilitas dan jangkauan fasilitas kesehatan di wilayah Bandar Lampung. Sistem ini memanfaatkan data faskes dan batas wilayah administrasi yang disimpan di database PostgreSQL dengan ekstensi PostGIS untuk memberikan visualisasi geografis dan analisis jangkauan layanan kesehatan. Sistem terdiri dari tiga bagian utama: frontend (antarmuka peta interaktif), backend API (server yang melayani data ke frontend), dan admin panel (halaman manajemen data untuk administrator).

## Glossary

- **GIS_System**: Sistem website GIS untuk analisis jangkauan faskes secara keseluruhan
- **Map_Viewer**: Komponen frontend yang menampilkan peta interaktif
- **Faskes**: Fasilitas Kesehatan (rumah sakit, puskesmas, klinik, apotek, praktek dokter, dll.)
- **Faskes_Dataset**: Kumpulan data fasilitas kesehatan yang disimpan di database
- **Boundary_Dataset**: Kumpulan data batas wilayah administrasi Bandar Lampung yang disimpan di database
- **Coverage_Analyzer**: Komponen frontend yang melakukan analisis jangkauan/aksesibilitas
- **Buffer_Zone**: Area jangkauan di sekitar faskes berdasarkan jarak tertentu
- **User**: Pengguna umum sistem (analis, petugas kesehatan, atau masyarakat)
- **Admin**: Administrator sistem yang berwenang mengelola data faskes dan batas wilayah
- **API_Server**: Server backend yang menyediakan REST API untuk data faskes dan batas wilayah
- **Admin_Panel**: Antarmuka web khusus administrator untuk mengelola data faskes dan batas wilayah
- **Auth_Service**: Komponen yang menangani autentikasi dan otorisasi administrator
- **DB**: Database PostgreSQL dengan ekstensi PostGIS yang menyimpan data spasial

## Requirements

### Requirement 1: Menampilkan Peta Interaktif

**User Story:** Sebagai User, saya ingin melihat peta Bandar Lampung yang interaktif, sehingga saya dapat memahami konteks geografis wilayah.

#### Acceptance Criteria

1. THE Map_Viewer SHALL menampilkan peta dasar Bandar Lampung
2. THE Map_Viewer SHALL mendukung operasi zoom in dan zoom out
3. THE Map_Viewer SHALL mendukung operasi pan untuk menggeser tampilan peta
4. WHEN User melakukan zoom, THE Map_Viewer SHALL memperbarui tampilan peta dalam waktu 500ms
5. THE Map_Viewer SHALL menampilkan kontrol navigasi peta

### Requirement 2: Menampilkan Data Fasilitas Kesehatan

**User Story:** Sebagai User, saya ingin melihat lokasi semua faskes di peta, sehingga saya dapat mengetahui sebaran faskes di Bandar Lampung.

#### Acceptance Criteria

1. WHEN peta dimuat, THE GIS_System SHALL memuat Faskes_Dataset dari API_Server
2. THE GIS_System SHALL menampilkan setiap faskes sebagai marker di peta
3. WHEN User mengklik marker faskes, THE GIS_System SHALL menampilkan informasi detail faskes tersebut
4. THE GIS_System SHALL menampilkan minimal nama, jenis, dan alamat faskes pada popup informasi
5. THE GIS_System SHALL membedakan jenis faskes menggunakan simbol atau warna yang berbeda

### Requirement 3: Menampilkan Batas Wilayah Administrasi

**User Story:** Sebagai User, saya ingin melihat batas wilayah administrasi di Bandar Lampung, sehingga saya dapat memahami pembagian wilayah.

#### Acceptance Criteria

1. WHEN peta dimuat, THE GIS_System SHALL memuat Boundary_Dataset dari API_Server
2. THE GIS_System SHALL menampilkan batas wilayah administrasi sebagai polygon di peta
3. THE GIS_System SHALL menampilkan label nama wilayah pada setiap polygon
4. WHEN User mengklik polygon wilayah, THE GIS_System SHALL menampilkan informasi wilayah tersebut
5. THE GIS_System SHALL menggunakan transparansi pada polygon sehingga peta dasar tetap terlihat

### Requirement 4: Analisis Jangkauan Buffer

**User Story:** Sebagai User, saya ingin menganalisis jangkauan faskes berdasarkan radius tertentu, sehingga saya dapat melihat area yang terlayani.

#### Acceptance Criteria

1. THE GIS_System SHALL menyediakan kontrol untuk memasukkan nilai radius buffer dalam satuan meter
2. WHEN User memasukkan nilai radius, THE GIS_System SHALL memvalidasi bahwa nilai berada dalam rentang 100 hingga 5000 meter
3. WHEN User mengaktifkan analisis buffer, THE Coverage_Analyzer SHALL membuat Buffer_Zone di sekitar setiap faskes
4. THE GIS_System SHALL menampilkan Buffer_Zone sebagai lingkaran atau polygon di peta
5. THE GIS_System SHALL menggunakan warna dan transparansi yang memungkinkan identifikasi overlap antar Buffer_Zone
6. THE Coverage_Analyzer SHALL menghitung hasil buffer dalam waktu maksimal 3000ms untuk dataset dengan maksimal 500 faskes

### Requirement 5: Identifikasi Area Tidak Terlayani

**User Story:** Sebagai User, saya ingin mengidentifikasi area yang tidak terjangkau oleh faskes, sehingga saya dapat menemukan gap layanan kesehatan.

#### Acceptance Criteria

1. WHEN analisis buffer aktif, THE Coverage_Analyzer SHALL mengidentifikasi area di dalam batas wilayah yang tidak tercakup oleh Buffer_Zone
2. THE GIS_System SHALL menampilkan area tidak terlayani dengan warna yang berbeda dari Buffer_Zone
3. THE Coverage_Analyzer SHALL menghitung persentase area terlayani terhadap total area wilayah
4. THE GIS_System SHALL menampilkan statistik area terlayani dan tidak terlayani dalam satuan kilometer persegi
5. THE GIS_System SHALL menampilkan persentase cakupan layanan untuk setiap wilayah administrasi

### Requirement 6: Filter dan Pencarian Fasilitas Kesehatan

**User Story:** Sebagai User, saya ingin melakukan filter dan pencarian faskes, sehingga saya dapat fokus pada jenis faskes tertentu.

#### Acceptance Criteria

1. THE GIS_System SHALL menyediakan kontrol filter berdasarkan jenis faskes
2. WHEN User memilih filter jenis faskes, THE GIS_System SHALL menampilkan hanya faskes yang sesuai dengan filter
3. THE GIS_System SHALL menyediakan kotak pencarian untuk mencari faskes berdasarkan nama
4. WHEN User memasukkan kata kunci pencarian, THE GIS_System SHALL menampilkan daftar faskes yang namanya mengandung kata kunci tersebut
5. WHEN User memilih hasil pencarian, THE Map_Viewer SHALL memusatkan peta pada lokasi faskes tersebut dan menampilkan informasi detail
6. THE GIS_System SHALL memperbarui hasil filter dan pencarian dalam waktu maksimal 500ms

### Requirement 7: Analisis Aksesibilitas Berbasis Jarak

**User Story:** Sebagai User, saya ingin mengetahui faskes terdekat dari suatu lokasi, sehingga saya dapat menemukan layanan kesehatan yang paling mudah diakses.

#### Acceptance Criteria

1. THE GIS_System SHALL menyediakan fitur untuk menentukan lokasi titik analisis pada peta melalui klik
2. WHEN User menentukan titik analisis, THE Coverage_Analyzer SHALL menghitung jarak garis lurus dari titik tersebut ke setiap faskes
3. THE Coverage_Analyzer SHALL mengurutkan faskes berdasarkan jarak dari terdekat ke terjauh
4. THE GIS_System SHALL menampilkan daftar minimal 5 faskes terdekat dengan informasi nama, jenis, dan jarak
5. THE GIS_System SHALL menampilkan garis atau visual penghubung dari titik analisis ke faskes terdekat di peta
6. THE Coverage_Analyzer SHALL menghitung jarak dalam waktu maksimal 1000ms untuk dataset dengan maksimal 500 faskes

### Requirement 8: Ekspor Hasil Analisis

**User Story:** Sebagai User, saya ingin mengekspor hasil analisis, sehingga saya dapat menggunakan hasil tersebut untuk pelaporan atau analisis lanjutan.

#### Acceptance Criteria

1. THE GIS_System SHALL menyediakan tombol ekspor untuk hasil analisis
2. WHEN User mengklik tombol ekspor, THE GIS_System SHALL menyediakan pilihan format ekspor minimal PNG untuk peta dan CSV untuk data tabular
3. WHEN User memilih ekspor peta sebagai PNG, THE GIS_System SHALL menghasilkan gambar peta dengan resolusi minimal 1920x1080 pixel
4. WHEN User memilih ekspor data sebagai CSV, THE GIS_System SHALL menghasilkan file CSV yang berisi hasil analisis dengan struktur kolom yang jelas
5. THE GIS_System SHALL menyertakan metadata seperti tanggal ekspor dan parameter analisis pada hasil ekspor
6. THE GIS_System SHALL menghasilkan file ekspor dalam waktu maksimal 5000ms

### Requirement 9: Mengambil dan Memvalidasi Data dari API

**User Story:** Sebagai Developer, saya ingin sistem mengambil dan memvalidasi data faskes dan batas wilayah dari API_Server, sehingga data yang ditampilkan selalu valid, konsisten, dan berasal dari sumber tunggal (DB).

#### Acceptance Criteria

1. WHEN sistem diinisialisasi, THE GIS_System SHALL mengambil Faskes_Dataset dan Boundary_Dataset melalui endpoint REST API yang disediakan oleh API_Server
2. THE GIS_System SHALL memvalidasi bahwa setiap record faskes yang diterima memiliki koordinat latitude dan longitude yang valid
3. THE GIS_System SHALL memvalidasi bahwa koordinat faskes berada dalam rentang geografis Bandar Lampung
4. THE GIS_System SHALL memvalidasi bahwa setiap record Boundary_Dataset memiliki struktur polygon yang valid
5. IF data yang diterima dari API_Server tidak valid, THEN THE GIS_System SHALL menampilkan pesan error yang deskriptif dan tidak memuat data yang tidak valid
6. THE GIS_System SHALL mencatat log validasi untuk setiap proses pemuatan data dari API_Server
7. WHEN API_Server tidak dapat dijangkau, THE GIS_System SHALL menampilkan pesan error "Data tidak dapat dimuat. Periksa koneksi atau coba lagi nanti." dan menghentikan proses inisialisasi data

### Requirement 10: Responsive Design untuk Berbagai Perangkat

**User Story:** Sebagai User, saya ingin mengakses website dari berbagai perangkat, sehingga saya dapat melakukan analisis di desktop maupun mobile.

#### Acceptance Criteria

1. THE GIS_System SHALL menampilkan antarmuka yang responsif untuk ukuran layar desktop, tablet, dan mobile
2. WHEN diakses dari perangkat mobile, THE GIS_System SHALL menyesuaikan layout kontrol dan panel informasi agar tetap mudah digunakan
3. THE Map_Viewer SHALL mempertahankan fungsi navigasi peta pada perangkat touch screen
4. WHEN ukuran layar berubah, THE GIS_System SHALL menyesuaikan tampilan dalam waktu maksimal 500ms
5. THE GIS_System SHALL memastikan semua fitur utama tetap dapat diakses pada layar dengan lebar minimal 360 pixel

### Requirement 11: REST API untuk Data Faskes dan Batas Wilayah

**User Story:** Sebagai Developer, saya ingin API_Server menyediakan endpoint REST yang konsisten, sehingga frontend dan layanan lain dapat mengambil data faskes dan batas wilayah secara terprogram.

#### Acceptance Criteria

1. THE API_Server SHALL menyediakan endpoint `GET /api/faskes` yang mengembalikan seluruh Faskes_Dataset dalam format GeoJSON FeatureCollection
2. THE API_Server SHALL menyediakan endpoint `GET /api/faskes/:id` yang mengembalikan satu record faskes berdasarkan ID dalam format GeoJSON Feature
3. THE API_Server SHALL menyediakan endpoint `GET /api/boundaries` yang mengembalikan seluruh Boundary_Dataset dalam format GeoJSON FeatureCollection
4. THE API_Server SHALL menyediakan endpoint `GET /api/boundaries/:id` yang mengembalikan satu record boundary berdasarkan ID dalam format GeoJSON Feature
5. WHEN endpoint dipanggil dengan ID yang tidak ditemukan di DB, THE API_Server SHALL mengembalikan HTTP status 404 beserta pesan error yang deskriptif
6. WHEN DB tidak dapat dijangkau, THE API_Server SHALL mengembalikan HTTP status 503 beserta pesan error "Layanan tidak tersedia sementara."
7. THE API_Server SHALL mengembalikan response dengan header `Content-Type: application/json` pada semua endpoint
8. THE API_Server SHALL mengembalikan response dari endpoint publik (`GET /api/faskes`, `GET /api/boundaries`) dalam waktu maksimal 2000ms untuk dataset dengan maksimal 1000 record

### Requirement 12: Autentikasi Administrator

**User Story:** Sebagai Admin, saya ingin login ke Admin_Panel menggunakan kredensial yang valid, sehingga hanya administrator yang berwenang yang dapat mengelola data.

#### Acceptance Criteria

1. THE Admin_Panel SHALL menyediakan halaman login dengan form yang meminta username dan password
2. WHEN Admin memasukkan username dan password yang valid, THE Auth_Service SHALL membuat sesi autentikasi dan mengarahkan Admin ke halaman utama Admin_Panel
3. WHEN Admin memasukkan username atau password yang tidak valid, THE Auth_Service SHALL menampilkan pesan "Username atau password salah." tanpa mengungkap informasi spesifik tentang field mana yang salah
4. WHILE Admin belum terautentikasi, THE Admin_Panel SHALL menolak akses ke semua halaman manajemen data dan mengarahkan Admin ke halaman login
5. THE Auth_Service SHALL membatasi percobaan login maksimal 5 kali dalam 15 menit dari satu alamat IP; IF batas terlampaui, THEN THE Auth_Service SHALL menolak permintaan login selanjutnya selama 15 menit
6. WHEN Admin mengklik tombol logout, THE Auth_Service SHALL mengakhiri sesi autentikasi dan mengarahkan Admin ke halaman login
7. THE Auth_Service SHALL menyimpan password Admin dalam bentuk hash menggunakan algoritma bcrypt dengan cost factor minimal 10
8. WHEN sesi autentikasi Admin telah aktif selama lebih dari 8 jam tanpa aktivitas, THE Auth_Service SHALL mengakhiri sesi tersebut secara otomatis

### Requirement 13: CRUD Fasilitas Kesehatan di Admin Panel

**User Story:** Sebagai Admin, saya ingin dapat menambah, melihat, mengedit, dan menghapus data faskes melalui Admin_Panel, sehingga data faskes di DB selalu akurat dan terkini.

#### Acceptance Criteria

1. WHILE Admin terautentikasi, THE Admin_Panel SHALL menampilkan daftar seluruh faskes dari DB dalam format tabel yang dapat diurutkan dan dicari
2. WHEN Admin mengklik tombol "Tambah Faskes", THE Admin_Panel SHALL menampilkan form dengan field: nama, jenis, alamat, kecamatan, kelurahan, latitude, dan longitude
3. WHEN Admin mengisi form tambah faskes dan mengklik simpan, THE API_Server SHALL memvalidasi semua field wajib terisi dan koordinat berada dalam rentang geografis Bandar Lampung, lalu menyimpan record baru ke DB
4. WHEN Admin mengklik tombol "Edit" pada baris faskes tertentu, THE Admin_Panel SHALL menampilkan form yang terisi dengan data faskes tersebut untuk diperbarui
5. WHEN Admin mengubah data faskes dan mengklik simpan, THE API_Server SHALL memvalidasi perubahan dan memperbarui record di DB
6. WHEN Admin mengklik tombol "Hapus" pada baris faskes tertentu, THE Admin_Panel SHALL menampilkan dialog konfirmasi sebelum menghapus
7. WHEN Admin mengkonfirmasi penghapusan, THE API_Server SHALL menghapus record faskes dari DB dan Admin_Panel SHALL memperbarui tampilan daftar
8. IF validasi data faskes gagal saat tambah atau edit, THEN THE Admin_Panel SHALL menampilkan pesan error yang spesifik per field tanpa menutup form
9. THE Admin_Panel SHALL mencerminkan perubahan data (tambah, edit, hapus) ke tampilan daftar tanpa memerlukan reload halaman penuh

### Requirement 14: Manajemen Batas Wilayah di Admin Panel

**User Story:** Sebagai Admin, saya ingin dapat melihat dan memperbarui data batas wilayah melalui Admin_Panel, sehingga data administrasi wilayah di DB tetap akurat.

#### Acceptance Criteria

1. WHILE Admin terautentikasi, THE Admin_Panel SHALL menampilkan daftar seluruh data boundary dari DB beserta informasi nama wilayah dan level administrasi
2. WHEN Admin mengklik tombol "Edit" pada baris boundary tertentu, THE Admin_Panel SHALL menampilkan form yang memungkinkan pembaruan field nama dan level administrasi
3. WHEN Admin menyimpan perubahan boundary, THE API_Server SHALL memvalidasi bahwa nama tidak kosong dan level administrasi merupakan nilai yang valid (`kecamatan` atau `kelurahan`), lalu memperbarui record di DB
4. THE Admin_Panel SHALL menyediakan fitur unggah file GeoJSON untuk mengganti data geometri boundary yang ada; WHEN Admin mengunggah file GeoJSON yang valid, THE API_Server SHALL memperbarui geometri boundary di DB
5. WHEN Admin mengunggah file GeoJSON untuk boundary, THE API_Server SHALL memvalidasi bahwa file tersebut berisi geometry bertipe Polygon atau MultiPolygon dengan ring yang valid (tertutup dan minimal 4 titik)
6. IF file GeoJSON yang diunggah tidak valid, THEN THE Admin_Panel SHALL menampilkan pesan error yang deskriptif dan membatalkan proses pembaruan
7. THE Admin_Panel SHALL menampilkan preview geometri boundary pada peta mini sebelum Admin mengkonfirmasi penyimpanan perubahan geometri

### Requirement 15: Penyimpanan Data Spasial di PostgreSQL/PostGIS

**User Story:** Sebagai Developer, saya ingin data faskes dan batas wilayah disimpan di PostgreSQL dengan ekstensi PostGIS, sehingga data spasial dapat dikelola dan dikueri secara efisien dan konsisten.

#### Acceptance Criteria

1. THE DB SHALL menyimpan setiap record faskes dengan kolom minimal: `id` (UUID), `nama` (teks tidak kosong), `jenis` (teks tidak kosong), `alamat` (teks), `kecamatan` (teks), `kelurahan` (teks), dan `geom` (tipe `geometry(Point, 4326)` PostGIS)
2. THE DB SHALL menyimpan setiap record boundary dengan kolom minimal: `id` (UUID), `nama` (teks tidak kosong), `level` (teks dengan nilai valid `kecamatan` atau `kelurahan`), dan `geom` (tipe `geometry(MultiPolygon, 4326)` PostGIS)
3. THE DB SHALL memberlakukan constraint NOT NULL pada kolom `id`, `nama`, `jenis` (untuk tabel faskes), `level` (untuk tabel boundary), dan `geom` pada kedua tabel
4. THE DB SHALL memiliki indeks spasial (menggunakan GIST) pada kolom `geom` di tabel faskes dan tabel boundary
5. THE API_Server SHALL menggunakan fungsi PostGIS `ST_AsGeoJSON` untuk mengonversi data geometri dari DB ke format GeoJSON sebelum dikirim ke frontend
6. THE API_Server SHALL menggunakan parameterized query atau ORM untuk semua interaksi dengan DB guna mencegah SQL injection
7. WHEN migrasi database dijalankan, THE DB SHALL membuat tabel faskes, tabel boundary, indeks spasial, dan constraint yang diperlukan dalam satu skrip migrasi yang idempoten

## Notes

- Analisis spasial (buffer, coverage, nearest facility) tetap dijalankan di sisi frontend menggunakan Turf.js untuk menjaga performa interaksi; data spasial hanya diambil dari API_Server saat inisialisasi
- Admin_Panel dan frontend publik dapat dikembangkan sebagai bagian dari aplikasi yang sama atau sebagai aplikasi terpisah; autentikasi Admin tidak berlaku untuk User umum
- Analisis buffer menggunakan jarak garis lurus (Euclidean/Haversine distance) sebagai pendekatan awal; routing berbasis jaringan jalan dapat dikembangkan di fase berikutnya
- API_Server harus mendukung CORS untuk memungkinkan frontend mengakses endpoint dari domain yang berbeda selama pengembangan
- Backup dan recovery database berada di luar scope requirements ini, namun harus dipertimbangkan pada fase deployment
