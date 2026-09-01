import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const TARGET_ROLE_BY_PERAN = {
  WaliKelas: "wali_kelas",
  KepalaSekolah: "kepala_sekolah",
  WakilKepalaSekolah: "kepala_sekolah",
  OrangTua: "orang_tua",
  Yayasan: "yayasan",
};

/**
 * Daftar periode_id ("YYYY-MM") yang benar-benar punya data untuk peran ini, urut dari
 * terbaru, supaya PeriodPicker di Header tidak menampilkan bulan yang datanya belum ada --
 * ATAU sebaliknya, menyembunyikan bulan yang briefing/tindak-lanjutnya sudah disetujui tapi
 * kebetulan karakter_summary-nya belum lengkap. Digabung dari karakter_summary, briefing, DAN
 * tindak_lanjut (bukan cuma summary seperti sebelumnya), supaya tiap tabel yang datanya duluan
 * tayang tetap bisa dijangkau lewat picker.
 * Cakupannya mengikuti peran: Wali Kelas → periode kelas-kelasnya (scope "kelas"),
 * Yayasan → gabungan periode semua sekolah di bawah yayasannya, peran lain → sekolahnya.
 */
export function useAvailablePeriods(session) {
  const [periods, setPeriods] = useState([]);
  const cakupanKey = Array.isArray(session?.cakupan) ? session.cakupan.join("|") : "";

  useEffect(() => {
    let alive = true;
    const setUnion = (...rowArrays) => {
      if (!alive) return;
      const set = new Set();
      rowArrays.forEach((rows) => (rows || []).forEach((r) => { if (r.periode_id) set.add(r.periode_id); }));
      setPeriods(Array.from(set).sort((a, b) => (a > b ? -1 : 1)));
    };

    const peran = session?.peran;
    const cakupan = Array.isArray(session?.cakupan) ? session.cakupan.filter(Boolean) : [];
    const targetRole = TARGET_ROLE_BY_PERAN[peran] || null;

    if (peran === "Yayasan") {
      // Yayasan tidak punya school_id sendiri: ambil sekolah di bawah yayasannya dulu.
      const yayasanId = cakupan[0];
      if (!yayasanId) { setPeriods([]); return () => { alive = false; }; }
      (async () => {
        const { data: sekolahRows } = await supabase
          .from("schools").select("id").eq("yayasan_id", yayasanId).eq("aktif", true);
        const ids = (sekolahRows || []).map((s) => s.id);
        if (!alive || ids.length === 0) { if (alive) setPeriods([]); return; }
        const [summaryRes, briefingRes, tlRes] = await Promise.all([
          supabase.from("karakter_summary").select("periode_id").eq("scope", "sekolah").in("sekolah_id", ids),
          supabase.from("briefing").select("periode_id").eq("modul", "karakter").eq("scope", "sekolah")
            .in("sekolah_id", ids).eq("status", "disetujui"),
          supabase.from("tindak_lanjut").select("periode_id").eq("modul", "karakter").eq("scope", "sekolah")
            .in("sekolah_id", ids).eq("status", "disetujui").eq("target_role", targetRole),
        ]);
        setUnion(summaryRes.data, briefingRes.data, tlRes.data);
      })();
      return () => { alive = false; };
    }

    const schoolId = session?.school_id;
    const hasKarakter = (session?.modules || []).includes("karakter");
    if (!schoolId || !hasKarakter || !targetRole) { setPeriods([]); return () => { alive = false; }; }

    const isWaliKelas = peran === "WaliKelas" && cakupan.length > 0;
    const scope = isWaliKelas ? "kelas" : "sekolah";

    (async () => {
      // Ringkasan: untuk peran tingkat sekolah, TIDAK disaring ke scope='sekolah'.
      //
      // Sekolah yang tiap jenjangnya punya kerangka karakter berbeda TIDAK PERNAH punya baris
      // scope='sekolah': berkasnya memuat satu sheet ringkasan "sekolah" per jenjang, dan
      // importer sengaja melewatkan semuanya karena kalau dimasukkan keenamnya saling menimpa
      // (lihat ringkasanSekolahJamak di karakterImporter.js).
      //
      // Dengan filter scope='sekolah', daftar periode sekolah seperti itu KOSONG, sehingga
      // App.jsx tidak pernah mengganti periode bawaan dan header terus menampilkan bulan
      // bawaan yang bukan periode mana pun. Terlaporkan dari produksi 2026-08-31: SD Amal Mulia
      // punya data Agustus 2026 tapi pemilih periodenya tidak pernah menawarkannya.
      //
      // Sekolah punya data di satu periode kalau ADA ringkasan apa pun untuk periode itu, scope
      // mana pun. Wali Kelas tetap disaring ke kelas cakupannya.
      let sq = supabase.from("karakter_summary").select("periode_id").eq("sekolah_id", schoolId);
      if (isWaliKelas) sq = sq.eq("scope", scope);
      let bq = supabase.from("briefing").select("periode_id")
        .eq("sekolah_id", schoolId).eq("modul", "karakter").eq("scope", scope).eq("status", "disetujui");
      let tq = supabase.from("tindak_lanjut").select("periode_id")
        .eq("sekolah_id", schoolId).eq("modul", "karakter").eq("scope", scope).eq("status", "disetujui")
        .eq("target_role", targetRole);
      if (isWaliKelas) {
        sq = sq.in("scope_id", cakupan);
        bq = bq.in("scope_id", cakupan);
        tq = tq.in("scope_id", cakupan);
      }
      // Periode yang benar-benar punya SKOR, bahkan kalau ringkasan/briefing/tindak lanjutnya
      // belum ada sama sekali. Satu baris per (periode, sumber), jadi ringan. Errornya tidak
      // dianggap fatal: view ini baru ada sejak migration 20260828120000, dan kalau frontend
      // tayang lebih dulu, daftar periode cukup jatuh ke tiga sumber di atas.
      const iq = supabase.from("karakter_sekolah_indeks").select("periode_id").eq("sekolah_id", schoolId);

      const [summaryRes, briefingRes, tlRes, indeksRes] = await Promise.all([sq, bq, tq, iq]);
      setUnion(summaryRes.data, briefingRes.data, tlRes.data, indeksRes.data);
    })();

    return () => { alive = false; };
  }, [session?.school_id, session?.peran, cakupanKey]);

  return periods;
}
