import { useId, useState } from "react";
import { Ikon, KepalaKartu } from "../komponen";
import { PetaHati, PilStatus, SkalaSkor } from "../bersama/HeartKecil";
import { HEART, LAPORAN_RAKA, STATUS, cariAspek, metaStatus } from "../bersama/heart";
import css from "./LaporanHeart.module.css";

const LAPORAN = LAPORAN_RAKA;

/** Status tiap aspek, bentuk { idAspek: status } yang dibaca PetaHati. */
const HASIL = Object.fromEntries(HEART.map((a) => [a.id, LAPORAN.aspek[a.id].status]));

// Kalimat "bukan diagnosis" sudah ada di baris kerahasiaan kepala laporan, jadi tidak diulang di sini.
const DISUSUN = LAPORAN.disusun.replace(/\s*Hasil skrining bukan diagnosis\.?\s*$/, "");

/**
 * Bagian Hasil HEART di Laporan anak, mengikuti laporan contoh pemilik produk ("Deteksi Dini
 * Tantangan Perilaku dan Mental Anak"): ringkasan, peta hati lima keping, tabel lima aspek, lalu
 * isi satu aspek (status dan artinya, batang skor dengan ambang, lima indikator, faktor pendukung,
 * saran). Aspek bisa dipilih dari hati, tabel aspek, atau huruf H E A R T di atas detail. `aspek`
 * dipegang layar supaya laci Catat observasi ikut memakai aspek yang sedang dibuka.
 *
 * Di layar lebar faktor pendukung duduk di kolom kiri di bawah tabel aspek supaya kedua kolom sama
 * tinggi; di layar sempit urutannya kembali seperti laporan contoh (indikator, pendukung, saran).
 */
export default function LaporanHeart({ aspek, onPilih }) {
  const [penjelas, setPenjelas] = useState(false);
  const [umumkan, setUmumkan] = useState("");
  const idPenjelas = `${useId()}-penjelas`;

  function pilih(idAspek) {
    onPilih(idAspek);
    const a = cariAspek(idAspek);
    const h = LAPORAN.aspek[idAspek];
    setUmumkan(`Menampilkan ${a.nama}: ${metaStatus(h.status).label}, skor ${h.skor} dari 10.`);
  }

  return (
    <section className={`card ${css.laporan}`} data-bagian="hasil" aria-label="Hasil skrining HEART">
      <div className="lhkepala">
        <KepalaKartu ikon="hati" judul="Hasil skrining HEART" />
        <span className="lhtanggal">Tes {LAPORAN.tanggal}</span>
        <button
          type="button"
          className="ghost sm lhbukapj"
          aria-expanded={penjelas}
          aria-controls={idPenjelas}
          onClick={() => setPenjelas((b) => !b)}
        >
          <Ikon nama="info" size={16} />
          Apa yang dinilai HEART
          <Ikon nama="turun" size={18} className={penjelas ? "lhputar" : undefined} />
        </button>
      </div>

      <div id={idPenjelas} className="lhpj" hidden={!penjelas}>
        <p className="lhpjket">
          Skor tiap aspek 0 sampai 10: makin tinggi, makin perlu perhatian, termasuk Tolong Menolong. Ambang tiap
          aspek berbeda dan terlihat di batang skor.
        </p>
        <dl className="lhpjgrid">
          {HEART.map((a) => (
            <div key={a.id} className="lhpjitem">
              <dt>
                <span className={`lhkode st-${HASIL[a.id]}`} aria-hidden="true">
                  {a.kode}
                </span>
                {a.nama}
              </dt>
              <dd>
                <b>Yang dinilai.</b> {a.dinilai}
              </dd>
              <dd>
                <b>Gunanya.</b> {a.penting}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <p className="lhringkas">{LAPORAN.ringkas}</p>

      <div className="lhbadan">
        <div className="lhkol">
          <div className="lhpeta">
            <div className="lhhati">
              <PetaHati hasil={HASIL} aktif={aspek} onPilih={pilih} berlabel lebar={208} label="Peta HEART Raka, pilih aspek" />
            </div>
            <div className="lhdaftar">
              <div className="lhdaftarkepala" aria-hidden="true">
                <span>Aspek</span>
                <span>Skor</span>
                <span>Status</span>
              </div>
              <ul aria-label="Lima aspek HEART">
                {HEART.map((a) => {
                  const h = LAPORAN.aspek[a.id];
                  const aktif = a.id === aspek;
                  return (
                    <li key={a.id}>
                      <button
                        type="button"
                        className={`lhbaris${aktif ? " on" : ""}`}
                        aria-pressed={aktif}
                        aria-label={`${a.nama}, skor ${h.skor} dari 10, ${metaStatus(h.status).label}`}
                        onClick={() => pilih(a.id)}
                      >
                        <span className={`lhkode st-${h.status}`}>{a.kode}</span>
                        <span className="lhnama">{a.nama}</span>
                        <span className="lhskor">
                          {h.skor}
                          <small>/10</small>
                        </span>
                        <PilStatus status={h.status} kecil />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
          <PendukungAspek aspek={aspek} />
        </div>

        <div className="lhkol">
          <DetailAspek aspek={aspek} onPilih={pilih} />
          <SaranAspek aspek={aspek} />
        </div>
      </div>

      <p className="lhkaki">
        <Ikon nama="skrining" size={14} />
        Sumber: {LAPORAN.sumber}. {DISUSUN}
      </p>

      <p className="sr" aria-live="polite">
        {umumkan}
      </p>
    </section>
  );
}

/** Kepala detail (huruf H E A R T untuk berpindah), status dan artinya, batang skor, lima indikator. */
function DetailAspek({ aspek, onPilih }) {
  const def = cariAspek(aspek);
  const hasil = LAPORAN.aspek[aspek];
  return (
    <div className="lhdetail">
      <div className="lhdkepala">
        <span className={`lhkode besar st-${hasil.status}`} aria-hidden="true">
          {def.kode}
        </span>
        <h3 className="lhdjudul">{def.nama}</h3>
        <PilStatus status={hasil.status} />
        <div className="lhsegmen" role="group" aria-label="Pindah aspek">
          {HEART.map((a) => {
            const aktif = a.id === aspek;
            return (
              <button
                key={a.id}
                type="button"
                className={`lhhuruf st-${HASIL[a.id]}${aktif ? " on" : ""}`}
                aria-pressed={aktif}
                aria-label={`${a.nama}, ${metaStatus(HASIL[a.id]).label}`}
                title={a.nama}
                onClick={() => onPilih(a.id)}
              >
                {a.kode}
              </button>
            );
          })}
        </div>
      </div>

      <div className="lhstatus">
        <p className={`lharti st-${hasil.status}`}>
          <b>Artinya:</b> {STATUS[hasil.status].arti}
        </p>
        <div className="lhskala">
          <SkalaSkor aspek={def} skor={hasil.skor} />
        </div>
      </div>

      <div className="tbox">
        <table className="tbl lhind">
          <caption className="sr">Lima indikator {def.nama}</caption>
          <thead>
            <tr>
              <th scope="col">Indikator</th>
              <th scope="col">Status</th>
              <th scope="col">Keterangan</th>
            </tr>
          </thead>
          <tbody>
            {def.indikator.map((nama, i) => (
              <tr key={nama}>
                <th scope="row">{nama}</th>
                <td>
                  <PilStatus status={hasil.indikator[i].status} kecil />
                </td>
                <td>{hasil.indikator[i].deskripsi}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Faktor pendukung aspek terpilih: kebiasaan sehari-hari dari isian skrining, dua kolom. */
function PendukungAspek({ aspek }) {
  const def = cariAspek(aspek);
  const hasil = LAPORAN.aspek[aspek];
  return (
    <div className="lhblok lhpendukung">
      <h4 className="lhsub">
        Faktor pendukung <span>· {def.nama}</span>
      </h4>
      <div className="tbox">
        <table className="tbl lhpend">
          <caption className="sr">Faktor pendukung {def.nama}: kebiasaan sehari-hari</caption>
          <thead>
            <tr>
              <th scope="col">Aspek</th>
              <th scope="col">Kebiasaan</th>
            </tr>
          </thead>
          <tbody>
            {hasil.pendukung.map(([hal, kebiasaan]) => (
              <tr key={hal}>
                <th scope="row">{hal}</th>
                <td>{kebiasaan}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Saran aspek terpilih untuk orang tua dan sekolah: tiap kartu "Lakukan" lalu "Caranya". */
function SaranAspek({ aspek }) {
  const def = cariAspek(aspek);
  const hasil = LAPORAN.aspek[aspek];
  return (
    <div className="lhblok lhsaranblok">
      <h4 className="lhsub">
        Saran untuk orang tua dan sekolah <span>· {def.nama}</span>
      </h4>
      <ol className="lhsaran">
        {hasil.saran.map((s, i) => (
          <li key={s.lakukan} className="lhsarankartu">
            <span className="lhno" aria-hidden="true">
              {i + 1}
            </span>
            <dl className="lhsaranisi">
              <dt>Lakukan</dt>
              <dd>
                <b>{s.lakukan}</b>
              </dd>
              <dt>Caranya</dt>
              <dd>
                <ul>
                  {s.caranya.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </dd>
            </dl>
          </li>
        ))}
      </ol>
    </div>
  );
}
