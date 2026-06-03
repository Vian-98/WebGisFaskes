import { pool } from "./src/db";
import { hashPassword } from "./src/auth/password";

async function main() {
  const username = "admin";
  const password = "password123";

  try {
    const hashed = await hashPassword(password);
    
    // Check if user exists
    const check = await pool.query("SELECT * FROM admins WHERE username = $1", [username]);
    if (check.rows.length > 0) {
      // Update password
      await pool.query("UPDATE admins SET password_hash = $1 WHERE username = $2", [hashed, username]);
      console.log(`Berhasil mengubah password untuk akun: ${username}`);
    } else {
      // Insert new
      await pool.query(
        "INSERT INTO admins (username, password_hash) VALUES ($1, $2)",
        [username, hashed]
      );
      console.log(`Berhasil membuat akun admin baru: ${username}`);
    }
  } catch (err) {
    console.error("Gagal membuat akun admin:", err);
  } finally {
    pool.end();
  }
}

main();
