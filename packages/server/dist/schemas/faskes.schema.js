"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FaskesUpdateSchema = exports.FaskesCreateSchema = exports.BANDAR_LAMPUNG_BBOX = void 0;
const zod_1 = require("zod");
exports.BANDAR_LAMPUNG_BBOX = {
    minLat: -5.52,
    maxLat: -5.28,
    minLon: 105.18,
    maxLon: 105.42,
};
exports.FaskesCreateSchema = zod_1.z.object({
    nama: zod_1.z.string().min(1, "Nama tidak boleh kosong"),
    jenis: zod_1.z.string().min(1, "Jenis tidak boleh kosong"),
    alamat: zod_1.z.string().default(""),
    kecamatan: zod_1.z.string().default(""),
    kelurahan: zod_1.z.string().default(""),
    latitude: zod_1.z
        .number()
        .finite("Latitude harus berupa angka")
        .min(exports.BANDAR_LAMPUNG_BBOX.minLat, "Latitude di luar wilayah Bandar Lampung")
        .max(exports.BANDAR_LAMPUNG_BBOX.maxLat, "Latitude di luar wilayah Bandar Lampung"),
    longitude: zod_1.z
        .number()
        .finite("Longitude harus berupa angka")
        .min(exports.BANDAR_LAMPUNG_BBOX.minLon, "Longitude di luar wilayah Bandar Lampung")
        .max(exports.BANDAR_LAMPUNG_BBOX.maxLon, "Longitude di luar wilayah Bandar Lampung"),
});
exports.FaskesUpdateSchema = exports.FaskesCreateSchema.partial();
