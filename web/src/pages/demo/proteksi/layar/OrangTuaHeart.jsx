import { Ikon } from "../komponen";
import { PetaHati, PilStatus, SkalaSkor } from "../bersama/HeartKecil";
import { HEART, LAPORAN_RAKA, STATUS, cariAspek } from "../bersama/heart";
import { DUKUNGAN_RAKA } from "../bersama/dukungan";
import { BarisTugas, Catatan } from "./OrangTuaBagian";
import { awalKecil, gabungNama, kelas } from "./OrangTuaAlat";
import {
  CATATAN_STATUS,
  HASIL_RAKA,
  IC,
  PENDAMPING_LAIN,
  PENDAMPING_UTAMA,
  TUGAS_RUMAH,
  TUGAS_SEKOLAH,
} from "./orangTuaData";

/**
 * Hasil HEART versi orang tua, mengikuti laporan contoh "Deteksi Dini Tantangan Perilaku dan Mental
 * Anak" yang dipadatkan untuk ponsel: kepala laporan, peta hati lima keping yang bisa diketuk,
 * daftar lima aspek, lalu siapa yang mendampingi Raka. Mengetuk aspek membuka DetailAspek.
 */
export function HasilHeart({ onBukaAspek, obrolanDiminta, onMintaObrolan }) {
  return (
    <div className="hp-pad">
      <section className="hp-card hp-sorot" aria-labelledby="ortu-h-judul">
        <div className="hp-row">
          <span className="hp-avatar" aria-hidden="true">
            {LAPORAN_RAKA.anak.inisial}
          </span>
          <div className="hp-fleks">
            <h3 id="ortu-h-judul" className="hp-ct">
              Hasil skrining HEART Raka
            </h3>
            <p className="hp-cm">{LAPORAN_RAKA.tanggal} · disusun ahli dan psikolog Fammi, bukan diagnosis</p>
          </div>
        </div>
        <p className="hp-cd">{LAPORAN_RAKA.ringkas}</p>
        <p className="hp-cm">Sumber: {awalKecil(LAPORAN_RAKA.sumber)}.</p>
      </section>

      <section className="hp-card" aria-labelledby="ortu-h-aspek">
        <div>
          <h3 id="ortu-h-aspek" className="hp-ct">
            Lima aspek HEART
          </h3>
          <p className="hp-cm">Ketuk aspek untuk melihat artinya dan saran untuk di rumah.</p>
        </div>
        <div className="hp-petahati">
          <PetaHati hasil={HASIL_RAKA} onPilih={onBukaAspek} lebar={208} label="Peta HEART Raka, pilih aspek" />
        </div>
        <ul className="hp-aspeklist">
          {HEART.map((a) => {
            const st = HASIL_RAKA[a.id];
            return (
              <li key={a.id}>
                <button type="button" className="hp-aspek" onClick={() => onBukaAspek(a.id)}>
                  <span className={`hp-huruf hp-${st}`} aria-hidden="true">
                    {a.kode}
                  </span>
                  <span className="hp-aspeknama">{a.nama}</span>
                  <PilStatus status={st} kecil />
                  <Ikon nama="kanan" size={18} className="hp-chev" />
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <PendampingRaka />

      <button
        type="button"
        className={kelas("hp-ghost", obrolanDiminta && "hp-off")}
        aria-disabled={obrolanDiminta || undefined}
        onClick={onMintaObrolan}
      >
        {obrolanDiminta ? <Ikon nama="centang" size={20} /> : <Ikon d={IC.obrolan} size={20} />}
        {obrolanDiminta ? "Permintaan ngobrol terkirim" : "Minta waktu ngobrol dengan Bu Rina"}
      </button>
    </div>
  );
}

/**
 * Siapa yang mendampingi Raka selain orang tua, dari peta dukungan bersama: buddy, wali kelas, dan
 * Guru BK ditonjolkan, lalu tempat aman, orang lain yang dekat, dan titik rawan yang diawasi.
 */
function PendampingRaka() {
  return (
    <section className="hp-card" aria-labelledby="ortu-h-dukung">
      <div>
        <h3 id="ortu-h-dukung" className="hp-ct">
          Siapa yang mendampingi Raka
        </h3>
        <p className="hp-cm">Selain Ayah dan Ibu. Disusun Bu Rina dan Bu Laras, 9 Nov.</p>
      </div>
      <ul className="hp-orang">
        {PENDAMPING_UTAMA.map((o) => (
          <li key={o.nama} className={kelas("hp-org", o.buddy && "hp-buddy")}>
            <span className="hp-av" aria-hidden="true">
              {o.inisial}
            </span>
            <div className="hp-fleks">
              <p className="hp-orgnama">
                <b>{o.nama}</b>
                <span className="hp-lbl">{o.buddy ? "Buddy, teman pendamping" : o.peran}</span>
              </p>
              <p className="hp-cm">{o.ket}</p>
            </div>
          </li>
        ))}
      </ul>
      <div className="hp-blok">
        <p className="hp-fl">Tempat aman di sekolah</p>
        <ul className="hp-tempat">
          {DUKUNGAN_RAKA.tempatAman.map((t) => (
            <li key={t}>
              <Ikon nama="lokasi" size={14} />
              {t}
            </li>
          ))}
        </ul>
      </div>
      <p className="hp-cd">
        <b>Juga dekat dengan Raka:</b> {gabungNama(PENDAMPING_LAIN.map((o) => `${o.nama} (${awalKecil(o.peran)})`))}.
      </p>
      <p className="hp-cd">
        <b>Titik rawan yang diawasi:</b> {gabungNama(DUKUNGAN_RAKA.titikRawan.map(awalKecil))}.
      </p>
    </section>
  );
}

/**
 * Detail satu aspek: status dan artinya, batang skor 0-10, lima indikator, faktor pendukung, saran
 * untuk Ayah/Bunda (Lakukan, lalu Caranya), dan tindak lanjut aspek itu. Deret huruf di atas
 * memindah aspek tanpa kembali ke daftar.
 */
export function DetailAspek({ aspekId, onPilihAspek, centang, onCentang }) {
  const aspek = cariAspek(aspekId) || HEART[0];
  const hasil = LAPORAN_RAKA.aspek[aspek.id];
  const catatan = CATATAN_STATUS[hasil.status];
  const urutan = HEART.findIndex((a) => a.id === aspek.id);
  const berikutnya = HEART[(urutan + 1) % HEART.length];
  const tugasRumah = TUGAS_RUMAH.filter((c) => c.aspek === aspek.id);
  const tugasSekolah = TUGAS_SEKOLAH.filter((c) => c.aspek === aspek.id);

  return (
    <div className="hp-pad">
      <div className="hp-hurufpilih" role="group" aria-label="Pilih aspek HEART">
        {HEART.map((a) => {
          const st = HASIL_RAKA[a.id];
          const aktif = a.id === aspek.id;
          return (
            <button
              key={a.id}
              type="button"
              className={kelas("hp-hpb", `hp-${st}`, aktif && "hp-on")}
              aria-pressed={aktif}
              aria-label={`${a.nama}: ${STATUS[st].label}`}
              onClick={() => onPilihAspek(a.id)}
            >
              {a.kode}
            </button>
          );
        })}
      </div>

      <section className="hp-card" aria-labelledby="ortu-a-skor">
        <div className="hp-row">
          <span className={`hp-huruf hp-besar hp-${hasil.status}`} aria-hidden="true">
            {aspek.kode}
          </span>
          <div className="hp-fleks">
            <h3 id="ortu-a-skor" className="hp-ct">
              Skor {hasil.skor} dari 10
            </h3>
            <p className="hp-cm">Yang dinilai: {awalKecil(aspek.dinilai)}</p>
          </div>
          <PilStatus status={hasil.status} kecil />
        </div>
        <Catatan nada={catatan.nada} ikon={catatan.ikon}>
          <b>Artinya:</b> {STATUS[hasil.status].arti}
        </Catatan>
        <SkalaSkor aspek={aspek} skor={hasil.skor} />
      </section>

      <section className="hp-card" aria-labelledby="ortu-a-ind">
        <h3 id="ortu-a-ind" className="hp-ct">
          Yang terlihat pada Raka
        </h3>
        <ul className="hp-indikator">
          {aspek.indikator.map((namaIndikator, i) => {
            const ind = hasil.indikator[i];
            return (
              <li key={namaIndikator}>
                <div className="hp-row hp-antara">
                  <b className="hp-indnama">{namaIndikator}</b>
                  <PilStatus status={ind.status} kecil />
                </div>
                <p className="hp-cd">{ind.deskripsi}</p>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="hp-card" aria-labelledby="ortu-a-faktor">
        <div>
          <h3 id="ortu-a-faktor" className="hp-ct">
            Faktor pendukung
          </h3>
          <p className="hp-cm">Kebiasaan sehari-hari Raka dari isian skrining.</p>
        </div>
        <dl className="hp-faktor">
          {hasil.pendukung.map(([label, nilai]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{nilai}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="hp-card" aria-labelledby="ortu-a-saran">
        <h3 id="ortu-a-saran" className="hp-ct">
          Saran untuk Ayah/Bunda
        </h3>
        <ol className="hp-saran">
          {hasil.saran.map((s, i) => (
            <li key={s.lakukan}>
              <span className="hp-num" aria-hidden="true">
                {i + 1}
              </span>
              <div>
                <p className="hp-sarlabel">Lakukan</p>
                <p className="hp-saranjudul">{s.lakukan}</p>
                <p className="hp-sarlabel">Caranya</p>
                <ul>
                  {s.caranya.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {tugasRumah.length + tugasSekolah.length > 0 && (
        <section className="hp-card" aria-labelledby="ortu-a-tindak">
          <div>
            <h3 id="ortu-a-tindak" className="hp-ct">
              Tindak lanjut untuk {aspek.nama}
            </h3>
            <p className="hp-cm">Tugas Ibu bisa dicentang di sini. Tugas sekolah ikut terlihat.</p>
          </div>
          <ul className="hp-tugaslist">
            {tugasRumah.map((c) => (
              <BarisTugas key={c.id} butir={c} selesai={Boolean(centang[c.id])} bisaCentang onCentang={onCentang} />
            ))}
            {tugasSekolah.map((c) => (
              <BarisTugas key={c.id} butir={c} selesai={Boolean(centang[c.id])} />
            ))}
          </ul>
        </section>
      )}

      <button type="button" className="hp-ghost" onClick={() => onPilihAspek(berikutnya.id)}>
        Aspek berikutnya: {berikutnya.nama}
        <Ikon nama="kanan" size={18} />
      </button>
    </div>
  );
}
