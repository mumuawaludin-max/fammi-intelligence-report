import { useEffect, useMemo, useState } from "react";
import { supabase, fetchAllRows } from "../../lib/supabase";
import { withAspekColor, latestPeriode, indikatorFallbackLabel, resolveAspekList, aspekConfigJenjang, indikatorConfigJenjang, aspekKodeFromRingkasan, aspekLabelFromRingkasan, REFLEKSI_META, REFLEKSI_SUMBER_URUTAN, resolveSummaryKey, pct } from "./karakterMeta";

/**
 * Susun baris berbentuk karakter_summary dari agregat PER PEKAN.
 *
 * Seluruh tampilan Kepala Sekolah membaca `ringkasan`, objek apa adanya dari sheet ringkasan
 * sekolah. Sheet itu cuma punya angka bulanan, jadi memilih satu pekan berarti tidak ada
 * ringkasan yang bisa dibaca. Alih-alih merombak setiap komponen supaya menerima bentuk kedua,
 * di sini disusun objek dengan KUNCI YANG SAMA dari view per pekan. Tampilannya tidak berubah
 * sebaris pun, dan tidak ada dua jalur render yang harus dirawat berdua.
 *
 * Kunci yang ditiru mengikuti kontrak ringkasanAspekValue (mencari kunci berawalan
 * `${prefix}${aspek_kode}_`) dan parseTop5Pair (memecah teks per baris).
 *
 * `pencapaian_guru` SENGAJA tidak diisi. Itu porsi murid yang sudah dinilai, dan porsi butuh
 * penyebut: berapa murid yang SEHARUSNYA dinilai. Data pekanan cuma tahu berapa yang sudah,
 * tidak tahu berapa yang seharusnya. Mengarangnya dari jumlah murid yang muncul akan selalu
 * menghasilkan 100% dan itu klaim yang tidak berdasar; dibiarkan kosong, tampilan menulis "—".
 */
function ringkasanDariPekan({ pekanRows, aspekRows, muridRows, periode, pekan }) {
  const cocok = (r) => r.periode_id === periode && r.pekan === pekan;
  const rataAspekPrefix = { kelas: "input_guru_", jenjang: "rata_input_guru_", sekolah: "rata_input_guru_" };

  // Aspek per kelas, dipakai baik untuk baris kelas maupun untuk menyusun ulang baris jenjang.
  const aspekPerKelas = {};
  (aspekRows || []).filter(cocok).forEach((r) => {
    (aspekPerKelas[r.kelas_id] ||= []).push(r);
  });

  const muridPerKelas = {};
  (muridRows || []).filter(cocok).forEach((r) => {
    (muridPerKelas[r.kelas_id] ||= []).push(r);
  });

  /** Dua kolom top5 berpasangan: nama dipisah baris, nilainya juga, urutannya harus sejajar. */
  const top5 = (list, arah) => {
    const urut = [...list].sort((a, b) => (arah === "atas" ? b.rata - a.rata : a.rata - b.rata)).slice(0, 5);
    return {
      nama: urut.map((m) => m.nama_murid || m.murid_id).join("\n"),
      nilai: urut.map((m) => `${m.rata}%`).join("\n"),
    };
  };

  const barisKelas = (pekanRows || []).filter(cocok).map((r) => {
    const ringkasan = {
      jenjang: r.jenjang,
      total_siswa: r.jumlah_murid,
      rata_rata_pencapaian_guru: r.rata,
    };
    (aspekPerKelas[r.kelas_id] || []).forEach((a) => {
      ringkasan[`${rataAspekPrefix.kelas}${a.aspek_kode}_pekan`] = a.rata;
    });
    const murid = muridPerKelas[r.kelas_id] || [];
    if (murid.length > 0) {
      const atas = top5(murid, "atas");
      const bawah = top5(murid, "bawah");
      ringkasan.top5_siswa_tertinggi = atas.nama;
      ringkasan.top5_nilai_siswa_tertinggi = atas.nilai;
      ringkasan.top5_siswa_terendah = bawah.nama;
      ringkasan.top5_nilai_siswa_terendah = bawah.nilai;
    }
    return { scope: "kelas", scope_id: r.kelas_id, periode_id: periode, ringkasan };
  });

  /** Rata-rata tertimbang jumlah murid. Rata-rata dari rata-rata kelas akan memberi kelas kecil
   * bobot yang sama dengan kelas besar. */
  const tertimbang = (rows) => {
    const bobot = rows.reduce((s, r) => s + (r.jumlah_murid || 0), 0);
    if (bobot === 0) return null;
    return Math.round(rows.reduce((s, r) => s + (r.rata || 0) * (r.jumlah_murid || 0), 0) / bobot);
  };

  const perJenjang = {};
  (pekanRows || []).filter(cocok).forEach((r) => { (perJenjang[r.jenjang] ||= []).push(r); });
  const aspekPerJenjang = {};
  (aspekRows || []).filter(cocok).forEach((r) => {
    ((aspekPerJenjang[r.jenjang] ||= {})[r.aspek_kode] ||= []).push(r);
  });

  const barisJenjang = Object.entries(perJenjang).map(([jenjang, rows]) => {
    const ringkasan = {
      jenjang,
      total_siswa: rows.reduce((s, r) => s + (r.jumlah_murid || 0), 0),
      rata_pencapaian_guru: tertimbang(rows),
    };
    Object.entries(aspekPerJenjang[jenjang] || {}).forEach(([kode, list]) => {
      ringkasan[`${rataAspekPrefix.jenjang}${kode}_pekan`] = tertimbang(list);
    });
    return { scope: "jenjang", scope_id: jenjang, periode_id: periode, ringkasan };
  });

  const semua = (pekanRows || []).filter(cocok);
  const ringkasanSekolah = {
    rata_pencapaian_guru: tertimbang(semua),
    total_siswa: semua.reduce((s, r) => s + (r.jumlah_murid || 0), 0),
  };

  // Angka per karakter tingkat sekolah cuma diisi kalau seluruh kelas memakai SATU kerangka
  // karakter. Di sekolah yang tiap jenjangnya punya kerangka sendiri, "karakter1" Kelas 1 dan
  // Kelas 6 adalah dua karakter berbeda yang kebetulan menempati kolom yang sama di berkas;
  // merata-ratakannya jadi satu angka sekolah menghasilkan angka yang tidak menggambarkan apa pun.
  // Ini alasan yang sama kenapa importer sengaja melewatkan sheet ringkasan sekolah untuk sekolah
  // bertipe itu.
  const jenjangUnik = new Set(semua.map((r) => r.jenjang ?? "*"));
  if (jenjangUnik.size === 1) {
    const perAspek = {};
    (aspekRows || []).filter(cocok).forEach((r) => { (perAspek[r.aspek_kode] ||= []).push(r); });
    Object.entries(perAspek).forEach(([kode, list]) => {
      ringkasanSekolah[`${rataAspekPrefix.sekolah}${kode}_pekan`] = tertimbang(list);
    });
  }

  const barisSekolah = semua.length === 0 ? [] : [{
    scope: "sekolah",
    scope_id: null,
    periode_id: periode,
    ringkasan: ringkasanSekolah,
  }];

  return [...barisSekolah, ...barisJenjang, ...barisKelas];
}

/** Kembalikan { data, error } mentah (bukan array yang errornya sudah dibuang) supaya
 * pemanggil bisa ikut mengecek error-nya, bukan diam-diam dapat daftar aspek kosong. */
function queryAspekConfig(sekolahId) {
  return supabase
    .from("karakter_aspek_config")
    .select("jenjang, aspek_kode, aspek_label, urutan, identitas_kode")
    .eq("sekolah_id", sekolahId)
    .order("urutan", { ascending: true });
}

/** Kunci pencocokan nama kelas antar sheet/tabel yang tidak peduli spasi berlebih atau
 * besar/kecil huruf. Dipakai untuk menjodohkan kelas_id (tabel detail) dengan scope_id (tabel
 * ringkasan); keduanya diketik manusia di kolom "kelas" dua sheet berbeda. Nama ASLI tetap yang
 * ditampilkan, ini cuma kuncinya. */
export function kelasKey(nama) {
  return String(nama || "").trim().replace(/\s+/g, " ").toLowerCase();
}

function queryIndikatorConfig(sekolahId) {
  return supabase
    .from("karakter_indikator_config")
    .select("jenjang, aspek_kode, indikator_kode, indikator_label, urutan")
    .eq("sekolah_id", sekolahId)
    .order("urutan", { ascending: true });
}

/**
 * Kelompokkan baris karakter_pernyataan_ortu periode aktif berdasarkan kolom `sumber`. Baris lama
 * yang belum punya nilai `sumber` (data sebelum kolom ini ada) jatuh ke 'orangtua', bukan hilang
 * atau nyasar ke kelompok lain. Kunci untuk tiap REFLEKSI_SUMBER_URUTAN selalu ada di hasil
 * (array kosong kalau tidak ada baris) supaya pemanggil tidak perlu cek undefined dulu.
 */
function groupPernyataanBySumber(rows) {
  const bySumber = Object.fromEntries(REFLEKSI_SUMBER_URUTAN.map((s) => [s, []]));
  (rows || []).forEach((r) => {
    const sumber = r.sumber || "orangtua";
    (bySumber[sumber] ||= []).push(r);
  });
  return bySumber;
}

/**
 * Tentukan sumber refleksi yang TERSEDIA pada satu periode, terurut mengikuti
 * REFLEKSI_SUMBER_URUTAN. Sumber dianggap tersedia kalau ada baris pernyataan dengan sumber itu
 * (sudah diiris ke pernyataanBySumber), ATAU salah satu kandidat summaryKeys.pencapaian /
 * rataPencapaian sumber itu ada di salah satu ringkasan (karakter_summary.ringkasan) dengan nilai
 * bukan nol/kosong. ringkasanList berisi ringkasan scope teratas yang tersedia di hook pemanggil
 * (sekolah untuk Kepsek/WaliKelas, satu per sekolah untuk Yayasan); boleh kosong kalau ringkasan
 * tidak tersedia untuk periode itu, dalam hal ini pemeriksaan cukup mengandalkan baris pernyataan.
 * pct() sudah menganggap nilai null/undefined/"" sebagai null, jadi cukup satu pengecekan untuk
 * "kosong" maupun "bisa diparse tapi nol".
 */
function hitungSumberRefleksi(pernyataanBySumber, ringkasanList = []) {
  return REFLEKSI_SUMBER_URUTAN.filter((sumber) => {
    if ((pernyataanBySumber[sumber] || []).length > 0) return true;
    const kandidat = [
      ...(REFLEKSI_META[sumber]?.summaryKeys?.pencapaian || []),
      ...(REFLEKSI_META[sumber]?.summaryKeys?.rataPencapaian || []),
    ];
    return (ringkasanList || []).some((ringkasan) => {
      const angka = pct(resolveSummaryKey(ringkasan, kandidat));
      return angka !== null && angka !== 0;
    });
  });
}

/**
 * Wali Kelas: satu (atau beberapa) kelas dari session.cakupan.
 * periodeId (opsional): periode_id yang sedang dipilih di PeriodPicker header. Semua tabel
 * di-fetch SEKALI penuh (semua periode), lalu diiris ulang di sisi klien tiap periodeId
 * berubah — mirip useKarakterKepsek, supaya filter periode di topbar benar-benar mengubah data.
 */
export function useKarakterWaliKelas(session, periodeId, pekan = null) {
  const [state, setState] = useState({ loading: true, error: null, raw: null });
  const kelasList = Array.isArray(session.cakupan) ? session.cakupan.filter(Boolean) : [];
  const kelasKey = kelasList.join("|");

  useEffect(() => {
    let alive = true;

    async function run() {
      if (kelasList.length === 0) {
        setState({ loading: false, error: "Kelas belum ditentukan untuk akun ini (profiles.cakupan kosong).", raw: null });
        return;
      }
      setState((s) => ({ ...s, loading: true, error: null }));

      const [aspekRes, indikatorRes, summaryRes, sekolahSummaryRes, skorRes, skorIndRes, ortuRes, briefingRes, tlRes, skorPekanRes, skorIndPekanRes, pekanAvgRes] = await Promise.all([
        queryAspekConfig(session.school_id),
        queryIndikatorConfig(session.school_id),
        supabase
          .from("karakter_summary")
          .select("scope_id, periode_id, ringkasan")
          .eq("sekolah_id", session.school_id)
          .eq("scope", "kelas")
          .in("scope_id", kelasList),
        supabase
          .from("karakter_summary")
          .select("periode_id, ringkasan")
          .eq("sekolah_id", session.school_id)
          .eq("scope", "sekolah")
          .eq("scope_id", session.school_id),
        // Detail per murid per aspek/indikator/pernyataan bisa lewat 1000 baris (batas diam-diam
        // Supabase) untuk sekolah menengah-besar, apalagi diambil semua periode sekaligus di
        // sini -- pakai fetchAllRows supaya tidak ada murid/baris yang hilang tanpa error.
        // View bulanan, BUKAN tabel mentah. Sekolah yang menilai pekanan punya empat baris per
        // murid per bulan; view ini memilih nilai pekan TERAKHIR yang ada isinya (migration
        // 20260828120000, keputusan pemilik produk). Membaca tabel mentah berarti tiap murid
        // muncul empat kali di daftar dan setiap rata-rata jadi rata-rata seluruh pekan.
        fetchAllRows((from, to) => supabase
          .from("karakter_skor_bulanan")
          .select("jenjang, kelas_id, murid_id, nama_murid, periode_id, aspek_kode, skor, pekan")
          .eq("sekolah_id", session.school_id)
          .in("kelas_id", kelasList)
          .range(from, to)),
        fetchAllRows((from, to) => supabase
          .from("karakter_skor_indikator_bulanan")
          .select("jenjang, kelas_id, murid_id, nama_murid, periode_id, aspek_kode, indikator_kode, skor, pekan")
          .eq("sekolah_id", session.school_id)
          .in("kelas_id", kelasList)
          .range(from, to)),
        fetchAllRows((from, to) => supabase
          .from("karakter_pernyataan_ortu")
          .select("kelas_id, murid_id, nama_murid, periode_id, pernyataan, kategori_pernyataan, emosi_anak, alasan_emosi, dukungan_dibutuhkan, dukungan_lainnya, hal_disyukuri, sumber")
          .eq("sekolah_id", session.school_id)
          .in("kelas_id", kelasList)
          .range(from, to)),
        supabase
          .from("briefing")
          .select("teks, sumber, periode_id")
          .eq("sekolah_id", session.school_id)
          .eq("modul", "karakter")
          .eq("scope", "kelas")
          .in("scope_id", kelasList)
          .eq("status", "disetujui"),
        supabase
          .from("tindak_lanjut")
          .select("id, action, trigger_desc, priority, periode_id, gambaran, langkah_terpilih, term, type, fokus, icon, title, teaser, mengapa_data, mengapa_perspektif, manfaat, konkret")
          .eq("sekolah_id", session.school_id)
          .eq("modul", "karakter")
          .eq("scope", "kelas")
          .in("scope_id", kelasList)
          .eq("target_role", "wali_kelas")
          .eq("status", "disetujui"),
        // Skor MENTAH per pekan, dipakai kalau satu pekan dipilih di penyaring header. Tabel
        // mentah di sini bukan pelanggaran aturan "agregat bulanan wajib lewat view bulanan":
        // yang diminta memang satu pekan tertentu, bukan angka bulanan. Cakupannya cuma kelas
        // milik wali kelas ini, jadi volumenya kecil.
        //
        // Errornya tidak fatal, sama seperti view pekanan di Kepsek: yang hilang cuma pilihan
        // pekan, bukan seluruh halaman.
        fetchAllRows((from, to) => supabase
          .from("karakter_skor")
          .select("jenjang, kelas_id, murid_id, nama_murid, periode_id, aspek_kode, skor, pekan")
          .eq("sekolah_id", session.school_id)
          .in("kelas_id", kelasList)
          .gt("pekan", 0)
          .range(from, to)),
        fetchAllRows((from, to) => supabase
          .from("karakter_skor_indikator")
          .select("jenjang, kelas_id, murid_id, nama_murid, periode_id, aspek_kode, indikator_kode, skor, pekan")
          .eq("sekolah_id", session.school_id)
          .in("kelas_id", kelasList)
          .gt("pekan", 0)
          .range(from, to)),
        // Rata-rata kelas per pekan, dihitung di database (view karakter_pekan_avg). Dipakai
        // untuk kartu hero saat satu pekan dipilih, supaya angkanya tetap datang dari database
        // seperti angka bulanan yang berasal dari sheet ringkasan.
        supabase
          .from("karakter_pekan_avg")
          .select("kelas_id, periode_id, pekan, jumlah_murid, rata")
          .eq("sekolah_id", session.school_id)
          .in("kelas_id", kelasList)
          .eq("sumber", "guru")
          .gt("pekan", 0),
      ]);

      if (!alive) return;

      const err = aspekRes.error || indikatorRes.error || summaryRes.error || sekolahSummaryRes.error
        || skorRes.error || skorIndRes.error || ortuRes.error || briefingRes.error || tlRes.error;
      if (err) { setState({ loading: false, error: err.message, raw: null }); return; }

      setState({
        loading: false,
        error: null,
        raw: {
          kelasList,
          aspek: aspekRes.data || [],
          indikator: indikatorRes.data || [],
          summaryRows: summaryRes.data || [],
          sekolahSummaryRows: sekolahSummaryRes.data || [],
          skorRows: skorRes.data || [],
          skorIndRows: skorIndRes.data || [],
          ortuRows: ortuRes.data || [],
          briefingRows: briefingRes.data || [],
          tlRows: tlRes.data || [],
          skorPekanRows: skorPekanRes.data || [],
          skorIndPekanRows: skorIndPekanRes.data || [],
          pekanAvgRows: pekanAvgRes.data || [],
        },
      });
    }

    run();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.school_id, kelasKey]);

  const data = useMemo(() => {
    if (!state.raw) return null;
    const { kelasList: kl, aspek, indikator, summaryRows, sekolahSummaryRows, skorRows: skorBulananRows, skorIndRows: skorIndBulananRows, ortuRows, briefingRows, tlRows, skorPekanRows, skorIndPekanRows, pekanAvgRows } = state.raw;

    // Satu pekan dipilih DAN pekan itu memang punya skor di kelas ini. Kalau tidak, tampilannya
    // tetap bulanan; lebih baik menampilkan angka bulan yang benar daripada halaman kosong hanya
    // karena kelas ini belum dinilai di pekan yang kebetulan sedang dipilih.
    const pekanAktifWK = pekan != null && (skorPekanRows || []).some(
      (r) => r.pekan === pekan && (!periodeId || r.periode_id === periodeId)
    );
    const skorRows = pekanAktifWK ? (skorPekanRows || []).filter((r) => r.pekan === pekan) : skorBulananRows;
    const skorIndRows = pekanAktifWK ? (skorIndPekanRows || []).filter((r) => r.pekan === pekan) : skorIndBulananRows;
    // Rata-rata tertimbang jumlah murid kalau wali kelas memegang lebih dari satu kelas, sejalan
    // dengan cara view menghitungnya per kelas.
    const barisPekanAvg = pekanAktifWK
      ? (pekanAvgRows || []).filter((r) => r.pekan === pekan && (!periodeId || r.periode_id === periodeId))
      : [];
    const bobotPekan = barisPekanAvg.reduce((t, r) => t + (r.jumlah_murid || 0), 0);
    const rataPekanKelas = bobotPekan > 0
      ? Math.round(barisPekanAvg.reduce((t, r) => t + (r.rata || 0) * (r.jumlah_murid || 0), 0) / bobotPekan)
      : null;

    // availablePeriods dan validasi periodeId TIDAK cuma dari summaryRows -- briefing/tindak
    // lanjut bisa saja sudah disetujui untuk periode yang summary-nya kebetulan belum lengkap
    // (atau sebaliknya), jangan sampai salah satu bikin konten "hilang" karena periode-nya
    // disubstitusi diam-diam ke periode lain.
    const periodeSet = new Set([
      ...summaryRows.map((r) => r.periode_id),
      ...briefingRows.map((r) => r.periode_id),
      ...tlRows.map((r) => r.periode_id),
    ]);
    const availablePeriods = Array.from(periodeSet).sort((a, b) => (a > b ? -1 : 1));
    const periode = periodeId && (periodeSet.has(periodeId) || skorRows.some((r) => r.periode_id === periodeId))
      ? periodeId
      : (latestPeriode(summaryRows) || latestPeriode(briefingRows) || latestPeriode(tlRows) || latestPeriode(skorRows));
    const sekolahSummary = sekolahSummaryRows.find((r) => r.periode_id === periode) || sekolahSummaryRows[0] || null;

    // karakter_aspek_config cuma diisi manual lewat SQL (lihat resolveAspekList) -- sekolah yang
    // belum sempat dikonfigurasi kehilangan seluruh "Skor per Aspek" biarpun skornya sendiri
    // sudah lengkap. Lengkapi dengan kode aspek yang benar-benar ada di karakter_skor periode ini,
    // dan gali label aslinya dari karakter_summary (yang masih simpan nama kolom Excel lengkap)
    // kalau ada, sebelum jatuh ke label generik "Karakter N".
    const skorAtPeriode = skorRows.filter((r) => r.periode_id === periode);
    const summaryAtPeriode = summaryRows.filter((r) => r.periode_id === periode);
    const labelResolver = (kode) => {
      for (const r of summaryAtPeriode) {
        const label = aspekLabelFromRingkasan(r.ringkasan, kode);
        if (label) return label;
      }
      return null;
    };
    // Wali kelas memegang kelas-kelas dalam SATU jenjang, jadi kerangka karakternya tunggal dan
    // bisa ditentukan dari barisnya sendiri. Menyaring config ke jenjang itu penting: tanpa ini,
    // nama karakter3 milik Kelas 1 ikut menamai karakter3 milik Kelas 6 di sekolah yang tiap
    // jenjangnya berbeda kerangka.
    const jenjangKelas = skorAtPeriode.find((r) => r.jenjang)?.jenjang || "*";
    const aspekEffective = withAspekColor(
      resolveAspekList(aspekConfigJenjang(aspek, jenjangKelas), new Set(skorAtPeriode.map((r) => r.aspek_kode)), labelResolver)
    );

    // Scope teratas yang tersedia di hook Wali Kelas untuk pemeriksaan sumberRefleksi adalah
    // ringkasan sekolah (bukan ringkasan kelas), sejalan dengan kontrak WS4.
    const pernyataanAtPeriode = ortuRows.filter((r) => r.periode_id === periode);
    const pernyataanBySumber = groupPernyataanBySumber(pernyataanAtPeriode);
    const sumberRefleksi = hitungSumberRefleksi(
      pernyataanBySumber,
      sekolahSummary ? [sekolahSummary.ringkasan] : []
    );

    return {
      periode,
      // Pekan yang benar-benar dipakai, null kalau tampilan sedang bulanan. Angka per murid dan
      // per indikator ikut pekan ini; ringkasan dari berkas, briefing, tindak lanjut, dan
      // refleksi orang tua tetap bulanan.
      pekan: pekanAktifWK ? pekan : null,
      pekanAktif: pekanAktifWK,
      // Rata-rata kelas pekan ini, dari database. null saat tampilan bulanan: yang dipakai
      // tampilan waktu itu tetap angka resmi dari sheet ringkasan.
      rataPekan: pekanAktifWK ? rataPekanKelas : null,
      availablePeriods,
      kelasList: kl,
      aspek: aspekEffective,
      indikator,
      summary: summaryAtPeriode,
      sekolahSummary,
      skor: skorAtPeriode,
      skorIndikator: skorIndRows.filter((r) => r.periode_id === periode),
      // Field lama, dipertahankan = pernyataan orang tua saja, supaya view yang belum tersentuh
      // WS6 tetap benar (tidak menampilkan refleksi siswa di slot orang tua).
      pernyataan: pernyataanBySumber.orangtua,
      pernyataanBySumber,
      sumberRefleksi,
      briefing: briefingRows.find((r) => r.periode_id === periode) || null,
      tindakLanjut: tlRows.filter((r) => r.periode_id === periode),
    };
  }, [state.raw, periodeId, pekan]);

  return { loading: state.loading, error: state.error, data };
}

/**
 * Kepala Sekolah: seluruh sekolahnya, level sekolah + jenjang + kelas.
 * periodeId (opsional): periode_id yang sedang dipilih di PeriodPicker header. Semua tabel
 * di-fetch SEKALI penuh (semua periode), lalu diiris ulang di sisi klien tiap periodeId
 * berubah — tidak perlu fetch ulang ke Supabase tiap ganti periode.
 */
export function useKarakterKepsek(session, periodeId, pekan = null) {
  const [state, setState] = useState({ loading: true, error: null, raw: null });

  useEffect(() => {
    let alive = true;
    const sekolahId = session.school_id;

    async function run() {
      setState((s) => ({ ...s, loading: true, error: null }));

      const [aspekRes, indikatorRes, summaryRes, briefingRes, tlRes, ortuRes, indikatorKelasRes, indeksRes, pekanRes, pekanAspekRes, muridPekanRes, indikatorPekanRes] = await Promise.all([
        queryAspekConfig(sekolahId),
        queryIndikatorConfig(sekolahId),
        supabase
          .from("karakter_summary")
          .select("scope, scope_id, periode_id, ringkasan")
          .eq("sekolah_id", sekolahId)
          .in("scope", ["sekolah", "jenjang", "kelas"]),
        supabase
          .from("briefing")
          .select("teks, sumber, periode_id")
          .eq("sekolah_id", sekolahId)
          .eq("modul", "karakter")
          .eq("scope", "sekolah")
          .eq("scope_id", sekolahId)
          .eq("status", "disetujui"),
        supabase
          .from("tindak_lanjut")
          .select("id, scope, scope_id, action, trigger_desc, priority, periode_id, gambaran, langkah_terpilih, term, type, fokus, icon, title, teaser, mengapa_data, mengapa_perspektif, manfaat, konkret")
          .eq("sekolah_id", sekolahId)
          .eq("modul", "karakter")
          .eq("scope", "sekolah")
          .eq("target_role", "kepala_sekolah")
          .eq("status", "disetujui"),
        // Seluruh sekolah, semua periode, tanpa filter kelas -- kandidat kuat lewat batas 1000
        // baris diam-diam Supabase untuk sekolah menengah-besar, jadi dipaginasi penuh.
        fetchAllRows((from, to) => supabase
          .from("karakter_pernyataan_ortu")
          .select("kelas_id, murid_id, nama_murid, periode_id, pernyataan, kategori_pernyataan, emosi_anak, alasan_emosi, dukungan_dibutuhkan, dukungan_lainnya, hal_disyukuri, sumber")
          .eq("sekolah_id", sekolahId)
          .range(from, to)),
        // Rata-rata indikator per kelas, sudah diagregasi di database (view
        // karakter_indikator_kelas_avg, migration 20260814110000). Dipakai panel Detail Kelas
        // kalau ringkasan kelas dari berkas Excel tidak memuat kolom top5_indikator_* -- tanpa
        // ini, sekolah seperti SMK Telkom Purwokerto kosong di Kepsek padahal datanya lengkap
        // dan tampil normal di Wali Kelas. Dipaginasi: kelas x aspek x indikator x periode
        // gampang lewat 1000 baris untuk sekolah dengan banyak kelas.
        fetchAllRows((from, to) => supabase
          .from("karakter_indikator_kelas_avg")
          .select("jenjang, kelas_id, periode_id, aspek_kode, indikator_kode, skor")
          .eq("sekolah_id", sekolahId)
          .range(from, to)),
        // Indeks Karakter Sekolah, dihitung di database dari skornya sendiri (view
        // karakter_sekolah_indeks, migration 20260828120000).
        //
        // Dipakai sebagai CADANGAN angka tingkat sekolah. Sekolah yang tiap jenjangnya punya
        // kerangka karakter berbeda tidak bisa punya ringkasan tingkat sekolah dari berkas:
        // berkasnya memuat satu sheet ringkasan "sekolah" per jenjang, dan importer sengaja
        // melewatkan semuanya karena kalau dimasukkan keenamnya saling menimpa dan yang tersisa
        // cuma jenjang terakhir, tampil seolah angka seluruh sekolah.
        //
        // Tanpa cadangan ini, kartu hero dan grafik tren Kepala Sekolah kosong untuk sekolah
        // bertipe itu, padahal skornya lengkap.
        supabase
          .from("karakter_sekolah_indeks")
          .select("periode_id, indeks, jumlah_murid, jumlah_jenjang")
          .eq("sekolah_id", sekolahId)
          .eq("sumber", "guru"),
        // Empat agregat PER PEKAN (migration 20260901120000). Ditarik selalu, bukan cuma saat
        // pekan sedang dipilih: semuanya sudah teragregat (bukan baris murid mentah) sehingga
        // ringan, dan menariknya sekali di sini membuat perpindahan bulan <-> pekan tidak perlu
        // request ulang.
        //
        // pekan > 0 saja: pekan 0 berarti penilaian bulanan, dan itu sudah dilayani jalur bulanan.
        //
        // Errornya TIDAK fatal, sama seperti karakter_indikator_kelas_avg. View-nya baru; kalau
        // frontend tayang sebelum migration jalan, yang hilang cuma penyaring pekan, bukan
        // seluruh halaman Karakter Kepala Sekolah.
        fetchAllRows((from, to) => supabase
          .from("karakter_pekan_avg")
          .select("jenjang, kelas_id, periode_id, pekan, jumlah_murid, rata")
          .eq("sekolah_id", sekolahId).eq("sumber", "guru").gt("pekan", 0)
          .range(from, to)),
        fetchAllRows((from, to) => supabase
          .from("karakter_pekan_aspek_avg")
          .select("jenjang, kelas_id, periode_id, pekan, aspek_kode, jumlah_murid, rata")
          .eq("sekolah_id", sekolahId).eq("sumber", "guru").gt("pekan", 0)
          .range(from, to)),
        fetchAllRows((from, to) => supabase
          .from("karakter_murid_pekan_avg")
          .select("kelas_id, periode_id, pekan, murid_id, nama_murid, rata")
          .eq("sekolah_id", sekolahId).eq("sumber", "guru").gt("pekan", 0)
          .range(from, to)),
        fetchAllRows((from, to) => supabase
          .from("karakter_indikator_kelas_pekan_avg")
          .select("jenjang, kelas_id, periode_id, pekan, aspek_kode, indikator_kode, skor")
          .eq("sekolah_id", sekolahId).eq("sumber", "guru").gt("pekan", 0)
          .range(from, to)),
      ]);

      if (!alive) return;
      // indikatorKelasRes SENGAJA tidak ikut daftar error fatal. View
      // karakter_indikator_kelas_avg baru ada sejak migration 20260814110000; kalau frontend ini
      // tayang lebih dulu, query-nya gagal, dan menjadikannya fatal berarti SELURUH halaman
      // Karakter Kepala Sekolah mati cuma karena satu panel. Errornya tidak dibuang diam-diam:
      // pesannya diteruskan ke panel indikator lewat indikatorError.
      const err = aspekRes.error || indikatorRes.error || summaryRes.error || briefingRes.error
        || tlRes.error || ortuRes.error;
      if (err) { setState({ loading: false, error: err.message, raw: null }); return; }

      setState({
        loading: false,
        error: null,
        raw: {
          aspek: aspekRes.data || [],
          indikatorConfigRows: indikatorRes.data || [],
          summaryRows: summaryRes.data || [],
          briefingRows: briefingRes.data || [],
          tlRows: tlRes.data || [],
          ortuRows: ortuRes.data || [],
          indikatorKelasRows: indikatorKelasRes.data || [],
          indikatorKelasError: indikatorKelasRes.error?.message || null,
          // Sama seperti indikatorKelasRes: SENGAJA tidak ikut daftar error fatal. View
          // karakter_sekolah_indeks baru ada sejak migration 20260828120000; kalau frontend
          // tayang lebih dulu, query-nya gagal, dan menjadikannya fatal berarti seluruh halaman
          // Karakter Kepala Sekolah mati cuma karena satu angka cadangan.
          indeksRows: indeksRes.data || [],
          pekanRows: pekanRes.data || [],
          pekanAspekRows: pekanAspekRes.data || [],
          muridPekanRows: muridPekanRes.data || [],
          indikatorPekanRows: indikatorPekanRes.data || [],
        },
      });
    }

    run();
    return () => { alive = false; };
  }, [session.school_id]);

  const data = useMemo(() => {
    if (!state.raw) return null;
    const { aspek, indikatorConfigRows, summaryRows, briefingRows, tlRows, ortuRows, indikatorKelasRows, indikatorKelasError, indeksRows, pekanRows, pekanAspekRows, muridPekanRows, indikatorPekanRows } = state.raw;

    // Lihat catatan di useKarakterWaliKelas: periode digabung dari summary + briefing +
    // tindak lanjut, bukan cuma summary.
    const periodeSet = new Set([
      ...summaryRows.map((r) => r.periode_id),
      ...briefingRows.map((r) => r.periode_id),
      ...tlRows.map((r) => r.periode_id),
    ]);
    const availablePeriods = Array.from(periodeSet).sort((a, b) => (a > b ? -1 : 1));
    // Bulan yang punya skor pekanan boleh dipilih walau belum punya baris ringkasan sama sekali.
    // Berkas pekanan biasanya diunggah lebih dulu daripada sheet ringkasan bulanannya, jadi tanpa
    // ini memilih pekan di bulan itu terlempar balik ke bulan lain yang kebetulan punya ringkasan.
    const pekanPeriodeSet = new Set((pekanRows || []).map((r) => r.periode_id));
    const periode = periodeId && (periodeSet.has(periodeId) || pekanPeriodeSet.has(periodeId))
      ? periodeId
      : (latestPeriode(summaryRows) || latestPeriode(briefingRows) || latestPeriode(tlRows));

    // Satu pekan sedang dipilih DAN pekan itu memang punya skor di bulan ini. Pengecekan kedua
    // bukan formalitas: pilihan pekan bertahan saat berpindah bulan, jadi tanpa ini "Pekan 3" yang
    // sah di Agustus akan mengosongkan September yang baru terisi sampai Pekan 1.
    const pekanAktif = pekan != null
      && (pekanRows || []).some((r) => r.periode_id === periode && r.pekan === pekan);

    // Inti perubahannya cuma di sini. Seluruh tampilan Kepala Sekolah membaca satu daftar baris
    // berbentuk karakter_summary; saat satu pekan dipilih, daftar itu disusun dari agregat per
    // pekan alih-alih dari sheet ringkasan bulanan. Tidak ada komponen tampilan yang perlu tahu.
    const atPeriode = pekanAktif
      ? ringkasanDariPekan({ pekanRows, aspekRows: pekanAspekRows, muridRows: muridPekanRows, periode, pekan })
      : summaryRows.filter((r) => r.periode_id === periode);

    // Lihat catatan di useKarakterWaliKelas: karakter_aspek_config bisa belum lengkap untuk
    // sekolah ini, jadi dilengkapi dengan kode aspek yang benar-benar ada di ringkasan
    // (karakter_summary) periode ini, lintas scope sekolah/jenjang/kelas -- label aslinya digali
    // dari ringkasan yang sama sebelum jatuh ke label generik "Karakter N".
    const aspekKodeHadir = new Set();
    atPeriode.forEach((r) => aspekKodeFromRingkasan(r.ringkasan).forEach((k) => aspekKodeHadir.add(k)));
    const labelResolver = (kode) => {
      for (const r of atPeriode) {
        const label = aspekLabelFromRingkasan(r.ringkasan, kode);
        if (label) return label;
      }
      return null;
    };
    // Sekolah yang tiap jenjangnya punya kerangka karakter sendiri (lihat migration
    // 20260828110000). Kepala sekolah melihat SELURUH jenjang sekaligus, jadi ini satu-satunya
    // tampilan yang bisa mencampur karakter berbeda dalam satu deretan batang.
    const jenjangKerangka = [...new Set((aspek || []).map((a) => a.jenjang ?? "*"))].filter((j) => j !== "*");
    const perJenjang = jenjangKerangka.length > 0;

    // Daftar aspek SEKOLAH-WIDE. Untuk sekolah berkerangka per jenjang, baris config-nya sengaja
    // TIDAK dipakai: kunci resolveAspekList adalah aspek_kode saja, jadi 24 baris config (6
    // jenjang x 4 karakter) runtuh jadi 4 entri yang labelnya diambil dari jenjang mana pun yang
    // kebetulan terakhir diproses. Hasilnya "Tidak Merundung" (nama milik Kelas 3) ikut menamai
    // karakter3 milik keenam jenjang.
    //
    // Jadi lintas jenjang dipakai label generik "Karakter N", dan nama aslinya baru muncul
    // begitu satu jenjang dipilih (aspekUntukJenjang). Ini pola yang sama persis dengan
    // perbaikan dashboard YPT di commit 4e3ab49, cuma di dalam satu sekolah.
    const aspekEffective = withAspekColor(
      resolveAspekList(perJenjang ? aspekConfigJenjang(aspek, "*") : aspek, aspekKodeHadir, perJenjang ? null : labelResolver)
    );

    const aspekByJenjang = {};
    jenjangKerangka.forEach((j) => {
      aspekByJenjang[j] = withAspekColor(resolveAspekList(aspekConfigJenjang(aspek, j), aspekKodeHadir, labelResolver));
    });
    /** Daftar aspek berlabel milik satu jenjang. Jatuh ke daftar sekolah-wide untuk sekolah
     * berkerangka tunggal, jadi pemanggil tidak perlu bercabang. */
    const aspekUntukJenjang = (j) => aspekByJenjang[j] || aspekEffective;

    // Scope teratas untuk Kepsek adalah ringkasan sekolah.
    const sekolahRow = atPeriode.find((r) => r.scope === "sekolah") || null;

    // Indeks Karakter Sekolah per periode, dari view karakter_sekolah_indeks. Dipakai tampilan
    // sebagai CADANGAN kalau ringkasan sekolah dari berkas tidak ada -- dan itu keadaan yang
    // NORMAL untuk sekolah berkerangka per jenjang, karena berkasnya memuat satu sheet ringkasan
    // "sekolah" per jenjang dan importer sengaja melewatkan semuanya (lihat ringkasanSekolahJamak
    // di karakterImporter.js). Tanpa cadangan ini, kartu hero dan grafik tren Kepala Sekolah
    // kosong untuk sekolah bertipe itu padahal skornya lengkap.
    const indeksByPeriode = {};
    (indeksRows || []).forEach((r) => { indeksByPeriode[r.periode_id] = r; });
    const indeksSekolah = indeksByPeriode[periode] || null;
    // Titik tren dari indeks, bentuknya disamakan dengan useSummaryTrend supaya TrendChart bisa
    // memakainya apa adanya.
    const indeksTrend = (indeksRows || [])
      .filter((r) => r.indeks != null)
      .map((r) => ({ periode: r.periode_id, rata: r.indeks, ringkasan: null }))
      .sort((a, b) => a.periode.localeCompare(b.periode));

    const pernyataanAtPeriode = ortuRows.filter((r) => r.periode_id === periode);
    const pernyataanBySumber = groupPernyataanBySumber(pernyataanAtPeriode);
    const sumberRefleksi = hitungSumberRefleksi(
      pernyataanBySumber,
      sekolahRow ? [sekolahRow.ringkasan] : []
    );

    // Indikator per kelas untuk periode aktif, sudah berlabel. Bentuknya { kunci kelas:
    // [{label, value}] } supaya panel Detail Kelas tinggal mengambil kelas yang sedang dipilih.
    //
    // Kuncinya DINORMALKAN (lihat kelasKey), bukan kelas_id mentah: nama kelas di sini berasal
    // dari kolom "kelas" sheet detail_persentase_indikator, sedangkan kelas yang dipilih di panel
    // berasal dari scope_id karakter_summary, yaitu kolom "kelas" sheet summary_kelas. Dua kolom
    // di dua sheet berbeda pada berkas yang sama, jadi selisih spasi atau kapitalisasi antara
    // keduanya cukup untuk membuat indikator "hilang" lagi tanpa error apa pun.
    // Label indikator dikunci per (jenjang, aspek, indikator), bukan per (aspek, indikator).
    // Di sekolah berkerangka per jenjang, "karakter1_indikator1" Kelas 1 dan Kelas 6 adalah dua
    // indikator yang isinya berbeda; peta lama akan menamai keduanya dengan teks yang sama.
    const indikatorLabelByKey = {};
    (indikatorConfigRows || []).forEach((it) => {
      indikatorLabelByKey[`${it.jenjang ?? "*"}_${it.aspek_kode}_${it.indikator_kode}`] = it.indikator_label;
    });
    const labelIndikator = (jenjang, aspekKode, indikatorKode) =>
      indikatorLabelByKey[`${jenjang ?? "*"}_${aspekKode}_${indikatorKode}`]
      || indikatorLabelByKey[`*_${aspekKode}_${indikatorKode}`]
      || indikatorFallbackLabel(aspekKode, indikatorKode);

    // Indikator ikut per pekan saat satu pekan dipilih. Kalau tetap memakai angka bulanan, panel
    // Detail Kelas akan memasang indikator pekan terakhir di bawah judul pekan yang lain.
    const indikatorSumber = pekanAktif
      ? (indikatorPekanRows || []).filter((r) => r.pekan === pekan)
      : indikatorKelasRows;

    const indikatorByKelas = {};
    (indikatorSumber || []).forEach((r) => {
      if (r.periode_id !== periode || r.skor == null) return;
      (indikatorByKelas[kelasKey(r.kelas_id)] ||= []).push({
        label: labelIndikator(r.jenjang, r.aspek_kode, r.indikator_kode),
        value: r.skor,
      });
    });

    return {
      periode,
      // Pekan yang benar-benar dipakai (null kalau tampilan sedang bulanan). Tampilan memakainya
      // untuk menandai bagian mana yang tetap bulanan: briefing, tindak lanjut, dan suara orang
      // tua tidak punya versi pekanan.
      pekan: pekanAktif ? pekan : null,
      pekanAktif,
      availablePeriods,
      aspek: aspekEffective,
      indeksSekolah,
      indeksTrend,
      aspekByJenjang,
      aspekUntukJenjang,
      perJenjang,
      indikatorByKelas,
      indikatorError: indikatorKelasError,
      sekolah: sekolahRow,
      jenjang: atPeriode.filter((r) => r.scope === "jenjang"),
      kelas: atPeriode.filter((r) => r.scope === "kelas"),
      briefing: briefingRows.find((r) => r.periode_id === periode) || null,
      tindakLanjut: tlRows.filter((r) => r.periode_id === periode),
      // Field lama, dipertahankan = pernyataan orang tua saja (lihat catatan di useKarakterWaliKelas).
      pernyataan: pernyataanBySumber.orangtua,
      pernyataanBySumber,
      sumberRefleksi,
    };
  }, [state.raw, periodeId, pekan]);

  return { loading: state.loading, error: state.error, data };
}

/**
 * Yayasan: banyak sekolah, dikelompokkan lewat schools.yayasan_id.
 * periodeId (opsional): periode yang dipilih di PeriodPicker header. Fetch sekali penuh
 * (semua periode) lalu diiris ulang di klien tiap periodeId berubah, sama seperti Kepsek/WaliKelas.
 */
export function useKarakterYayasan(session, periodeId) {
  const [state, setState] = useState({ loading: true, error: null, raw: null });
  const yayasanId = Array.isArray(session.cakupan) ? session.cakupan[0] : null;
  // Daftar sekolah naungan sekarang sudah diresolusi sekali di auth.js (session.schools) supaya
  // tidak diulang tiap modul. Query di bawah tinggal jaring pengaman untuk sesi lama yang tersimpan
  // di sessionStorage sebelum perubahan itu; refreshSession() akan mengisinya saat App dimuat.
  const sekolahDariSesi = Array.isArray(session.schools) ? session.schools : null;
  const sekolahKey = sekolahDariSesi ? sekolahDariSesi.map((s) => s.id).join(",") : null;

  useEffect(() => {
    let alive = true;

    async function run() {
      if (!yayasanId) {
        setState({ loading: false, error: "Cakupan yayasan belum ditentukan untuk akun ini.", raw: null });
        return;
      }
      setState((s) => ({ ...s, loading: true, error: null }));

      let sekolahRows = sekolahDariSesi;
      if (!sekolahRows) {
        const { data, error: sekolahErr } = await supabase
          .from("schools")
          .select("id, nama")
          .eq("yayasan_id", yayasanId)
          .eq("aktif", true);

        if (!alive) return;
        if (sekolahErr) { setState({ loading: false, error: sekolahErr.message, raw: null }); return; }
        sekolahRows = data || [];
      }

      const sekolahIds = (sekolahRows || []).map((s) => s.id);
      if (sekolahIds.length === 0) {
        setState({ loading: false, error: null, raw: { sekolahRows: [], summaryRows: [], briefingRows: [], tlRows: [], aspekBySekolah: {}, ortuRows: [], indikatorAvgRows: [], indikatorConfigRows: [] } });
        return;
      }

      const [summaryRes, briefingRes, tlRes, aspekRes, ortuRes, indikatorAvgRes, indikatorRes] = await Promise.all([
        supabase
          .from("karakter_summary")
          .select("sekolah_id, periode_id, ringkasan")
          .eq("scope", "sekolah")
          .in("sekolah_id", sekolahIds),
        supabase
          .from("briefing")
          .select("sekolah_id, teks, sumber, periode_id")
          .eq("modul", "karakter")
          .eq("scope", "sekolah")
          .in("sekolah_id", sekolahIds)
          .eq("status", "disetujui"),
        supabase
          .from("tindak_lanjut")
          .select("id, sekolah_id, action, trigger_desc, priority, periode_id, gambaran, langkah_terpilih, term, type, fokus, icon, title, teaser, mengapa_data, mengapa_perspektif, manfaat, konkret")
          .eq("modul", "karakter")
          .eq("scope", "sekolah")
          .in("sekolah_id", sekolahIds)
          .eq("target_role", "yayasan")
          .eq("status", "disetujui"),
        supabase
          .from("karakter_aspek_config")
          .select("sekolah_id, jenjang, aspek_kode, aspek_label, urutan, identitas_kode")
          .in("sekolah_id", sekolahIds)
          .order("urutan", { ascending: true }),
        // Lintas SEMUA sekolah yayasan, semua periode -- risiko terbesar melewati batas diam-diam
        // 1000 baris Supabase, jadi dipaginasi penuh lewat fetchAllRows.
        fetchAllRows((from, to) => supabase
          .from("karakter_pernyataan_ortu")
          .select("sekolah_id, kelas_id, murid_id, nama_murid, periode_id, pernyataan, kategori_pernyataan, emosi_anak, alasan_emosi, dukungan_dibutuhkan, dukungan_lainnya, hal_disyukuri, sumber")
          .in("sekolah_id", sekolahIds)
          .range(from, to)),
        // Indikator per sekolah, sudah dirata-rata di database lewat view
        // karakter_indikator_sekolah_avg (lihat migration 20260711150000) -- bukan lagi
        // mengambil tiap baris skor murid mentah lintas sekolah lalu diagregat di klien.
        // Tetap dipaginasi untuk jaga-jaga yayasan dengan sangat banyak sekolah/periode.
        fetchAllRows((from, to) => supabase
          .from("karakter_indikator_sekolah_avg")
          .select("sekolah_id, jenjang, periode_id, aspek_kode, indikator_kode, skor")
          .in("sekolah_id", sekolahIds)
          .range(from, to)),
        supabase
          .from("karakter_indikator_config")
          .select("sekolah_id, jenjang, aspek_kode, indikator_kode, indikator_label")
          .in("sekolah_id", sekolahIds),
      ]);

      if (!alive) return;
      const err = summaryRes.error || briefingRes.error || tlRes.error || aspekRes.error
        || ortuRes.error || indikatorAvgRes.error || indikatorRes.error;
      if (err) { setState({ loading: false, error: err.message, raw: null }); return; }

      const aspekBySekolah = {};
      (aspekRes.data || []).forEach((a) => {
        (aspekBySekolah[a.sekolah_id] ||= []).push(a);
      });

      setState({
        loading: false,
        error: null,
        raw: {
          sekolahRows: sekolahRows || [],
          summaryRows: summaryRes.data || [],
          briefingRows: briefingRes.data || [],
          tlRows: tlRes.data || [],
          aspekBySekolah,
          ortuRows: ortuRes.data || [],
          indikatorAvgRows: indikatorAvgRes.data || [],
          indikatorConfigRows: indikatorRes.data || [],
        },
      });
    }

    run();
    return () => { alive = false; };
  }, [yayasanId, sekolahKey]);

  const data = useMemo(() => {
    if (!state.raw) return null;
    const { sekolahRows, summaryRows, briefingRows, tlRows, aspekBySekolah, ortuRows, indikatorAvgRows, indikatorConfigRows } = state.raw;

    // Lihat catatan di useKarakterWaliKelas: periode digabung dari summary + briefing +
    // tindak lanjut, bukan cuma summary.
    const periodeSet = new Set([
      ...summaryRows.map((r) => r.periode_id),
      ...briefingRows.map((r) => r.periode_id),
      ...tlRows.map((r) => r.periode_id),
    ]);
    const availablePeriods = Array.from(periodeSet).sort((a, b) => (a > b ? -1 : 1));
    const periode = periodeId && periodeSet.has(periodeId)
      ? periodeId
      : (latestPeriode(summaryRows) || latestPeriode(briefingRows) || latestPeriode(tlRows));

    // Label indikator per sekolah, dari config custom tiap sekolah. Kuncinya menyertakan jenjang
    // karena satu sekolah bisa punya indikator berbeda dengan kode yang sama di jenjang berbeda
    // (migration 20260828110000); '*' jadi cadangan untuk sekolah berkerangka tunggal.
    const indikatorLabelBySekolah = {};
    (indikatorConfigRows || []).forEach((it) => {
      (indikatorLabelBySekolah[it.sekolah_id] ||= {})[`${it.jenjang ?? "*"}_${it.aspek_kode}_${it.indikator_kode}`] = it.indikator_label;
    });

    // Rata-rata ketercapaian tiap indikator per sekolah -- sudah dihitung di database lewat
    // view karakter_indikator_sekolah_avg, tinggal disaring ke periode aktif dan diberi label.
    //
    // Baris view itu sekarang terpisah per jenjang. Untuk sekolah berkerangka per jenjang,
    // indikator dengan kode sama dari dua jenjang adalah dua indikator berbeda, jadi labelnya
    // ikut dibedakan dan nama jenjangnya ditempel supaya daftar "Top 5" tidak memperlihatkan dua
    // baris yang tampak kembar tanpa penjelasan.
    const sekolahPerJenjang = new Set(
      (indikatorAvgRows || []).filter((r) => r.jenjang && r.jenjang !== "*").map((r) => r.sekolah_id)
    );
    const indikatorBySekolah = {};
    (indikatorAvgRows || []).forEach((r) => {
      if (r.periode_id !== periode || r.skor == null) return;
      const labels = indikatorLabelBySekolah[r.sekolah_id] || {};
      const dasar = labels[`${r.jenjang ?? "*"}_${r.aspek_kode}_${r.indikator_kode}`]
        || labels[`*_${r.aspek_kode}_${r.indikator_kode}`]
        || indikatorFallbackLabel(r.aspek_kode, r.indikator_kode);
      (indikatorBySekolah[r.sekolah_id] ||= []).push({
        label: sekolahPerJenjang.has(r.sekolah_id) ? `${dasar} (${r.jenjang})` : dasar,
        value: r.skor,
      });
    });

    // Lihat catatan di useKarakterWaliKelas: karakter_aspek_config bisa belum lengkap untuk
    // sekolah tertentu, jadi dilengkapi per sekolah dengan kode aspek yang benar-benar ada di
    // ringkasan (karakter_summary) sekolah itu pada periode ini -- label aslinya digali dari
    // ringkasan yang sama sebelum jatuh ke label generik "Karakter N".
    const summaryAtPeriode = summaryRows.filter((r) => r.periode_id === periode);
    const aspekEffectiveBySekolah = {};
    sekolahRows.forEach((s) => {
      const ringkasan = summaryAtPeriode.find((r) => r.sekolah_id === s.id)?.ringkasan;
      aspekEffectiveBySekolah[s.id] = withAspekColor(
        resolveAspekList(
          aspekBySekolah[s.id] || [],
          aspekKodeFromRingkasan(ringkasan),
          (kode) => aspekLabelFromRingkasan(ringkasan, kode)
        )
      );
    });

    // Scope teratas untuk Yayasan adalah ringkasan per sekolah (tidak ada satu ringkasan gabungan
    // lintas sekolah); summaryAtPeriode di atas sudah scope="sekolah", satu baris per sekolah.
    const pernyataanAtPeriode = ortuRows.filter((r) => r.periode_id === periode);
    const pernyataanBySumber = groupPernyataanBySumber(pernyataanAtPeriode);
    const sumberRefleksi = hitungSumberRefleksi(
      pernyataanBySumber,
      summaryAtPeriode.map((r) => r.ringkasan)
    );

    return {
      periode,
      availablePeriods,
      sekolahList: sekolahRows,
      summary: summaryAtPeriode,
      aspekBySekolah: aspekEffectiveBySekolah,
      indikatorBySekolah,
      briefing: briefingRows.filter((r) => r.periode_id === periode),
      tindakLanjut: tlRows.filter((r) => r.periode_id === periode),
      // Field lama, dipertahankan = pernyataan orang tua saja (lihat catatan di useKarakterWaliKelas).
      pernyataan: pernyataanBySumber.orangtua,
      pernyataanBySumber,
      sumberRefleksi,
    };
  }, [state.raw, periodeId]);

  return { loading: state.loading, error: state.error, data };
}
