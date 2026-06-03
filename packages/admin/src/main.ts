import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "./style.css";

const app = document.getElementById("app");
if (!app) throw new Error("App container not found");

const API_BASE = "/api";

// ── State ─────────────────────────────────────────────────────
let isAuthenticated = false;
let currentView: "dashboard" | "faskes" | "boundaries" = "dashboard";
let faskesData: any[] = [];
let boundariesData: any[] = [];
let searchQuery = "";

// ── Auth ──────────────────────────────────────────────────────
async function checkAuth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/auth/me`, { credentials: "include" });
    isAuthenticated = res.ok;
  } catch {
    isAuthenticated = false;
  }
  return isAuthenticated;
}

async function login(e: Event) {
  e.preventDefault();
  const form = e.target as HTMLFormElement;
  const username = (form.elements.namedItem("username") as HTMLInputElement).value;
  const password = (form.elements.namedItem("password") as HTMLInputElement).value;
  const errorEl = document.getElementById("login-error") as HTMLDivElement;

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username, password }),
    });

    if (res.ok) {
      isAuthenticated = true;
      renderApp();
    } else {
      const data = await res.json().catch(() => ({ error: "Login gagal." }));
      if (errorEl) {
        errorEl.textContent = data.error ?? "Username atau password salah.";
        errorEl.style.display = "block";
      }
    }
  } catch {
    if (errorEl) {
      errorEl.textContent = "Tidak dapat terhubung ke server.";
      errorEl.style.display = "block";
    }
  }
}

async function logout() {
  await fetch(`${API_BASE}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
  isAuthenticated = false;
  faskesData = [];
  boundariesData = [];
  renderApp();
}

// ── Data Fetching ─────────────────────────────────────────────
async function fetchFaskes() {
  try {
    const res = await fetch(`${API_BASE}/admin/faskes`, { credentials: "include" });
    if (res.status === 401) {
      isAuthenticated = false;
      renderApp();
      return;
    }
    const data = await res.json();
    faskesData = data.features ?? [];
    renderContent();
  } catch (e) {
    console.error("Gagal memuat faskes:", e);
  }
}

async function fetchBoundaries() {
  try {
    const res = await fetch(`${API_BASE}/admin/boundaries`, { credentials: "include" });
    if (res.status === 401) {
      isAuthenticated = false;
      renderApp();
      return;
    }
    const data = await res.json();
    boundariesData = data.features ?? [];
    renderContent();
  } catch (e) {
    console.error("Gagal memuat boundaries:", e);
  }
}

// ── CRUD Faskes ───────────────────────────────────────────────
async function saveFaskes(id: string | null, payload: any) {
  const method = id ? "PUT" : "POST";
  const url = id ? `${API_BASE}/admin/faskes/${id}` : `${API_BASE}/admin/faskes`;
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: "Gagal menyimpan." }));
    throw new Error(JSON.stringify(data));
  }
  await fetchFaskes();
}

async function deleteFaskes(id: string) {
  if (!confirm("Yakin ingin menghapus faskes ini?")) return;
  const res = await fetch(`${API_BASE}/admin/faskes/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: "Gagal menghapus." }));
    alert(data.error ?? "Gagal menghapus faskes.");
  }
  await fetchFaskes();
}

// ── CRUD Boundary ─────────────────────────────────────────────
async function saveBoundaryMetadata(id: string, payload: { nama?: string; level?: string }) {
  const res = await fetch(`${API_BASE}/admin/boundaries/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: "Gagal menyimpan." }));
    throw new Error(data.error ?? "Gagal menyimpan metadata.");
  }
}

async function saveBoundaryGeometry(id: string, geometry: any) {
  const res = await fetch(`${API_BASE}/admin/boundaries/${id}/geometry`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(geometry),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: "Gagal menyimpan." }));
    throw new Error(data.error ?? "Gagal menyimpan geometry.");
  }
}

// ── UI: Login ─────────────────────────────────────────────────
function renderLogin() {
  return `
    <div class="login-shell">
      <div class="card login-card">
        <div class="login-brand">
          <div class="brand-mark"></div>
          <h1>Admin Panel</h1>
          <p class="subtitle">WebGIS Faskes Bandar Lampung</p>
        </div>
        <div id="login-error" class="error-banner" style="display:none"></div>
        <form id="login-form">
          <label class="field">
            <span>Username</span>
            <input type="text" name="username" autocomplete="username" required />
          </label>
          <label class="field">
            <span>Password</span>
            <input type="password" name="password" autocomplete="current-password" required />
          </label>
          <button type="submit" class="primary full">Login</button>
        </form>
      </div>
    </div>
  `;
}

// ── UI: Dashboard Layout ──────────────────────────────────────
function renderDashboard() {
  return `
    <div class="admin-shell">
      <aside class="sidebar">
        <div class="brand">
          <div class="brand-mark"></div>
          <h2>GIS Admin</h2>
        </div>
        <nav class="nav-menu">
          <button class="nav-item ${currentView === "dashboard" ? "active" : ""}" data-view="dashboard">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            Dashboard
          </button>
          <button class="nav-item ${currentView === "faskes" ? "active" : ""}" data-view="faskes">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
            Faskes
          </button>
          <button class="nav-item ${currentView === "boundaries" ? "active" : ""}" data-view="boundaries">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/></svg>
            Boundaries
          </button>
        </nav>
        <div class="sidebar-bottom">
          <a href="/" target="_blank" class="nav-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            Public Map
          </a>
          <button id="btn-logout" class="nav-item danger">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Logout
          </button>
        </div>
      </aside>
      <main class="content">
        <header class="content-header">
          <h1 id="page-title"></h1>
          <div class="header-actions" id="header-actions"></div>
        </header>
        <div id="content-body" class="content-body"></div>
      </main>
    </div>
  `;
}

// ── UI: Dashboard Content ─────────────────────────────────────
function renderDashboardContent() {
  const title = document.getElementById("page-title");
  const actions = document.getElementById("header-actions");
  const body = document.getElementById("content-body");
  if (title) title.textContent = "Dashboard";
  if (actions) actions.innerHTML = "";

  const jenisCounts = new Map<string, number>();
  faskesData.forEach((f) => {
    const j = f.properties?.jenis ?? "Lainnya";
    jenisCounts.set(j, (jenisCounts.get(j) ?? 0) + 1);
  });

  const kecCounts = new Map<string, number>();
  boundariesData.forEach((b) => {
    if (b.properties?.level === "kecamatan") kecCounts.set(b.properties.nama, 1);
  });

  if (body) {
    body.innerHTML = `
      <div class="dashboard-grid">
        <div class="stat-card accent-teal">
          <div class="stat-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
          </div>
          <div class="stat-info">
            <span class="stat-value">${faskesData.length}</span>
            <span class="stat-label">Total Faskes</span>
          </div>
        </div>
        <div class="stat-card accent-amber">
          <div class="stat-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/></svg>
          </div>
          <div class="stat-info">
            <span class="stat-value">${boundariesData.length}</span>
            <span class="stat-label">Total Boundaries</span>
          </div>
        </div>
        <div class="stat-card accent-coral">
          <div class="stat-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          </div>
          <div class="stat-info">
            <span class="stat-value">${jenisCounts.size}</span>
            <span class="stat-label">Jenis Faskes</span>
          </div>
        </div>
        <div class="stat-card accent-blue">
          <div class="stat-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          </div>
          <div class="stat-info">
            <span class="stat-value">${kecCounts.size}</span>
            <span class="stat-label">Kecamatan</span>
          </div>
        </div>
      </div>
      <div class="dashboard-detail">
        <div class="detail-card">
          <h3>Distribusi Jenis Faskes</h3>
          <div class="bar-chart" id="jenis-chart"></div>
        </div>
      </div>
    `;

    const chart = document.getElementById("jenis-chart");
    if (chart) {
      const maxVal = Math.max(...Array.from(jenisCounts.values()), 1);
      const colors = ["#2d8f7e", "#e07a3f", "#cf3b2b", "#3f6fd8", "#f2b705", "#8b5cf6"];
      let i = 0;
      jenisCounts.forEach((count, jenis) => {
        const pct = (count / maxVal) * 100;
        const color = colors[i % colors.length];
        const row = document.createElement("div");
        row.className = "bar-row";
        row.innerHTML = `
          <span class="bar-label">${jenis}</span>
          <div class="bar-track">
            <div class="bar-fill" style="width:${pct}%;background:${color}"></div>
          </div>
          <span class="bar-value">${count}</span>
        `;
        chart.appendChild(row);
        i++;
      });
    }
  }
}

// ── UI: Faskes Content ────────────────────────────────────────
function renderFaskesContent() {
  const title = document.getElementById("page-title");
  const actions = document.getElementById("header-actions");
  if (title) title.textContent = "Fasilitas Kesehatan";
  if (actions) {
    actions.innerHTML = `
      <input type="text" id="search-faskes" placeholder="Cari nama faskes..." value="${searchQuery}" />
      <button class="primary" id="btn-add-faskes">+ Tambah Faskes</button>
    `;
    document.getElementById("btn-add-faskes")?.addEventListener("click", () => openFaskesModal());
    document.getElementById("search-faskes")?.addEventListener("input", (e) => {
      searchQuery = (e.target as HTMLInputElement).value.toLowerCase();
      renderFaskesTable();
    });
  }

  const body = document.getElementById("content-body");
  if (body) {
    body.innerHTML = `<div class="table-container"><table class="data-table">
      <thead>
        <tr>
          <th>Nama</th>
          <th>Jenis</th>
          <th>Kecamatan</th>
          <th>Kelurahan</th>
          <th>Aksi</th>
        </tr>
      </thead>
      <tbody id="faskes-tbody"></tbody>
    </table></div>`;
    renderFaskesTable();
  }
}

function renderFaskesTable() {
  const tbody = document.getElementById("faskes-tbody");
  if (!tbody) return;
  const filtered = faskesData.filter((f) =>
    (f.properties?.nama ?? "").toLowerCase().includes(searchQuery)
  );

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-state">Tidak ada data faskes${searchQuery ? " yang cocok" : ""}.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered
    .map(
      (f) => `
    <tr>
      <td><strong>${f.properties.nama}</strong></td>
      <td><span class="badge">${f.properties.jenis}</span></td>
      <td>${f.properties.kecamatan || "-"}</td>
      <td>${f.properties.kelurahan || "-"}</td>
      <td class="actions-cell">
        <button class="action-btn edit-faskes" data-id="${f.properties.id}">Edit</button>
        <button class="action-btn danger delete-faskes" data-id="${f.properties.id}">Hapus</button>
      </td>
    </tr>
  `
    )
    .join("");

  document.querySelectorAll(".edit-faskes").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = (e.target as HTMLButtonElement).dataset.id!;
      const faskes = faskesData.find((f) => f.properties.id === id);
      if (faskes) openFaskesModal(faskes);
    });
  });
  document.querySelectorAll(".delete-faskes").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = (e.target as HTMLButtonElement).dataset.id!;
      deleteFaskes(id);
    });
  });
}

// ── UI: Faskes Modal ──────────────────────────────────────────
function openFaskesModal(faskes?: any) {
  const modal = document.createElement("div");
  modal.className = "modal-overlay";
  const p = faskes ? faskes.properties : {};
  const coord = faskes ? faskes.geometry.coordinates : ["", ""];

  modal.innerHTML = `
    <div class="modal">
      <h2>${faskes ? "Edit Faskes" : "Tambah Faskes"}</h2>
      <div id="faskes-error" class="error-banner" style="display:none"></div>
      <form id="faskes-form">
        <label class="field"><span>Nama *</span><input type="text" name="nama" value="${p.nama || ""}" required></label>
        <label class="field"><span>Jenis *</span>
          <select name="jenis" required>
            <option value="">— Pilih —</option>
            <option value="Rumah Sakit" ${p.jenis === "Rumah Sakit" ? "selected" : ""}>Rumah Sakit</option>
            <option value="Puskesmas" ${p.jenis === "Puskesmas" ? "selected" : ""}>Puskesmas</option>
            <option value="Klinik" ${p.jenis === "Klinik" ? "selected" : ""}>Klinik</option>
            <option value="Apotek" ${p.jenis === "Apotek" ? "selected" : ""}>Apotek</option>
            <option value="Praktek Dokter" ${p.jenis === "Praktek Dokter" ? "selected" : ""}>Praktek Dokter</option>
          </select>
        </label>
        <label class="field"><span>Alamat</span><input type="text" name="alamat" value="${p.alamat || ""}"></label>
        <div class="coord-group">
          <label class="field"><span>Kecamatan</span><input type="text" name="kecamatan" value="${p.kecamatan || ""}"></label>
          <label class="field"><span>Kelurahan</span><input type="text" name="kelurahan" value="${p.kelurahan || ""}"></label>
        </div>
        <div class="coord-group">
          <label class="field"><span>Latitude *</span><input type="number" step="any" name="latitude" value="${coord[1]}" required></label>
          <label class="field"><span>Longitude *</span><input type="number" step="any" name="longitude" value="${coord[0]}" required></label>
        </div>
        <div class="modal-actions">
          <button type="button" class="cancel" id="btn-cancel">Batal</button>
          <button type="submit" class="primary">Simpan</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(modal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.remove();
  });

  document.getElementById("btn-cancel")?.addEventListener("click", () => modal.remove());
  document.getElementById("faskes-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    const errorEl = document.getElementById("faskes-error") as HTMLDivElement;

    const payload = {
      nama: fd.get("nama") as string,
      jenis: fd.get("jenis") as string,
      alamat: fd.get("alamat") as string,
      kecamatan: fd.get("kecamatan") as string,
      kelurahan: fd.get("kelurahan") as string,
      latitude: Number(fd.get("latitude")),
      longitude: Number(fd.get("longitude")),
    };

    try {
      await saveFaskes(faskes ? faskes.properties.id : null, payload);
      modal.remove();
    } catch (err: any) {
      if (errorEl) {
        try {
          const data = JSON.parse(err.message);
          const msgs: string[] = [];
          if (data.error) msgs.push(data.error);
          if (data.details) {
            Object.entries(data.details).forEach(([field, errors]) => {
              msgs.push(`${field}: ${(errors as string[]).join(", ")}`);
            });
          }
          errorEl.textContent = msgs.join(" | ");
        } catch {
          errorEl.textContent = err.message;
        }
        errorEl.style.display = "block";
      }
    }
  });
}

// ── UI: Boundaries Content ────────────────────────────────────
function renderBoundariesContent() {
  const title = document.getElementById("page-title");
  const actions = document.getElementById("header-actions");
  if (title) title.textContent = "Batas Wilayah";
  if (actions) actions.innerHTML = "";

  const body = document.getElementById("content-body");
  if (body) {
    body.innerHTML = `<div class="table-container"><table class="data-table">
      <thead>
        <tr>
          <th>Nama</th>
          <th>Level</th>
          <th>Aksi</th>
        </tr>
      </thead>
      <tbody id="boundaries-tbody"></tbody>
    </table></div>`;

    const tbody = document.getElementById("boundaries-tbody")!;
    if (boundariesData.length === 0) {
      tbody.innerHTML = `<tr><td colspan="3" class="empty-state">Tidak ada data boundaries.</td></tr>`;
      return;
    }

    tbody.innerHTML = boundariesData
      .map(
        (b) => `
      <tr>
        <td><strong>${b.properties.nama}</strong></td>
        <td><span class="badge">${b.properties.level}</span></td>
        <td class="actions-cell">
          <button class="action-btn edit-boundary" data-id="${b.properties.id}">Edit</button>
        </td>
      </tr>
    `
      )
      .join("");

    document.querySelectorAll(".edit-boundary").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const id = (e.target as HTMLButtonElement).dataset.id!;
        const b = boundariesData.find((x) => x.properties.id === id);
        if (b) openBoundaryModal(b);
      });
    });
  }
}

// ── UI: Boundary Modal ────────────────────────────────────────
function openBoundaryModal(b: any) {
  const modal = document.createElement("div");
  modal.className = "modal-overlay";

  modal.innerHTML = `
    <div class="modal large">
      <h2>Edit Boundary</h2>
      <div id="boundary-error" class="error-banner" style="display:none"></div>
      <div class="boundary-sections">
        <div class="boundary-meta">
          <h3>Metadata</h3>
          <form id="boundary-meta-form">
            <label class="field"><span>Nama *</span><input type="text" name="nama" value="${b.properties.nama}" required></label>
            <label class="field"><span>Level *</span>
              <select name="level" required>
                <option value="kecamatan" ${b.properties.level === "kecamatan" ? "selected" : ""}>Kecamatan</option>
                <option value="kelurahan" ${b.properties.level === "kelurahan" ? "selected" : ""}>Kelurahan</option>
              </select>
            </label>
            <button type="submit" class="primary">Simpan Metadata</button>
          </form>
        </div>
        <div class="boundary-geom">
          <h3>Geometry</h3>
          <div id="boundary-map-preview" class="map-preview"></div>
          <label class="field">
            <span>Upload GeoJSON</span>
            <input type="file" id="geojson-file" accept=".geojson,.json" />
          </label>
          <textarea id="geojson-text" rows="6" placeholder="Atau paste GeoJSON geometry di sini...">${JSON.stringify(b.geometry, null, 2)}</textarea>
          <button type="button" class="primary" id="btn-save-geom">Simpan Geometry</button>
        </div>
      </div>
      <div class="modal-actions">
        <button type="button" class="cancel" id="btn-cancel">Tutup</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.remove();
  });

  // Init Leaflet preview
  setTimeout(() => {
    const mapContainer = document.getElementById("boundary-map-preview");
    if (mapContainer) {
      const previewMap = L.map(mapContainer).setView([-5.4, 105.26], 11);
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: "&copy; OSM &amp; CARTO",
        subdomains: "abcd",
        maxZoom: 18,
      }).addTo(previewMap);

      const geojsonLayer = L.geoJSON(b as any, {
        style: { color: "#2d8f7e", weight: 2, fillOpacity: 0.2 },
      }).addTo(previewMap);

      try {
        previewMap.fitBounds(geojsonLayer.getBounds(), { padding: [20, 20] });
      } catch {
        /* empty geometry */
      }

      // Update preview when geojson text changes
      const updatePreview = (geojsonStr: string) => {
        try {
          const geom = JSON.parse(geojsonStr);
          geojsonLayer.clearLayers();
          geojsonLayer.addData({
            type: "Feature",
            properties: b.properties,
            geometry: geom,
          } as any);
          previewMap.fitBounds(geojsonLayer.getBounds(), { padding: [20, 20] });
        } catch {
          /* invalid json, ignore */
        }
      };

      const textarea = document.getElementById("geojson-text") as HTMLTextAreaElement;
      textarea?.addEventListener("change", () => updatePreview(textarea.value));

      // File upload
      const fileInput = document.getElementById("geojson-file") as HTMLInputElement;
      fileInput?.addEventListener("change", () => {
        const file = fileInput.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          const text = reader.result as string;
          try {
            const parsed = JSON.parse(text);
            const geom = parsed.type === "Feature" ? parsed.geometry : parsed.type === "FeatureCollection" ? parsed.features?.[0]?.geometry : parsed;
            if (textarea) textarea.value = JSON.stringify(geom, null, 2);
            updatePreview(JSON.stringify(geom));
          } catch {
            alert("File GeoJSON tidak valid.");
          }
        };
        reader.readAsText(file);
      });
    }
  }, 100);

  document.getElementById("btn-cancel")?.addEventListener("click", () => modal.remove());

  // Save metadata
  document.getElementById("boundary-meta-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    const errorEl = document.getElementById("boundary-error") as HTMLDivElement;
    try {
      await saveBoundaryMetadata(b.properties.id, {
        nama: fd.get("nama") as string,
        level: fd.get("level") as string,
      });
      errorEl.style.display = "none";
      await fetchBoundaries();
      alert("Metadata berhasil disimpan!");
    } catch (err: any) {
      errorEl.textContent = err.message;
      errorEl.style.display = "block";
    }
  });

  // Save geometry
  document.getElementById("btn-save-geom")?.addEventListener("click", async () => {
    const textarea = document.getElementById("geojson-text") as HTMLTextAreaElement;
    const errorEl = document.getElementById("boundary-error") as HTMLDivElement;
    try {
      const geom = JSON.parse(textarea.value);
      if (geom.type !== "Polygon" && geom.type !== "MultiPolygon") {
        throw new Error("Geometry harus bertipe Polygon atau MultiPolygon.");
      }
      await saveBoundaryGeometry(b.properties.id, geom);
      errorEl.style.display = "none";
      await fetchBoundaries();
      alert("Geometry berhasil disimpan!");
      modal.remove();
    } catch (err: any) {
      errorEl.textContent = err.message;
      errorEl.style.display = "block";
    }
  });
}

// ── Render Router ─────────────────────────────────────────────
function renderContent() {
  switch (currentView) {
    case "dashboard":
      renderDashboardContent();
      break;
    case "faskes":
      renderFaskesContent();
      break;
    case "boundaries":
      renderBoundariesContent();
      break;
  }
}

function attachDashboardEvents() {
  document.getElementById("btn-logout")?.addEventListener("click", logout);

  document.querySelectorAll(".nav-item[data-view]").forEach((el) => {
    el.addEventListener("click", (e) => {
      const view = (e.currentTarget as HTMLElement).dataset.view as any;
      if (view !== currentView) {
        currentView = view;
        searchQuery = "";
        renderApp();
      }
    });
  });
}

async function renderApp() {
  if (!isAuthenticated) {
    app!.innerHTML = renderLogin();
    document.getElementById("login-form")?.addEventListener("submit", login);
  } else {
    app!.innerHTML = renderDashboard();
    attachDashboardEvents();

    // Load data if needed
    if (faskesData.length === 0 || boundariesData.length === 0) {
      await Promise.all([fetchFaskes(), fetchBoundaries()]);
    }
    renderContent();
  }
}

// ── Init ──────────────────────────────────────────────────────
checkAuth().then(renderApp);
