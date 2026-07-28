import SampleTag from "../../components/SampleTag";
import PaLaporanPageMock from "./PaLaporanPageMock";

/**
 * PaAgregatPreview -- preview lepas-login untuk PaLaporanPageMock dengan data contoh
 * (pa.mock.js), dibuka lewat http://localhost:5173/?preview=pa-agregat
 *
 * Beda dari preview "pa" (PaPreview.jsx, lewat PaPage+session palsu -> data ASLI Supabase,
 * kosong kalau belum ada impor): preview ini murni QA visual komponen tampilan dengan data
 * karangan yang selalu ada, pola sama dengan sc/ScAgregatPreview.jsx vs sc/ScPagePreview.jsx.
 * BUKAN bagian dari alur produk -- jangan link-kan dari navigasi mana pun.
 */
export default function PaAgregatPreview() {
  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 20px 0" }}>
      <p style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 800, margin: "0 0 6px", color: "#211c2d" }}>
        PA Laporan Agregat Preview
      </p>
      <p style={{ fontFamily: "var(--font-body)", fontSize: 13.5, color: "#675f71", margin: "0 0 12px", maxWidth: 640, lineHeight: 1.5 }}>
        Data dummy dari pa.mock.js (paLaporanContoh). Halaman ini cuma untuk QA visual komponen
        tampilan, tidak dipakai di produk.
      </p>
      <SampleTag />
      <PaLaporanPageMock />
    </div>
  );
}
