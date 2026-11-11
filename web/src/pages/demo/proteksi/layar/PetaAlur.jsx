import { Fragment } from "react";
import { useProteksi } from "../konteks";
import { cariLayar } from "../layarProteksi";
import css from "./PetaAlur.module.css";

/*
 * Isi layar ini disalin apa adanya dari artboard "Peta alur & user journey" (kanvas desain pemilik
 * produk 2026-11-11). Setiap rujukan "Layar N ..." di desain jadi tombol kecil yang membuka layar
 * itu; teks yang terlihat tetap sama dengan desain.
 */

/** Satu rujukan layar: teks yang terlihat dan id layar tujuan (lihat layarProteksi.js). */
const rujuk = (teks, layar) => ({ teks, layar });

const SEBELUM = [
  { judul: "Anak diam", isi: "Tanda awal tidak terbaca" },
  { judul: "Laporan terlambat", isi: "Baru tahu setelah membesar" },
  { judul: "Ditangani sendiri-sendiri", isi: "Tanpa alur, tanpa jejak" },
];

// "Layar 1–5" menyebut rentang layar (tombol Lapor Kejadian ada di header layar 1 sampai 5), bukan
// satu layar, jadi tetap teks biasa.
const CEGAH = [
  {
    judul: "1 · Skrining awal (pemetaan)",
    isi: "Orang tua dan wali kelas mengisi 31 pernyataan untuk tiap anak",
    layar: [rujuk("Layar 2 Skrining", "skrining"), " · ", rujuk("Layar 6 Aplikasi orang tua", "orangtua")],
  },
  {
    judul: "2 · Kelas kesadaran",
    isi: "4 tema: kenali perasaan, tubuhku milikku, rahasia aman, teman baik",
    layar: [rujuk("Layar 3 Ruang wali kelas", "kelas")],
  },
  {
    judul: "3 · Kanal Lapor Aman",
    isi: "Anak, orang tua, guru, dan staf bisa melapor, boleh tanpa nama",
    layar: [rujuk("Layar 6", "orangtua"), " · tombol Lapor Kejadian di Layar 1–5"],
  },
];

const CEGAH_LANJUT = [
  { judul: "Hasil dikelompokkan otomatis", isi: "sesuai tahap · dipantau · didukung · tanda bahaya" },
  {
    judul: "Dipantau dan didukung",
    isi: "Observasi wali kelas, rencana dukungan BK",
    layar: [rujuk("Layar 3", "kelas"), " dan ", rujuk("Layar 4 Profil anak", "anak")],
  },
];

// `ket` tampil di bawah kotaknya; `batas` memberi warna merah (eskalasi lewat batas waktu).
const LAPOR = [
  {
    judul: "Laporan masuk",
    isi: "Dari Lapor Aman, wali kelas, atau tanda skrining. Jam SLA mulai.",
    layar: [rujuk("Layar 5", "kasus"), " dan ", rujuk("6", "orangtua")],
  },
  {
    judul: "1 · Seberapa serius?",
    isi: "6 pertanyaan menetapkan Darurat, Tinggi, Sedang, atau Rendah",
    layar: [rujuk("Layar 5", "kasus")],
    ket: "Tingkat menentukan siapa dan seberapa cepat",
  },
  {
    judul: "2 · Ke orang yang tepat",
    isi: "Wali kelas, Guru BK, Kepala Sekolah, atau pendamping Fammi",
    layar: [rujuk("Layar 3", "kelas"), " dan ", rujuk("5", "kasus")],
    ket: "Respon pertama 1 jam sampai 2 hari kerja",
  },
  {
    judul: "3 · Rencana tindak",
    isi: "Langkah, penanggung jawab, dan batas waktu",
    layar: [rujuk("Layar 4", "anak"), " dan ", rujuk("5", "kasus")],
    ket: "Rencana tindak 24 jam sampai 5 hari kerja",
  },
  {
    judul: "4 · Progres dipantau",
    isi: "Cek ulang tiap minggu; bila belum membaik, rencana diperbarui",
    layar: [rujuk("Layar 4", "anak"), " dan ", rujuk("5", "kasus")],
    ket: "Lewat batas: naik otomatis ke atasan",
    batas: true,
  },
  {
    judul: "Selesai",
    isi: "Ditutup dengan catatan hasil, pelapor dikabari",
    layar: [rujuk("Layar 5", "kasus"), " dan ", rujuk("6", "orangtua")],
  },
];

const PANTAU = [
  {
    judul: "Siklus berikutnya",
    isi: "refleksi bulanan dan skrining akhir (Des 2026), dibandingkan dengan pemetaan awal",
  },
  {
    judul: "Dashboard pimpinan",
    isi: "pola kasus, ketepatan SLA, kelas prioritas, laporan untuk yayasan",
    layar: [rujuk("Layar 1 Ringkasan", "ringkasan")],
  },
];

// `pil`: varian kelas dasar .pill (crit merah penuh, bad merah muda, warn kuning, mid ungu).
const SLA = [
  {
    tingkat: "Darurat",
    pil: "crit",
    contoh: "Anak dalam bahaya, dugaan kekerasan seksual atau pendekatan tidak wajar, terlapor staf",
    diteruskan: "Kepala Sekolah, Koordinator BK, pendamping Fammi",
    respon: "1 jam",
    rencana: "24 jam",
    pantau: "Tiap minggu, 4 minggu",
  },
  {
    tingkat: "Tinggi",
    pil: "bad",
    contoh: "Kekerasan fisik, perundungan berulang, anak sangat tertekan",
    diteruskan: "Guru BK dan wali kelas; Kepala Sekolah diberi tahu",
    respon: "4 jam",
    rencana: "2 hari kerja",
    pantau: "Tiap minggu, 2–4 minggu",
  },
  {
    tingkat: "Sedang",
    pil: "warn",
    contoh: "Ejekan, pengucilan, tanda dari skrining, jawaban tidak yakin",
    diteruskan: "Guru BK",
    respon: "1 hari kerja",
    rencana: "3 hari kerja",
    pantau: "2 minggu",
  },
  {
    tingkat: "Rendah",
    pil: "mid",
    contoh: "Konflik ringan, kekhawatiran umum",
    diteruskan: "Wali kelas",
    respon: "2 hari kerja",
    rencana: "5 hari kerja",
    pantau: "2 minggu",
  },
];

const PERJALANAN = [
  {
    peran: "Kepala Sekolah",
    layar: [rujuk("Layar 1 Ringkasan", "ringkasan")],
    langkah: [
      "Melihat tahap program dan jumlah anak terpetakan.",
      "Menerima notifikasi kasus Darurat dan eskalasi.",
      "Memantau ketepatan SLA dan kelas prioritas.",
      "Mengunduh laporan untuk yayasan.",
    ],
  },
  {
    peran: "Koordinator BK",
    layar: [rujuk("Layar 2 Skrining", "skrining"), " · ", rujuk("Layar 5 Kasus", "kasus")],
    langkah: [
      "Membuka skrining dan mengingatkan orang tua lewat WhatsApp.",
      "Membuat rencana dukungan untuk anak yang perlu dukungan.",
      "Menilai tingkat tiap laporan lalu meneruskannya.",
      "Menjaga SLA dan mengeskalasi bila perlu.",
    ],
  },
  {
    peran: "Wali kelas",
    layar: [rujuk("Layar 3 Ruang kelas", "kelas"), " · ", rujuk("Layar 4 Profil", "anak")],
    langkah: [
      "Mengisi skrining versi guru, sekitar 3 menit per anak.",
      "Menjalankan 4 sesi kelas kesadaran.",
      "Mencatat observasi anak yang dipantau.",
      "Mengerjakan tugas kasus yang diteruskan kepadanya.",
    ],
  },
  {
    peran: "Orang tua",
    layar: [rujuk("Layar 6 Aplikasi ponsel", "orangtua")],
    langkah: [
      "Mengisi skrining dari tautan WhatsApp.",
      "Membaca ringkasan hasil yang dimulai dari kekuatan anak.",
      "Melapor lewat Lapor Aman, boleh tanpa nama.",
      "Melacak tahap laporan dan membalas pesan sekolah.",
    ],
  },
  {
    peran: "Anak 4–10 tahun",
    layar: [rujuk("Layar 6", "orangtua"), " · mode anak"],
    langkah: [
      "Memilih wajah perasaan; pertanyaan bisa didengarkan.",
      "Menyentuh gambar yang paling mirip kejadiannya.",
      "Memilih orang dewasa tepercaya, bisa merekam suara.",
      "Ceritanya masuk sebagai laporan ke Guru BK.",
    ],
  },
];

/**
 * Nama aksesibel tombol rujukan. Selalu memuat teks yang terlihat (WCAG 2.5.3, supaya perintah
 * suara "klik Layar 5" tetap kena). Rujukan yang hanya berupa nomor ("6", "Layar 5") ditambah nama
 * layarnya di menu supaya tujuannya jelas bagi pembaca layar.
 */
function labelRujukan({ teks, layar }) {
  const inti = teks.startsWith("Layar ") ? teks.slice("Layar ".length) : teks;
  const nomorSaja = /^\d+$/.test(inti);
  return `Buka layar ${inti}${nomorSaja ? `, ${cariLayar(layar)?.label ?? ""}` : ""}`;
}

/** Baris kecil berisi rujukan layar: potongan teks biasa dan tombol yang membuka layarnya. */
function BarisLayar({ bagian, className }) {
  const { pindah } = useProteksi();
  return (
    <p className={className}>
      {bagian.map((b, i) =>
        typeof b === "string" ? (
          <Fragment key={i}>{b}</Fragment>
        ) : (
          <button
            key={i}
            type="button"
            className="tautLayar"
            aria-label={labelRujukan(b)}
            onClick={() => pindah(b.layar)}
          >
            {b.teks}
          </button>
        ),
      )}
    </p>
  );
}

/**
 * Kotak satu tahap. `panah`: panah ke kotak berikutnya (ke kanan di layar lebar, ke bawah saat kotak
 * disusun menurun). `panahTurun`: panah ke baris kedua pita yang sama, hanya di layar lebar.
 */
function Kotak({ simpul, panah, panahTurun }) {
  return (
    <div className="kotak">
      <p className="kotakJudul">{simpul.judul}</p>
      <p>{simpul.isi}</p>
      {simpul.layar && <BarisLayar bagian={simpul.layar} className="kotakLayar" />}
      {panah && <span className="panah" aria-hidden="true" />}
      {panahTurun && <span className="panah panahTurun" aria-hidden="true" />}
    </div>
  );
}

/** Satu baris alur sebagai daftar berurutan. `kolom`: kelas grid baris (kolom3 atau kolom6). */
function BarisAlur({ simpul, kolom, turunDari = -1, className = "" }) {
  return (
    <ol className={`barisAlur ${kolom}${className ? ` ${className}` : ""}`}>
      {simpul.map((s, i) => (
        <li key={s.judul} className="simpul">
          <Kotak simpul={s} panah={i < simpul.length - 1} panahTurun={i === turunDari} />
          {s.ket && <p className={`ketLangkah${s.batas ? " ketBatas" : ""}`}>{s.ket}</p>}
        </li>
      ))}
    </ol>
  );
}

/**
 * Panduan · Peta alur & SLA: alur Sekolah Proteksi dari keadaan tanpa sistem, pencegahan, lapor dan
 * tindak, sampai pemantauan pimpinan; aturan SLA per tingkat; dan perjalanan tiap peran. Rujukan
 * layar di kotak dan kartu membuka layar prototipe yang disebut.
 */
export default function PetaAlur() {
  return (
    <div className={`isi ${css.layar}`}>
      <section className="titlerow">
        <div>
          <p className="eyebrow">Panduan · Peta alur &amp; SLA</p>
          <h1 className="h1">Alur Sekolah Proteksi: dari pemetaan awal sampai kasus tuntas</h1>
          <p className="lead">
            Modul Safety &amp; Crisis Management, anak 4–10 tahun. Kotak = layar di prototipe; klik nama layar untuk
            membukanya. Garis merah putus-putus = tanda bahaya dari skrining yang otomatis menjadi kasus.
          </p>
        </div>
      </section>

      <div className="alur">
        <section className="pita pitaSebelum">
          <h2 className="labelPita">Sebelum: tanpa sistem</h2>
          <div className="isiSebelum">
            <BarisAlur simpul={SEBELUM} kolom="kolom3" />
            <p className="catatanSebelum">Tanda awal tidak terbaca dan guru tidak tahu harus melapor ke siapa.</p>
          </div>
        </section>

        <section className="pita pitaCegah">
          <h2 className="labelPita">Cegah: sistem pencegahan</h2>
          <BarisAlur simpul={CEGAH} kolom="kolom3" turunDari={0} />
          <BarisAlur simpul={CEGAH_LANJUT} kolom="kolom3" className="barisLanjut" />
        </section>

        {/* Dua jalan masuk ke kotak Laporan masuk, pengganti garis panjang di artboard. */}
        <div className="sambungan sambungMasuk">
          <span className="garisMasuk garisBahaya" aria-hidden="true" />
          <span className="garisMasuk garisLaporan" aria-hidden="true" />
          <p className="labelMasuk labelBahaya">tanda bahaya jadi kasus otomatis</p>
          <p className="labelMasuk labelLaporan">laporan dari anak, orang tua, guru, staf</p>
        </div>

        <section className="pita pitaLapor">
          <h2 className="labelPita">Lapor dan tindak: bila terjadi kejadian</h2>
          <BarisAlur simpul={LAPOR} kolom="kolom6" />
        </section>

        <div className="sambungan sambungSelesai" aria-hidden="true">
          <span className="garisMasuk garisSelesai" />
        </div>

        <section className="pita pitaPantau">
          <h2 className="labelPita">Pantau: pimpinan dan yayasan</h2>
          <ul className="barisAlur kolom2">
            {PANTAU.map((s) => (
              <li key={s.judul} className="simpul">
                <div className="kotak">
                  <p>
                    <b>{s.judul}</b> · {s.isi}
                  </p>
                  {s.layar && <BarisLayar bagian={s.layar} className="kotakLayar" />}
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="bagian">
        <h2 className="judulBagian">
          Aturan SLA dan penerusan <span className="judulKecil">· usulan awal, bisa diatur tiap sekolah</span>
        </h2>
        <div className="tbox tabelSla">
          <table className="tbl">
            <thead>
              <tr>
                <th>Tingkat</th>
                <th>Contoh kejadian</th>
                <th>Diteruskan ke</th>
                <th>Respon pertama</th>
                <th>Rencana tindak</th>
                <th>Pemantauan</th>
              </tr>
            </thead>
            <tbody>
              {SLA.map((r) => (
                <tr key={r.tingkat}>
                  <td>
                    <span className={`pill sm ${r.pil}`}>{r.tingkat}</span>
                  </td>
                  <td>{r.contoh}</td>
                  <td>{r.diteruskan}</td>
                  <td>{r.respon}</td>
                  <td>{r.rencana}</td>
                  <td>{r.pantau}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bagian">
        <h2 className="judulBagian">Perjalanan tiap peran</h2>
        <div className="gridPeran">
          {PERJALANAN.map((p) => (
            <div key={p.peran} className="card kartuPeran">
              <h3 className="judulPeran">{p.peran}</h3>
              <BarisLayar bagian={p.layar} className="layarPeran" />
              <ol className="langkahPeran">
                {p.langkah.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
