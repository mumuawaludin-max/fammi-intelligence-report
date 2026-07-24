import {
  Armchair,
  Buildings,
  ChartLineUp,
  CheckCircle,
  ClipboardText,
  Compass,
  GraduationCap,
  Handshake,
  Lightbulb,
  Medal,
  Scales,
  Target,
  Users,
  UsersThree,
  WhatsappLogo,
  X,
} from "@phosphor-icons/react";
import tokens from "./scBudayaTokens.module.css";

/**
 * scIconBadge -- padanan IconBadge.tsx dari references/school-culture-redesign/, dipakai di
 * seluruh dashboard "Laporan Lembaga" School Culture (ketiga bagian: Budaya Kerja, Kesejahteraan
 * Tim, Profil Organisasi). SATU-SATUNYA tempat FIR memakai @phosphor-icons/react -- instruksi
 * eksplisit pemilik produk, lihat CLAUDE.md "Pengecualian yang disengaja (2)". Laporan individu
 * staf dan bagian lain FIR tetap pakai ikon emoji dari scMeta.js, JANGAN diseragamkan ke sini.
 *
 * `icon` menerima key PERSIS dari data (tipe budaya, kode subdimensi kesejahteraan, kode dimensi
 * profil organisasi, atau key section "budaya"/"kesejahteraan"/"organisasi") -- BUKAN kunci
 * Inggris generik reference (family/innovation/dst), supaya tidak ada lapisan terjemahan
 * tambahan yang bisa mismatch dengan data yang sudah ada di seluruh modul ini.
 */
const ICON_MAP = {
  // Section selector (01/02/03)
  budaya: UsersThree,
  kesejahteraan: Users,
  organisasi: Buildings,
  // Budaya Kerja (4 tipe)
  Kekeluargaan: UsersThree,
  Inovasi: Lightbulb,
  Orientasi: Compass,
  Aturan: ClipboardText,
  // Kesejahteraan Tim (5 subdimensi, kode persis data)
  kepuasan_kepemimpinan: Medal,
  kenyamanan_bekerja: Armchair,
  pengembangan_diri: GraduationCap,
  ekspektasi: CheckCircle,
  work_life_balance: Scales,
  // Profil Organisasi (6 dimensi, kode persis data)
  karakter_lembaga: Buildings,
  kepemimpinan: Compass,
  management: ClipboardText,
  sinergi: Handshake,
  fokus: Target,
  performance: ChartLineUp,
  // Generik
  target: Target,
  award: Medal,
  institution: Buildings,
  collaboration: Handshake,
  quality: ChartLineUp,
  whatsapp: WhatsappLogo,
  close: X,
};

export function ScIconBadge({ icon, size = "md", tone = "purple", className = "" }) {
  const Icon = ICON_MAP[icon] || Target;
  const sizePx = size === "sm" ? 44 : size === "lg" ? 72 : 58;
  const radius = size === "sm" ? 12 : size === "lg" ? 18 : 14;

  return (
    <span
      className={`${tokens.scope} ${className}`}
      aria-hidden="true"
      style={{
        display: "inline-grid",
        flex: "0 0 auto",
        placeItems: "center",
        width: sizePx,
        height: sizePx,
        borderRadius: radius,
        color: tone === "gold" ? "var(--sc-gold)" : tone === "whatsapp" ? "#25D366" : tone === "plain" ? "currentColor" : "var(--sc-primary)",
        background: tone === "gold" ? "var(--sc-gold-soft)" : tone === "whatsapp" ? "#E7F8EF" : tone === "plain" ? "transparent" : "var(--sc-soft)",
      }}
    >
      <Icon weight="duotone" style={{ width: "52%", height: "52%" }} />
    </span>
  );
}
