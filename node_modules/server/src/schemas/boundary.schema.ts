import { z } from "zod";

export const BoundaryUpdateSchema = z.object({
  nama: z.string().min(1, "Nama tidak boleh kosong").optional(),
  level: z.enum(["kecamatan", "kelurahan"]).optional(),
});

export const BoundaryGeometrySchema = z.object({
  type: z.union([
    z.literal("Feature"),
    z.literal("Polygon"),
    z.literal("MultiPolygon"),
  ]),
});

export type BoundaryUpdate = z.infer<typeof BoundaryUpdateSchema>;
