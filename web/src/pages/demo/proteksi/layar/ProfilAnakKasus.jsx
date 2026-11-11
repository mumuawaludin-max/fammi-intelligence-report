import { useState } from "react";
import { useProteksi } from "../konteks";
import { Ikon, KepalaKartu, Segmen } from "../komponen";
import { ALUR } from "../bersama/alur";
import { CHECKLIST } from "../bersama/tindakLanjut";
import { IKON_RIWAYAT, KASUS_RAKA, RIWAYAT_RINGKAS } from "./profilAnakData";

const K = KASUS_RAKA;

/** Butir checklist respon pertama kasus ini (penugasan wali kelas), dibaca untuk kotak SLA. */
const BUTIR_RESPON = CHECKLIST.find((c) => c.kasus === K.id && c.oleh === "walas");

/**
 * Kartu bertab "Kasus KS-015" dan "Riwayat". Tab kasus meringkas laporan, SLA respon pertama, dan
 * posisinya di alur kejadian; detail lengkap ada di layar Kasus & penugasan. Riwayat menampilkan
 * empat entri terbaru dulu. `tab` dipegang layar supaya simpan observasi bisa langsung membuka Riwayat.
 */
export default function ProfilAnakKasus({ tab, onTab, riwayat }) {
  const { pindah, centang } = useProteksi();
  const [semua, setSemua] = useState(false);
  const responBeres = BUTIR_RESPON ? (centang[BUTIR_RESPON.id] ?? BUTIR_RESPON.selesai) : false;
  const tampil = semua ? riwayat : riwayat.slice(0, RIWAYAT_RINGKAS);

  return (
    <section className="card tcard ksr" aria-label="Kasus dan riwayat Raka">
      <div className="tophead">
        <KepalaKartu ikon={tab === "kasus" ? "tiket" : "riwayat"} nada={tab === "kasus" ? "red" : "p"} judul="Kasus & riwayat" />
        <Segmen
          label="Pilih isi kartu"
          pilihan={[
            { id: "kasus", label: `Kasus ${K.id}` },
            { id: "riwayat", label: `Riwayat (${riwayat.length})` },
          ]}
          nilai={tab}
          onPilih={onTab}
        />
      </div>

      {tab === "kasus" ? (
        <div className="ksisi">
          <div className="ksatas">
            <div className="ksjudul">
              <span className="pill sm bad">{K.tingkat}</span>
              <b>{K.judul}</b>
            </div>
            <button type="button" className="ghost sm" onClick={() => pindah("kasus", { jenis: "kasus", id: K.id })}>
              Buka di Kasus &amp; penugasan
              <Ikon nama="kanan" size={16} />
            </button>
          </div>
          <p className="ksket">
            {K.kategori} · {K.ket}
          </p>

          <div className={`kssla${responBeres ? " beres" : ""}`}>
            {responBeres ? (
              <p>
                <b>{K.sla.label} tercatat, tepat waktu.</b>
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
                <span className="kssbatang" aria-hidden="true">
                  <span style={{ width: `${K.sla.persen}%` }} />
                </span>
              </>
            )}
          </div>

          <ol className="kstahap" aria-label="Posisi kasus di alur kejadian">
            {ALUR.kejadian.langkah.map((l, i) => {
              const t = K.tahap[l.id];
              const status = t?.status ?? "nanti";
              const ket = responBeres && t?.ketSesudahRespon ? t.ketSesudahRespon : t?.ket;
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
        </div>
      ) : (
        <div className="rwisi">
          <ol className="rwdaftar">
            {tampil.map((e) => (
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
          {riwayat.length > RIWAYAT_RINGKAS && (
            <button type="button" className="ghost sm rwsemua" aria-expanded={semua} onClick={() => setSemua((s) => !s)}>
              {semua ? "Tampilkan lebih sedikit" : `Tampilkan semua (${riwayat.length})`}
              <Ikon nama="turun" size={16} className={semua ? "rwputar" : undefined} />
            </button>
          )}
        </div>
      )}
    </section>
  );
}
