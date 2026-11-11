import { useId, useMemo, useState } from "react";
import { useProteksi } from "../konteks";
import { Ikon, KepalaKartu } from "../komponen";
import { ORANG, cariLayar } from "../layarProteksi";
import { ALUR } from "../bersama/alur";
import { HEART, RINGKAS_SEKOLAH } from "../bersama/heart";
import {
  KINERJA_KASUS,
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
import css from "./Ringkasan.module.css";

const NADA_NILAI = { r: "nilaiMerah", o: "nilaiJingga" };
const NADA_STATUS = { r: "statusMerah", o: "statusJingga" };

/** Ke mana sebuah langkah membawa, untuk tooltip dan pembaca layar. */
function tujuanLangkah(l) {
  if (l.aksi?.jenis === "lapor") return "Buka formulir lapor kejadian";
  if (l.aksi?.jenis === "tahap") return `Buka antrean ${l.label.toLowerCase()}`;
  return `Buka ${cariLayar(l.layar)?.label ?? "layar"}`;
}

/**
 * Satu alur sebagai deret langkah yang bisa diklik. Tiap langkah memakai definisi di
 * bersama/alur.js (label, layar, aksi), jadi klik di sini sama dengan klik di bilah alur layar lain.
 * `isi` = angka, keterangan, dan kalimat untuk pembaca layar per langkah; `kaki` = baris bawah.
 */
function PanelAlur({ alur, kanan, isi, kaki }) {
  const { pindah } = useProteksi();
  const def = ALUR[alur];
  const idJudul = useId();
  const kejadian = alur === "kejadian";

  return (
    <section className={`card alurPanel ${kejadian ? "nadaKejadian" : "nadaCegah"}`} aria-labelledby={idJudul}>
      <div className="alurKepala">
        <span className={`tile hdr ${kejadian ? "red" : "p"}`} aria-hidden="true">
          <Ikon nama={kejadian ? "lapor" : "perisaiCentang"} size={16} />
        </span>
        <h2 className="alurJudul" id={idJudul}>
          {def.nama}
        </h2>
        <span className="alurKanan">{kanan}</span>
      </div>
      <ol className="alurLangkah" style={{ "--n": def.langkah.length }}>
        {def.langkah.map((l, i) => {
          const x = isi[l.id];
          const tujuan = tujuanLangkah(l);
          return (
            <li key={l.id} className="alurButir">
              <button type="button" className="alurTombol" title={tujuan} onClick={() => pindah(l.layar, l.aksi)}>
                <span className="alurNo" aria-hidden="true">
                  {i + 1}
                </span>
                <span className="alurLabel">
                  {l.label}
                  <span className="sr">{`: ${x.bacaan}. ${tujuan}.`}</span>
                </span>
                <span className={`alurNilai${x.nada ? ` ${NADA_NILAI[x.nada]}` : ""}`} aria-hidden="true">
                  {x.nilai}
                  {x.satuan && <small>{x.satuan}</small>}
                </span>
                <span className="alurKet" aria-hidden="true">
                  {x.ket}
                  {/* Spasi di luar <b> supaya tetap jadi tempat pemenggalan baris. */}
                  {x.tanda && (
                    <>
                      {" "}
                      <b>{x.tanda}</b>
                    </>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <div className="alurKaki">{kaki}</div>
    </section>
  );
}

/**
 * Layar Ringkasan, sudut pandang Kepala Sekolah (versi ringkas 2026-11-11): kedua alur sekolah
 * berdampingan, butir yang menunggu keputusan pimpinan, dan sebaran hasil HEART per aspek. Tanpa
 * bilah alur karena kedua alur tampil utuh di sini.
 */
export default function Ringkasan() {
  const { pindah, toast, beriTahu, centang, rencanaBaru, checklistTambahan } = useProteksi();
  const [pengingatTerkirim, setPengingatTerkirim] = useState(false);

  // Angka hidup dari konteks: rencana yang disusun Guru BK di layar Skrining dan centang checklist.
  const tindak = hitungTindakLanjut(rencanaBaru);
  const cegah = isiCegah(tindak, hitungChecklist(centang, checklistTambahan));
  const kejadian = isiKejadian(centang);
  const keputusan = daftarKeputusan(tindak);
  const isiPengingat = pengingat(tindak);

  // Dua aspek dengan anak Waspada terbanyak, untuk kalimat di bawah grafik.
  const teratas = useMemo(
    () =>
      [...HEART]
        .sort((a, b) => RINGKAS_SEKOLAH.perAspek[b.id].waspada - RINGKAS_SEKOLAH.perAspek[a.id].waspada)
        .slice(0, 2),
    [],
  );

  function ingatkan() {
    if (pengingatTerkirim) {
      toast("Pengingat sudah terkirim hari ini");
      return;
    }
    isiPengingat.notifikasi.forEach((n) => beriTahu(n));
    setPengingatTerkirim(true);
    toast(isiPengingat.pesan);
  }

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

      <div className="alurDua">
        <PanelAlur
          alur="cegah"
          kanan="Batas skrining Jumat, 13 Nov"
          isi={cegah}
          kaki={
            <p className="jembatanKecil">
              <Ikon nama="peringatan" size={15} />
              <span>
                <b>{RINGKAS_SEKOLAH.tandaBahaya} tanda bahaya</b> dari skrining langsung masuk alur kejadian
              </span>
              <Ikon nama="sebelah" size={15} className="panahJembatan" />
            </p>
          }
        />
        <PanelAlur
          alur="kejadian"
          kanan={`${KINERJA_KASUS.aktif} kasus aktif`}
          isi={kejadian}
          kaki={
            <p className="kinerja">
              <span>
                <b className="nilaiHijau">{KINERJA_KASUS.ketepatanSla}</b> ketepatan SLA
              </span>
              <span className="pisahTitik" aria-hidden="true" />
              <span>
                respon pertama rata-rata <b>{KINERJA_KASUS.responRata}</b>
              </span>
            </p>
          }
        />
      </div>

      <div className="barisBawah">
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

        <section className="card tcard heartSekolah">
          <div className="tophead">
            <KepalaKartu ikon="hati" judul="Hasil HEART sekolah" />
            <button type="button" className="ghost sm" onClick={() => pindah("skrining")}>
              Buka skrining
            </button>
          </div>
          <div className="legendaBaris">
            <ul className="legenda" aria-hidden="true">
              <li>
                <span className="titikWarna isiBaik" />
                Baik
              </li>
              <li>
                <span className="titikWarna isiPerhatian" />
                Perlu Perhatian
              </li>
              <li>
                <span className="titikWarna isiWaspada" />
                Waspada
              </li>
            </ul>
            <span className="mut kecil">{RINGKAS_SEKOLAH.terpetakan} anak terpetakan</span>
          </div>
          <ul className="aspekDaftar">
            {HEART.map((a) => {
              const x = RINGKAS_SEKOLAH.perAspek[a.id];
              // Lebar sebanding jumlah anak (flex-grow); keping kecil tetap terlihat lewat min-width di CSS.
              const keping = (n, kelas) => (n > 0 ? <span className={kelas} style={{ flexGrow: n }} /> : null);
              return (
                <li key={a.id} className="aspekBaris">
                  <span className="aspekKode" aria-hidden="true">
                    {a.kode}
                  </span>
                  <span className="aspekNama">{a.nama}</span>
                  <span className="aspekBatang" aria-hidden="true">
                    {keping(x.baik, "isiBaik")}
                    {keping(x.perhatian, "isiPerhatian")}
                    {keping(x.waspada, "isiWaspada")}
                  </span>
                  <span className="sr">{`: Baik ${x.baik}, Perlu Perhatian ${x.perhatian}, Waspada ${x.waspada}`}</span>
                  <span className="angkaChip angkaPerhatian" aria-hidden="true" title={`${x.perhatian} anak Perlu Perhatian`}>
                    {x.perhatian}
                  </span>
                  <span className="angkaChip angkaWaspada" aria-hidden="true" title={`${x.waspada} anak Waspada`}>
                    {x.waspada}
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="heartKaki">
            Paling banyak Waspada:{" "}
            {teratas.map((a, i) => (
              <span key={a.id}>
                {i > 0 && " dan "}
                <b>{a.nama}</b> ({RINGKAS_SEKOLAH.perAspek[a.id].waspada})
              </span>
            ))}
            .
          </p>
        </section>
      </div>
    </div>
  );
}
