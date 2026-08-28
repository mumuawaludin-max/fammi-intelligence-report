import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PETA_BINS, warnaPeta } from "../yptMeta";
import styles from "./PetaProvinsi.module.css";

/**
 * Peta geospasial pencapaian karakter per provinsi.
 *
 * Menggantikan peta titik sebelumnya (DotMapIndonesia), yang menggambar Indonesia sebagai grid
 * titik dekoratif lalu menempelkan marker 12 piksel di atasnya. Yang berubah, semuanya atas
 * instruksi pemilik produk 2026-08-27:
 *   1. Wilayahnya batas administratif sungguhan, bukan hiasan.
 *   2. Yang diwarnai adalah SELURUH AREA provinsinya, hijau, kuning, atau merah mengikuti
 *      pencapaiannya. Bukan sebuah titik di atas peta abu-abu.
 *   3. Area kliknya seluas provinsinya, bukan lingkaran 12 piksel.
 *   4. Bisa diperbesar dan digeser, dan warnanya berdenyut pelan tanpa henti.
 *   5. Hover atau klik satu provinsi memunculkan tooltip mengambang di titik tengahnya, dan
 *      meredupkan provinsi lain sampai fill-opacity 0,14 supaya yang sedang dibaca menonjol
 *      sendirian (2026-08-28). Teks petunjuk statis di kaki peta dihapus karena interaksi ini
 *      sudah cukup menjelaskan dirinya sendiri.
 *
 * Level PROVINSI, bukan kabupaten/kota. Versi kabupaten sempat dibangun lebih dulu lalu dibuang:
 * pada lebar layar dashboard, satu kota seperti Kota Makassar cuma selebar dua piksel, sehingga
 * warnanya tetap terbaca sebagai titik dan justru mengulang masalah peta lama. Provinsi cukup
 * besar untuk benar-benar terbaca sebagai bidang berwarna.
 *
 * ── Geometri ─────────────────────────────────────────────────────────────────────────────────
 * Dimuat saat runtime dari /peta-idn-adm1.json (sekitar 76 KB, 34 provinsi), BUKAN diimpor
 * sebagai modul. Kalau diimpor, isinya masuk ke bundel JS utama dan ikut diunduh setiap pengguna
 * termasuk yang tidak pernah membuka menu ini. Sebagai berkas terpisah, ia di-cache browser
 * tersendiri dan cuma diambil saat peta benar-benar dirender.
 *
 * Berkas itu dibangkitkan scripts/gen-peta-wilayah.mjs dari shapefile geoBoundaries IDN ADM1.
 * Atribusi lisensinya WAJIB tetap tampil di kaki peta, lihat catatan di script itu.
 *
 * ── Kenapa viewBox, bukan transform ──────────────────────────────────────────────────────────
 * Perbesaran dan geseran dijalankan dengan mengubah viewBox SVG, bukan CSS transform pada grup.
 * Alasannya garis batas provinsi harus tetap setebal satu piksel di semua tingkat perbesaran
 * lewat vector-effect, dan itu cuma bekerja pada koordinat pengguna asli.
 */

const SUMBER_GEOMETRI = "/peta-idn-adm1.json";

/**
 * Satu permintaan geometri untuk seluruh umur halaman, dibagi semua pemasangan komponen.
 *
 * Bukan optimasi spekulatif: diukur langsung di dev server, satu kali buka menu Rapor Karakter
 * menembakkan LIMA permintaan untuk berkas 76 KB yang sama, karena komponennya sempat dipasang
 * dan dilepas beberapa kali saat halaman dirakit (StrictMode ikut menggandakannya). Yang lebih
 * buruk daripada lalu lintasnya: respons yang datang belakangan memanggil setGeo lagi dengan
 * objek baru, `penuh` ikut berganti identitas, dan perbesaran yang sedang dipakai pembaca
 * ter-reset ke tampilan penuh tanpa sebab yang kelihatan.
 *
 * Promise-nya dibuang kalau gagal, supaya pemasangan berikutnya boleh mencoba lagi dan kegagalan
 * jaringan sesaat tidak mengunci peta sampai halaman dimuat ulang.
 */
let geometriPromise = null;

function muatGeometri() {
  if (!geometriPromise) {
    geometriPromise = fetch(SUMBER_GEOMETRI)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .catch((e) => { geometriPromise = null; throw e; });
  }
  return geometriPromise;
}

/** Perbesaran maksimum. Zoom 1 = seluruh Indonesia; 12 kira-kira selebar satu provinsi besar. */
const ZOOM_MAKS = 12;

/** Warna provinsi tanpa sekolah YPT. Redup, supaya provinsi bersekolah yang menonjol. */
const WARNA_DIAM = "#dfe3ec";
const WARNA_GARIS = "#ffffff";

export default function PetaProvinsi({
  provinsi, aktif, onPilih, onFokus, kotaTanpaProvinsi = [],
}) {
  const [geo, setGeo] = useState(null);
  const [galat, setGalat] = useState(null);

  /**
   * Elemen svg dipegang DUA kali: sebagai ref untuk dibaca penangan pointer, dan sebagai state
   * supaya effect yang memasang listener roda ikut jalan ulang saat elemennya benar-benar
   * terpasang.
   *
   * Tanpa state itu, listener rodanya tidak pernah terpasang sama sekali. Urutannya begini:
   * effect roda cuma bergantung pada `perbesar`, yang identitasnya berubah ketika `geo` masuk.
   * Tapi pada commit itu `tampak` masih null, jadi komponen masih merender kotak "Memuat" dan
   * svg-nya belum ada. Commit BERIKUTNYA baru memasang svg, dan di commit itu `geo` sudah tidak
   * berubah lagi sehingga `perbesar` identitasnya tetap dan effect-nya tidak pernah jalan lagi.
   * Diuji langsung: sebelum perbaikan ini, menggulir di atas peta menggulirkan seluruh halaman
   * dan tidak memperbesar apa pun sama sekali.
   */
  const svgRef = useRef(null);
  const [svgEl, setSvgEl] = useState(null);
  const pasangSvg = useCallback((el) => { svgRef.current = el; setSvgEl(el); }, []);

  useEffect(() => {
    let hidup = true;
    muatGeometri()
      .then((j) => { if (hidup) setGeo(j); })
      .catch((e) => { if (hidup) setGalat(e.message); });
    return () => { hidup = false; };
  }, []);

  const penuh = useMemo(
    () => (geo ? { x: 0, y: 0, w: geo.viewBox[2], h: geo.viewBox[3] } : null),
    [geo],
  );

  const [tampak, setTampak] = useState(null);

  // Tampilan penuh dipasang sekali sebagai NILAI AWAL, bukan disinkronkan tiap kali `penuh`
  // berganti identitas. Bedanya penting: kalau disinkronkan, geometri yang datang belakangan
  // atau dimuat ulang akan menarik pembaca kembali ke tampilan penuh dan membuang perbesaran
  // yang sedang dia pakai.
  useEffect(() => {
    if (penuh) setTampak((v) => v || penuh);
  }, [penuh]);

  // Cermin `tampak` dalam ref. Listener wheel asli dipasang sekali dan tidak ikut dirender ulang,
  // jadi ia akan menutup nilai `tampak` yang basi kalau membacanya dari state langsung.
  const tampakRef = useRef(null);
  useEffect(() => { tampakRef.current = tampak; }, [tampak]);

  /** Nama provinsi di geometri -> data agregatnya. */
  const dataProvinsi = useMemo(() => {
    const peta = new Map();
    (provinsi || []).forEach((p) => peta.set(p.nama, p));
    return peta;
  }, [provinsi]);

  /** Nama provinsi -> entri geometrinya (buat mengambil kotak pembatas untuk posisi tooltip). */
  const geoByNama = useMemo(() => {
    const peta = new Map();
    (geo?.wilayah || []).forEach((w) => { if (dataProvinsi.has(w.n)) peta.set(w.n, w); });
    return peta;
  }, [geo, dataProvinsi]);

  /**
   * Provinsi yang sedang di-hover. Terpisah dari `aktif` (yang diklik/terpilih): hover
   * menunjukkan pratinjau sementara, aktif menunjukkan pilihan yang bertahan setelah kursor
   * pergi. `fokus` menggabungkan keduanya -- hover diutamakan selama kursor masih di atasnya,
   * jatuh kembali ke provinsi terpilih begitu kursor pergi.
   */
  const [hoverNama, setHoverNama] = useState(null);
  const fokusNama = hoverNama || aktif;
  const fokusWilayah = fokusNama ? geoByNama.get(fokusNama) : null;
  const fokusData = fokusNama ? dataProvinsi.get(fokusNama) : null;

  /**
   * Laporkan provinsi yang sedang jadi fokus ke atas, supaya panel Detail Sekolah di sebelahnya
   * mengikuti hover, bukan cuma klik. Tanpa ini, tooltip menunjuk satu provinsi sementara panel
   * di sampingnya masih menampilkan provinsi lain yang terakhir diklik, dan pembaca membandingkan
   * dua wilayah berbeda tanpa sadar.
   *
   * Lewat effect, bukan dipanggil langsung saat pointer masuk: pemanggil menyimpannya di state,
   * dan memanggil setState milik komponen lain di tengah render adalah cara tercepat memicu
   * peringatan "cannot update a component while rendering a different component".
   */
  useEffect(() => {
    if (onFokus) onFokus(fokusNama);
  }, [fokusNama, onFokus]);

  /**
   * Posisi tooltip dalam PERSEN terhadap kanvas, bukan piksel dari getBoundingClientRect().
   * SVG-nya mengisi penuh kanvas lewat viewBox, jadi posisi persen terhadap tampak (viewBox aktif)
   * otomatis sama dengan posisi persen terhadap kanvas -- tidak perlu mengukur DOM sama sekali,
   * dan tooltipnya tetap tepat saat digeser atau diperbesar karena `tampak` ikut berubah.
   */
  let tipStyle = null;
  if (fokusWilayah && tampak) {
    const [bx, by, bw, bh] = fokusWilayah.b;
    const klem = (v) => Math.min(96, Math.max(4, v));
    tipStyle = {
      left: `${klem(((bx + bw / 2 - tampak.x) / tampak.w) * 100)}%`,
      top: `${klem(((by + bh / 2 - tampak.y) / tampak.h) * 100)}%`,
    };
  }

  /**
   * Provinsi yang ada di data tapi namanya tidak ketemu di geometri. Ini kesalahan pemetaan yang
   * harus kelihatan: kalau dibiarkan senyap, provinsinya tidak pernah tergambar dan tidak ada
   * yang tahu kenapa.
   */
  const provinsiTakDikenal = useMemo(() => {
    if (!geo) return [];
    const ada = new Set(geo.wilayah.map((w) => w.n));
    return (provinsi || []).filter((p) => !ada.has(p.nama));
  }, [geo, provinsi]);

  const zoom = tampak && penuh ? penuh.w / tampak.w : 1;

  /** Jepit tampilan ke dalam batas peta supaya tidak bisa tersesat ke laut kosong. */
  const jepit = useCallback((v) => {
    if (!penuh) return v;
    const w = Math.min(penuh.w, Math.max(penuh.w / ZOOM_MAKS, v.w));
    const h = w * (penuh.h / penuh.w);
    return {
      w,
      h,
      x: Math.min(penuh.w - w, Math.max(0, v.x)),
      y: Math.min(penuh.h - h, Math.max(0, v.y)),
    };
  }, [penuh]);

  const perbesar = useCallback((faktor, pusat) => {
    setTampak((v) => {
      if (!v || !penuh) return v;
      // Lebar DIJEPIT lebih dulu, baru rasionya diturunkan. Kalau tidak, saat perbesaran sudah
      // mentok, rasio tetap dihitung dari lebar yang tidak jadi dipakai, sehingga lebarnya diam
      // tapi titik asalnya tetap bergeser dan peta melompat tiap kali tombol + ditekan lagi.
      const w = Math.min(penuh.w, Math.max(penuh.w / ZOOM_MAKS, v.w / faktor));
      // Titik di bawah kursor dijaga tetap di tempat. Tanpa ini, memperbesar selalu menarik
      // tampilan ke tengah dan pembaca kehilangan wilayah yang sedang dia tuju.
      const px = pusat ? pusat.x : v.x + v.w / 2;
      const py = pusat ? pusat.y : v.y + v.h / 2;
      const rasio = w / v.w;
      return jepit({
        w,
        h: w * (penuh.h / penuh.w),
        x: px - (px - v.x) * rasio,
        y: py - (py - v.y) * rasio,
      });
    });
  }, [jepit, penuh]);

  /** Koordinat peta dari sebuah peristiwa penunjuk. */
  const koordinatDari = useCallback((e) => {
    const svg = svgRef.current;
    if (!svg || !tampak) return null;
    const kotak = svg.getBoundingClientRect();
    return {
      x: tampak.x + ((e.clientX - kotak.left) / kotak.width) * tampak.w,
      y: tampak.y + ((e.clientY - kotak.top) / kotak.height) * tampak.h,
    };
  }, [tampak]);

  /**
   * Perbesar dengan roda tetikus.
   *
   * Dipasang sebagai listener DOM asli dengan passive:false, BUKAN lewat prop onWheel React.
   * React memasang penanganan wheel sebagai listener pasif, dan di listener pasif preventDefault()
   * diabaikan diam-diam; akibatnya seluruh halaman ikut tergulir tiap kali peta diperbesar.
   */
  useEffect(() => {
    const svg = svgEl;
    if (!svg) return undefined;

    function roda(e) {
      e.preventDefault();
      const v = tampakRef.current;
      if (!v) return;
      const kotak = svg.getBoundingClientRect();
      perbesar(e.deltaY < 0 ? 1.25 : 1 / 1.25, {
        x: v.x + ((e.clientX - kotak.left) / kotak.width) * v.w,
        y: v.y + ((e.clientY - kotak.top) / kotak.height) * v.h,
      });
    }

    svg.addEventListener("wheel", roda, { passive: false });
    return () => svg.removeEventListener("wheel", roda);
  }, [perbesar, svgEl]);

  const seret = useRef(null);

  /**
   * Menandai bahwa seretan BARU SAJA selesai, dibaca oleh penangan klik provinsi.
   *
   * Terpisah dari `seret` karena urutan peristiwanya: pointerup selalu berjalan lebih dulu dan
   * mengosongkan `seret`, baru kemudian click menyala. Memeriksa `seret.current` di penangan klik
   * karena itu selalu menemukan null, dan setiap seretan yang berakhir di atas sebuah provinsi
   * akan ikut memilih provinsi itu.
   */
  const baruSajaGeser = useRef(false);

  /**
   * Membekukan hover setelah sebuah provinsi diklik, sampai penunjuk digerakkan lagi.
   * Alasannya ada di pilihWilayah(): perbesaran yang menyusul klik menggeser geometri di bawah
   * kursor dan memicu pointerover palsu yang menimpa pilihan pengguna.
   */
  const abaikanHover = useRef(false);

  function onPointerDown(e) {
    if (!tampak || e.button !== 0) return;
    const titik = koordinatDari(e);
    if (!titik) return;
    baruSajaGeser.current = false;
    seret.current = { mulaiPeta: titik, mulaiView: tampak, geser: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e) {
    // Penunjuk benar-benar digerakkan pengguna, jadi hover boleh berlaku lagi. Dilepas di sini,
    // SEBELUM pemeriksaan seretan di bawah, karena gerakan tanpa menyeret pun sudah cukup jadi
    // bukti bahwa hover berikutnya memang dimaui.
    abaikanHover.current = false;

    const s = seret.current;
    if (!s || !penuh) return;
    const kotak = svgRef.current.getBoundingClientRect();

    // Titik peta yang berada di bawah kursor saat seretan dimulai harus tetap di bawah kursor.
    // Untuk posisi kursor dengan porsi f dari lebar kotak, koordinat petanya adalah x + f*w,
    // jadi x yang dicari = mulaiPeta.x - f*w.
    const targetX = s.mulaiPeta.x - ((e.clientX - kotak.left) / kotak.width) * s.mulaiView.w;
    const targetY = s.mulaiPeta.y - ((e.clientY - kotak.top) / kotak.height) * s.mulaiView.h;

    // Ambang kecil sebelum seretan dianggap geseran. Tanpa ini, klik yang bergeser satu piksel
    // ikut terhitung sebagai geseran dan pemilihan provinsinya batal.
    if (!s.geser) {
      const jauh = Math.abs(targetX - s.mulaiView.x) + Math.abs(targetY - s.mulaiView.y);
      if (jauh < s.mulaiView.w * 0.004) return;
      s.geser = true;
      // Geseran sungguhan dimulai, bukan sekadar klik. Pointer capture pada svg membuat provinsi
      // di bawah kursor tidak lagi menerima pointerleave selama menyeret, jadi hover yang sempat
      // menyala sebelum menyeret harus dipadamkan manual di sini, kalau tidak tooltipnya nyangkut
      // di provinsi awal sepanjang seretan.
      setHoverNama(null);
    }
    setTampak(jepit({ ...s.mulaiView, x: targetX, y: targetY }));
  }

  function onPointerUp(e) {
    baruSajaGeser.current = !!seret.current?.geser;
    seret.current = null;
    if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }

  /** Perbesar sampai satu provinsi memenuhi layar, dengan ruang sisa di tepinya. */
  const zoomKeWilayah = useCallback((b) => {
    if (!penuh) return;
    const [bx, by, bw, bh] = b;
    const rasio = penuh.h / penuh.w;
    let w = Math.max(bw * 1.6, (bh * 1.6) / rasio, penuh.w / ZOOM_MAKS);
    w = Math.min(w, penuh.w);
    setTampak(jepit({
      w,
      h: w * rasio,
      x: bx + bw / 2 - w / 2,
      y: by + bh / 2 - (w * rasio) / 2,
    }));
  }, [jepit, penuh]);

  function pilihWilayah(w, data) {
    const memilih = aktif !== data.nama;
    onPilih(memilih ? data.nama : null);

    if (memilih) {
      // Perbesaran menggeser SELURUH geometri di bawah kursor. Browser lalu menghitung ulang
      // elemen mana yang sedang tersentuh dan menembakkan pointerover untuk provinsi yang kini
      // menempati posisi kursor -- padahal pengguna tidak menggerakkan tangannya sama sekali.
      // Hover palsu itu langsung menimpa provinsi yang barusan dipilih, dan panel Detail Sekolah
      // melompat ke provinsi lain sepersekian detik setelah diklik.
      //
      // Hover karena itu dibekukan sampai pengguna benar-benar menggerakkan penunjuknya lagi
      // (lihat onPointerMove). Bukan lewat jeda waktu: jeda selalu bisa terlalu pendek di mesin
      // lambat atau terlalu panjang di mesin cepat, sedangkan gerakan penunjuk adalah tanda pasti
      // bahwa hover berikutnya memang dimaui pengguna.
      abaikanHover.current = true;
      setHoverNama(null);
      zoomKeWilayah(w.b);
    }
  }

  if (galat) {
    return (
      <div className={styles.wrap}>
        <p className={styles.pesan}>
          Peta wilayah gagal dimuat ({galat}). Berkas {SUMBER_GEOMETRI} tidak ditemukan;
          jalankan ulang scripts/gen-peta-wilayah.mjs.
        </p>
      </div>
    );
  }

  if (!geo || !tampak) {
    return (
      <div className={styles.wrap}>
        <div className={styles.kanvasKosong} style={{ aspectRatio: "9600 / 3800" }}>
          <span className={styles.pesan}>Memuat peta wilayah…</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.kanvas} style={{ aspectRatio: `${geo.viewBox[2]} / ${geo.viewBox[3]}` }}>
        <svg
          ref={pasangSvg}
          viewBox={`${tampak.x} ${tampak.y} ${tampak.w} ${tampak.h}`}
          className={styles.svg}
          role="group"
          aria-label="Peta pencapaian karakter per provinsi"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onDoubleClick={(e) => perbesar(1.8, koordinatDari(e))}
        >
          <defs>
            <linearGradient id="ypt-peta-laut" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#eef2f9" />
              <stop offset="50%" stopColor="#e6ecf7" />
              <stop offset="100%" stopColor="#eef2f9" />
            </linearGradient>
          </defs>

          <rect
            x={0}
            y={0}
            width={geo.viewBox[2]}
            height={geo.viewBox[3]}
            fill="url(#ypt-peta-laut)"
            className={styles.laut}
          />

          {/* Lapisan dasar: 34 provinsi abu-abu. Ber-memo dan tanpa prop yang berubah, jadi React
              melewatinya sepenuhnya saat digeser dan diperbesar; yang berubah cuma satu atribut
              viewBox di elemen svg induknya. */}
          <LapisanDasar wilayah={geo.wilayah} />

          {/* Lapisan berwarna: provinsi yang punya sekolah YPT. */}
          {geo.wilayah.map((w, i) => {
            const data = dataProvinsi.get(w.n);
            if (!data) return null;
            const isAktif = aktif === data.nama;
            const isHoverIni = hoverNama === data.nama;
            // Provinsi ini diredupkan kalau ADA provinsi lain yang sedang jadi fokus (hover atau
            // terpilih), tapi bukan dirinya sendiri. Tanpa syarat "bukan dirinya sendiri", provinsi
            // yang sedang di-hover akan ikut meredup bersama yang lain.
            const redup = !!fokusNama && fokusNama !== data.nama;
            const warna = warnaPeta(data.nilai);
            return (
              <g key={w.n}>
                <path
                  d={w.d}
                  fill={warna}
                  fillRule="evenodd"
                  stroke={WARNA_GARIS}
                  strokeWidth={isAktif ? 2 : 1}
                  vectorEffect="non-scaling-stroke"
                  className={[
                    styles.provinsi,
                    isAktif ? styles.provinsiTerpilih : "",
                    isHoverIni && !isAktif ? styles.provinsiHover : "",
                    redup ? styles.provinsiRedup : "",
                  ].filter(Boolean).join(" ")}
                  // Denyut warna ditunda berbeda-beda per provinsi supaya peta bernapas seperti
                  // riak yang menyebar, bukan berkedip serempak seperti lampu peringatan.
                  style={{ animationDelay: `${(i % 7) * 0.45}s` }}
                />

                {/* Sasaran klik terpisah. Lingkar sentuh 16 piksel dinyatakan lewat
                    vector-effect, jadi tetap 16 piksel di semua tingkat perbesaran; DKI Jakarta
                    lebarnya cuma beberapa piksel pada zoom penuh dan tanpa ini nyaris tidak bisa
                    ditekan, terutama di layar sentuh. Hover/fokus dipasang di elemen yang sama
                    ini, bukan di path isian, karena isiannya pointer-events:none. */}
                <path
                  d={w.d}
                  fill="transparent"
                  stroke="transparent"
                  vectorEffect="non-scaling-stroke"
                  strokeWidth={16}
                  strokeLinejoin="round"
                  className={styles.sasaran}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isAktif}
                  // Nama kota ikut masuk aria-label, bukan cuma di tooltip visual: tooltip
                  // adalah elemen presentasional (aria-hidden), jadi pembaca layar hanya
                  // mendapat detail lewat teks nama yang bisa diakses ini.
                  aria-label={`${data.label}, ${data.jumlahSekolah} sekolah di `
                    + `${data.kotaList.join(", ")}, pencapaian `
                    + `${data.nilai == null ? "belum ada" : `${data.nilai} persen`}`}
                  // Keduanya dijaga `abaikanHover`: sesaat setelah klik, perbesaran memicu
                  // pointerenter/leave palsu tanpa pengguna menggerakkan tangannya sama sekali.
                  onPointerEnter={() => { if (!abaikanHover.current) setHoverNama(data.nama); }}
                  onPointerLeave={() => {
                    if (abaikanHover.current) return;
                    setHoverNama((h) => (h === data.nama ? null : h));
                  }}
                  // Fokus keyboard tidak pernah palsu, jadi tidak ikut dijaga. Justru sebaliknya:
                  // menekan Tab setelah klik harus langsung memindahkan pratinjau ke sana.
                  onFocus={() => { abaikanHover.current = false; setHoverNama(data.nama); }}
                  onBlur={() => setHoverNama((h) => (h === data.nama ? null : h))}
                  onClick={(e) => {
                    if (baruSajaGeser.current) return;
                    e.stopPropagation();
                    pilihWilayah(w, data);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      pilihWilayah(w, data);
                    }
                  }}
                />
              </g>
            );
          })}
        </svg>

        {/* Tooltip mengambang, mengikuti provinsi yang sedang di-hover atau terpilih. Persen kiri
            dan atasnya diturunkan dari titik tengah kotak pembatas provinsi terhadap viewBox
            aktif -- lihat perhitungan tipStyle di atas. aria-hidden karena isinya duplikat dari
            aria-label yang sudah dibaca pembaca layar lewat elemen sasaran. */}
        {fokusData && tipStyle && (
          <div className={styles.tooltip} style={tipStyle} aria-hidden="true">
            <span className={styles.tooltipNama}>{fokusData.label}</span>
            <span className={styles.tooltipNilai}>
              {fokusData.nilai == null ? "belum ada data" : `${fokusData.nilai}%`}
            </span>
            <span className={styles.tooltipSub}>
              {fokusData.jumlahSekolah} sekolah · {fokusData.kotaList.join(", ")}
            </span>
          </div>
        )}

        <div className={styles.kontrol}>
          {/* Kedua tombol dinonaktifkan di ujung rentangnya. Tombol yang bisa ditekan tapi tidak
              mengubah apa pun membuat pembaca menekan berulang kali sambil menduga peta rusak. */}
          <button
            type="button"
            className={styles.kontrolBtn}
            onClick={() => perbesar(1.6)}
            aria-label="Perbesar peta"
            disabled={zoom >= ZOOM_MAKS - 0.001}
          >
            +
          </button>
          <button
            type="button"
            className={styles.kontrolBtn}
            onClick={() => perbesar(1 / 1.6)}
            aria-label="Perkecil peta"
            disabled={zoom <= 1.001}
          >
            −
          </button>
          <button
            type="button"
            className={styles.kontrolBtn}
            onClick={() => setTampak(penuh)}
            aria-label="Kembalikan peta ke tampilan penuh"
            disabled={zoom <= 1.001}
          >
            ⤢
          </button>
        </div>

        <span className={styles.zoomTag}>{zoom.toFixed(1)}×</span>

        {/* Atribusi lisensi CC BY 3.0 IGO. DIPINDAH dari baris teks di kaki peta ke tombol kecil
            ini (permintaan pemilik produk 2026-08-28), BUKAN dihapus: lisensi data batas wilayah
            mewajibkan atribusinya tersampaikan, dan itu syarat pemakaian, bukan hiasan. Lisensi
            tidak menuntut atribusi tercetak di atas petanya sendiri, jadi menyembunyikannya di
            balik tombol yang bisa dibuka kapan saja tetap memenuhi syarat sambil membersihkan
            tampilan. Jangan hilangkan tombolnya. */}
        <span className={styles.atribusiWrap}>
          <button
            type="button"
            className={styles.atribusiBtn}
            aria-label="Sumber dan lisensi data batas wilayah"
          >
            i
          </button>
          <span className={styles.atribusiIsi} role="note">{geo.atribusi}</span>
        </span>
      </div>

      <div className={styles.legend}>
        <span className={styles.legendJudul}>Pencapaian provinsi:</span>
        {PETA_BINS.map((b) => (
          <span key={b.label} className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: b.warna }} />
            {b.label}
          </span>
        ))}
        {/* Dua abu yang berbeda, dan bedanya penting: yang satu berarti YPT tidak punya sekolah
            di sana, yang satu lagi berarti punya tapi datanya belum masuk periode ini. Tanpa
            keduanya di legenda, provinsi yang datanya belum diimpor terbaca seperti provinsi
            yang memang kosong. */}
        <span className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: warnaPeta(null) }} />
          Ada sekolah, belum ada data
        </span>
        <span className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: WARNA_DIAM }} />
          Tanpa sekolah YPT
        </span>
      </div>

      {kotaTanpaProvinsi.length > 0 && (
        <p className={styles.belum}>
          Belum ada pemetaan provinsi untuk kota:{" "}
          {kotaTanpaProvinsi.map((k) => k.nama).join(", ")}. Tambahkan namanya ke KOTA_PROVINSI
          di yptMeta.js supaya sekolahnya ikut terhitung di peta.
        </p>
      )}

      {provinsiTakDikenal.length > 0 && (
        <p className={styles.belum}>
          Nama provinsi ini tidak ada di berkas geometri:{" "}
          {provinsiTakDikenal.map((p) => p.nama).join(", ")}. Periksa ejaannya di KOTA_PROVINSI.
        </p>
      )}

    </div>
  );
}

const LapisanDasar = memo(function LapisanDasar({ wilayah }) {
  return (
    <g className={styles.lapisanDasar}>
      {wilayah.map((w) => (
        <path
          key={w.n}
          d={w.d}
          fill={WARNA_DIAM}
          stroke={WARNA_GARIS}
          strokeWidth={0.75}
          vectorEffect="non-scaling-stroke"
          // Cincin dalam pada berkas geometri adalah lubang sungguhan, misalnya DKI Jakarta yang
          // terkurung di dalam Jawa Barat. Tanpa evenodd, lubangnya tergambar sebagai isian penuh
          // dan menutupi provinsi tetangganya.
          fillRule="evenodd"
        />
      ))}
    </g>
  );
});
