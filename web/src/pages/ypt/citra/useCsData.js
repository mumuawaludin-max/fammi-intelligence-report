import { useEffect, useMemo, useState } from "react";
import { supabase, fetchAllRows } from "../../../lib/supabase";
import { groupJenjang, JENJANG_GROUPS, bulat } from "../yptMeta";
import {
  HAL_DISYUKURI_OPTIONS, DUKUNGAN_OPTIONS, countMultiValue, countEmosi,
  matchedOptions, isBlankEssay,
} from "../../karakter/karakterMeta";

/**
 * Data menu Citra Sekolah, tab Keberhasilan/Dukungan/Emosi.
 *
 * PEMETAAN KOLOM (dikoreksi 2026-08-26 setelah verifikasi langsung terhadap data produksi):
 *   Keberhasilan Sekolah -> hal_disyukuri (BUKAN kategori_pernyataan seperti dugaan awal).
 *     Label 9 kartu Figma ("Tumbuh Kebiasaan Positif", "Kepedulian Sekolah", dst) cocok persis
 *     dengan HAL_DISYUKURI_OPTIONS di karakterMeta.js, dan voiceTabs di REFLEKSI_META bahkan
 *     sudah menamai tab itu "Keberhasilan Sekolah di Mata Orang Tua" -- persis judul Figma.
 *   Bentuk Dukungan       -> dukungan_dibutuhkan, opsi DUKUNGAN_OPTIONS (8 kartu, sudah cocok).
 *   Emosi Anak            -> emosi_anak, SINGLE-select (bukan multi), dihitung lewat countEmosi.
 *   kategori_pernyataan TIDAK dipakai sama sekali di menu ini -- itu sumber untuk voiceTab
 *   "testimoni" di tampilan Karakter biasa, sedangkan tab Testimoni YPT (2d) sumbernya spreadsheet
 *   terpisah sesuai keputusan pemilik produk, bukan kolom ini.
 *
 * Ketiga kolom (hal_disyukuri, dukungan_dibutuhkan) MULTI-PILIH tersimpan sebagai satu string
 * gabungan koma (lihat komentar panjang di karakterMeta.js baris ~320) -- TIDAK bisa di-GROUP BY
 * apa adanya di SQL, harus dicocokkan per opsi kanonik lewat countMultiValue/matchedOptions.
 * Fungsi-fungsi itu DIPAKAI ULANG dari karakterMeta.js (bukan ditulis ulang di sini) supaya
 * kategorisasi YPT selalu konsisten dengan tampilan Karakter per-sekolah yang sudah ada dan
 * sudah divalidasi terhadap data asli.
 *
 * Volume data (satu baris per murid per periode, bukan per aspek) cukup kecil untuk ditarik
 * mentah dan dihitung di klien -- diuji langsung: ~1-2 detik untuk 26 sekolah satu periode, jauh
 * di bawah batas timeout. Tidak perlu view/materialized view seperti Rapor Karakter.
 */

const KOSONG = { keberhasilan: [], dukungan: [], emosi: [] };

export function useCsData(session, periode) {
  const [state, setState] = useState({ loading: true, error: null, rows: [], testimoni: [] });
  const sekolahList = useMemo(() => session?.schools || [], [session]);
  const key = sekolahList.map((s) => s.id).join(",");

  useEffect(() => {
    let alive = true;
    const ids = sekolahList.map((s) => s.id);
    if (ids.length === 0 || !periode) {
      setState({ loading: false, error: null, rows: [], testimoni: [] });
      return;
    }

    async function run() {
      setState((s) => ({ ...s, loading: true, error: null }));

      const [pernyataanRes, testiRes] = await Promise.all([
        fetchAllRows((from, to) => supabase.from("karakter_pernyataan_ortu")
          .select("sekolah_id, periode_id, sumber, murid_id, nama_murid, kelas_id, hal_disyukuri, dukungan_dibutuhkan, dukungan_lainnya, emosi_anak, alasan_emosi")
          .in("sekolah_id", ids).eq("periode_id", periode).range(from, to)),
        fetchAllRows((from, to) => supabase.from("cs_testimoni")
          .select("id, sekolah_id, periode_id, nama, kelas, kategori, teks")
          .in("sekolah_id", ids).eq("periode_id", periode).eq("tampilkan", true)
          .order("submitted_at", { ascending: false }).range(from, to)),
      ]);

      if (!alive) return;
      if (pernyataanRes.error) {
        setState({ loading: false, error: pernyataanRes.error.message, rows: [], testimoni: [] });
        return;
      }

      setState({
        loading: false,
        error: null,
        rows: pernyataanRes.data || [],
        testimoni: testiRes.error ? [] : (testiRes.data || []),
      });
    }

    run();
    return () => { alive = false; };
  }, [key, periode]);

  const data = useMemo(() => {
    const metaBySekolah = {};
    sekolahList.forEach((s) => { metaBySekolah[s.id] = s; });

    // Refleksi orang tua saja -- menu ini bernama "di Mata Orangtua". Baris lama sebelum fitur
    // multi-sumber (sumber NULL) dianggap orang tua, sama seperti konvensi REFLEKSI_META.
    const ortu = state.rows.filter((r) => !r.sumber || r.sumber === "orangtua");

    if (ortu.length === 0) return { ...KOSONG, testimoniByKategori: {}, totalTestimoni: 0 };

    /**
     * Ringkas satu field multi-pilih pakai countMultiValue yang sudah ada, DITAMBAH breakdown
     * per jenjang -- dihitung dengan cara yang sama, cuma pada subset baris per jenjang.
     */
    function ringkasMulti(field, options) {
      const { items, totalWithAnswer } = countMultiValue(ortu, field, options);
      return items.map((it) => {
        const perJenjang = JENJANG_GROUPS.map((g) => {
          const anggota = ortu.filter((r) => groupJenjang(metaBySekolah[r.sekolah_id]?.jenjang) === g.id);
          const { items: subItems, totalWithAnswer: subTotal } = countMultiValue(anggota, field, options);
          const subCount = subItems.find((s) => s.label === it.label)?.count || 0;
          return { id: g.id, label: g.label, persen: subTotal > 0 ? bulat((subCount / subTotal) * 100) : null };
        });
        return {
          nama: it.label,
          jumlah: it.count,
          persen: totalWithAnswer > 0 ? bulat((it.count / totalWithAnswer) * 100) : null,
          perJenjang,
        };
      }).sort((a, b) => b.jumlah - a.jumlah);
    }

    /** Sama seperti ringkasMulti, tapi untuk emosi_anak yang single-select (countEmosi). */
    function ringkasEmosi() {
      const { items, total } = countEmosi(ortu, "emosi_anak");
      return items.map((it) => {
        const perJenjang = JENJANG_GROUPS.map((g) => {
          const anggota = ortu.filter((r) => groupJenjang(metaBySekolah[r.sekolah_id]?.jenjang) === g.id);
          const { items: subItems, total: subTotal } = countEmosi(anggota, "emosi_anak");
          const subCount = subItems.find((s) => s.label === it.label)?.count || 0;
          return { id: g.id, label: g.label, persen: subTotal > 0 ? bulat((subCount / subTotal) * 100) : null };
        });
        return {
          nama: it.label, jumlah: it.count,
          persen: total > 0 ? bulat((it.count / total) * 100) : null,
          perJenjang, tone: it.tone, icon: it.icon,
        };
      });
    }

    const testimoniByKategori = {};
    state.testimoni.forEach((t) => {
      if (!t.teks || !t.teks.trim()) return;
      const meta = metaBySekolah[t.sekolah_id];
      (testimoniByKategori[t.kategori] ||= []).push({ ...t, sekolahNama: meta?.nama || t.sekolah_id });
    });

    return {
      keberhasilan: ringkasMulti("hal_disyukuri", HAL_DISYUKURI_OPTIONS),
      dukungan: ringkasMulti("dukungan_dibutuhkan", DUKUNGAN_OPTIONS),
      emosi: ringkasEmosi(),
      testimoniByKategori,
      totalTestimoni: state.testimoni.filter((t) => t.teks?.trim()).length,
    };
  }, [state.rows, state.testimoni, sekolahList]);

  /**
   * Esai untuk kategori terpilih. topik "keberhasilan" TIDAK punya esai bebas (hal_disyukuri
   * tidak punya kolom teks bebas terpisah -- sama seperti tampilan Karakter per-sekolah yang
   * sudah ada, dan Figma 2a memang tidak menggambar blok esai untuk tab ini). Dipanggil sisi
   * klien dari data yang sudah ditarik (bukan query baru), karena volumenya sudah kecil.
   * Tetap async (walau tidak ada await di dalamnya) supaya kontrak `.then(...)` di EsaiBlok.jsx
   * tidak perlu berubah -- pemanggilnya tidak perlu tahu ini sinkron di balik layar.
   */
  async function ambilEsai(topik, kategori, batas = 10) {
    if (!kategori) return [];
    const metaBySekolah = {};
    sekolahList.forEach((s) => { metaBySekolah[s.id] = s; });
    const ortu = state.rows.filter((r) => !r.sumber || r.sumber === "orangtua");

    let field, options, esaiField;
    if (topik === "dukungan") { field = "dukungan_dibutuhkan"; options = DUKUNGAN_OPTIONS; esaiField = "dukungan_lainnya"; }
    else if (topik === "emosi") { field = "emosi_anak"; esaiField = "alasan_emosi"; }
    else return [];

    return ortu
      .filter((r) => {
        if (isBlankEssay(r[esaiField])) return false;
        if (field === "emosi_anak") return (r.emosi_anak || "").trim() === kategori;
        return matchedOptions(r[field], options).some((o) => o.label === kategori);
      })
      .slice(0, batas)
      .map((r) => ({
        nama: r.nama_murid,
        kelas: r.kelas_id,
        sekolahNama: metaBySekolah[r.sekolah_id]?.nama || r.sekolah_id,
        teks: r[esaiField],
      }));
  }

  return { loading: state.loading, error: state.error, data, ambilEsai };
}
