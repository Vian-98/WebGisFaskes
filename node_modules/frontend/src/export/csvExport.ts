/**
 * CSV Export Module
 * Handles serialization of analysis data to CSV format.
 */

function escapeCSV(value: any): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildCSV(headers: string[], rows: any[][]): string {
  const headerLine = headers.map(escapeCSV).join(",");
  const dataLines = rows.map((row) => row.map(escapeCSV).join(","));
  return [headerLine, ...dataLines].join("\n");
}

function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

type FaskesExportRow = {
  id: string;
  nama: string;
  jenis: string;
  alamat: string;
  kecamatan: string;
  lat: number;
  lon: number;
};

type NearestExportRow = {
  rank: number;
  nama: string;
  jenis: string;
  alamat: string;
  kecamatan: string;
  lat: number;
  lon: number;
  jarak_km: number;
  titik_analisis_lat: number;
  titik_analisis_lon: number;
};

type CoverageExportRow = {
  nama_wilayah: string;
  total_area_km2: number;
  area_terlayani_km2: number;
  area_tidak_terlayani_km2: number;
  persentase_cakupan: number;
  buffer_radius_m: number;
};

export function exportBufferAnalysisCSV(
  faskesRows: FaskesExportRow[],
  bufferRadius: number
) {
  const dateStr = new Date().toISOString().split("T")[0];
  const headers = [
    "id",
    "nama",
    "jenis",
    "alamat",
    "kecamatan",
    "lat",
    "lon",
    "buffer_radius_m",
    "tanggal_ekspor",
  ];
  const rows = faskesRows.map((r) => [
    r.id,
    r.nama,
    r.jenis,
    r.alamat,
    r.kecamatan,
    r.lat,
    r.lon,
    bufferRadius,
    dateStr,
  ]);
  const csv = buildCSV(headers, rows);
  downloadCSV(csv, `buffer_analysis_${dateStr}.csv`);
}

export function exportNearestCSV(
  nearestRows: NearestExportRow[]
) {
  const dateStr = new Date().toISOString().split("T")[0];
  const headers = [
    "rank",
    "nama",
    "jenis",
    "alamat",
    "kecamatan",
    "lat",
    "lon",
    "jarak_km",
    "titik_analisis_lat",
    "titik_analisis_lon",
    "tanggal_ekspor",
  ];
  const rows = nearestRows.map((r) => [
    r.rank,
    r.nama,
    r.jenis,
    r.alamat,
    r.kecamatan,
    r.lat,
    r.lon,
    Number(r.jarak_km.toFixed(4)),
    r.titik_analisis_lat,
    r.titik_analisis_lon,
    dateStr,
  ]);
  const csv = buildCSV(headers, rows);
  downloadCSV(csv, `faskes_terdekat_${dateStr}.csv`);
}

export function exportCoverageCSV(
  coverageRows: CoverageExportRow[]
) {
  const dateStr = new Date().toISOString().split("T")[0];
  const headers = [
    "nama_wilayah",
    "total_area_km2",
    "area_terlayani_km2",
    "area_tidak_terlayani_km2",
    "persentase_cakupan",
    "buffer_radius_m",
    "tanggal_ekspor",
  ];
  const rows = coverageRows.map((r) => [
    r.nama_wilayah,
    Number(r.total_area_km2.toFixed(4)),
    Number(r.area_terlayani_km2.toFixed(4)),
    Number(r.area_tidak_terlayani_km2.toFixed(4)),
    Number(r.persentase_cakupan.toFixed(2)),
    r.buffer_radius_m,
    dateStr,
  ]);
  const csv = buildCSV(headers, rows);
  downloadCSV(csv, `statistik_cakupan_${dateStr}.csv`);
}

// Re-export helper for testing
export { escapeCSV, buildCSV };
