// Tab Ringkasan sebagai satu layar ruang kendali, dibaca kiri ke kanan, atas ke bawah:
//   baris 1: berapa orang disarankan asesmen dan kenapa;
//   baris 2: skor kondisi kerja, skor per aspek, jawaban 4 pekan terakhir, dan catatan singkat.
// Kepala unit melihat unitnya sendiri; garis tegak pada bar menunjukkan rata-rata lembaga.

import { ArrowRight, ChartBar, CheckCircle, Gauge, Lightbulb, Question, Smiley, UsersThree, WarningCircle } from "@phosphor-icons/react";
import { ALASAN, JALUR, KALIMAT_JALUR, SKALA_KONDISI, SUBSKALA } from "./lib/swMeta";
import {
  formatAngka, formatPersen, kategoriKondisi, komposisiJalur, penjelasNol, porsi,
  subskalaTerendah, susunTemuan,
} from "./lib/swAturan";
import {
  BarBaris, BarTumpuk, ChipKategori, Donat, Kartu, KeadaanLayar, Petunjuk, TabelPadanan, Tombol,
} from "./SwUi";
import { IKON_ALASAN, IKON_ASPEK, IKON_KONDISI, TEKS_KONDISI, WARNA_ALASAN, WARNA_JALUR, WARNA_KONDISI } from "./swWarna";
import styles from "./SwRingkasan.module.css";

function temaTeratas(tema, kunci) {
  return tema?.[kunci]?.daftar?.[0]?.tema || null;
}

function temaMengurasUnit(tema, unitId) {
  const silang = tema?.silangMenguras;
  const baris = silang?.baris.find((b) => b.unitId === unitId);
  if (!baris) return null;
  let maks = 0;
  let nama = null;
  baris.nilai.forEach((v, i) => { if (v > maks) { maks = v; nama = silang.tema[i]; } });
  return nama;
}

/** Lima wajah untuk jawaban "rasanya bekerja 4 pekan terakhir", dari sangat berat ke sangat baik. */
function SkalaWajah({ kondisi, total }) {
  return (
    <div className={styles.wajahIsi}>
      <div className={styles.wajah} role="img" aria-label={SKALA_KONDISI.map((s) => `${s.label} ${kondisi?.[s.nilai] || 0} orang`).join(", ")}>
        {SKALA_KONDISI.map((s) => {
          const Ikon = IKON_KONDISI[s.nilai];
          const n = kondisi?.[s.nilai] || 0;
          return (
            <Petunjuk key={s.nilai} teks={`${s.panjang} ${n} orang (${formatPersen(porsi(n, total))}).`} blok>
              <div className={styles.wajahItem}>
                <span className={styles.wajahIkon} style={{ background: WARNA_KONDISI[s.nilai], color: TEKS_KONDISI[s.nilai], animationDelay: `${s.nilai * 60}ms` }}>
                  <Ikon size={22} weight="fill" aria-hidden="true" />
                </span>
                <strong>{formatPersen(porsi(n, total))}</strong>
                <span className={styles.wajahJumlah}>{n} org</span>
                <span className={styles.wajahLabel}>{s.label}</span>
              </div>
            </Petunjuk>
          );
        })}
      </div>
      <BarTumpuk
        legenda={false}
        label="Rasanya bekerja 4 pekan terakhir"
        segmen={SKALA_KONDISI.map((s) => ({ kunci: String(s.nilai), label: s.label, jumlah: kondisi?.[s.nilai] || 0, warna: WARNA_KONDISI[s.nilai], panjang: s.panjang }))}
      />
    </div>
  );
}

function BlokTemuan({ kelas, Ikon, judul, isi }) {
  return (
    <div className={kelas}>
      <Ikon size={20} weight="fill" aria-label={judul} />
      <div>
        {isi.length
          ? isi.map((b) => <p key={b.label}><span>{b.label}</span> <b>{b.isi}</b></p>)
          : <p>Belum ada data.</p>}
      </div>
    </div>
  );
}

export default function SwRingkasan({ data, peran, onKeDaftar }) {
  const { lembaga, asumsi } = data;
  const unit = peran === "kepalaUnit" ? data.unit[0] || null : null;

  if (peran === "kepalaUnit" && !unit) {
    return (
      <KeadaanLayar
        jenis="kosong"
        judul={data.unitKecilMilikSendiri ? "Unit Anda belum bisa ditampilkan sendiri" : "Unit Anda tidak ditemukan"}
        pesan={data.unitKecilMilikSendiri
          ? `Pengisinya kurang dari ${asumsi.minPengisiUnit} orang, jadi hasilnya digabung ke total lembaga.`
          : "Hubungi tim Fammi agar akun Anda ditautkan ke unit yang benar."}
      />
    );
  }

  const fokus = unit || lembaga;
  const peserta = fokus.peserta;
  const nPengisi = fokus.nPengisi;
  const perAlasan = peserta.perAlasan;
  const jalur = komposisiJalur(peserta.perJalur);
  const temuan = susunTemuan(fokus, {
    temaBertahan: temaTeratas(data.tema, "bertahan"),
    temaMenguras: unit ? temaMengurasUnit(data.tema, unit.id) : temaTeratas(data.tema, "menguras"),
  });
  const terendah = subskalaTerendah(fokus);
  const alasanUrut = [...ALASAN].sort((a, b) => (perAlasan[b.kunci] || 0) - (perAlasan[a.kunci] || 0));

  return (
    <div className={styles.tab}>
      <div className={styles.baris1}>
        {/* ── Berapa orang ── */}
        <Kartu className={styles.sorot} judul="Disarankan ikut asesmen lanjutan" ikon={UsersThree}>
          <div className={styles.sorotAtas}>
            <p className={styles.angkaBesar}>
              <strong>{peserta.total}</strong>
              <span>
                pegawai<br />
                <em>{formatPersen(porsi(peserta.total, nPengisi))} dari {nPengisi}</em>
              </span>
            </p>
            <Tombol onClick={() => onKeDaftar({})}>
              Lihat daftar <ArrowRight size={16} weight="bold" aria-hidden="true" />
            </Tombol>
          </div>
          <BarTumpuk
            legenda={false}
            label="Cara masuk daftar"
            segmen={jalur.map((j) => ({ ...j, warna: WARNA_JALUR[j.kunci] }))}
          />
          <ul className={styles.jalur}>
            {jalur.map((j) => (
              <li key={j.kunci}>
                <Petunjuk teks={`${j.label}: ${j.panjang}`}>
                  <i style={{ background: WARNA_JALUR[j.kunci] }} />
                  <span>{j.pendek || j.label}</span>
                  <b>{j.jumlah}</b>
                </Petunjuk>
              </li>
            ))}
          </ul>
          <p className={styles.kalimatTetap}>{KALIMAT_JALUR}</p>
        </Kartu>

        {/* ── Kenapa ── */}
        <Kartu
          className={styles.alasan}
          judul="Alasan mereka disarankan"
          ikon={Question}
          warnaIkon="var(--fm-emas)"
          aksi={(
            <>
              <span className={styles.petunjuk}>Satu orang bisa punya beberapa alasan · sorot untuk penjelasan · klik untuk melihat orangnya</span>
              <TabelPadanan
                judul="Alasan dan cara masuk"
                kolom={["Keterangan", "Jumlah orang", "Porsi dari peserta"]}
                baris={[
                  ...ALASAN.map((a) => [a.label, perAlasan[a.kunci] || 0, formatPersen(porsi(perAlasan[a.kunci] || 0, peserta.total))]),
                  ...JALUR.map((j) => [`Cara masuk: ${j.label}`, peserta.perJalur[j.kunci] || 0, formatPersen(porsi(peserta.perJalur[j.kunci] || 0, peserta.total))]),
                ]}
              />
            </>
          )}
        >
          <ul className={styles.gridAlasan} role="list">
            {alasanUrut.map((a) => {
              const n = perAlasan[a.kunci] || 0;
              const Ikon = IKON_ALASAN[a.kunci];
              return (
                <li key={a.kunci}>
                  <Petunjuk teks={a.panjang} blok fokus={false}>
                  <button
                    type="button"
                    className={`${styles.itemAlasan} ${n === 0 ? styles.itemNol : ""}`}
                    onClick={() => onKeDaftar({ alasan: a.kunci })}
                  >
                    <span className={styles.teksAlasan}>
                      <strong>
                        <Ikon size={17} weight="duotone" aria-hidden="true" style={{ color: WARNA_ALASAN[a.kunci] }} />
                        {a.label}
                      </strong>
                      <span>{n === 0 ? penjelasNol(a.kunci, { asumsi }) : a.penjelas}</span>
                    </span>
                    <span className={styles.angkaAlasan}>
                      <strong>{n}</strong>
                      <span>{formatPersen(porsi(n, peserta.total))}</span>
                    </span>
                  </button>
                  </Petunjuk>
                </li>
              );
            })}
          </ul>
        </Kartu>
      </div>

      <div className={styles.baris2}>
        {/* ── Skor kondisi kerja ── */}
        <Kartu className={styles.skor} judul={unit ? `Skor kondisi kerja ${unit.nama}` : "Skor kondisi kerja"} ikon={Gauge}>
          <div className={styles.skorIsi}>
            <Donat nilai={fokus.indeks} asumsi={asumsi} ukuran={112} tebal={12} />
            <div className={styles.skorKanan}>
              <ChipKategori nilai={fokus.indeks} asumsi={asumsi} />
              {unit && <p>Lembaga: <b>{formatAngka(lembaga.indeks)}</b></p>}
              <p><b>{lembaga.nPengisi}</b> pegawai mengisi</p>
              <p><b>{formatPersen(porsi(lembaga.nPegawaiPengamatan, lembaga.nPengisi))}</b> juga dinilai atasan</p>
              <p><b>{lembaga.nUnit - lembaga.nUnitPengamatan}</b> dari {lembaga.nUnit} unit belum dinilai atasan</p>
            </div>
          </div>
        </Kartu>

        {/* ── Per aspek ── */}
        <Kartu
          className={styles.aspek}
          judul="Skor per aspek"
          ikon={ChartBar}
          warnaIkon="var(--fm-ungu-sedang)"
          isiClassName={styles.isiAspek}
          aksi={(
            <TabelPadanan
              judul="Skor per aspek"
              kolom={unit ? ["Aspek", "Unit", "Lembaga", "Kategori unit"] : ["Aspek", "Skor", "Kategori"]}
              baris={SUBSKALA.map((s) => (unit
                ? [s.label, formatAngka(unit.skor[s.kunci]), formatAngka(lembaga.skor[s.kunci]), kategoriKondisi(unit.skor[s.kunci], asumsi)?.label]
                : [s.label, formatAngka(lembaga.skor[s.kunci]), kategoriKondisi(lembaga.skor[s.kunci], asumsi)?.label]))}
            />
          )}
        >
          {SUBSKALA.map((s) => {
            const nilai = fokus.skor?.[s.kunci];
            const kat = kategoriKondisi(nilai, asumsi);
            return (
              <div key={s.kunci} className={`${styles.barisAspek} ${terendah === s.kunci ? styles.aspekRendah : ""}`} title={terendah === s.kunci ? "Paling rendah" : undefined}>
                <BarBaris
                  label={terendah === s.kunci ? `${s.pendek} ↓` : s.pendek}
                  petunjuk={`${s.panjang}${terendah === s.kunci ? " Ini aspek paling rendah." : ""}`}
                  ikon={IKON_ASPEK[s.kunci]}
                  nilai={nilai}
                  warna={kat?.warna}
                  penanda={unit ? lembaga.skor?.[s.kunci] : null}
                  labelPenanda="Lembaga"
                  lebarLabel="112px"
                />
              </div>
            );
          })}
        </Kartu>

        {/* ── Jawaban 4 pekan ── */}
        <Kartu
          className={styles.pekan}
          judul="Rasanya 4 pekan ini"
          ikon={Smiley}
          warnaIkon="var(--fm-emas)"
          aksi={(
            <TabelPadanan
              judul="Rasanya bekerja 4 pekan terakhir"
              kolom={["Jawaban", "Jumlah orang", "Porsi"]}
              baris={SKALA_KONDISI.map((s) => [`${s.nilai} · ${s.label}`, fokus.kondisi?.[s.nilai] || 0, formatPersen(porsi(fokus.kondisi?.[s.nilai] || 0, nPengisi))])}
            />
          )}
        >
          <SkalaWajah kondisi={fokus.kondisi} total={nPengisi} />
        </Kartu>

        {/* ── Catatan singkat ── */}
        <Kartu className={styles.temuan} judul="Catatan singkat" ikon={Lightbulb} warnaIkon="var(--fm-hijau)">
          <BlokTemuan kelas={styles.temuanBaik} Ikon={CheckCircle} judul="Sudah baik" isi={temuan.kekuatan} />
          <BlokTemuan kelas={styles.temuanPerhatian} Ikon={WarningCircle} judul="Perlu diperhatikan" isi={temuan.perhatian} />
        </Kartu>
      </div>
    </div>
  );
}
