import { z } from "zod";

export const BANDAR_LAMPUNG_BBOX = {
  minLat: -5.52,
  maxLat: -5.28,
  minLon: 105.18,
  maxLon: 105.42,
};

export const FaskesCreateSchema = z.object({
  nama: z.string().min(1, "Nama tidak boleh kosong"),
  jenis: z.string().min(1, "Jenis tidak boleh kosong"),
  alamat: z.string().default(""),
  kecamatan: z.string().default(""),
  kelurahan: z.string().default(""),
  latitude: z
    .number()
    .finite("Latitude harus berupa angka")
    .min(BANDAR_LAMPUNG_BBOX.minLat, "Latitude di luar wilayah Bandar Lampung")
    .max(BANDAR_LAMPUNG_BBOX.maxLat, "Latitude di luar wilayah Bandar Lampung"),
  longitude: z
    .number()
    .finite("Longitude harus berupa angka")
    .min(BANDAR_LAMPUNG_BBOX.minLon, "Longitude di luar wilayah Bandar Lampung")
    .max(BANDAR_LAMPUNG_BBOX.maxLon, "Longitude di luar wilayah Bandar Lampung"),
});

export const FaskesUpdateSchema = FaskesCreateSchema.partial();

export type FaskesCreate = z.infer<typeof FaskesCreateSchema>;
export type FaskesUpdate = z.infer<typeof FaskesUpdateSchema>;
