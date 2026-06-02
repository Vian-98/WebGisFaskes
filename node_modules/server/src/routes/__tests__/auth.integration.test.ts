import { beforeEach, describe, expect, test } from "vitest";
import request from "supertest";
import app from "../../app";
import { resetDatabase, seedAdmin } from "../../test/db";

const adminUser = { username: "admin", password: "secret123" };

describe("Auth integration", () => {
  beforeEach(async () => {
    await resetDatabase();
    await seedAdmin(adminUser.username, adminUser.password);
  });

  test("login with valid credentials returns session", async () => {
    const response = await request(app).post("/api/auth/login").send(adminUser);
    expect(response.status).toBe(200);
    expect(response.headers["set-cookie"]).toBeDefined();
  });

  test("login with invalid password returns 401", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ username: adminUser.username, password: "wrong" });
    expect(response.status).toBe(401);
  });

  test("protected route requires session", async () => {
    const response = await request(app).get("/api/admin/faskes");
    expect(response.status).toBe(401);
  });

  test("logout ends session", async () => {
    const agent = request.agent(app);
    await agent.post("/api/auth/login").send(adminUser);
    const logout = await agent.post("/api/auth/logout");
    expect(logout.status).toBe(200);

    const after = await agent.get("/api/admin/faskes");
    expect(after.status).toBe(401);
  });

  test("rate limit triggers after 5 failures", async () => {
    const agent = request.agent(app);
    for (let i = 0; i < 5; i += 1) {
      const response = await agent
        .post("/api/auth/login")
        .send({ username: adminUser.username, password: "wrong" });
      expect(response.status).toBe(401);
    }

    const blocked = await agent
      .post("/api/auth/login")
      .send({ username: adminUser.username, password: "wrong" });
    expect(blocked.status).toBe(429);
  });
});
