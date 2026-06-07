// Feature: gis-faskes-bandar-lampung, Property 18: Invalid Boundary Metadata Input Rejected
import { test, expect } from "vitest";
import fc from "fast-check";
import { BoundaryUpdateSchema } from "../boundary.schema";

test("Property 18: invalid boundary metadata is rejected", () => {
  const invalidPayloadArb = fc.oneof(
    fc.record({ nama: fc.constant(""), level: fc.constantFrom("kecamatan", "kelurahan") }),
    fc.record({ nama: fc.string({ minLength: 1 }), level: fc.string({ minLength: 1 }) })
      .filter((payload) => payload.level !== "kecamatan" && payload.level !== "kelurahan")
  );

  fc.assert(
    fc.property(invalidPayloadArb, (payload) => {
      const result = BoundaryUpdateSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.flatten().fieldErrors;
        expect(Object.keys(errors).length).toBeGreaterThan(0);
      }
    })
  );
});
