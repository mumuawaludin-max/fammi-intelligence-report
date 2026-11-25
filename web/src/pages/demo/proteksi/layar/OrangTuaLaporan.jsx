import { useRef, useState } from "react";
import { Ikon } from "../komponen";
import { BilahKembali, Catatan, LangkahLaporan, Lipat, MiniLangkah } from "./OrangTuaBagian";
import { isoHariIni, kelas, useFokusBerganti } from "./OrangTuaAlat";
import Kalender from "../bersama/Kalender";
import {
  ISIAN_AWAL,
  JANJI_RESPON,
  JENIS_KEJADIAN,
  KS015,
  LANGKAH_KEJADIAN,
  NAMA_LANGKAH,
  PILIHAN_ANAK,
  PILIHAN_BAHAYA,
  PILIHAN_KAPAN,
  PILIHAN_TEMPAT,
  RIWAYAT_LAPORAN,
  STATUS_TAHAP,
} from "./orangTuaData";

const JUMLAH_LANGKAH = NAMA_LANGKAH.length;

/**
 * Lapor Aman: tiga langkah (apa yang terjadi, cerita singkat, identitas), lalu layar terima kasih
 * dengan kode lacak dan lima langkah alur kejadian. Selalu dibuka dari langkah 1 dengan isian
 * kosong. `onKirim(data)` dijalankan induk (menambah laporan dan memberi tahu Guru BK) dan
 * mengembalikan laporan yang dibuat.
 */
export function LaporAman({ onKeluar, onKirim, onBukaTab, tampilkanToast, keAtas }) {
  const [langkah, setLangkah] = useState(1);
  const [isian, setIsian] = useState(ISIAN_AWAL);
  const [terkirim, setTerkirim] = useState(null);
  const akarRef = useRef(null);
  useFokusBerganti(akarRef, terkirim ? "terkirim" : langkah, "[data-fokus-langkah]");

  const jenisTerpilih = JENIS_KEJADIAN.find((j) => j.label === isian.jenis);
  const tingkat = isian.bahaya === 2 ? "Darurat" : jenisTerpilih ? jenisTerpilih.tingkat : "Sedang";
  const bisaLanjut = langkah === 1 ? Boolean(isian.jenis) : true;
  const ceritaRingkas = isian.cerita.trim();
  // "Pilih tanggal" tampil sebagai tanggalnya, mis. "12 Nov"; tanpa tanggal dianggap hari ini.
  const kapan =
    isian.kapan !== "Pilih tanggal"
      ? isian.kapan
      : isian.tanggal
        ? new Date(`${isian.tanggal}T00:00:00`).toLocaleDateString("id-ID", { day: "numeric", month: "short" })
        : "Hari ini";
  const ringkasan =
    `${isian.jenis || "Kejadian"} · ${isian.anak} · ${isian.tempat.toLowerCase()}, ${kapan.toLowerCase()}. ` +
    (ceritaRingkas ? `"${ceritaRingkas}"` : "Tanpa cerita tambahan.") +
    (isian.tanpaNama ? " Dikirim tanpa nama." : " Atas nama Ibu Dewi.");

  function ubahIsian(perubahan) {
    setIsian((lama) => ({ ...lama, ...perubahan }));
  }

  function lanjut() {
    if (langkah === 1 && !isian.jenis) {
      tampilkanToast("Pilih dulu apa yang terjadi");
      return;
    }
    if (langkah < JUMLAH_LANGKAH) {
      setLangkah(langkah + 1);
      keAtas();
      return;
    }
    const laporan = onKirim({
      judul: `${isian.jenis} · ${isian.anak}`,
      jenis: isian.jenis,
      anak: isian.anak,
      tingkat,
      tanpaNama: isian.tanpaNama,
      sumber: "Lapor Aman",
    });
    setTerkirim(laporan);
    keAtas();
  }

  function kembali() {
    if (!terkirim && langkah > 1) {
      setLangkah(langkah - 1);
      keAtas();
      return;
    }
    onKeluar();
  }

  return (
    <div ref={akarRef}>
      <BilahKembali judul="Lapor Aman" onKembali={kembali} />
      {terkirim ? (
        <div className="hp-pad hp-alur">
          <div className="hp-big">
            <span className="hp-ic hp-g hp-icbesar">
              <Ikon nama="centang" size={36} />
            </span>
            <h3 className="hp-h" tabIndex={-1} data-fokus-langkah>
              Laporan diterima
            </h3>
            <p className="hp-cd">Terima kasih. Ibu sudah melakukan hal yang benar.</p>
          </div>
          <section className="hp-card hp-tengah">
            <p className="hp-cm">Kode lacak</p>
            <p className="hp-code">{terkirim.kode}</p>
            <p className="hp-cm">Simpan kode ini bila Ibu melapor tanpa nama.</p>
          </section>
          <section className="hp-card" aria-labelledby="ortu-l-lanjut">
            <h3 id="ortu-l-lanjut" className="hp-ct">
              Yang terjadi selanjutnya
            </h3>
            <p className="hp-cd">Sekolah menanggapi {JANJI_RESPON[terkirim.tingkat]}.</p>
            <LangkahLaporan tahap={terkirim.tahap} langkah={terkirim.langkah} />
          </section>
          <button type="button" className="hp-btnp" onClick={() => onBukaTab("laporanku")}>
            Lihat di Laporanku
          </button>
          <button type="button" className="hp-ghost" onClick={() => onBukaTab("beranda")}>
            Kembali ke Beranda
          </button>
        </div>
      ) : (
        <div className="hp-pad hp-alur">
          <div className="hp-qhead">
            <span>
              Langkah {langkah} dari {JUMLAH_LANGKAH}
            </span>
            <span>{NAMA_LANGKAH[langkah - 1]}</span>
          </div>
          <div className="hp-prog" aria-hidden="true">
            <span style={{ width: `${Math.round((langkah / JUMLAH_LANGKAH) * 100)}%` }} />
          </div>

          {langkah === 1 && (
            <>
              <h3 className="hp-qtext" tabIndex={-1} data-fokus-langkah>
                Apa yang terjadi?
              </h3>
              <div className="hp-cats" role="group" aria-label="Jenis kejadian">
                {JENIS_KEJADIAN.map((j) => {
                  const dipilih = isian.jenis === j.label;
                  return (
                    <button
                      key={j.label}
                      type="button"
                      className={kelas("hp-catb", dipilih && "hp-on")}
                      aria-pressed={dipilih}
                      onClick={() => ubahIsian({ jenis: j.label })}
                    >
                      <span className={kelas("hp-ic", dipilih ? "hp-p" : "hp-r")}>
                        <Ikon nama={j.nama} d={j.d} size={22} />
                      </span>
                      {j.label}
                    </button>
                  );
                })}
              </div>
              <p className="hp-fl">Apakah anak dalam bahaya sekarang?</p>
              <GrupChip
                label="Anak dalam bahaya sekarang"
                tataLetak="hp-seg3"
                pilihan={PILIHAN_BAHAYA}
                terpilih={isian.bahaya}
                indeksMerah={2}
                onPilih={(i) => ubahIsian({ bahaya: i })}
              />
              {isian.bahaya === 2 && (
                <Catatan nada="bad" ikon="peringatan">
                  Amankan anak dulu dan minta bantuan guru piket atau orang dewasa terdekat. Laporan ini langsung
                  diterima Kepala Sekolah.
                </Catatan>
              )}
            </>
          )}

          {langkah === 2 && (
            <>
              <h3 className="hp-qtext" tabIndex={-1} data-fokus-langkah>
                Ceritakan yang Ibu ketahui
              </h3>
              <p className="hp-fl">Anak yang mengalami</p>
              <GrupChip
                label="Anak yang mengalami"
                tataLetak="hp-seg2"
                pilihan={PILIHAN_ANAK}
                terpilih={PILIHAN_ANAK.indexOf(isian.anak)}
                onPilih={(i) => ubahIsian({ anak: PILIHAN_ANAK[i] })}
              />
              <p className="hp-fl">Kapan</p>
              <GrupChip
                label="Kapan terjadi"
                tataLetak="hp-chips"
                pilihan={PILIHAN_KAPAN}
                terpilih={PILIHAN_KAPAN.indexOf(isian.kapan)}
                onPilih={(i) => ubahIsian({ kapan: PILIHAN_KAPAN[i] })}
              />
              {isian.kapan === "Pilih tanggal" && (
                <Kalender
                  nilai={isian.tanggal}
                  onPilih={(t) => ubahIsian({ tanggal: t })}
                  maks={isoHariIni()}
                  label="Tanggal kejadian"
                />
              )}
              <p className="hp-fl">Di mana</p>
              <GrupChip
                label="Tempat kejadian"
                tataLetak="hp-chips"
                pilihan={PILIHAN_TEMPAT}
                terpilih={PILIHAN_TEMPAT.indexOf(isian.tempat)}
                onPilih={(i) => ubahIsian({ tempat: PILIHAN_TEMPAT[i] })}
              />
              <label className="hp-fl" htmlFor="ortu-cerita">
                Cerita singkat
              </label>
              <textarea
                id="ortu-cerita"
                className="hp-inp"
                rows={4}
                placeholder="Tulis kata-kata anak apa adanya. Contoh: Aku didorong kakak kelas pas antre jajan."
                value={isian.cerita}
                onChange={(e) => ubahIsian({ cerita: e.target.value })}
              />
              <button
                type="button"
                className="hp-ghost"
                onClick={() => tampilkanToast("Rekaman suara atau foto bisa dilampirkan. Berkas hanya dibuka tim penanganan.")}
              >
                <Ikon nama="mik" size={20} />
                Tambah rekaman suara atau foto
              </button>
            </>
          )}

          {langkah === 3 && (
            <>
              <h3 className="hp-qtext" tabIndex={-1} data-fokus-langkah>
                Kirim dengan nama atau tanpa nama?
              </h3>
              <button
                type="button"
                className={kelas("hp-radio", !isian.tanpaNama && "hp-on")}
                aria-pressed={!isian.tanpaNama}
                onClick={() => ubahIsian({ tanpaNama: false })}
              >
                <span className="hp-rdot" />
                <span>
                  <b>Tampilkan nama saya ke tim penanganan</b>
                  <span className="hp-t">Disarankan. Sekolah bisa langsung mengabari perkembangan.</span>
                </span>
              </button>
              <button
                type="button"
                className={kelas("hp-radio", isian.tanpaNama && "hp-on")}
                aria-pressed={isian.tanpaNama}
                onClick={() => ubahIsian({ tanpaNama: true })}
              >
                <span className="hp-rdot" />
                <span>
                  <b>Kirim tanpa nama</b>
                  <span className="hp-t">Ibu tetap bisa memantau lewat kode lacak.</span>
                </span>
              </button>
              <section className="hp-card">
                <h4 className="hp-ct">Ringkasan laporan</h4>
                <p className="hp-cd">{ringkasan}</p>
                <p className="hp-cm">Sekolah menanggapi {JANJI_RESPON[tingkat]}.</p>
              </section>
              <Catatan nada="info" ikon="gembok">
                Laporan hanya dibaca tim penanganan sekolah. Pihak yang dilaporkan tidak diberi tahu siapa pelapornya.
              </Catatan>
            </>
          )}

          <button
            type="button"
            className={kelas("hp-btnp", !bisaLanjut && "hp-off")}
            aria-disabled={!bisaLanjut || undefined}
            onClick={lanjut}
          >
            {langkah === JUMLAH_LANGKAH ? "Kirim laporan" : "Lanjut"}
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Laporanku: tombol laporan baru paling atas, laporan aktif Ibu Dewi (laporan baru dari demo di
 * atas, lalu KS-015) dengan lima langkahnya dilipat, pesan dari sekolah, dan riwayat yang dilipat.
 */
export function Laporanku({ laporanBaru, pesan, onBalas, onLapor, tampilkanToast }) {
  const [balasan, setBalasan] = useState("");

  function kirimBalasan() {
    const teks = balasan.trim();
    if (!teks) {
      tampilkanToast("Tulis balasannya dulu");
      return;
    }
    onBalas(teks);
    setBalasan("");
  }

  return (
    <div className="hp-pad">
      <button type="button" className="hp-ghost hp-merah" onClick={onLapor}>
        <Ikon nama="perisaiCentang" size={20} />
        Buat laporan baru
      </button>

      {laporanBaru.map((l) => (
        <KartuLaporan key={l.kode} laporan={l} />
      ))}
      <KartuLaporan laporan={KS015} />

      <section className="hp-card" aria-labelledby="ortu-l-pesan">
        <h3 id="ortu-l-pesan" className="hp-ct">
          Pesan dari sekolah · {KS015.kode}
        </h3>
        <div className="hp-msgs">
          {pesan.map((m, i) => (
            <div key={i} className={kelas("hp-msg", m.saya ? "hp-out" : "hp-in")}>
              <b>{m.dari}</b>
              {m.teks}
            </div>
          ))}
        </div>
        <div className="hp-reply">
          <label htmlFor="ortu-balasan" className="sr">
            Balas pesan
          </label>
          <input
            id="ortu-balasan"
            className="hp-inp"
            placeholder="Balas pesan"
            value={balasan}
            onChange={(e) => setBalasan(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") kirimBalasan();
            }}
          />
          <button type="button" className="hp-send" aria-label="Kirim balasan" onClick={kirimBalasan}>
            <Ikon nama="kirim" size={22} />
          </button>
        </div>
        <p className="hp-cm">Catatan internal tim sekolah tidak ditampilkan.</p>
      </section>

      <Lipat judul="Riwayat kejadian Raka" ket={`${RIWAYAT_LAPORAN.length} laporan sudah selesai`}>
        <ul className="hp-riwayat">
          {RIWAYAT_LAPORAN.map((r) => (
            <li key={r.kode}>
              <div className="hp-fleks">
                <p className="hp-rwjudul">{r.judul}</p>
                <p className="hp-cm">
                  {r.kode} · {r.tanggal}, {r.oleh}
                </p>
              </div>
              <span className="pill sm ok">Selesai {r.selesai}</span>
            </li>
          ))}
        </ul>
      </Lipat>
    </div>
  );
}

/**
 * Kartu satu laporan: judul, tahap sekarang, janji waktu, ruas kemajuan, dan penanggung jawab. Lima
 * langkah lengkap dengan jam dan keterangannya dilipat.
 */
function KartuLaporan({ laporan }) {
  const tahap = LANGKAH_KEJADIAN.find((l) => l.id === laporan.tahap);
  const idJudul = `ortu-lap-${laporan.kode}`;
  return (
    <section className="hp-card" aria-labelledby={idJudul}>
      <div className="hp-row hp-atas">
        <div className="hp-fleks">
          <h3 id={idJudul} className="hp-ct">
            {laporan.judul}
          </h3>
          <p className="hp-cm">
            {laporan.kode} · {laporan.dikirim}
          </p>
        </div>
        <span className={`pill sm ${laporan.tahap === "triage" ? "warn" : "mid"}`}>{STATUS_TAHAP[laporan.tahap] || tahap?.label}</span>
      </div>
      <div className="hp-sla">
        <Ikon nama="jam" size={18} />
        <span>
          <b>{laporan.sla.judul}</b>
          {laporan.sla.ket}
        </span>
      </div>
      <MiniLangkah tahap={laporan.tahap} />
      {laporan.penangan ? (
        <p className="hp-cd">
          Ditangani {laporan.penangan.map((p) => `${p.nama} (${p.peran})`).join(" dan ")}.
        </p>
      ) : null}
      <Lipat dalam judul="Lihat semua langkah">
        <LangkahLaporan tahap={laporan.tahap} langkah={laporan.langkah} />
      </Lipat>
    </section>
  );
}

/**
 * Deret tombol pilihan tunggal (Lapor Aman). `terpilih` dan `onPilih` memakai indeks pilihan;
 * `indeksMerah` diberi warna merah saat terpilih (jawaban Ya untuk anak dalam bahaya).
 */
function GrupChip({ label, tataLetak, pilihan, terpilih, onPilih, indeksMerah = -1 }) {
  return (
    <div className={tataLetak} role="group" aria-label={label}>
      {pilihan.map((teks, i) => {
        const dipilih = i === terpilih;
        return (
          <button
            key={teks}
            type="button"
            className={kelas("hp-chipb", dipilih && "hp-on", dipilih && i === indeksMerah && "hp-y")}
            aria-pressed={dipilih}
            onClick={() => onPilih(i)}
          >
            {teks}
          </button>
        );
      })}
    </div>
  );
}
