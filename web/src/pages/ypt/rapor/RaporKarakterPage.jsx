import { useYptKarakter } from "./useYptKarakter";
import { statusPanel } from "../components/Bits";
import RangkumanTab from "./RangkumanTab";
import PerJenjangTab from "./PerJenjangTab";
import PerKarakterTab from "./PerKarakterTab";
import PerSekolahTab from "./PerSekolahTab";

/**
 * Menu Rapor Karakter dashboard YPT. Satu hook data dipakai keempat tab (data sudah ditarik penuh
 * sekali), jadi berpindah tab tidak memicu fetch ulang.
 */
export default function RaporKarakterPage({ session, periode, tab, onTabChange }) {
  const { loading, error, data } = useYptKarakter(session, periode);

  const status = statusPanel({
    loading,
    error,
    kosong: !loading && !error && (!data || data.totalYayasan == null),
    judul: "Belum ada data Rapor Karakter",
    pesan: "Belum ada hasil karakter yang diimpor untuk sekolah-sekolah Telkom pada periode ini.",
  });
  if (status) return status;

  switch (tab) {
    case "jenjang":
      return <PerJenjangTab data={data} />;
    case "karakter":
      return <PerKarakterTab data={data} />;
    case "sekolah":
      return <PerSekolahTab data={data} />;
    default:
      return <RangkumanTab data={data} onLihatSekolah={() => onTabChange("sekolah")} />;
  }
}
