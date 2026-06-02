"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BoundaryGeometrySchema = exports.BoundaryUpdateSchema = void 0;
const zod_1 = require("zod");
exports.BoundaryUpdateSchema = zod_1.z.object({
    nama: zod_1.z.string().min(1, "Nama tidak boleh kosong").optional(),
    level: zod_1.z.enum(["kecamatan", "kelurahan"]).optional(),
});
exports.BoundaryGeometrySchema = zod_1.z.object({
    type: zod_1.z.union([
        zod_1.z.literal("Feature"),
        zod_1.z.literal("Polygon"),
        zod_1.z.literal("MultiPolygon"),
    ]),
});
