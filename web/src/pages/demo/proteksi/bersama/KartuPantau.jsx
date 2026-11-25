import { useState } from "react";
import { cariAspek, statusDariSkor } from "./heart";
import { JAWABAN_PANTAU, perkembangan } from "./pantau";
import { PilStatus } from "./HeartKecil";
import s from "./pantau.module.css";

const NADA = { baik: "var(--sp-hijau-batang)", perhatian: "var(--sp-jingga)", waspada: "var(--sp-merah-teks)" };

/** Kalimat delta menurut sudut pandang. `p` = hasil perkembangan(). */
const KALIMAT = {
  ortu: {
    membaik: (p) => `Membaik ${p.selisih} poin sejak screening`,
    tetap: () => "Belum berubah sejak screening",
    memburuk: (p) => `Naik ${-p.selisih} poin sejak screening`,
    baik: "Sudah masuk Aman. Pertahankan.",
  },
  remaja: {
    membaik: (p) => `Membaik ${p.selisih} poin. Lanjutin.`,
    tetap: () => "Masih sama. Pelan-pelan aja.",
    memburuk: (p) => `Naik ${-p.selisih} poin. Kalau berat, lapor aja.`,
    baik: "Udah masuk Aman. Pertahanin.",
  },
};

/**
 * Kartu perkembangan satu aspek sesudah skrining: grafik garis skor (skrining lalu cek mingguan),
 * kalimat delta, status sekarang, dan cek minggu ini (satu pertanyaan, tiga jawaban). `riwayat`
 * dipegang induk; `onJawab(indeks)` menambah titik baru. `sudahCek` mengunci cek sesudah dijawab.
 * `suara` = "ortu" atau "remaja" (gaya kalimat). Tanpa `onJawab` kartu hanya dibaca (sisi sekolah).
 * Skor makin rendah makin baik.
 */
export function KartuPantau({ idAspek, tanya, riwayat, onJawab, sudahCek, suara = "ortu", children }) {
  const [buka, setBuka] = useState(false);
  const aspek = cariAspek(idAspek);
  const p = perkembangan(idAspek, riwayat);
  const k = KALIMAT[suara];
  const kalimat = p.statusSekarang === "baik" && p.statusAwal !== "baik" ? k.baik : k[p.arah](p);

  // Grafik: x merata, y dari skor (0 di bawah, 10 di atas) di kotak 280 x 96.
  const L = 280;
  const T = 96;
  const kiri = 18;
  const kanan = L - 18;
  const xs = riwayat.map((_, i) => (riwayat.length === 1 ? L / 2 : kiri + (i * (kanan - kiri)) / (riwayat.length - 1)));
  const ys = riwayat.map((r) => 14 + ((10 - r.skor) / 10) * (T - 34));
  const garis = xs.map((x, i) => `${x},${ys[i]}`).join(" ");
  const ambangY = 14 + ((10 - aspek.ambang.perhatian) / 10) * (T - 34);

  return (
    <section className={s.kartu} aria-label={`Perkembangan ${aspek.nama}`}>
      <div className={s.kepala}>
        <span className={s.huruf} aria-hidden="true">
          {aspek.kode}
        </span>
        <div className={s.judul}>
          <b>{aspek.nama}</b>
          <span className={`${s.delta} ${s[p.arah]}`}>{kalimat}</span>
        </div>
        <PilStatus status={p.statusSekarang} kecil />
      </div>

      <svg
        viewBox={`0 0 ${L} ${T}`}
        className={s.grafik}
        role="img"
        aria-label={`Skor ${aspek.nama}: ${riwayat.map((r) => `${r.label} ${r.skor}`).join(", ")}. Makin rendah makin baik.`}
      >
        <rect x="0" y={ambangY} width={L} height={T - 20 - ambangY} className={s.zonaBaik} />
        <polyline points={garis} className={s.garis} pathLength="1" />
        {riwayat.map((r, i) => {
          const st = statusDariSkor(aspek, r.skor);
          return (
            <g key={`${r.label}-${i}`} className={s.titik} style={{ "--urut": i }}>
              <circle cx={xs[i]} cy={ys[i]} r="6" fill={NADA[st]} />
              <text x={xs[i]} y={ys[i] - 10} textAnchor="middle" className={s.angka}>
                {r.skor}
              </text>
              <text x={xs[i]} y={T - 4} textAnchor="middle" className={s.tanggal}>
                {r.tanggal}
              </text>
            </g>
          );
        })}
      </svg>
      <p className={s.catatan}>Area hijau = Aman. Makin turun, makin baik.</p>

      {children}

      {!onJawab ? null : sudahCek ? (
        <p className={s.selesai}>{suara === "remaja" ? "Cek minggu ini udah tercatat." : "Cek minggu ini sudah tercatat."}</p>
      ) : buka ? (
        <div className={s.tanya}>
          <p>{tanya}</p>
          <div className={s.pilihan} role="group" aria-label={tanya}>
            {JAWABAN_PANTAU.map((j, i) => (
              <button
                key={j}
                type="button"
                onClick={() => {
                  onJawab(i);
                  setBuka(false);
                }}
              >
                {j}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <button type="button" className={s.tombol} onClick={() => setBuka(true)}>
          {suara === "remaja" ? "Cek minggu ini" : "Isi cek minggu ini"}
        </button>
      )}
    </section>
  );
}
