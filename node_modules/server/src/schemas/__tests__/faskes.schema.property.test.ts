// Feature: gis-faskes-bandar-lampung, Property 17: Invalid Faskes Input Rejected with Field-Specific Errors
import { test, expect } from "vitest";
import fc from "fast-check";
import { FaskesCreateSchema, BANDAR_LAMPUNG_BBOX } from "../faskes.schema";

const validFaskesArb = fc.record({
  nama: fc.string({ minLength: 1, maxLength: 50 }),
  jenis: fc.string({ minLength: 1, maxLength: 30 }),
  alamat: fc.string({ maxLength: 120 }),
  kecamatan: fc.string({ maxLength: 80 }),
  kelurahan: fc.string({ maxLength: 80 }),
  latitude: fc.double({
    min: BANDAR_LAMPUNG_BBOX.minLat,
    max: BANDAR_LAMPUNG_BBOX.maxLat,
    noNaN: true,
  }),
  longitude: fc.double({
    min: BANDAR_LAMPUNG_BBOX.minLon,
    max: BANDAR_LAMPUNG_BBOX.maxLon,
    noNaN: true,
  }),
});

const invalidLatitudeArb = fc.oneof(
  fc.double({ max: BANDAR_LAMPUNG_BBOX.minLat - 0.001, noNaN: true }),
  fc.double({ min: BANDAR_LAMPUNG_BBOX.maxLat + 0.001, noNaN: true }),
  fc.constant(Number.NaN)
);

const invalidLongitudeArb = fc.oneof(
  fc.double({ max: BANDAR_LAMPUNG_BBOX.minLon - 0.001, noNaN: true }),
  fc.double({ min: BANDAR_LAMPUNG_BBOX.maxLon + 0.001, noNaN: true }),
  fc.constant(Number.NaN)
);

const invalidPayloadArb = fc.oneof(
  validFaskesArb.map((payload) => ({
    payload: { ...payload, nama: "" },
    field: "nama",
  })),
  validFaskesArb.map((payload) => ({
    payload: { ...payload, jenis: "" },
    field: "jenis",
  })),
  fc.record({
    payload: validFaskesArb,
    field: fc.constant("latitude"),
    invalid: invalidLatitudeArb,
  }).map(({ payload, field, invalid }) => ({
    payload: { ...payload, latitude: invalid },
    field,
  })),
  fc.record({
    payload: validFaskesArb,
    field: fc.constant("longitude"),
    invalid: invalidLongitudeArb,
  }).map(({ payload, field, invalid }) => ({
    payload: { ...payload, longitude: invalid },
    field,
  }))
);

test("Property 17: invalid faskes payload is rejected with field errors", () => {
  fc.assert(
    fc.property(invalidPayloadArb, ({ payload, field }) => {
      const result = FaskesCreateSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.flatten().fieldErrors;
        expect(errors[field as keyof typeof errors]?.length).toBeGreaterThan(0);
      }
    })
  );
});
