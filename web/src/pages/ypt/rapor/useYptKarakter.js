import { useEffect, useMemo, useState } from "react";
import { supabase, fetchAllRows } from "../../../lib/supabase";
import { groupJenjang, JENJANG_GROUPS, arahTren, rataTertimbang, bulat } from "../yptMeta";
import { indikatorFallbackLabel, aspekFallbackLabel } from "../../karakter/karakterMeta";

/**
 * Data menu Rapor Karakter untuk dashboard Yayasan Pendidikan Telkom.
 *
 * Yang dibaca semuanya VIEW agregat yang dihitung di Postgres (migration 20260825120000):
 * ypt_k_sekolah, ypt_k_aspek, ypt_k_indikator, ypt_k_siswa_ekstrem. FIR tidak menghitung skor
 * (butir 3 CLAUDE.md); yang dilakukan di sini murni penyajian -- menggabungkan rata-rata sekolah
 * jadi angka jenjang/yayasan dengan bobot jumlah siswa, lalu mengurutkan.
 *
 * Pola fetch: sekali ambil penuh saat daftar sekolah berubah, lalu diiris ulang di useMemo tiap
 * periode berganti -- sama seperti useKarakterData.js, supaya ganti periode tidak memicu
 * roundtrip baru. ypt_k_indikator dan ypt_k_siswa_ekstrem ikut ditarik penuh karena keduanya
 * sudah teragregat di database (bukan baris murid mentah), jadi ukurannya wajar.
 */
export function useYptKarakter(session, periode) {
  const [state, setState] = useState({ loading: true, error: null, raw: null });
  const sekolahList = useMemo(() => session?.schools || [], [session]);
  const key = sekolahList.map((s) => s.id).join(",");

  useEffect(() => {
    let alive = true;
    const ids = sekolahList.map((s) => s.id);
    if (ids.length === 0) { setState({ loading: false, error: null, raw: null }); return; }

    async function run() {
      setState((s) => ({ ...s, loading: true, error: null }));

      // fetchAllRows dipakai di keempat query: lintas puluhan sekolah dan belasan periode, batas
      // diam-diam 1000 baris Supabase sangat mudah terlampaui dan akan memotong data tanpa error.
      const [sekolahRes, aspekRes, indikatorRes, siswaRes] = await Promise.all([
        fetchAllRows((from, to) => supabase.from("ypt_k_sekolah")
          .select("sekolah_id, periode_id, jumlah_siswa, rata_total")
          .in("sekolah_id", ids).range(from, to)),
        fetchAllRows((from, to) => supabase.from("ypt_k_aspek")
          .select("sekolah_id, periode_id, aspek_kode, aspek_label, jumlah_siswa, rata")
          .in("sekolah_id", ids).range(from, to)),
        fetchAllRows((from, to) => supabase.from("ypt_k_indikator")
          .select("sekolah_id, periode_id, aspek_kode, indikator_kode, indikator_label, jumlah_siswa, rata")
          .in("sekolah_id", ids).range(from, to)),
        fetchAllRows((from, to) => supabase.from("ypt_k_siswa_ekstrem")
          .select("sekolah_id, periode_id, nama_murid, kelas_id, total_persen, arah, peringkat")
          .in("sekolah_id", ids).range(from, to)),
      ]);

      if (!alive) return;

      const err = sekolahRes.error || aspekRes.error || indikatorRes.error || siswaRes.error;
      if (err) { setState({ loading: false, error: err.message, raw: null }); return; }

      setState({
        loading: false,
        error: null,
        raw: {
          sekolahRows: sekolahRes.data || [],
          aspekRows: aspekRes.data || [],
          indikatorRows: indikatorRes.data || [],
          siswaRows: siswaRes.data || [],
        },
      });
    }

    run();
    return () => { alive = false; };
  }, [key]);

  const data = useMemo(() => {
    if (!state.raw) return null;
    const { sekolahRows, aspekRows, indikatorRows, siswaRows } = state.raw;

    const metaBySekolah = {};
    sekolahList.forEach((s) => { metaBySekolah[s.id] = s; });

    // Periode pembanding untuk panah tren: periode berdata terdekat SEBELUM periode terpilih.
    // Sengaja "terdekat yang ada", bukan "bulan sebelumnya" -- kalau satu bulan tidak ada impor
    // sama sekali, membandingkan ke bulan kosong akan selalu memunculkan panah naik palsu.
    const semuaPeriode = Array.from(new Set(sekolahRows.map((r) => r.periode_id))).sort();
    const idxAktif = semuaPeriode.indexOf(periode);
    const periodeSebelum = idxAktif > 0 ? semuaPeriode[idxAktif - 1] : null;

    const sekolahAktif = sekolahRows.filter((r) => r.periode_id === periode);
    const sekolahSebelum = sekolahRows.filter((r) => r.periode_id === periodeSebelum);

    /** Baris sekolah + metadata (nama, jenjang, kota) untuk satu periode. */
    function gabungMeta(rows) {
      return rows
        .filter((r) => metaBySekolah[r.sekolah_id])
        .map((r) => ({
          ...r,
          nama: metaBySekolah[r.sekolah_id].nama,
          jenjang: metaBySekolah[r.sekolah_id].jenjang,
          kota: metaBySekolah[r.sekolah_id].kota,
          grup: groupJenjang(metaBySekolah[r.sekolah_id].jenjang),
        }));
    }

    const sekolah = gabungMeta(sekolahAktif);
    const sekolahLalu = gabungMeta(sekolahSebelum);

    // Sekolah yang TIDAK punya baris di periode ini tetap dibawa dengan rata_total null, supaya
    // tabel "Penilaian per Sekolah" bisa menampilkannya sebagai "belum ada data" alih-alih
    // menghilangkannya diam-diam atau menampilkannya sebagai 0%.
    const adaData = new Set(sekolah.map((r) => r.sekolah_id));
    const sekolahLengkap = [
      ...sekolah,
      ...sekolahList
        .filter((s) => !adaData.has(s.id))
        .map((s) => ({
          sekolah_id: s.id, periode_id: periode, jumlah_siswa: 0, rata_total: null,
          nama: s.nama, jenjang: s.jenjang, kota: s.kota, grup: groupJenjang(s.jenjang),
        })),
    ];

    const totalYayasan = bulat(rataTertimbang(sekolah, (r) => r.rata_total, (r) => r.jumlah_siswa));

    // ── Empat kartu jenjang ────────────────────────────────────────────────────────────────
    const jenjang = JENJANG_GROUPS.map((g) => {
      const anggota = sekolah.filter((r) => r.grup === g.id);
      const anggotaLalu = sekolahLalu.filter((r) => r.grup === g.id);
      const nilai = bulat(rataTertimbang(anggota, (r) => r.rata_total, (r) => r.jumlah_siswa));
      const nilaiLalu = bulat(rataTertimbang(anggotaLalu, (r) => r.rata_total, (r) => r.jumlah_siswa));
      return {
        ...g,
        nilai,
        // Jumlah sekolah dihitung dari SELURUH sekolah jenjang itu di yayasan, bukan cuma yang
        // punya data periode ini -- "12 Sekolah" di kartu adalah fakta tentang yayasan, bukan
        // tentang kelengkapan impor bulan ini.
        jumlahSekolah: sekolahList.filter((s) => groupJenjang(s.jenjang) === g.id).length,
        jumlahSiswa: anggota.reduce((a, r) => a + (r.jumlah_siswa || 0), 0),
        tren: arahTren(nilai, nilaiLalu),
      };
    });

    // ── Aspek karakter, dicocokkan antar sekolah lewat NAMA aspek ─────────────────────────
    // aspek_kode (K1, K2, ...) tidak konsisten antar sekolah, jadi pengelompokannya pakai label.
    // Sekolah yang labelnya belum terisi di karakter_aspek_config jatuh ke fallback yang sama
    // dengan tampilan Karakter biasa ("karakter1" -> "Karakter 1", sesuai mockup) -- lebih baik
    // tampil dengan nama generik yang rapi daripada kode mentah atau hilang dari agregat.
    const aspekAktif = aspekRows.filter((r) => r.periode_id === periode);
    function namaAspek(r) {
      return (r.aspek_label || "").trim() || aspekFallbackLabel(r.aspek_kode);
    }
    function aspekPerGrup(grupId) {
      const anggota = aspekAktif.filter((r) => {
        const meta = metaBySekolah[r.sekolah_id];
        return meta && (grupId == null || groupJenjang(meta.jenjang) === grupId);
      });
      const byNama = {};
      anggota.forEach((r) => {
        const nama = namaAspek(r);
        if (!nama) return;
        (byNama[nama] ||= []).push(r);
      });
      return Object.entries(byNama)
        .map(([nama, rows]) => ({
          nama,
          nilai: bulat(rataTertimbang(rows, (r) => r.rata, (r) => r.jumlah_siswa)),
          jumlahSekolah: new Set(rows.map((r) => r.sekolah_id)).size,
        }))
        .filter((a) => a.nilai != null)
        .sort((a, b) => b.jumlahSekolah - a.jumlahSekolah || a.nama.localeCompare(b.nama));
    }

    const aspekYayasan = aspekPerGrup(null);

    // Kolom "Karakter 1..6" di tabel per sekolah = aspek yang paling banyak dipakai sekolah,
    // maksimal 6 (batas yang digambar Figma). Aspek di luar enam besar tidak ditampilkan sebagai
    // kolom; nilainya tetap ikut menghitung rata_total sekolah.
    const kolomAspek = aspekYayasan.slice(0, 6).map((a) => a.nama);

    const aspekPerSekolah = {};
    aspekAktif.forEach((r) => {
      const nama = namaAspek(r);
      if (!nama) return;
      (aspekPerSekolah[r.sekolah_id] ||= {})[nama] = r.rata;
    });

    // ── Indikator per jenjang ─────────────────────────────────────────────────────────────
    // Banyak sekolah Telkom belum punya karakter_indikator_config.indikator_label terisi (baris
    // mentah menunjukkan ini bukan kasus langka) -- SEBELUMNYA baris tanpa label DIBUANG total,
    // membuat blok Top 5 Indikator kosong walau datanya sebenarnya ada. Sekarang dipakai fallback
    // yang sama seperti tampilan Karakter per-sekolah: turunkan label dari indikator_kode sendiri
    // (mis. "indikator1_menyampaikan_informasi_sebenarnya" -> "Menyampaikan Informasi Sebenarnya"),
    // bukan menyembunyikan data cuma karena admin belum sempat mengisi label rapinya.
    const indikatorAktif = indikatorRows.filter((r) => r.periode_id === periode);
    function indikatorPerGrup(grupId) {
      const anggota = indikatorAktif.filter((r) => {
        const meta = metaBySekolah[r.sekolah_id];
        return meta && groupJenjang(meta.jenjang) === grupId;
      });
      const byLabel = {};
      anggota.forEach((r) => {
        const label = (r.indikator_label || "").trim() || indikatorFallbackLabel(r.aspek_kode, r.indikator_kode);
        (byLabel[label] ||= []).push(r);
      });
      return Object.entries(byLabel)
        .map(([label, rows]) => ({
          label,
          nilai: bulat(rataTertimbang(rows, (r) => r.rata, (r) => r.jumlah_siswa)),
        }))
        .filter((r) => r.nilai != null);
    }

    // ── Siswa ekstrem per sekolah ─────────────────────────────────────────────────────────
    const siswaAktif = siswaRows.filter((r) => r.periode_id === periode);
    const siswaPerSekolah = {};
    siswaAktif.forEach((r) => {
      const bucket = (siswaPerSekolah[r.sekolah_id] ||= { atas: [], bawah: [] });
      bucket[r.arah]?.push(r);
    });
    Object.values(siswaPerSekolah).forEach((b) => {
      b.atas.sort((a, z) => a.peringkat - z.peringkat);
      b.bawah.sort((a, z) => a.peringkat - z.peringkat);
    });

    // ── Peringkat sekolah ─────────────────────────────────────────────────────────────────
    const berperingkat = [...sekolah].sort((a, b) => (b.rata_total ?? -1) - (a.rata_total ?? -1));

    // ── Kota untuk peta ───────────────────────────────────────────────────────────────────
    const kotaMap = {};
    sekolahLengkap.forEach((r) => {
      const kota = r.kota;
      if (!kota) return;
      (kotaMap[kota] ||= []).push(r);
    });
    const kota = Object.entries(kotaMap).map(([nama, rows]) => ({
      nama,
      sekolah: rows.slice().sort((a, b) => (b.rata_total ?? -1) - (a.rata_total ?? -1)),
      nilai: bulat(rataTertimbang(rows, (r) => r.rata_total, (r) => r.jumlah_siswa)),
      jumlahSekolah: rows.length,
    })).sort((a, b) => a.nama.localeCompare(b.nama));

    // Sekolah tanpa kota: tidak bisa jadi marker, tapi juga tidak boleh hilang.
    const tanpaKota = sekolahLengkap.filter((r) => !r.kota);

    return {
      periode,
      periodeSebelum,
      totalYayasan,
      jenjang,
      aspekYayasan,
      aspekPerGrup,
      kolomAspek,
      aspekPerSekolah,
      indikatorPerGrup,
      siswaPerSekolah,
      sekolah,
      sekolahLengkap,
      berperingkat,
      kota,
      tanpaKota,
    };
  }, [state.raw, periode, sekolahList]);

  return { loading: state.loading, error: state.error, data };
}
