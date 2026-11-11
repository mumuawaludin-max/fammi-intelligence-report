import { useId } from "react";
import { useProteksi } from "../konteks";
import { Ikon, KepalaKartu } from "../komponen";
import { cariLayar } from "../layarProteksi";
import { ALUR } from "../bersama/alur";
import css from "./PetaAlur.module.css";

/*
 * Panduan alur & SLA (versi ringkas 2026-11-11): dua jalur (pencegahan dan kejadian) dengan
 * siapa, kapan, dan hasil tiap langkah, dua jembatan antar alur, lalu tabel SLA per tingkat.
 * Langkah, label, dan tujuan tombol Buka dibaca dari bersama/alur.js, jadi sama dengan bilah alur
 * di layar lain. Semua isi data contoh.
 */

/** Siapa, kapan, dan hasil tiap langkah. Kunci = id langkah di bersama/alur.js. */
const PANDUAN = {
  // Alur pencegahan
  skrining: {
    siapa: "Orang tua dan wali kelas mengisi, Guru BK memantau kelengkapan",
    kapan: "Awal dan akhir semester, sekitar 3 menit per anak",
    hasil: "Status lima aspek HEART tiap anak",
  },
  hasil: {
    siapa: "Tim ahli dan psikolog Fammi menyusun",
    kapan: "Setelah isian orang tua dan wali kelas masuk",
    hasil: "Laporan anak dan peta dukungan: buddy, orang dewasa tepercaya, tempat aman",
  },
  tindak: {
    siapa: "Wali kelas dan Guru BK, bersama orang tua",
    kapan: "Pekan yang sama, mulai dari anak Waspada",
    hasil: "Rencana per aspek: siapa melakukan apa, kapan",
  },
  checklist: {
    siapa: "Tiap pemilik tugas: wali kelas, Guru BK, orang tua, guru piket",
    kapan: "Dicentang tiap minggu, dievaluasi setelah 4 minggu",
    hasil: "Kemajuan terlihat di ruang wali kelas dan ringkasan sekolah",
  },
  // Alur kejadian
  lapor: {
    siapa: "Siapa saja: anak, orang tua, guru, staf; boleh tanpa nama",
    kapan: "Kapan saja; jam SLA mulai saat laporan masuk",
    hasil: "Kode lacak dan tingkat awal dari 6 pertanyaan",
  },
  triage: {
    siapa: "Koordinator BK",
    kapan: "Darurat segera (1 jam), Rendah 1 hari kerja",
    hasil: "Tingkat Darurat, Tinggi, Sedang, atau Rendah",
  },
  tugas: {
    siapa: "Koordinator BK menunjuk penanggung jawab",
    kapan: "Langsung setelah triage",
    hasil: "Tugas masuk checklist penanggung jawab, dikabari lewat aplikasi dan WhatsApp",
  },
  tangani: {
    siapa: "Penanggung jawab utama: wali kelas atau Guru BK",
    kapan: "Respon 1 jam sampai 2 hari kerja, rencana tindak 24 jam sampai 5 hari kerja",
    hasil: "Anak ditemui, pelapor dikabari, rencana berjalan",
  },
  pantau: {
    siapa: "Wali kelas memantau, Guru BK menutup kasus",
    kapan: "Cek ulang tiap minggu, 2 sampai 4 minggu",
    hasil: "Kasus ditutup dengan catatan hasil, pelapor dikabari",
  },
};

/** Keterangan jalur di samping judulnya. */
const KET_JALUR = {
  cegah: "Untuk semua anak, tiap semester",
  kejadian: "Setiap ada laporan, dengan batas waktu sesuai tingkat",
};

const langkahCegah = (id) => ALUR.cegah.langkah.find((l) => l.id === id);
const langkahKejadian = (id) => ALUR.kejadian.langkah.find((l) => l.id === id);

/**
 * Dua jembatan antar alur. `arah` turun = dari pencegahan ke kejadian, naik = sebaliknya.
 * `dari`/`ke` = langkah di bersama/alur.js, `buka` = contoh di prototipe.
 */
const JEMBATAN = [
  {
    id: "bahaya",
    arah: "turun",
    judul: "Tanda bahaya dari skrining jadi laporan kejadian",
    isi: "Jawaban Ya pada pertanyaan keamanan langsung menjadi laporan tingkat Sedang untuk Guru BK, tanpa menunggu hasil HEART.",
    dari: langkahCegah("skrining"),
    ke: langkahKejadian("lapor"),
    buka: { label: "Lihat KS-012", aria: "Lihat KS-012, contoh laporan dari tanda bahaya skrining", layar: "kasus", aksi: { jenis: "kasus", id: "KS-012" } },
  },
  {
    id: "tutup",
    arah: "naik",
    judul: "Kasus ditutup, anak tetap dipantau",
    isi: "Anak masuk tindak lanjut pencegahan: wali kelas mengobservasi, checklist dievaluasi 4 minggu, lalu skrining ulang.",
    dari: langkahKejadian("pantau"),
    ke: langkahCegah("tindak"),
    buka: { label: "Lihat contoh Raka", aria: "Lihat contoh Raka, tindak lanjut pencegahan", layar: "anak", aksi: { jenis: "gulir", id: "tindak" } },
  },
];

/*
 * SLA per tingkat. Respon pertama, rencana tindak, penanggung jawab, contoh, dan jarak tinjau ulang
 * disalin dari aturan di kasusData.js (ATURAN, ATURAN_SLA, CATATAN_ATURAN; 11 Nov 2026). Jam SLA
 * berjalan sejak laporan masuk dan triage belum punya batas sendiri di sana, jadi batas triage di
 * sini usulan yang muat di dalam batas respon pertama dan cocok dengan kasus contoh (KS-016 Darurat
 * masuk 09.45, belum ditriage pukul 10.30, batas 10.45). `pil` = varian kelas dasar .pill.
 */
const SLA = [
  {
    tingkat: "Darurat",
    pil: "crit",
    contoh: "Anak dalam bahaya, dugaan kekerasan seksual atau pendekatan tidak wajar, terlapor staf",
    ke: "Guru BK (utama), Kepala Sekolah, pendamping Fammi",
    triage: "Segera (1 jam)",
    respon: "1 jam",
    rencana: "24 jam",
    pantau: "Tiap minggu, 4 minggu",
  },
  {
    tingkat: "Tinggi",
    pil: "bad",
    contoh: "Kekerasan fisik, perundungan berulang, anak sangat tertekan",
    ke: "Wali kelas (utama) dan Guru BK; Kepala Sekolah diberi tahu",
    triage: "2 jam",
    respon: "4 jam",
    rencana: "2 hari kerja",
    pantau: "Tiap minggu, 2 sampai 4 minggu",
  },
  {
    tingkat: "Sedang",
    pil: "warn",
    contoh: "Ejekan, pengucilan, tanda bahaya dari skrining, jawaban tidak yakin",
    ke: "Guru BK",
    triage: "4 jam",
    respon: "1 hari kerja",
    rencana: "3 hari kerja",
    pantau: "Cek ulang setelah 2 minggu",
  },
  {
    tingkat: "Rendah",
    pil: "mid",
    contoh: "Konflik ringan, kekhawatiran umum",
    ke: "Wali kelas",
    triage: "1 hari kerja",
    respon: "2 hari kerja",
    rencana: "5 hari kerja",
    pantau: "Cek ulang setelah 2 minggu",
  },
];

/** Kolom tabel SLA. `waktu` = batas waktu pendek yang tidak perlu turun baris. */
const KOLOM_SLA = [
  { id: "contoh", label: "Contoh kejadian" },
  { id: "ke", label: "Ditangani" },
  { id: "triage", label: "Triage", waktu: true },
  { id: "respon", label: "Respon pertama", waktu: true },
  { id: "rencana", label: "Rencana tindak", waktu: true },
  { id: "pantau", label: "Pemantauan" },
];

/** Nama aksesibel tombol Buka: langkahnya, lalu tujuannya bila berbeda dari nama langkah. */
function labelBuka(l) {
  let tujuan = cariLayar(l.layar)?.label ?? "";
  if (l.aksi?.jenis === "lapor") tujuan = "formulir lapor kejadian";
  else if (l.aksi?.jenis === "tahap") tujuan = `antrean ${l.label.toLowerCase()} di ${tujuan}`;
  return tujuan && tujuan.toLowerCase() !== l.label.toLowerCase() ? `Buka ${l.label}, ${tujuan}` : `Buka ${l.label}`;
}

/** Satu jalur: kepala, lalu langkah berurutan berisi siapa, kapan, hasil, dan tombol Buka. */
function Jalur({ alur }) {
  const { pindah } = useProteksi();
  const def = ALUR[alur];
  const idJudul = useId();
  const kejadian = alur === "kejadian";

  return (
    <section
      className={`card jalur ${kejadian ? "jalurKejadian" : "jalurCegah"}`}
      aria-labelledby={idJudul}
      data-bagian={alur}
    >
      <div className="jalurKepala">
        <span className={`tile hdr ${kejadian ? "red" : "p"}`} aria-hidden="true">
          <Ikon nama={kejadian ? "lapor" : "perisaiCentang"} size={16} />
        </span>
        <h2 className="jalurJudul" id={idJudul}>
          {def.nama}
        </h2>
        <p className="jalurKet">{KET_JALUR[alur]}</p>
      </div>
      <ol className="jalurLangkah" style={{ "--n": def.langkah.length }}>
        {def.langkah.map((l, i) => {
          const isi = PANDUAN[l.id];
          return (
            <li key={l.id} className="jalurButir">
              <div className="jalurKartu">
                <div className="jalurAtas">
                  <span className="jalurNo" aria-hidden="true">
                    {i + 1}
                  </span>
                  <h3 className="jalurLabel">{l.label}</h3>
                  <button
                    type="button"
                    className="ghost sm jalurBuka"
                    aria-label={labelBuka(l)}
                    onClick={() => pindah(l.layar, l.aksi)}
                  >
                    Buka
                  </button>
                </div>
                <dl className="jalurFakta">
                  <div>
                    <dt>Siapa</dt>
                    <dd>{isi.siapa}</dd>
                  </div>
                  <div>
                    <dt>Kapan</dt>
                    <dd>{isi.kapan}</dd>
                  </div>
                  <div>
                    <dt>Hasil</dt>
                    <dd>{isi.hasil}</dd>
                  </div>
                </dl>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/** Panduan · alur & SLA. Tanpa bilah alur karena kedua alur tampil utuh di sini. */
export default function PetaAlur() {
  const { pindah } = useProteksi();

  return (
    <div className={`isi ${css.layar}`}>
      <section className="titlerow">
        <div>
          <p className="eyebrow">Panduan untuk semua peran</p>
          <h1 className="h1">Panduan alur &amp; SLA</h1>
          <p className="lead">
            Pencegahan berjalan untuk semua anak tiap semester; alur kejadian berjalan setiap ada laporan.
          </p>
        </div>
      </section>

      <Jalur alur="cegah" />

      <section className="jembatan" data-bagian="jembatan" aria-label="Jembatan antar alur">
        {JEMBATAN.map((j) => (
          <div key={j.id} className={`card jembatanKartu ${j.arah === "turun" ? "jembatanTurun" : "jembatanNaik"}`}>
            <span className="jembatanPanah" aria-hidden="true">
              <Ikon nama="sebelah" size={18} />
            </span>
            <div className="jembatanIsi">
              <h2 className="jembatanJudul">{j.judul}</h2>
              <p className="jembatanRute">
                <span>{j.dari.label}</span>
                <Ikon nama="sebelah" size={13} />
                <span className="sr"> ke </span>
                <span>{j.ke.label}</span>
              </p>
              <p className="jembatanTeks">{j.isi}</p>
            </div>
            <button
              type="button"
              className="ghost sm jembatanBuka"
              aria-label={j.buka.aria}
              onClick={() => pindah(j.buka.layar, j.buka.aksi)}
            >
              {j.buka.label}
            </button>
          </div>
        ))}
      </section>

      <Jalur alur="kejadian" />

      <section className="card tcard" data-bagian="sla">
        <div className="tophead">
          <KepalaKartu ikon="jam" judul="SLA per tingkat" />
          <span className="mut kecil">Usulan awal, bisa diatur tiap sekolah</span>
        </div>
        <div className="tbox slaKotak">
          <table className="tbl slaTabel">
            <thead>
              <tr>
                <th scope="col">Tingkat</th>
                {KOLOM_SLA.map((k) => (
                  <th key={k.id} scope="col">
                    {k.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SLA.map((r) => (
                <tr key={r.tingkat}>
                  <th scope="row">
                    <span className={`pill sm ${r.pil}`}>{r.tingkat}</span>
                  </th>
                  {KOLOM_SLA.map((k) => (
                    <td key={k.id} data-label={k.label} className={k.waktu ? "slaWaktu" : undefined}>
                      {r[k.id]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="slaCatatan">
          Jam SLA berjalan sejak laporan masuk. Lewat batas, kasus otomatis naik satu tingkat penanggung jawab: wali kelas,
          lalu Guru BK, lalu Kepala Sekolah. Hari kerja dihitung Senin sampai Jumat.
        </p>
      </section>
    </div>
  );
}
