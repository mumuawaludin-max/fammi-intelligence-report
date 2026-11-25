/** Alat tanggal bersama (kalender, laporan, mood). Waktu setempat, format ISO "2026-11-25". */

/** Tanggal setempat jadi ISO "2026-11-25". */
export function iso(d = new Date()) {
  const t = new Date(d);
  t.setMinutes(t.getMinutes() - t.getTimezoneOffset());
  return t.toISOString().slice(0, 10);
}

/** Tanggal ISO jadi "25 Nov 2026" (atau "25 Nov" bila `tanpaTahun`). */
export function labelTanggal(nilai, tanpaTahun = false) {
  if (!nilai) return "";
  const opsi = tanpaTahun ? { day: "numeric", month: "short" } : { day: "numeric", month: "short", year: "numeric" };
  return new Date(`${nilai}T00:00:00`).toLocaleDateString("id-ID", opsi);
}
