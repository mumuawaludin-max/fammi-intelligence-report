// Profil singkat satu pegawai untuk Human Capital, dibuka dari daftar Top 5, dialog daftar, atau
// titik sebaran. Isinya angka saja (skor, enam aspek, enam dimensi kepuasan, pilihan ganda).
// Narasi pribadi dan respons cerita sengaja tidak ditampilkan: keduanya milik pegawai itu.

import { LockKey } from "@phosphor-icons/react";
import { ASPEK, DIMENSI_KEPUASAN, PERTANYAAN_PILIHAN, infoKategoriProtek, infoKepuasan3, infoKepuasan5 } from "./lib/waMeta";
import { formatAngka, formatPersen, pisahPilihan } from "./lib/waAturan";
import { IKON_DIMENSI } from "./waIkon";
import { AngkaHitung, Bar, Bertahap, Bintang, Chip, Dialog, Donat, Muncul } from "./WaUi";
import t from "./WaTab.module.css";

export default function WaProfilDialog({ orang, onTutup }) {
  const o = orang;
  const kat = o ? infoKategoriProtek(o.protek.kategori) : null;
  const kep = o ? infoKepuasan3(o.kepuasan.kategori3) : null;
  return (
    <Dialog
      buka={Boolean(o)}
      onTutup={onTutup}
      lebar="lebar"
      judul={o?.nama}
      keterangan={o ? [o.jabatan, o.unit, o.usia ? `${o.usia} tahun` : null].filter(Boolean).join(" · ") : ""}
    >
      {o && (
        <Bertahap className={t.profil} jeda={0.05}>
          <div className={t.profilAtas}>
            <Muncul className={t.profilSkor}>
              <Donat nilai={o.protek.pct} ukuran={96} tebal={14} warna="var(--fm-ungu-tua)" jalur="var(--wa-ungu-lembut)" label={`Skor wellbeing ${formatPersen(o.protek.pct, 1)}`} />
              <div>
                <p className={t.profilLabel}>Skor wellbeing</p>
                <AngkaHitung nilai={o.protek.pct} digit={1} akhiran="%" className={t.profilAngka} />
                {kat && <Chip warna={kat.warna} teks={kat.teks}>{kat.label}</Chip>}
              </div>
            </Muncul>
            <Muncul className={t.profilSkor}>
              <div>
                <p className={t.profilLabel}>Kepuasan kerja</p>
                <span className={t.profilAngka}><AngkaHitung nilai={o.kepuasan.rata} digit={2} /> / 5</span>
                <Bintang nilai={o.kepuasan.rata} ukuran={20} />
                {kep && <div className={t.profilChip}><Chip warna={kep.warna} teks={kep.teks}>{kep.label}</Chip></div>}
              </div>
            </Muncul>
          </div>

          <div className={t.profilDua}>
            <Muncul>
              <h4 className={t.profilSub}>Enam aspek</h4>
              {ASPEK.map((a, i) => {
                const v = o.protek.aspek[a.kunci];
                const k = infoKategoriProtek(v.kategori);
                return (
                  <div key={a.kunci} className={t.profilBaris}>
                    <span className={t.profilHuruf}>{a.huruf}</span>
                    <span className={t.profilNama}>{a.label}</span>
                    <Bar pct={v.pct} warna={v.kategori === "baik" ? "var(--fm-ungu-sedang)" : (k?.warna || "var(--fm-jingga)")} tunda={0.1 + i * 0.05} />
                    <b>{formatPersen(v.pct)}</b>
                  </div>
                );
              })}
            </Muncul>
            <Muncul>
              <h4 className={t.profilSub}>Enam dimensi kepuasan</h4>
              {DIMENSI_KEPUASAN.map((d, i) => {
                const v = o.kepuasan.dimensi[d.kunci];
                const Ikon = IKON_DIMENSI[d.kunci];
                const k = infoKepuasan5(v.kategori);
                return (
                  <div key={d.kunci} className={t.profilBaris} title={k?.label}>
                    <span className={t.profilHuruf}><Ikon size={14} weight="fill" /></span>
                    <span className={t.profilNama}>{d.label}</span>
                    <Bar pct={(v.rata / 5) * 100} warna={k?.warna || "var(--fm-hijau)"} tunda={0.1 + i * 0.05} />
                    <b>{formatAngka(v.rata, 1)}</b>
                  </div>
                );
              })}
            </Muncul>
          </div>

          <Muncul>
            <h4 className={t.profilSub}>Pilihan di survei</h4>
            <div className={t.profilPilihan}>
              {PERTANYAAN_PILIHAN.map((p) => {
                const { utama, netral } = pisahPilihan(o.pilihan[p.kode] || []);
                const isi = [...utama, ...netral];
                return (
                  <div key={p.kode} className={t.profilPilihanKartu} style={{ "--w": p.warna }}>
                    <span>{p.judul.replace(/ pegawai$/, "")}</span>
                    <p>{isi.length ? isi.join(", ") : "-"}</p>
                  </div>
                );
              })}
            </div>
          </Muncul>

          <Muncul className={t.profilCatatan}>
            <LockKey size={16} weight="fill" aria-hidden="true" />
            Narasi pribadi dan jawaban atas cerita pegawai hanya tampil di laporan pegawai itu sendiri.
          </Muncul>
        </Bertahap>
      )}
    </Dialog>
  );
}
