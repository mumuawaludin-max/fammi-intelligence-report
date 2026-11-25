import { useCallback, useEffect, useRef, useState } from "react";
import { useProteksi } from "../konteks";
import { Ikon } from "../komponen";
import { HEART, metaStatus } from "../bersama/heart";
import { PetaHati, PilStatus, SkalaSkor } from "../bersama/HeartKecil";
import { Cincin } from "../bersama/Grafik";
import { KartuPantau } from "../bersama/KartuPantau";
import { perkembangan, titikBaru } from "../bersama/pantau";
import DialogVideo from "../bersama/DialogVideo";
import NavMelayang from "../bersama/NavMelayang";
import Wajah from "../bersama/Wajah";
import Kalender from "../bersama/Kalender";
import { IC } from "./orangTuaData";
import { isoHariIni } from "./OrangTuaAlat";
import {
  ASPEK_BAIK,
  ASPEK_DIJAGA,
  CATATAN_AWAL,
  CEK_DIRI,
  GURU_BK,
  HASIL_KIRANA,
  JANJI,
  KAPAN,
  LAPORAN_AWAL,
  MISI,
  MISI_JAGA,
  MOOD,
  MOOD_MENURUT_ID,
  PANTAU_KIRANA,
  REMAJA,
  STATUS_KIRANA,
  TAB_REMAJA,
  TOPIK,
  tanggalHariIni,
} from "./remajaData";
import css from "./Remaja.module.css";

const LAMA_TOAST = 3000;
/** Jawaban penilaian awal untuk antrean sekolah menurut tingkat (sama dengan aplikasi orang tua). */
const JAWABAN_TINGKAT = {
  Darurat: [2, 0, 0, 0, 0, 0],
  Tinggi: [0, 0, 2, 0, 0, 0],
  Sedang: [0, 0, 0, 2, 0, 0],
};
const KODE_BARU = ["RJ-7HM3", "RJ-4TQ9", "RJ-9WX2"];

/**
 * Aplikasi remaja (Kirana, 14 tahun, kelas 8B): remaja membaca hasil skrining HEART-nya sendiri,
 * menjalankan misi yang terkait tiap aspek, dan melihat perkembangannya sesudah screening.
 * Masukan pemilik produk 2026-11-25: kemasan kartu, tanpa gradien, tanpa ikon 3D atau emoji.
 *
 * Empat tab di bilah melayang: Beranda (Lapor Aman, mood harian dengan cerita opsional yang dicatat
 * tanggalnya, ringkasan), Hasilku (peta hati, skor tiap aspek, rincian berisi indikator dan saran
 * atau manfaat), Misi (misi per aspek beserta grafik perkembangan dan cek mingguan), dan Lapor
 * (formulir ke Guru BK, bisa anonim, kapan bisa pilih tanggal). Screening HEART sudah diisi dan dikunci:
 * membukanya lagi wewenang tim Fammi, jadi tombolnya hanya membuka dialog info dan video Fammi.
 * Remaja tidak punya tombol menghubungi guru; semua lewat formulir. Data contoh di browser.
 */
export default function Remaja() {
  const { buatLaporan, beriTahu } = useProteksi();
  const [halaman, setHalaman] = useState("beranda");
  const [catatan, setCatatan] = useState(CATATAN_AWAL);
  const [misiSelesai, setMisiSelesai] = useState({ m1: true });
  const [pantau, setPantau] = useState(() =>
    Object.fromEntries(Object.entries(PANTAU_KIRANA).map(([k, v]) => [k, v.riwayat])),
  );
  const [sudahCek, setSudahCek] = useState({});
  const [laporan, setLaporan] = useState(LAPORAN_AWAL);
  const [aspekBuka, setAspekBuka] = useState(null);
  const [dialogCek, setDialogCek] = useState(false);
  const [toast, setToast] = useState(null);
  const gulirRef = useRef(null);
  const timerRef = useRef(null);
  const nomorRef = useRef(0);

  const tampilkanToast = useCallback((teks) => {
    window.clearTimeout(timerRef.current);
    nomorRef.current += 1;
    setToast({ teks, n: nomorRef.current });
    timerRef.current = window.setTimeout(() => setToast(null), LAMA_TOAST);
  }, []);
  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const buka = useCallback((id) => {
    setAspekBuka(null);
    setHalaman(id);
    if (gulirRef.current) gulirRef.current.scrollTop = 0;
  }, []);

  // Umpan balik mood tampil di kartu mood sendiri (Beranda), jadi di sini cukup mencatat.
  function simpanMood(mood, cerita) {
    setCatatan((d) => [{ mood, tanggal: tanggalHariIni(), cerita }, ...d]);
  }

  function ubahMisi(id) {
    setMisiSelesai((m) => {
      const baru = { ...m, [id]: !m[id] };
      if (baru[id]) tampilkanToast("Misi beres. Jangan lupa cek perkembanganmu minggu ini.");
      return baru;
    });
  }

  function jawabPantau(idAspek, jawaban) {
    setPantau((p) => ({ ...p, [idAspek]: [...p[idAspek], titikBaru(p[idAspek], jawaban)] }));
    setSudahCek((s) => ({ ...s, [idAspek]: true }));
    tampilkanToast("Tercatat. Grafiknya udah diperbarui.");
  }

  // Laporan remaja masuk antrean cek awal di layar Kasus (nomor dibagi konteks) dan Guru BK diberi
  // tahu lewat lonceng; Kepala Sekolah ikut bila tingkatnya Darurat. Remaja melihat kode lacaknya.
  function kirimLaporan(isi) {
    const kode = KODE_BARU[laporan.length - LAPORAN_AWAL.length] || `RJ-${1000 + laporan.length}`;
    const tingkat = isi.topik.tingkat;
    const idKasus = buatLaporan({
      lapor: {
        jenis: isi.topik.label,
        nama: isi.anonim ? "" : REMAJA.namaLengkap,
        kelas: REMAJA.kelas,
        lokasi: "Sekolah",
        kapan: isi.tanggal,
        cerita: `${isi.isi.trim() || "Pelapor belum menambahkan cerita."} Dikirim lewat aplikasi remaja dengan kode ${kode}.`,
        jawaban: JAWABAN_TINGKAT[tingkat] || JAWABAN_TINGKAT.Sedang,
      },
      sumber: isi.anonim ? "Remaja tanpa nama · aplikasi remaja" : `${REMAJA.namaLengkap} (remaja) · aplikasi remaja`,
    });
    beriTahu({
      peran: tingkat === "Darurat" ? ["bk", "kepsek"] : "bk",
      ikon: "peringatan",
      nada: "red",
      judul: `Laporan remaja ${kode} · ${tingkat}`,
      isi: `${isi.topik.label}. Kelas ${REMAJA.kelas}${isi.anonim ? ", tanpa nama" : ""}. Menunggu dicek.`,
      tujuan: { layar: "kasus", aksi: { jenis: "kasus", id: idKasus } },
    });
    setLaporan((d) => [{ kode, topik: isi.topik.label, tanggal: isi.tanggal, status: "Menunggu dibaca", nada: "warn" }, ...d]);
    return kode;
  }

  const SEMUA_MISI = [...MISI, ...MISI_JAGA];
  const nMisi = SEMUA_MISI.filter((m) => misiSelesai[m.id]).length;

  return (
    <div className={css.layar}>
      <h1 className="sr" data-judul-layar>
        Aplikasi remaja
      </h1>
      <div className="rj-panggung">
        <section className="rj-ponsel" aria-label="Aplikasi remaja">
          <div ref={gulirRef} className="rj-gulir">
            {halaman === "beranda" && (
              <Beranda
                catatan={catatan}
                onSimpanMood={simpanMood}
                nMisi={nMisi}
                pantau={pantau}
                onBuka={buka}
                onCekDiri={() => setDialogCek(true)}
              />
            )}
            {halaman === "hasil" && <Hasilku onAspek={setAspekBuka} onBuka={buka} onCekDiri={() => setDialogCek(true)} />}
            {halaman === "misi" && (
              <Misi pantau={pantau} sudahCek={sudahCek} onJawab={jawabPantau} misiSelesai={misiSelesai} onMisi={ubahMisi} nMisi={nMisi} />
            )}
            {halaman === "lapor" && <Lapor laporan={laporan} onKirim={kirimLaporan} />}
          </div>

          <NavMelayang tab={TAB_REMAJA} aktif={halaman} onPilih={buka} label="Menu aplikasi remaja" nada="remaja" />

          {aspekBuka && <LembarAspek idAspek={aspekBuka} onTutup={() => setAspekBuka(null)} onMisi={() => buka("misi")} />}

          {dialogCek && (
            <DialogVideo
              judul="Screening HEART udah kamu isi"
              isi={`Kamu udah ngisi Screening HEART tanggal ${CEK_DIRI.tanggal}. Screening berikutnya dibuka sama tim Fammi, nanti kamu dikabarin. Sekarang waktunya baca hasilmu dan jalanin misinya.`}
              idVideo={CEK_DIRI.idVideo}
              labelVideo="Video Fammi: Screening HEART itu apa sih?"
              aksi="Baca hasilku"
              onAksi={() => {
                setDialogCek(false);
                buka("hasil");
              }}
              onTutup={() => setDialogCek(false)}
            />
          )}

          <div className="rj-toastwadah" role="status">
            {toast && (
              <div key={toast.n} className="rj-toast">
                {toast.teks}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

/* ================================== Beranda ================================== */

function Beranda({ catatan, onSimpanMood, nMisi, pantau, onBuka, onCekDiri }) {
  const [mood, setMood] = useState(null);
  const [cerita, setCerita] = useState("");
  // Umpan balik sesudah menyimpan: mengakui perasaannya dan menjelaskan manfaat menamai emosi.
  const [umpan, setUmpan] = useState(null);
  const terakhir = catatan[0];
  const dipilih = mood ? MOOD_MENURUT_ID[mood] : null;

  function simpan(denganCerita) {
    const teks = denganCerita ? cerita.trim() : "";
    onSimpanMood(mood, teks);
    setUmpan({ mood, adaCerita: Boolean(teks), tanggal: tanggalHariIni() });
    setMood(null);
    setCerita("");
  }

  const membaik = ASPEK_DIJAGA.filter((a) => perkembangan(a.id, pantau[a.id]).arah === "membaik").length;

  return (
    <div className="rj-isi">
      <header className="rj-kepala">
        <span className="rj-avatar" aria-hidden="true">
          {REMAJA.inisial}
        </span>
        <div>
          <p className="rj-sapa">{`Hai, ${REMAJA.nama}`}</p>
          <p className="rj-sub">{`Kelas ${REMAJA.kelas} · Sekolah Proteksi`}</p>
        </div>
      </header>

      <div className="rj-bento">
        <button type="button" className="rj-kartu rj-aman rj-lebar" style={{ "--urut": 0 }} onClick={() => onBuka("lapor")}>
          <span className="rj-ikonbulat">
            <Ikon nama="perisaiCentang" size={24} />
          </span>
          <span className="rj-teks">
            <b>Ngerasa nggak aman?</b>
            <span>{`Lapor ke ${GURU_BK}. Bisa anonim.`}</span>
          </span>
          <Ikon nama="kanan" size={22} />
        </button>

        <section className="rj-kartu rj-putih rj-lebar rj-mood" style={{ "--urut": 1 }} aria-labelledby="rj-mood">
          <h2 id="rj-mood" className="rj-judulkartu">
            Gimana perasaanmu hari ini?
          </h2>
          <div className="rj-moodbaris" role="group" aria-label="Pilih mood hari ini">
            {MOOD.map((m) => (
              <button
                key={m.id}
                type="button"
                className={`rj-moodb${mood === m.id ? " on" : ""}`}
                aria-pressed={mood === m.id}
                onClick={() => setMood(m.id)}
              >
                <Wajah isi={m.isi} mulut={m.mulut} ukuran={36} className="rj-wajah" />
                {m.label}
              </button>
            ))}
          </div>
          {umpan ? (
            <div className="rj-umpan" role="status">
              <span className="rj-umpanikon" aria-hidden="true">
                <Ikon nama="sukses" size={22} />
              </span>
              <div className="rj-teks">
                <b>{MOOD_MENURUT_ID[umpan.mood].balas}</b>
                <span>{MOOD_MENURUT_ID[umpan.mood].manfaat}</span>
                <span className="rj-umpantgl">{`Tercatat ${umpan.tanggal}${umpan.adaCerita ? ", beserta ceritamu" : ""}.`}</span>
              </div>
              <button type="button" className="rj-tombol kecil lembut" onClick={() => setUmpan(null)}>
                Oke
              </button>
            </div>
          ) : mood ? (
            <div className="rj-moodcerita">
              <label htmlFor="rj-mood-cerita" className="rj-moodtanya">
                {dipilih.tanya}
              </label>
              <textarea
                id="rj-mood-cerita"
                className="rj-input"
                rows={3}
                placeholder="Tulis pakai kata-katamu sendiri. Boleh dilewati."
                value={cerita}
                onChange={(e) => setCerita(e.target.value)}
              />
              {cerita.trim().length > 0 && (
                <p className="rj-semangat" aria-live="polite">
                  Bagus. Nyebut apa yang kamu rasain udah langkah pertama buat ngatur perasaan.
                </p>
              )}
              <div className="rj-duatombol">
                <button type="button" className="rj-tombol kecil lembut" onClick={() => simpan(false)}>
                  Simpan aja
                </button>
                <button type="button" className="rj-tombol kecil" disabled={!cerita.trim()} onClick={() => simpan(true)}>
                  Simpan cerita
                </button>
              </div>
            </div>
          ) : terakhir ? (
            <p className="rj-ket">{`Terakhir dicatat: ${MOOD_MENURUT_ID[terakhir.mood].label}, ${terakhir.tanggal}`}</p>
          ) : null}
        </section>

        <button type="button" className="rj-kartu rj-ungu" style={{ "--urut": 2 }} onClick={() => onBuka("hasil")}>
          <span className="rj-label">Hasilku</span>
          <span className="rj-hatikecil" aria-hidden="true">
            <PetaHati hasil={STATUS_KIRANA} lebar={88} label="Peta HEART Kirana" />
          </span>
          <b>{`${ASPEK_DIJAGA.length} hal terindikasi perlu dijaga`}</b>
        </button>

        <button type="button" className="rj-kartu rj-putih" style={{ "--urut": 3 }} onClick={() => onBuka("misi")}>
          <span className="rj-label">Misi</span>
          <Cincin nilai={nMisi} dari={MISI.length + MISI_JAGA.length} warna="var(--sp-ungu)" ukuran={80} tebal={11} label={`${nMisi} dari ${MISI.length + MISI_JAGA.length} misi beres`} />
          <b>{membaik ? `${membaik} bagian membaik` : `${nMisi} dari ${MISI.length + MISI_JAGA.length} beres`}</b>
        </button>

        <button type="button" className="rj-kartu rj-abu rj-lebar" style={{ "--urut": 4 }} onClick={onCekDiri}>
          <span className="rj-ikonkecil">
            <Ikon nama="gembok" size={20} />
          </span>
          <span className="rj-teks">
            <b>Screening HEART</b>
            <span>{`Udah diisi ${CEK_DIRI.tanggal}`}</span>
          </span>
          <Ikon nama="kanan" size={20} />
        </button>
      </div>

      {catatan.length > 0 && (
        <section aria-labelledby="rj-jurnal">
          <h2 id="rj-jurnal" className="rj-bagian">
            Catatan perasaanmu
          </h2>
          <ul className="rj-jurnal">
            {catatan.slice(0, 4).map((c, i) => {
              const m = MOOD_MENURUT_ID[c.mood];
              return (
                <li key={`${c.tanggal}-${i}`}>
                  <Wajah isi={m.isi} mulut={m.mulut} ukuran={30} className="rj-wajah" />
                  <span className="rj-teks">
                    <b>{`${m.label} · ${c.tanggal}`}</b>
                    <span>{c.cerita || "Tanpa cerita"}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

/* ================================== Hasilku ================================== */

/**
 * Hasilku: judul hasil, peta hati dengan hitungan status, ringkasan, lalu skor tiap aspek sebagai
 * baris batang yang bisa diketuk. Rincian (indikator, saran atau manfaat) terbuka di lembar bawah.
 */
function Hasilku({ onAspek, onBuka, onCekDiri }) {
  const jumlah = {
    baik: ASPEK_BAIK.length,
    perhatian: HEART.filter((a) => STATUS_KIRANA[a.id] === "perhatian").length,
    waspada: HEART.filter((a) => STATUS_KIRANA[a.id] === "waspada").length,
  };
  return (
    <div className="rj-isi">
      <div className="rj-hasilatas">
        <p className="rj-label">{`Hasil Screening HEART · ${CEK_DIRI.tanggal}`}</p>
        <h2 className="rj-judulbesar kiri">{`Kuat di ${jumlah.baik} bagian, ${ASPEK_DIJAGA.length} terindikasi perlu dijaga`}</h2>
      </div>

      <section className="rj-kartu rj-putih rj-hero" aria-label="Peta HEART dan hitungan status">
        <div className="rj-herohati">
          <PetaHati hasil={STATUS_KIRANA} onPilih={onAspek} lebar={150} label="Peta HEART Kirana, pilih bagian" />
        </div>
        <ul className="rj-hitungan">
          <li className="baik">
            <b>{jumlah.baik}</b>
            <span>Aman</span>
          </li>
          <li className="perhatian">
            <b>{jumlah.perhatian}</b>
            <span>Perlu Diperhatikan</span>
          </li>
          <li className="waspada">
            <b>{jumlah.waspada}</b>
            <span>Perlu Perhatian Lebih</span>
          </li>
        </ul>
      </section>

      <p className="rj-ringkas">{HASIL_KIRANA.ringkas}</p>

      <section className="rj-kartu rj-putih" aria-labelledby="rj-skor">
        <div className="rj-barisjudul">
          <h2 id="rj-skor" className="rj-judulkartu">
            Skor tiap bagian
          </h2>
          <span className="rj-ket">0 sampai 10</span>
        </div>
        <ul className="rj-skorlist">
          {HEART.map((a) => {
            const x = HASIL_KIRANA.aspek[a.id];
            return (
              <li key={a.id}>
                <button type="button" className="rj-skorb" onClick={() => onAspek(a.id)}>
                  <span className={`rj-hurufst ${x.status}`} aria-hidden="true">
                    {a.kode}
                  </span>
                  <span className="rj-skornama">
                    <b>{a.nama}</b>
                    <span className="rj-skorbar" aria-hidden="true">
                      <span className={x.status} style={{ width: `${Math.max(x.skor, 0.4) * 10}%` }} />
                      <i style={{ left: `${a.ambang.perhatian * 10}%` }} />
                    </span>
                  </span>
                  <span className="rj-skorangka">{`${x.skor}/10`}</span>
                  <span className="sr">{metaStatus(x.status).label}</span>
                  <Ikon nama="kanan" size={18} className="rj-chev" />
                </button>
              </li>
            );
          })}
        </ul>
        <p className="rj-ket">Makin kecil makin baik. Garis tipis = batas Perlu Diperhatikan. Ketuk bagian buat lihat indikatornya.</p>
      </section>

      <button type="button" className="rj-kartu rj-ungu rj-lebarpenuh" onClick={() => onBuka("misi")}>
        <span className="rj-ikonkecil">
          <Ikon nama="ceklis" size={20} />
        </span>
        <span className="rj-teks">
          <b>Lihat perkembanganmu</b>
          <span>Misi dan grafik sejak screening</span>
        </span>
        <Ikon nama="kanan" size={20} />
      </button>

      <button type="button" className="rj-kartu rj-abu rj-lebarpenuh" onClick={onCekDiri}>
        <span className="rj-ikonkecil">
          <Ikon nama="gembok" size={20} />
        </span>
        <span className="rj-teks">
          <b>Screening berikutnya</b>
          <span>Dibuka sama tim Fammi</span>
        </span>
        <Ikon nama="kanan" size={20} />
      </button>
    </div>
  );
}

/** Lembar bawah rincian satu aspek: skor, arti, indikator, lalu saran atau manfaat. */
function LembarAspek({ idAspek, onTutup, onMisi }) {
  const aspek = HEART.find((a) => a.id === idAspek);
  const x = HASIL_KIRANA.aspek[idAspek];
  const ref = useRef(null);
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, [idAspek]);
  const misi = MISI.filter((m) => m.aspek === idAspek);

  return (
    <>
      <button type="button" className="rj-lapis" aria-label="Tutup" tabIndex={-1} onClick={onTutup} />
      <div
        ref={ref}
        className="rj-lembar"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rj-lembar-judul"
        tabIndex={-1}
        onKeyDown={(e) => {
          if (e.key === "Escape") onTutup();
        }}
      >
        <span className="rj-pegangan" aria-hidden="true" />
        <div className="rj-lembarkepala">
          <span className={`rj-hurufst besar ${x.status}`} aria-hidden="true">
            {aspek.kode}
          </span>
          <div className="rj-teks">
            <h2 id="rj-lembar-judul">{aspek.nama}</h2>
            <span>{`Skor ${x.skor} dari 10`}</span>
          </div>
          <PilStatus status={x.status} kecil />
          <button type="button" className="rj-tutup" aria-label="Tutup" onClick={onTutup}>
            <Ikon nama="tutup" size={18} />
          </button>
        </div>

        <p className="rj-arti">{x.arti}</p>
        <SkalaSkor aspek={aspek} skor={x.skor} />

        <h3 className="rj-bagian">Yang dilihat dari bagian ini</h3>
        <ul className="rj-indikator">
          {aspek.indikator.map((nama, i) => {
            const [st, teks] = x.indikator[i];
            return (
              <li key={nama}>
                <span className={`rj-titikst ${st}`} aria-hidden="true" />
                <span className="rj-teks">
                  <b>{nama}</b>
                  <span>{teks}</span>
                </span>
                <span className="sr">{metaStatus(st).label}</span>
              </li>
            );
          })}
        </ul>

        {x.status === "baik" ? (
          <div className="rj-manfaat">
            <h3>Kalau kamu pertahanin</h3>
            <p>{x.pertahanin}</p>
          </div>
        ) : (
          <div className="rj-coba">
            <h3>Coba ini</h3>
            <ol>
              {x.coba.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ol>
            {misi.length > 0 && (
              <button type="button" className="rj-tombol kecil" onClick={onMisi}>
                {`Lihat ${misi.length} misi buat bagian ini`}
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}

/* ================================== Misi ================================== */

/**
 * Misi dikelompokkan per aspek HEART yang perlu dijaga. Tiap kelompok punya grafik perkembangan
 * sejak screening dan cek mingguan, jadi kelihatan apakah misinya berdampak (delta skor). Aspek yang
 * sudah Baik ditampilkan dengan manfaatnya bila dipertahankan.
 */
function Misi({ pantau, sudahCek, onJawab, misiSelesai, onMisi, nMisi }) {
  return (
    <div className="rj-isi">
      <div className="rj-hasilatas">
        <p className="rj-label">{`${nMisi} dari ${MISI.length + MISI_JAGA.length} misi beres`}</p>
        <h2 className="rj-judulbesar kiri">Misi dan perkembanganmu</h2>
      </div>

      {ASPEK_DIJAGA.map((a) => (
        <KartuPantau
          key={a.id}
          idAspek={a.id}
          tanya={PANTAU_KIRANA[a.id].tanya}
          riwayat={pantau[a.id]}
          sudahCek={sudahCek[a.id]}
          onJawab={(j) => onJawab(a.id, j)}
          suara="remaja"
        >
          <ul className="rj-misi">
            {MISI.filter((m) => m.aspek === a.id).map((m) => (
              <li key={m.id}>
                <label className={misiSelesai[m.id] ? "beres" : ""}>
                  <input type="checkbox" checked={Boolean(misiSelesai[m.id])} onChange={() => onMisi(m.id)} />
                  <span>{m.teks}</span>
                </label>
              </li>
            ))}
          </ul>
        </KartuPantau>
      ))}

      <section className="rj-kartu rj-hijau" aria-labelledby="rj-pertahanin">
        <h2 id="rj-pertahanin" className="rj-judulkartu">
          Udah bagus, pertahanin
        </h2>
        <p className="rj-ket">Bagian ini terindikasi udah bagus. Tetap dijaga lewat satu misi kecil.</p>
        <ul className="rj-pertahanin">
          {ASPEK_BAIK.map((a) => {
            const m = MISI_JAGA.find((x) => x.aspek === a.id);
            return (
              <li key={a.id}>
                <span className="rj-hurufst baik" aria-hidden="true">
                  {a.kode}
                </span>
                <span className="rj-teks">
                  <b>{a.nama}</b>
                  <span>{HASIL_KIRANA.aspek[a.id].pertahanin}</span>
                  {m && (
                    <label className={`rj-jaga${misiSelesai[m.id] ? " beres" : ""}`}>
                      <input type="checkbox" checked={Boolean(misiSelesai[m.id])} onChange={() => onMisi(m.id)} />
                      <span>{m.teks}</span>
                    </label>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

/* ================================== Lapor ================================== */

/**
 * Lapor Aman versi remaja: pilih topik, kapan (pilihan cepat atau tanggal), cerita singkat (boleh
 * dilewati), dan anonim. Sesudah dikirim muncul kode dan janji kapan dibalas. Tanpa nomor layanan.
 */
function Lapor({ laporan, onKirim }) {
  const [topik, setTopik] = useState(null);
  const [kapan, setKapan] = useState(KAPAN[0]);
  const [tanggal, setTanggal] = useState("");
  const [isi, setIsi] = useState("");
  const [anonim, setAnonim] = useState(false);
  const [terkirim, setTerkirim] = useState(null);
  const hariIni = isoHariIni();

  function ulang() {
    setTopik(null);
    setKapan(KAPAN[0]);
    setTanggal("");
    setIsi("");
    setAnonim(false);
    setTerkirim(null);
  }

  function kirim() {
    let label = kapan;
    if (kapan === "Pilih tanggal") {
      label = tanggal ? new Date(`${tanggal}T00:00:00`).toLocaleDateString("id-ID", { day: "numeric", month: "short" }) : "Hari ini";
    }
    setTerkirim({ kode: onKirim({ topik, tanggal: label, isi, anonim }), tingkat: topik.tingkat });
  }

  if (terkirim) {
    return (
      <div className="rj-isi rj-tengah">
        <span className="rj-ikonbesar" aria-hidden="true">
          <Ikon nama="centang" size={36} />
        </span>
        <h2 className="rj-judulbesar">Laporanmu udah sampai</h2>
        <p className="rj-paragraf">{`${GURU_BK} bakal bales ${JANJI[terkirim.tingkat] || JANJI.Sedang}. Kamu nggak sendirian.`}</p>
        <div className="rj-kartu rj-putih rj-kode">
          <span className="rj-label">Kode laporanmu</span>
          <b>{terkirim.kode}</b>
          <span className="rj-ket">{anonim ? "Simpan kode ini buat ngecek kabarnya." : "Kabarnya muncul di daftar Laporanku."}</span>
        </div>
        <button type="button" className="rj-tombol" onClick={ulang}>
          Oke
        </button>
      </div>
    );
  }

  if (topik) {
    const serius = topik.tingkat === "Darurat" || topik.tingkat === "Tinggi";
    return (
      <div className="rj-isi">
        <button type="button" className="rj-kembaliteks" onClick={() => setTopik(null)}>
          <Ikon nama="kembali" size={18} />
          Ganti topik
        </button>
        <div className="rj-kartu rj-ungu rj-topikpilih">
          <span className="rj-ikonkecil">
            <Ikon nama={topik.ikon} d={topik.ic ? IC[topik.ic] : undefined} size={22} />
          </span>
          <b>{topik.label}</b>
        </div>
        {serius && <p className="rj-catatan">Kalau kamu dalam bahaya sekarang, cari guru atau orang dewasa terdekat yang kamu percaya.</p>}

        <h2 className="rj-bagian">Kapan kejadiannya?</h2>
        <div className="rj-chips" role="group" aria-label="Kapan kejadiannya">
          {KAPAN.map((k) => (
            <button key={k} type="button" className={`rj-chip${kapan === k ? " on" : ""}`} aria-pressed={kapan === k} onClick={() => setKapan(k)}>
              {k}
            </button>
          ))}
        </div>
        {kapan === "Pilih tanggal" && <Kalender nilai={tanggal} onPilih={setTanggal} maks={hariIni} label="Tanggal kejadian" />}

        <label className="rj-bagian" htmlFor="rj-isi-lapor">
          Ceritain dikit (boleh dilewati)
        </label>
        <textarea
          id="rj-isi-lapor"
          className="rj-input"
          rows={4}
          placeholder="Tulis pakai kata-katamu sendiri."
          value={isi}
          onChange={(e) => setIsi(e.target.value)}
        />

        <button type="button" className={`rj-saklar${anonim ? " on" : ""}`} role="switch" aria-checked={anonim} onClick={() => setAnonim((a) => !a)}>
          <span className="rj-saklarbulat" aria-hidden="true" />
          <span className="rj-teks">
            <b>Kirim anonim</b>
            <span>{anonim ? "Namamu nggak ditampilkan." : `${GURU_BK} tahu ini dari kamu.`}</span>
          </span>
        </button>

        <button type="button" className="rj-tombol merah" onClick={kirim}>
          {`Kirim ke ${GURU_BK}`}
          <Ikon nama="kirim" size={18} />
        </button>
      </div>
    );
  }

  return (
    <div className="rj-isi">
      <div className="rj-hasilatas">
        <p className="rj-label">Lapor Aman</p>
        <h2 className="rj-judulbesar kiri">Ada yang bikin kamu nggak aman?</h2>
        <p className="rj-paragraf kiri">{`Pilih yang paling pas. Laporanmu cuma dibaca ${GURU_BK} dan tim sekolah yang nanganin.`}</p>
      </div>
      <div className="rj-topik">
        {TOPIK.map((t, i) => (
          <button
            key={t.id}
            type="button"
            className={`rj-kartu rj-putih rj-topikb${t.id === "dewasa" ? " merah" : ""}`}
            style={{ "--urut": i }}
            onClick={() => setTopik(t)}
          >
            <span className="rj-ikonkecil">
              <Ikon nama={t.ikon} d={t.ic ? IC[t.ic] : undefined} size={22} />
            </span>
            <b>{t.label}</b>
          </button>
        ))}
      </div>

      <h2 className="rj-bagian">Laporanku</h2>
      <ul className="rj-daftarlapor">
        {laporan.map((c) => (
          <li key={c.kode} className="rj-kartu rj-putih">
            <span className="rj-teks">
              <b>{c.topik}</b>
              <span>{`${c.kode} · ${c.tanggal}`}</span>
            </span>
            <span className={`pill sm ${c.nada}`}>{c.status}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
