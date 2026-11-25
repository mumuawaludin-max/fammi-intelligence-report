import { useState } from "react";
import { useProteksi } from "../konteks";
import { Ikon, KepalaLaci, Laci } from "../komponen";
import { ALUR } from "../bersama/alur";
import { CHECKLIST } from "../bersama/tindakLanjut";
import { IKON_RIWAYAT, KASUS_RAKA } from "./profilAnakData";

const K = KASUS_RAKA;

/** Butir checklist tanggapan pertama kasus ini (tugas wali kelas), dibaca untuk batas waktunya. */
const BUTIR_TANGGAPAN = CHECKLIST.find((c) => c.kasus === K.id && c.oleh === "walas");

/** Sudah ditanggapi? Mengikuti centang butir tanggapan pertama di konteks prototipe. */
function useSudahDitanggapi() {
  const { centang } = useProteksi();
  return BUTIR_TANGGAPAN ? (centang[BUTIR_TANGGAPAN.id] ?? BUTIR_TANGGAPAN.selesai) : false;
}

/**
 * Kasus aktif Raka di kartu "Yang perlu dilakukan": satu baris berisi tingkat, judul, dan sisa batas
 * waktu tanggapan pertama. Posisi kasus di alur kejadian dan kasus sebelumnya ada di laci; detail
 * lengkap di layar Kasus.
 */
export function KasusAktif() {
  const { pindah } = useProteksi();
  const [laci, setLaci] = useState(false);
  const sudah = useSudahDitanggapi();

  return (
    <div className="ksbaris">
      <span className="tile red" aria-hidden="true">
        <Ikon nama="tiket" size={19} />
      </span>
      <div className="ksbarisisi">
        <p className="ksjudul">
          <span className="pill sm bad">{K.tingkat}</span>
          <b>
            Kasus {K.id}: {K.judul}
          </b>
        </p>
        <p className="ksket">
          {sudah ? `${K.sla.label} sudah tercatat, tepat waktu.` : `${K.sla.label}: ${K.sla.sisa} · ${K.sla.batas}`}
        </p>
      </div>
      <button type="button" className="ghost sm" aria-haspopup="dialog" onClick={() => setLaci(true)}>
        Lihat kasus
        <Ikon nama="kanan" size={16} />
      </button>

      {laci && (
        <Laci label={`Kasus ${K.id}`} labelTutup="Tutup kasus" lebar={560} className="lacikasus" onTutup={() => setLaci(false)}>
          <KepalaLaci
            awal={
              <div className="tile red">
                <Ikon nama="tiket" size={22} />
              </div>
            }
            judul={`Kasus ${K.id}`}
            sub={K.judul}
            onTutup={() => setLaci(false)}
          />
          <p className="ksjudul">
            <span className="pill sm bad">{K.tingkat}</span>
            <span className="ksket">
              {K.kategori} · {K.ket}
            </span>
          </p>

          <div className="kswaktu">
            {sudah ? (
              <p>
                <b>{K.sla.label} sudah tercatat, tepat waktu.</b>
                <span>{K.sla.sesudah}</span>
              </p>
            ) : (
              <>
                <p>
                  <b>
                    {K.sla.label}: {K.sla.sisa}
                  </b>
                  <span>{K.sla.batas}</span>
                </p>
                <span className="kswbatang" aria-hidden="true">
                  <span style={{ width: `${K.sla.persen}%` }} />
                </span>
              </>
            )}
          </div>

          <ol className="kstahap" aria-label="Posisi kasus di alur kejadian">
            {ALUR.kejadian.langkah.map((l, i) => {
              const t = K.tahap[l.id];
              const status = t?.status ?? "nanti";
              const ket = sudah && t?.ketSesudahTanggapan ? t.ketSesudahTanggapan : t?.ket;
              return (
                <li key={l.id} className={`kst ${status}`} aria-current={status === "aktif" ? "step" : undefined}>
                  <span className="kstno" aria-hidden="true">
                    {status === "selesai" ? <Ikon nama="centang" size={13} /> : i + 1}
                  </span>
                  <span className="kstteks">
                    <b>{l.label}</b>
                    {ket && <span>{ket}</span>}
                  </span>
                </li>
              );
            })}
          </ol>
          <p className="ksnote">{K.sebelumnya}</p>

          <div className="dacts">
            <button type="button" className="btnp" onClick={() => pindah("kasus", { jenis: "kasus", id: K.id })}>
              Buka di layar Kasus
              <Ikon nama="kanan" size={16} />
            </button>
          </div>
        </Laci>
      )}
    </div>
  );
}

/**
 * Baris "Riwayat" di menu bawah Laporan anak: catatan terbaru sebagai cuplikan, seluruh riwayat
 * (skrining, pengamatan, tindak lanjut, kasus, kontak orang tua) terbuka di laci.
 */
export function RiwayatAnak({ riwayat }) {
  const [laci, setLaci] = useState(false);
  const terbaru = riwayat[0];

  return (
    <li>
      <button type="button" className="pmbaris" aria-haspopup="dialog" onClick={() => setLaci(true)}>
        <span className="tile p" aria-hidden="true">
          <Ikon nama="riwayat" size={19} />
        </span>
        <span className="pmteks">
          <b>Riwayat</b>
          <span>
            {riwayat.length} catatan · Terakhir {terbaru.d}: {terbaru.t}
          </span>
        </span>
        <Ikon nama="kanan" size={18} className="pmpanah" />
      </button>

      {laci && (
        <Laci label="Riwayat Raka" labelTutup="Tutup riwayat" lebar={560} className="laciriwayat" onTutup={() => setLaci(false)}>
          <KepalaLaci
            awal={
              <div className="tile p">
                <Ikon nama="riwayat" size={22} />
              </div>
            }
            judul="Riwayat Raka"
            sub={`${riwayat.length} catatan, terbaru di atas.`}
            onTutup={() => setLaci(false)}
          />
          <ol className="rwdaftar">
            {riwayat.map((e) => (
              <li key={e.id} className="rwi">
                <span className="rwtgl">{e.d}</span>
                <span className={`rwikon ${e.jenis}`} aria-hidden="true">
                  <Ikon nama={IKON_RIWAYAT[e.jenis]} size={15} />
                </span>
                <span className="rwteks">
                  <b>{e.t}</b>
                  {e.x}
                </span>
              </li>
            ))}
          </ol>
        </Laci>
      )}
    </li>
  );
}
