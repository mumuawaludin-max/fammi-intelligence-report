import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

/**
 * Daftar pekan yang BENAR-BENAR punya skor untuk sekolah ini, urut dari terbaru.
 *
 * Sumbernya view karakter_pekan_tersedia (migration 20260901120000), yang isinya satu baris per
 * (sekolah, periode, pekan). Sengaja view tersendiri, bukan diturunkan dari karakter_pekan_avg:
 * yang itu satu baris per kelas dan bisa ribuan baris untuk sekolah besar, boros kalau ditarik
 * penuh cuma untuk mengisi dropdown.
 *
 * Baris dengan pekan = 0 DIBUANG di sini. Pekan 0 berarti "bulan itu dinilai bulanan, tidak
 * dirinci per pekan", jadi menawarkannya sebagai pilihan pekan tidak ada artinya -- bulan itu
 * sudah bisa dipilih lewat tab Bulanan. Yang ditawarkan cuma pekan yang memang diinput sebagai
 * pekan, persis permintaan pemilik produk: baru input P3 berarti baru ada P3; begitu P4 masuk,
 * P4 ikut muncul sendiri.
 *
 * Errornya tidak dilempar: view ini baru ada sejak migration 20260901120000, dan kalau frontend
 * tayang lebih dulu, daftar pekan cukup kosong dan tab Mingguan tidak muncul sama sekali. Jauh
 * lebih baik daripada seluruh halaman mati karena satu dropdown.
 */
export function useAvailablePekan(session) {
  const [pekanList, setPekanList] = useState([]);

  useEffect(() => {
    const schoolId = session?.school_id;
    const punyaKarakter = (session?.modules || []).includes("karakter");
    if (!schoolId || !punyaKarakter) { setPekanList([]); return; }

    let alive = true;
    supabase
      .from("karakter_pekan_tersedia")
      .select("periode_id, pekan, pekan_urut, jumlah_murid, jumlah_kelas")
      .eq("sekolah_id", schoolId)
      .then(({ data, error }) => {
        if (!alive) return;
        if (error) { setPekanList([]); return; }
        setPekanList(
          (data || [])
            .filter((r) => r.pekan > 0)
            .map((r) => ({
              periode: r.periode_id,
              pekan: r.pekan,
              pekanUrut: r.pekan_urut,
              jumlahMurid: r.jumlah_murid,
              jumlahKelas: r.jumlah_kelas,
            }))
            // Terbaru dulu, sejajar dengan urutan daftar bulan.
            .sort((a, b) => b.periode.localeCompare(a.periode) || b.pekanUrut - a.pekanUrut)
        );
      });

    return () => { alive = false; };
  }, [session?.school_id, (session?.modules || []).join("|")]);

  return pekanList;
}

/** Id periode mingguan yang dipakai state: "2026-08|P3". Satu string supaya bisa disimpan di
 * tempat yang sama dengan periode bulanan tanpa mengubah bentuk state. */
export function pekanId(periode, pekan) {
  return `${periode}|P${pekan}`;
}

/** Kebalikan pekanId. Null kalau bukan id mingguan, jadi pemanggil bisa membedakan tanpa menebak. */
export function parsePekanId(id) {
  const m = String(id || "").match(/^(\d{4}-\d{2})\|P(\d+)$/);
  return m ? { periode: m[1], pekan: Number(m[2]) } : null;
}
