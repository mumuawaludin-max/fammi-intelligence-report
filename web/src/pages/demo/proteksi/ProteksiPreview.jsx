import { useEffect, useState } from "react";
import { MotionConfig } from "motion/react";
import DemoBeranda from "../DemoBeranda";
import DemoReportViewer from "../DemoReportViewer";
import { DEMO_SYSTEM_IDS, cariTampilan } from "../demoSystems";

// Sesi demo palsu, HANYA untuk pratinjau dev server (main.jsx memasangnya di balik
// import.meta.env.DEV). Di produksi prototipe ini cuma terbuka lewat kode demo yang sah.
const SESI_PRATINJAU = {
  availableSystems: DEMO_SYSTEM_IDS,
  htmlReports: [],
  expiresAt: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
};

const tanpaAksi = () => {};

function idPrototipe(id) {
  return cariTampilan(id)?.jenis === "prototipe" ? id : null;
}

/**
 * Pratinjau QA Sekolah Proteksi memakai layar demo dan penampil demo yang sungguhan:
 *   ?preview=demo-proteksi                         -> layar demo (ubin Safety dengan empat tombol)
 *   ?preview=demo-proteksi&tampilan=proteksi-bk    -> langsung membuka satu sudut pandang
 *   ...&layar=skrining                             -> membuka layar lain dari prototipe itu (QA)
 *   ...&klik=Lapor%20kejadian                      -> menekan tombol berteks/berlabel itu sesudah
 *                                                     dimuat, mis. untuk memotret laci yang terbuka
 * Tombol tampilan lain (akun, HTML) hanya dicatat di konsol karena butuh server.
 */
export default function ProteksiPreview() {
  const parameter = new URLSearchParams(window.location.search);
  const [tampilanId, setTampilanId] = useState(() => idPrototipe(parameter.get("tampilan")));
  const [fokus, setFokus] = useState(null);
  const [layarQa] = useState(() => parameter.get("layar"));
  const [klikQa] = useState(() => parameter.get("klik"));

  useEffect(() => {
    if (!klikQa) return undefined;
    let sisa = 60;
    const timer = window.setInterval(() => {
      const tombol = [...document.querySelectorAll("button")].find(
        (b) => b.textContent.trim() === klikQa || b.getAttribute("aria-label") === klikQa,
      );
      if (tombol) tombol.click();
      if (tombol || --sisa <= 0) window.clearInterval(timer);
    }, 250);
    return () => window.clearInterval(timer);
  }, [klikQa]);

  return (
    <MotionConfig reducedMotion="user">
      {tampilanId ? (
        <DemoReportViewer
          tampilanId={tampilanId}
          layarAwal={layarQa}
          sesi={SESI_PRATINJAU}
          onKembali={() => {
            setFokus(tampilanId);
            setTampilanId(null);
          }}
          ambilLaporanHtml={async () => ({ status: "not_found" })}
          onSesiMati={tanpaAksi}
        />
      ) : (
        <DemoBeranda
          sesi={SESI_PRATINJAU}
          pesan={null}
          membuka={null}
          galatTampilan={null}
          fokusTampilan={fokus}
          onFokusSelesai={() => setFokus(null)}
          onBukaTampilan={(id) => {
            if (idPrototipe(id)) setTampilanId(id);
            else console.info(`[pratinjau] tampilan ${id} butuh server, tidak dibuka di pratinjau`);
          }}
          onAkhiriDemo={tanpaAksi}
          onKeMasuk={tanpaAksi}
          onTutupGalat={tanpaAksi}
          onTutupPesan={tanpaAksi}
        />
      )}
    </MotionConfig>
  );
}
