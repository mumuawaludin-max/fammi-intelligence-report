import { useId, useState } from "react";
import { Ikon, KepalaKartu, KepalaLaci, Laci } from "../komponen";
import { PetaHati, PilStatus, SkalaSkor } from "../bersama/HeartKecil";
import { HEART, LAPORAN_RAKA, STATUS, cariAspek, metaStatus } from "../bersama/heart";
import css from "./LaporanHeart.module.css";

const LAPORAN = LAPORAN_RAKA;

/** Status tiap aspek, bentuk { idAspek: status } yang dibaca PetaHati. */
const HASIL = Object.fromEntries(HEART.map((a) => [a.id, LAPORAN.aspek[a.id].status]));

// Kalimat "bukan diagnosis" sudah ada di baris kerahasiaan kepala laporan, jadi tidak diulang di sini.
const DISUSUN = LAPORAN.disusun.replace(/\s*Hasil screening bukan diagnosis\.?\s*$/, "");

/**
 * Bagian Hasil HEART di Laporan anak, mengikuti laporan contoh pemilik produk ("Deteksi Dini
 * Tantangan Perilaku dan Mental Anak"). Halaman hanya memuat yang ringkas: kalimat ringkasan, peta
 * hati lima keping, dan lima aspek dengan skor dan statusnya. Rincian satu aspek (artinya, batang
 * skor dengan ambang, lima indikator, faktor pendukung, saran) terbuka di laci saat aspek dipilih
 * dari hati atau daftar; di dalam laci huruf H E A R T memindah aspek. `aspek` dipegang layar supaya
 * laci Catat pengamatan ikut memakai aspek yang terakhir dibuka.
 */
export default function LaporanHeart({ aspek, onPilih }) {
  const [penjelas, setPenjelas] = useState(false);
  const [rincian, setRincian] = useState(false);
  const idPenjelas = `${useId()}-penjelas`;

  function buka(idAspek) {
    onPilih(idAspek);
    setRincian(true);
  }

  return (
    <section className={`card ${css.lh} ${css.laporan}`} data-bagian="hasil" aria-label="Hasil screening HEART">
      <div className="lhkepala">
        <KepalaKartu ikon="hati" judul="Hasil screening HEART" />
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
        <p className="lhpjket">Skor 0 sampai 10: makin tinggi, makin perlu diperhatikan, termasuk Tolong Menolong.</p>
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

      <div className="lhpeta">
        <div className="lhhati">
          <PetaHati hasil={HASIL} onPilih={buka} berlabel lebar={196} label="Peta HEART Raka, pilih aspek untuk melihat rinciannya" />
        </div>
        <div className="lhdaftar">
          <div className="lhdaftarkepala" aria-hidden="true">
            <span>Aspek</span>
            <span>Skor</span>
            <span>Status</span>
          </div>
          <ul aria-label="Lima aspek HEART, pilih untuk melihat rinciannya">
            {HEART.map((a) => {
              const h = LAPORAN.aspek[a.id];
              return (
                <li key={a.id}>
                  <button
                    type="button"
                    className="lhbaris"
                    aria-haspopup="dialog"
                    aria-label={`${a.nama}, skor ${h.skor} dari 10, ${metaStatus(h.status).label}. Lihat rincian`}
                    onClick={() => buka(a.id)}
                  >
                    <span className={`lhkode st-${h.status}`}>{a.kode}</span>
                    <span className="lhnama">{a.nama}</span>
                    <span className="lhskor">
                      {h.skor}
                      <small>/10</small>
                    </span>
                    <PilStatus status={h.status} kecil />
                    <Ikon nama="kanan" size={18} className="lhpanah" />
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="lhpetunjuk">Pilih aspek untuk melihat indikator, faktor pendukung, dan saran.</p>
        </div>
      </div>

      <p className="lhkaki">
        <Ikon nama="skrining" size={14} />
        Sumber: {LAPORAN.sumber}. {DISUSUN}
      </p>

      {rincian && <LaciRincian aspek={aspek} onPilih={onPilih} onTutup={() => setRincian(false)} />}
    </section>
  );
}

/** Laci rincian satu aspek: pindah aspek lewat huruf H E A R T, lalu isi laporan contoh per aspek. */
function LaciRincian({ aspek, onPilih, onTutup }) {
  const [umumkan, setUmumkan] = useState("");
  const def = cariAspek(aspek);
  const hasil = LAPORAN.aspek[aspek];

  function pilih(idAspek) {
    onPilih(idAspek);
    const a = cariAspek(idAspek);
    const h = LAPORAN.aspek[idAspek];
    setUmumkan(`Menampilkan ${a.nama}: ${metaStatus(h.status).label}, skor ${h.skor} dari 10.`);
  }

  return (
    <Laci label={`Rincian HEART ${def.nama}`} labelTutup="Tutup rincian" lebar={640} className={`${css.lh} ${css.rincian}`} onTutup={onTutup}>
      <KepalaLaci
        awal={
          <span className={`lhkode besar st-${hasil.status}`} aria-hidden="true">
            {def.kode}
          </span>
        }
        judul={def.nama}
        sub={`Skor ${hasil.skor} dari 10 · Tes ${LAPORAN.tanggal}`}
        onTutup={onTutup}
      />

      <div className="lhsegmen" role="group" aria-label="Pindah aspek">
        {HEART.map((a) => {
          const aktif = a.id === aspek;
          return (
            <button
              key={a.id}
              type="button"
              className={`lhhuruf${aktif ? " on" : ""}`}
              aria-pressed={aktif}
              aria-label={`${a.nama}, ${metaStatus(HASIL[a.id]).label}`}
              title={a.nama}
              onClick={() => pilih(a.id)}
            >
              <span className={`lhtitik st-${HASIL[a.id]}`} aria-hidden="true" />
              {a.kode}
            </button>
          );
        })}
      </div>

      <div className="lhstatus">
        <p className={`lharti st-${hasil.status}`}>
          <PilStatus status={hasil.status} kecil />
          <span>{STATUS[hasil.status].arti}</span>
        </p>
        <div className="lhskala">
          <SkalaSkor aspek={def} skor={hasil.skor} />
        </div>
      </div>

      <div className="lhblok">
        <h3 className="lhsub">Indikator</h3>
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

      <div className="lhblok">
        <h3 className="lhsub">Faktor pendukung</h3>
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

      <div className="lhblok">
        <h3 className="lhsub">Saran untuk orang tua dan sekolah</h3>
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

      <p className="lhkaki">
        <Ikon nama="skrining" size={14} />
        Sumber: {LAPORAN.sumber}. {DISUSUN}
      </p>

      <p className="sr" aria-live="polite">
        {umumkan}
      </p>
    </Laci>
  );
}
