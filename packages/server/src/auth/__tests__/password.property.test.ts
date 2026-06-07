// Feature: gis-faskes-bandar-lampung, Property 16: Password Stored as bcrypt Hash with Sufficient Cost Factor
import { test, expect } from "vitest";
import fc from "fast-check";
import bcrypt from "bcryptjs";
import { hashPassword } from "../password";

test("Property 16: password is stored as bcrypt hash", async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.string({ minLength: 1, maxLength: 72 }),
      async (password) => {
        const hash = await hashPassword(password);
        const isValid = await bcrypt.compare(password, hash);
        const costFactor = parseInt(hash.split("$")[2], 10);
        expect(isValid).toBe(true);
        expect(hash).not.toBe(password);
        expect(costFactor).toBeGreaterThanOrEqual(10);
      }
    )
  );
});
