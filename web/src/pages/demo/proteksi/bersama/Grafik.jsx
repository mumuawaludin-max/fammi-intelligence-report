import { useHitung } from "./grafikAlat";
import s from "./grafik.module.css";

/**
 * Grafik kecil beranimasi untuk prototipe Sekolah Proteksi, SVG/CSS sendiri tanpa pustaka grafik:
 *   Donat         sebaran beberapa bagian dengan angka di tengah (status anak, tingkat kasus)
 *   Cincin        satu nilai dari total (kemajuan skrining, checklist)
 *   BatangTumpuk  baris batang bertumpuk per kategori (status per aspek HEART)
 *   KolomKelas    kolom bertumpuk per kelas, bisa diklik untuk menyaring
 *   Legenda       titik warna, label, dan angka
 * Warna wajib token --sp-* (lihat WARNA_STATUS). Semua gerak dimatikan bila pengguna memilih gerak
 * dikurangi. Angka contoh untuk demonstrasi.
 */

/** Angka count-up, dipakai di dalam teks. */
export function Hitung({ nilai, akhiran = "" }) {
  const n = useHitung(nilai);
  return (
    <>
      {n}
      {akhiran}
    </>
  );
}

/**
 * Donat: `data` = [{ id, label, nilai, warna }]. `tengah` = angka besar di tengah (default jumlah),
 * `sub` = keterangan di bawahnya. Busur tumbuh berurutan saat tampil.
 */
export function Donat({ data, tengah, sub, ukuran = 148, tebal = 18, label }) {
  const total = data.reduce((n, d) => n + d.nilai, 0) || 1;
  const r = 50 - tebal / 2;
  const keliling = 2 * Math.PI * r;
  const celah = data.filter((d) => d.nilai > 0).length > 1 ? 1.2 : 0;
  // Titik mulai tiap busur = jumlah busur sebelumnya, dihitung sebelum render.
  const mulai = data.map((_, i) => data.slice(0, i).reduce((n, x) => n + (x.nilai / total) * keliling, 0));
  const angka = useHitung(tengah ?? total);
  return (
    <div className={s.donat} style={{ width: ukuran, height: ukuran }}>
      <svg
        viewBox="0 0 100 100"
        width={ukuran}
        height={ukuran}
        role="img"
        aria-label={label || data.map((d) => `${d.label} ${d.nilai}`).join(", ")}
      >
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--sp-abu-2)" strokeWidth={tebal} />
        {data.map((d, i) => {
          if (!d.nilai) return null;
          const panjang = Math.max(0, (d.nilai / total) * keliling - celah);
          return (
            <circle
              key={d.id || d.label}
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke={d.warna}
              strokeWidth={tebal}
              strokeDasharray={`${panjang} ${keliling}`}
              strokeDashoffset={-mulai[i]}
              transform="rotate(-90 50 50)"
              className={s.busur}
              style={{ "--panjang": panjang, "--urut": i }}
            />
          );
        })}
      </svg>
      <div className={s.donatTengah} aria-hidden="true">
        <b>{angka}</b>
        {sub ? <span>{sub}</span> : null}
      </div>
    </div>
  );
}

/** Cincin kemajuan: `nilai` dari `dari`, angka persen di tengah. */
export function Cincin({ nilai, dari, warna = "var(--sp-ungu)", ukuran = 120, tebal = 12, sub, label }) {
  const persen = dari ? Math.round((nilai / dari) * 100) : 0;
  const r = 50 - tebal / 2;
  const keliling = 2 * Math.PI * r;
  const panjang = (persen / 100) * keliling;
  const angka = useHitung(persen);
  return (
    <div className={s.donat} style={{ width: ukuran, height: ukuran }}>
      <svg viewBox="0 0 100 100" width={ukuran} height={ukuran} role="img" aria-label={label || `${nilai} dari ${dari}, ${persen}%`}>
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--sp-abu-2)" strokeWidth={tebal} />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={warna}
          strokeWidth={tebal}
          strokeLinecap="round"
          strokeDasharray={`${panjang} ${keliling}`}
          transform="rotate(-90 50 50)"
          className={s.busur}
          style={{ "--panjang": panjang, "--urut": 0 }}
        />
      </svg>
      <div className={s.donatTengah} aria-hidden="true">
        <b>{angka}%</b>
        {sub ? <span>{sub}</span> : null}
      </div>
    </div>
  );
}

/** Legenda: titik warna, label, angka. `data` sama dengan Donat. */
export function Legenda({ data, kolom = false }) {
  return (
    <ul className={`${s.legenda} ${kolom ? s.legendaKolom : ""}`}>
      {data.map((d) => (
        <li key={d.id || d.label}>
          <span className={s.titik} style={{ background: d.warna }} aria-hidden="true" />
          <span className={s.legLabel}>{d.label}</span>
          <b>{d.nilai}</b>
        </li>
      ))}
    </ul>
  );
}

/**
 * Baris batang bertumpuk: `baris` = [{ id, label, kiri?, bagian: [{ id, nilai, warna, label }] }].
 * Lebar penuh = jumlah bagian baris itu. `kanan` (opsional) = teks ringkas di ujung kanan baris.
 * `ringkas` menaruh label di atas batang, untuk kartu yang sempit. `maks` (opsional) membuat
 * panjang batang sebanding antarbaris: baris dengan jumlah `maks` penuh, yang lain lebih pendek.
 */
export function BatangTumpuk({ baris, onPilih, terpilih, ringkas = false, maks }) {
  return (
    <ul className={`${s.tumpuk} ${ringkas ? s.ringkas : ""}`}>
      {baris.map((b, i) => {
        const total = b.bagian.reduce((n, x) => n + x.nilai, 0) || 1;
        const isi = (
          <>
            <span className={s.tumpukLabel}>
              {b.kiri}
              <span>{b.label}</span>
            </span>
            <span
              className={s.tumpukBatang}
              role="img"
              aria-label={`${b.label}: ${b.bagian.map((x) => `${x.label} ${x.nilai}`).join(", ")}`}
            >
              <span className={s.tumpukIsi} style={{ width: maks ? `${(total / maks) * 100}%` : "100%" }}>
                {b.bagian.map((x) =>
                  x.nilai ? (
                    <span
                      key={x.id}
                      className={s.tumpukRuas}
                      style={{ width: `${(x.nilai / total) * 100}%`, background: x.warna, "--urut": i }}
                    />
                  ) : null,
                )}
              </span>
            </span>
            {b.kanan ? <span className={s.tumpukKanan}>{b.kanan}</span> : null}
          </>
        );
        return (
          <li key={b.id}>
            {onPilih ? (
              <button
                type="button"
                className={`${s.tumpukBaris} ${s.tumpukTombol} ${terpilih === b.id ? s.terpilih : ""}`}
                aria-pressed={terpilih === b.id}
                onClick={() => onPilih(b.id)}
              >
                {isi}
              </button>
            ) : (
              <div className={s.tumpukBaris}>{isi}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Kolom bertumpuk per kelas: `kolom` = [{ id, label, bagian: [{ id, nilai, warna, label }], atas }].
 * Tinggi kolom sebanding jumlah bagiannya terhadap kolom tertinggi; `atas` = angka di atas kolom.
 * `onPilih(id)` membuat kolom bisa diklik (menyaring kelas).
 */
export function KolomKelas({ kolom, onPilih, terpilih, tinggi = 140 }) {
  const maks = Math.max(1, ...kolom.map((k) => k.bagian.reduce((n, x) => n + x.nilai, 0)));
  return (
    <div className={s.kolomWadah} style={{ "--tinggi": `${tinggi}px` }}>
      {kolom.map((k, i) => {
        const jumlah = k.bagian.reduce((n, x) => n + x.nilai, 0);
        const label = `${k.label}: ${k.bagian.map((x) => `${x.label} ${x.nilai}`).join(", ")}`;
        const isi = (
          <>
            <span className={s.kolomAtas}>{k.atas ?? jumlah}</span>
            <span className={s.kolomBatang} style={{ height: `${(jumlah / maks) * 100}%`, "--urut": i }}>
              {k.bagian.map((x) =>
                x.nilai ? <span key={x.id} style={{ flexGrow: x.nilai, background: x.warna }} /> : null,
              )}
            </span>
            <span className={s.kolomLabel}>{k.label}</span>
          </>
        );
        return onPilih ? (
          <button
            key={k.id}
            type="button"
            className={`${s.kolom} ${s.kolomTombol} ${terpilih === k.id ? s.terpilih : ""}`}
            aria-label={label}
            aria-pressed={terpilih === k.id}
            onClick={() => onPilih(k.id)}
          >
            {isi}
          </button>
        ) : (
          <div key={k.id} className={s.kolom} role="img" aria-label={label}>
            {isi}
          </div>
        );
      })}
    </div>
  );
}
