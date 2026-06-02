// Feature: gis-faskes-bandar-lampung, Property 15: Rate Limiting Enforced After 5 Failed Login Attempts
import { describe, test, expect } from "vitest";
import express from "express";
import request from "supertest";
import { loginRateLimiter } from "../rateLimit";

function createApp() {
  const app = express();
  app.use("/login", loginRateLimiter, (req, res) => res.status(401).json({ error: "invalid" }));
  return app;
}

describe("Property 15: rate limiting after 5 failed attempts", () => {
  test("sixth attempt is rejected", async () => {
    const app = createApp();
    const agent = request.agent(app);

    for (let i = 0; i < 5; i += 1) {
      const response = await agent.post("/login");
      expect(response.status).toBe(401);
    }

    const blocked = await agent.post("/login");
    expect(blocked.status).toBe(429);
  });
});
