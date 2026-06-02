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

const app = document.getElementById("app");

if (!app) {
  throw new Error("App container not found");
}

app.innerHTML = `
  <div class="app-shell">
    <header class="topbar">
      <div class="brand">
        <span class="brand-mark"></span>
        <div>
          <p class="eyebrow">WebGIS</p>
          <h1>Faskes Bandar Lampung</h1>
        </div>
      </div>
      <div class="status" id="status">Memuat data...</div>
    </header>
    <main class="layout">
      <aside class="panel">
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
      </aside>
      <section class="map-area">
        <div id="map"></div>
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

const map = L.map("map", { zoomControl: false }).setView([-5.4, 105.26], 12);
L.control.zoom({ position: "topright" }).addTo(map);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors",
}).addTo(map);

const layers = {
  faskes: L.layerGroup().addTo(map),
  buffers: L.layerGroup().addTo(map),
  boundaries: L.layerGroup().addTo(map),
  analysis: L.layerGroup().addTo(map),
};

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

function renderFaskesMarkers() {
  layers.faskes.clearLayers();
  const { filteredFaskes } = store.getState();

  filteredFaskes.forEach((feature) => {
    const marker = L.marker(
      [feature.geometry.coordinates[1], feature.geometry.coordinates[0]],
      { icon: createMarkerIcon(feature.properties.jenis) }
    );

    marker.bindPopup(
      `<strong>${feature.properties.nama}</strong><br />` +
        `${feature.properties.jenis}<br />` +
        `${feature.properties.alamat || "Alamat tidak tersedia"}`
    );

    marker.addTo(layers.faskes);
  });
}

function renderBoundaries() {
  layers.boundaries.clearLayers();
  const { boundaries } = store.getState();
  if (!boundaries.length) {
    return;
  }

  L.geoJSON(boundaries as any, {
    style: {
      color: "#184c4c",
      weight: 1.5,
      fillOpacity: 0.2,
    },
    onEachFeature: (feature, layer) => {
      const name = (feature.properties as any)?.nama ?? "Boundary";
      layer.bindPopup(`<strong>${name}</strong>`);
    },
  }).addTo(layers.boundaries);
}

function renderBuffers() {
  layers.buffers.clearLayers();
  const { bufferActive, bufferRadius, filteredFaskes, boundaries } = store.getState();

  if (!bufferActive) {
    return;
  }

  const zones = computeBufferZones(filteredFaskes, bufferRadius);
  zones.forEach((zone) => {
    L.geoJSON(zone as any, {
      style: {
        color: "#ff7a5c",
        fillColor: "#ff7a5c",
        fillOpacity: 0.2,
        weight: 1,
      },
    }).addTo(layers.buffers);
  });

  const union = computeUnionBuffer(zones as any);
  if (union && boundaries.length > 0) {
    const stats = computeCoverageStats(boundaries[0], union);
    updateCoverageStats(stats.coveredKm2, stats.uncoveredKm2, stats.percentageCovered);
  }
}

function renderAnalysisPoint() {
  layers.analysis.clearLayers();
  const { analysisPoint, nearestFacilities } = store.getState();
  if (!analysisPoint) {
    nearestList.innerHTML = "";
    return;
  }

  L.circleMarker([analysisPoint[1], analysisPoint[0]], {
    radius: 6,
    color: "#111c23",
    fillColor: "#f7c94b",
    fillOpacity: 1,
    weight: 2,
  }).addTo(layers.analysis);

  nearestList.innerHTML = "";
  nearestFacilities.forEach((item) => {
    const [lon, lat] = item.feature.geometry.coordinates;
    L.polyline(
      [
        [analysisPoint[1], analysisPoint[0]],
        [lat, lon],
      ],
      { color: "#111c23", weight: 1.5, opacity: 0.7 }
    ).addTo(layers.analysis);

    const li = document.createElement("li");
    li.innerHTML = `<strong>${item.feature.properties.nama}</strong><span>${item.feature.properties.jenis} • ${item.distanceKm.toFixed(
      2
    )} km</span>`;
    nearestList.appendChild(li);
  });
}

function updateCoverageStats(covered: number, uncovered: number, percentage: number) {
  const blocks = coverageStats.querySelectorAll("strong");
  blocks[0].textContent = `${covered.toFixed(2)} km2`;
  blocks[1].textContent = `${uncovered.toFixed(2)} km2`;
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
        15
      );
    });
    searchResults.appendChild(item);
  });
}

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
