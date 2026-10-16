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
          .select("sekolah_id, jenjang, periode_id, aspek_kode, aspek_label, jumlah_siswa, rata")
          .in("sekolah_id", ids).range(from, to)),
        fetchAllRows((from, to) => supabase.from("ypt_k_indikator")
          .select("sekolah_id, jenjang, periode_id, aspek_kode, indikator_kode, indikator_label, jumlah_siswa, rata")
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
    const aspekAktifSemua = aspekRows.filter((r) => r.periode_id === periode);

    /**
     * Sekolah yang kerangka karakternya berbeda per jenjang (migration 20260828110000).
     * Ditandai oleh baris yang jenjangnya bukan sentinel '*'.
     *
     * Seluruh sekolah YPT hari ini berkerangka TUNGGAL, jadi daftar ini kosong dan tidak ada
     * satu pun angka di halaman ini yang berubah. Penjaga ini preventif, dan penting: di sekolah
     * berkerangka per jenjang, satu sekolah menyumbang enam baris untuk "karakter3" yang isinya
     * enam karakter BERBEDA. Mengelompokkannya per aspek_kode seperti di bawah akan merata-ratakan
     * keenamnya jadi satu batang -- persis bentuk cacat yang diperbaiki commit 762fdc5, cuma
     * sumbernya berpindah dari antar-sekolah ke dalam satu sekolah.
     *
     * Yang dilakukan: sekolah itu dikeluarkan dari perbandingan PER KARAKTER saja. Angka totalnya
     * tetap ikut di semua tempat lain, karena ypt_k_sekolah.rata_total tidak bergantung kerangka
     * mana pun. Yang dikeluarkan dilaporkan ke tampilan, tidak dipotong diam-diam.
     */
    const sekolahPerJenjang = [...new Set(
      aspekAktifSemua.filter((r) => r.jenjang && r.jenjang !== "*").map((r) => r.sekolah_id),
    )].map((id) => ({ id, nama: metaBySekolah[id]?.nama || id }));
    const idPerJenjang = new Set(sekolahPerJenjang.map((s) => s.id));
    const aspekAktif = aspekAktifSemua.filter((r) => !idPerJenjang.has(r.sekolah_id));
    /**
     * Aspek dikelompokkan per NAMA karakter yang dideklarasikan sekolah; `aspek_kode` cuma
     * cadangan untuk baris yang belum punya nama.
     *
     * KENAPA BUKAN PER KODE (ini pernah dibalik dua kali, baca sebelum membaliknya lagi):
     *
     * `aspek_kode` bukan identitas, melainkan POSISI KOLOM di berkas Excel ("karakter5" = kolom
     * karakter kelima). Sekolah menaruh karakter yang berbeda di posisi yang sama. Terbukti di
     * data produksi jenjang SD (2026-10-16): SD Telkom Makassar dan SD Telkom Batam punya lima
     * karakter dengan "7 Kebiasaan Anak Indonesia Hebat" di karakter5, sedangkan SD Telkom Padang
     * punya enam dengan "Mandiri" di karakter5 dan "7 Kebiasaan" di karakter6. Pengelompokan per
     * kode menghasilkan dua kesalahan sekaligus: satu batang merata-ratakan Mandiri bersama
     * 7 Kebiasaan lalu menamainya salah satu dari keduanya (Mandiri hilang dari grafik), dan
     * 7 Kebiasaan muncul DUA KALI dengan angka berbeda karena duduk di dua kode.
     *
     * Versi yang lebih tua mengelompokkan per nama tanpa cadangan apa pun, dan itu juga salah:
     * dari 12 sekolah SMA/K cuma satu yang mengisi karakter_aspek_config, jadi tiap karakter
     * terbelah jadi "Empati" (satu sekolah) dan "Karakter 1" (sebelas sisanya).
     *
     * Yang dipakai sekarang menutup kedua lubang itu: baris yang punya nama dikelompokkan menurut
     * namanya sendiri, dan baris yang belum punya nama IKUT ke nama itu asalkan kodenya cuma
     * punya satu nama di jenjang ini. Kalau satu kode punya lebih dari satu nama, baris tanpa nama
     * tidak bisa ditebak tempatnya dan tetap berdiri sendiri sebagai "Karakter N".
     *
     * BATAS YANG HARUS DISADARI, dan ini bukan hal kecil: dua sekolah yang menulis nama yang sama
     * belum tentu memakai indikator yang sama. Aturan pemilik produk 2026-08-28 untuk kasus
     * lintas jenjang berbunyi dua karakter baru boleh disandingkan kalau NAMA DAN INDIKATORNYA
     * sama persis, dan penggabungannya dinyatakan manusia lewat Admin CMS. Panel itu belum ada.
     * Sampai ada, pencocokan nama di sini adalah tebakan terbaik yang tersedia, dan ia jauh lebih
     * dekat ke kebenaran daripada pencocokan posisi kolom yang digantikannya. `jumlahSekolah` dan
     * `sekolahBerlabel` membawa ketidakpastian itu ke tampilan.
     *
     * grupId null (tabel "semua jenjang") SENGAJA tetap per kode dengan nama generik. Kerangka
     * karakter disusun per jenjang, jadi "Empati" milik sebuah SMK tidak boleh ikut menamai
     * karakter TK, dan menggabungkan nama yang sama lintas jenjang persis yang dilarang aturan di
     * atas. Tampilan itu memang kasar, tapi ia tidak mengklaim nama apa pun.
     */
    const normNama = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "");

    /** Nama generik bikinan kode ("Karakter 4"), bukan nama yang dideklarasikan sekolah. */
    const namaGenerik = (s) => /^karakter\s*\d+$/i.test(s.trim());

    /** Jarak Levenshtein. Daftar nama per jenjang paling banyak belasan, jadi O(n*m) aman. */
    function jarakEjaan(a, b) {
      const baris = Array.from({ length: b.length + 1 }, (_, i) => i);
      for (let i = 1; i <= a.length; i += 1) {
        let diagonal = baris[0];
        baris[0] = i;
        for (let j = 1; j <= b.length; j += 1) {
          const simpan = baris[j];
          baris[j] = Math.min(
            baris[j] + 1,
            baris[j - 1] + 1,
            diagonal + (a[i - 1] === b[j - 1] ? 0 : 1),
          );
          diagonal = simpan;
        }
      }
      return baris[b.length];
    }

    /**
     * Dua nama ternormalkan dianggap EJAAN BERBEDA untuk karakter yang sama.
     *
     * Ini satu-satunya tempat di sini yang menebak, dan ia sengaja dibuat sesempit mungkin.
     * Yang dibereskan cuma kekacauan ejaan yang nyata ada di berkas YPT (diverifikasi pada
     * "Summary Sekolah YPT.xlsx" Mei 2026):
     *   TK: "7kebiasan" (3 sekolah), "7kebiasaan" (2), "7kebiasaan anak indonesia hebat" (2)
     *       -- satu karakter yang sama, tiga penulisan
     *   SD: "disipilin" (1 sekolah) vs "disiplin" (2) -- salah ketik
     * Tanpa penyatuan ini, pengelompokan per nama memperbaiki SD tapi memecah 7 Kebiasaan di TK
     * jadi tiga batang, yaitu menukar satu cacat dengan cacat yang lebih besar.
     *
     * Batas-batasnya, semuanya untuk mencegah dua karakter BERLAINAN tertarik jadi satu:
     *   - nama di bawah 6 huruf tidak pernah disatukan dengan nama lain; nama pendek terlalu
     *     mudah bertabrakan.
     *   - nama generik "Karakter N" dikecualikan mentah-mentah. "karakter1" dan "karakter2"
     *     cuma beda satu huruf dan akan disatukan oleh aturan jarak di bawah, padahal keduanya
     *     justru penanda bahwa namanya belum diketahui.
     *   - selisih maksimal dua huruf, atau yang pendek adalah awalan persis dari yang panjang.
     * "mandiri" vs "7kebiasaanakindonesiahebat" jauh melewati semuanya, jadi Mandiri tetap
     * berdiri sendiri -- itu justru cacat yang laporan ini berangkat dari situ.
     *
     * Ini TAMBALAN, bukan penyelesaian. Penyelesaiannya menyeragamkan nama di
     * karakter_aspek_config lewat Admin CMS; sesudah itu fungsi ini tidak pernah terpakai.
     * Setiap penyatuan dilaporkan ke tampilan lewat `ejaanLain`, jadi tidak ada yang disatukan
     * diam-diam.
     */
    function samaEjaan(a, b) {
      if (a === b) return true;
      const pendek = a.length <= b.length ? a : b;
      const panjang = a.length <= b.length ? b : a;
      if (pendek.length < 6) return false;
      if (panjang.startsWith(pendek)) return true;
      return jarakEjaan(a, b) <= 2;
    }

    /**
     * Satukan nama-nama satu jenjang jadi kelompok ejaan.
     * Mengembalikan: norm -> { kunci, nama tampilan terpilih, semua ejaan }.
     *
     * Nama tampilan dipilih begini, urut:
     *   1. Ejaan yang MEMUAT ejaan lain di kelompok ini sebagai awalannya. "7 Kebiasaan Anak
     *      Indonesia Hebat" memuat "7 Kebiasaan", jadi ia nama lengkapnya dan yang pendek adalah
     *      singkatan, bukan salah ketik.
     *   2. Ejaan yang dipakai paling banyak sekolah.
     *   3. Yang terpanjang, lalu urut abjad, supaya hasilnya tetap sama tiap render.
     * Tanpa butir 1, kelompok 7 Kebiasaan di TK akan tampil sebagai "7kebiasan" (salah ketik,
     * tapi dipakai 3 dari 7 sekolah sehingga menang suara terbanyak). Tanpa butir 2, kelompok
     * Disiplin di SD akan tampil sebagai "Disipilin" karena kebetulan satu huruf lebih panjang.
     * Ini cuma soal NAMA YANG DITAMPILKAN; pengelompokan dan angkanya tidak terpengaruh, dan
     * ejaan lainnya tetap dibawa ke tampilan supaya admin bisa memutuskan.
     */
    function kelompokEjaan(rows) {
      const hitung = new Map(); // norm -> { nama, sekolah:Set }
      rows.forEach((r) => {
        const label = (r.aspek_label || "").trim();
        if (!label || namaGenerik(label)) return;
        const n = normNama(label);
        if (!n) return;
        if (!hitung.has(n)) hitung.set(n, { nama: label, sekolah: new Set() });
        hitung.get(n).sekolah.add(r.sekolah_id);
      });

      const daftar = [...hitung.keys()];
      const indukDari = new Map(daftar.map((n) => [n, n]));
      const akar = (n) => (indukDari.get(n) === n ? n : akar(indukDari.get(n)));
      for (let i = 0; i < daftar.length; i += 1) {
        for (let j = i + 1; j < daftar.length; j += 1) {
          if (!samaEjaan(daftar[i], daftar[j])) continue;
          const a = akar(daftar[i]);
          const b = akar(daftar[j]);
          if (a !== b) indukDari.set(b, a);
        }
      }

      const perAkar = new Map();
      daftar.forEach((n) => {
        const a = akar(n);
        if (!perAkar.has(a)) perAkar.set(a, []);
        perAkar.get(a).push(n);
      });

      const peta = new Map();
      perAkar.forEach((anggota, a) => {
        const namaPenuh = (n) => (anggota.some((m) => m !== n && n.startsWith(m)) ? 1 : 0);
        const urut = [...anggota].sort((x, y) => (namaPenuh(y) - namaPenuh(x))
          || (hitung.get(y).sekolah.size - hitung.get(x).sekolah.size)
          || (hitung.get(y).nama.length - hitung.get(x).nama.length)
          || hitung.get(x).nama.localeCompare(hitung.get(y).nama, "id"));
        const nama = hitung.get(urut[0]).nama;
        const ejaanLain = urut.slice(1).map((n) => hitung.get(n).nama);
        anggota.forEach((n) => peta.set(n, { kunci: `nama:${a}`, nama, ejaanLain }));
      });
      return peta;
    }

    /**
     * kode -> Set kunci kelompok ejaan yang menempati kode itu.
     * Dipakai supaya baris tanpa nama bisa menumpang nama yang sudah dideklarasikan sekolah lain
     * pada kode yang sama, selama kodenya cuma berisi SATU karakter (beda ejaan tidak dihitung
     * sebagai karakter kedua).
     */
    function kelompokPerKode(rows, ejaan) {
      const peta = {};
      rows.forEach((r) => {
        const kode = (r.aspek_kode || "").trim();
        const label = (r.aspek_label || "").trim();
        if (!kode || !label) return;
        const e = ejaan.get(normNama(label));
        if (!e) return;
        (peta[kode] ||= new Map()).set(e.kunci, e);
      });
      return peta;
    }

    /** Identitas satu baris aspek di dalam kelompoknya. */
    function identitasAspek(r, ejaan, perKode) {
      const kode = (r.aspek_kode || "").trim();
      const label = (r.aspek_label || "").trim();
      const milikSendiri = label ? ejaan.get(normNama(label)) : null;
      if (milikSendiri) {
        return { ...milikSendiri, namaAsli: true, kode };
      }
      const kandidat = perKode[kode];
      if (kandidat && kandidat.size === 1) {
        const satu = [...kandidat.values()][0];
        return { ...satu, namaAsli: true, kode };
      }
      return {
        kunci: `kode:${kode}`,
        nama: label || aspekFallbackLabel(kode),
        ejaanLain: [],
        // Sekolah yang benar-benar menuliskan "Karakter 3" sebagai nama karakternya tetap dihitung
        // BELUM bernama. Rangkuman memakai namaAsli untuk memutuskan boleh atau tidak menyebut
        // nama karakter di dalam kalimat, dan "karakter terbaik Telkom adalah Karakter 3" tidak
        // memberi tahu apa pun.
        namaAsli: Boolean(label) && !namaGenerik(label),
        kode,
      };
    }

    function aspekPerGrup(grupId) {
      const anggota = aspekAktif.filter((r) => {
        const meta = metaBySekolah[r.sekolah_id];
        return meta && (grupId == null || groupJenjang(meta.jenjang) === grupId);
      });

      const ejaan = kelompokEjaan(anggota);
      const perKode = kelompokPerKode(anggota, ejaan);
      const byKunci = new Map();
      anggota.forEach((r) => {
        const kode = (r.aspek_kode || "").trim();
        if (!kode) return;
        // Lintas jenjang tidak ada nama yang sah, jadi kodenya sendiri yang jadi identitas.
        const id = grupId == null
          ? { kunci: `kode:${kode}`, nama: aspekFallbackLabel(kode), ejaanLain: [], namaAsli: false, kode }
          : identitasAspek(r, ejaan, perKode);
        let g = byKunci.get(id.kunci);
        if (!g) { g = { ...id, kodeList: new Set(), rows: [] }; byKunci.set(id.kunci, g); }
        g.kodeList.add(kode);
        g.rows.push(r);
      });

      return [...byKunci.values()]
        .map((g) => ({
          kunci: g.kunci,
          // Kode terkecil di kelompok ini, dipakai untuk mengurutkan batang saja. Satu kelompok
          // bisa memuat lebih dari satu kode justru karena itu inti perbaikannya.
          kode: [...g.kodeList].sort((a, b) => a.localeCompare(b, "id", { numeric: true }))[0],
          kodeList: [...g.kodeList],
          nama: g.nama,
          // Nama di atas benar-benar dideklarasikan sekolah, bukan "Karakter N" bikinan kode.
          // Pemanggil yang mau merangkai kalimat berisi nama karakter wajib memeriksa ini.
          namaAsli: g.namaAsli,
          nilai: bulat(rataTertimbang(g.rows, (r) => r.rata, (r) => r.jumlah_siswa)),
          jumlahSekolah: new Set(g.rows.map((r) => r.sekolah_id)).size,
          // Berapa sekolah yang benar-benar mendeklarasikan nama itu. Kalau jauh di bawah
          // jumlahSekolah, namanya adalah klaim dari sedikit sekolah untuk rata-rata banyak
          // sekolah, dan pembaca berhak tahu.
          sekolahBerlabel: new Set(
            g.rows.filter((r) => (r.aspek_label || "").trim()).map((r) => r.sekolah_id),
          ).size,
          // Kelompok ini menempati lebih dari satu posisi kolom antar sekolah. Bukan masalah lagi
          // sejak pengelompokan ikut nama, tapi tetap dilaporkan supaya admin tahu berkasnya
          // belum seragam.
          kodeBeda: g.kodeList.size > 1,
          // Posisi kolom yang di sekolah berbeda berisi karakter BERNAMA BEDA. Kelompoknya sudah
          // dipisah dengan benar, tapi ini tetap wajib dilaporkan: dua nama berbeda di kode yang
          // sama bisa berarti dua karakter yang memang berlainan (SD Telkom Padang menaruh
          // "Mandiri" di karakter5, dua SD lain menaruh "7 Kebiasaan" di situ) ATAU satu karakter
          // yang salah ketik di salah satu berkas. Kode tidak boleh menebak yang mana; yang bisa
          // membedakan cuma manusia yang melihat berkasnya. Beda EJAAN tidak terhitung di sini,
          // ia sudah disatukan dan dilaporkan lewat `ejaanLain`.
          kodeBernamaGanda: [...g.kodeList].filter((k) => (perKode[k]?.size || 0) > 1),
          // Ejaan lain untuk karakter yang sama, yang disatukan ke batang ini. Kosong kalau semua
          // sekolah menulis namanya sama. Tampilan WAJIB menyebutkannya: penyatuan ejaan adalah
          // tebakan, dan admin yang harus merapikannya di karakter_aspek_config.
          ejaanLain: g.ejaanLain || [],
        }))
        .filter((a) => a.nilai != null)
        // Urut menurut kode terkecil secara alami (karakter1, karakter2, ... karakter10), bukan
        // menurut jumlah sekolah. Urutan batang jadi tetap antar periode dan antar jenjang,
        // sehingga pembaca bisa membandingkan posisi yang sama. Nama jadi pemutus seri supaya
        // dua kelompok yang kode terkecilnya sama tidak bertukar tempat antar render.
        .sort((a, b) => a.kode.localeCompare(b.kode, "id", { numeric: true })
          || a.nama.localeCompare(b.nama, "id"));
    }

    const aspekYayasan = aspekPerGrup(null);

    // Kolom aspek di tabel per sekolah = aspek yang paling banyak dipakai sekolah, maksimal 6
    // (batas yang digambar Figma). Aspek di luar enam besar tidak ditampilkan sebagai kolom;
    // nilainya tetap ikut menghitung rata_total sekolah.
    // Membawa `kodeList`, bukan satu kode, karena satu karakter bisa duduk di posisi kolom yang
    // berbeda antar sekolah (lihat catatan panjang di aspekPerGrup). Sel tabel dicari dengan
    // menelusuri daftar itu.
    function kolomAspekPerGrup(grupId) {
      return [...aspekPerGrup(grupId)]
        .sort((a, b) => b.jumlahSekolah - a.jumlahSekolah
          || a.kode.localeCompare(b.kode, "id", { numeric: true }))
        .slice(0, 6)
        .map((a) => ({ kunci: a.kunci, kode: a.kode, kodeList: a.kodeList, nama: a.nama }));
    }

    // Berkunci aspek_kode, dan tiap nilai membawa NAMA MILIK SEKOLAH ITU SENDIRI. Nama ikut
    // disimpan di sini karena panel rincian satu sekolah dulu mencarinya lewat peta se-jenjang,
    // sehingga "Mandiri" milik SD Telkom Padang di karakter5 tampil sebagai "7 Kebiasaan Anak
    // Indonesia Hebat", nama yang didaftarkan sekolah LAIN pada kode yang sama.
    const aspekPerSekolah = {};
    aspekAktif.forEach((r) => {
      const kode = (r.aspek_kode || "").trim();
      if (!kode) return;
      (aspekPerSekolah[r.sekolah_id] ||= {})[kode] = {
        nilai: r.rata,
        nama: (r.aspek_label || "").trim() || null,
      };
    });

    /**
     * grup jenjang -> (kode -> nama tampilan), untuk pemanggil yang cuma memegang kode aspek.
     *
     * Dipisah per jenjang dengan sengaja. Nama karakter dideklarasikan per sekolah di
     * karakter_aspek_config, dan kerangka karakternya sendiri berbeda antar jenjang. Peta
     * se-yayasan akan membuat "Empati" milik sebuah SMK ikut menamai karakter1 milik TK, yang
     * hampir pasti karakter yang berbeda. Kode yang belum dinamai sekolah mana pun di jenjangnya
     * jatuh ke nama generik "Karakter N".
     */
    const aspekLabelPerGrup = {};
    aspekAktif.forEach((r) => {
      const meta = metaBySekolah[r.sekolah_id];
      const kode = (r.aspek_kode || "").trim();
      const label = (r.aspek_label || "").trim();
      if (!meta || !kode || !label) return;
      const grup = groupJenjang(meta.jenjang);
      ((aspekLabelPerGrup[grup] ||= {})[kode] ||= label);
    });

    /** Nama aspek untuk satu kode di satu jenjang. Jenjang tak dikenal -> nama generik. */
    function aspekLabel(grupId, kode) {
      return aspekLabelPerGrup[grupId]?.[kode] || aspekFallbackLabel(kode);
    }

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
      // Sekolah yang dikeluarkan dari perbandingan per karakter karena kerangkanya berbeda per
      // jenjang. Kosong untuk seluruh sekolah YPT sekarang; tampilan wajib menyebutkannya kalau
      // suatu saat terisi, bukan memotong diam-diam.
      sekolahPerJenjang,
      kolomAspekPerGrup,
      aspekPerSekolah,
      aspekLabel,
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
