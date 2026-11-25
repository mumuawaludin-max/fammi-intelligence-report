import { Ikon } from "../komponen";
import { PetaHati, PilStatus, SkalaSkor } from "../bersama/HeartKecil";
import { HEART, LAPORAN_RAKA, MANFAAT, STATUS, cariAspek } from "../bersama/heart";
import { KartuPantau } from "../bersama/KartuPantau";
import { PANTAU_RAKA } from "../bersama/pantau";
import { DUKUNGAN_RAKA } from "../bersama/dukungan";
import { BarisTugas, Catatan, Lipat, MenuBaris } from "./OrangTuaBagian";
import { awalKecil, gabungNama, kelas } from "./OrangTuaAlat";
import {
  ARTI_SINGKAT,
  CATATAN_STATUS,
  HASIL_RAKA,
  PENDAMPING_LAIN,
  PENDAMPING_UTAMA,
  RINGKAS_ORTU,
  TUGAS_RUMAH,
  TUGAS_SEKOLAH,
} from "./orangTuaData";

/**
 * Hasil HEART versi orang tua, mengikuti laporan contoh "Deteksi Dini Tantangan Perilaku dan Mental
 * Anak" yang dipadatkan untuk ponsel: kepala laporan, peta hati lima keping yang bisa diketuk, dan
 * daftar lima aspek. Mengetuk aspek membuka DetailAspek; siapa yang mendampingi Raka cukup satu
 * baris menu ke halamannya sendiri. Selama Ibu Dewi belum mengisi screening (`heartSelesai` false),
 * hasil yang tampil adalah hasil sementara dari isian wali kelas, dengan ajakan mengisi di atasnya.
 */
export function HasilHeart({ onBukaAspek, onBukaPendamping, onInfoSkrining, onScreening, heartSelesai = true }) {
  return (
    <div className="hp-pad">
      {!heartSelesai && (
        <section className="hp-card hp-ajak" aria-labelledby="ortu-h-ajak">
          <h3 id="ortu-h-ajak" className="hp-ct">
            Hasil sementara dari wali kelas
          </h3>
          <p className="hp-cd">Isi screening Ibu agar hasil Raka lengkap.</p>
          <button type="button" className="hp-btnp" onClick={onScreening}>
            Isi Screening HEART
          </button>
        </section>
      )}
      <section className="hp-card hp-sorot" aria-labelledby="ortu-h-judul">
        <div className="hp-row">
          <span className="hp-avatar" aria-hidden="true">
            {LAPORAN_RAKA.anak.inisial}
          </span>
          <div className="hp-fleks">
            <h3 id="ortu-h-judul" className="hp-ct">
              Hasil Screening HEART Raka
            </h3>
            <p className="hp-cm">{heartSelesai ? `${LAPORAN_RAKA.tanggal} · bukan diagnosis` : "Isian wali kelas · bukan diagnosis"}</p>
          </div>
        </div>
        <p className="hp-cd">{RINGKAS_ORTU}</p>
      </section>

      <section className="hp-card" aria-labelledby="ortu-h-aspek">
        <div>
          <h3 id="ortu-h-aspek" className="hp-ct">
            Lima aspek HEART
          </h3>
          <p className="hp-cm">Ketuk aspek untuk melihat arti dan sarannya.</p>
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

      <ul className="hp-menu">
        {heartSelesai && (
          <MenuBaris ikon="gembok" nada="p" judul="Screening sudah diisi" ket="Tonton video Fammi" onClick={onInfoSkrining} />
        )}
        <MenuBaris
          ikon="kelompok"
          nada="g"
          judul="Yang mendampingi Raka"
          ket={gabungNama(PENDAMPING_UTAMA.map((o) => (o.buddy ? `${o.nama.split(" ")[0]} (teman)` : o.nama.split(" ").slice(0, 2).join(" "))))}
          onClick={onBukaPendamping}
        />
      </ul>

    </div>
  );
}

/**
 * Halaman siapa yang mendampingi Raka selain orang tua, dari peta dukungan bersama: buddy, wali
 * kelas, dan Guru BK ditonjolkan, lalu tempat aman, orang lain yang dekat, dan titik rawan.
 */
export function PendampingRaka() {
  return (
    <div className="hp-pad">
      <section className="hp-card" aria-label="Yang mendampingi Raka">
        <p className="hp-cm">Selain Ayah dan Ibu. Disusun Bu Rina dan Bu Laras, 9 Nov.</p>
        <ul className="hp-orang">
          {PENDAMPING_UTAMA.map((o) => (
            <li key={o.nama} className={kelas("hp-org", o.buddy && "hp-buddy")}>
              <span className="hp-av" aria-hidden="true">
                {o.inisial}
              </span>
              <div className="hp-fleks">
                <p className="hp-orgnama">
                  <b>{o.nama}</b>
                  <span className="hp-lbl">{o.buddy ? "Teman pendamping" : o.peran}</span>
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
    </div>
  );
}

/**
 * Detail satu aspek: status dan artinya dengan batang skor 0-10, perkembangan sesudah skrining
 * (aspek yang belum Baik), lima indikator aspek itu beserta yang terlihat pada anak, manfaat bila
 * dipertahankan (aspek Baik), saran untuk Ayah/Bunda, checklist aspek itu, lalu faktor pendukung
 * yang dilipat. Deret huruf di atas memindah aspek tanpa kembali ke daftar.
 */
export function DetailAspek({
  aspekId,
  onPilihAspek,
  centang,
  onCentang,
  pantau,
  sudahCek,
  onJawabPantau,
  tugasRumah = TUGAS_RUMAH,
  tugasSekolah = TUGAS_SEKOLAH,
}) {
  const aspek = cariAspek(aspekId) || HEART[0];
  const hasil = LAPORAN_RAKA.aspek[aspek.id];
  const catatan = CATATAN_STATUS[hasil.status];
  const urutan = HEART.findIndex((a) => a.id === aspek.id);
  const berikutnya = HEART[(urutan + 1) % HEART.length];
  const rumahAspek = tugasRumah.filter((c) => c.aspek === aspek.id);
  const sekolahAspek = tugasSekolah.filter((c) => c.aspek === aspek.id);
  const nSekolahAspek = sekolahAspek.filter((c) => centang[c.id]).length;

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
            <p className="hp-cm">{aspek.dinilai}</p>
          </div>
          <PilStatus status={hasil.status} kecil />
        </div>
        <Catatan nada={catatan.nada} ikon={catatan.ikon}>
          {ARTI_SINGKAT[hasil.status]}
        </Catatan>
        <SkalaSkor aspek={aspek} skor={hasil.skor} />
      </section>

      {pantau?.[aspek.id] && (
        <KartuPantau
          idAspek={aspek.id}
          tanya={PANTAU_RAKA[aspek.id].tanya}
          riwayat={pantau[aspek.id]}
          sudahCek={sudahCek?.[aspek.id]}
          onJawab={(j) => onJawabPantau(aspek.id, j)}
        />
      )}

      <section className="hp-card" aria-labelledby="ortu-a-ind">
        <h3 id="ortu-a-ind" className="hp-ct">
          Indikator {aspek.nama}
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

      {hasil.status === "baik" && (
        <section className="hp-card hp-manfaat" aria-labelledby="ortu-a-manfaat">
          <h3 id="ortu-a-manfaat" className="hp-ct">
            Kalau dipertahankan
          </h3>
          <p className="hp-cd">{MANFAAT[aspek.id]}</p>
        </section>
      )}

      <section className="hp-card" aria-labelledby="ortu-a-saran">
        <h3 id="ortu-a-saran" className="hp-ct">
          Yang bisa Ayah/Bunda lakukan
        </h3>
        <ol className="hp-saran">
          {hasil.saran.map((s, i) => (
            <li key={s.lakukan}>
              <span className="hp-num" aria-hidden="true">
                {i + 1}
              </span>
              {/* Judul saran saja yang terlihat; caranya dibuka saat diketuk. */}
              <details className="hp-saranlipat">
                <summary className="hp-saranjudul">{s.lakukan}</summary>
                <ul>
                  {s.caranya.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </details>
            </li>
          ))}
        </ol>
      </section>

      {rumahAspek.length + sekolahAspek.length > 0 && (
        <section className="hp-card" aria-labelledby="ortu-a-tindak">
          <h3 id="ortu-a-tindak" className="hp-ct">
            Checklist untuk {aspek.nama}
          </h3>
          {rumahAspek.length > 0 && (
            <ul className="hp-tugaslist">
              {rumahAspek.map((c) => (
                <BarisTugas key={c.id} butir={c} selesai={Boolean(centang[c.id])} bisaCentang onCentang={onCentang} />
              ))}
            </ul>
          )}
          {sekolahAspek.length > 0 && (
            <Lipat dalam judul={`Di sekolah: ${nSekolahAspek} dari ${sekolahAspek.length} selesai`}>
              <ul className="hp-tugaslist">
                {sekolahAspek.map((c) => (
                  <BarisTugas key={c.id} butir={c} selesai={Boolean(centang[c.id])} />
                ))}
              </ul>
            </Lipat>
          )}
        </section>
      )}

      <Lipat judul="Kebiasaan sehari-hari Raka">
        <dl className="hp-faktor">
          {hasil.pendukung.map(([label, nilai]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{nilai}</dd>
            </div>
          ))}
        </dl>
      </Lipat>

      <button type="button" className="hp-ghost" onClick={() => onPilihAspek(berikutnya.id)}>
        Aspek berikutnya: {berikutnya.nama}
        <Ikon nama="kanan" size={18} />
      </button>
    </div>
  );
}
