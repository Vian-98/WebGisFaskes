import "./style.css";

const app = document.getElementById("app");

if (!app) {
  throw new Error("App container not found");
}

app.innerHTML = `
  <div class="admin-shell">
    <div class="card">
      <h1>Admin GIS Faskes</h1>
      <p>Halaman admin masih dalam pengembangan.</p>
      <a href="/" class="link">Kembali ke peta publik</a>
    </div>
  </div>
`;
