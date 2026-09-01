import WaliKelasView from "./WaliKelasView";
import KepsekView from "./KepsekView";
import YayasanView from "./YayasanView";
import styles from "./KarakterViews.module.css";

/**
 * KarakterPage — satu pintu masuk modul Rapor Karakter.
 * Mesin tampilannya satu, yang beda per peran cuma scope query
 * (lihat useKarakterData.js): Wali Kelas → kelasnya, Kepala Sekolah →
 * sekolahnya, Yayasan → sekolah-sekolah di bawah yayasan_id-nya.
 */
export default function KarakterPage({ session, periodeId, pekan = null }) {
  switch (session.peran) {
    case "WaliKelas":
      return <WaliKelasView session={session} periodeId={periodeId} pekan={pekan} />;
    case "KepalaSekolah":
    case "WakilKepalaSekolah":
    case "AdminFammi":
      return <KepsekView session={session} periodeId={periodeId} pekan={pekan} />;
    case "Yayasan":
      return <YayasanView session={session} periodeId={periodeId} />;
    default:
      return (
        <p className={styles.emptyNote}>
          Tampilan Rapor Karakter untuk peran "{session.peran}" belum tersedia.
        </p>
      );
  }
}
