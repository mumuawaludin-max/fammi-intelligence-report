import { useId, useMemo, useState } from "react";
import { useProteksi } from "../konteks";
import { Ikon, KepalaKartu, KepalaLaci, Laci } from "../komponen";
import { ORANG, cariLayar } from "../layarProteksi";
import { ALUR } from "../bersama/alur";
import { HEART, RINGKAS_SEKOLAH } from "../bersama/heart";
import {
  KINERJA_KASUS,
  LANGKAH_KUNCI,
  PESAN_UNDUH,
  TANGGAL,
  daftarKeputusan,
  hitungChecklist,
  hitungTindakLanjut,
  isiCegah,
  isiKejadian,
  kalimatPembuka,
  pengingat,
} from "./ringkasanData";
import { BatangTumpuk, Donat, Legenda } from "../bersama/Grafik";
import { WARNA_STATUS } from "../bersama/grafikAlat";
import GrafikKasus from "./GrafikKasus";
import { KASUS_AWAL } from "./kasusData";
import css from "./Ringkasan.module.css";

const NADA_NILAI = { r: "nilaiMerah", o: "nilaiJingga" };
const NADA_STATUS = { r: "statusMerah", o: "statusJingga" };

/** Keterangan kecil di bawah judul tiap alur. */
const KET_ALUR = { cegah: "Batas screening Jumat, 13 Nov", kejadian: `${KINERJA_KASUS.aktif} kasus aktif` };

/** Ke mana sebuah langkah membawa, untuk tooltip dan pembaca layar. */
function tujuanLangkah(l) {
  if (l.aksi?.jenis === "lapor") return "Buka formulir lapor kejadian";
  if (l.aksi?.jenis === "tahap") return `Buka daftar ${l.label.toLowerCase()}`;
  return `Buka ${cariLayar(l.layar)?.label ?? "layar"}`;
}

/**
 * Satu langkah alur sebagai baris yang bisa diklik: label dan keterangan di kiri, angka di kanan.
 * Definisi langkah (label, layar, aksi) dari bersama/alur.js, jadi klik di sini sama dengan klik di
 * bilah alur layar lain. `no` = nomor langkah, hanya di laci rincian.
 */
function BarisLangkah({ l, x, no }) {
  const { pindah } = useProteksi();
  const tujuan = tujuanLangkah(l);
  return (
    <li className="lgButir">
      <button type="button" className="lgTombol" title={tujuan} onClick={() => pindah(l.layar, l.aksi)}>
        {no != null && (
          <span className="lgNo" aria-hidden="true">
            {no}
          </span>
        )}
        <span className="lgTeks">
          <span className="lgLabel">
            {l.label}
            <span className="sr">{`: ${x.bacaan}. ${tujuan}.`}</span>
          </span>
          <span className="lgKet" aria-hidden="true">
            {x.ket}
            {/* Spasi di luar <b> supaya tetap jadi tempat pemenggalan baris. */}
            {x.tanda && (
              <>
                {" "}
                <b>{x.tanda}</b>
              </>
            )}
          </span>
        </span>
        <span className={`lgNilai${x.nada ? ` ${NADA_NILAI[x.nada]}` : ""}`} aria-hidden="true">
          {x.nilai}
          {x.satuan && <small>{x.satuan}</small>}
        </span>
        <Ikon nama="kanan" size={16} className="lgPanah" />
      </button>
    </li>
  );
}

/** Kepala panel dan laci alur: ubin ikon berwarna alur. */
function UbinAlur({ alur }) {
  const kejadian = alur === "kejadian";
  return (
    <span className={`tile hdr ${kejadian ? "red" : "p"}`} aria-hidden="true">
      <Ikon nama={kejadian ? "lapor" : "perisaiCentang"} size={16} />
    </span>
  );
}

/** Satu alur di halaman: beberapa angka kunci (LANGKAH_KUNCI), satu baris kaki, dan tombol rincian. */
function PanelAlur({ alur, isi, kaki, onRinci }) {
  const def = ALUR[alur];
  const idJudul = useId();
  const kunci = def.langkah.filter((l) => LANGKAH_KUNCI[alur].includes(l.id));

  return (
    <section className={`card alurPanel ${alur === "kejadian" ? "nadaKejadian" : "nadaCegah"}`} aria-labelledby={idJudul}>
      <div className="alurKepala">
        <UbinAlur alur={alur} />
        <div className="alurJudulBlok">
          <h2 className="alurJudul" id={idJudul}>
            {def.nama}
          </h2>
          <p className="alurKet">{KET_ALUR[alur]}</p>
        </div>
        <button type="button" className="ghost sm" onClick={onRinci} aria-haspopup="dialog">
          Lihat semua langkah
        </button>
      </div>
      <ul className="lgDaftar">
        {kunci.map((l) => (
          <BarisLangkah key={l.id} l={l} x={isi[l.id]} />
        ))}
      </ul>
      <div className="alurKaki">{kaki}</div>
    </section>
  );
}

/** Laci rincian satu alur: semua langkah bernomor, masing-masing bisa diklik ke layar tujuannya. */
function LaciAlur({ alur, isi, kaki, onTutup }) {
  const def = ALUR[alur];
  return (
    <Laci label={`Semua langkah ${def.nama.toLowerCase()}`} labelTutup="Tutup rincian alur" onTutup={onTutup} lebar={460}>
      <KepalaLaci awal={<UbinAlur alur={alur} />} judul={def.nama} sub={def.ringkas} onTutup={onTutup} />
      <ol className={`lgDaftar lgBernomor ${alur === "kejadian" ? "nadaKejadian" : "nadaCegah"}`}>
        {def.langkah.map((l, i) => (
          <BarisLangkah key={l.id} l={l} x={isi[l.id]} no={i + 1} />
        ))}
      </ol>
      <div className="alurKaki">{kaki}</div>
    </Laci>
  );
}

/**
 * Layar Ringkasan, sudut pandang Kepala Sekolah. Urutan mengikuti pertanyaan pimpinan (2026-11-25):
 * "ada yang harus saya putuskan?" (Darurat paling atas), lalu "sekolah aman atau tidak?" lewat
 * beberapa angka kunci per alur, lalu hasil HEART sekolah yang dilipat. Rincian semua langkah alur
 * ada di laci. Tanpa bilah alur karena kedua alur sudah tampil di sini.
 */
export default function Ringkasan() {
  const { pindah, toast, beriTahu, centang, rencanaBaru, checklistTambahan } = useProteksi();
  const [pengingatTerkirim, setPengingatTerkirim] = useState(false);
  const [laci, setLaci] = useState(null);

  // Angka hidup dari konteks: rencana yang disusun Guru BK di layar Skrining dan centang checklist.
  const tindak = hitungTindakLanjut(rencanaBaru);
  const cegah = isiCegah(tindak, hitungChecklist(centang, checklistTambahan));
  const kejadian = isiKejadian(centang);
  const keputusan = daftarKeputusan(tindak);
  const isiPengingat = pengingat(tindak);
  const r = RINGKAS_SEKOLAH;

  // Dua aspek dengan anak Waspada terbanyak, untuk kalimat di bawah grafik.
  const teratas = useMemo(
    () => [...HEART].sort((a, b) => r.perAspek[b.id].waspada - r.perAspek[a.id].waspada).slice(0, 2),
    [r],
  );

  const kakiCegah = (
    <p className="jembatanKecil">
      <Ikon nama="peringatan" size={15} />
      <span>
        <b>{r.tandaBahaya} tanda bahaya</b> dari screening langsung masuk alur kejadian
      </span>
    </p>
  );
  const kakiKejadian = (
    <p className="kinerja">
      <span>
        <b className="nilaiHijau">{KINERJA_KASUS.ketepatanSla}</b> tepat waktu
      </span>
      <span className="pisahTitik" aria-hidden="true" />
      <span>
        tanggapan pertama rata-rata <b>{KINERJA_KASUS.responRata}</b>
      </span>
    </p>
  );
  const ALUR_LAYAR = {
    cegah: { isi: cegah, kaki: kakiCegah },
    kejadian: { isi: kejadian, kaki: kakiKejadian },
  };

  function ingatkan() {
    if (pengingatTerkirim) {
      toast("Pengingat sudah terkirim hari ini");
      return;
    }
    isiPengingat.notifikasi.forEach((n) => beriTahu(n));
    setPengingatTerkirim(true);
    toast(isiPengingat.pesan);
  }

  // Grafik HEART sekolah: donat status anak dan batang bertumpuk per aspek.
  const dataHeart = [
    { id: "baik", label: "Aman", nilai: r.baik, warna: WARNA_STATUS.baik },
    { id: "perhatian", label: "Perlu Diperhatikan", nilai: r.perhatian, warna: WARNA_STATUS.perhatian },
    { id: "waspada", label: "Perlu Perhatian Lebih", nilai: r.waspada, warna: WARNA_STATUS.waspada },
    { id: "belum", label: "Belum ikut screening", nilai: r.total - r.terpetakan, warna: WARNA_STATUS.belum },
  ];
  const barisAspek = HEART.map((a) => {
    const x = r.perAspek[a.id];
    return {
      id: a.id,
      label: a.nama,
      kanan: `${x.perhatian + x.waspada} anak`,
      bagian: [
        { id: "baik", label: "Aman", nilai: x.baik, warna: WARNA_STATUS.baik },
        { id: "perhatian", label: "Perlu Diperhatikan", nilai: x.perhatian, warna: WARNA_STATUS.perhatian },
        { id: "waspada", label: "Perlu Perhatian Lebih", nilai: x.waspada, warna: WARNA_STATUS.waspada },
      ],
    };
  });

  return (
    <div className={`isi ${css.layar}`}>
      <section className="titlerow">
        <div>
          <p className="eyebrow">Ringkasan sekolah · {TANGGAL}</p>
          <h1 className="h1">Selamat pagi, {ORANG.kepsek.nama}</h1>
          <p className="lead">{kalimatPembuka(tindak)}</p>
        </div>
        <div className="tbtns">
          <button type="button" className="ghost sm" onClick={() => toast(PESAN_UNDUH)}>
            <Ikon nama="unduh" size={16} />
            Unduh laporan pimpinan
          </button>
        </div>
      </section>

      <section className="card tcard keputusan">
        <div className="tophead">
          <KepalaKartu ikon="bendera" nada="red" judul="Perlu keputusan Anda" />
          <span className="mut kecil">{keputusan.length} butir</span>
        </div>
        <ul className="kepDaftar">
          {keputusan.map((k) => (
            <li key={k.id} className="kepButir">
              <span className={`pill sm ${k.pil} kepPenanda`}>{k.penanda}</span>
              <div className="kepIsi">
                <p className="kepJudul">
                  <b>{k.judul}</b> <span className={NADA_STATUS[k.warna] || undefined}>{k.status}</span>
                </p>
                <p className="kepMeta">{k.meta}</p>
              </div>
              <div className="kepAksi">
                {k.ingatkan && (
                  <button
                    type="button"
                    className={`ghost sm${pengingatTerkirim ? " terkirim" : ""}`}
                    aria-disabled={pengingatTerkirim || undefined}
                    aria-label={pengingatTerkirim ? "Pengingat sudah terkirim" : isiPengingat.label}
                    onClick={ingatkan}
                  >
                    <Ikon nama={pengingatTerkirim ? "centang" : "kirim"} size={15} />
                    {pengingatTerkirim ? "Terkirim" : "Ingatkan"}
                  </button>
                )}
                <button
                  type="button"
                  className="ghost sm"
                  aria-label={k.labelBuka}
                  onClick={() => pindah(k.tujuan.layar, k.tujuan.aksi)}
                >
                  Buka
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <div className="alurDua">
        {Object.entries(ALUR_LAYAR).map(([alur, a]) => (
          <PanelAlur key={alur} alur={alur} isi={a.isi} kaki={a.kaki} onRinci={() => setLaci(alur)} />
        ))}
      </div>

      <div className="grafikDua">
        <section className="card tcard heartSekolah" aria-labelledby="rk-heart">
          <div className="tophead">
            <KepalaKartu ikon="hati" judul="Hasil HEART sekolah" />
            <button type="button" className="ghost sm" onClick={() => pindah("pemetaan")}>
              Lihat hasil lengkap
              <Ikon nama="kanan" size={16} />
            </button>
          </div>
          <h3 className="sr" id="rk-heart">
            Hasil HEART sekolah
          </h3>
          <div className="heartGrafik">
            <div className="heartDonat">
              <Donat data={dataHeart} tengah={r.terpetakan} sub="anak ikut screening" ukuran={132} tebal={16} />
              <Legenda data={dataHeart} kolom />
            </div>
            <BatangTumpuk baris={barisAspek} ringkas />
          </div>
          <p className="heartKaki">
            Paling banyak Perlu Perhatian Lebih:{" "}
            {teratas.map((a, i) => (
              <span key={a.id}>
                {i > 0 && " dan "}
                <b>{a.nama}</b> ({r.perAspek[a.id].waspada})
              </span>
            ))}
            .
          </p>
        </section>

        <section className="card tcard" aria-labelledby="rk-kasus">
          <div className="tophead">
            <KepalaKartu ikon="tiket" nada="red" judul="Kasus aktif" />
            <button type="button" className="ghost sm" onClick={() => pindah("kasus")}>
              Buka kasus
              <Ikon nama="kanan" size={16} />
            </button>
          </div>
          <h3 className="sr" id="rk-kasus">
            Kasus aktif per tingkat dan langkah
          </h3>
          <GrafikKasus daftar={KASUS_AWAL} onTahap={(id) => pindah("kasus", { jenis: "tahap", id })} />
        </section>
      </div>

      {laci && (
        <LaciAlur alur={laci} isi={ALUR_LAYAR[laci].isi} kaki={ALUR_LAYAR[laci].kaki} onTutup={() => setLaci(null)} />
      )}
    </div>
  );
}
