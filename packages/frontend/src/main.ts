import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "./style.css";
import { createStore } from "./state/store";
import { filterByType, searchByName, findNearestFacilities } from "./analysis/query";
import {
  computeBufferZones,
  computeCoverageStats,
  computeUnionBuffer,
  validateBufferRadius,
} from "./analysis/coverage";
import { exportBufferAnalysisCSV, exportNearestCSV, exportCoverageCSV } from "./export/csvExport";
import { exportMapAsPNG } from "./export/pngExport";

const app = document.getElementById("app");

if (!app) {
  throw new Error("App container not found");
}

app.innerHTML = `
  <div class="app-shell">
    <header class="topbar">
      <div class="brand">
        <div>
          <p class="eyebrow">WebGIS</p>
          <h1>Faskes Bandar Lampung</h1>
        </div>
      </div>
      <div class="topbar-right">
        <div class="status" id="status">Memuat data...</div>
        <button class="btn-icon" id="btn-toggle-panel" title="Toggle Panel" aria-label="Toggle Panel">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
      </div>
    </header>
    <main class="layout">
      <aside class="panel" id="panel">
        <section>
          <h2>Filter dan Pencarian</h2>
          <label class="field">
            <span>Jenis faskes</span>
            <select id="filter-type"></select>
          </label>
          <label class="field">
            <span>Nama faskes</span>
            <input id="search-input" type="text" placeholder="Cari nama faskes" />
          </label>
          <div class="results" id="search-results"></div>
        </section>
        <section>
          <h2>Analisis Buffer</h2>
          <label class="field">
            <span>Radius (meter)</span>
            <input id="buffer-radius" type="number" min="100" max="5000" value="1000" />
          </label>
          <button class="primary" id="toggle-buffer">Aktifkan Buffer</button>
          <div class="hint" id="buffer-hint"></div>
        </section>
        <section>
          <h2>Analisis Titik Terdekat</h2>
          <p class="hint">Klik peta untuk menentukan titik analisis.</p>
          <ol class="nearest" id="nearest-list"></ol>
        </section>
        <section>
          <h2>Statistik Cakupan</h2>
          <div class="stats" id="coverage-stats">
            <div>
              <span>Area terlayani</span>
              <strong>-</strong>
            </div>
            <div>
              <span>Area tidak terlayani</span>
              <strong>-</strong>
            </div>
            <div>
              <span>Persentase cakupan</span>
              <strong>-</strong>
            </div>
          </div>
        </section>
        <section>
          <h2>Ekspor</h2>
          <div class="export-buttons">
            <button class="btn-export" id="btn-export-png">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              Ekspor Peta (PNG)
            </button>
            <button class="btn-export" id="btn-export-csv-buffer" disabled>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              Ekspor Buffer (CSV)
            </button>
            <button class="btn-export" id="btn-export-csv-nearest" disabled>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              Ekspor Terdekat (CSV)
            </button>
            <button class="btn-export" id="btn-export-csv-coverage" disabled>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              Ekspor Cakupan (CSV)
            </button>
          </div>
        </section>
      </aside>
      <section class="map-area">
        <div id="map"></div>
        <button id="btn-locate" class="btn-locate" title="Lokasi Saya" aria-label="Temukan Lokasi Saya">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"></polygon></svg>
        </button>
        <div class="map-legend">
          <span>Legenda</span>
          <div class="legend-list" id="legend-list"></div>
        </div>
      </section>
    </main>
  </div>
`;

const filterSelect = document.getElementById("filter-type") as HTMLSelectElement;
const searchInput = document.getElementById("search-input") as HTMLInputElement;
const searchResults = document.getElementById("search-results") as HTMLDivElement;
const bufferInput = document.getElementById("buffer-radius") as HTMLInputElement;
const bufferToggle = document.getElementById("toggle-buffer") as HTMLButtonElement;
const bufferHint = document.getElementById("buffer-hint") as HTMLDivElement;
const statusEl = document.getElementById("status") as HTMLDivElement;
const nearestList = document.getElementById("nearest-list") as HTMLOListElement;
const coverageStats = document.getElementById("coverage-stats") as HTMLDivElement;
const legendList = document.getElementById("legend-list") as HTMLDivElement;
const btnLocate = document.getElementById("btn-locate") as HTMLButtonElement;
const btnTogglePanel = document.getElementById("btn-toggle-panel") as HTMLButtonElement;
const btnExportPng = document.getElementById("btn-export-png") as HTMLButtonElement;
const btnExportCsvBuffer = document.getElementById("btn-export-csv-buffer") as HTMLButtonElement;
const btnExportCsvNearest = document.getElementById("btn-export-csv-nearest") as HTMLButtonElement;
const btnExportCsvCoverage = document.getElementById("btn-export-csv-coverage") as HTMLButtonElement;

const map = L.map("map", { zoomControl: false }).setView([-5.4, 105.26], 12);
L.control.zoom({ position: "topright" }).addTo(map);

const baseLayers = {
  "Peta Terang (Positron)": L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 20
  }),
  "Peta Dasar (Voyager)": L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 20
  }),
  "Peta Gelap (Dark Matter)": L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 20
  }),
  "Satelit (Citra ESRI)": L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
    attribution: '&copy; Esri',
    maxZoom: 20
  })
};

baseLayers["Peta Terang (Positron)"].addTo(map);

const layers = {
  faskes: L.layerGroup().addTo(map),
  buffers: L.layerGroup().addTo(map),
  boundaries: L.layerGroup().addTo(map),
  labels: L.layerGroup().addTo(map),
  analysis: L.layerGroup().addTo(map),
  userLocation: L.layerGroup().addTo(map),
};

const overlays = {
  "Batas Wilayah": layers.boundaries,
  "Label Wilayah": layers.labels,
  "Fasilitas Kesehatan": layers.faskes,
  "Area Buffer": layers.buffers,
};

L.control.layers(baseLayers, overlays, { position: "topright", collapsed: true }).addTo(map);

const store = createStore();

const typeColors = new Map<string, string>();
const palette = ["#e07a3f", "#2d8f7e", "#cf3b2b", "#3f6fd8", "#f2b705"];

function getTypeColor(type: string): string {
  if (!typeColors.has(type)) {
    const color = palette[typeColors.size % palette.length];
    typeColors.set(type, color);
  }
  return typeColors.get(type) ?? palette[0];
}

function createMarkerIcon(type: string) {
  const color = getTypeColor(type);
  return L.divIcon({
    className: "marker-dot",
    html: `<span style="--marker-color:${color}"></span>`,
  });
}

function renderLegend(types: string[]) {
  legendList.innerHTML = "";
  types.forEach((type) => {
    const item = document.createElement("div");
    item.className = "legend-item";
    item.innerHTML = `<span class="legend-swatch" style="--marker-color:${getTypeColor(
      type
    )}"></span><span>${type}</span>`;
    legendList.appendChild(item);
  });
}

const markerMap = new Map<string, L.Marker>();

function renderFaskesMarkers() {
  layers.faskes.clearLayers();
  const { filteredFaskes } = store.getState();

  filteredFaskes.forEach((feature) => {
    const marker = L.marker(
      [feature.geometry.coordinates[1], feature.geometry.coordinates[0]],
      { icon: createMarkerIcon(feature.properties.jenis) }
    );

    const lat = feature.geometry.coordinates[1];
    const lon = feature.geometry.coordinates[0];
    const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;

    marker.bindPopup(
      `<div style="display:flex;flex-direction:column;gap:6px;font-size:13px;">` +
      `<div><strong style="font-size:15px;">${feature.properties.nama}</strong><br />` +
      `<span style="color:var(--text-muted);font-weight:600;">${feature.properties.jenis}</span><br />` +
      `${feature.properties.alamat || "Alamat tidak tersedia"}<br />` +
      `<span style="font-size:11px;color:var(--text-muted);">Kec. ${feature.properties.kecamatan || "-"}, Kel. ${feature.properties.kelurahan || "-"}</span></div>` +
      `<a href="${gmapsUrl}" target="_blank" rel="noopener noreferrer" class="btn-nav" title="Buka di Google Maps" style="margin-top:4px;align-self:flex-start;">` +
      `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"></polygon></svg>` +
      `Navigasi</a></div>`
    );

    marker.on('mouseover', function (e) {
      this.openPopup();
    });
    
    marker.on('mouseout', function (e) {
      this.closePopup();
    });

    marker.addTo(layers.faskes);
    markerMap.set(feature.properties.id, marker);
  });
}

function renderBoundaries() {
  layers.boundaries.clearLayers();
  layers.labels.clearLayers();
  const { boundaries } = store.getState();
  if (!boundaries.length) {
    return;
  }

  L.geoJSON(boundaries as any, {
    style: {
      color: "#0284c7", // Deep primary blue
      weight: 1.5,
      fillOpacity: 0.1,
      fillColor: "#0ea5e9", // Bright primary
    },
    onEachFeature: (feature, layer) => {
      const name = (feature.properties as any)?.nama ?? "Boundary";
      layer.bindPopup(`<strong>${name}</strong>`);

      // Add label at centroid
      if (layer instanceof L.Polygon) {
        const center = (layer as any).getBounds().getCenter();
        const label = L.marker(center, {
          icon: L.divIcon({
            className: "boundary-label",
            html: `<span>${name}</span>`,
            iconSize: [120, 20],
            iconAnchor: [60, 10],
          }),
          interactive: false,
        });
        label.addTo(layers.labels);
      }
    },
  }).addTo(layers.boundaries);
}

// Track latest coverage stats for export
let lastCoverageStats: { nama_wilayah: string; coveredKm2: number; uncoveredKm2: number; percentageCovered: number }[] | null = null;

function renderBuffers() {
  layers.buffers.clearLayers();
  const { bufferActive, bufferRadius, filteredFaskes, boundaries } = store.getState();
  lastCoverageStats = null;
  btnExportCsvBuffer.disabled = true;
  btnExportCsvCoverage.disabled = true;

  if (!bufferActive) {
    return;
  }

  const zones = computeBufferZones(filteredFaskes, bufferRadius);
  zones.forEach((zone) => {
    L.geoJSON(zone as any, {
      style: {
        color: "#f59e0b",
        fillColor: "#fbbf24",
        fillOpacity: 0.2,
        weight: 1.5,
      },
    }).addTo(layers.buffers);
  });

  btnExportCsvBuffer.disabled = false;

  const union = computeUnionBuffer(zones as any);
  if (union && boundaries.length > 0) {
    let totalCovered = 0;
    let totalUncovered = 0;
    lastCoverageStats = [];

    boundaries.forEach(b => {
      const stats = computeCoverageStats(b, union);
      totalCovered += stats.coveredKm2;
      totalUncovered += stats.uncoveredKm2;
      lastCoverageStats!.push({
        nama_wilayah: b.properties.nama,
        coveredKm2: stats.coveredKm2,
        uncoveredKm2: stats.uncoveredKm2,
        percentageCovered: stats.percentageCovered
      });
    });

    const totalArea = totalCovered + totalUncovered;
    const totalPercentage = totalArea > 0 ? (totalCovered / totalArea) * 100 : 0;
    
    updateCoverageStats(totalCovered, totalUncovered, totalPercentage);
    btnExportCsvCoverage.disabled = false;
  }
}

function renderAnalysisPoint() {
  layers.analysis.clearLayers();
  const { analysisPoint, nearestFacilities } = store.getState();
  if (!analysisPoint) {
    nearestList.innerHTML = "";
    btnExportCsvNearest.disabled = true;
    return;
  }

  L.circleMarker([analysisPoint[1], analysisPoint[0]], {
    radius: 7,
    color: "#fff",
    fillColor: "#10b981",
    fillOpacity: 1,
    weight: 2,
    className: "pulse-marker"
  }).addTo(layers.analysis);

  nearestList.innerHTML = "";
  nearestFacilities.forEach((item) => {
    const [lon, lat] = item.feature.geometry.coordinates;
    L.polyline(
      [
        [analysisPoint[1], analysisPoint[0]],
        [lat, lon],
      ],
      { color: "#059669", weight: 2, opacity: 0.7, dashArray: "4, 6" }
    ).addTo(layers.analysis);

    const li = document.createElement("li");
    const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
    
    li.innerHTML = `
      <div class="nearest-info" style="cursor:pointer;" title="Pusatkan peta ke faskes ini">
        <strong>${item.feature.properties.nama}</strong>
        <span>${item.feature.properties.jenis} • ${item.distanceKm.toFixed(2)} km</span>
      </div>
      <a href="${gmapsUrl}" target="_blank" rel="noopener noreferrer" class="btn-nav" title="Buka di Google Maps">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"></polygon></svg>
        Navigasi
      </a>
    `;
    
    const infoDiv = li.querySelector(".nearest-info");
    infoDiv?.addEventListener("click", () => {
      map.setView([lat, lon], 16);
      const marker = markerMap.get(item.feature.properties.id);
      if (marker) {
        marker.openPopup();
      }
    });

    nearestList.appendChild(li);
  });

  btnExportCsvNearest.disabled = nearestFacilities.length === 0;
}

function updateCoverageStats(covered: number, uncovered: number, percentage: number) {
  const blocks = coverageStats.querySelectorAll("strong");
  blocks[0].textContent = `${covered.toFixed(2)} km²`;
  blocks[1].textContent = `${uncovered.toFixed(2)} km²`;
  blocks[2].textContent = `${percentage.toFixed(1)}%`;
}

function resetCoverageStats() {
  coverageStats.querySelectorAll("strong").forEach((el) => {
    el.textContent = "-";
  });
}

function applyFilters() {
  const state = store.getState();
  const filtered = searchByName(filterByType(state.faskes, state.activeFilter), state.searchQuery);
  store.setState({ filteredFaskes: filtered });
}

function updateStatus() {
  const { loading, errors, filteredFaskes } = store.getState();
  if (loading) {
    statusEl.textContent = "Memuat data...";
    statusEl.className = "status";
    return;
  }
  if (errors.length > 0) {
    statusEl.textContent = errors[0].message;
    statusEl.className = "status error";
    return;
  }
  statusEl.textContent = `Menampilkan ${filteredFaskes.length} faskes`;
  statusEl.className = "status";
}

// ── Event Listeners ────────────────────────────────────────────
filterSelect.addEventListener("change", () => {
  store.setState({ activeFilter: filterSelect.value });
  applyFilters();
});

searchInput.addEventListener("input", () => {
  store.setState({ searchQuery: searchInput.value });
  applyFilters();
  renderSearchResults();
});

bufferToggle.addEventListener("click", () => {
  const parsed = Number(bufferInput.value);
  const validation = validateBufferRadius(parsed);
  if (!validation.valid) {
    bufferHint.textContent = validation.error ?? "Radius tidak valid.";
    return;
  }
  bufferHint.textContent = "";
  const next = !store.getState().bufferActive;
  store.setState({ bufferActive: next, bufferRadius: parsed });
  bufferToggle.textContent = next ? "Matikan Buffer" : "Aktifkan Buffer";
  if (!next) {
    resetCoverageStats();
  }
  renderBuffers();
});

map.on("click", (event) => {
  const point: [number, number] = [event.latlng.lng, event.latlng.lat];
  const nearest = findNearestFacilities(store.getState().faskes, point, 5);
  store.setState({ analysisPoint: point, nearestFacilities: nearest });
  renderAnalysisPoint();
});

btnLocate.addEventListener("click", () => {
  btnLocate.classList.add("loading");
  map.locate({ setView: true, maxZoom: 16 });
});

map.on("locationfound", (e) => {
  btnLocate.classList.remove("loading");
  layers.userLocation.clearLayers();
  
  const radius = e.accuracy;
  L.circle(e.latlng, {
    radius: radius,
    color: "#3f6fd8",
    fillColor: "#3f6fd8",
    fillOpacity: 0.15,
    weight: 2
  }).addTo(layers.userLocation);

  L.circleMarker(e.latlng, {
    radius: 8,
    fillColor: "#3f6fd8",
    color: "#fff",
    weight: 3,
    fillOpacity: 1
  }).addTo(layers.userLocation)
    .bindPopup("Lokasi Anda saat ini").openPopup();
});

map.on("locationerror", () => {
  btnLocate.classList.remove("loading");
  alert("Tidak dapat mengakses lokasi Anda. Pastikan GPS aktif dan Anda telah memberikan izin di browser.");
});

// Mobile panel toggle
btnTogglePanel.addEventListener("click", () => {
  const panel = document.getElementById("panel");
  panel?.classList.toggle("panel-open");
});

// ── Export Handlers ─────────────────────────────────────────────
btnExportPng.addEventListener("click", () => {
  const mapEl = document.getElementById("map");
  if (mapEl) exportMapAsPNG(mapEl);
});

btnExportCsvBuffer.addEventListener("click", () => {
  const { filteredFaskes, bufferRadius } = store.getState();
  const rows = filteredFaskes.map((f) => ({
    id: f.properties.id,
    nama: f.properties.nama,
    jenis: f.properties.jenis,
    alamat: f.properties.alamat,
    kecamatan: f.properties.kecamatan,
    lat: f.geometry.coordinates[1],
    lon: f.geometry.coordinates[0],
  }));
  exportBufferAnalysisCSV(rows, bufferRadius);
});

btnExportCsvNearest.addEventListener("click", () => {
  const { nearestFacilities, analysisPoint } = store.getState();
  if (!analysisPoint) return;
  const rows = nearestFacilities.map((item, i) => ({
    rank: i + 1,
    nama: item.feature.properties.nama,
    jenis: item.feature.properties.jenis,
    alamat: item.feature.properties.alamat,
    kecamatan: item.feature.properties.kecamatan,
    lat: item.feature.geometry.coordinates[1],
    lon: item.feature.geometry.coordinates[0],
    jarak_km: item.distanceKm,
    titik_analisis_lat: analysisPoint[1],
    titik_analisis_lon: analysisPoint[0],
  }));
  exportNearestCSV(rows);
});

btnExportCsvCoverage.addEventListener("click", () => {
  const { boundaries, bufferRadius } = store.getState();
  if (!lastCoverageStats || lastCoverageStats.length === 0) return;
  
  const rows = lastCoverageStats.map(stat => {
    const totalKm2 = stat.coveredKm2 + stat.uncoveredKm2;
    return {
      nama_wilayah: stat.nama_wilayah,
      total_area_km2: totalKm2,
      area_terlayani_km2: stat.coveredKm2,
      area_tidak_terlayani_km2: stat.uncoveredKm2,
      persentase_cakupan: stat.percentageCovered,
      buffer_radius_m: bufferRadius,
    };
  });
  
  exportCoverageCSV(rows);
});

// ── Search Results ──────────────────────────────────────────────
function renderSearchResults() {
  const { faskes, searchQuery } = store.getState();
  const results = searchByName(faskes, searchQuery).slice(0, 6);
  searchResults.innerHTML = "";
  results.forEach((feature) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "result-item";
    item.innerHTML = `<strong>${feature.properties.nama}</strong><span>${feature.properties.jenis}</span>`;
    item.addEventListener("click", () => {
      map.setView(
        [feature.geometry.coordinates[1], feature.geometry.coordinates[0]],
        16
      );
      const marker = markerMap.get(feature.properties.id);
      if (marker) {
        marker.openPopup();
      }
    });
    searchResults.appendChild(item);
  });
}

// ── Store Subscription ──────────────────────────────────────────
store.subscribe(() => {
  updateStatus();
  renderFaskesMarkers();
  renderBuffers();
  renderAnalysisPoint();
});

store.initializeData().then(() => {
  const state = store.getState();
  const types = Array.from(new Set(state.faskes.map((item) => item.properties.jenis))).sort();
  filterSelect.innerHTML = `<option value="all">Semua</option>`;
  types.forEach((type) => {
    const option = document.createElement("option");
    option.value = type;
    option.textContent = type;
    filterSelect.appendChild(option);
  });
  renderLegend(types);
  renderBoundaries();
  renderFaskesMarkers();
  updateStatus();
});
