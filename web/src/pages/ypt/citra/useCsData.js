import { useEffect, useMemo, useState } from "react";
import { supabase, fetchAllRows } from "../../../lib/supabase";
import {
  groupJenjang, JENJANG_GROUPS, bulat,
  CS_TESTIMONI_KATEGORI, CS_KATEGORI_PERLU_RESPONS, CS_SUMBER,
  warnaKategoriTestimoni, labelKategoriTestimoni, sumberDariNama,
} from "../yptMeta";
import { tokenisasi } from "./analisaKata";
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

/** Apakah satu testimoni membawa label yang menuntut respons sekolah. */
function perluRespons(kategori) {
  return kategori.some((k) => CS_KATEGORI_PERLU_RESPONS.includes(k));
}

/**
 * Ringkas testimoni spreadsheet jadi bentuk siap tampil: daftar barisnya sendiri, sebaran per
 * kategori, per jenjang, dan per sekolah.
 *
 * Kategorinya TUMPANG TINDIH, satu testimoni bisa membawa dua sampai empat label. Karena itu
 * `jumlah` tiap kategori dijumlahkan dari label, sedangkan `persen` selalu dibagi TOTAL TESTIMONI,
 * bukan total label. Konsekuensinya kelima persen itu berjumlah lebih dari 100%, dan memang harus
 * begitu; angka ini menjawab "berapa persen testimoni yang menyinggung X", bukan "berapa potongan
 * pie X". Tampilan wajib memakai bar, jangan pernah pie atau donut untuk angka ini.
 *
 * Token word cloud dihitung SEKALI di sini, bukan tiap kali kategori diganti. Diukur pada data
 * produksi: menokenisasi ulang 13.013 testimoni makan ~380 ms, sedangkan menghitung frekuensi
 * dari token yang sudah jadi tinggal ~30 ms per kategori.
 */
export function ringkasTestimoni(baris, metaBySekolah) {
  const rows = (baris || [])
    .filter((t) => t.teks && t.teks.trim())
    .map((t) => {
      const meta = metaBySekolah[t.sekolah_id];
      return {
        id: t.id,
        sekolahId: t.sekolah_id,
        sekolahNama: meta?.nama || t.sekolah_id,
        jenjang: groupJenjang(meta?.jenjang),
        kelas: t.kelas,
        nama: t.nama,
        // Kolom sumber diisi Edge Function sejak migrasi 20260827100000. Baris yang tersimpan
        // sebelum itu bernilai null, jadi diturunkan di sini dari nama dengan aturan yang sama
        // persis. Jembatan sampai sinkronisasi berikutnya jalan, bukan logika permanen.
        sumber: t.sumber || sumberDariNama(t.nama),
        // Kolom kategori bertipe text[] sejak migrasi 20260827100000. Baris yang tersimpan sebelum
        // migrasi dijalankan masih berupa string tunggal, jadi keduanya diterima di sini.
        kategori: Array.isArray(t.kategori) ? t.kategori : (t.kategori ? [t.kategori] : []),
        teks: t.teks,
        token: tokenisasi(t.teks),
      };
    });

  return { testimoni: rows, ...statistikTestimoni(rows) };
}

/**
 * Sebaran testimoni per kategori, jenjang, sekolah, dan penulis.
 *
 * Terpisah dari pemetaan baris supaya tampilan bisa MENGHITUNG ULANG seluruh grafik untuk subset
 * yang sedang disaring, memakai kode yang sama persis dengan angka periode penuh. Tanpa ini,
 * menyaring "cuma suara siswa" akan menyisakan grafik yang masih menggambarkan semua orang.
 *
 * @param {object[]} rows            hasil pemetaan di ringkasTestimoni
 * @param {string[]} urutanKategori  urutan kategori yang dipaksakan, biasanya urutan periode
 *                                   penuh. Diteruskan supaya bar tidak berganti posisi setiap
 *                                   kali saringan berubah, yang membuat perbandingan mustahil.
 */
export function statistikTestimoni(rows, urutanKategori) {
  const total = rows.length;

  // Urutan kategori: yang dikenal lebih dulu mengikuti skala nada di CS_TESTIMONI_KATEGORI, label
  // asing dari opsi form baru menyusul di belakang. Sengaja tidak dibuang, supaya opsi yang
  // ditambahkan tanpa memberi tahu siapa pun langsung kelihatan di dashboard.
  const dikenal = CS_TESTIMONI_KATEGORI.map((k) => k.id);
  let urutan = urutanKategori;
  if (!urutan) {
    const hadir = new Set();
    rows.forEach((r) => r.kategori.forEach((k) => hadir.add(k)));
    urutan = [
      ...dikenal.filter((id) => hadir.has(id)),
      ...[...hadir].filter((id) => !dikenal.includes(id)).sort(),
    ];
  }

  const hitung = {};
  urutan.forEach((id) => { hitung[id] = 0; });
  rows.forEach((r) => r.kategori.forEach((k) => { hitung[k] += 1; }));

  const kategori = urutan.map((id) => ({
    id,
    label: labelKategoriTestimoni(id),
    // warna = isian, warnaTeks = teks di atas putih, warnaIsi = teks di atas isian itu sendiri.
    // Lihat catatan panjang di CS_TESTIMONI_KATEGORI soal kenapa ketiganya tidak bisa satu nilai.
    ...warnaKategoriTestimoni(id),
    jumlah: hitung[id],
    persen: total > 0 ? bulat((hitung[id] / total) * 100) : null,
    dikenal: dikenal.includes(id),
  }));

  const perJenjang = JENJANG_GROUPS.map((g) => {
    const anggota = rows.filter((r) => r.jenjang === g.id);
    const per = {};
    urutan.forEach((id) => { per[id] = 0; });
    anggota.forEach((r) => r.kategori.forEach((k) => { per[k] += 1; }));
    return { id: g.id, label: g.label, total: anggota.length, perKategori: per };
  }).filter((g) => g.total > 0);

  const petaSekolah = new Map();
  rows.forEach((r) => {
    let s = petaSekolah.get(r.sekolahId);
    if (!s) {
      s = { id: r.sekolahId, nama: r.sekolahNama, jenjang: r.jenjang, total: 0, perlu: 0 };
      petaSekolah.set(r.sekolahId, s);
    }
    s.total += 1;
    if (perluRespons(r.kategori)) s.perlu += 1;
  });

  const perSekolah = [...petaSekolah.values()]
    .map((s) => ({ ...s, persenPerlu: s.total > 0 ? bulat((s.perlu / s.total) * 100) : null }))
    .sort((a, b) => b.total - a.total);

  /**
   * Sebaran penulis: orang tua sendiri atau siswanya. Dipecah lagi per kategori, karena di situ
   * nilainya. Diperiksa pada data produksi: TK dan SD murni suara orang tua sedangkan SMP dan SMK
   * sebagian besar suara siswa, jadi angka keluhan gabungan sebenarnya menjawab dua pertanyaan
   * berbeda tergantung jenjang, dan tanpa pemisahan ini yayasan tidak bisa tahu yang mana.
   */
  const perSumber = CS_SUMBER.map((s) => {
    const anggota = rows.filter((r) => r.sumber === s.id);
    const per = {};
    urutan.forEach((id) => { per[id] = 0; });
    anggota.forEach((r) => r.kategori.forEach((k) => { per[k] += 1; }));
    return {
      id: s.id,
      label: s.label,
      warna: s.warna,
      total: anggota.length,
      persen: total > 0 ? bulat((anggota.length / total) * 100) : null,
      perlu: anggota.filter((r) => perluRespons(r.kategori)).length,
      perKategori: per,
    };
  });

  return {
    urutanKategori: urutan,
    testimoniKategori: kategori,
    testimoniPerJenjang: perJenjang,
    testimoniPerSekolah: perSekolah,
    testimoniPerSumber: perSumber,
    totalTestimoni: total,
    testimoniPerluRespons: rows.filter((r) => perluRespons(r.kategori)).length,
  };
}

export function useCsData(session, periode) {
  const [state, setState] = useState({ loading: true, error: null, errorTestimoni: null, rows: [], testimoni: [] });
  const sekolahList = useMemo(() => session?.schools || [], [session]);
  const key = sekolahList.map((s) => s.id).join(",");

  useEffect(() => {
    let alive = true;
    const ids = sekolahList.map((s) => s.id);
    if (ids.length === 0 || !periode) {
      setState({ loading: false, error: null, errorTestimoni: null, rows: [], testimoni: [] });
      return;
    }

    async function run() {
      setState((s) => ({ ...s, loading: true, error: null, errorTestimoni: null }));

      const [pernyataanRes, testiRes] = await Promise.all([
        fetchAllRows((from, to) => supabase.from("karakter_pernyataan_ortu")
          .select("sekolah_id, periode_id, sumber, murid_id, nama_murid, kelas_id, hal_disyukuri, dukungan_dibutuhkan, dukungan_lainnya, emosi_anak, alasan_emosi")
          .in("sekolah_id", ids).eq("periode_id", periode).range(from, to)),
        fetchAllRows((from, to) => supabase.from("cs_testimoni")
          .select("id, sekolah_id, periode_id, nama, kelas, kategori, sumber, teks")
          .in("sekolah_id", ids).eq("periode_id", periode).eq("tampilkan", true)
          // Diurutkan submitted_at LALU id. Tanpa pemecah seri yang unik, urutan baris berwaktu
          // sama tidak terdefinisi antar halaman, dan fetchAllRows menarik per 1.000 baris lewat
          // LIMIT/OFFSET terpisah. Serinya besar dan nyata: 843 baris spreadsheet ditulis
          // "April , 2026" tanpa tanggal, sehingga submitted_at-nya identik sampai milidetik.
          // Akibatnya satu baris bisa muncul dua kali sementara baris lain tidak pernah terambil.
          .order("submitted_at", { ascending: false })
          .order("id", { ascending: true })
          .range(from, to)),
      ]);

      if (!alive) return;
      if (pernyataanRes.error) {
        setState({ loading: false, error: pernyataanRes.error.message, errorTestimoni: null, rows: [], testimoni: [] });
        return;
      }

      // Kegagalan testimoni SENGAJA tidak membatalkan seluruh menu: sumbernya tabel lain, dan
      // tiga tab refleksi harus tetap tampil. Tapi galatnya DIBAWA, bukan dibuang. Tanpa itu,
      // query yang gagal tidak bisa dibedakan dari periode yang memang belum ada testimoninya,
      // dan tab Testimoni menyuruh operator mengisi spreadsheet yang sebenarnya sudah terisi.
      setState({
        loading: false,
        error: null,
        errorTestimoni: testiRes.error ? testiRes.error.message : null,
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

    // Testimoni diringkas LEBIH DULU dan terpisah dari refleksi. Sumbernya tabel lain (cs_testimoni
    // dari spreadsheet, bukan karakter_pernyataan_ortu), jadi periode yang punya testimoni tapi
    // belum punya impor refleksi tetap harus menampilkan tab Testimoni. Versi sebelumnya keluar
    // lebih awal di sini dan ikut mengosongkan testimoninya.
    const testi = ringkasTestimoni(state.testimoni, metaBySekolah);

    if (ortu.length === 0) return { ...KOSONG, ...testi };

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

    return {
      keberhasilan: ringkasMulti("hal_disyukuri", HAL_DISYUKURI_OPTIONS),
      dukungan: ringkasMulti("dukungan_dibutuhkan", DUKUNGAN_OPTIONS),
      emosi: ringkasEmosi(),
      ...testi,
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

  return { loading: state.loading, error: state.error, errorTestimoni: state.errorTestimoni, data, ambilEsai };
}
