// Feature: gis-faskes-bandar-lampung, Property 14: Unauthenticated Requests Rejected on All Protected Routes
import { describe, test, expect } from "vitest";
import fc from "fast-check";
import express from "express";
import request from "supertest";
import { requireAuth } from "../auth";

describe("Property 14: requireAuth rejects unauthenticated requests", () => {
  test("rejects requests without session", async () => {
    const app = express();
    app.get("/protected", requireAuth, (req, res) => res.json({ ok: true }));

    await fc.assert(
      fc.asyncProperty(fc.constant(null), async () => {
        const response = await request(app).get("/protected");
        expect(response.status).toBe(401);
      })
    );
  });
});
