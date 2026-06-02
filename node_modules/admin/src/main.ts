import "./style.css";

const app = document.getElementById("app");
if (!app) throw new Error("App container not found");

// State
let isAuthenticated = false;
let currentView: 'faskes' | 'boundaries' = 'faskes';
let faskesData: any[] = [];
let boundariesData: any[] = [];
let searchQuery = "";

// Auth Logic
async function checkAuth() {
  try {
    const res = await fetch("/api/auth/me");
    isAuthenticated = res.ok;
  } catch {
    isAuthenticated = false;
  }
}

async function login(e: Event) {
  e.preventDefault();
  const form = e.target as HTMLFormElement;
  const username = (form.elements.namedItem("username") as HTMLInputElement).value;
  const password = (form.elements.namedItem("password") as HTMLInputElement).value;
  
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });
  
  if (res.ok) {
    isAuthenticated = true;
    renderApp();
  } else {
    alert("Login failed");
  }
}

async function logout() {
  await fetch("/api/auth/logout", { method: "POST" });
  isAuthenticated = false;
  renderApp();
}

async function fetchFaskes() {
  try {
    const res = await fetch("/api/faskes");
    if (res.status === 401) { isAuthenticated = false; renderApp(); return; }
    faskesData = await res.json();
    renderContent();
  } catch (e) {
    console.error(e);
  }
}

async function fetchBoundaries() {
  try {
    const res = await fetch("/api/boundaries");
    if (res.status === 401) { isAuthenticated = false; renderApp(); return; }
    boundariesData = await res.json();
    renderContent();
  } catch (e) {
    console.error(e);
  }
}

// Faskes API Calls
async function saveFaskes(id: number | null, data: any) {
  const method = id ? "PUT" : "POST";
  const url = id ? `/api/faskes/${id}` : "/api/faskes";
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(await res.text());
  await fetchFaskes();
}

async function deleteFaskes(id: number) {
  if (!confirm("Are you sure?")) return;
  const res = await fetch(`/api/faskes/${id}`, { method: "DELETE" });
  if (!res.ok) alert(await res.text());
  await fetchFaskes();
}

// UI Builders
function renderLogin() {
  return `
    <div class="login-shell">
      <div class="card login-card">
        <h1>Admin Login</h1>
        <form id="login-form">
          <label class="field">
            <span>Username</span>
            <input type="text" name="username" required />
          </label>
          <label class="field">
            <span>Password</span>
            <input type="password" name="password" required />
          </label>
          <button type="submit" class="primary">Login</button>
        </form>
      </div>
    </div>
  `;
}

function renderDashboard() {
  return `
    <div class="admin-shell">
      <aside class="sidebar">
        <div class="brand">
          <div class="brand-mark"></div>
          <h2>GIS Admin</h2>
        </div>
        <nav class="nav-menu">
          <button class="nav-item ${currentView === 'faskes' ? 'active' : ''}" data-view="faskes">Faskes</button>
          <button class="nav-item ${currentView === 'boundaries' ? 'active' : ''}" data-view="boundaries">Boundaries</button>
        </nav>
        <div class="sidebar-bottom">
          <a href="/" target="_blank" class="nav-item">Public Map &nearr;</a>
          <button id="btn-logout" class="nav-item danger">Logout</button>
        </div>
      </aside>
      <main class="content">
        <header class="content-header">
          <h1>${currentView === 'faskes' ? 'Fasilitas Kesehatan' : 'Boundaries (Kecamatan)'}</h1>
          <div class="header-actions" id="header-actions"></div>
        </header>
        <div id="content-body" class="content-body"></div>
      </main>
    </div>
  `;
}

function renderFaskesContent() {
  const actions = document.getElementById("header-actions");
  if (actions) {
    actions.innerHTML = `
      <input type="text" id="search-faskes" placeholder="Cari nama faskes..." value="${searchQuery}" />
      <button class="primary" id="btn-add-faskes">Tambah Faskes</button>
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
  const filtered = faskesData.filter(f => f.properties.nama.toLowerCase().includes(searchQuery));
  
  tbody.innerHTML = filtered.map(f => `
    <tr>
      <td>${f.properties.nama}</td>
      <td><span class="badge badge-${f.properties.jenis.replace(/\s+/g, '-').toLowerCase()}">${f.properties.jenis}</span></td>
      <td>${f.properties.kecamatan}</td>
      <td>
        <button class="action-btn edit-faskes" data-id="${f.id}">Edit</button>
        <button class="action-btn delete-faskes danger" data-id="${f.id}">Hapus</button>
      </td>
    </tr>
  `).join("");

  document.querySelectorAll(".edit-faskes").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const id = (e.target as HTMLButtonElement).dataset.id;
      const faskes = faskesData.find(f => f.id === Number(id));
      if (faskes) openFaskesModal(faskes);
    });
  });
  document.querySelectorAll(".delete-faskes").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const id = (e.target as HTMLButtonElement).dataset.id;
      deleteFaskes(Number(id));
    });
  });
}

function renderBoundariesContent() {
  const actions = document.getElementById("header-actions");
  if (actions) actions.innerHTML = ``;
  
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
    tbody.innerHTML = boundariesData.map(b => `
      <tr>
        <td>${b.properties.nama}</td>
        <td>${b.properties.level}</td>
        <td>
          <button class="action-btn edit-boundary" data-id="${b.id}">Edit</button>
        </td>
      </tr>
    `).join("");

    document.querySelectorAll(".edit-boundary").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const id = (e.target as HTMLButtonElement).dataset.id;
        const b = boundariesData.find(x => x.id === Number(id));
        if (b) openBoundaryModal(b);
      });
    });
  }
}

function openFaskesModal(faskes?: any) {
  const modal = document.createElement("div");
  modal.className = "modal-overlay";
  const p = faskes ? faskes.properties : {};
  const coord = faskes ? faskes.geometry.coordinates : ["", ""];
  
  modal.innerHTML = `
    <div class="modal">
      <h2>${faskes ? 'Edit Faskes' : 'Tambah Faskes'}</h2>
      <form id="faskes-form">
        <label class="field"><span>Nama</span><input type="text" name="nama" value="${p.nama || ''}" required></label>
        <label class="field"><span>Jenis</span>
          <select name="jenis" required>
            <option value="Rumah Sakit" ${p.jenis==='Rumah Sakit'?'selected':''}>Rumah Sakit</option>
            <option value="Puskesmas" ${p.jenis==='Puskesmas'?'selected':''}>Puskesmas</option>
            <option value="Klinik" ${p.jenis==='Klinik'?'selected':''}>Klinik</option>
            <option value="Apotek" ${p.jenis==='Apotek'?'selected':''}>Apotek</option>
          </select>
        </label>
        <label class="field"><span>Alamat</span><input type="text" name="alamat" value="${p.alamat || ''}"></label>
        <label class="field"><span>Kecamatan</span><input type="text" name="kecamatan" value="${p.kecamatan || ''}" required></label>
        <label class="field"><span>Kelurahan</span><input type="text" name="kelurahan" value="${p.kelurahan || ''}" required></label>
        <div class="coord-group">
          <label class="field"><span>Longitude</span><input type="number" step="any" name="lng" value="${coord[0]}" required></label>
          <label class="field"><span>Latitude</span><input type="number" step="any" name="lat" value="${coord[1]}" required></label>
        </div>
        <div class="modal-actions">
          <button type="button" class="cancel" id="btn-cancel">Batal</button>
          <button type="submit" class="primary">Simpan</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(modal);
  
  document.getElementById("btn-cancel")?.addEventListener("click", () => modal.remove());
  document.getElementById("faskes-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    const lat = Number(fd.get("lat"));
    const lng = Number(fd.get("lng"));
    if (lat < -5.52 || lat > -5.28) return alert("Latitude harus antara -5.52 dan -5.28");
    if (lng < 105.18 || lng > 105.42) return alert("Longitude harus antara 105.18 dan 105.42");
    
    const payload = {
      type: "Feature",
      geometry: { type: "Point", coordinates: [lng, lat] },
      properties: {
        nama: fd.get("nama"),
        jenis: fd.get("jenis"),
        alamat: fd.get("alamat"),
        kecamatan: fd.get("kecamatan"),
        kelurahan: fd.get("kelurahan"),
      }
    };
    try {
      await saveFaskes(faskes?.id, payload);
      modal.remove();
    } catch (err: any) {
      alert(err.message);
    }
  });
}

function openBoundaryModal(b: any) {
  const modal = document.createElement("div");
  modal.className = "modal-overlay";
  const geojsonStr = JSON.stringify(b.geometry, null, 2);
  
  modal.innerHTML = `
    <div class="modal large">
      <h2>Edit Boundary</h2>
      <form id="boundary-form">
        <label class="field"><span>Nama</span><input type="text" name="nama" value="${b.properties.nama}" required></label>
        <label class="field"><span>Level</span><input type="text" name="level" value="${b.properties.level}" required></label>
        <label class="field"><span>Geometry (GeoJSON)</span>
          <textarea name="geometry" rows="10" required>${geojsonStr}</textarea>
        </label>
        <div class="modal-actions">
          <button type="button" class="cancel" id="btn-cancel">Batal</button>
          <button type="submit" class="primary">Simpan</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(modal);
  
  document.getElementById("btn-cancel")?.addEventListener("click", () => modal.remove());
  document.getElementById("boundary-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    try {
      const geom = JSON.parse(fd.get("geometry") as string);
      if (geom.type !== "Polygon" && geom.type !== "MultiPolygon") {
        return alert("Geometry must be Polygon or MultiPolygon");
      }
      const payload = {
        type: "Feature",
        geometry: geom,
        properties: {
          nama: fd.get("nama"),
          level: fd.get("level")
        }
      };
      const res = await fetch(`/api/boundaries/${b.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(await res.text());
      await fetchBoundaries();
      modal.remove();
    } catch (err: any) {
      alert("Invalid GeoJSON or Save Error: " + err.message);
    }
  });
}

function renderContent() {
  if (currentView === 'faskes') renderFaskesContent();
  else renderBoundariesContent();
}

function attachDashboardEvents() {
  document.getElementById("login-form")?.addEventListener("submit", login);
  document.getElementById("btn-logout")?.addEventListener("click", logout);
  
  document.querySelectorAll(".nav-item[data-view]").forEach(el => {
    el.addEventListener("click", (e) => {
      const view = (e.target as HTMLElement).dataset.view as any;
      if (view !== currentView) {
        currentView = view;
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
    if (currentView === 'faskes') {
      if (faskesData.length === 0) await fetchFaskes();
      else renderFaskesContent();
    } else {
      if (boundariesData.length === 0) await fetchBoundaries();
      else renderBoundariesContent();
    }
  }
}

// Init
checkAuth().then(renderApp);
