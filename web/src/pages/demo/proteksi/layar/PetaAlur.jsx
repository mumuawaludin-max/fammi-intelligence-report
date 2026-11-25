import { useId, useState } from "react";
import { useProteksi } from "../konteks";
import { Ikon, KepalaKartu } from "../komponen";
import { cariLayar } from "../layarProteksi";
import { ALUR } from "../bersama/alur";
import css from "./PetaAlur.module.css";

/*
 * Panduan (2026-11-25, "less is more"): dua alur dijelaskan dengan bahasa sehari-hari. Tiap langkah
 * tampil sebagai satu baris (nama + keterangan singkat dari bersama/alur.js); siapa, kapan, dan
 * hasilnya muncul setelah langkah diketuk. Lalu dua penghubung antar alur dan batas waktu per
 * tingkat (tabel lengkapnya dilipat). Semua isi data contoh.
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
    hasil: "Laporan anak dan peta dukungan: teman pendamping, orang dewasa tepercaya, tempat aman",
  },
  tindak: {
    siapa: "Wali kelas dan Guru BK, bersama orang tua",
    kapan: "Pekan yang sama, mulai dari anak Perlu Perhatian Lebih",
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
    kapan: "Kapan saja; batas waktu mulai dihitung saat laporan masuk",
    hasil: "Kode lacak dan tingkat awal dari 6 pertanyaan",
  },
  triage: {
    siapa: "Koordinator BK",
    kapan: "Darurat segera (1 jam), Rendah 1 hari kerja",
    hasil: "Tingkat Darurat, Tinggi, Sedang, atau Rendah",
  },
  tugas: {
    siapa: "Koordinator BK menunjuk penanggung jawab",
    kapan: "Langsung setelah cek awal",
    hasil: "Tugas masuk checklist penanggung jawab, dikabari lewat aplikasi dan WhatsApp",
  },
  tangani: {
    siapa: "Penanggung jawab utama: wali kelas atau Guru BK",
    kapan: "Tanggapan pertama 1 jam sampai 2 hari kerja, rencana penanganan 24 jam sampai 5 hari kerja",
    hasil: "Anak ditemui, pelapor dikabari, rencana berjalan",
  },
  pantau: {
    siapa: "Wali kelas memantau, Guru BK menyelesaikan kasus",
    kapan: "Cek ulang tiap minggu, 2 sampai 4 minggu",
    hasil: "Kasus selesai dengan catatan hasil, pelapor dikabari",
  },
};

/** Satu kalimat di bawah judul tiap alur: kapan alur ini berjalan. */
const KET_JALUR = {
  cegah: "Untuk semua anak, tiap semester.",
  kejadian: "Setiap ada laporan, dengan batas waktu sesuai tingkat.",
};

const langkahCegah = (id) => ALUR.cegah.langkah.find((l) => l.id === id);
const langkahKejadian = (id) => ALUR.kejadian.langkah.find((l) => l.id === id);

/**
 * Dua penghubung antar alur. `arah` turun = dari pencegahan ke kejadian, naik = sebaliknya.
 * `dari`/`ke` = langkah di bersama/alur.js, `buka` = contoh di prototipe.
 */
const JEMBATAN = [
  {
    id: "bahaya",
    arah: "turun",
    judul: "Tanda bahaya dari screening langsung jadi laporan",
    isi: "Jawaban Ya pada pertanyaan keamanan langsung masuk ke Guru BK sebagai laporan tingkat Sedang.",
    dari: langkahCegah("skrining"),
    ke: langkahKejadian("lapor"),
    buka: { label: "Lihat KS-012", aria: "Lihat KS-012, contoh laporan dari tanda bahaya screening", layar: "kasus", aksi: { jenis: "kasus", id: "KS-012" } },
  },
  {
    id: "tutup",
    arah: "naik",
    judul: "Kasus selesai, anak tetap dipantau",
    isi: "Wali kelas mengamati, checklist dievaluasi 4 minggu, lalu anak ikut screening ulang.",
    dari: langkahKejadian("pantau"),
    ke: langkahCegah("tindak"),
    buka: { label: "Lihat contoh Raka", aria: "Lihat contoh Raka, tindak lanjut pencegahan", layar: "anak", aksi: { jenis: "gulir", id: "tindak" } },
  },
];

/*
 * Batas waktu per tingkat. Tanggapan pertama, rencana penanganan, penanggung jawab, contoh, dan
 * jarak cek ulang disalin dari aturan di kasusData.js (ATURAN, ATURAN_SLA, CATATAN_ATURAN; 11 Nov
 * 2026). Batas waktu berjalan sejak laporan masuk dan cek awal belum punya batas sendiri di sana,
 * jadi batas cek awal di sini usulan yang muat di dalam batas tanggapan pertama dan cocok dengan
 * kasus contoh (KS-016 Darurat masuk 09.45, belum dicek pukul 10.30, batas 10.45). `pil` = varian
 * kelas dasar .pill.
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
    contoh: "Ejekan, pengucilan, tanda bahaya dari screening, jawaban tidak yakin",
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

/** Kolom tabel lengkap. `waktu` = batas waktu pendek yang tidak perlu turun baris. */
const KOLOM_SLA = [
  { id: "contoh", label: "Contoh kejadian" },
  { id: "ke", label: "Ditangani" },
  { id: "triage", label: "Cek awal", waktu: true },
  { id: "respon", label: "Tanggapan pertama", waktu: true },
  { id: "rencana", label: "Rencana penanganan", waktu: true },
  { id: "pantau", label: "Pemantauan" },
];

/** Nama aksesibel tombol Buka: langkahnya, lalu tujuannya bila berbeda dari nama langkah. */
function labelBuka(l) {
  let tujuan = cariLayar(l.layar)?.label ?? "";
  if (l.aksi?.jenis === "lapor") tujuan = "formulir lapor kejadian";
  else if (l.aksi?.jenis === "tahap") tujuan = `daftar ${l.label.toLowerCase()} di ${tujuan}`;
  return tujuan && tujuan.toLowerCase() !== l.label.toLowerCase() ? `Buka ${l.label}, ${tujuan}` : `Buka ${l.label}`;
}

/** Satu langkah: baris yang bisa diketuk untuk membuka siapa, kapan, hasil, dan tombol Buka. */
function Langkah({ l, no }) {
  const { pindah } = useProteksi();
  const [buka, setBuka] = useState(false);
  const idIsi = useId();
  const isi = PANDUAN[l.id];

  return (
    <li className={`jalurButir${buka ? " terbuka" : ""}`}>
      <button type="button" className="jalurTombol" aria-expanded={buka} aria-controls={idIsi} onClick={() => setBuka((v) => !v)}>
        <span className="jalurNo" aria-hidden="true">
          {no}
        </span>
        <span className="jalurTeks">
          <span className="jalurLabel">{l.label}</span>
          <span className="jalurRingkas">{l.ket}</span>
        </span>
        <Ikon nama="turun" size={18} className="jalurPanah" />
      </button>
      <div className="jalurRinci" id={idIsi} hidden={!buka}>
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
        <button type="button" className="ghost sm jalurBuka" aria-label={labelBuka(l)} onClick={() => pindah(l.layar, l.aksi)}>
          Buka
          <Ikon nama="kanan" size={16} />
        </button>
      </div>
    </li>
  );
}

/** Satu alur: judul, kapan berjalan, lalu langkah bernomor. */
function Jalur({ alur }) {
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
        <div>
          <h2 className="jalurJudul" id={idJudul}>
            {def.nama}
          </h2>
          <p className="jalurKet">{KET_JALUR[alur]}</p>
        </div>
      </div>
      <ol className="jalurLangkah">
        {def.langkah.map((l, i) => (
          <Langkah key={l.id} l={l} no={i + 1} />
        ))}
      </ol>
    </section>
  );
}

/** Panduan dua alur. Tanpa bilah alur karena kedua alur tampil utuh di sini. */
export default function PetaAlur() {
  const { pindah } = useProteksi();
  const [tabelBuka, setTabelBuka] = useState(false);
  const idTabel = useId();

  return (
    <div className={`isi ${css.layar}`}>
      <section className="titlerow">
        <div>
          <p className="eyebrow">Panduan untuk semua peran</p>
          <h1 className="h1">Cara sekolah menjaga anak</h1>
          <p className="lead">Ketuk langkah untuk melihat siapa yang mengerjakan dan kapan.</p>
        </div>
      </section>

      <div className="jalurDua">
        <Jalur alur="cegah" />
        <Jalur alur="kejadian" />
      </div>

      <section className="card tcard" data-bagian="jembatan">
        <KepalaKartu ikon="sebelah" judul="Dua alur saling terhubung" />
        <ul className="jembatan">
          {JEMBATAN.map((j) => (
            <li key={j.id} className={`jembatanKartu ${j.arah === "turun" ? "jembatanTurun" : "jembatanNaik"}`}>
              <span className="jembatanPanah" aria-hidden="true">
                <Ikon nama="sebelah" size={18} />
              </span>
              <div className="jembatanIsi">
                <h3 className="jembatanJudul">{j.judul}</h3>
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
            </li>
          ))}
        </ul>
      </section>

      <section className="card tcard" data-bagian="sla">
        <div className="tophead">
          <KepalaKartu ikon="jam" judul="Batas waktu per tingkat" />
          <span className="mut kecil">Usulan awal, bisa diatur tiap sekolah · hari kerja Senin sampai Jumat</span>
        </div>
        <ul className="tingkatDaftar">
          {SLA.map((r) => (
            <li key={r.tingkat} className="tingkatBaris">
              <span className={`pill sm ${r.pil} tingkatPil`}>{r.tingkat}</span>
              <span className="tingkatContoh">{r.contoh}</span>
              <span className="tingkatWaktu">
                Ditanggapi dalam <b>{r.respon}</b>
              </span>
            </li>
          ))}
        </ul>
        <p className="slaCatatan">
          Dihitung sejak laporan masuk; bila terlambat, kasus diteruskan ke wali kelas, Guru BK, lalu Kepala Sekolah.
        </p>
        <button
          type="button"
          className="ghost sm tabelTombol"
          aria-expanded={tabelBuka}
          aria-controls={idTabel}
          onClick={() => setTabelBuka((v) => !v)}
        >
          {tabelBuka ? "Tutup rincian batas waktu" : "Lihat rincian batas waktu"}
          <Ikon nama="turun" size={16} className={tabelBuka ? "putarAtas" : undefined} />
        </button>
        <div className="tbox slaKotak" id={idTabel} hidden={!tabelBuka}>
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
      </section>
    </div>
  );
}
